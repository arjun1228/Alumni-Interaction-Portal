<div align="center">

# 🎓 AlumniConnect Portal

### A Modern Alumni–Student Networking & Career Mentorship Platform

[![React Vite](https://img.shields.io/badge/React_Vite-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)](https://react.dev/)
[![Node.js Express](https://img.shields.io/badge/Node.js_Express-%23339933.svg?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB_Atlas-%2347A248.svg?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Groq AI](https://img.shields.io/badge/Groq_AI_Llama_3.3-%23FF6B35.svg?style=flat&logo=meta&logoColor=white)](https://groq.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-%2338B2AC.svg?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![JWT Auth](https://img.shields.io/badge/JWT_Auth-%23000000.svg?style=flat&logo=jsonwebtokens&logoColor=white)](#-getting-started)
[![Offline Fallback](https://img.shields.io/badge/Offline_Fallback-JSON_DB-%23F7DF1E.svg?style=flat&logo=json&logoColor=black)](#-database-mode-auto-switching)

A high-performance, full-stack MERN platform designed to bridge the gap between **Students**, **Alumni**, and **Administrators**. Supports real-time messaging, job postings, event management, academic calendars, and an AI-powered career coaching feature backed by **Llama 3.3 70B via Groq Cloud**.

[Features](#-key-features) · [Roles & Permissions](#-roles--permissions-matrix) · [Project Structure](#-project-structure) · [Database Models](#️-database-models) · [API Endpoints](#-api-endpoints) · [Getting Started](#-getting-started)

</div>

---

## ✨ Key Features

### 👥 Role-Based Access Control (RBAC)
Tailored dashboards and capabilities for **Students**, **Alumni**, and **Admins**, each with distinct permissions enforced by JWT middleware on every protected route.

### 💬 Real-Time Instant Messaging
Persistent, thread-based direct messaging between any two users on the platform, with conversation history stored in MongoDB and served through a RESTful API.

### 📢 Community Feed & Posts
Alumni and students can publish posts, share updates, and engage with the community feed. Admins can pin important announcements and moderate content directly from community views.

### 💼 Job Listings & Applications
Alumni can post full-time job opportunities. Students can browse listings and submit applications — all managed through a dedicated jobs module with application tracking.

### 🎟️ Events & Workshop Management
Alumni can create and host workshops or networking events. Students can register interest, and all users can browse upcoming events via an interactive event calendar.

### 📅 Academic Calendar
A dedicated academic calendar for students to track key institutional dates, deadlines, and schedule entries, stored per-user in MongoDB.

### 🤖 AI Career Mentor (Groq Llama 3.3)
A backend-routed AI coaching assistant powered by **Llama 3.3 70B** via Groq Cloud SDK. Supports:
- **Resume Analysis** — Structured feedback on CV content and formatting.
- **Interview Coaching** — Mock Q&A and behavioral question prep.
- **Skill-Gap Roadmap** — Personalised learning paths based on career goals.

### 🗄️ Offline / Hybrid Database Fallback
If MongoDB Atlas is unreachable or no `MONGO_URI` is configured, the server automatically switches to a local `backend/data.json` flat-file database, seeding default data on first run — zero configuration required for local development.

### 🔐 Secure Authentication
JWT-based sessions with role claims. Middleware enforces authentication (`authenticate.js`) and role guards (`authorize.js`) on all protected endpoints.

### 📁 Media Upload Support
Image and file uploads handled via a dedicated upload service (`mediaUpload.js`), with files stored in the `backend/uploads/` directory.

---

## 👥 Roles & Permissions Matrix

| Feature / Page | Student | Alumni | Admin |
| :--- | :---: | :---: | :---: |
| **Auth (Login / Register)** | ✅ | ✅ | ✅ |
| **Community Feed** | ✅ (View & Post) | ✅ (View & Post) | ✅ (Pin & Delete) |
| **Alumni Directory** | ✅ (Browse) | ✅ (Browse) | ✅ |
| **Job Listings** | ✅ (View & Apply) | ✅ (Post & View) | ✅ |
| **Events & Workshops** | ✅ (View & Register) | ✅ (Create & View) | ✅ |
| **Direct Messaging** | ✅ | ✅ | ✅ |
| **Academic Calendar** | ✅ | ✅ | ✅ |
| **AI Career Mentor** | ✅ | ✅ | ✅ |
| **Profile Management** | ✅ (Own Profile) | ✅ (Own Profile) | ✅ |
| **Admin Dashboard** | ❌ | ❌ | ✅ |
| **User Management** | ❌ | ❌ | ✅ (Suspend / Reactivate) |
| **Platform Analytics** | ❌ | ❌ | ✅ |

---

## 📂 Project Structure

```text
alumniconnect-portal/
├── package.json                  # Root workspace scripts (install:all, dev)
│
├── backend/
│   ├── config/                   # DB connection & environment constants
│   ├── controllers/              # Business logic handlers
│   │   ├── admin.controller.js   # User management, analytics, moderation
│   │   ├── auth.controller.js    # Register, login, logout, JWT issuance
│   │   ├── calendar.controller.js# Academic calendar CRUD
│   │   ├── directory.controller.js# Alumni directory queries
│   │   ├── events.controller.js  # Event creation, registration, management
│   │   ├── jobs.controller.js    # Job postings & application handling
│   │   ├── mentor.controller.js  # Groq AI career mentor orchestration
│   │   ├── messages.controller.js# Direct messaging threads & history
│   │   └── posts.controller.js   # Community feed posts, pins, deletion
│   ├── middleware/
│   │   ├── authenticate.js       # JWT verification middleware
│   │   ├── authorize.js          # Role-based access guard
│   │   └── errorHandler.js       # Centralised error response handler
│   ├── models/                   # Mongoose schemas
│   │   ├── AdminLog.js           # Admin action audit log
│   │   ├── CalendarEvent.js      # Academic calendar entries
│   │   ├── Event.js              # Platform events & workshops
│   │   ├── Job.js                # Job listings
│   │   ├── JobApplication.js     # Student job applications
│   │   ├── Message.js            # Direct messages
│   │   ├── Post.js               # Community feed posts
│   │   └── User.js               # Core user schema (Student / Alumni / Admin)
│   ├── routes/                   # Express API routers
│   │   ├── admin.routes.js
│   │   ├── auth.routes.js
│   │   ├── calendar.routes.js
│   │   ├── directory.routes.js
│   │   ├── events.routes.js
│   │   ├── jobs.routes.js
│   │   ├── mentor.routes.js
│   │   ├── messages.routes.js
│   │   ├── posts.routes.js
│   │   ├── upload.routes.js
│   │   └── users.routes.js
│   ├── services/
│   │   ├── dataStore.js          # Offline JSON flat-file DB service
│   │   ├── groqService.js        # Groq Cloud SDK wrapper (Llama 3.3)
│   │   └── mediaUpload.js        # File & image upload handler
│   ├── utils/                    # Shared utility helpers
│   ├── uploads/                  # Local media upload storage
│   ├── migrate.js                # Database migration script
│   ├── seed.js                   # Default data seeder
│   ├── syncOfflineData.js        # Offline <-> Online data sync utility
│   └── server.js                 # Express app entry point & route mounting
│
└── frontend/
    ├── index.html                # Vite HTML shell
    ├── index.css                 # Global styles & Tailwind CSS imports
    ├── index.jsx                 # React bootstrapper & Axios defaults
    ├── App.jsx                   # Root router & protected route guards
    ├── types.js                  # Shared JS type constants
    ├── vite.config.js            # Vite build configuration
    ├── components/               # Feature page components
    │   ├── AuthScreen.jsx        # Login & registration UI
    │   ├── Feed.jsx              # Community feed & post creation
    │   ├── Profile.jsx           # User profile view & editor
    │   ├── Network.jsx           # Alumni directory & connection browsing
    │   ├── Jobs.jsx              # Job listings & application flow
    │   ├── Events.jsx            # Events browser & registration
    │   ├── Messaging.jsx         # Real-time direct messaging UI
    │   ├── AcademicCalendar.jsx  # Academic calendar & schedule manager
    │   ├── AICoach.jsx           # AI Career Mentor chat interface
    │   ├── AdminDashboard.jsx    # Admin control panel
    │   ├── Analytics.jsx         # Platform usage analytics charts
    │   ├── PostView.jsx          # Single post detail view
    │   └── Toast.jsx             # Global toast notification system
    ├── services/
    │   └── api.js                # Centralised Axios API client & all endpoint calls
    └── data/                     # Static / seed data assets
```

---

## 🗄️ Database Models (`backend/models/`)

### 👤 User (`User.js`)
- `name` (String, required): Full display name.
- `email` (String, required, unique): Account email address.
- `password` (String, required, minlength: 6): Bcrypt-hashed credential.
- `role` (String, enum: `['student', 'alumni', 'admin']`, default: `'student'`).
- `graduationYear` (Number): Year of graduation (alumni).
- `company` / `jobTitle` (String): Current employer details (alumni).
- `bio` / `skills` / `avatar` (String): Profile enrichment fields.
- `isActive` (Boolean, default: `true`): Admin suspension flag.

### 📝 Post (`Post.js`)
- `author` (ObjectId → User): Post creator reference.
- `content` (String, required): Post body text.
- `image` (String): Optional media attachment URL.
- `likes` (Array of ObjectId): Users who liked the post.
- `comments` (Array): Embedded comment objects with author & text.
- `isPinned` (Boolean, default: `false`): Admin pin flag.
- `createdAt` (Date): Auto-generated timestamp.

### 💼 Job (`Job.js`)
- `postedBy` (ObjectId → User): Alumni who created the listing.
- `title` / `company` / `location` (String, required): Core listing fields.
- `description` / `requirements` (String): Full job details.
- `type` (String, enum: `['full-time', 'part-time', 'internship']`).
- `isActive` (Boolean): Controls listing visibility.

### 🎟️ Event (`Event.js`)
- `createdBy` (ObjectId → User): Event organiser reference.
- `title` / `description` / `location` (String, required): Event details.
- `date` (Date, required): Event date and time.
- `registrations` (Array of ObjectId): Registered user references.
- `maxAttendees` (Number): Capacity cap.

### 💬 Message (`Message.js`)
- `sender` / `receiver` (ObjectId → User): Conversation parties.
- `content` (String, required): Message body.
- `read` (Boolean, default: `false`): Read receipt flag.
- `createdAt` (Date): Auto-generated timestamp.

### 📅 CalendarEvent (`CalendarEvent.js`)
- `user` (ObjectId → User): Owning student reference.
- `title` (String, required): Event name.
- `date` (Date, required): Scheduled date.
- `type` (String): Category tag (e.g. `exam`, `deadline`, `holiday`).

### 💼 JobApplication (`JobApplication.js`)
- `job` (ObjectId → Job): Applied-to listing.
- `applicant` (ObjectId → User): Applying student.
- `status` (String, enum: `['pending', 'reviewed', 'accepted', 'rejected']`).
- `appliedAt` (Date): Application timestamp.

### 📋 AdminLog (`AdminLog.js`)
- `admin` (ObjectId → User): Admin who performed the action.
- `action` (String): Description of the operation performed.
- `target` (ObjectId): Affected resource reference.
- `createdAt` (Date): Audit timestamp.

---

## 🔌 API Endpoints (`backend/routes/`)

### 🔐 Auth (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/register` | Create a new user account |
| `POST` | `/login` | Authenticate and receive a JWT cookie |
| `POST` | `/logout` | Clear the session cookie |
| `GET` | `/me` | Get the currently authenticated user |

### 📢 Posts (`/api/posts`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Fetch all community feed posts |
| `POST` | `/` | Create a new post |
| `PUT` | `/:id/like` | Toggle like on a post |
| `POST` | `/:id/comment` | Add a comment to a post |
| `DELETE` | `/:id` | Delete a post (author or admin) |
| `PUT` | `/:id/pin` | Pin/unpin a post (admin only) |

### 💼 Jobs (`/api/jobs`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | List all active job postings |
| `POST` | `/` | Create a job listing (alumni only) |
| `PUT` | `/:id` | Update a listing (poster only) |
| `DELETE` | `/:id` | Remove a listing |
| `POST` | `/:id/apply` | Submit a job application (student only) |

### 🎟️ Events (`/api/events`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | List all events |
| `POST` | `/` | Create an event (alumni only) |
| `PUT` | `/:id` | Update an event |
| `DELETE` | `/:id` | Delete an event |
| `POST` | `/:id/register` | Register interest for an event |

### 💬 Messages (`/api/messages`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/conversations` | Get all conversations for the current user |
| `GET` | `/:userId` | Fetch message history with a specific user |
| `POST` | `/` | Send a new direct message |

### 📅 Calendar (`/api/calendar`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Get calendar events for the current user |
| `POST` | `/` | Create a new calendar entry |
| `DELETE` | `/:id` | Remove a calendar entry |

### 🤖 AI Mentor (`/api/mentor`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/chat` | Send a prompt to the Groq Llama 3.3 AI mentor |

### 🛠️ Admin (`/api/admin`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/users` | List all platform users |
| `PUT` | `/users/:id/suspend` | Suspend or reactivate a user account |
| `GET` | `/logs` | Fetch admin action audit logs |
| `GET` | `/analytics` | Get platform-wide usage statistics |

### 👥 Directory (`/api/directory`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Browse the alumni directory |

### 👤 Users (`/api/users`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/:id` | Get a user's public profile |
| `PUT` | `/:id` | Update profile details |

### 📁 Upload (`/api/upload`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/` | Upload an image or file attachment |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18 or higher
- **Groq Cloud API Key** — required for AI Career Mentor features ([get one free](https://console.groq.com/))
- **MongoDB Atlas URI** — optional; the app auto-falls back to a local JSON database if omitted

### 1. Clone & Install

```bash
git clone https://github.com/arjun1228/Alumni-Interaction-Portal.git
cd Alumni-Interaction-Portal
npm run install:all
```

### 2. Environment Variables

#### Backend (`backend/.env.local`):
```env
PORT=5000
JWT_SECRET=your_32_character_long_jwt_secret_key_here
GROQ_API_KEY=your_groq_api_key_here

# Optional — omit to run in offline local JSON fallback mode
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/alumniconnect
```

#### Frontend (`frontend/.env.local`):
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Run the Application

Start both the backend server and the Vite dev server concurrently:
```bash
npm run dev
```

| Service | URL |
| :--- | :--- |
| **React Frontend** | http://localhost:3000 |
| **Express Backend API** | http://localhost:5000 |

---



## 💡 Database Mode Auto-Switching

If `MONGO_URI` is not set or MongoDB Atlas is unreachable, the server automatically switches to offline mode:

```
⚠️ MongoDB connection failed. Switching to Local JSON file mode.
```

The `backend/services/dataStore.js` service seeds and manages `backend/data.json` transparently — no extra configuration needed for local development.

---


