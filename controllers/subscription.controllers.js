import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.models.js";
import { Subscription } from "../models/subscription.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  // TODO: toggle subscription
  const { channelId } = req.params;
  if (!channelId) {
    throw new ApiError(400, "Channel Id is required");
  }
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Channel Id is not valid");
  }
  const isSubscribed = await Subscription.findOne({
    $and: [{ subscriber: req.user?._id }, { channel: channelId }],
  });
  if (!isSubscribed) {
    const subscribe = await Subscription.create({
      subscriber: req.user?._id,
      channel: channelId,
    });
    if (!subscribe) {
      throw new ApiError(400, "Failed to subscribe");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "subscribed successfully"));
  }
  await Subscription.findByIdAndDelete(isSubscribed._id);
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Unsubscribed successfully"));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId) {
    throw new ApiError(400, "Channel Id is required");
  }
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Channel Id is not valid");
  }
  const subscriber = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
      },
    },
    {
      $unwind: "$subscriber",
    },
    {
      $project: {
        "subscriber.fullName": 1,
        "subscriber.email": 1,
      },
    },
  ]);
  const totalSubscibers = await Subscription.countDocuments({
    channel: new mongoose.Types.ObjectId(channelId),
  });
  if (subscriber.length == 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, { totalSubscibers }, "No subscriber found"));
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { subscriber, totalSubscibers },
        "Subscriber Fetched Successfully !"
      )
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if (!subscriberId) {
    throw new ApiError(400, "Subscriber Id is required");
  }
  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Subscriber Id is not valid");
  }
  const channel = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel",
      },
    },
    {
      $unwind: "$channel",
    },
    {
      $project: {
        "channel.fullName": 1,
        "channel.email": 1,
      },
    },
  ]);
  const totalChannels = await Subscription.countDocuments({
    subscribers: new mongoose.Types.ObjectId(subscriberId),
  });
  if(channel.length==0){
    return res
      .status(200)
      .json(new ApiResponse(200, {totalChannels}, "No channel found"));
  }

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      { channel ,totalChannels},
      "Channel Fetched Successfully !"
    )
  )
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
