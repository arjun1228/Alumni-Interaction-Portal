import express from 'express';
import rateLimit from 'express-rate-limit';
import { signupStudent, signupAlumni, login, verifyEmail, getMe } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

// Limit authentication requests to 10 per 15 minutes per IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: {
        success: false,
        message: 'Too many authentication attempts from this IP, please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

router.post('/signup/student', authLimiter, signupStudent);
router.post('/signup/alumni', authLimiter, signupAlumni);
router.post('/login', authLimiter, login);
router.post('/verify-email', authLimiter, verifyEmail);
router.get('/me', authenticate, getMe);

export default router;
