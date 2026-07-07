export const INITIAL_POSTS = [
    {
        id: 'p1',
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
        id: 'p2',
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

export const INITIAL_JOBS = [
    {
        id: 'j1',
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
        id: 'j2',
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

export const INITIAL_EVENTS = [
    {
        id: 'e1',
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
        id: 'e2',
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
