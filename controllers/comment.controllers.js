import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  if (!videoId) {
    throw new ApiError(400, "Video id is required");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }
  const comment = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $skip: (page - 1) * parseInt(limit),
    },
    {
      $limit: parseInt(limit),
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
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
        owner: { $first: "$owner" },
      },
    },
    {
      $project: {
        content: 1,
        createdAt: 1,
        "owner.fullName": 1,
        "owner.avatar": 1,
      },
    },
  ]);
  if (!comment) {
    throw new ApiError(404, "Comments not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;
  if (content.trim().length < 2)
    throw new ApiError(400, "Comment must be at least 2 characters long");

  if (!videoId || !content)
    throw new ApiError(400, "Video id and content are required");
  if (!isValidObjectId(videoId))
    throw new ApiError(400, "Video id must be a valid object id");
  const comment = await Comment.create({
    content,
    video: new mongoose.Types.ObjectId(videoId),
    owner: req.user._id,
  });

  if (!comment) throw new ApiError(400, "Unable to create comment");

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment created successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { content } = req.body;
  const resource = req.resource;
  if (!content) {
    throw new ApiError(400, "Content is required");
  }
  if (typeof content !== "string") {
    throw new ApiError(400, "Content must be a valid string");
  }
  //   const comment = {};
  //   if (content) {
  //     comment.content = content;
  //   }
  const updatedComment = await Comment.findByIdAndUpdate(
    resource._id,
    {
      $set: {
        content,
      },
    },
    {
      new: true,
    }
  );
  if (!updatedComment) {
    throw new ApiError(404, "Failed to update comment");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const resource = req.resource;
  const deletedComment = await Comment.findByIdAndDelete(resource._id);

  if (!deletedComment) {
    throw new ApiError(404, "Failed to delete comment");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, deletedComment, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
