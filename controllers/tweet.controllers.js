import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content } = req.body;
  const owner = req.user?._id;
  if (!owner) {
    throw new ApiError(401, "Unauthorized: User not authenticated");
  }
  if (!content) {
    throw new ApiError(400, "Content is required");
  }
  if (typeof content !== "string") {
    throw new ApiError(400, "Content must be a valid string");
  }
  if (content.trim().length > 5000) {
    throw new ApiError(
      400,
      "Content exceeds the maximum length of 5000 characters"
    );
  }
  const newTweet = await Tweet.create({ content: content.trim(), owner });
  return res
    .status(201)
    .json(new ApiResponse(201, newTweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { userId } = req.params;
  if (!userId) {
    throw new ApiError(401, "Unauthorized: User not authenticated");
  }
  if (!isValidObjectId(userId)) {
    throw new ApiError(402, "User Id is not Valid!!");
  }
  const getTweet = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
      },
    },
    {
      $unwind: "$ownerDetails",
    },
    {
      $project: {
        content: 1,
        createdAt: 1,
        updatedAt: 1,
        "ownerDetails.fullName": 1,
        "ownerDetails.avatar": 1,
      },
    },
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, getTweet, "User tweets retrieved successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { content } = req.body;
  const resource = req.resource;
  if (!content) {
    throw new ApiError(400, "Content is required");
  }
  if (typeof content !== "string") {
    throw new ApiError(400, "Content must be a valid string");
  }
  if (content.trim().length > 5000) {
    throw new ApiError(
      400,
      "Content exceeds the maximum length of 5000 characters"
    );
  }
  const tweet = {};
  if (content) {
    tweet.content = content.trim();
  }
  const updatedTweet = await Tweet.findByIdAndUpdate(
    resource._id,
    {
      $set: tweet,
    },
    {
      new: true,
    }
  );
  if (!updatedTweet) {
    throw new ApiError(404, "Failed to update tweet");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const resource=req.resource;
  const deletedTweet = await Tweet.findByIdAndDelete(resource._id);

  if (!deletedTweet) {
    throw new ApiError(404, "Failed to delete tweet");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, deletedTweet, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
