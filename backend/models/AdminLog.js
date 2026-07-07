import mongoose from 'mongoose';

const adminLogSchema = new mongoose.Schema({
    adminId: { type: String, required: true },
    action: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export const AdminLog = mongoose.models.AdminLog || mongoose.model('AdminLog', adminLogSchema);
