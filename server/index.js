import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config(); // Also load .env if it exists
import { Post, Job, Event, User, Message } from './models.js'; // Added Message

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Basic Health Check
app.get('/', (req, res) => {
    res.send('AlumniConnect API is running');
});

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/alumniconnect';

// Check if credentials are valid
const hasValidCredentials = !MONGO_URI.includes('<db_password>');

if (hasValidCredentials) {
    mongoose.connect(MONGO_URI)
        .then(() => console.log('MongoDB Connected to Atlas'))
        .catch(err => {
            console.error('MongoDB connection error:', err);
        });
} else {
    console.log('---------------------------------------------------');
    console.log('WARNING: MongoDB password not set. Running in OFFLINE MODE.');
    console.log('Data will be saved to server/data.json file only.');
    console.log('---------------------------------------------------');
}

// Initial Data (from App.tsx) - SAME AS BEFORE BUT TRUNCATED FOR BREVITY IN TOOL CALL
const INITIAL_POSTS = [
    {
        author: {
            id: 'u1',
            name: 'Sarah Jenkins',
            email: 'sarah.jenkins@example.com',
            role: 'GRADUATE',
            title: 'Senior Product Manager at TechCorp',
            avatar: 'https://picsum.photos/id/64/100/100',
            university: 'Tech University',
            graduationYear: 2020
        },
        content: "Excited to share that our team just launched the new AI analytics dashboard! For any undergrads interested in PM roles, focus on understanding the 'why' behind features, not just the 'how'. Happy to review portfolios this weekend!",
        timestamp: '2 hours ago',
        type: 'ACHIEVEMENT',
        likes: 45,
        likedBy: [],
        comments: 2,
        commentsList: [
            {
                id: 'c1',
                authorName: 'Alex Johnson',
                authorAvatar: 'https://picsum.photos/200/200?random=1',
                content: 'This is great advice! Would love to connect.',
                timestamp: '1 hour ago'
            },
            {
                id: 'c2',
                authorName: 'Michael Brown',
                authorAvatar: 'https://picsum.photos/200/200?random=2',
                content: 'Congratulations on the launch!',
                timestamp: '30 mins ago'
            }
        ],
        tags: ['ProductManagement', 'CareerAdvice', 'AI']
    },
    {
        author: {
            id: 'u2',
            name: 'David Chen',
            email: 'david.chen@example.com',
            role: 'GRADUATE',
            title: 'Backend Engineer at StartupX',
            avatar: 'https://picsum.photos/id/91/100/100',
            university: 'Tech University',
            graduationYear: 2022
        },
        content: "Unpopular opinion: You don't need to know 10 different frameworks. Master one, understand the design patterns, and you can pick up the rest easily. Focus on Data Structures and System Design for your upcoming interviews.",
        timestamp: '5 hours ago',
        type: 'ADVICE',
        likes: 128,
        likedBy: [],
        comments: 0,
        commentsList: [],
        tags: ['Engineering', 'Interviews', 'SystemDesign']
    }
];

const INITIAL_JOBS = [
    {
        title: 'Frontend Developer Intern',
        company: 'TechStart Inc.',
        location: 'Remote',
        type: 'INTERNSHIP',
        postedBy: {
            id: 'u3',
            name: 'Emily Zhang',
            email: 'emily.zhang@example.com',
            role: 'GRADUATE',
            avatar: 'https://picsum.photos/id/65/100/100',
            title: 'CTO at TechStart'
        },
        description: 'Looking for a passionate React developer to help build our new customer portal.',
        postedDate: '2 days ago',
        skills: ['React', 'TypeScript', 'Tailwind'],
        link: 'https://example.com/apply'
    },
    {
        title: 'Junior Cloud Engineer',
        company: 'CloudScale Solutions',
        location: 'San Francisco, CA',
        type: 'FULL_TIME',
        postedBy: {
            id: 'u4',
            name: 'James Wilson',
            email: 'james.wilson@example.com',
            role: 'GRADUATE',
            avatar: 'https://picsum.photos/id/99/100/100',
            title: 'DevOps Lead'
        },
        description: 'Great opportunity for fresh grads interested in AWS and Kubernetes. Mentorship provided.',
        postedDate: '1 week ago',
        skills: ['AWS', 'Docker', 'Linux'],
        link: 'https://example.com/jobs/cloud'
    }
];

