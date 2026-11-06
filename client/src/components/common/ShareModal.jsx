import { useState } from 'react'
import { X, Copy, Check, ExternalLink, Share2, Linkedin, Twitter, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ShareModal({ isOpen, onClose, portfolioTitle, slug }) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const fullUrl = `${window.location.origin}/u/${slug}`

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    toast.success('Public URL copied to clipboard!')
    setTimeout(() => setCopied(false), 2500)
  }

  const shareText = encodeURIComponent(`Check out my professional portfolio on PortfolioForge! ${portfolioTitle || ''}`)
  const shareUrl = encodeURIComponent(fullUrl)

  const shareLinks = [
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
      color: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    {
      name: 'Twitter / X',
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`,
      color: 'bg-black hover:bg-gray-800 text-white',
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      url: `https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`,
      color: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Share Your Portfolio</h3>
            <p className="text-xs text-gray-500">Your portfolio is ready for the world to see</p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
            Public Web Link
          </label>
          <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-xl p-2 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent">
            <input
              type="text"
              readOnly
              value={fullUrl}
              className="bg-transparent text-sm text-gray-800 flex-1 px-2 focus:outline-hidden select-all"
            />
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
            Share Directly
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {shareLinks.map((item) => {
              const Icon = item.icon
              return (
                <a
                  key={item.name}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-medium transition-transform active:scale-95 ${item.color}`}
                >
                  <Icon className="w-4 h-4 mb-1" />
                  <span>{item.name}</span>
                </a>
              )
            })}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-gray-100">
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 text-xs font-medium text-purple-600 hover:text-purple-700"
          >
            <span>Open in new tab</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  )
}
