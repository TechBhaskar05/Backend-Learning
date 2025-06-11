import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query="", sortBy="createdAt", sortType="desc", userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    page = parseInt(page)
    limit = parseInt(limit)

    const filter = {
        isPublished: true,
        ...(query && {title: { $regex: query, $options: "i" }}),
        ...(userId && isValidObjectId(userId) && { owner: userId })
    }

    const sortOptions = {
        [sortBy]: sortType === "asc" ? 1 : -1
    }

    const result = await Video.aggregatePaginate(
        Video.aggregate([
            { $match: filter },
            {
                $sort: sortOptions
            }
        ]),
        { page, limit, populate: ["owner"] }
    )
    // const result = await Video.find(filter)
        // .sort(sortOptions)
        // .skip((page - 1) * limit)
        // .limit(limit)
        // .populate("owner", "username avatar");

    return res
        .status(200)
        .json(new ApiResponse(200, result, "Videos fetched successfully"))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    if(!title || !description) {
        throw new ApiError(400, "Title and description are required")
    }

    if(!req.files || !req.files.video || !req.files.thumbnail) {
        throw new ApiError(400, "Video and thumbnail are required")
    }

    const videoFile = req.files.video[0]
    const thumbnailFile = req.files.thumbnail[0]

    const uploadedVideo = await uploadOnCloudinary(videoFile.path)
    const uploadedThumbnail = await uploadOnCloudinary(thumbnailFile.path)
    
    // Check if the upload was successful
    if(!uploadedVideo || !uploadedThumbnail) {
        throw new ApiError(500, "Failed to upload video or thumbnail")
    }

    const newVideo = await Video.create({
        videoFile: {
            url: uploadedVideo.url,
            publicId: uploadedVideo.public_id
        },
        thumbnail: {
            url: uploadedThumbnail.url,
            publicId: uploadedThumbnail.public_id
        },
        title,
        description,
        duration: uploadedVideo.duration, 
        owner: req.user._id 
    })

    return res
    .status(201)
    .json(new ApiResponse(201, newVideo,"Video published successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId).populate("owner", "username avatar");

    // const video = await Video.aggregate([
    //     {
    //         $match: new mongoose.Types.ObjectId(videoId)
    //     },
    //     {
    //         $lookup: {
    //             from: "users",
    //             localField: "owner",
    //             foreignField: "_id",
    //             as: "owner"
    //         }
    //     },
    //     {
    //         $unwind: "$owner"
    //     },
    //     {
    //         $project:{
    //             title: 1,
    //             description: 1,
    //             videoFile: 1,
    //             thumbnail: 1,
    //             duration: 1,
    //             createdAt: 1,
    //             "owner._id": 1,
    //             "owner.username": 1,
    //             "owner.avatar": 1
    //         }
    //     }
    // ])

    if(!video) {
        throw new ApiError(404, "Video not found")
    }
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body
    //TODO: update video details like title, description, thumbnail

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)
    if(!video) {
        throw new ApiError(404, "Video not found")
    }

    // if(video.owner.toString() !== req.user._id.toString()) { // Both are correct, but .equals() is better for mongoose ObjectId comparison equals() is a mongoose method to compare ObjectId
    if(!video.owner.equals(req.user._id)) {
        throw new ApiError(403, "You are not authorized to update this video")
    }

    if(!title && !description && !req.files) {
        throw new ApiError(400, "At least one field (title, description, thumbnail) is required to update")
    }

    if(title) {
        video.title = title
    }
    if(description) {
        video.description = description
    }
    if(req.files?.thumbnail) {
        await deleteFromCloudinary(video.thumbnail.publicId, "image")
        const thumbnailFile = req.files.thumbnail[0]
        const uploadedThumbnail = await uploadOnCloudinary(thumbnailFile.path, "image")
        video.thumbnail = {
            url: uploadedThumbnail.url,
            publicId: uploadedThumbnail.public_id
        }
    }

    await video.save()
    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video updated successfully"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)
    if(!video) {
        throw new ApiError(404, "Video not found")
    }

    if(!video.owner.equals(req.user._id)) {
        throw new ApiError(403, "You are not authorized to delete this video")
    }

    // Delete video file from Cloudinary
    await deleteFromCloudinary(video.videoFile.publicId, "video")
    // Delete thumbnail from Cloudinary
    await deleteFromCloudinary(video.thumbnail.publicId, "image")
    // Delete video from database
    await video.deleteOne()
    return res
        .status(200)
        .json(new ApiResponse(200, null, "Video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)
    if(!video) {
        throw new ApiError(404, "Video not found")
    }
    if(!video.owner.equals(req.user._id)) {
        throw new ApiError(403, "You are not authorized to change the publish status of this video")
    }
    // Toggle the publish status
    video.isPublished = !video.isPublished
    await video.save()
    return res
        .status(200)
        .json(new ApiResponse(200, video, `Video is now ${video.isPublished ? "published" : "unpublished"}`))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}