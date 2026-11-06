import { Link } from 'react-router-dom'
import { Sparkles, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-gray-900">
                Portfolio<span className="text-purple-600">Forge</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">
              Create, edit, preview and publish a portfolio, then build a resume from the same saved details.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-2.5 text-sm text-gray-600">
              <li><Link to="/templates" className="hover:text-purple-600 transition-colors">Template Gallery</Link></li>
              <li><Link to="/wizard" className="hover:text-purple-600 transition-colors">Portfolio Wizard</Link></li>
              <li><Link to="/resume" className="hover:text-purple-600 transition-colors">Resume Generator</Link></li>
              <li><Link to="/analytics" className="hover:text-purple-600 transition-colors">Live Analytics</Link></li>
            </ul>
          </div>

          {/* Templates Links */}
          <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-4">Templates</h4>
            <ul className="space-y-2.5 text-sm text-gray-600">
              <li><Link to="/templates" className="hover:text-purple-600 transition-colors">Minimal Editorial</Link></li>
              <li><Link to="/templates" className="hover:text-purple-600 transition-colors">Modern Developer</Link></li>
              <li><Link to="/templates" className="hover:text-purple-600 transition-colors">Creative Designer</Link></li>
              <li><Link to="/templates" className="hover:text-purple-600 transition-colors">Student & Graduate</Link></li>
              <li><Link to="/templates" className="hover:text-purple-600 transition-colors">Corporate Professional</Link></li>
              <li><Link to="/templates" className="hover:text-purple-600 transition-colors">Dark Tech</Link></li>
            </ul>
          </div>

          {/* Resources & Support */}
          <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-4">Resources</h4>
            <ul className="space-y-2.5 text-sm text-gray-600">
              <li><a href="/#faq" className="hover:text-purple-600 transition-colors">Help & FAQ</a></li>
              <li><a href="/#features" className="hover:text-purple-600 transition-colors">Features Guide</a></li>
              <li><Link to="/register" className="hover:text-purple-600 transition-colors">Get Started Free</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500">
          <p>© {new Date().getFullYear()} PortfolioForge. All rights reserved.</p>
          <p className="flex items-center space-x-1 mt-3 sm:mt-0">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" />
            <span>for portfolio creators</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
