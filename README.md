# PortfolioForge – No-Code Portfolio Website Builder

> "Your Career. Your Portfolio. Your Identity."

PortfolioForge is a production-quality, full-stack MERN SaaS web application that empowers developers, designers, students, and professionals to build, customize, preview, and publish professional portfolio websites without writing any code.

---

## 🌟 Key Features

1. **5 Handcrafted, Distinct Portfolio Templates**:
   - **Minimal Professional**: Executive typography, elegant whitespace, clean lines for corporate leaders and consultants.
   - **Modern Developer**: Monospace code aesthetic, interactive terminal cards, tech stack pills, and GitHub repository links.
   - **Creative Designer**: Vibrant gradients, spotlight project showcases, bold typography, and visual media cards.
   - **Student & Graduate**: Education-forward hierarchy, academic coursework, GPA/honors badges, and internship highlights.
   - **Professional Dark Theme**: High-contrast OLED dark styling, glowing neon borders, and cyber tech aesthetics.

2. **Real-Time Live Portfolio Editor**:
   - Instant live preview that updates simultaneously as you type.
   - Viewport device switcher (Desktop, Tablet, Mobile) to preview responsive layouts live.
   - Tabbed section controls: Personal Info, About Me, Work Experience, Projects, Skills, Education, Certifications, and Social Links.
   - Theme customizer: Primary brand colors, font family picker, and dark mode palette switch.
   - Reorder sections (Move Up / Down) and toggle section visibility with a single click.
   - Direct image file uploads for profile photos and project screenshots.
   - Automatic debounced background saving with status indicator (`Saving...` / `All changes saved`).

3. **7-Step Portfolio Creation Wizard**:
   - Guided onboarding process (Personal, Education, Skills, Projects, Experience, Certifications, Template & Handle).
   - "Save & Go to Editor" at any time.

4. **Public Portfolio Hosting & Dynamic Routing**:
   - Clean vanity URLs: `portfolioforge.com/u/:slug` (e.g., `/u/alex-demo`).
   - Accessible worldwide without requiring authentication when published.
   - Draft protection: unpublished portfolios return `403` draft notice.
   - Slug collision avoidance and real-time availability validation.
   - Built-in social sharing modal with direct links for LinkedIn, Twitter, and WhatsApp.

5. **Real-Time Visitor Telemetry & Analytics Dashboard**:
   - Zero third-party cookies or intrusive scripts.
   - Real-time logging of page impressions and project demo clicks directly in MongoDB.
   - Interactive data visualizations with **Recharts**:
     - 14-day traffic trend area chart.
     - Device distribution pie chart (Desktop vs Mobile vs Tablet).
     - Top performing projects bar chart.
     - Live visitor event activity log.

6. **Automated Resume PDF Builder**:
   - Synchronizes directly with saved portfolio data.
   - Clean, ATS-friendly printable layout (Modern & Classic formats).
   - Instant single-click browser PDF export (`window.print()`).

7. **AI-Powered Content Assistant**:
   - Integrated with Google Gemini API (`gemini-1.5-flash`) via the backend.
   - Intelligent domain-specific generator fallback if no API key is set.
   - 1-click "✨ Polish with AI" for project descriptions, about me summaries, and catchy professional headlines.

8. **Security & Authentication**:
   - JWT authentication stored securely.
   - Password hashing with `bcryptjs`.
   - Stricter rate-limiting on sensitive authentication endpoints.
   - Full password reset workflow with secure crypto verification tokens.
   - Protected routes and authorization checks ensuring users can only modify their own data.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, React Router DOM v7, React Hook Form, Recharts, Lucide React, Axios, React Hot Toast |
| **Backend** | Node.js, Express.js (ES modules), Mongoose 8, JWT, bcryptjs, Multer, Cloudinary, express-rate-limit |
| **Database** | MongoDB 8.2 (Local or MongoDB Atlas) |
| **AI Integration** | Google Gemini API with smart algorithmic fallback engine |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v20 or higher
- **MongoDB**: Local MongoDB community server (port 27017) or MongoDB Atlas URI

---

### 1. Backend Setup

```bash
cd server

# Install dependencies
npm install

# Configure environment variables
# Copy .env.example to .env
cp .env.example .env
```

Verify your `server/.env` configuration:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/portfolioforge
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

