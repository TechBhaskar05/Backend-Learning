import { Router } from "express";

import { verifyJWT } from "../middlewares/auth.middleware.js";

import { getAllVideos, publishAVideo, getVideoById, deleteVideo, updateVideo, togglePublishStatus } from "../controllers/video.controller.js";
import { uploadVideo } from "../middlewares/videoUpload.middleware.js";

const router = Router();

router.route("/")
    .get(getAllVideos)
    .post(
        verifyJWT,
        uploadVideo.fields([
            { name: "video", maxCount: 1 },
            { name: "thumbnail", maxCount: 1 }
        ]),
        publishAVideo
    );

router.route("/:videoId")
    .get(getVideoById)
    .patch(
        verifyJWT,
        uploadVideo.fields([
            { name: "thumbnail", maxCount: 1 }
        ]),
        updateVideo
    )
    .delete(verifyJWT, deleteVideo);

router.route("/toggle/:videoId")
    .patch(verifyJWT, togglePublishStatus);

export default router;