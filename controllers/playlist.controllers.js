import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";

const createPlaylist = asyncHandler(async (req, res) => {
  //TODO: create playlist
  const { name, description } = req.body;
  const owner = req.user?._id;
  if (!name || !description) {
    throw new ApiError(400, "Name and description are required");
  }
  const newPlaylist = await Playlist.create({
    name,
    description,
    owner,
  });
  if (!newPlaylist.length == 0) {
    throw new ApiError(400, "Creating playlist failed");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, newPlaylist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  //TODO: get user playlists
  const { userId } = req.params;
  if (!userId) {
    throw new ApiError(400, "User id is required");
  }

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }
  const owner = await User.findById(userId).select("-password -refershToken");
  if (!owner) {
    throw new ApiError(404, "Owner Not found!");
  }
  const getPlaylist = await Playlist.aggregate([
    {
      $match: {
        owner: mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
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
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$ownerDetails",
              },
            },
          },
          {
            $project: {
              title: 1,
              thumbnail: 1,
              views: 1,
              duration: 1,
              "owner.fullName": 1,
              "owner.avatar": 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        videoDetails: 1,
        createdAt: 1,
      },
    },
  ]);

  if (!getPlaylist) {
    throw new ApiError(404, "Playlist not found!");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { getPlaylist, owner },
        "Playlist Fetched Succesfully!!"
      )
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  //TODO: get playlist by id
  const { playlistId } = req.params;
  if (!playlistId) {
    throw new ApiError(404, "Playlist Id is required");
  }
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(404, "Playlist Id is not valid");
  }
  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "video",
        pipeline: [
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
              title: 1,
              thumbnail: 1,
              description: 1,
              duration: 1,
              "owner.fullName": 1,
              "owner.avatar": 1,
            },
          },
        ],
      },
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
        name: 1,
        description: 1,
        video: 1,
        "owner.fullName": 1,
        createdAt: 1,
      },
    },
  ]);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found!!");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist found successfully!!"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlistId or videoId");
  }
  const newPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $push: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );
  if (!newPlaylist) {
    throw new ApiError(404, "Failed to add video to playlist");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, newPlaylist, "Video added to playlist"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  // TODO: remove video from playlist
  const { playlistId, videoId } = req.params;
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlistId or videoId");
  }
  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );
  if (!playlist) {
    throw new ApiError(404, "Failed to remove video from playlist");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Video removed from playlist"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  // TODO: delete playlist
  const { playlistId } = req.params;
  if (!playlistId) {
    throw new ApiError(404, "Playlist Id is required");
  }
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(404, "Playlist Id is not valid");
  }
  const deletedPlaylist = Playlist.findByIdAndDelete(playlistId);
  if (!deletedPlaylist) {
    throw new ApiError(404, "Playlist not found");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, deletedPlaylist, "Playlist deleted successfully !")
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
  //TODO: update playlist
  const { playlistId } = req.params;
  const { name, description } = req.body;
  if (!playlistId) {
    throw new ApiError(404, "Playlist Id is required");
  }
  if (!name && !description) {
    throw new ApiError(400, "Name and description are required");
  }
  const updatedPlaylist = {};
  if (name) {
    updatePlaylist.name = name;
  }
  if (description) {
    updatePlaylist.description = description;
  }
  const newPlaylist = Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: updatedPlaylist,
    },
    {
      new: true,
    }
  );
  if (!newPlaylist) {
    throw new ApiError(404, "Failed to Update Playlist!");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, newPlaylist, "Playlist updated successfully"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
