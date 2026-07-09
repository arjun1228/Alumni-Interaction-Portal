import express from 'express';
import { getPosts, getPost, createPost, likePost, addComment, getComments, deletePost, deleteComment, pinPost } from '../controllers/posts.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

router.get('/', getPosts);
router.get('/:id', getPost);
router.post('/', authenticate, createPost);
router.delete('/:id', authenticate, deletePost);
router.post('/:id/like', authenticate, likePost);
router.post('/:id/comments', authenticate, addComment);
router.get('/:id/comments', getComments);
router.delete('/:postId/comments/:commentId', authenticate, deleteComment);
router.patch('/:id/pin', authenticate, authorize('admin'), pinPost);

export default router;
