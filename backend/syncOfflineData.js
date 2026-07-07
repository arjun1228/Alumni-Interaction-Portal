import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { Job } from './models/Job.js';
import { Post } from './models/Post.js';
import { Event } from './models/Event.js';
import { Message } from './models/Message.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

const DB_FILE = path.resolve(__dirname, 'data.json');

const syncData = async () => {
    console.log('🔄 Starting offline data synchronization to MongoDB Atlas...');

    if (!fs.existsSync(DB_FILE)) {
        console.error('❌ data.json file not found! Nothing to sync.');
        process.exit(1);
    }

    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        console.error('❌ MONGO_URI environment variable is not defined in env configuration.');
        process.exit(1);
    }

    // Connect to MongoDB
    const connected = await connectDB(mongoUri);
    if (!connected) {
        console.error('❌ Failed to connect to MongoDB Atlas for synchronization.');
        process.exit(1);
    }

    try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const data = JSON.parse(raw);

        const idMap = {}; // Maps old offline IDs -> new MongoDB ObjectIds

        // 1. Sync Users
        console.log('\n👤 Synchronizing users...');
        const jsonUsers = data.users || [];
        for (const u of jsonUsers) {
            const emailKey = u.email.toLowerCase();
            let dbUser = await User.findOne({ email: emailKey });

            if (!dbUser) {
                // Insert new user
                const { id, _id, password, ...cleanDetails } = u;
                const userDoc = new User({
                    ...cleanDetails,
                    email: emailKey,
                    approvalStatus: (u.role === 'alumni' || u.role === 'GRADUATE') ? 'approved' : u.approvalStatus,
                    // Fallback passwordHash if missing
                    passwordHash: u.passwordHash || u.password || 'password123'
                });
                dbUser = await userDoc.save();
                console.log(`✅ Synced new user: ${emailKey}`);
            } else {
                console.log(`ℹ️ User ${emailKey} already exists in MongoDB.`);
            }
            // Map the old offline ID to the active MongoDB ID
            idMap[u.id || u._id] = dbUser._id.toString();
        }

        // Helper function to resolve offline IDs to MongoDB IDs
        const resolveUserId = async (oldId) => {
            if (!oldId) return null;
            if (idMap[oldId]) return idMap[oldId];
            
            // Fallback: look up in data.json to find email, then lookup in DB
            const offlineUser = jsonUsers.find(u => u.id === oldId || u._id === oldId);
            if (offlineUser) {
                const dbUser = await User.findOne({ email: offlineUser.email.toLowerCase() });
                if (dbUser) {
                    idMap[oldId] = dbUser._id.toString();
                    return dbUser._id.toString();
                }
            }
            // If it's already a MongoDB ID (e.g. from seed or other session)
            if (mongoose.Types.ObjectId.isValid(oldId)) {
                return oldId;
            }
            return null;
        };

        // 2. Sync Jobs
        console.log('\n💼 Synchronizing job opportunities...');
        const jsonJobs = data.jobs || [];
        for (const j of jsonJobs) {
            const oldPostedBy = j.postedBy?.id || j.postedBy?._id || j.postedBy;
            const newPostedBy = await resolveUserId(oldPostedBy);

            if (!newPostedBy) {
                console.warn(`⚠️ Skipped job "${j.title}" by ${j.company} - Creator profile could not be resolved.`);
                continue;
            }

            // Check if job already exists
            const exists = await Job.findOne({
                title: j.title,
                company: j.company,
                postedBy: newPostedBy
            });

            if (!exists) {
                const jobDoc = new Job({
                    title: j.title,
                    company: j.company,
                    type: j.type,
                    description: j.description,
                    skillsRequired: j.skillsRequired || [],
                    location: j.location,
                    postedBy: newPostedBy,
                    createdAt: j.createdAt || new Date()
                });
                await jobDoc.save();
                console.log(`✅ Synced job: ${j.title} at ${j.company}`);
            } else {
                console.log(`ℹ️ Job "${j.title}" already exists.`);
            }
        }

        // 3. Sync Feed Posts
        console.log('\n📝 Synchronizing community posts...');
        const jsonPosts = data.posts || [];
        for (const p of jsonPosts) {
            const oldAuthor = p.author?.id || p.author?._id || p.author;
            const newAuthor = await resolveUserId(oldAuthor);

            if (!newAuthor) {
                console.warn(`⚠️ Skipped post by unresolved author.`);
                continue;
            }

            // Check if post already exists
            const exists = await Post.findOne({
                author: newAuthor,
                content: p.content
            });

            if (!exists) {
                const comments = (p.commentsList || []).map(async (c) => {
                    const cAuthor = await resolveUserId(c.authorId) || newAuthor; // Fallback to post author
                    return {
                        author: cAuthor,
                        content: c.content,
                        createdAt: c.createdAt || new Date()
                    };
                });

                const postDoc = new Post({
                    author: newAuthor,
                    content: p.content,
                    type: p.type || 'GENERAL',
                    image: p.image,
                    comments: await Promise.all(comments),
                    createdAt: p.createdAt || new Date()
                });
                await postDoc.save();
                console.log(`✅ Synced post: "${p.content.substring(0, 30)}..."`);
            } else {
                console.log(`ℹ️ Post already exists.`);
            }
        }

        // 4. Sync Events
        console.log('\n📅 Synchronizing events and workshops...');
        const jsonEvents = data.events || [];
        for (const e of jsonEvents) {
            const oldOrganizer = e.organizer?.id || e.organizer?._id || e.organizer;
            const newOrganizer = await resolveUserId(oldOrganizer);

            if (!newOrganizer) {
                console.warn(`⚠️ Skipped event "${e.title}" - Organizer could not be resolved.`);
                continue;
            }

            // Check if event already exists
            const exists = await Event.findOne({
                title: e.title,
                organizer: newOrganizer
            });

            if (!exists) {
                const eventDoc = new Event({
                    title: e.title,
                    type: e.type || 'WEBINAR',
                    description: e.description,
                    dateTime: e.dateTime || new Date(),
                    coverImage: e.coverImage || e.image,
                    organizer: newOrganizer,
                    attendees: []
                });
                await eventDoc.save();
                console.log(`✅ Synced event: ${e.title}`);
            } else {
                console.log(`ℹ️ Event "${e.title}" already exists.`);
            }
        }

        // 5. Sync Messages
        console.log('\n✉️ Synchronizing peer messages...');
        const jsonMessages = data.messages || [];
        for (const m of jsonMessages) {
            const sender = await resolveUserId(m.senderId || m.sender);
            const recipient = await resolveUserId(m.receiverId || m.recipient);

            if (!sender || !recipient) {
                console.warn(`⚠️ Skipped message - Sender or Recipient could not be resolved.`);
                continue;
            }

            // Check if message already exists
            const exists = await Message.findOne({
                sender,
                recipient,
                text: m.text,
                createdAt: m.createdAt || m.timestamp
            });

            if (!exists) {
                const messageDoc = new Message({
                    sender,
                    recipient,
                    text: m.text,
                    readStatus: m.readStatus || m.read || false,
                    createdAt: m.createdAt || m.timestamp || new Date()
                });
                await messageDoc.save();
                console.log(`✅ Synced message: "${m.text.substring(0, 20)}..."`);
            }
        }

        console.log('\n🎉 Synchronization successfully completed!');
        process.exit(0);
    } catch (err) {
        console.error('💥 Critical sync failure:', err);
        process.exit(1);
    }
};

syncData();
