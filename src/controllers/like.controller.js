import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const toggleLike = async (userId, referenceId, referenceModel, referenceType) => {
    if(!isValidObjectId(referenceId)) {
        throw new ApiError(400, `Invalid ${referenceType} ID`)
    }

    const exists = await referenceModel.findById(referenceId)
    if (!exists) {
        throw new ApiError(404, `${referenceType} not found`)
    }

    const existingLike = await Like.findOne({
        user: userId,
        likeableId: referenceId,
        onModel: referenceType
    });

    if(existingLike) {
        await existingLike.deleteOne();
        return { liked: false };
    }
    else {
        await Like.create({
            user: userId,
            likeableId: referenceId,
            onModel: referenceType
        });
        return { liked: true };
    }
}

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const userId = req.user._id
    //TODO: toggle like on video
    const result = await toggleLike(userId, videoId, Video, "Video");
    return res
        .status(200)
        .json(new ApiResponse(200, result, `Video has been ${result.liked ? "liked" : "unliked"} successfully`))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    const userId = req.user._id
    const result = await toggleLike(userId, commentId, Comment, "Comment");
    return res
        .status(200)
        .json(new ApiResponse(200, result, `Comment has been ${result.liked ? "liked" : "unliked"} successfully`))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    const userId = req.user._id
    const result = await toggleLike(userId, tweetId, Tweet, "Tweet");
    return res
        .status(200)
        .json(new ApiResponse(200, result, `Tweet has been ${result.liked ? "liked" : "unliked"} successfully`))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id
    const likedVideos = await Like.find({ user: userId, onModel: "Video" })
        .populate({
            path: 'likeableId',
            model: 'Video',
            populate: { path: 'owner', select: 'username avatar' }
        })

    const filteredVideos = likedVideos
        .filter((like) => like.likeableId !== null)
        .map((like) => like.likeableId);

    return res
        .status(200)
        .json(new ApiResponse(200, filteredVideos, "Liked videos fetched successfully"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}