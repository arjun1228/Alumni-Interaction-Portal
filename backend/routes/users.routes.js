import express from 'express';
import { login } from '../controllers/auth.controller.js';
import { getDirectory, getProfileById, updateProfile } from '../controllers/directory.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

// Login Legacy Endpoint
router.post('/login', login);

// Directory Legacy Endpoints
router.get('/', getDirectory);
router.get('/:id', getProfileById);

// Secured profile updates (ownership check)
router.put('/:id', authenticate, (req, res, next) => {
    const currentUserId = (req.user.id || req.user._id).toString();
    const targetUserId = req.params.id;
    if (currentUserId !== targetUserId && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Forbidden: You cannot edit another user\'s profile details.'
        });
    }
    next();
}, updateProfile);

export default router;
