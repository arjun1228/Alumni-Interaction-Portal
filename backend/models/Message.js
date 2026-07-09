import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, default: '' },
    readStatus: { type: Boolean, default: false },
    attachmentName: { type: String },
    attachmentType: { type: String }
}, { timestamps: true });

export const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);
