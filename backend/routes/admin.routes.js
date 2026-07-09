import express from 'express';
import {
    getStudentsDirectory,
    getAlumniDirectory,
    getStudentActivity,
    getStudentsActivitySummary,
    getAlumniActivity,
    getAlumniActivitySummary,
    suspendUser,
    reactivateUser,
    getPlatformStats,
    getAdminActivities
} from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

// Apply global admin guards
router.use(authenticate);
router.use(authorize('admin'));

// Platform Stats
router.get('/stats', getPlatformStats);

// User account suspension
router.patch('/users/:id/suspend', suspendUser);
router.patch('/users/:id/reactivate', reactivateUser);

// Student Directories & Analytics
router.get('/students/activity-summary', getStudentsActivitySummary);
router.get('/students/:id/activity', getStudentActivity);
router.get('/students', getStudentsDirectory);

// Alumni Directories & Analytics
router.get('/alumni/activity-summary', getAlumniActivitySummary);
router.get('/alumni/:id/activity', getAlumniActivity);
router.get('/alumni', getAlumniDirectory);

// Admin Action Audit Log (K.12 fix)
router.get('/activities', getAdminActivities);

export default router;
