import { Router } from "express";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/c/:channelId")
    .post(verifyJWT, toggleSubscription)
    .get(verifyJWT, getUserChannelSubscribers);

router.route("/u/:subscriberId")
    .get(verifyJWT, getSubscribedChannels);

export default router;