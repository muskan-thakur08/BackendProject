import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary=async (filePath)=>{
    try {
        if(!filePath) return null
        //upload on cloudinary
        const response=await cloudinary.uploader.upload(filePath,{resource_type:'auto'})
        // console.log("File is uploaded on Cloudinary!!",response.url);
        return response;
    } catch (error) {
        fs.unlinkSync(filePath)
        return null;
    }
}

const deleteFromCloudinary = async (fileUrl, resourceType = "image") => {
    try {
      if (
        !fileUrl ||
        typeof fileUrl !== "string" ||
        !fileUrl.includes("cloudinary")
      ) {
        throw new ApiError(400, "Invalid file URL provided");
      }
  
      // Extract the public ID from the file URL
      const segments = fileUrl.split("/");
      const publicName = segments[segments.length - 1].split(".")[0];
  
      if (!publicName) throw new ApiError(400, "Error extracting public ID");
  
      // Attempt to delete the file from Cloudinary
      const result = await cloudinary.uploader.destroy(publicName, {
        resource_type: resourceType,
      });
  
      if (result.result === "not found") {
        console.warn(
          `File with public ID: ${publicName} not found on Cloudinary.`
        );
        return { success: false, message: "File not found on Cloudinary" };
      }
  
      if (result.result !== "ok") {
        throw new ApiError(500, `Cloudinary deletion failed: ${result.result}`);
      }
  
      console.log(
        `${resourceType} with public ID: ${publicName} deleted successfully.`
      );
      return { success: true, message: `${resourceType} deleted successfully` };
    } catch (error) {
      console.error("Cloudinary deletion error:", error.message);
      throw new ApiError(500, `Cloudinary deletion error: ${error.message}`);
    }
  };
export  {uploadOnCloudinary,deleteFromCloudinary};