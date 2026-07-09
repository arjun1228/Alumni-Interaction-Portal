import express from 'express';
import { 
    getConversations, 
    getChatHistory, 
    sendMessage, 
    getMessagesBetweenUsers, 
    sendMessageLegacy 
} from '../controllers/messages.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

// ROUTE ORDER IS INTENTIONAL — DO NOT REORDER.
// Express matches routes in registration order. The legacy 2-segment GET /:senderId/:receiverId
// MUST be registered before the modern 1-segment GET /:userId, otherwise Express would
// swallow all two-segment paths as /:userId and never reach this handler.
router.get('/:senderId/:receiverId', authenticate, (req, res, next) => {
    const currentUserId = (req.user.id || req.user._id).toString();
    const { senderId, receiverId } = req.params;
    if (currentUserId !== senderId && currentUserId !== receiverId && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Forbidden: You cannot access chat history that does not belong to you.'
        });
    }
    next();
}, getMessagesBetweenUsers);

router.post('/', authenticate, (req, res, next) => {
    const currentUserId = (req.user.id || req.user._id).toString();
    const { senderId } = req.body;
    if (currentUserId !== senderId && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Forbidden: You cannot send messages impersonating another user.'
        });
    }
    next();
}, sendMessageLegacy);

// Protected standard endpoints
router.use(authenticate);
router.get('/', getConversations);
router.get('/:userId', getChatHistory);
router.post('/:userId', sendMessage);

export default router;
