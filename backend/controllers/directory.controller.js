import { dataStore } from '../services/dataStore.js';
import { serializePayload } from '../utils/roleMapper.js';

export const getDirectory = async (req, res, next) => {
    try {
        const { role, search } = req.query;
        const query = {};

        // Only show students and alumni in public directories (omit admins)
        if (role) {
            query.role = role.toLowerCase();
        } else {
            query.role = { $ne: 'admin' };
        }

        // Support string matching against core fields
        if (search) {
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
