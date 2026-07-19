import { dataStore } from '../services/dataStore.js';
import { serializePayload } from '../utils/roleMapper.js';

export const getDirectory = async (req, res, next) => {
    try {
        const { role, search } = req.query;
        const query = {};

        // Only show students and alumni in public directories (omit admins)
        if (role && typeof role === 'string') {
            query.role = role.toLowerCase();
        } else {
            query.role = { $ne: 'admin' };
        }

        // Support string matching against core fields
        if (search && typeof search === 'string') {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { skills: { $regex: search, $options: 'i' } },
                { jobTitle: { $regex: search, $options: 'i' } },
                { department: { $regex: search, $options: 'i' } },
                { currentCompany: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await dataStore.find('User', query);

        // Exclude password hashes
        const cleanedUsers = users.map(u => {
            const { passwordHash, ...clean } = u;
            return clean;
        });
        
        const mappedUsers = serializePayload(cleanedUsers);

        res.status(200).json({
            success: true,
            data: mappedUsers
        });
    } catch (err) {
        next(err);
    }
};

export const getProfileById = async (req, res, next) => {
    try {
        const user = await dataStore.findById('User', req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User profile not found.'
            });
        }

        const { passwordHash, ...cleanUser } = user;
        const mappedUser = serializePayload(cleanUser);

        res.status(200).json({
            success: true,
            data: mappedUser
        });
    } catch (err) {
        next(err);
    }
};

export const updateProfile = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const updates = req.body;

        // Strip out read-only fields
        delete updates.email;
        delete updates.passwordHash;
        delete updates.role;

        // Map frontend fields to DB schema fields
        if (updates.company !== undefined) {
            updates.currentCompany = updates.company;
            delete updates.company;
        }
        if (updates.title !== undefined) {
            updates.jobTitle = updates.title;
            delete updates.title;
        }
        if (updates.projects !== undefined) {
            updates.projectShowcase = updates.projects;
            delete updates.projects;
        }
        if (updates.bio !== undefined) {
            updates.professionalBio = updates.bio;
            delete updates.bio;
        }

        const updated = await dataStore.update('User', { _id: userId }, updates);
        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        const { passwordHash, ...cleanUser } = updated;
        const mappedUser = serializePayload(cleanUser);
        res.status(200).json({
            success: true,
            data: mappedUser
        });
    } catch (err) {
        next(err);
    }
};

export const selectGoogleUserRole = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const currentUserId = (req.user.id || req.user._id).toString();
        if (currentUserId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: You cannot select role for another user.'
            });
        }
        
        const user = await dataStore.findById('User', userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }
        
        if (!user.needsRoleSelection) {
            return res.status(400).json({
                success: false,
                message: 'Role has already been selected.'
            });
        }
        
        const { role, department, yearOfStudy, currentCompany, jobTitle } = req.body;
        if (!['student', 'alumni'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role selection. Must be student or alumni.'
            });
        }
        
        const updates = {
            role,
            needsRoleSelection: false
        };
        
        if (role === 'student') {
            updates.department = department || '';
            updates.yearOfStudy = yearOfStudy ? parseInt(yearOfStudy) : null;
            updates.approvalStatus = 'approved';
            updates.isVerified = true;
        } else if (role === 'alumni') {
            updates.currentCompany = currentCompany || '';
            updates.jobTitle = jobTitle || 'Alumni Member';
            updates.approvalStatus = 'pending';
            updates.isVerified = true;
        }
        
        const updated = await dataStore.update('User', { _id: userId }, { $set: updates });
        
        const { passwordHash: _, ...cleanUser } = updated;
        const mappedUser = serializePayload(cleanUser);
        
        res.status(200).json({
            success: true,
            message: 'Role selected successfully.',
            data: mappedUser
        });
    } catch (err) {
        next(err);
    }
};
