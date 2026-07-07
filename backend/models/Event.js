import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    type: { type: String, enum: ['WEBINAR', 'HACKATHON', 'WORKSHOP', 'MEETUP'], required: true },
    description: { type: String, required: true },
    coverImage: String,
    dateTime: { type: Date, required: true },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    attendeeCount: { type: Number, default: 0 }
}, { timestamps: true });

export const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);
