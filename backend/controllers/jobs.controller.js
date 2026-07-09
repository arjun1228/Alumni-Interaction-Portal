import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { dataStore } from '../services/dataStore.js';
import { serializePayload } from '../utils/roleMapper.js';
import { canModify } from '../utils/permissions.js';
import { logAdminAction } from '../utils/adminLogger.js';

const jobSchemaVal = z.object({
    title: z.string().min(1, 'Job title is required'),
    company: z.string().min(1, 'Company name is required'),
    type: z.enum(['INTERNSHIP', 'FULL_TIME', 'PART_TIME'], {
        errorMap: () => ({ message: 'Job type must be INTERNSHIP, FULL_TIME, or PART_TIME' })
    }),
    description: z.string().min(1, 'Description is required'),
    skillsRequired: z.array(z.string()).default([]),
    location: z.string().min(1, 'Location is required'),
    link: z.string().min(1, 'Application link is required')
});

const mapJobType = (typeQuery) => {
    if (!typeQuery) return null;
    const lower = typeQuery.toLowerCase().replace('-', '_');
    if (lower === 'internship') return 'INTERNSHIP';
    if (lower === 'full_time' || lower === 'fulltime') return 'FULL_TIME';
    if (lower === 'part_time' || lower === 'parttime') return 'PART_TIME';
    return typeQuery.toUpperCase();
};

export const getJobs = async (req, res, next) => {
    try {
        const { type, search } = req.query;
        const query = {};

        if (type && typeof type === 'string') {
            const mappedType = mapJobType(type);
            if (mappedType) {
                query.type = mappedType;
            }
        }

        if (search && typeof search === 'string') {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } },
                { skillsRequired: { $regex: search, $options: 'i' } }
            ];
        }

        let reqUser = null;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                reqUser = decoded;
            } catch (e) {}
        }

        const isAdmin = reqUser && (reqUser.role === 'admin' || reqUser.role === 'ADMIN');

        // Handle status filter: only open by default for public
        if (req.query.status && typeof req.query.status === 'string') {
            if (req.query.status === 'open') {
                query.status = { $ne: 'filled' };
            } else {
                query.status = req.query.status;
            }
        } else if (!isAdmin) {
            query.status = { $ne: 'filled' };
        }

        const jobs = await dataStore.find('Job', query, {
            sort: { createdAt: -1 },
            populate: 'postedBy'
        });

        const mappedJobs = serializePayload(jobs);

        res.status(200).json({
            success: true,
            data: mappedJobs
        });
    } catch (err) {
        next(err);
    }
};

export const getJobById = async (req, res, next) => {
    try {
        const job = await dataStore.findById('Job', req.params.id);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job listing not found.'
            });
        }

        const resolved = await dataStore.find('Job', { _id: req.params.id }, { populate: 'postedBy' });
        const mappedJob = serializePayload(resolved[0] || job);

        res.status(200).json({
            success: true,
            data: mappedJob
        });
    } catch (err) {
        next(err);
    }
};

export const createJob = async (req, res, next) => {
    try {
        const parsed = jobSchemaVal.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                errors: parsed.error.flatten().fieldErrors
            });
        }

        const userId = req.user.id || req.user._id;
        const jobData = {
            ...parsed.data,
            postedBy: userId
        };

        const newJob = await dataStore.insert('Job', jobData);

        // Fetch populated version
        const resolved = await dataStore.find('Job', { _id: newJob._id }, { populate: 'postedBy' });
        const mappedJob = serializePayload(resolved[0] || newJob);

        res.status(201).json({
            success: true,
            data: mappedJob
        });
    } catch (err) {
        next(err);
    }
};

export const updateJob = async (req, res, next) => {
    try {
        const job = await dataStore.findById('Job', req.params.id);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job listing not found.'
            });
        }

        // Access check: posting alumni or admin only
        if (!canModify(job.postedBy, req.user.id || req.user._id, req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access Denied: You do not have permission to modify this listing.'
            });
        }

        const parsed = jobSchemaVal.partial().safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                errors: parsed.error.flatten().fieldErrors
            });
        }

        const updatedJob = await dataStore.update('Job', { _id: req.params.id }, parsed.data);

        if (req.user.role === 'admin') {
            await logAdminAction(req.user.id || req.user._id, 'edit_job', 'Job', req.params.id);
        }

        const resolved = await dataStore.find('Job', { _id: req.params.id }, { populate: 'postedBy' });
        const mappedJob = serializePayload(resolved[0] || updatedJob);

        res.status(200).json({
            success: true,
            data: mappedJob
        });
    } catch (err) {
        next(err);
    }
};

export const deleteJob = async (req, res, next) => {
    try {
        const job = await dataStore.findById('Job', req.params.id);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job listing not found.'
            });
        }

        if (!canModify(job.postedBy, req.user.id || req.user._id, req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access Denied: You do not have permission to delete this listing.'
            });
        }

        await dataStore.remove('Job', { _id: req.params.id });

        if (req.user.role === 'admin') {
            await logAdminAction(req.user.id || req.user._id, 'delete_job', 'Job', req.params.id);
        }

        res.status(200).json({
            success: true,
            message: 'Job listing deleted successfully.'
        });
    } catch (err) {
        next(err);
    }
};

export const applyJob = async (req, res, next) => {
    try {
        const jobId = req.params.id;
        const userId = req.user.id || req.user._id;

        // Verify if job exists
        const job = await dataStore.findById('Job', jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job listing not found.'
            });
        }

        // Check if student has already applied
        const existingApp = await dataStore.findOne('JobApplication', {
            student: userId,
            job: jobId
        });

        if (existingApp) {
            return res.status(200).json({
                success: true,
                message: 'You have already applied to this job.',
                data: existingApp
            });
        }

        const appData = {
            student: userId,
            job: jobId,
            appliedAt: new Date().toISOString()
        };

        const newApp = await dataStore.insert('JobApplication', appData);

        res.status(201).json({
            success: true,
            message: 'Application recorded successfully.',
            data: newApp
        });
    } catch (err) {
        next(err);
    }
};

export const updateJobStatus = async (req, res, next) => {
    try {
        const jobId = req.params.id;
        const job = await dataStore.findById('Job', jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job listing not found.'
            });
        }

        if (!canModify(job.postedBy, req.user.id || req.user._id, req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access Denied: You do not have permission to modify this listing.'
            });
        }

        const { status } = req.body;
        if (status !== 'open' && status !== 'filled') {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value. Must be "open" or "filled".'
            });
        }

        const updatedJob = await dataStore.update('Job', { _id: jobId }, {
            $set: { status }
        });

        if (req.user.role === 'admin') {
            await logAdminAction(req.user.id || req.user._id, `change_job_status_${status}`, 'Job', jobId);
        }

        const resolved = await dataStore.find('Job', { _id: jobId }, { populate: 'postedBy' });
        const mappedJob = serializePayload(resolved[0] || updatedJob);

        res.status(200).json({
            success: true,
            data: mappedJob
        });
    } catch (err) {
        next(err);
    }
};

