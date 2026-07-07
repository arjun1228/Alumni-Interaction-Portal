import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const apiKey = process.env.VITE_GEMINI_API_KEY;
let ai = null;

if (apiKey && apiKey !== 'AIzaSyDFbwHflFH6Y3nueGC-By7sU4nbiCTyO3U') {
    try {
        ai = new GoogleGenAI({ apiKey });
    } catch (err) {
        console.warn('⚠️ Gemini Client failed to initialize. Using career simulator fallback mode.', err.message);
    }
} else {
    console.warn('⚠️ Gemini VITE_GEMINI_API_KEY is not set or using placeholder. Running in Simulator Mode.');
}

const generateWithFallback = async (prompt, fallbackGenerator) => {
    if (!ai) {
        return fallbackGenerator();
    }
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        if (response && response.text) {
            return response.text;
        }
        return fallbackGenerator();
    } catch (err) {
        console.error('⚠️ Gemini API error, falling back to simulated output:', err.message);
        return fallbackGenerator();
    }
};

export const analyzeResume = async (resumeText) => {
    const prompt = `You are an expert technical recruiter and resume writer. 
Analyze the following resume details and provide a comprehensive critique in Markdown format.
Focus on:
1. Impact: Are the accomplishments quantifiable?
2. Structure & Formatting: Suggest improvements for clarity and readability.
3. ATS Optimization: How well does this align with modern applicant tracking systems?
4. Actionable items: Provide 3-5 specific bullet point changes they can apply immediately.

Resume Text:
${resumeText}`;

    return generateWithFallback(prompt, () => {
        return `### 📝 Simulated Resume Analysis (Offline/Simulator Mode)

Your resume has a strong foundation, but can be optimized for technical recruiters and ATS algorithms.

#### Key Feedback Areas:
1. **🚀 Action-Oriented Phrasing**
   - Start bullet points with strong action verbs (e.g., *Architected*, *Spearheaded*, *Optimized*) instead of passive terms like *Responsible for...*
2. **📈 Quantifiable Achievements**
   - Add metrics to demonstrate scale and success. For example: *"Improved client page response times by 35% using React lazy-loading"* instead of *"Made the website load faster."*
3. **💻 Skill Taxonomy**
   - Categorize your skills clearly: Languages (JavaScript, TypeScript), Frameworks (React, Express), and Tools (Git, Docker) to help recruiters scan in 5 seconds.
4. **📄 Layout Simplicity**
   - Keep a clean single-column structure. Avoid complex multi-column grids or graphics that might parse incorrectly in ATS parsing scanners.

#### 💡 Suggested Action Items:
* **Change:** *"Wrote API endpoints"* **To:** *"Designed and implemented 15+ secure RESTful API routes using Express and MongoDB, processing 2000+ daily requests."*
* **Change:** *"Worked in a team for portal"* **To:** *"Collaborated in an agile team of 4 engineers using Git flow, reducing merge conflicts by 15%."*`;
    });
};

export const generateMockInterview = async (role, skills) => {
    const prompt = `You are a Senior Technical Interviewer. 
Generate a list of 5-7 customized behavioral and technical interview questions for a candidate applying for the role of "${role}" with the skills: ${skills.join(', ')}.
For each question, provide:
1. Why this question is asked.
2. Suggested answer structure (e.g., STAR method).
3. Example topics they should touch upon.
Format the output in clean Markdown.`;

    return generateWithFallback(prompt, () => {
        return `### 🤝 Simulated Mock Interview Prep: ${role} (Offline/Simulator Mode)

Here are 5 targeted interview questions tailored to your skills (${skills.join(', ')}):

#### 1. "Can you walk us through a complex problem you solved in your past project?"
* **Why it's asked:** To evaluate problem-solving capabilities, logical thinking, and engineering style under pressure.
* **Suggested Structure:** Use the **STAR** method (Situation, Task, Action, Result).
* **Key Topics:** Highlight trade-offs, architecture decisions, and metrics showing the final outcome.

#### 2. "How do you handle state management in complex applications?"
* **Why it's asked:** Tests deep technical understanding of frontend architectures.
* **Suggested Structure:** Compare React Context, Redux, or local state with their appropriate use-cases.
* **Key Topics:** Re-renders, performance optimization, and architectural cleanliness.

#### 3. "Explain the difference between SQL and NoSQL databases, and when you would choose one over the other."
* **Why it's asked:** Evaluates database design principles and system design basics.
* **Suggested Structure:** Define structural constraints, schemas, and scalability profiles.
* **Key Topics:** ACID compliance, horizontal scaling, and query flexibility.

#### 4. "How do you ensure secure user authentication in a Node.js/Express environment?"
* **Why it's asked:** Security is critical. This verifies your experience with JWT, hashing, and authorization protocols.
* **Suggested Structure:** Describe secure cookie/header token storage, bcrypt hashing, and middleware guards.
* **Key Topics:** JWT verification, password salting, CORS configurations, and token expiry.

#### 5. "Describe a situation where you had a technical disagreement with a peer. How did you resolve it?"
* **Why it's asked:** Evaluates teamwork, communications skill, and emotional intelligence.
* **Suggested Structure:** Describe the situation calmly, focus on data-driven trade-offs, and highlight the compromise.
* **Key Topics:** Empathy, document-driven design, and technical collaboration.`;
    });
};

export const analyzeSkillGap = async (currentSkills, targetJob) => {
    const prompt = `You are a Career Transition Mentor.
Perform a skill gap analysis for a student with the current skills: ${currentSkills.join(', ')} aiming for the target job role: "${targetJob}".
Provide:
1. Primary gaps: Which critical technical and soft skills are missing?
2. Target Roadmap: What should they learn month-by-month to bridge the gap?
3. Suggested Projects: Specific projects they can build to show competence.
4. Recommended Certifications/Resources.
Format in Markdown.`;

    return generateWithFallback(prompt, () => {
        return `### 📊 Simulated Skill Gap Analysis (Offline/Simulator Mode)

* **Current Skills:** ${currentSkills.join(', ')}
* **Target Goal:** ${targetJob}

#### 1. 🔍 Identified Gaps:
* **System Architecture:** Scalability, cloud architectures (AWS/GCP), and distributed caches (Redis).
* **Testing suite:** Unit/Integration testing using Jest, Cypress, or Supertest.
* **CI/CD Pipelines:** Containerization (Docker) and deployment pipelines (GitHub Actions).

#### 2. 🗺️ Month-by-Month Roadmap:
* **Month 1:** Focus on system design, database caching, and indexes.
* **Month 2:** Learn test-driven development (TDD) writing unit tests for your routes.
* **Month 3:** Containerize your applications using Docker and set up automated lint/test workflows on commits.

#### 3. 🛠️ Recommended Portfolio Project:
* **Distributed Task Queue:** Build a backend application with Redis queues and worker systems to process tasks asynchronously. Write full unit tests and deploy it on a cloud instance.`;
    });
};
