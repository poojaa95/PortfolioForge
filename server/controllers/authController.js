import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Portfolio from '../models/Portfolio.js'
import Analytics from '../models/Analytics.js'
import PortfolioVersion from '../models/PortfolioVersion.js'

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' })
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' })
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' })
    }

    const userExists = await User.findOne({ email: email.toLowerCase() })
    if (userExists) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' })
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
    })

    const token = generateToken(user._id)

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        bio: user.bio,
      },
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' })
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }

    const isMatch = await user.matchPassword(password)
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }

    const token = generateToken(user._id)

    res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        bio: user.bio,
      },
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password')
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const totalPortfolios = await Portfolio.countDocuments({ userId: user._id })
    const publishedPortfolios = await Portfolio.countDocuments({ userId: user._id, published: true })

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        bio: user.bio,
        createdAt: user.createdAt,
      },
      stats: {
        totalPortfolios,
        publishedPortfolios,
      },
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, profileImage } = req.body
    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    if (name) user.name = name.trim()
    if (typeof bio === 'string') user.bio = bio.trim()
    if (profileImage !== undefined) user.profileImage = profileImage

    await user.save()

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        bio: user.bio,
      },
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' })
    }

    const user = await User.findById(req.user._id)
    const isMatch = await user.matchPassword(currentPassword)
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' })
    }

    user.password = newPassword
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined
    await user.save()

    res.json({
      success: true,
      message: 'Password changed successfully',
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your email address' })
    }

    const message = 'If an account exists with this email, reset instructions will be sent when email delivery is configured.'

    // Email delivery is not configured in this deployment. Do not create a
    // reset token that cannot be delivered, and never expose one in the API.
    // No account lookup keeps response behavior identical for all addresses.
    res.json({
      success: true,
      message,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide token and new password' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' })
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token' })
    }

    user.password = newPassword
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined
    await user.save()

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Delete user account and all portfolios
// @route   DELETE /api/auth/account
// @access  Private
export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id

    // Find all portfolios by user to delete versions and analytics
    const portfolios = await Portfolio.find({ userId })
    const portfolioIds = portfolios.map((p) => p._id)

    await Analytics.deleteMany({ portfolioId: { $in: portfolioIds } })
    await PortfolioVersion.deleteMany({ portfolioId: { $in: portfolioIds } })
    await Portfolio.deleteMany({ userId })
    await User.findByIdAndDelete(userId)

    res.json({
      success: true,
      message: 'Account and all associated portfolios have been deleted permanently',
    })
  } catch (error) {
    next(error)
  }
}
