import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res, next) => {
  // get user details from frontend
  const { email, password, fullname, username } = req.body;
  // validation: not empty
  if (
    [fullname, email, password, username].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All filed are required!");
  }
  // checking if user already exists:username & email
  const existedUser=User.findOne({
    $or:[{username},{email}]
  })
  if(existedUser){
    throw new ApiError(409,"User with Username or email already exists!")
  }
  // checking for image,  checking for avatar
  const avatarLocalPath=req.files?.avatar[0].path;
  const coverImageLocalPath=req.files?.coverImage[0].path;

  if (!avatarLocalPath) {
    throw new ApiError(400,"Avatar file is required!")
  }
  // uploading them to cloudinary
  const avatar=await uploadOnCloudinary(avatarLocalPath)
  const coverImage=await uploadOnCloudinary(coverImageLocalPath)

  // creating user object & creating entry in db
  const user=await User.create({
    fullname,
    username:username.toLowerCase(),
    email,
    password,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
  })
  // removing password and refrshToken field from response
  const createdUser=await User.findById(user._id).select(
    "-password -refreshToken"
  )
  // checking for user creation
  if(!createdUser){
    throw new ApiError(500,"Something went wrong while registering the User!!")
  }
  return res.status(201).json(
    new ApiResponse(200,createdUser,"User registered Successfully!!")
  )
});
export { registerUser };

