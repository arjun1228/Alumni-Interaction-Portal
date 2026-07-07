import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { dataStore } from '../services/dataStore.js';
import { serializePayload } from '../utils/roleMapper.js';

// Schemas for input validation
const studentSignupSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address').refine(
        (val) => val.toLowerCase().endsWith('.edu'),
        { message: 'Student accounts require a valid .edu email address' }
    ),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    department: z.string().optional(),
    yearOfStudy: z.number().min(1).max(4).optional(),
    interests: z.array(z.string()).optional(),
    resumeLink: z.string().url('Invalid resume link URL').optional()
});

const alumniSignupSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    currentCompany: z.string().min(1, 'Company is required'),
    jobTitle: z.string().min(1, 'Job Title is required'),
    yearsOfExperience: z.string().optional(),
    professionalBio: z.string().optional(),
    skills: z.array(z.string()).optional()
});

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
    role: z.enum(['student', 'alumni', 'admin', 'UNDERGRADUATE', 'GRADUATE', 'ADMIN']).optional()
});

export const signupStudent = async (req, res, next) => {
    try {
        const parsed = studentSignupSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                errors: parsed.error.flatten().fieldErrors
            });
        }

        const { name, email, password, department, yearOfStudy, interests, resumeLink } = parsed.data;

        // Check if user already exists
        const existingUser = await dataStore.findOne('User', { email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email address is already in use'
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Verification token for simulated email flow
        const verificationToken = Math.random().toString(36).substr(2, 8).toUpperCase();

        const studentData = {
            name,
            email: email.toLowerCase(),
            passwordHash,
            role: 'student',
            isVerified: false,
            verificationToken,
            department: department || 'Computer Science',
            yearOfStudy: yearOfStudy || 1,
            interests: interests || [],
            resumeLink: resumeLink || '',
            projectShowcase: []
        };

        const newUser = await dataStore.insert('User', studentData);

        // Exclude password from response
        const { passwordHash: _, ...userWithoutPassword } = newUser;
        const cleanUserMapped = serializePayload(userWithoutPassword);

        res.status(201).json({
            success: true,
            message: 'Student account created. Please verify your email.',
            data: {
                user: cleanUserMapped,
                verificationToken // Returned for simulated frontend verification screen
            }
        });
    } catch (err) {
        next(err);
    }
};

export const signupAlumni = async (req, res, next) => {
    try {
        const parsed = alumniSignupSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                errors: parsed.error.flatten().fieldErrors
            });
        }

        const { name, email, password, currentCompany, jobTitle, yearsOfExperience, professionalBio, skills } = parsed.data;

        // Check if user already exists
        const existingUser = await dataStore.findOne('User', { email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email address is already in use'
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Generate approval reference token (ALUM-XXXX where XXXX is 4 random uppercase chars)
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const referenceToken = `ALUM-${code}`;

        const alumniData = {
            name,
            email: email.toLowerCase(),
            passwordHash,
            role: 'alumni',
            isVerified: true, // Simulating auto email verification for alumni
            currentCompany,
            jobTitle,
            yearsOfExperience: yearsOfExperience || '1 Year',
            professionalBio: professionalBio || '',
            skills: skills || [],
            approvalStatus: 'approved',
            referenceToken
        };

        const newUser = await dataStore.insert('User', alumniData);

        const { passwordHash: _, ...userWithoutPassword } = newUser;
        const cleanUserMapped = serializePayload(userWithoutPassword);

        res.status(201).json({
            success: true,
            message: 'Alumni registration received and pending approval.',
            data: {
                user: cleanUserMapped,
                referenceToken
            }
        });
    } catch (err) {
        next(err);
    }
};

export const login = async (req, res, next) => {
    try {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                errors: parsed.error.flatten().fieldErrors
            });
        }

        const { email, password } = parsed.data;

        // Find user
        const user = await dataStore.findOne('User', { email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // Verify password supporting plaintext migration
        let isMatch = false;
        const credential = user.passwordHash || user.password;
        const isBcryptHash = typeof credential === 'string' && /^(\$2[aby]\$)/.test(credential) && credential.length === 60;

        if (isBcryptHash) {
            isMatch = await bcrypt.compare(password, credential);
        } else if (credential) {
            isMatch = (password === credential);
            if (isMatch) {
                // Migrate to bcrypt hash
                const passwordHash = await bcrypt.hash(password, 10);
                await dataStore.update('User', { _id: user.id || user._id }, {
                    $set: { passwordHash },
                    $unset: { password: '' }
                });
                user.passwordHash = passwordHash;
            }
        }

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        if (user.status === 'suspended') {
            return res.status(403).json({
                success: false,
                message: 'This account has been suspended. Contact your administrator.'
            });
        }

        // Block pending/rejected alumni logins
        if (user.role === 'alumni' && user.approvalStatus !== 'approved') {
            return res.status(403).json({
                success: false,
                message: 'Your alumni account is pending admin approval.'
            });
        }

        // Update last login date
        const lastLoginAt = new Date();
        await dataStore.update('User', { _id: user.id || user._id }, { $set: { lastLoginAt } });
        user.lastLoginAt = lastLoginAt;

        // Generate JWT
        const token = jwt.sign(
            { id: user.id || user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        const { passwordHash: _, ...userWithoutPassword } = user;
        const cleanUserMapped = serializePayload(userWithoutPassword);

        return res.status(200).json({
            success: true,
            data: {
                token,
                user: cleanUserMapped
            }
        });
    } catch (err) {
        next(err);
    }
};

export const verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Verification token is required'
            });
        }

        const user = await dataStore.findOne('User', { verificationToken: token });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token.'
            });
        }

        // Update verification flags
        await dataStore.update('User', { _id: user._id }, {
            $set: { isVerified: true },
            $unset: { verificationToken: '' }
        });

        res.status(200).json({
            success: true,
            message: 'Email verified successfully! You can now log in.'
        });
    } catch (err) {
        next(err);
    }
};

export const getMe = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Authentication required.'
            });
        }

        const { passwordHash: _, ...userWithoutPassword } = req.user;
        const cleanUserMapped = serializePayload(userWithoutPassword);

        res.status(200).json({
            success: true,
            data: cleanUserMapped
        });
    } catch (err) {
        next(err);
    }
};
