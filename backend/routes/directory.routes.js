import express from 'express';
import { getDirectory, getProfileById } from '../controllers/directory.controller.js';

const router = express.Router();

router.get('/', getDirectory);
router.get('/:id', getProfileById);

export default router;
