import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { resetPassword } from '../services/authService.js'
import { Sparkles, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const tokenParam = searchParams.get('token') || ''

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      token: tokenParam,
      newPassword: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    if (tokenParam) {
      setValue('token', tokenParam)
    }
  }, [tokenParam, setValue])

  const newPasswordValue = watch('newPassword')

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      const res = await resetPassword({
        token: data.token,
        newPassword: data.newPassword,
      })
      toast.success(res.message || 'Password reset successfully!')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to reset password')
    } finally {
      setIsSubmitting(false)
    }
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
        <h2 className="mt-4 text-2xl font-extrabold text-gray-900">Set new password</h2>
        <p className="mt-1.5 text-sm text-gray-500">
          Enter your verification token and your new password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl shadow-gray-200/50 rounded-2xl border border-gray-100 sm:px-10 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Reset Token
              </label>
              <input
                type="text"
                {...register('token', { required: 'Reset token is required' })}
                className="block w-full px-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-mono text-gray-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Token from your password reset email"
              />
              {errors.token && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.token.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('newPassword', {
                    required: 'New password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' },
                  })}
                  className="block w-full pl-10 pr-10 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Min. 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  {...register('confirmPassword', {
                    required: 'Please confirm new password',
                    validate: (value) =>
                      value === newPasswordValue || 'Passwords do not match',
                  })}
                  className="block w-full pl-10 pr-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Re-enter new password"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500 font-medium">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-200 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                <span>{isSubmitting ? 'Updating Password...' : 'Save New Password'}</span>
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>

          <div className="text-center pt-2">
            <Link to="/login" className="text-xs font-semibold text-purple-600 hover:text-purple-700">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
