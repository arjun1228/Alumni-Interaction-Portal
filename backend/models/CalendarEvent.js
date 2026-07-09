import mongoose from 'mongoose';

const calendarEventSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    date: { type: Date, required: true },
    category: { type: String, enum: ['Academic', 'Deadline', 'Event', 'Holiday'], required: true }
}, { timestamps: true });

export const CalendarEvent = mongoose.models.CalendarEvent || mongoose.model('CalendarEvent', calendarEventSchema);
