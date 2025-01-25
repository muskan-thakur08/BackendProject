import { Router } from "express";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
} from "../controllers/subscription.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/subscribed-channels/:subscriberId").get(getSubscribedChannels);

router.route("/toggle-subscribe/:channelId").post(toggleSubscription);

router.route("/subscribers/:channelId").get(getUserChannelSubscribers);

export default router;