import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/authenticate.js';
import { uploadMedia } from '../services/mediaUpload.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.post('/', authenticate, upload.single('image'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded.'
            });
        }

        const result = await uploadMedia(req.file.buffer, req.file.originalname);
        
        return res.status(200).json({
            success: true,
            url: result.url,
            data: { url: result.url }
        });
    } catch (err) {
        next(err);
    }
});

export default router;
