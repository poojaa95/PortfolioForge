import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { changePassword, deleteAccount } from '../services/authService.js'
import { uploadImage } from '../services/uploadService.js'
import {
  Trash2,
  Upload,
  AlertTriangle,
  Save,
  KeyRound,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function Settings() {
  const { user, updateUser, logout } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('profile')
  const [name, setName] = useState(user?.name || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [profileImage, setProfileImage] = useState(user?.profileImage || '')
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setIsUpdatingProfile(true)
    try {
      await updateUser({ name, bio, profileImage })
      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingPhoto(true)
    try {
      const res = await uploadImage(file)
      if (res.success && res.url) {
        setProfileImage(res.url)
        await updateUser({ profileImage: res.url })
        toast.success('Avatar updated!')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Avatar upload failed')
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setIsChangingPassword(true)
    try {
      await changePassword({ currentPassword, newPassword })
      toast.success('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast.error('Please type DELETE to confirm')
      return
    }

    setIsDeletingAccount(true)
    try {
      await deleteAccount()
      logout()
      toast.success('Account and data deleted successfully')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account')
    } finally {
      setIsDeletingAccount(false)
      setShowDeleteModal(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Account Settings</h1>
          <p className="text-sm text-gray-500 font-light mt-0.5">
            Manage your personal profile, security credentials, and account details.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Password & Security
          </button>
          <button
            onClick={() => setActiveTab('danger')}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'danger'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Danger Zone
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xs space-y-6">
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Avatar Section */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Profile Avatar
                </label>
                <div className="flex items-center space-x-5">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt={name}
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-purple-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xl">
                      {name ? name.slice(0, 2).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div>
                    <label className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingPhoto ? 'Uploading...' : 'Change Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-gray-400 mt-1">Recommended: Square format up to 5MB</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500 cursor-not-allowed"
                />
                <p className="text-[11px] text-gray-400 mt-1">Account email address cannot be changed.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Bio
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  placeholder="Tell us a little bit about yourself..."
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="inline-flex items-center space-x-1.5 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-200 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xs space-y-6">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900">Change Account Password</h2>
              <p className="text-xs text-gray-500">Ensure your workspace is safeguarded with a strong password.</p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  placeholder="Min. 6 characters"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="inline-flex items-center space-x-1.5 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-200 transition-all cursor-pointer disabled:opacity-50"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{isChangingPassword ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Danger Zone Tab */}
        {activeTab === 'danger' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-red-200 shadow-xs space-y-6">
            <div className="flex items-center space-x-3 text-red-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <div>
                <h2 className="text-base font-bold text-gray-900">Danger Zone</h2>
                <p className="text-xs text-gray-500">Irreversible actions that affect your entire account.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-red-50/70 border border-red-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-gray-900">Permanently Delete Account</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Deleting your account will erase all created portfolios, published public URLs, analytics history, and version snapshots permanently.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-xs cursor-pointer shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirm Account Deletion</h3>
                <p className="text-xs text-gray-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              To verify deletion, please type <strong className="text-red-600 font-mono">DELETE</strong> in the input below:
            </p>

            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-mono text-sm uppercase focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              placeholder="DELETE"
            />

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmation('')
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== 'DELETE' || isDeletingAccount}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-200 disabled:opacity-50 cursor-pointer"
              >
                {isDeletingAccount ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
