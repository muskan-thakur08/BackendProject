import { Router } from 'express';
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
} from "../controllers/tweet.controllers.js"
import {verifyJWT} from "../middlewares/auth.middlewares.js"
import { Tweet } from '../models/tweet.models.js';
import { checkOwnership } from '../middlewares/checkOwnership.middlewares.js';

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/create").post(createTweet);
router.route("/user/:userId").get(getUserTweets);
router.route("/:tweetId").patch(checkOwnership(Tweet, "owner", "tweetId"),updateTweet)
.delete(checkOwnership(Tweet, "owner", "tweetId"),deleteTweet);

export default router