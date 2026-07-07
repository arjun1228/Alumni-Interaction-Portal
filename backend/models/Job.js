import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    company: { type: String, required: true },
    type: { type: String, enum: ['INTERNSHIP', 'FULL_TIME', 'PART_TIME'], required: true },
    description: { type: String, required: true },
    skillsRequired: [String],
    location: { type: String, required: true },
    link: String,
    status: { type: String, enum: ['open', 'filled'], default: 'open' }
}, { timestamps: true });

export const Job = mongoose.models.Job || mongoose.model('Job', jobSchema);
