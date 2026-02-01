import mongoose from 'mongoose';
import { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
const videoSchema = new Schema(
    {
        videoFile: {
            type: String, // cloudinary public_id
            required: true
        },
        thumbnail: {
            type: String, // cloudinary public_id
            required: true
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        duration: {
            type: Number, // in seconds
            required: true,
        },
        views: {
            type: Number,
            default: 0,
        },
        isPublished: {
            type: Boolean,
            default: true,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },{
        timestamps: true
    }
);
videoSchema.plugin(mongooseAggregatePaginate);  

export const Video = mongoose.model('Video', videoSchema);