import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"
import ApiError from "../utils/ApiError.js";
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

const deleteFromCloudinary=async(imageURL)=>{
    try {
        const publicId=imageURL.split("/").pop().split(".")[0]
        if (!publicId) {
            throw new ApiError(400,"Error while getting image public name")
        }
        const result=await cloudinary.uploader.destroy(publicId);
        if (result.result!=="ok") {
            throw new ApiError(400,"Error while deleting from cloudinary")
        }
        return new ApiResponse(200,{},"Image Deleted Successfully!!")
    } catch (error) {
        throw new ApiError(500,"Something went wrong while deleting from cloudinary!!")
    }
}

export  {uploadOnCloudinary,deleteFromCloudinary};