# Optional: Cloudinary credentials (local server file uploads will be used if left empty)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Optional: Google Gemini API key (built-in intelligent algorithmic generator used if left empty)
GEMINI_API_KEY=
```

#### Seed Demo Data (Optional but recommended):
```bash
# Seeds demo user (alex.demo@portfolioforge.dev / Password123!) and 2 published portfolios with analytics
node seedDemo.js
```

#### Start Backend Server:
```bash
npm run dev
# Server runs on http://localhost:5000
# Health check: http://localhost:5000/api/health
```

---

### 2. Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Start Vite development server
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 🧪 Testing & Verification

PortfolioForge includes comprehensive automated integration test suites.

### Run End-to-End Test Suite:
```bash
cd server
node testEndToEnd.js
```
Runs 16 sequential tests covering health, templates, registration, login, auth protection, portfolio creation, draft verification, publishing, public retrieval, view tracking, click tracking, analytics aggregation, AI assistant, resume generation, duplication, and unpublishing.

### Run Auth & Security Test Suite:
```bash
cd server
node testAuthAndFeatures.js
```
Tests demo credentials, public URLs, tokenized password recovery, and slug collision detection.

### Test Frontend Production Build:
```bash
cd client
npm run build
```

---

## 🔑 Demo Account Credentials

To quickly test the platform without manually registering:
- **Email**: `alex.demo@portfolioforge.dev`
- **Password**: `Password123!`
*(You can also click the "Fill Demo" button on the Login page)*

**Seeded Public Portfolio URLs**:
- Modern Developer Template: `http://localhost:5173/u/alex-demo`
- Creative Designer Template: `http://localhost:5173/u/alex-creative`

---

## 🚢 Deployment Guidelines

### Frontend: Vercel
1. Push repository to GitHub.
2. In Vercel, import the repository and set the root directory to `client`.
3. Set Build Command to `npm run build` and Output Directory to `dist`.
4. Add Environment Variable:
   - `VITE_API_URL`: `https://your-backend-api.onrender.com/api`

### Backend: Render
1. In Render, create a new **Web Service** connected to your repository with root directory `server`.
2. Build Command: `npm install`
3. Start Command: `node server.js`
4. Configure Environment Variables:
   - `MONGO_URI`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: A long random secret string.
   - `CLIENT_URL`: `https://your-app.vercel.app`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `GEMINI_API_KEY`: Your Google AI Studio API key.

---

## 📁 Project Structure

```
portfolioforge/
├── client/                     # Vite + React 19 Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Navbar, Footer, Loader, ProtectedRoute, ShareModal
│   │   │   └── navbar/
│   │   ├── context/            # AuthContext (JWT, user state, login/logout)
│   │   ├── pages/              # Home, Login, Register, ForgotPassword, ResetPassword,
│   │   │                       # Dashboard, Templates, PortfolioWizard, PortfolioEditor,
│   │   │                       # PublicPortfolio, Analytics, ResumeBuilder, Settings
│   │   ├── services/           # api, authService, portfolioService, analyticsService,
│   │   │                       # aiService, resumeService, uploadService
│   │   ├── templates/          # MinimalTemplate, DeveloperTemplate, CreativeTemplate,
│   │   │                       # StudentTemplate, DarkTemplate, TemplateRenderer
│   │   ├── App.jsx             # React Router routing & Toaster configuration
│   │   └── main.jsx
│   └── package.json
│
├── server/                     # Node.js + Express + MongoDB Backend
│   ├── config/                 # db.js (Mongoose connection)
│   ├── controllers/            # auth, portfolio, analytics, template, ai, resume, upload
│   ├── middleware/             # authMiddleware (JWT protect), errorMiddleware, uploadMiddleware
│   ├── models/                 # User, Portfolio, Analytics, PortfolioVersion
│   ├── routes/                 # Express REST endpoints
│   ├── services/               # aiService (Gemini API), cloudinaryService
│   ├── utils/                  # templatesData
│   ├── uploads/                # Local uploads fallback directory
│   ├── seedDemo.js             # Realistic demo data seeder
│   ├── testEndToEnd.js         # Comprehensive 16-step E2E test suite
│   ├── testAuthAndFeatures.js  # Security & advanced feature test suite
│   ├── server.js               # Entrypoint & Express configuration
│   └── package.json
│
└── README.md
```

---

## 📜 License
ISC License. Built for modern creators and professionals worldwide.
