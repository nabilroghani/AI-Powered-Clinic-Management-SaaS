# ⚡ MedPulse AI — Grounded Clinic Management SaaS Platform

![MedPulse AI SaaS](https://img.shields.io/badge/MedPulse%20AI-SaaS%20Platform-indigo?style=for-the-badge&logo=medpulse)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-2.0%20Flash-4285F4?style=for-the-badge&logo=googlegemini)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-Vanilla%20CSS-38B2AC?style=for-the-badge&logo=tailwindcss)

> **MedPulse AI** is a production-grade, multi-role Clinical Intelligence SaaS platform. It combines clinical operations management (Intake, Appointments, Prescriptions, Staff RBAC) with real-time **Google Gemini 2.0 Grounded RAG (Retrieval-Augmented Generation)** to assist doctors with instant symptom triage and empower patients with bilingual (English & Urdu 🇵🇰) prescription explanations.

---

## 📖 The Story Behind MedPulse AI

Traditional clinic management systems are fragmented—doctors spend more time typing than listening to patients, patients struggle to decipher handwritten medical jargon, and clinic owners lack real-time operational insights. 

**MedPulse AI** was born to bridge this gap. Designed as a unified SaaS ecosystem, it connects **Clinic Administrators**, **Attending Doctors**, **Front-Desk Receptionists**, and **Patients** in one intelligent workflow. By embedding **Google Gemini 2.0 AI with Live MongoDB Grounded RAG**, MedPulse transforms raw medical data into actionable clinical decision support for clinicians and crystal-clear care guidance in native languages for patients.

---

## 🔥 Key Features & Capabilities

### 🩺 1. Doctor Command Center & Gemini AI Triage
* **Real-Time Gemini AI Symptom Triage**: Clinicians input patient symptoms (e.g., *"102F fever, severe headache, chills"*); Gemini AI returns differential diagnosis conditions, risk stratification (Low/Medium/High), and recommended lab tests.
* **Persistent Prescriptions & Clinical Records**: Every prescription saved in MongoDB database persists seamlessly across logins.
* **Recharts Consultation Analytics**: Dynamic 7-day visual consultation volume and prescription issuance trends.
* **Patient History Drawer**: Full timeline modal displaying past appointments, diagnoses, and treatments.

### 🧑 2. Patient Portal & Multilingual Explainer (Urdu & English)
* **1-Click Multilingual AI Explainer**: Patients can click **`🇬🇧 Explain in English`** or **`🇵🇰 Explain in Urdu (اردو)`** to convert complex medical dosages into easy-to-read care summaries, lifestyle advice, and preventive tips.
* **📄 Official PDF Prescription Export**: Generate digital clinical prescriptions formatted as downloadable PDFs.
* **Appointment Timeline**: Real-time view of upcoming booked visits and past consultation history.

### 📋 3. Reception Desk & 1-Click Intake
* **Patient Intake & Credentials Generator**: Registers patients and auto-generates secure portal email & password credentials.
* **Smart Appointment Presets**: 1-Click date & time slot booking presets (*Today 10:00 AM*, *Tomorrow 02:00 PM*).

### 👑 4. Admin Management & SaaS Billing Analytics
* **Role-Based Access Control (RBAC)**: Secure access rules for `admin`, `doctor`, `receptionist`, and `patient`.
* **Doctor & Staff Onboarding**: Admins can onboard clinicians and front-desk staff.
* **SaaS Analytics**: Subscription tier management (Free vs Pro) and clinic performance stats.

### ⚡ 5. Antigravity AI Assistant (Live DB Grounded RAG)
* **Floating Clinical Assistant**: Accessible from any page in the bottom-right corner.
* **Grounded RAG Engine**: Automatically injects live MongoDB context (doctor's patients today, patient's active prescriptions, clinic metrics) into the Gemini AI prompt for grounded, data-backed responses.

---

## 🛠️ Technology Stack

| Component | Technologies Used |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Recharts, HTML2PDF.js, Lucide Icons |
| **Backend** | Node.js, Express.js, ES Modules, JWT Authentication, BcryptJS |
| **Database** | MongoDB Atlas, Mongoose ODM |
| **AI Integration** | Google Gemini 2.0 Flash API (`@google/genai`), Custom RAG Prompt Injector |
| **Deployment** | Vercel Serverless (Backend API) + Netlify (Frontend SPA) |

---

## 🔑 Demo Login Credentials

All test accounts are pre-configured with the default password: **`password123`**

| Role | Email | Password | Primary Dashboard |
| :--- | :--- | :--- | :--- |
| 🩺 **Doctor** | `doctor@clinic.com` | `password123` | `/doctor` |
| 👑 **Admin** | `admin@clinic.com` | `password123` | `/admin` |
| 📋 **Receptionist** | `receptionist@clinic.com` | `password123` | `/receptionist` |
| 🧑 **Patient** | `patient@clinic.com` | `password123` | `/patient` |

> *Note: Click the **⚡ Reset Passwords** button on the Login page anytime to reset all demo credentials to `password123`.*

---

## 🚀 Local Installation & Setup

### Prerequisites
* **Node.js**: v18.x or higher
* **MongoDB**: Local MongoDB or MongoDB Atlas URI
* **Google Gemini API Key**: Free API Key from [Google AI Studio](https://aistudio.google.com/)

### 1. Clone Repository
```bash
git clone https://github.com/your-username/AI-Powered-Clinic-Management-SaaS.git
cd AI-Powered-Clinic-Management-SaaS
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGODB_URI=
JWT_SECRET=
GOOGLE_API_KEY=
GEMINI_MODEL=
NODE_ENV=
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend/` directory:
```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend Vite dev server:
```bash
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## 📡 API Endpoints Summary

### Authentication (`/api/auth`)
- `POST /api/auth/login`: Authenticate user & receive JWT token
- `POST /api/auth/register`: Register new Clinic Administrator account
- `GET /api/auth/me`: Get current logged-in user profile
- `GET /api/auth/seed-test-users`: Reset/Initialize test accounts (`password123`)

### Clinical & AI Operations (`/api/prescriptions`)
- `POST /api/prescriptions`: Save persistent prescription record (Doctor)
- `GET /api/prescriptions/doctor`: Fetch doctor's patients, prescriptions & analytics graph data
- `GET /api/prescriptions/history/:patientId`: Fetch complete patient clinical history timeline
- `POST /api/prescriptions/ai-diagnose`: Run Google Gemini AI Symptom Triage
- `POST /api/prescriptions/ai-explain/:id`: Generate bilingual (Urdu/EN) prescription explanation
- `POST /api/prescriptions/ai-assistant`: Grounded RAG Antigravity AI Assistant query

---

## 📜 License
Distributed under the **MIT License**. See `LICENSE` for details.

---

<p center>
  Developed with ❤️ by Nabil Roghani
</p>
