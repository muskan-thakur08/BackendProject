import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus, 
    updateVideo,
} from "../controllers/video.controllers.js"
import {verifyJWT} from "../middlewares/auth.middlewares.js"
import {upload} from "../middlewares/multer.middlewares.js"
import { checkOwnership } from '../middlewares/checkOwnership.middlewares.js';
import { Video } from '../models/video.models.js';

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/").get(getAllVideos)

 router.route("/upload").post(
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1,
        },
        {
            name: "thumbnail",
            maxCount: 1,
        },
        
    ]),
    publishAVideo
);

router
    .route("/:videoId")
    .get(getVideoById)
    .delete(checkOwnership(Video,"owner","videoId"),deleteVideo)
    .patch(checkOwnership(Video,"owner","videoId"),upload.single("thumbnail"), updateVideo);

router.route("/toggle/publish/:videoId").patch(checkOwnership(Video,"owner","videoId"),togglePublishStatus);

export default router