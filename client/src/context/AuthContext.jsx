import { createContext, useContext, useState, useEffect } from 'react'
import { getMe, loginUser, registerUser, updateProfile } from '../services/authService.js'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() => localStorage.getItem('token') || null)
  const [loading, setLoading] = useState(true)

  // Initialize and verify user on mount
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token')
      if (savedToken) {
        try {
          const res = await getMe()
          if (res.success && res.user) {
            setUser(res.user)
            localStorage.setItem('user', JSON.stringify(res.user))
          }
        } catch (err) {
          console.warn('Session expired or invalid, logging out:', err.message)
          logout()
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (credentials) => {
    const res = await loginUser(credentials)
    if (res.success && res.token) {
      setToken(res.token)
      setUser(res.user)
      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
      return res
    }
    throw new Error(res.message || 'Login failed')
  }

  const register = async (userData) => {
    const res = await registerUser(userData)
    if (res.success && res.token) {
      setToken(res.token)
      setUser(res.user)
      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
      return res
    }
    throw new Error(res.message || 'Registration failed')
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const updateUser = async (data) => {
    const res = await updateProfile(data)
    if (res.success && res.user) {
      setUser(res.user)
      localStorage.setItem('user', JSON.stringify(res.user))
      return res.user
    }
    throw new Error(res.message || 'Failed to update profile')
  }

  const refreshUser = async () => {
    try {
      const res = await getMe()
      if (res.success && res.user) {
        setUser(res.user)
        localStorage.setItem('user', JSON.stringify(res.user))
      }
    } catch (err) {
      console.warn('Failed to refresh user:', err.message)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
