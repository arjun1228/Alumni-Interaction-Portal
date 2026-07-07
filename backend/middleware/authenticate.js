import jwt from 'jsonwebtoken';
import { dataStore } from '../services/dataStore.js';

export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access Denied: No token provided.'
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch user from abstraction layer
        const user = await dataStore.findById('User', decoded.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Access Denied: Invalid credentials.'
            });
        }

        if (user.status === 'suspended') {
            return res.status(403).json({
                success: false,
                message: 'This account has been suspended. Contact your administrator.'
            });
        }

        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Access Denied: Token expired.'
            });
        }
        return res.status(401).json({
            success: false,
            message: 'Access Denied: Session expired or invalid token.'
        });
    }
};
