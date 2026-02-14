import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import 'dotenv/config'; // Load environment variables
import { Post, Job, Event, User } from './models.js'; // Added User

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

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected to Atlas'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        console.error('---------------------------------------------------');
        console.error('ERROR: Could not connect to MongoDB.');
        console.error('Please ensure you have replaced <db_password> with your actual password in server/index.js');
        console.error('---------------------------------------------------');
    });

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

// Users
// Get user by email (simple auth for now) or create if not exists
app.post('/api/users/login', async (req, res) => {
    try {
        console.log('Login request received with body:', req.body);
        const { email } = req.body;
        if (!email) {
            console.warn('Login request missing email');
            return res.status(400).json({ error: 'Email is required' });
        }

        let user = await User.findOne({ email });

        if (!user) {
            console.log('User not found. Creating new user for:', email);
            // Create new user if not found (auto-registration for demo)
            user = new User(req.body);
            await user.save();
            console.log('User created and saved:', user._id);
        } else {
            console.log('User found:', user._id);
        }

        res.json({ ...user.toObject(), id: user._id });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ ...user.toObject(), id: user._id });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Admin Routes
app.get('/api/admin/students', async (req, res) => {
    try {
        const students = await User.find({ role: 'UNDERGRADUATE' });
        res.json(students.map(u => ({ ...u.toObject(), id: u._id })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reuse get posts for activities, but maybe we want a comprehensive list?
// For now, let's just fetch all posts as activities
app.get('/api/admin/activities', async (req, res) => {
    try {
        const posts = await Post.find().sort({ _id: -1 }).limit(50);
        const formattedPosts = posts.map(p => ({ ...p.toObject(), id: p._id }));
        res.json(formattedPosts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.listen(PORT, async () => {
    await seedData();
    console.log(`Server running on http://127.0.0.1:${PORT}`);
});
