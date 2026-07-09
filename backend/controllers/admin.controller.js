import { dataStore } from '../services/dataStore.js';
import { serializeUser, serializePayload } from '../utils/roleMapper.js';
import { isMongoConnected } from '../config/db.js';
import { logAdminAction } from '../utils/adminLogger.js';

// Helper: Parse pagination query params
const getPaginationOptions = (req) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Sorting
    const sortField = req.query.sort === 'name' ? 'name' : 'createdAt';
    const sortOrder = sortField === 'name' ? 1 : -1; // Alphabetical ascending vs Newest descending

    return {
        skip,
        limit,
        sort: { [sortField]: sortOrder }
    };
};

// 1. Student Directory (Admin-only)
export const getStudentsDirectory = async (req, res, next) => {
    try {
        const { search } = req.query;
        const query = { role: 'student' };

        if (search && typeof search === 'string') {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { department: { $regex: search, $options: 'i' } }
            ];
        }

        const options = getPaginationOptions(req);
        const rawStudents = await dataStore.find('User', query, options);
        
        // Exclude passwords & serialize roles
        const serialized = serializePayload(rawStudents);

        res.status(200).json({
            success: true,
            data: serialized
        });
    } catch (err) {
        next(err);
    }
};

// 2. Alumni Directory (Admin-only)
export const getAlumniDirectory = async (req, res, next) => {
    try {
        const { search, status } = req.query;
        const query = { role: 'alumni' };

        if (status && typeof status === 'string') {
            query.approvalStatus = status;
        }

        if (search && typeof search === 'string') {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { currentCompany: { $regex: search, $options: 'i' } },
                { jobTitle: { $regex: search, $options: 'i' } }
            ];
        }

        const options = getPaginationOptions(req);
        const rawAlumni = await dataStore.find('User', query, options);
        
        const serialized = serializePayload(rawAlumni);

        res.status(200).json({
            success: true,
            data: serialized
        });
    } catch (err) {
        next(err);
    }
};

// Stats calculation helper for a student
const calculateStudentStats = async (student) => {
    const studentId = (student.id || student._id).toString();

    // 1. eventsRegistered: count where studentId is in attendees list
    const events = await dataStore.find('Event', { attendees: studentId });

    // 2. jobsAppliedCount: count where student is studentId
    const applications = await dataStore.find('JobApplication', { student: studentId });

    return {
        studentId,
        id: studentId,
        name: student.name,
        email: student.email,
        department: student.department,
        yearOfStudy: student.yearOfStudy,
        avatar: student.avatar || student.profilePicture || null,
        registrationDate: student.createdAt,
        createdAt: student.createdAt,
        isVerified: student.isVerified || false,
        eventsRegistered: events.length,
        jobsAppliedCount: applications.length,
        lastActive: student.lastLoginAt || student.updatedAt || student.createdAt
    };
};

// Stats calculation helper for an alumni
const calculateAlumniStats = async (alumni) => {
    const alumniId = (alumni.id || alumni._id).toString();

    // 1. eventsCreated: count where organizer matches alumniId
    const events = await dataStore.find('Event', { organizer: alumniId });

    // 2. jobsPosted: count where postedBy matches alumniId
    const jobs = await dataStore.find('Job', { postedBy: alumniId });

    // 3. totalRSVPsAcrossEvents: sum of attendees array length
    const totalRSVPs = events.reduce((sum, e) => sum + (e.attendees ? e.attendees.length : 0), 0);

    return {
        alumniId,
        id: alumniId,
        name: alumni.name,
        email: alumni.email,
        currentCompany: alumni.currentCompany,
        jobTitle: alumni.jobTitle,
        title: alumni.jobTitle,
        company: alumni.currentCompany,
        avatar: alumni.avatar || alumni.profilePicture || null,
        approvalStatus: alumni.approvalStatus || 'pending',
        eventsCreated: events.length,
        jobsPosted: jobs.length,
        totalRSVPsAcrossEvents: totalRSVPs,
        lastActive: alumni.lastLoginAt || alumni.updatedAt || alumni.createdAt,
        createdAt: alumni.createdAt
    };
};

