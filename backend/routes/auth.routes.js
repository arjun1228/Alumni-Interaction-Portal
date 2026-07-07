import express from 'express';
import { signupStudent, signupAlumni, login, verifyEmail, getMe } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

router.post('/signup/student', signupStudent);
router.post('/signup/alumni', signupAlumni);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.get('/me', authenticate, getMe);

export default router;
