import { z } from 'zod';
import mongoose from 'mongoose';
import { dataStore } from '../services/dataStore.js';
import { serializePayload } from '../utils/roleMapper.js';
import { canModify } from '../utils/permissions.js';
import { logAdminAction } from '../utils/adminLogger.js';

const postCreateSchema = z.object({
    content: z.string().min(1, 'Post content cannot be empty'),
    category: z.enum(['Advice', 'Achievement', 'General'], {
        errorMap: () => ({ message: 'Category must be Advice, Achievement, or General' })
    })
});

const commentCreateSchema = z.object({
    text: z.string().min(1, 'Comment text cannot be empty')
});

export const getPosts = async (req, res, next) => {
    try {
        const { category } = req.query;
        const query = {};
        if (category) {
            query.category = category;
        }

        const posts = await dataStore.find('Post', query, {
            sort: { isPinned: -1, pinnedAt: -1, createdAt: -1 },
            populate: 'author'
        });

        const mappedPosts = serializePayload(posts);

        res.status(200).json({
            success: true,
            data: mappedPosts
        });
    } catch (err) {
        next(err);
    }
};

export const createPost = async (req, res, next) => {
    try {
        const parsed = postCreateSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                errors: parsed.error.flatten().fieldErrors
            });
        }

        const { content, category } = parsed.data;
        const userId = req.user.id || req.user._id;

        const postData = {
            author: userId,
            content,
            category,
            likes: [],
            comments: []
        };

        const newPost = await dataStore.insert('Post', postData);
        
        // Populate the author details for the newly created post
        const populatedPost = await dataStore.findById('Post', newPost.id || newPost._id);
        const resolvedPost = await dataStore.find('Post', { _id: populatedPost._id }, { populate: 'author' });

        const mappedPost = serializePayload(resolvedPost[0] || populatedPost);

        res.status(201).json({
            success: true,
            data: mappedPost
        });
    } catch (err) {
        next(err);
    }
};

export const likePost = async (req, res, next) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id || req.user._id;

        const post = await dataStore.findById('Post', postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found.'
            });
        }

        // Handle string array verification for robust fallback comparison
        const likesList = post.likes || [];
        const isLiked = likesList.some(id => id.toString() === userId.toString());

        const updates = isLiked
            ? { $pull: { likes: userId } }
            : { $push: { likes: userId } };

        const updatedPost = await dataStore.update('Post', { _id: postId }, updates);
        
        // Fetch with author populated
        const resolved = await dataStore.find('Post', { _id: postId }, { populate: 'author' });

        const mappedPost = serializePayload(resolved[0] || updatedPost);

        res.status(200).json({
            success: true,
            data: mappedPost
        });
    } catch (err) {
        next(err);
    }
};

export const addComment = async (req, res, next) => {
    try {
        const postId = req.params.id;
        const parsed = commentCreateSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                errors: parsed.error.flatten().fieldErrors
            });
        }

        const { text } = parsed.data;
        const userId = req.user.id || req.user._id;

        const post = await dataStore.findById('Post', postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found.'
            });
        }

        const commentId = new mongoose.Types.ObjectId().toString();
        const commentObj = {
            _id: commentId,
            id: commentId,
            author: userId,
            authorName: req.user.name,
            authorAvatar: req.user.avatar || req.user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.user.name)}`,
            text,
            createdAt: new Date().toISOString()
        };

        const updatedPost = await dataStore.update('Post', { _id: postId }, {
            $push: { comments: commentObj }
        });

        // Fetch with author populated
        const resolved = await dataStore.find('Post', { _id: postId }, { populate: 'author' });

        const mappedPost = serializePayload(resolved[0] || updatedPost);

        res.status(200).json({
            success: true,
            data: mappedPost
        });
    } catch (err) {
        next(err);
    }
};

export const getComments = async (req, res, next) => {
    try {
        const postId = req.params.id;
        const post = await dataStore.findById('Post', postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found.'
            });
        }

        res.status(200).json({
            success: true,
            data: post.comments || []
        });
    } catch (err) {
        next(err);
    }
};

export const deletePost = async (req, res, next) => {
    try {
        const postId = req.params.id;
        const post = await dataStore.findById('Post', postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found.'
            });
        }

        if (!canModify(post.author, req.user.id || req.user._id, req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access Denied: You do not have permission to delete this post.'
            });
        }

        await dataStore.remove('Post', { _id: postId });

        if (req.user.role === 'admin') {
            await logAdminAction(req.user.id || req.user._id, 'delete_post', 'Post', postId);
        }

        res.status(200).json({
            success: true,
            message: 'Post deleted successfully.'
        });
    } catch (err) {
        next(err);
    }
};

export const deleteComment = async (req, res, next) => {
    try {
        const { postId, commentId } = req.params;
        const post = await dataStore.findById('Post', postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found.'
            });
        }

        const comment = (post.comments || []).find(c => c.id === commentId || c._id === commentId);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found.'
            });
        }

        const isCommentAuthor = comment.author && comment.author.toString() === (req.user.id || req.user._id).toString();
        const isPostAuthor = post.author && post.author.toString() === (req.user.id || req.user._id).toString();
        const isAdmin = req.user.role === 'admin';

        if (!isCommentAuthor && !isPostAuthor && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Access Denied: You do not have permission to delete this comment.'
            });
        }

        const updatedPost = await dataStore.update('Post', { _id: postId }, {
            $pull: { comments: { _id: commentId } }
        });

        if (isAdmin) {
            await logAdminAction(req.user.id || req.user._id, 'delete_comment', 'Comment', commentId);
        }

        const resolved = await dataStore.find('Post', { _id: postId }, { populate: 'author' });
        const mappedPost = serializePayload(resolved[0] || updatedPost);

        res.status(200).json({
            success: true,
            data: mappedPost
        });
    } catch (err) {
        next(err);
    }
};

export const pinPost = async (req, res, next) => {
    try {
        const postId = req.params.id;
        const post = await dataStore.findById('Post', postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found.'
            });
        }

        const isPinned = !post.isPinned;
        const updates = isPinned 
            ? { $set: { isPinned, pinnedAt: new Date() } }
            : { $set: { isPinned }, $unset: { pinnedAt: '' } };

        const updatedPost = await dataStore.update('Post', { _id: postId }, updates);

        await logAdminAction(req.user.id || req.user._id, isPinned ? 'pin_post' : 'unpin_post', 'Post', postId);

        const resolved = await dataStore.find('Post', { _id: postId }, { populate: 'author' });
        const mappedPost = serializePayload(resolved[0] || updatedPost);

        res.status(200).json({
            success: true,
            data: mappedPost
        });
    } catch (err) {
        next(err);
    }
};
