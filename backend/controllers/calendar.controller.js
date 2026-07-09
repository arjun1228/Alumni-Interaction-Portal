import { dataStore } from '../services/dataStore.js';
import { serializePayload } from '../utils/roleMapper.js';

export const getCalendarEvents = async (req, res, next) => {
    try {
        const userId = req.user.id || req.user._id;
        const { includeAll } = req.query;

        let events = await dataStore.find('CalendarEvent', { user: userId });

        if (includeAll !== 'true') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            events = events.filter(e => new Date(e.date) >= today);
        }

        // Sort by date ascending
        events.sort((a, b) => new Date(a.date) - new Date(b.date));

        const mappedEvents = serializePayload(events);

        res.status(200).json({
            success: true,
            data: mappedEvents
        });
    } catch (err) {
        next(err);
    }
};

export const createCalendarEvent = async (req, res, next) => {
    try {
        const userId = req.user.id || req.user._id;
        const { title, date, category } = req.body;

        if (!title || !date || !category) {
            return res.status(400).json({
                success: false,
                message: 'Title, date, and category are required.'
            });
        }

        if (!['Academic', 'Deadline', 'Event', 'Holiday'].includes(category)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category. Must be Academic, Deadline, Event, or Holiday.'
            });
        }

        const eventData = {
            user: userId,
            title,
            date: new Date(date),
            category
        };

        const newEvent = await dataStore.insert('CalendarEvent', eventData);
        res.status(201).json({
            success: true,
            data: serializePayload(newEvent)
        });
    } catch (err) {
        next(err);
    }
};

export const updateCalendarEvent = async (req, res, next) => {
    try {
        const userId = req.user.id || req.user._id;
        const eventId = req.params.id;
        const { title, date, category } = req.body;

        const event = await dataStore.findById('CalendarEvent', eventId);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Calendar event not found.'
            });
        }

        // Ownership check
        if (event.user.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to modify this event.'
            });
        }

        const updates = {};
        if (title !== undefined) updates.title = title;
        if (date !== undefined) updates.date = new Date(date);
        if (category !== undefined) {
            if (!['Academic', 'Deadline', 'Event', 'Holiday'].includes(category)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid category. Must be Academic, Deadline, Event, or Holiday.'
                });
            }
            updates.category = category;
        }

        const updated = await dataStore.update('CalendarEvent', { _id: eventId }, updates);
        res.status(200).json({
            success: true,
            data: serializePayload(updated)
        });
    } catch (err) {
        next(err);
    }
};

export const deleteCalendarEvent = async (req, res, next) => {
    try {
        const userId = req.user.id || req.user._id;
        const eventId = req.params.id;

        const event = await dataStore.findById('CalendarEvent', eventId);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Calendar event not found.'
            });
        }

        // Ownership check
        if (event.user.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this event.'
            });
        }

        await dataStore.remove('CalendarEvent', { _id: eventId });
        res.status(200).json({
            success: true,
            message: 'Calendar event deleted successfully.'
        });
    } catch (err) {
        next(err);
    }
};
