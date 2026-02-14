
export enum UserRole {
  GUEST = 'GUEST',
  UNDERGRADUATE = 'UNDERGRADUATE',
  GRADUATE = 'GRADUATE', // Alumni
  ADMIN = 'ADMIN'
}

export enum ViewState {
  HOME = 'HOME',
  FEED = 'FEED',
  JOBS = 'JOBS',
  EVENTS = 'EVENTS',
  AI_MENTOR = 'AI_MENTOR',
  ANALYTICS = 'ANALYTICS', // Only for grads
  PROFILE = 'PROFILE',
  MESSAGES = 'MESSAGES',
  NETWORK = 'NETWORK',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD'
}

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  link?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  title?: string; // Major for students, Job Title for alumni
  university?: string;

  // Student Specific Fields
  department?: string;
  yearOfStudy?: number; // 1, 2, 3, 4
  course?: string; // e.g., "B.Sc Computer Science"
  interests?: string[]; // "What they want to learn"

  // Shared / Alumni Specific Fields
  skills?: string[];
  experience?: string; // Summary text
  yearsOfExperience?: string; // e.g. "5+ Years"
  bio?: string; // Job description / Professional summary
  resumeLink?: string; // URL mock
  location?: string;
  graduationYear?: number;
  company?: string;
  position?: string;

  // New: Project Showcase
  projects?: Project[];
}

export interface Comment {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  timestamp: string;
  type: 'ACHIEVEMENT' | 'ADVICE' | 'GENERAL';
  likes: number;
  likedBy: string[]; // List of user IDs
  comments: number;
  commentsList: Comment[];
  tags: string[];
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'INTERNSHIP' | 'FULL_TIME' | 'PART_TIME';
  postedBy: User;
  description: string;
  postedDate: string;
  skills: string[];
  link?: string;
}

export interface EventListing {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'WEBINAR' | 'HACKATHON' | 'MEETUP' | 'WORKSHOP';
  organizer: User;
  attendees: number;
  image: string;
  description?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}
