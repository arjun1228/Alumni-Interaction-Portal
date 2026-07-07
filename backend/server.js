import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, isMongoConnected } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRouter from './routes/auth.routes.js';
import postsRouter from './routes/posts.routes.js';
import jobsRouter from './routes/jobs.routes.js';
import eventsRouter from './routes/events.routes.js';
import directoryRouter from './routes/directory.routes.js';
import messagesRouter from './routes/messages.routes.js';
import mentorRouter from './routes/mentor.routes.js';
import usersRouter from './routes/users.routes.js';
import uploadRouter from './routes/upload.routes.js';
import adminRouter from './routes/admin.routes.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load local and default environment variables relative to backend root
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Enforce JWT_SECRET configuration check
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error("❌ JWT_SECRET is missing or too weak. Refusing to start.");
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// CORS setup to allow communication from local Vite development
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

app.use(express.json());

// Serve static images/files uploaded via multer
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root endpoint for status inspection
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'AlumniConnect API is running',
        databaseMode: isMongoConnected() ? 'Online (MongoDB Atlas)' : 'Offline (Local JSON File)'
    });
});

app.get('/api/health', (req, res) => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const isCloudinaryConfigured = !!(cloudName && apiKey && apiSecret && cloudName !== 'your_cloud_name');

    res.json({
        success: true,
        status: 'UP',
        database: {
            mode: isMongoConnected() ? 'ONLINE' : 'OFFLINE',
            connected: isMongoConnected()
        },
        cloudinary: {
            configured: isCloudinaryConfigured,
            cloud_name: isCloudinaryConfigured ? cloudName : null
        }
    });
});

// Mount routes
app.use('/api/auth', authRouter);
app.use('/api/posts', postsRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/directory', directoryRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/mentor', mentorRouter);
app.use('/api/users', usersRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/admin', adminRouter);

// Scaffold routes to test connection and status
app.get('/api/db-status', (req, res) => {
    res.json({
        success: true,
        isMongoConnected: isMongoConnected(),
        mode: isMongoConnected() ? 'MongoDB' : 'JSON DB'
    });
});

// Centralized error management middleware
app.use(errorHandler);

const startServer = async () => {
    const mongoUri = process.env.MONGO_URI;
    await connectDB(mongoUri);
    
    app.listen(PORT, () => {
        console.log(`🚀 Server listening on http://127.0.0.1:${PORT}`);
        console.log(`📁 Database Mode: ${isMongoConnected() ? 'ONLINE (MongoDB Atlas)' : 'OFFLINE (server/data.json)'}`);
    });
};

startServer().catch(err => {
    console.error('💥 Critical initialization error:', err);
    process.exit(1);
});
export default app;
