import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true, // User who liked the content
        },
        likeableId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true, 
            refPath: "onModel",
        },
        onModel: {
            type: String,
            required: true,
            enum: ["Video", "Comment", "Tweet"], // Specify the models that can be liked
        }
    }, {timestamps: true}
);

likeSchema.index({ user: 1, likeableId: 1, onModel: 1 }, { unique: true }); // Ensure a user can like a specific item only once
// This index prevents duplicate likes by the same user on the same item

export const Like = mongoose.model("Like", likeSchema);