import express from 'express';
import { getEvents, getEventById, createEvent, rsvpEvent, getAttendees, deleteEvent, updateEvent, removeAttendee, cancelRsvp } from '../controllers/events.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize, alumniApproved } from '../middleware/authorize.js';

// NOTE: The redundant multer diskStorage instance was removed (K.8 fix).
// Cover images for events should be uploaded via POST /api/upload (which handles
// Cloudinary/local-disk fallback) and the returned URL passed as coverImage in
// the JSON body. Both createEvent and updateEvent accept coverImage as a URL string.

const router = express.Router();

router.get('/', getEvents);
router.get('/:id', getEventById);

// Create Event: Protected (restricted to approved alumni or college admins only)
router.post('/', authenticate, authorize('alumni', 'admin'), alumniApproved, createEvent);

// RSVP to an Event: Protected
router.post('/:id/rsvp', authenticate, rsvpEvent);

// Cancel own RSVP: Protected (self-service, symmetric to POST /:id/rsvp)
router.delete('/:id/rsvp', authenticate, cancelRsvp);

// View list of Event RSVPs: Protected (restricted to event organizer or admin only)
router.get('/:id/attendees', authenticate, getAttendees);

// Delete Event: Protected (restricted to organizer or admin)
router.delete('/:id', authenticate, deleteEvent);

// Edit Event: Protected (restricted to organizer or admin) — accepts coverImage as URL in JSON body
router.put('/:id', authenticate, updateEvent);
router.patch('/:id', authenticate, updateEvent);

// Remove Event Attendee: Protected (restricted to admin only)
router.delete('/:id/attendees/:userId', authenticate, authorize('admin'), removeAttendee);

export default router;
