import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getEvents, getEventById, createEvent, rsvpEvent, getAttendees, deleteEvent, updateEvent, removeAttendee } from '../controllers/events.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize, alumniApproved } from '../middleware/authorize.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the uploads directory exists
const uploadDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer diskStorage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

const router = express.Router();

router.get('/', getEvents);
router.get('/:id', getEventById);

// Create Event: Protected (restricted to approved alumni or college admins only)
router.post('/', authenticate, authorize('alumni', 'admin'), alumniApproved, createEvent);

// RSVP to an Event: Protected
router.post('/:id/rsvp', authenticate, rsvpEvent);

// View list of Event RSVPs: Protected (restricted to event organizer or admin only)
router.get('/:id/attendees', authenticate, getAttendees);

// Delete Event: Protected (restricted to organizer or admin)
router.delete('/:id', authenticate, deleteEvent);

// Edit Event: Protected (restricted to organizer or admin)
router.put('/:id', authenticate, upload.single('coverImage'), updateEvent);
router.patch('/:id', authenticate, upload.single('coverImage'), updateEvent);

// Remove Event Attendee: Protected (restricted to admin only)
router.delete('/:id/attendees/:userId', authenticate, authorize('admin'), removeAttendee);

export default router;
