import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/navbar/Navbar.jsx'
import ProtectedRoute from './components/common/ProtectedRoute.jsx'
import Loader from './components/common/Loader.jsx'

// Lazy-loaded route pages for code-splitting
const Home = lazy(() => import('./pages/Home.jsx'))
const Login = lazy(() => import('./pages/Login.jsx'))
const Register = lazy(() => import('./pages/Register.jsx'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'))
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const Templates = lazy(() => import('./pages/Templates.jsx'))
const PortfolioWizard = lazy(() => import('./pages/PortfolioWizard.jsx'))
const PortfolioEditor = lazy(() => import('./pages/PortfolioEditor.jsx'))
const Analytics = lazy(() => import('./pages/Analytics.jsx'))
const ResumeBuilder = lazy(() => import('./pages/ResumeBuilder.jsx'))
const Settings = lazy(() => import('./pages/Settings.jsx'))
const PublicPortfolio = lazy(() => import('./pages/PublicPortfolio.jsx'))

const PageFallback = () => (
  <div className="min-h-[70vh] flex items-center justify-center bg-gray-50/50">
    <Loader size="lg" text="Loading page..." />
  </div>
)

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#1e293b',
            color: '#fff',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 500,
          pointerEvents: 'none',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Navbar />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/u/:slug" element={<PublicPortfolio />} />

          {/* Protected Creator Workspace Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wizard"
            element={
              <ProtectedRoute>
                <PortfolioWizard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/editor/:id?"
            element={
              <ProtectedRoute>
                <PortfolioEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume"
            element={
              <ProtectedRoute>
                <ResumeBuilder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}
