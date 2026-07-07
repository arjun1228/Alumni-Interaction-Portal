import express from 'express';
import { getJobs, getJobById, createJob, updateJob, deleteJob, applyJob, updateJobStatus } from '../controllers/jobs.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize, alumniApproved } from '../middleware/authorize.js';

const router = express.Router();

router.get('/', getJobs);
router.get('/:id', getJobById);

// Create Job: Protected, restricted to approved alumni only
router.post('/', authenticate, authorize('alumni'), alumniApproved, createJob);

// Apply to Job: Protected, open to students/alumni
router.post('/:id/apply', authenticate, applyJob);

// Edit/Delete: Protected (owner or admin check handled in controller)
router.patch('/:id', authenticate, updateJob);
router.put('/:id', authenticate, updateJob);
router.patch('/:id/status', authenticate, updateJobStatus);
router.delete('/:id', authenticate, deleteJob);

export default router;
