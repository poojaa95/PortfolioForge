import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Eye,
  Sliders,
  BarChart3,
  FileText,
  Bot,
  ChevronDown,
  Layout,
} from 'lucide-react'
import Footer from '../components/common/Footer.jsx'

export default function Home() {
  const [activeFaq, setActiveFaq] = useState(null)

  const toggleFaq = (idx) => {
    setActiveFaq(activeFaq === idx ? null : idx)
  }

  const templatesData = [
    {
      id: 'minimal',
      name: 'Minimal Editorial',
      desc: 'Clean whitespace, elegant typography, and executive clarity. Designed for corporate leaders and consultants.',
      badge: 'Popular',
      color: 'bg-purple-600',
    },
    {
      id: 'developer',
      name: 'Modern Developer',
      desc: 'Monospace code vibes, terminal cards, repo links, and tech stack tags crafted specifically for engineers.',
      badge: 'Engineering',
      color: 'bg-emerald-600',
    },
    {
      id: 'creative',
      name: 'Creative Designer',
      desc: 'Bold gradients, dynamic spotlight cards, and visual masonry grids for UI/UX and product designers.',
      badge: 'Vibrant',
      color: 'bg-pink-600',
    },
    {
      id: 'student',
      name: 'Student & Graduate',
      desc: 'Education-forward layout highlighting degrees, coursework, internships, and skill growth.',
      badge: 'Starter',
      color: 'bg-blue-600',
    },
    {
      id: 'corporate',
      name: 'Corporate Professional',
      desc: 'Formal structure, restrained color, and an elegant profile for business and leadership roles.',
      badge: 'Leadership',
      color: 'bg-slate-600',
    },
    {
      id: 'dark',
      name: 'Dark Tech',
      desc: 'A premium dark canvas with focused blue and violet accents for technology portfolios.',
      badge: 'Dark Mode',
      color: 'bg-indigo-600',
    },
  ]

  const features = [
    {
      icon: Eye,
      title: 'Real-Time Live Preview',
      desc: 'Watch your portfolio update instantly as you type. Toggle between desktop, tablet, and mobile viewport frames.',
    },
    {
      icon: Layout,
      title: '6 Distinct Templates',
      desc: 'Choose from six unique visual identities tailored for engineers, designers, students, and business leaders.',
    },
    {
      icon: Sliders,
      title: 'Drag-and-Drop Reordering',
      desc: 'Customize your layout effortlessly. Reorder sections and toggle visibility with a single click.',
    },
    {
      icon: Bot,
      title: 'AI Content Assistant',
      desc: 'Supercharge your copy. Generate high-impact project descriptions and summaries powered by Google Gemini.',
    },
    {
      icon: BarChart3,
      title: 'Built-In Live Analytics',
      desc: 'Track real visitor traffic, device breakdowns, and project clicks with zero third-party cookie trackers.',
    },
    {
      icon: FileText,
      title: 'One-Click Resume Generator',
      desc: 'Instantly convert your saved portfolio data into a polished, recruiter-ready printable PDF resume.',
    },
  ]

  const faqs = [
    {
      q: 'Do I need any coding knowledge to use PortfolioForge?',
      a: 'None at all! PortfolioForge is 100% no-code. You simply fill in your information or let our AI assistant draft it, pick a template, and publish with a single click.',
    },
    {
      q: 'Can I use a custom public URL for my portfolio?',
      a: 'Published portfolios use a unique link on the configured PortfolioForge site. You can choose a slug and check whether it is available before saving.',
    },
    {
      q: 'Can I create multiple portfolios with different templates?',
      a: 'Absolutely. You can maintain multiple portfolios for different career facets—such as a developer portfolio, a freelance consulting portfolio, or a design showcase.',
    },
    {
      q: 'How does visitor analytics tracking work?',
      a: 'Whenever someone views your public portfolio or clicks on your GitHub or demo links, our lightweight backend API logs real visitor counts, device types, and project clicks securely without invading user privacy.',
    },
    {
      q: 'Can I export my portfolio information into a resume?',
      a: 'Yes! Our integrated Resume Builder automatically formats your education, experience, skills, and projects into a print-ready PDF resume.',
    },
  ]

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-blue-100/50 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Next-Generation No-Code Portfolio Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 max-w-4xl mx-auto leading-tight">
            Build Your Professional Portfolio{' '}
            <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 bg-clip-text text-transparent">
              Without Coding
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-light">
            "Your Career. Your Portfolio. Your Identity." Create, customize, and publish a stunning portfolio in minutes with real-time live preview, AI writing assistance, and built-in analytics.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all active:scale-95 text-base"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/templates"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all text-base"
            >
              <span>Explore Templates</span>
            </Link>
          </div>

          {/* Social Proof Line */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Start creating a portfolio
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Unique Public URL
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Real-Time Preview
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Printable PDF Resume
            </span>
          </div>

          {/* Portfolio Editor Preview Illustration / Mockup */}
          <div className="pt-10 max-w-5xl mx-auto relative">
            <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl shadow-purple-500/10">
              {/* Browser mockup header */}
              <div className="flex items-center justify-between pb-3 px-3 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="px-6 py-1 rounded-md bg-gray-50 border border-gray-200 text-xs font-mono text-gray-500">
                  Demo portfolio · sample content
                </div>
                <div className="w-16" />
              </div>

              {/* Editor Workspace Split Mockup */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-gray-50/50 rounded-xl">
                {/* Left controls column */}
                <div className="md:col-span-4 bg-white p-4 rounded-xl border border-gray-200 space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Editor Controls</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Auto-saved
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-between text-xs font-semibold text-purple-700">
                      <span>Personal Information</span>
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-xs text-gray-600">
                      Experience & Internships (2)
                    </div>
                    <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-xs text-gray-600">
                      Projects & Repositories (4)
                    </div>
                    <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-xs text-gray-600">
                      Skills & Proficiencies (8)
                    </div>
                  </div>
                  <div className="pt-2">
                    <div className="p-2.5 rounded-lg bg-gray-900 text-white text-xs flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Bot className="w-3.5 h-3.5 text-purple-400" />
                        AI Copy Enhancer
                      </span>
                      <span className="text-[10px] text-purple-300">Ready</span>
                    </div>
                  </div>
                </div>

                {/* Right live preview mockup */}
                <div className="md:col-span-8 bg-white p-6 rounded-xl border border-gray-200 text-left shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm">
                        AM
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-gray-900">Alex Morgan <span className="ml-1 rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-800">Sample</span></h4>
                        <p className="text-xs text-purple-600 font-medium">Senior Full-Stack Engineer</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Live Preview
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed font-light">
                    "Architecting high-scale distributed systems and user-centric web applications with React, Node.js, and modern cloud infrastructure."
                  </p>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-lg border border-gray-100 bg-gray-50 space-y-1">
                      <span className="text-xs font-bold text-gray-800">PortfolioForge SaaS</span>
                      <p className="text-[11px] text-gray-500">MERN stack no-code portfolio builder</p>
                    </div>
                    <div className="p-3 rounded-lg border border-gray-100 bg-gray-50 space-y-1">
                      <span className="text-xs font-bold text-gray-800">Telemetry Dashboard</span>
                      <p className="text-[11px] text-gray-500">Real-time metrics with Recharts</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-gray-50/60 border-t border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-purple-600">Enterprise Capabilities</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Everything You Need To Build A Standout Portfolio
            </p>
            <p className="text-base text-gray-500 font-light">
              Built from the ground up for modern developers, designers, and job seekers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, idx) => {
              const Icon = feat.icon
              return (
                <div
                  key={idx}
                  className="p-8 rounded-2xl bg-white border border-gray-200/80 shadow-xs hover:border-purple-300 hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feat.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed font-light">{feat.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-purple-600">Simple 3-Step Flow</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              From Blank Slate to Published in Minutes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 space-y-4">
              <div className="w-12 h-12 rounded-full bg-purple-600 text-white font-extrabold flex items-center justify-center mx-auto text-lg shadow-md shadow-purple-200">
                1
              </div>
              <h3 className="text-lg font-bold text-gray-900">Choose a Template</h3>
              <p className="text-sm text-gray-500 font-light leading-relaxed">
                Select from Minimal, Developer, Creative, Student, or Dark theme layouts tailored for your domain.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 space-y-4">
              <div className="w-12 h-12 rounded-full bg-purple-600 text-white font-extrabold flex items-center justify-center mx-auto text-lg shadow-md shadow-purple-200">
                2
              </div>
              <h3 className="text-lg font-bold text-gray-900">Customize & AI Polish</h3>
              <p className="text-sm text-gray-500 font-light leading-relaxed">
                Add projects, skills, and work history. Use our AI assistant to write punchy descriptions with real-time preview.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 space-y-4">
              <div className="w-12 h-12 rounded-full bg-purple-600 text-white font-extrabold flex items-center justify-center mx-auto text-lg shadow-md shadow-purple-200">
                3
              </div>
              <h3 className="text-lg font-bold text-gray-900">Publish & Share</h3>
              <p className="text-sm text-gray-500 font-light leading-relaxed">
                Claim your custom public URL, share with recruiters, track clicks in analytics, and export a matching PDF resume.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Template Showcase Section */}
      <section className="py-20 bg-gray-50/70 border-t border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
            <div className="space-y-2 text-center md:text-left">
              <h2 className="text-xs font-bold uppercase tracking-widest text-purple-600">Template Gallery</h2>
              <p className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                5 Thoughtfully Designed Visual Identities
              </p>
              <p className="text-sm text-gray-500 font-light">Each template has its own unique typography, cards, and structure.</p>
            </div>
            <Link
              to="/templates"
              className="inline-flex items-center space-x-1.5 text-sm font-semibold text-purple-600 hover:text-purple-700"
            >
              <span>View all template specs</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {templatesData.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:border-purple-400 hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                      {tpl.badge}
                    </span>
                    <div className={`w-3 h-3 rounded-full ${tpl.color}`} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">{tpl.name}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-light">{tpl.desc}</p>
                </div>
                <div className="p-4 pt-0">
                  <Link
                    to={`/wizard?template=${tpl.id}`}
                    className="block w-full py-2 rounded-xl text-center text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-600 hover:text-white transition-colors"
                  >
                    Use This Template
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-purple-600">Frequently Asked Questions</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Got Questions? We Have Answers.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-5 text-left text-base font-semibold text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${activeFaq === idx ? 'rotate-180 text-purple-600' : ''}`}
                  />
                </button>
                {activeFaq === idx && (
                  <div className="px-5 pb-5 text-sm text-gray-600 font-light leading-relaxed border-t border-gray-100 pt-3 bg-gray-50/40">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pre-Footer CTA */}
      <section className="py-20 bg-purple-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Ready to Launch Your Professional Identity?
          </h2>
          <p className="text-purple-100 text-base sm:text-lg max-w-xl mx-auto font-light">
            Join thousands of professionals showcasing their skills, projects, and career story on PortfolioForge.
          </p>
          <div className="pt-2">
            <Link
              to="/register"
              className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-xl font-bold text-purple-700 bg-white hover:bg-gray-50 shadow-xl transition-transform active:scale-95"
            >
              <span>Build Your Portfolio Now — Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
