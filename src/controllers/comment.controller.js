import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    // const comments = await Comment.find({video: videoId})
    //     .populate("owner", "username avatar")
    //     .sort({createdAt: -1}) // Sort by creation date, newest first
    //     .skip((page - 1) * limit)
    //     .limit(limit)
    //     .exec()

    const comments = await Comment.aggregate([
        {
            $match: { video: new mongoose.Types.ObjectId(videoId) }
        },
        {
            $unwind: "$owner"
        },
        {
            $sort: { createdAt: -1 } // Sort by creation date, newest first
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                updatedAt: 1,
                "owner._id": 1,
                "owner.username": 1,
                "owner.avatar": 1
            }
        }
    ])
    .skip((page - 1) * limit)
    .limit(Number(limit))

    return res
        .status(200)
        .json(new ApiResponse(200, comments, "Comments retrieved successfully"))

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    const {content} = req.body

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    if (!content || !content.trim()) {
        throw new ApiError(400, "Comment content is required")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const comment = await Comment.create({
        video: videoId,
        owner: req.user._id,
        content: content.trim()
    })

    return res
        .status(201)
        .json(new ApiResponse(201, comment, "Comment added successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    const {content} = req.body
    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }
    if (!content || !content.trim()) {
        throw new ApiError(400, "Comment content is required")
    }

    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    if (!comment.owner.equals(req.user._id)) {
        throw new ApiError(403, "You are not authorized to update this comment")
    }
    // Update the comment content
    comment.content = content.trim()
    await comment.save() 
    // We can also use findByIdAndUpdate
    // const updatedComment = await Comment.findByIdAndUpdate(
    //     commentId,
    //     {content: content.trim()},
    //     {new: true, runValidators: true}
    // )

    return res
        .status(200)
        .json(new ApiResponse(200, Comment, "Comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params
    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }

    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }
    if (!comment.owner.equals(req.user._id)) {
        throw new ApiError(403, "You are not authorized to delete this comment")
    }
    await comment.deleteOne()
    return res
        .status(200)
        .json(new ApiResponse(200, null, "Comment deleted successfully"))   
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }