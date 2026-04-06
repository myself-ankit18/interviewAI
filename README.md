# ✨ InterviewGenie (Tactical Interview AI)

> **Outsmart the System. Secure the Offer.**

InterviewGenie is a full-stack, AI-powered platform designed to completely automate and personalize interview preparation. By analyzing your baseline PDF resume against a target job description, the system computationally builds a complete, highly-targeted interview battle plan.

Say goodbye to generic interview advice and blindly submitting resumes to Applicant Tracking Systems (ATS).

## 🚀 Key Features

- 📄 **Dynamic Resume Forging (Puppeteer)**: Automatically renders and downloads a newly optimized, ATS-friendly PDF resume on the fly, tailored specifically to the job description.
- 📊 **Targeted Heatmaps (Skill Analysis)**: Cross-references your resume with the job description to pinpoint exactly which required technical keywords you are missing.
- 🧠 **Predictive Q&A Engine**: Pre-loads the hardest behavioral and technical questions expected for the role, providing comprehensive "Power Answers" to use as study guides.
- 📅 **Custom Study Roadmaps**: Outputs a structured, day-by-day 7-day tactical preparation timeline to bridge your knowledge gaps before your interview.
- 💡 **Project Idea Generator**: Need more experience? The AI suggests custom software project ideas designed to fill the specific gaps in your resume.

---

## 💻 Tech Stack & Architecture

### **Frontend**
- **React.js** (Vite)
- **SCSS**: Custom dark-mode "tactical cyber-ops" aesthetic. Dynamic glowing animations and responsive layouts.
- **Context API** for State Management (`AuthContext`, `InterviewContext`)

### **Backend**
- **Node.js & Express.js**
- **MongoDB & Mongoose**: Secure data persistence, schema validation, and user/report history.
- **Puppeteer & PDF-Parse**: Headless Chrome instance utilized to dynamically generate styled PDF resumes and parse incoming PDF strings.
- **LLM Integrations**: Configured to work seamlessly with cutting-edge open-weights models (via APIs like Groq, OpenRouter, Moonshot Kimi, Llama 3, etc.).

---

## 🛠️ Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v18+)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas)
- An AI API Key (Groq, OpenRouter, etc.)

### 1. Clone the Repository
```bash
git clone https://github.com/myself-ankit18/interviewAI.git
cd interviewAI
```

### 2. Install Dependencies
You will need to install dependencies for both the frontend and the backend.
```bash
# Install backend dependencies
cd backend
npm install

# Installs Puppeteer's matched Chromium binary
npx puppeteer browsers install chrome

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Variables
Create a `.env` file in the `/backend` directory based on the following structure:
```env
# Backend Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=30d

# Cross-Domain Cookie Auth
FRONTEND_URL=http://localhost:5173

# AI APIs
AI_API_KEY=your_llm_api_key
```

### 4. Run the Application
Start both the backend server and the frontend development environment.

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

The app will now be running on `http://localhost:5173`.

---

## 📡 Advanced Infrastructure: Puppeteer rendering
One of the core engineering achievements in this project is the **PDF Generation Engine**. 
The backend leverages `puppeteer-core` to launch headless browser instances. It receives markdown-rendered HTML synthesized by the LLM, injects high-fidelity CSS matching standard resume templates, and renders perfect PDFs remotely. 
*Note: If deploying to environments like Vercel or Render, additional buildpacks/configuration are required to run Chromium headlessly.*

---

## 📝 License
This project is for educational and portfolio purposes. 
Created by Ankit.

*If this project helps you crack your interviews, don't forget to drop a ⭐ on the repository!*
