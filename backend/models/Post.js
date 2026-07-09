import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    authorAvatar: String,
    text: { type: String, required: true }
}, { timestamps: true });

const postSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    category: { type: String, enum: ['Advice', 'Achievement', 'General'], required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [commentSchema],
    image: String,
    isPinned: { type: Boolean, default: false },
    pinnedAt: Date
}, { timestamps: true });

export const Post = mongoose.models.Post || mongoose.model('Post', postSchema);
