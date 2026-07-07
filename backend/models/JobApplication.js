import mongoose from 'mongoose';

const jobApplicationSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    appliedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const JobApplication = mongoose.models.JobApplication || mongoose.model('JobApplication', jobApplicationSchema);