const INITIAL_EVENTS = [
    {
        title: 'Breaking into Big Tech: Alumni Panel',
        date: 'Oct 24, 2023',
        time: '6:00 PM EST',
        type: 'WEBINAR',
        organizer: {
            id: 'u5',
            name: 'Alumni Association',
            email: 'alumni@example.com',
            role: 'GRADUATE',
            avatar: 'https://picsum.photos/id/1/100/100',
        },
        attendees: 142,
        image: 'https://picsum.photos/seed/tech/600/300',
        description: 'Join us for an exclusive panel discussion with alumni working at Google, Meta, and Amazon.'
    },
    {
        title: 'Winter Hackathon 2023',
        date: 'Nov 12, 2023',
        time: '9:00 AM EST',
        type: 'HACKATHON',
        organizer: {
            id: 'u6',
            name: 'CS Department',
            email: 'cs.department@example.com',
            role: 'GRADUATE',
            avatar: 'https://picsum.photos/id/2/100/100',
        },
        attendees: 85,
        image: 'https://picsum.photos/seed/code/600/300',
        description: 'A 24-hour hackathon focused on building solutions for social good. Prizes worth $5000.'
    }
];

// Seed Data
const seedData = async () => {
    try {
        const postCount = await Post.countDocuments();
        if (postCount === 0) {
            await Post.insertMany(INITIAL_POSTS);
            console.log('Seeded Posts');
        }

        const jobCount = await Job.countDocuments();
        if (jobCount === 0) {
            await Job.insertMany(INITIAL_JOBS);
            console.log('Seeded Jobs');
        }

        const eventCount = await Event.countDocuments();
        if (eventCount === 0) {
            await Event.insertMany(INITIAL_EVENTS);
            console.log('Seeded Events');
        }

        const userCount = await User.countDocuments();
        if (userCount === 0) {
            // Create users from the authors in INITIAL_POSTS to ensure we have some data
            const users = [
                {
                    id: 'u1',
                    name: 'Sarah Jenkins',
                    email: 'sarah.jenkins@example.com',
                    role: 'GRADUATE',
                    title: 'Senior Product Manager at TechCorp',
                    avatar: 'https://picsum.photos/id/64/100/100',
                    university: 'Tech University',
                    graduationYear: 2020,
                    company: 'TechCorp',
                    department: 'Product',
                    yearsOfExperience: '4 Years',
                    skills: ['Product Management', 'Agile', 'Data Analysis'],
                    bio: 'Passionate about building products that solve real problems.'
                },
                {
                    id: 'u2',
                    name: 'David Chen',
                    email: 'david.chen@example.com',
                    role: 'GRADUATE',
                    title: 'Backend Engineer at StartupX',
                    avatar: 'https://picsum.photos/id/91/100/100',
                    university: 'Tech University',
                    graduationYear: 2022,
                    company: 'StartupX',
                    department: 'Engineering',
                    yearsOfExperience: '2 Years',
                    skills: ['Node.js', 'System Design', 'MongoDB'],
                    bio: 'Building scalable backend systems.'
                },
                {
                    id: 'u_student1',
                    name: 'Emily Wong',
                    email: 'emily.wong@university.edu',
                    role: 'UNDERGRADUATE',
                    title: 'Computer Science Student',
                    avatar: 'https://ui-avatars.com/api/?name=Emily+Wong&background=random',
                    university: 'Tech University',
                    department: 'Computer Science',
                    yearOfStudy: 3,
                    course: 'B.Tech CS',
                    skills: ['React', 'TypeScript', 'Java'],
                    interests: ['Web Development', 'AI'],
                    experience: 'Looking for summer internships.'
                }
            ];
            await User.insertMany(users);
            console.log('Seeded Users');
        }
    } catch (error) {
        console.error('Error seeding data:', error);
    }
};

// Routes

