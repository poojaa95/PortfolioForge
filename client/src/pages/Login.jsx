import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../context/AuthContext.jsx'
import { Sparkles, Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const requestedDestination = location.state?.from
  const statePath = requestedDestination?.pathname?.startsWith('/') && !requestedDestination.pathname.startsWith('//')
    ? `${requestedDestination.pathname}${requestedDestination.search || ''}${requestedDestination.hash || ''}`
    : ''
  const queryPath = new URLSearchParams(location.search).get('redirect') || ''
  const from = statePath || (queryPath.startsWith('/') && !queryPath.startsWith('//') ? queryPath : '/dashboard')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      await login(data)
      toast.success('Welcome back to PortfolioForge!')
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Login failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Demo user quick login helper
  const handleQuickDemo = () => {
    setValue('email', 'alex.demo@portfolioforge.dev')
    setValue('password', 'Password123!')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-200">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-gray-900">
            Portfolio<span className="text-purple-600">Forge</span>
          </span>
        </Link>
        <h2 className="mt-4 text-2xl font-extrabold text-gray-900">Sign in to your workspace</h2>
        <p className="mt-1.5 text-sm text-gray-500">
          Or{' '}
          <Link to={`/register?redirect=${encodeURIComponent(from)}`} state={{ from: location.state?.from }} className="font-semibold text-purple-600 hover:text-purple-700">
            create a free account in seconds
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl shadow-gray-200/50 rounded-2xl border border-gray-100 sm:px-10 space-y-6">
          {/* Quick Demo Fill Pill */}
          <div className="p-3 bg-purple-50/70 border border-purple-200/60 rounded-xl flex items-center justify-between">
            <div className="text-xs text-purple-800">
              <span className="font-bold">Evaluating?</span> Use sample credentials:
            </div>
            <button
              type="button"
              onClick={handleQuickDemo}
              className="text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              Fill Demo
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+\.\S+$/,
                      message: 'Please enter a valid email address',
                    },
                  })}
                  className="block w-full pl-10 pr-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="name@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-purple-600 hover:text-purple-700"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                  className="block w-full pl-10 pr-10 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.password.message}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-200 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                <span>{isSubmitting ? 'Signing in...' : 'Sign in to Account'}</span>
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>

          <div className="text-center pt-2">
            <p className="text-xs text-gray-500">
              By signing in, you agree to PortfolioForge's Terms and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
