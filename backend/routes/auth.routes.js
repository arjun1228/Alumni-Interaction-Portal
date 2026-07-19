import express from 'express';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { signupStudent, signupAlumni, login, verifyEmail, resendVerification, getMe } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { dataStore } from '../services/dataStore.js';

const router = express.Router();

// Configure Google Strategy if client credentials exist
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails[0].value.toLowerCase();
            const name = profile.displayName || profile.name?.givenName || 'Google User';
            
            // Check if user already exists
            let user = await dataStore.findOne('User', { email });
            
            if (!user) {
                // Determine role: default to student if email matches .edu, .edu.in or .ac.in
                const isEdu = email.endsWith('.edu') || email.endsWith('.edu.in') || email.endsWith('.ac.in');
                const role = 'student'; // Default role
                const needsRoleSelection = !isEdu;
                
                // Create a random password since passwordHash is required
                const randomPassword = Math.random().toString(36).substring(2, 10) + '!A1';
                const passwordHash = await bcrypt.hash(randomPassword, 10);
                
                const googleUserData = {
                    name,
                    email,
                    passwordHash,
                    role,
                    isVerified: true, // Google accounts are pre-verified
                    needsRoleSelection,
                    approvalStatus: isEdu ? 'approved' : 'pending', // Pending approval if alumni (though we default to student first)
                    status: 'active',
                    interests: [],
                    skills: []
                };
                
                user = await dataStore.insert('User', googleUserData);
            }
            
            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }));
}

// Limit login requests to 10 per 15 minutes per IP
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: {
        success: false,
        message: 'Too many login attempts from this IP, please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Looser limit for signups/verifications: 20 per 15 minutes per IP
const signupLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: {
        success: false,
        message: 'Too many signup attempts from this IP, please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

router.post('/signup/student', signupLimiter, signupStudent);
router.post('/signup/alumni', signupLimiter, signupAlumni);
router.post('/login', loginLimiter, login);
router.post('/verify-email', signupLimiter, verifyEmail);
router.post('/resend-verification', signupLimiter, resendVerification);
router.get('/me', authenticate, getMe);

// Google Sign-In Routes
router.get('/google', (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return res.status(400).json({
            success: false,
            message: 'Google Sign-In is not configured. Please define GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment.'
        });
    }
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/?error=not_configured`);
    }
    passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/?error=google_failed` }, async (err, user) => {
        if (err || !user) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/?error=google_failed`);
        }
        // Generate JWT
        const token = jwt.sign(
            { id: user.id || user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/?token=${token}`);
    })(req, res, next);
});

// Google One Tap Token Sign-In Endpoint
router.post('/google/one-tap', async (req, res) => {
    const { credential } = req.body;
    if (!credential) {
        return res.status(400).json({ success: false, message: 'Google credential token is required.' });
    }

    try {
        // Verify token with Google API tokeninfo endpoint
        const verifyResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        const payload = await verifyResponse.json();

        if (!verifyResponse.ok || payload.error) {
            return res.status(400).json({ success: false, message: 'Invalid Google credential token.' });
        }

        // Verify the client ID matches
        if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
            return res.status(400).json({ success: false, message: 'Client ID mismatch.' });
        }

        const email = payload.email.toLowerCase();
        const name = payload.name || 'Google User';
        const avatar = payload.picture;

        // Check if user already exists
        let user = await dataStore.findOne('User', { email });

        if (!user) {
            // Determine role: default to student if email matches .edu, .edu.in or .ac.in
            const isAcademic = email.endsWith('.edu') || email.endsWith('.edu.in') || email.endsWith('.ac.in');
            const role = 'student';
            const needsRoleSelection = !isAcademic;

            const randomPassword = Math.random().toString(36).substring(2, 10) + '!A1';
            const passwordHash = await bcrypt.hash(randomPassword, 10);

            const googleUserData = {
                name,
                email,
                passwordHash,
                role,
                isVerified: true, // Google accounts are pre-verified
                needsRoleSelection,
                approvalStatus: isAcademic ? 'approved' : 'pending',
                status: 'active',
                avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
                interests: [],
                skills: []
            };

            user = await dataStore.insert('User', googleUserData);
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id || user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id || user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar || avatar,
                needsRoleSelection: user.needsRoleSelection,
                approvalStatus: user.approvalStatus
            }
        });
    } catch (err) {
        console.error('One Tap Auth error:', err);
        res.status(500).json({ success: false, message: 'Google One Tap authentication failed.' });
    }
});

export default router;
