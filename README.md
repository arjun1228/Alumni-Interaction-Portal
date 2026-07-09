# AlumniConnect Portal

AlumniConnect Portal is a modern, responsive networking platform that bridges the gap between students, alumni, and administrators. The portal enables student-alumni interactions, job opportunities publishing, events hosting, direct instant messaging, and features a backend-routed **AI Career Mentor** (powered by Llama 3.3 70B via Groq) for resume analysis, interview coaching, and skill-gap roadmap generation.

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** React, Vite, Lucide React, Tailwind CSS (vanilla-flexible layouts)
- **Backend:** Node.js, Express, Zod (validation schemas), JWT (authentication)
- **Data Layer:** Hybrid MongoDB Atlas (production/online) & Auto-created `data.json` (offline local database fallback)
- **AI Integrations:** Groq Cloud SDK (`llama-3.3-70b-versatile`)

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **Groq Cloud API Key** (for Llama 3.3 Career Mentor features)
- **MongoDB Atlas Connection URI** (Optional; will fallback to local `backend/data.json` automatically if omitted or offline)

### 1. Installation
Run the root setup utility to automatically download and configure all dependencies in both workspace directories:
```bash
npm run install:all
```

### 2. Environment Variables Configuration

Create the environment variable configuration files relative to the respective module roots:

#### Backend configuration (`backend/.env.local`):
```env
PORT=5000
JWT_SECRET=your_32_character_long_jwt_secret_key_here
GROQ_API_KEY=your_groq_api_key_here

# Optional: MongoDB connection (leaves blank to run in offline local database fallback mode)
MONGO_URI=mongodb+srv://...
```

#### Frontend configuration (`frontend/.env.local`):
*(Frontend configuration holds no API keys or developer credentials)*
```env
# Configures Vite server port environment
VITE_API_URL=http://localhost:5000/api
```

---

## 💻 Running the Application

Start both the backend server and frontend development client concurrently using the root dev alias:
```bash
npm run dev
```

* **Vite React App:** [http://localhost:3000](http://localhost:3000)
* **Express Backend Server:** [http://localhost:5000](http://localhost:5000)

---

## 🔐 Platform Roles Reference Table

| Role Identifier | Portal Views & Capabilities | Default Seed Login Credentials |
| :--- | :--- | :--- |
| **Admin** | Suspend/reactivate users, inspect health analytics, pin posts, and delete listings directly from community views. | `admin@college.edu` / `password123` |
| **Student** | Browse alumni directories, register for workshops, apply to jobs, and chat with mentors. | `emily.wong@university.edu` / `password123` |
| **Alumni** | Post jobs (full-time only), host workshops, register interest, and mentor undergraduates. | `sarah.jenkins@example.com` / `password123` |

---

## 💡 Database Mode Auto-Switching
The application uses an automated offline fallback mode. If no `MONGO_URI` is provided or if MongoDB Atlas cannot be reached, the server logs a notice:
`⚠️ MongoDB connection failed. Switching to Local JSON file mode.`
And automatically seeds and updates `backend/data.json` locally.

---

## 🔍 Verifying the Frontend Build
After making any dependency or configuration changes affecting Vite, Tailwind CSS, or styles:
1. Run the production build command:
   ```bash
   npm run build --prefix frontend
   ```
2. Check the size of the generated stylesheet in `frontend/dist/assets/index-*.css`.
   - **Expectation:** The file size should be at least **40+ kB** (several tens of kilobytes).
   - **Warning Sign:** If the generated CSS file is suspiciously small (e.g. **10–12 kB** or less), it indicates that Tailwind's utility classes are not compiling properly (likely due to missing/incorrect imports or content scanner source configurations).

