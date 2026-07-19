import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    link: String,
    technologies: [String]
});

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['student', 'alumni', 'admin'], required: true },
    profilePicture: String,
    isVerified: { type: Boolean, default: false },
    verificationToken: String,
    lastLoginAt: Date,
    resumeLink: String,
    resumeName: String,
    location: String,
    
    // Student-specific fields
    department: String,
    course: String,
    yearOfStudy: Number,
    interests: [String],
    resumeLink: String,
    projectShowcase: [projectSchema],
    
    // Alumni-specific fields
    currentCompany: String,
    jobTitle: String,
    yearsOfExperience: String,
    professionalBio: String,
    skills: [String],
    willingToMentor: [String],
    approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    referenceToken: String,
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    reason: String
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model('User', userSchema);