// Posts
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await Post.find().sort({ _id: -1 }); // Newest first
        const formattedPosts = posts.map(p => ({ ...p.toObject(), id: p._id }));
        res.json(formattedPosts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/posts', async (req, res) => {
    try {
        const newPost = new Post(req.body);
        const savedPost = await newPost.save();
        res.status(201).json({ ...savedPost.toObject(), id: savedPost._id });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/posts/:id/like', async (req, res) => {
    try {
        const { userId } = req.body;
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        if (post.likedBy.includes(userId)) {
            post.likedBy = post.likedBy.filter(id => id !== userId);
            post.likes--;
        } else {
            post.likedBy.push(userId);
            post.likes++;
        }
        await post.save();
        res.json({ ...post.toObject(), id: post._id });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Jobs
app.get('/api/jobs', async (req, res) => {
    try {
        const jobs = await Job.find().sort({ _id: -1 });
        res.json(jobs.map(j => ({ ...j.toObject(), id: j._id })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/jobs', async (req, res) => {
    try {
        const newJob = new Job(req.body);
        const savedJob = await newJob.save();
        res.status(201).json({ ...savedJob.toObject(), id: savedJob._id });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Events
app.get('/api/events', async (req, res) => {
    try {
        const events = await Event.find().sort({ _id: -1 });
        res.json(events.map(e => ({ ...e.toObject(), id: e._id })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/events', async (req, res) => {
    try {
        const newEvent = new Event(req.body);
        const savedEvent = await newEvent.save();
        res.status(201).json({ ...savedEvent.toObject(), id: savedEvent._id });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/admin/alumni', async (req, res) => {
    try {
        if (isMongoConnected()) {
            const alumni = await User.find({ role: 'GRADUATE' });
            return res.json(alumni.map(u => ({ ...u.toObject(), id: u._id })));
        } else {
            const db = getLocalDB();
            const alumni = db.users.filter(u => u.role === 'GRADUATE');
            res.json(alumni);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/students', async (req, res) => {
    try {
        if (isMongoConnected()) {
            const students = await User.find({ role: 'UNDERGRADUATE' });
            return res.json(students.map(u => ({ ...u.toObject(), id: u._id })));
        } else {
            const db = getLocalDB();
            const students = db.users.filter(u => u.role === 'UNDERGRADUATE');
            res.json(students);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/activities', async (req, res) => {
    try {
        if (isMongoConnected()) {
            const posts = await Post.find().sort({ _id: -1 });
            return res.json(posts.map(p => ({ ...p.toObject(), id: p._id })));
        } else {
            // In local DB, we might not have a separate posts array populated if we rely on initial mocks, 
            // but the seedLocalDB doesn't seem to seed posts. (See comments above)

            const db = getLocalDB();
            // If no posts in local db, return what we have
            res.json(db.posts || []);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Users
// Get user by email (simple auth for now) or create if not exists
// --- File-Based DB Fallback (for when Mongo is not configured) ---
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'data.json');

// Initialize local DB file if needed
// Initialize local DB file if needed
if (!fs.existsSync(DB_FILE)) {
    // Seed with empty arrays
    const initialData = {
        users: [],
        messages: [],
        posts: [],
        jobs: [],
        events: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
}

// Seed Initial users if local DB is empty or missing default users
const seedLocalDB = () => {
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

    // Check if default users are missing (using d1, d2 matching frontend mocks)
    const hasDefaultUsers = db.users.some(u => u.id === 'd1');

    if (!hasDefaultUsers) {
        // Use the initial users but with IDs matching frontend mocks/existing messages
        const defaultUsers = [
            {
                id: 'd1',
                name: 'Sarah Jenkins',
                email: 'sarah.jenkins@example.com',
                role: 'GRADUATE',
                title: 'Senior Product Manager at TechCorp',
                avatar: 'https://picsum.photos/id/64/100/100',
                university: 'Tech University',
                graduationYear: 2020,
                company: 'TechCorp',
                department: 'Product',
                yearsOfExperience: '4 Years',
                skills: ['Product Management', 'Agile', 'Data Analysis'],
                bio: 'Passionate about building products that solve real problems.'
            },
            {
                id: 'd2',
                name: 'David Chen',
                email: 'david.chen@example.com',
                role: 'GRADUATE',
                title: 'Backend Engineer at StartupX',
                avatar: 'https://picsum.photos/id/91/100/100',
                university: 'Tech University',
                graduationYear: 2022,
                company: 'StartupX',
                department: 'Engineering',
                yearsOfExperience: '2 Years',
                skills: ['Node.js', 'System Design', 'MongoDB'],
                bio: 'Building scalable backend systems.'
            },
            {
                id: 's1',
                name: 'Emily Wong',
                email: 'emily.wong@university.edu',
                role: 'UNDERGRADUATE',
                title: 'Computer Science Student',
                avatar: 'https://ui-avatars.com/api/?name=Emily+Wong&background=random',
                university: 'Tech University',
                department: 'Computer Science',
                yearOfStudy: 3,
                course: 'B.Tech CS',
                skills: ['React', 'TypeScript', 'Java'],
                interests: ['Web Development', 'AI'],
                experience: 'Looking for summer internships.'
            }
        ];

        // Append default users to existing users
        db.users = [...db.users, ...defaultUsers];
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
        console.log('Seeded Local DB with default users (d1, d2, s1)');
    }
};

const getLocalDB = () => {
    // Ensure seeding runs before read
    seedLocalDB();
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
};
const saveLocalDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

const isMongoConnected = () => mongoose.connection.readyState === 1;

// --- Routes ---

// Messages
app.post('/api/messages', async (req, res) => {
    try {
        console.log('POST /api/messages received:', req.body);

        if (isMongoConnected()) {
            const newMessage = new Message(req.body);
            const savedMessage = await newMessage.save();
            console.log('Message saved to Mongo:', savedMessage._id);
            return res.status(201).json({ ...savedMessage.toObject(), id: savedMessage._id });
        } else {
            // Fallback to local DB
            const db = getLocalDB();
            const newMessage = { ...req.body, id: `local_${Date.now()}`, timestamp: new Date().toISOString() };
            db.messages.push(newMessage);
            saveLocalDB(db);
            console.log('Message saved to local file:', newMessage.id);
            return res.status(201).json(newMessage);
        }
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/messages/:userId/:otherUserId', async (req, res) => {
    try {
        const { userId, otherUserId } = req.params;
        console.log(`GET /api/messages/${userId}/${otherUserId}`);

        if (isMongoConnected()) {
            const messages = await Message.find({
                $or: [
                    { senderId: userId, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: userId }
                ]
            }).sort({ timestamp: 1 });
            console.log(`Found ${messages.length} messages in Mongo`);
            return res.json(messages.map(m => ({ ...m.toObject(), id: m._id })));
        } else {
            // Fallback to local DB
            const db = getLocalDB();
            const messages = db.messages.filter(m =>
                (m.senderId === userId && m.receiverId === otherUserId) ||
                (m.senderId === otherUserId && m.receiverId === userId)
            ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            console.log(`Found ${messages.length} messages in local file`);
            return res.json(messages);
        }
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: error.message });
    }
});

// Users
// Get user by email (simple auth for now) or create if not exists
app.post('/api/users/login', async (req, res) => {
    try {
        console.log('Login request received with body:', req.body);
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        if (isMongoConnected()) {
            let user = await User.findOne({ email });
            if (!user) {
                console.log('User not found in Mongo. Creating new user:', email);
                user = new User(req.body);
                await user.save();
            }
            return res.json({ ...user.toObject(), id: user._id });
        } else {
            // Fallback to local DB
            const db = getLocalDB();
            let user = db.users.find(u => u.email === email);
            if (!user) {
                console.log('User not found in local file. Creating new user:', email);
                user = { ...req.body, id: `local_user_${Date.now()}` };
                db.users.push(user);
                saveLocalDB(db);
            } else {
                console.log('User found in local file:', user.id);
            }
            return res.json(user);
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        if (isMongoConnected()) {
            const users = await User.find({}, '-password');
            res.json(users.map(u => ({ ...u.toObject(), id: u._id })));
        } else {
            const db = getLocalDB();
            // If local DB is empty, maybe seed it? For now just return what we have
            // Merge with initial seed data if needed or just rely on what's there
            res.json(db.users);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.listen(PORT, async () => {
    await seedData();
    console.log(`Server running on http://127.0.0.1:${PORT}`);
});
