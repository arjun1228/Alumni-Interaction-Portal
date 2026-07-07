import express from 'express';
import { handleResumeReview, handleInterviewPrep, handleSkillGapAnalysis } from '../controllers/mentor.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

// Require authorization for mentor tasks
router.use(authenticate);

router.post('/resume', handleResumeReview);
router.post('/interview', handleInterviewPrep);
router.post('/skills', handleSkillGapAnalysis);

export default router;
