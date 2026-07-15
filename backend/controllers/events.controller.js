import { z } from 'zod';
import { dataStore } from '../services/dataStore.js';
import { serializePayload } from '../utils/roleMapper.js';
import { canModify } from '../utils/permissions.js';
import { logAdminAction } from '../utils/adminLogger.js';
import { generateCompletion } from '../services/groqService.js';

const eventSchemaVal = z.object({
    title: z.string().min(1, 'Event title is required'),
    type: z.enum(['WEBINAR', 'HACKATHON', 'WORKSHOP', 'MEETUP'], {
        errorMap: () => ({ message: 'Event type must be WEBINAR, HACKATHON, WORKSHOP, or MEETUP' })
    }),
    description: z.string().min(1, 'Description is required'),
    dateTime: z.string().refine(val => {
        const parsed = Date.parse(val);
        if (isNaN(parsed)) return false;
        const year = new Date(parsed).getFullYear();
        const currentYear = new Date().getFullYear();
        return year >= currentYear && year <= currentYear + 5;
    }, {
        message: 'Event date must be within the current year and the next 5 years'
    })
});

export const getEvents = async (req, res, next) => {
    try {
        const { type } = req.query;
        const query = {};

        if (type && typeof type === 'string') {
            query.type = type.toUpperCase();
        }

        const events = await dataStore.find('Event', query, {
            sort: { dateTime: 1 },
            populate: 'organizer'
        });

        const mappedEvents = serializePayload(events);

        res.status(200).json({
            success: true,
            data: mappedEvents
        });
    } catch (err) {
        next(err);
    }
};

export const getEventById = async (req, res, next) => {
    try {
        const event = await dataStore.findById('Event', req.params.id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found.'
            });
        }

        const resolved = await dataStore.find('Event', { _id: req.params.id }, { populate: 'organizer' });
        const mappedEvent = serializePayload(resolved[0] || event);

        res.status(200).json({
            success: true,
            data: mappedEvent
        });
    } catch (err) {
        next(err);
    }
};

export const createEvent = async (req, res, next) => {
    try {
        // Parse fields (sometimes fields are sent as strings in multipart form data)
        const parsed = eventSchemaVal.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                errors: parsed.error.flatten().fieldErrors
            });
        }

        const userId = req.user.id || req.user._id;

        const coverImage = req.body.coverImage || 'https://picsum.photos/seed/default/600/300';

        const eventData = {
            ...parsed.data,
            organizer: userId,
            coverImage,
            attendees: []
        };

        const newEvent = await dataStore.insert('Event', eventData);
        const resolved = await dataStore.find('Event', { _id: newEvent._id }, { populate: 'organizer' });
        const mappedEvent = serializePayload(resolved[0] || newEvent);

        res.status(201).json({
            success: true,
            data: mappedEvent
        });
    } catch (err) {
        next(err);
    }
};

export const rsvpEvent = async (req, res, next) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.id || req.user._id;

        const event = await dataStore.findById('Event', eventId);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found.'
            });
        }

        const attendeesList = event.attendees || [];
        const hasRSVPed = attendeesList.some(id => id.toString() === userId.toString());

        if (hasRSVPed) {
            return res.status(400).json({
                success: false,
                message: 'You have already RSVPed for this event.'
            });
        }

        const updatedEvent = await dataStore.update('Event', { _id: eventId }, {
            $push: { attendees: userId }
        });

        const resolved = await dataStore.find('Event', { _id: eventId }, { populate: 'organizer' });
        const mappedEvent = serializePayload(resolved[0] || updatedEvent);

        res.status(200).json({
            success: true,
            data: mappedEvent
        });
    } catch (err) {
        next(err);
    }
};

export const getAttendees = async (req, res, next) => {
    try {
        const eventId = req.params.id;
        const event = await dataStore.findById('Event', eventId);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found.'
            });
        }

        // Access check: organizer or admin only
        const isOrganizer = event.organizer && event.organizer.toString() === (req.user.id || req.user._id).toString();
        const isAdmin = req.user.role === 'admin';
        if (!isOrganizer && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Access Denied: Only the organizer or admin can inspect the guest list.'
            });
        }

        const attendeesIds = event.attendees || [];
        const users = await dataStore.find('User', { _id: { $in: attendeesIds } });

        // Exclude passwords
        const cleanedUsers = users.map(u => {
            const { passwordHash, ...clean } = u;
            return clean;
        });

        const mappedAttendees = serializePayload(cleanedUsers);

        res.status(200).json({
            success: true,
            data: mappedAttendees
        });
    } catch (err) {
        next(err);
    }
};

