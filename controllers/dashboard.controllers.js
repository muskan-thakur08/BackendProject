import mongoose from "mongoose";
import { Video } from "../models/video.models.js";
import { Tweet } from "../models/tweet.models.js";
import { Comment } from "../models/comment.models.js";
import { Subscription } from "../models/subscription.models.js";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const  channelId  = req.user._id;
  if (!channelId) {
    throw new ApiError(400, "Channel Id is required");
  }
  // Get the channel total video
  const totalVideos = await Video.countDocuments({ owner: userId });
  // Get the channel subscribers
  const totalSubscibers = await Subscription.countDocuments({
    channel: new mongoose.Types.ObjectId(channelId),
  });
  if (!totalSubscibers) {
    throw new ApiError(404, "Channel not found");
  }
  // Get the channel total likes
  const videoLikeStats = await Like.aggregate([
    {
      $match: {
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
        as: "videoDetails",
      },
    },
    {
      $unwind: "$videoDetails",
    },
    {
      $match: {
        "videoDetails.owner": new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $count: "totalLikes",
    },
  ]);

  const totalLikes = videoLikeStats.length ? videoLikeStats[0].totalLikes : 0;

  // Get the channel total views
  const viewsStats = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $group: {
        _id: null,
        totalViews: {
          $sum: "$views",
        },
      },
    },
  ]);
  const totalViews = viewsStats.length ? viewsStats[0].totalViews : 0;

  // Get the channel total tweet likes
  const tweetStats = await Like.aggregate([
    {
      $match: {
        tweet: {
          $exists: true,
        },
      },
    },
    {
      $lookup: {
        from: "tweets",
        localField: "tweet",
        foreignField: "_id",
        as: "tweetDetails",
      },
    },
    {
      $unwind: "$tweetDetails",
    },
    {
      $match: {
        "tweetDetails.owner": new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $count: "totalTweetLikes",
    },
  ]);
  const TweetLikes = tweetStats.length ? tweetStats[0].totalTweetLikes : 0;
  // Get the channel total comment likes
  const commentStats = await Like.aggregate([
    {
      $match: {
        comment: {
          $exists: true,
        },
      },
    },
    {
      $lookup: {
        from: "comments",
        localField: "comment",
        foreignField: "_id",
        as: "commentDetails",
      },
    },
    {
      $unwind: "$commentDetails",
    },
    {
      $match: {
        "commentDetails.owner": new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $count: "totalCommentLikes",
    },
  ]);
  const commentLikes = commentStats.length
    ? commentStats[0].totalCommentLikes
    : 0;

  const response = {
    totalVideos,
    totalSubscibers,
    totalLikes,
    totalViews,
    TweetLikes,
    commentLikes,
  };
  return res
    .status(200)
    .json(
      new ApiResponse(200, response, "Channel Stats Fetched Successfully !")
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const channelId = req.user?._id;
  const { page = 1, limit = 10 } = req.query;
  if (!channelId) throw new ApiError(401, "User not authenticated");

  const pageNumber = parseInt(page, 10);
  const pageSize = parseInt(limit, 10);

  const videos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $sort: { createdAt: -1 }, // Sort by latest (newest first)
    },
    {
      $skip: (pageNumber - 1) * pageSize,
    },
    {
      $limit: pageSize,
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: { $first: "$ownerDetails" },
      },
    },
    {
      $project: {
        title: 1,
        description: 1,
        thumbnail: 1,
        duration: 1,
        "owner.fullName": 1,
        "owner.avatar": 1,
      },
    },
  ]);

  const totalVideoCount = await Video.countDocuments({
    owner: new mongoose.Types.ObjectId(channelId),
  });

  if (!videos.length) throw new ApiError(404, "No videos in this channel");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { videos, totalVideoCount },
        "Videos fetched successfully"
      )
    );
});

const getAllTweets = asyncHandler(async (req, res) => {
  // TODO: Get all the Tweets uploaded by the channel
  const channelId = req.user?._id;
  if (!channelId) {
    throw new ApiError(401, "User not authenticated");
  }
  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: { $first: "$ownerDetails" },
      },
    },
    {
      $project: {
        content: 1,
        createdAt: 1,
        "ownerDetails.fullName": 1,
        "ownerDetails.avatar": 1,
      },
    },
  ]);

  const totalTweetCount = await Tweet.countDocuments({
    owner: new mongoose.Types.ObjectId(channelId),
  });

  if (!tweets.length) {
    throw new ApiError(404, "No Tweet in this channel");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { tweets, totalTweetCount },
        "Tweet fetched successfully"
      )
    );
});
const getAllComments = asyncHandler(async (req, res) => {
  // TODO: Get all the Comments in the video uploaded by the channel
  const channelId = req.user._id;
  if (!channelId) {
    throw new ApiError(400, "Channel Id is required");
  }
  const videoComment = await Comment.aggregate([
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoDetails",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "ownerDetails",
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: { $first: "$ownerDetails" },
            },
          },
          {
            $project: {
              title: 1,
              description: 1,
              thumbnail: 1,
              duration: 1,
              "owner._id": 1,
              "owner.fullName": 1,
              "owner.avatar": 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$videoDetails",
    },
     {
       $match: {
         "videoDetails.owner._id": new mongoose.Types.ObjectId(channelId),
       },
     },
    {
      $project: {
        content: 1,
        createdAt: 1,
        videoDetails: 1,
      },
    },
  ]);
 
  if (!videoComment.length) {
    throw new ApiError(404, "No comments found for this videos.");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { videoComment }, "Comments fetched successfully")
    );
});

export { getChannelStats, getChannelVideos, getAllTweets, getAllComments };
