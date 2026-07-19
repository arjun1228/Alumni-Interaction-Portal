import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { dataStore } from '../services/dataStore.js';
import { serializePayload } from '../utils/roleMapper.js';
import { sendVerificationEmail } from '../services/emailService.js';

// Schemas for input validation
const passwordSchema = z.string().superRefine((val, ctx) => {
    const errors = [];
    if (val.length < 8) errors.push('Password must be at least 8 characters');
    if (!/[A-Z]/.test(val)) errors.push('Password must contain at least one uppercase letter');
    if (!/[0-9]/.test(val)) errors.push('Password must contain at least one number');
    if (!/[^A-Za-z0-9]/.test(val)) errors.push('Password must contain at least one special character (!@#$%^&*)');
    for (const msg of errors) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: msg });
    }
});

const studentSignupSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address').refine(
        (val) => val.toLowerCase().endsWith('.edu'),
        { message: 'Student accounts require a valid .edu email address' }
    ),
    password: passwordSchema,
    department: z.string().optional(),
    yearOfStudy: z.number().min(1).max(4).nullable().optional(),
    interests: z.array(z.string()).optional(),
    resumeLink: z.string().url('Invalid resume link URL').optional()
});

const alumniSignupSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: passwordSchema,
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

        const studentData = {
            name,
            email: email.toLowerCase(),
            passwordHash,
            role: 'student',
            isVerified: true,
            department: department || '',
            yearOfStudy: yearOfStudy || null,
            interests: interests || [],
            resumeLink: resumeLink || '',
            projectShowcase: []
        };

        const newUser = await dataStore.insert('User', studentData);

        // Seed default calendar events for student
        const now = new Date();
        const event1Date = new Date();
        event1Date.setDate(now.getDate() + 30); // 30 days out
        
        const event2Date = new Date();
        event2Date.setDate(now.getDate() + 45); // 45 days out

        const event3Date = new Date();
        event3Date.setDate(now.getDate() + 90); // 90 days out

        const defaultEvents = [
            {
                user: newUser.id || newUser._id,
                title: 'Mid-Semester Exams',
                date: event1Date,
                category: 'Academic'
            },
            {
                user: newUser.id || newUser._id,
                title: 'Hackathon Registration Deadline',
                date: event2Date,
                category: 'Deadline'
            },
            {
                user: newUser.id || newUser._id,
                title: 'Winter Break Starts',
                date: event3Date,
                category: 'Holiday'
            }
        ];

        for (const e of defaultEvents) {
            await dataStore.insert('CalendarEvent', e);
        }

        // Exclude password from response
        const { passwordHash: _, ...userWithoutPassword } = newUser;
        const cleanUserMapped = serializePayload(userWithoutPassword);

        res.status(201).json({
            success: true,
            message: 'Student account created successfully. You can now log in.',
            data: {
                user: cleanUserMapped
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
            approvalStatus: 'pending',
            referenceToken
        };

        const newUser = await dataStore.insert('User', alumniData);

        const { passwordHash: _, ...userWithoutPassword } = newUser;
        const cleanUserMapped = serializePayload(userWithoutPassword);

        res.status(201).json({
            success: true,
            message: 'Registration successful. Your account is pending admin approval.',
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

export const resendVerification = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const user = await dataStore.findOne('User', { email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No student account found with this email address.'
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'This email is already verified. You can log in.'
            });
        }

        const verificationToken = user.verificationToken || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        if (!user.verificationToken) {
            await dataStore.update('User', { _id: user._id }, {
                $set: { verificationToken }
            });
        }

        await sendVerificationEmail(email.toLowerCase(), verificationToken);

        res.status(200).json({
            success: true,
            message: 'Verification email resent successfully.'
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
