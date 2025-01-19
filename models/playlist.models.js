import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema(
  {
    videos: [
        {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
        }
    ],
    name: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    description: {
      type: String,
      required:true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const Playlist = mongoose.model("Playlist", playlistSchema);
