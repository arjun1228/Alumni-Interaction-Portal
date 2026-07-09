import express from 'express';
import { getCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../controllers/calendar.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

router.get('/', authenticate, getCalendarEvents);
router.post('/', authenticate, createCalendarEvent);
router.put('/:id', authenticate, updateCalendarEvent);
router.delete('/:id', authenticate, deleteCalendarEvent);

export default router;
