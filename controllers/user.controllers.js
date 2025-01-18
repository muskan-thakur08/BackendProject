import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";


const generateAccessAndRefreshToken=async(userId)=>{
  try {
    const user=await User.findById(userId)
    const accessToken=user.generateAccessToken()
    const refreshToken=user.generateRefreshToken()
    user.refreshToken=refreshToken
    await user.save({validateBeforeSave:false})

    return {accessToken,refreshToken}
  } catch (error) {
    throw new ApiError(500,"Something went wrong while generating access and refresh token!!")
  }
}
const registerUser = asyncHandler(async (req, res, next) => {
  // get user details from frontend
  const { email, password, fullName, username } = req.body;
  // validation: not empty
  if (
    [fullName, email, password, username].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All field are required!");
  }
  // checking if user already exists:username & email
  const existedUser=await User.findOne({
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
    fullName,
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

const loginUser=asyncHandler(async(req,res)=>{
  // req body - data
  const {email,password,username}=req.body;
  // required username or email
  if (!username&&!email) {
    throw new ApiError(400,"Username or Email is required!!")
  }
  //finding username or email from User
  const user=await User.findOne({
    $or:[{username},{email}]
  })

  if (!user) {
    throw new ApiError(404,"User doesnot exist!")
  }
  //checking password
  const isPasswordValid=await user.isPasswordCorrect(password)

  if(!isPasswordValid){
    throw new ApiError(401,"Invalid Credentials!!") 
  }

  const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id)

  const loggedInUser=await User.findById(user._id).select("-password -refreshToken")

  const options={
    httpOnly:true,
    secure:true
  }
  return res
  .status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
    new ApiResponse(200,{user:loggedInUser,accessToken,refreshToken},"User Logged In Successfully!!")
  )
})
const logoutUser=asyncHandler(async(req,res)=>{
  await User.findByIdAndUpdate(
    req.user._id,
    {
    $set:{refreshToken:undefined}
     }, 
    {new:true}
  )
  const options={
    httpOnly:true,
    secure:true
  }
  return res
  .status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(new ApiResponse(200,{},"User Logged Out"))
})

const refreshAccessToken=asyncHandler(async(req,res)=>{
      const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken;
      if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized Request!!")
      }
     try {
       const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
       const user=await User.findById(decodedToken?._id)
       if(!user){
         throw new ApiError(401,"INVALID REFRESH TOKEN !!")
       }
 
       if (incomingRefreshToken!==user?.refreshToken) {
         throw new ApiError(401,"REFRESH TOKEN IS EXPIRED OR USED!!")
       }
 
       const options={
         httpOnly:true,
         secure:true
       }
 
       const {accessToken,newRefreshToken}=await generateAccessAndRefreshToken(user._id)
 
       return res
       .status(200)
       .cookie("accessToken",accessToken,options)
       .cookie("refreshToken",newRefreshToken,options)
       .json(
         200,
         {accessToken,refreshToken:newRefreshToken},
         "Access token refreshed !!"
       )
     } catch (error) {
      throw new ApiError(401,error?.message||"INVALID REFRESH TOKEN !!")
     }
})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
  const {oldPassword,newPassword}=req.body;
  const user=await User.findById(req.user?._id)
  const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)
  if (!isPasswordCorrect) {
    throw new ApiError(401,"Invalid OldPassword!!")
  }
  user.password=newPassword
  await user.save({validateBeforeSave:false})
  return res
  .status(200)
  .json(
    new ApiResponse(200,{},"Password Changed Successfully!!")
  )
})

const getCurrentUser=asyncHandler(async(req,res)=>{
  return res
  .status(200)
  .json(
    new ApiResponse(200,req.user,"User Found Successfully!!")
  )
})

const updateAccoutDetails=asyncHandler(async(req,res)=>{
    const {fullName,email}=req.body;

    if (!(fullName||email)) {
      throw new ApiError(400,"All field are Required!!")
    }
  
    const updatedUser=User.findByIdAndUpdate(
      req.user?._id,
      {
        $set:{
          fullName,
          email
        }
      },
      {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
      new ApiResponse(200,updatedUser,"User Updated Successfully!!")
    )
})

const updateUserAvatar=asyncHandler(async(req,res)=>{
      const avatarLocalPath=req.file?.path

      if (!avatarLocalPath) {
        throw new ApiError(400,"Avatar file is missing!")
      }

      const avatar=await uploadOnCloudinary(avatarLocalPath)

      if (!avatar.url) {
        throw new ApiError(400,"Error while uploading avatar!!")
      }

      const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
          $set:{
            avatar:avatar.url
          }
        },
        {new:true}
      ).select("-password")

      
      return res
      .status(200)
      .json(
        new ApiResponse(200,user,"Avatar Updated Successfully!!")
      )
})
const updateUserCoverImg=asyncHandler(async(req,res)=>{
      const coverImgLocalPath=req.file?.path

      if (!coverImgLocalPath) {
        throw new ApiError(400,"CoverImage file is missing!")
      }

      const coverImage=await uploadOnCloudinary(coverImgLocalPath)

      if (!coverImage.url) {
        throw new ApiError(400,"Error while uploading coverimage!!")
      }

      const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
          $set:{
            coverImage:coverImage.url
          }
        },
        {new:true}
      ).select("-password")

      return res
      .status(200)
      .json(
        new ApiResponse(200,user,"Cover Image Updated Successfully!!")
      )
})
















export { 
  registerUser,
  loginUser,
  logoutUser, 
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccoutDetails,
  updateUserAvatar,
  updateUserCoverImg
};

