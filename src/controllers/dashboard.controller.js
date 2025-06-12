import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const channelId = req.user._id;
    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }
    // const channelVideos = await Video.find({ owner: channelId });
    // const totalVideos = channelVideos.length;
    // const totalViews = channelVideos.reduce((acc, video) => acc + video.views, 0);
    // const totalLikes = await Like.countDocuments({ likeableId: channelId, onModel: "Video" });
    // const totalSubscribers = await Subscription.countDocuments({ channel: channelId });

    const [totalVideos, totalViews, totalSubscribers, totalLikes] = await Promise.all([
        Video.countDocuments({owner: channelId}),
        Video.aggregate([
            { $match: { owner: new mongoose.Types.ObjectId(channelId) } },
            { $group: { _id: null, total: { $sum: "$views" } } }
        ]).then(result => result[0]?.total || 0),
        Subscription.countDocuments({ channel: channelId }),
        Like.countDocuments({ video: { $in: await Video.find({owner: channelId}).distinct("_id") } })
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, {
            totalVideos,
            totalViews,
            totalSubscribers,
            totalLikes
        }, "Channel stats retrieved successfully"));
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const {channelId} = req.params;
    const {page = 1, limit = 10} = req.query;

    if(!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const channelVideos = await Video.find({owner: channelId})
        .sort({createdAt: -1}) // Sort by creation date, newest first
        .skip((page - 1) * limit)
        .limit(Number(limit));

    return res
        .status(200)
        .json(new ApiResponse(200, channelVideos, "Channel videos retrieved successfully"));
})

export {
    getChannelStats, 
    getChannelVideos
    }