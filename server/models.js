import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  id: String,
  name: String,
  email: String,
  role: String,
  avatar: String,
  title: String,
  university: String,
  graduationYear: Number,
  department: String,
  yearOfStudy: Number,
  course: String,
  interests: [String],
  skills: [String],
  experience: String,
  yearsOfExperience: String,
  bio: String,
  resumeLink: String,
  location: String,
  company: String,
  position: String,
  projects: [{
    id: String,
    title: String,
    description: String,
    technologies: [String],
    link: String
  }]
});

const CommentSchema = new mongoose.Schema({
  id: String,
  authorName: String,
  authorAvatar: String,
  content: String,
  timestamp: String
});

const PostSchema = new mongoose.Schema({
  author: UserSchema,
  content: String,
  timestamp: String,
  type: String,
  likes: { type: Number, default: 0 },
  likedBy: [String],
  comments: { type: Number, default: 0 },
  commentsList: [CommentSchema],
  tags: [String]
});

const JobSchema = new mongoose.Schema({
  title: String,
  company: String,
  location: String,
  type: String,
  postedBy: UserSchema,
  description: String,
  postedDate: String,
  skills: [String],
  link: String
});

const EventSchema = new mongoose.Schema({
  title: String,
  date: String,
  time: String,
  type: String,
  organizer: UserSchema,
  attendees: Number,
  image: String,
  description: String
});

const MessageSchema = new mongoose.Schema({
  id: String,
  senderId: String,
  receiverId: String,
  text: String,
  timestamp: String,
  read: { type: Boolean, default: false }
});

export const User = mongoose.model('User', UserSchema);
export const Post = mongoose.model('Post', PostSchema);
export const Job = mongoose.model('Job', JobSchema);
export const Event = mongoose.model('Event', EventSchema);
export const Message = mongoose.model('Message', MessageSchema);