// 3. Single Student Activity Stats
export const getStudentActivity = async (req, res, next) => {
    try {
        const student = await dataStore.findById('User', req.params.id);
        if (!student || student.role !== 'student') {
            return res.status(404).json({
                success: false,
                message: 'Student user not found.'
            });
        }

        const stats = await calculateStudentStats(student);

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (err) {
        next(err);
    }
};

// 4. Bulk Students Activity Summary (paginated)
export const getStudentsActivitySummary = async (req, res, next) => {
    try {
        const { search } = req.query;
        const query = { role: 'student' };

        if (search && typeof search === 'string') {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const options = getPaginationOptions(req);
        const rawStudents = await dataStore.find('User', query, options);
        
        const summaryPromises = rawStudents.map(student => calculateStudentStats(student));
        const summaries = await Promise.all(summaryPromises);

        res.status(200).json({
            success: true,
            data: summaries
        });
    } catch (err) {
        next(err);
    }
};

// 5. Single Alumni Activity Stats
export const getAlumniActivity = async (req, res, next) => {
    try {
        const alumni = await dataStore.findById('User', req.params.id);
        if (!alumni || alumni.role !== 'alumni') {
            return res.status(404).json({
                success: false,
                message: 'Alumni user not found.'
            });
        }

        const stats = await calculateAlumniStats(alumni);

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (err) {
        next(err);
    }
};

// 6. Bulk Alumni Activity Summary (paginated)
export const getAlumniActivitySummary = async (req, res, next) => {
    try {
        const { search, status } = req.query;
        const query = { role: 'alumni' };

        if (status && typeof status === 'string') {
            query.approvalStatus = status;
        }

        if (search && typeof search === 'string') {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const options = getPaginationOptions(req);
        const rawAlumni = await dataStore.find('User', query, options);
        
        const summaryPromises = rawAlumni.map(alumni => calculateAlumniStats(alumni));
        const summaries = await Promise.all(summaryPromises);

        res.status(200).json({
            success: true,
            data: summaries
        });
    } catch (err) {
        next(err);
    }
};

export const suspendUser = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const user = await dataStore.findById('User', userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        const { reason } = req.body;
        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Suspension reason is required.'
            });
        }

        const updatedUser = await dataStore.update('User', { _id: userId }, {
            $set: { status: 'suspended', reason }
        });

        await logAdminAction(req.user.id || req.user._id, 'suspend_user', 'User', userId);

        res.status(200).json({
            success: true,
            message: 'User suspended successfully.',
            data: serializeUser(updatedUser)
        });
    } catch (err) {
        next(err);
    }
};

export const reactivateUser = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const user = await dataStore.findById('User', userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        const updatedUser = await dataStore.update('User', { _id: userId }, {
            $set: { status: 'active' },
            $unset: { reason: '' }
        });

        await logAdminAction(req.user.id || req.user._id, 'reactivate_user', 'User', userId);

        res.status(200).json({
            success: true,
            message: 'User reactivated successfully.',
            data: serializeUser(updatedUser)
        });
    } catch (err) {
        next(err);
    }
};

export const getPlatformStats = async (req, res, next) => {
    try {
        const totalStudents = await dataStore.find('User', { role: 'student' });
        const totalAlumni = await dataStore.find('User', { role: 'alumni' });
        const pendingAlumniApprovals = await dataStore.find('User', { role: 'alumni', approvalStatus: 'pending' });
        const suspendedAccounts = await dataStore.find('User', { status: 'suspended' });

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const dateStr = sevenDaysAgo.toISOString();

        const postsThisWeek = await dataStore.find('Post', { createdAt: { $gte: dateStr } });
        const jobsThisWeek = await dataStore.find('Job', { createdAt: { $gte: dateStr } });
        const eventsThisWeek = await dataStore.find('Event', { createdAt: { $gte: dateStr } });

        // Cloudinary health check
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;
        const isCloudinaryConfigured = !!(cloudName && apiKey && apiSecret && cloudName !== 'your_cloud_name');

        const systemHealth = {
            mongo: isMongoConnected() ? 'connected' : 'disconnected',
            cloudinary: isCloudinaryConfigured ? 'configured' : 'unconfigured'
        };

        res.status(200).json({
            success: true,
            data: {
                totalStudents: totalStudents.length,
                totalAlumni: totalAlumni.length,
                pendingAlumniApprovals: pendingAlumniApprovals.length,
                postsThisWeek: postsThisWeek.length,
                jobsThisWeek: jobsThisWeek.length,
                eventsThisWeek: eventsThisWeek.length,
                suspendedAccounts: suspendedAccounts.length,
                systemHealth
            }
        });
    } catch (err) {
        next(err);
    }
};

// Admin Activity Log — reads from AdminLog collection (K.12 fix)
export const getAdminActivities = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const { search } = req.query;

        const query = {};
        if (search && typeof search === 'string') {
            query.$or = [
                { action: { $regex: search, $options: 'i' } },
                { targetType: { $regex: search, $options: 'i' } },
                { adminId: { $regex: search, $options: 'i' } }
            ];
        }

        const logs = await dataStore.find('AdminLog', query, {
            sort: { createdAt: -1 },
            skip,
            limit
        });

        res.status(200).json({
            success: true,
            data: logs,
            page,
            limit
        });
    } catch (err) {
        next(err);
    }
};
