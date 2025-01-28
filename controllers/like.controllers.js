import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on video
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid object id");
  }
  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });
  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);
    return res.status(200).json(new ApiResponse(200, "Like removed"));
  }
  const newLike = await Like.create({ likedBy: req.user._id, video: videoId });
  if (!newLike) {
    throw new ApiError(400, "Unable to Like");
  }
  return res.status(201).json(new ApiResponse(201, "Like Added"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on comment
  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id");
  }
  const existingCommentLike = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });
  if (existingCommentLike) {
    await Like.findByIdAndDelete(existingCommentLike._id);
    return res.status(200).json(new ApiResponse(200, "Like removed"));
  }
  const newLike = await Like.create({
    likedBy: req.user._id,
    comment: commentId,
  });
  if (!newLike) {
    throw new ApiError(400, "Unable to Like");
  }
  return res.status(201).json(new ApiResponse(201, "Like Added in Comment"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id");
  }
  const existingTweetLike = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user._id,
  });
  if (existingTweetLike) {
    await Like.findByIdAndDelete(existingTweetLike._id);
    return res.status(200).json(new ApiResponse(200, "Like removed"));
  }
  const newLike = await Like.create({ likedBy: req.user._id, tweet: tweetId });
  if (!newLike) {
    throw new ApiError(400, "Unable to Like");
  }
  return res.status(201).json(new ApiResponse(201, newLike,"Like Added"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user._id),
        video: {
            $exists: true,
          },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
        pipeline:[{
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[{
                    $project:{
                        fullName:1,
                        avatar:1
                    }
                }]
            }
        },
        {
            $addFields:{
                owner:{
                    $first:"$owner"
                }
            }
        },
        {
            $project:{
                title:1,
                description:1,
                thumbnail:1,
                duration:1,
                owner:1
            }
        }
        ],
      },
    },
    {
        $project:{
            "video.owner.fullName":1,
            "video.owner.avatar":1,
            "video.title":1,
            "video.description":1,
            "video.thumbnail":1,
            "video.duration":1
        }
    }
  ]);
  if(!likedVideos){
    throw new ApiError(404,"No liked videos found")
  }
  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      likedVideos,
      "Liked videos fetched successfully"
    )
  )
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
