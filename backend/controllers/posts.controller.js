import { z } from 'zod';
import mongoose from 'mongoose';
import { dataStore } from '../services/dataStore.js';
import { serializePayload } from '../utils/roleMapper.js';
import { canModify } from '../utils/permissions.js';
import { logAdminAction } from '../utils/adminLogger.js';
import { generateCompletion } from '../services/groqService.js';

const postCreateSchema = z.object({
    content: z.string().min(1, 'Post content cannot be empty'),
    category: z.enum(['Advice', 'Achievement', 'General'], {
        errorMap: () => ({ message: 'Category must be Advice, Achievement, or General' })
    }),
    image: z.string().optional()
});

const commentCreateSchema = z.object({
    text: z.string().min(1, 'Comment text cannot be empty')
});

export const getPosts = async (req, res, next) => {
    try {
        const { category } = req.query;
        const query = {};
        if (category && typeof category === 'string') {
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

export const getPost = async (req, res, next) => {
    try {
        const postId = req.params.id;
        const post = await dataStore.findById('Post', postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found.'
            });
        }
        
        // Populate the author details for the post
        const resolvedPost = await dataStore.find('Post', { _id: postId }, { populate: 'author' });
        const mappedPost = serializePayload(resolvedPost[0] || post);

        res.status(200).json({
            success: true,
            data: mappedPost
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

        const { content, category, image } = parsed.data;
        const userId = req.user.id || req.user._id;

        const postData = {
            author: userId,
            content,
            category,
            likes: [],
            comments: []
        };

        if (image) {
            postData.image = image;
        }

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
        
        const resolved = await dataStore.findById('Post', postId, { populate: 'author' });

        const mappedPost = serializePayload(resolved || updatedPost);

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

export const getTrendingTopics = async (req, res, next) => {
    try {
        const posts = await dataStore.find('Post', {});

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const hashtagCounts = {};

        posts.forEach(post => {
            const postDate = new Date(post.createdAt || post.updatedAt || Date.now());
            if (postDate >= sevenDaysAgo && post.content) {
                const hashtags = post.content.match(/#\w+/g);
                if (hashtags) {
                    hashtags.forEach(tag => {
                        const key = tag.startsWith('#') ? tag : '#' + tag;
                        const keyLower = key.toLowerCase();
                        
                        if (!hashtagCounts[keyLower]) {
                            hashtagCounts[keyLower] = { tag: key, count: 0 };
                        }
                        hashtagCounts[keyLower].count += 1;
                    });
                }
            }
        });

        // Sort by frequency descending
        const sortedTags = Object.values(hashtagCounts)
            .sort((a, b) => b.count - a.count);

        const trendingList = sortedTags.map(item => ({
            tag: item.tag,
            count: item.count
        }));

        // Fallback fillers
        const defaultTags = ['#AI', '#Internships', '#ResumeTips', '#Hackathon', '#WebDev'];
        for (const defaultTag of defaultTags) {
            if (trendingList.length >= 5) break;
            if (!trendingList.some(item => item.tag.toLowerCase() === defaultTag.toLowerCase())) {
                trendingList.push({ tag: defaultTag, count: 0 });
            }
        }

        res.status(200).json({
            success: true,
            data: trendingList.slice(0, 5)
        });
    } catch (err) {
        next(err);
    }
};

export const enhancePost = async (req, res, next) => {
    try {
        const { text, category = 'General' } = req.body;

        // Guard: must have meaningful content
        if (!text || typeof text !== 'string' || text.trim().length < 5) {
            return res.status(400).json({
                success: false,
                message: 'Please provide at least a few words for the AI to enhance.'
            });
        }

        // Guard: cap to 2000 characters to avoid excessive token usage
        const cappedText = text.trim().slice(0, 2000);

        const systemPrompt =
            `You are a writing assistant for a university alumni networking platform. ` +
            `The user is composing a "${category}" post. ` +
            `Improve the clarity, tone, and structure of the post while preserving their original meaning and intent. ` +
            `Keep it concise — do not pad or lengthen unnecessarily. ` +
            `Do not add hashtags, emojis, or content the user did not imply. ` +
            `Return only the improved post text — no preamble, no explanation, no quotation marks around it.`;

        const enhanced = await generateCompletion({
            systemPrompt,
            messages: [{ role: 'user', content: cappedText }],
            temperature: 0.4 // Lower temperature = tighter, less creative rewriting
        });

        // generateCompletion returns a rate-limit message string instead of throwing on 429
        if (enhanced.includes('temporarily busy')) {
            return res.status(429).json({
                success: false,
                message: 'AI enhancement is temporarily busy — please try again shortly.'
            });
        }

        res.status(200).json({
            success: true,
            data: { enhanced: enhanced.trim() }
        });
    } catch (err) {
        next(err);
    }
};
