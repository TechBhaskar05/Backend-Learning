import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addComment, deleteComment, getVideoComments, updateComment } from "../controllers/comment.controller.js";
const router = Router();

router.use(verifyJWT); // Apply JWT verification middleware to all routes in this router

router.route("/:videoId")
    .get(getVideoComments)
    .post(addComment);

router.route("/c/:commentId")
    .patch(updateComment)
    .delete(deleteComment);