import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { SELECTED_PORTFOLIO_STORAGE_KEY } from '../../utils/portfolioData.js'
import {
  Sparkles,
  LayoutDashboard,
  FolderKanban,
  Palette,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  ChevronDown,
} from 'lucide-react'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const editorPortfolioId = location.pathname.match(/^\/editor\/([^/]+)/)?.[1]
  const selectedPortfolioId = new URLSearchParams(location.search).get('id') || editorPortfolioId || localStorage.getItem(SELECTED_PORTFOLIO_STORAGE_KEY) || ''
  const portfolioQuery = selectedPortfolioId ? `?id=${encodeURIComponent(selectedPortfolioId)}` : ''
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setDropdownOpen(false)
  }, [location.pathname])

  // Hide the global platform navbar when viewing a public user portfolio
  if (location.pathname.startsWith('/u/')) {
    return null
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true
    if (path !== '/' && location.pathname.startsWith(path)) return true
    return false
  }

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-200 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-gray-900 group-hover:text-purple-600 transition-colors">
                Portfolio<span className="text-purple-600">Forge</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1 lg:space-x-2">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/') ? 'text-purple-600 font-semibold' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Home
                </Link>
                <a
                  href="/#features"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Features
                </a>
                <Link
                  to={`/templates${portfolioQuery}`}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/templates') ? 'text-purple-600 font-semibold' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Templates
                </Link>
                <a
                  href="/#faq"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  FAQ
                </a>
                <a
                  href="/#faq"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  FAQ
                </a>
              </>
            ) : (
              <>
                <Link
                  to="/dashboard"
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/dashboard') ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to={`/templates${portfolioQuery}`}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/templates') ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Palette className="w-4 h-4" />
                  <span>Templates</span>
                </Link>
                <Link
                  to="/analytics"
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/analytics') ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Analytics</span>
                </Link>
                <Link
                  to={`/resume${portfolioQuery}`}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/resume') ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Resume</span>
                </Link>
              </>
            )}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden lg:flex items-center space-x-3">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-200 transition-all hover:shadow-lg active:scale-95"
                >
                  Get Started Free
                </Link>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/wizard"
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 shadow-sm shadow-purple-200 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Portfolio</span>
                </Link>

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    {user?.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-purple-200"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                        {user?.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-800 max-w-[120px] truncate">
                      {user?.name?.split(' ')[0] || 'User'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in duration-150">
                      <div className="px-4 py-2.5 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center space-x-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                        >
                          <FolderKanban className="w-4 h-4 text-gray-400" />
                          <span>My Portfolios</span>
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center space-x-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                        >
                          <Settings className="w-4 h-4 text-gray-400" />
                          <span>Account Settings</span>
                        </Link>
                      </div>

                      <div className="pt-1 border-t border-gray-100">
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-2.5 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-6 space-y-3 animate-in slide-in-from-top duration-200">
          {!isAuthenticated ? (
            <div className="space-y-1">
              <Link
                to="/"
                className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                Home
              </Link>
              <Link
                to={`/templates${portfolioQuery}`}
                className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                Templates
              </Link>
              <a
                href="/#features"
                className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                Features
              </a>
              <a
                href="/#faq"
                className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                FAQ
              </a>
              <div className="pt-4 space-y-2">
                <Link
                  to="/login"
                  className="block text-center w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="block text-center w-full py-2.5 rounded-xl bg-purple-600 text-sm font-semibold text-white shadow-md shadow-purple-200"
                >
                  Get Started Free
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-3 py-2 flex items-center space-x-3 mb-2 bg-purple-50 rounded-xl">
                <div className="w-9 h-9 rounded-full bg-purple-200 text-purple-800 flex items-center justify-center font-bold">
                  {user?.name?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <LayoutDashboard className="w-4 h-4 text-purple-600" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/wizard"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Plus className="w-4 h-4 text-purple-600" />
                <span>Create New Portfolio</span>
              </Link>
              <Link
                to="/templates"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Palette className="w-4 h-4 text-purple-600" />
                <span>Templates</span>
              </Link>
              <Link
                to="/analytics"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <BarChart3 className="w-4 h-4 text-purple-600" />
                <span>Analytics</span>
              </Link>
              <Link
                to={`/resume${portfolioQuery}`}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <FileText className="w-4 h-4 text-purple-600" />
                <span>Resume Builder</span>
              </Link>
              <Link
                to="/settings"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Settings className="w-4 h-4 text-purple-600" />
                <span>Account Settings</span>
              </Link>
              <div className="pt-2 border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
