import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { forgotPassword } from '../services/authService.js'
import { Sparkles, Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ForgotPassword() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resetInfo, setResetInfo] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { email: '' } })

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      const res = await forgotPassword(data)
      setResetInfo(res)
      toast.success(res.message || 'Password reset link prepared')
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to request reset')
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
        <h2 className="mt-4 text-2xl font-extrabold text-gray-900">Reset your password</h2>
        <p className="mt-1.5 text-sm text-gray-500">
          Enter your registered email and we'll help you regain access.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl shadow-gray-200/50 rounded-2xl border border-gray-100 sm:px-10 space-y-6">
          {resetInfo ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm space-y-2">
                <div className="flex items-center space-x-2 font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Request received</span>
                </div>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  {resetInfo.message || 'If an account exists with this email, reset instructions will be sent when email delivery is configured.'}
                </p>
              </div>

              <Link
                to="/login"
                className="flex items-center justify-center space-x-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 pt-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to sign in</span>
              </Link>
            </div>
          ) : (
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-200 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                <span>{isSubmitting ? 'Requesting...' : 'Send Reset Instructions'}</span>
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-gray-600 hover:text-purple-600"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to login</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