export const deleteEvent = async (req, res, next) => {
    try {
        const eventId = req.params.id;
        const event = await dataStore.findById('Event', eventId);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found.'
            });
        }

        if (!canModify(event.organizer, req.user.id || req.user._id, req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access Denied: You do not have permission to delete this event.'
            });
        }

        await dataStore.remove('Event', { _id: eventId });

        if (req.user.role === 'admin') {
            await logAdminAction(req.user.id || req.user._id, 'delete_event', 'Event', eventId);
        }

        res.status(200).json({
            success: true,
            message: 'Event deleted successfully.'
        });
    } catch (err) {
        next(err);
    }
};

export const updateEvent = async (req, res, next) => {
    try {
        const eventId = req.params.id;
        const event = await dataStore.findById('Event', eventId);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found.'
            });
        }

        if (!canModify(event.organizer, req.user.id || req.user._id, req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access Denied: You do not have permission to modify this event.'
            });
        }

        const parsed = eventSchemaVal.partial().safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                errors: parsed.error.flatten().fieldErrors
            });
        }

        const updateData = { ...parsed.data };
        if (req.body.coverImage) {
            updateData.coverImage = req.body.coverImage;
        }

        const updatedEvent = await dataStore.update('Event', { _id: eventId }, {
            $set: updateData
        });

        if (req.user.role === 'admin') {
            await logAdminAction(req.user.id || req.user._id, 'edit_event', 'Event', eventId);
        }

        const resolved = await dataStore.find('Event', { _id: eventId }, { populate: 'organizer' });
        const mappedEvent = serializePayload(resolved[0] || updatedEvent);

        res.status(200).json({
            success: true,
            data: mappedEvent
        });
    } catch (err) {
        next(err);
    }
};

export const removeAttendee = async (req, res, next) => {
    try {
        const { id, userId } = req.params;
        const event = await dataStore.findById('Event', id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found.'
            });
        }

        // Verify if attendee is in list
        const attendeesList = event.attendees || [];
        const isAttendee = attendeesList.some(attId => attId.toString() === userId.toString());
        if (!isAttendee) {
            return res.status(400).json({
                success: false,
                message: 'User is not RSVPed to this event.'
            });
        }

        const updatedEvent = await dataStore.update('Event', { _id: id }, {
            $pull: { attendees: userId }
        });

        await logAdminAction(req.user.id || req.user._id, 'remove_attendee', 'EventAttendee', userId);

        const resolved = await dataStore.find('Event', { _id: id }, { populate: 'organizer' });
        const mappedEvent = serializePayload(resolved[0] || updatedEvent);

        res.status(200).json({
            success: true,
            data: mappedEvent
        });
    } catch (err) {
        next(err);
    }
};

// Self-service un-RSVP: any authenticated user can cancel their own RSVP
export const cancelRsvp = async (req, res, next) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.id || req.user._id;

        const event = await dataStore.findById('Event', eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found.' });
        }

        const attendeesList = event.attendees || [];
        const isAttendee = attendeesList.some(id => id.toString() === userId.toString());
        if (!isAttendee) {
            return res.status(400).json({ success: false, message: 'You have not RSVPed to this event.' });
        }


        const updatedEvent = await dataStore.update('Event', { _id: eventId }, {
            $pull: { attendees: userId }
        });

        const resolved = await dataStore.find('Event', { _id: eventId }, { populate: 'organizer' });
        const mappedEvent = serializePayload(resolved[0] || updatedEvent);

        res.status(200).json({ success: true, data: mappedEvent });
    } catch (err) {
        next(err);
    }
};

export const enhanceDescription = async (req, res, next) => {
    try {
        const { description } = req.body;
        if (!description || typeof description !== 'string' || description.trim().length < 5) {
            return res.status(400).json({
                success: false,
                message: 'Please provide at least a few words for the AI to enhance.'
            });
        }

        // Guard: cap to 2000 characters to avoid excessive token usage
        const cappedText = description.trim().slice(0, 2000);

        const systemPrompt =
            "You are a writing assistant helping a university alumni platform user write a clear, engaging event description for a webinar, hackathon, workshop, or meetup. " +
            "Improve clarity and structure while preserving the original meaning and any specific details (dates, times, requirements) the user included. " +
            "Keep it concise. Return only the improved description text, nothing else.";

        const enhanced = await generateCompletion({
            systemPrompt,
            messages: [{ role: 'user', content: cappedText }],
            temperature: 0.4
        });

        // generateCompletion returns a rate-limit message string instead of throwing on 429
        if (enhanced.includes('temporarily busy')) {
            return res.status(429).json({
                success: false,
                message: 'AI enhancement is temporarily busy — please try again shortly.'
            });
        }

        res.status(200).json({
            success: true,
            data: { enhanced: enhanced.trim() }
        });
    } catch (err) {
        next(err);
    }
};

