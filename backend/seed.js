import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { dataStore } from './services/dataStore.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

const usersToSeed = [
    {
        name: 'Emily Wong',
        email: 'emily.wong@university.edu',
        password: 'password123',
        role: 'student',
        department: 'Computer Science',
        yearOfStudy: 3,
        interests: ['Web Development', 'AI/ML', 'Cloud Computing'],
        resumeLink: 'https://example.com/emily-wong-resume.pdf',
        isVerified: true,
        projectShowcase: [
            {
                title: 'AlumniConnect Portal',
                description: 'A platform to connect students with university graduates.',
                link: 'https://github.com/example/alumniconnect'
            }
        ],
        avatar: 'https://ui-avatars.com/api/?name=Emily+Wong&background=random'
    },
    {
        name: 'Sarah Jenkins',
        email: 'sarah.jenkins@example.com',
        password: 'password123',
        role: 'alumni',
        currentCompany: 'TechCorp',
        jobTitle: 'Senior Product Manager',
        yearsOfExperience: '4 Years',
        professionalBio: 'Passionate about building products that solve real problems.',
        skills: ['Product Management', 'Agile', 'Data Analysis'],
        approvalStatus: 'approved',
        isVerified: true,
        avatar: 'https://picsum.photos/id/64/100/100'
    },
    {
        name: 'David Chen',
        email: 'david.chen@example.com',
        password: 'password123',
        role: 'alumni',
        currentCompany: 'StartupX',
        jobTitle: 'Backend Engineer',
        yearsOfExperience: '2 Years',
        professionalBio: 'Building scalable backend systems.',
        skills: ['Node.js', 'System Design', 'MongoDB'],
        approvalStatus: 'pending',
        referenceToken: 'ALUM-DAVID1',
        isVerified: true,
        avatar: 'https://picsum.photos/id/91/100/100'
    },
    {
        name: 'College Admin',
        email: 'admin@college.edu',
        password: 'password123',
        role: 'admin',
        isVerified: true,
        avatar: 'https://ui-avatars.com/api/?name=Admin&background=0f172a&color=fff'
    }
];

const seed = async () => {
    console.log('🌱 Starting database seeding process...');
    
    // Connect DB to determine active mode
    const mongoUri = process.env.MONGO_URI;
    await connectDB(mongoUri);

    for (const u of usersToSeed) {
        try {
            // Check if user already exists
            const exists = await dataStore.findOne('User', { email: u.email });
            if (exists) {
                console.log(`ℹ️ User ${u.email} already exists, skipping.`);
                continue;
            }

            const { password, ...details } = u;
            const passwordHash = await bcrypt.hash(password, 10);
            
            await dataStore.insert('User', {
                ...details,
                passwordHash
            });
            console.log(`✅ Seeded user: ${u.email} (${u.role})`);
        } catch (err) {
            console.error(`❌ Failed to seed user: ${u.email}`, err.message);
        }
    }

    console.log('🌾 Seeding completed.');
    process.exit(0);
};

seed().catch(err => {
    console.error('💥 Seeding critical failure:', err);
    process.exit(1);
});
