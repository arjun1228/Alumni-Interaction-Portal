import { dataStore } from '../services/dataStore.js';
import { isMongoConnected } from '../config/db.js';

// Helper to count active messaging conversations (unique sender-recipient pairs)
const getConversationsCount = async (startDate, endDate) => {
    const query = {};
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = startDate.toISOString();
        if (endDate) query.createdAt.$lte = endDate.toISOString();
    }
    
    const messages = await dataStore.find('Message', query);
    const uniquePairs = new Set();
    
    for (const msg of messages) {
        const id1 = msg.sender.toString();
        const id2 = msg.recipient.toString();
        const pairKey = id1 < id2 ? `${id1}_${id2}` : `${id2}_${id1}`;
        uniquePairs.add(pairKey);
    }
    
    return uniquePairs.size;
};

// Computes the metrics within a specific range
const getPeriodStats = async (start, end) => {
    // 1. Total Students Reached (Registered Students)
    const studentQuery = { role: 'student' };
    if (start || end) {
        studentQuery.createdAt = {};
        if (start) studentQuery.createdAt.$gte = start.toISOString();
        if (end) studentQuery.createdAt.$lte = end.toISOString();
    }
    const students = await dataStore.find('User', studentQuery);

    // 2. Jobs Filled
    const jobQuery = { status: 'filled' };
    if (start || end) {
        jobQuery.updatedAt = {}; // status change matches updatedAt timestamp
        if (start) jobQuery.updatedAt.$gte = start.toISOString();
        if (end) jobQuery.updatedAt.$lte = end.toISOString();
    }
    const jobsFilled = await dataStore.find('Job', jobQuery);

    // 3. Active Mentorship Conversations
    const mentorshipSessionsCount = await getConversationsCount(start, end);

    return {
        studentsCount: students.length,
        jobsFilledCount: jobsFilled.length,
        mentorshipSessionsCount
    };
};

const calculateChange = (current, previous) => {
    if (previous === 0) {
        return current > 0 ? '+100%' : '0%';
    }
    const pct = ((current - previous) / previous) * 100;
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(0)}%`;
};

export const getAnalyticsData = async (req, res, next) => {
    try {
        const { range } = req.query; // '7' for 7 days, '30' for 30 days, 'all'
        
        let startDate = null;
        const endDate = new Date();
        
        let prevStartDate = null;
        let prevEndDate = null;
        
        if (range === '7') {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
            
            prevEndDate = new Date(startDate);
            prevStartDate = new Date(prevEndDate);
            prevStartDate.setDate(prevStartDate.getDate() - 7);
        } else if (range === '30') {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
            
            prevEndDate = new Date(startDate);
            prevStartDate = new Date(prevEndDate);
            prevStartDate.setDate(prevStartDate.getDate() - 30);
        } else {
            // 'all' - previous period is set as the preceding 30 days
            startDate = null; 
            prevEndDate = new Date();
            prevEndDate.setDate(prevEndDate.getDate() - 30);
            prevStartDate = null;
        }
        
        // Calculate main cards metrics for current and previous equivalent periods
        const currentStats = await getPeriodStats(startDate, endDate);
        const prevStats = await getPeriodStats(prevStartDate, prevEndDate);
        
        const cards = {
            totalStudents: {
                value: currentStats.studentsCount,
                change: `${calculateChange(currentStats.studentsCount, prevStats.studentsCount)} vs previous period`
            },
            jobsFilled: {
                value: currentStats.jobsFilledCount,
                change: `${calculateChange(currentStats.jobsFilledCount, prevStats.jobsFilledCount)} vs previous period`
            },
            mentorshipSessions: {
                value: currentStats.mentorshipSessionsCount,
                change: `${calculateChange(currentStats.mentorshipSessionsCount, prevStats.mentorshipSessionsCount)} vs previous period`
            }
        };
        
        // Calculate Top Skills based on active Job listings
        const jobQuery = {};
        if (startDate) {
            jobQuery.createdAt = { $gte: startDate.toISOString() };
        }
        const jobs = await dataStore.find('Job', jobQuery);
        
        const skillsCount = {};
        for (const job of jobs) {
            if (job.skillsRequired) {
                for (const skill of job.skillsRequired) {
                    const normalized = skill.trim();
                    if (normalized) {
                        skillsCount[normalized] = (skillsCount[normalized] || 0) + 1;
                    }
                }
            }
        }
        
        let skillData = Object.entries(skillsCount)
            .map(([name, value]) => ({ name, students: value }))
            .sort((a, b) => b.students - a.students)
            .slice(0, 5);
            
        // Fallback default skills if no real data in DB
        if (skillData.length === 0) {
            skillData = [
                { name: 'React', students: 120 },
                { name: 'Python', students: 98 },
                { name: 'AWS', students: 86 },
                { name: 'System Design', students: 75 },
                { name: 'Data Sci', students: 65 },
            ];
        }
        
        // Calculate Portal Weekly Activity
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const activityMap = daysOfWeek.reduce((acc, day) => {
            acc[day] = { name: day, views: 0, posts: 0 };
            return acc;
        }, {});
        
        const postQuery = {};
        if (startDate) {
            postQuery.createdAt = { $gte: startDate.toISOString() };
        }
        const posts = await dataStore.find('Post', postQuery);
        for (const post of posts) {
            const d = new Date(post.createdAt);
            const dayName = daysOfWeek[d.getDay()];
            activityMap[dayName].posts += 1;
            const interactions = (post.likes ? post.likes.length : 0) + (post.comments ? post.comments.length : 0);
            activityMap[dayName].views += (interactions * 3) + 5;
        }
        
        const msgQuery = {};
        if (startDate) {
            msgQuery.createdAt = { $gte: startDate.toISOString() };
        }
        const messages = await dataStore.find('Message', msgQuery);
        for (const msg of messages) {
            const d = new Date(msg.createdAt);
            const dayName = daysOfWeek[d.getDay()];
            activityMap[dayName].views += 2;
        }
        
        let activityData = daysOfWeek.map(day => activityMap[day]);
        
        // Fallback default activity data if no real activity in database
        const totalPosts = activityData.reduce((sum, item) => sum + item.posts, 0);
        const totalViews = activityData.reduce((sum, item) => sum + item.views, 0);
        if (totalPosts === 0 && totalViews === 0) {
            activityData = [
                { name: 'Mon', views: 400, posts: 24 },
                { name: 'Tue', views: 300, posts: 18 },
                { name: 'Wed', views: 550, posts: 35 },
                { name: 'Thu', views: 450, posts: 28 },
                { name: 'Fri', views: 600, posts: 42 },
                { name: 'Sat', views: 200, posts: 10 },
                { name: 'Sun', views: 150, posts: 8 },
            ];
        }
        
        res.status(200).json({
            success: true,
            data: {
                cards,
                skillData,
                activityData
            }
        });
    } catch (err) {
        next(err);
    }
};
