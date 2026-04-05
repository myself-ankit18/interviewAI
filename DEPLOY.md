# 🚀 Deployment Guide: InterviewGenie

This guide provides step-by-step instructions for deploying the **InterviewGenie** application to production while maintaining local development compatibility.

---

## 1. Backend Deployment (Render)

Render is recommended for the Node.js backend.

### Steps:
1.  **Create a Web Service**: Log in to [Render](https://render.com/) and create a new "Web Service".
2.  **Connect GitHub**: Connect your repository.
3.  **Configure Settings**:
    - **Root Directory**: `backend`
    - **Runtime**: `Node`
    - **Build Command**: `npm install`
    - **Start Command**: `node server.js`
4.  **Environment Variables**:
    Go to the **Environment** tab and add the following keys from your current `backend/.env`:
    - `MONGO_URI`: Your MongoDB connection string.
    - `JWT_SECRET`: Your random JWT secret string.
    - `GOOGLE_GENAI_API_KEY`: Your Google AI key.
    - `GROQ_API_KEY`: Your Groq AI key.
    - `EMAIL_USER`: Your email address for OTPs.
    - `EMAIL_PASSWORD`: Your App Password for the email.
    - `CLIENT_URL`: The URL of your deployed frontend (e.g., `https://interview-genie.vercel.app`).
    - `PORT`: (Render sets this automatically, but you can set it to `3000`).

---

## 2. Frontend Deployment (Vercel)

Vercel is the best choice for Vite/React applications.

### Steps:
1.  **Create a Project**: Log in to [Vercel](https://vercel.com/) and "Add New Project".
2.  **Connect GitHub**: Import your repository.
3.  **Configure Build Settings**:
    - **Root Directory**: `frontend`
    - **Framework Preset**: `Vite`
    - **Build Command**: `npm run build`
    - **Output Directory**: `dist`
4.  **Environment Variables**:
    Expand the **Environment Variables** section and add:
    - `VITE_API_BASE_URL`: The URL of your deployed backend (e.g., `https://interview-genie-api.onrender.com`). *Note: Do NOT include a trailing slash.*

---

## 3. How the "Local + Production" Setup Works

We've updated the code to automatically detect where it's running:

### Backend (`server.js` & `app.js`)
- It now uses `process.env.PORT || 3000`. In production (Render), it will use the assigned port; locally, it stays on `3000`.
- CORS now uses `process.env.CLIENT_URL || "http://localhost:5173"`. This allows your local React dev server to communicate with the backend without changes.

### Frontend (`src/api/api.js`)
- We centralized the API configuration. It now uses:
  ```javascript
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
  ```
- **Locally**: It defaults to `http://localhost:3000`.
- **Production**: Vercel will inject `VITE_API_BASE_URL`, directing requests to your live backend.

---

## 4. Verification Check
After deploying both:
1.  Copy the **Backend URL** from Render.
2.  Paste it into the **Vercel environment variables** for `VITE_API_BASE_URL`.
3.  Redeploy the Frontend on Vercel.
4.  Open the Frontend URL and test the login/registration flow!
