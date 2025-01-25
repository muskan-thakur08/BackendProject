import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query = "",
    sortBy = "_id",
    sortType = "asc",
    userId,
  } = req.query;
  //TODO: get all videos based on query, sort, pagination
  const matchStage = {};
  if (query) {
    matchStage.title = {
      $regex: query, // Use regex to match titles containing the query
      $options: "i", // "i" makes the regex case-insensitive
    };
  }

  if (userId && isValidObjectId(userId)) {
    matchStage.userId = mongoose.Types.ObjectId(userId);
  }

  const sortOptions = {
    [sortBy]: sortType === "asc" ? 1 : -1,
  };

  const pipeline = [
    {
      $match: matchStage,
    },
    {
      $sort: sortOptions,
    },
    {
      $skip: (page - 1) * parseInt(limit),
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $unwind: "$owner",
    },
    {
      $project: {
        title: 1,
        description: 1,
        videoFile: 1,
        thumbnail: 1,
        duration: 1,
        views: 1,
        isPublished: 1,
        createdAt: 1,
        "owner.username": 1,
      },
    },
  ];
  const video = await Video.aggregate(pipeline);
  if (!video) {
    throw new ApiError(404, "video not found!!");
  }

  const countTotalVideo = Video.countDocuments(matchStage);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { video, page, limit, countTotalVideo },
        "Video Fetched Successfully!!"
      )
    );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  if (!title || !description) {
    throw new ApiError(400, "Title and description are required");
  }

  const videoFileLocalPath = req.files?.videoFile[0].path;
  const thumbnailLocalPath = req.files?.thumbnail[0].path;

  if (!videoFileLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "Video and thumbnail are required");
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoFile.url || !thumbnailFile.url) {
    throw new ApiError(400, "Error while uploading video and thumbnail");
  }

  const video = await Video.create({
    title,
    description,
    videoFile: videoFile?.url,
    thumbnail: thumbnailFile?.url,
    owner: req.user?._id,
    duration: videoFile?.duration,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, video, "Video Published Successfully!!"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  if (!videoId) {
    throw new ApiError(400, "Video Id is required!!");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(404, "Video Id is not valid");
  }
  const video = await Video.findById(videoId).populate("owner", "username");

  // another way to get video by id 
  // const video= Video.aggregate([
  //   {
  //     $match:{
  //       _id:new mongoose.Types.ObjectId(videoId)
  //     }
  //   },
  //   {
  //       $lookup:{
  //         from:"users",
  //         localField:"owner",
  //         foreignField:"_id",
  //         as:"owner",
  //       }
  //   },
  //     {
  //       $unwind:"$owner"
  //     },
  //     {
  //       $project: {
  //         title: 1,
  //         description: 1,
  //         videoFile: 1,
  //         thumbnail: 1,
  //         duration: 1,
  //         views: 1,
  //         isPublished: 1,
  //         createdAt: 1,
  //         "owner.username": 1,
  //       },
  //     },
  // ])

  if (!video) {
    throw new ApiError(404, "Video not found!!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Video Found Successfully !"));
});

const updateVideo = asyncHandler(async (req, res) => {
  //TODO: update video details like title, description, thumbnail
  const { title, description } = req.body;
  const video = req.resource;
  const thumbnailFile = req.file?.path;
  const updateData = {};
  if (title) {
    updateData.title = title;
  }
  if (description) {
    updateData.description = description;
  }
  if (thumbnailFile) {
    const oldThumbnail = await Video.findById(video._id);
    const deleteOldThumbnail = await deleteFromCloudinary(
      oldThumbnail.thumbnail
    );
    if (!deleteOldThumbnail.success) {
      throw new ApiError(404, "Failed to delete old thumbnail");
    }
    const thumbnail = await uploadOnCloudinary(thumbnailFile);
    updateData.thumbnail = thumbnail.url;
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    video._id,
    {
      $set: updateData,
    },
    {
      new: true,
    }
  );

  if (!updatedVideo) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video Updated Successfully !! "));
});
const deleteVideo = asyncHandler(async (req, res) => {
  const video = req.resource;
  if (!video.videoFile) {
    throw new ApiError(404, "Video not found");
  }
  console.log(video.videoFile);
  if (video) {
    try {
      const videoFileStatus = await deleteFromCloudinary(
        video.videoFile,
        "video"
      );
      const thumbnailStatus = await deleteFromCloudinary(video.thumbnail);
      if (!videoFileStatus.success || !thumbnailStatus.success) {
        throw new ApiError(500, "Failed to delete video from cloudinary");
      }
    } catch (error) {
      console.error("Failed to delete video from cloudinary:", error);
      throw new ApiError(500, error.message);
    }
  } else {
    console.log("No old Video to delete.");
  }

  const deletedVideo = await Video.findByIdAndDelete(video._id);
  if (!deletedVideo) throw new ApiError(404, "Video not found and not deleted");

  return res
    .status(200)
    .json(new ApiResponse(200, deletedVideo, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const video = req.resource;
  video.isPublished = !video.isPublished;
  await video.save({ validateBeforeSave: false });

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  return res 
    .status(200)
    .json(new ApiResponse(200, video, "Status changed successfully"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
