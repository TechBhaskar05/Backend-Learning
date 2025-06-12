import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body

    if (!content.trim()) {
        throw new ApiError(400, "Content is required")
    }

    const tweet = await Tweet.create({
        owner: req.user._id,
        content: content
    })

    return res
        .status(201)
        .json(new ApiResponse(201, tweet, "Tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    // const { userId } = req.params

    // if (!isValidObjectId(userId)) {
    //     throw new ApiError(400, "Invalid user ID")
    // }

    // const user = await User.findById(userId)
    // if (!user) {
    //     throw new ApiError(404, "User not found")
    // }

    const tweets = await Tweet.find({ owner: req.user._id })
        .populate("owner", "username avatar")
        .sort({ createdAt: -1 }) // Sort by creation date, newest first
        .exec()

    if(!tweets.length()) {
        throw new ApiError(404, "No tweets found for this user")    
    }
    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "Tweets retrieved successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params
    const { content } = req.body

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID")
    }

    if (!content.trim()) {
        throw new ApiError(400, "Content is required")
    }

    // const tweet = await Tweet.findByIdAndUpdate(tweetId,
    //     { content: content },
    //     { new: true, runValidators: true }
    // )

    const tweet = await Tweet.findById(req.user._id)

    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    if(!tweet.owner.equals(req.user._id)) {
        throw new ApiError(403, "You are not authorized to update this tweet")
    }

    tweet.content = content
    await tweet.save();

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID")
    }

    // const tweet = await Tweet.findByIdAndDelete(tweetId)

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    if(!tweet.owner.equals(req.user._id)) {
        throw new ApiError(403, "You are not authorized to delete this tweet")
    }

    await tweet.deleteOne()
    
    return res
        .status(200)
        .json(new ApiResponse(200, null, "Tweet deleted successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}