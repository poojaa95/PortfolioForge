import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getPortfolios } from '../services/portfolioService.js'
import { getPortfolioAnalytics } from '../services/analyticsService.js'
import { getDefaultPortfolio, getStoredPortfolioId, storePortfolioId } from '../utils/portfolioData.js'
import {
  BarChart3,
  Eye,
  MousePointerClick,
  Users,
  TrendingUp,
  ExternalLink,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts'
import Loader from '../components/common/Loader.jsx'
import toast from 'react-hot-toast'

export default function Analytics() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialPortfolioId = searchParams.get('id')

  const [portfolios, setPortfolios] = useState([])
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(initialPortfolioId || '')
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMetrics, setLoadingMetrics] = useState(false)
  const [selectionError, setSelectionError] = useState('')
  const analyticsRequestRef = useRef(0)

  // Load user portfolios
  useEffect(() => {
    const loadPortfolios = async () => {
      try {
        setLoading(true)
        const res = await getPortfolios()
        if (res.success && res.portfolios) {
          setPortfolios(res.portfolios)
          const requestedId = initialPortfolioId || getStoredPortfolioId()
          const requested = res.portfolios.find((portfolio) => portfolio._id === requestedId)
          const selected = requested || getDefaultPortfolio(res.portfolios)
          setSelectedPortfolioId(selected?._id || '')
          storePortfolioId(selected?._id)
          setSelectionError(initialPortfolioId && !requested ? 'That portfolio ID is unavailable. Choose another portfolio.' : '')
        }
      } catch {
        toast.error('Failed to load portfolios')
      } finally {
        setLoading(false)
      }
    }

    loadPortfolios()
  }, [])

  // Load analytics for selected portfolio
  const loadAnalytics = useCallback(async (portfolioId) => {
    const requestId = ++analyticsRequestRef.current
    setAnalyticsData(null)
    if (!portfolioId) {
      setLoadingMetrics(false)
      return
    }
    try {
      setLoadingMetrics(true)
      const res = await getPortfolioAnalytics(portfolioId)
      if (requestId === analyticsRequestRef.current && res.success) {
        setAnalyticsData(res)
      }
    } catch {
      if (requestId === analyticsRequestRef.current) toast.error('Failed to load portfolio analytics')
    } finally {
      if (requestId === analyticsRequestRef.current) setLoadingMetrics(false)
    }
  }, [])

  useEffect(() => {
    if (selectedPortfolioId) {
      loadAnalytics(selectedPortfolioId)
    }
  }, [selectedPortfolioId, loadAnalytics])

  const handleSelectPortfolio = (pId) => {
    setSelectedPortfolioId(pId)
    storePortfolioId(pId)
    setSelectionError('')
    setSearchParams({ id: pId })
  }

  const selectedPortfolio = portfolios.find((p) => p._id === selectedPortfolioId)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader size="lg" text="Loading analytics workspace..." />
      </div>
    )
  }

  if (portfolios.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50/50 py-16 px-4 text-center">
        <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
            <BarChart3 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">No Portfolios Found</h2>
          <p className="text-sm text-gray-500 font-light">
            Create and publish a portfolio to start collecting visitor telemetry and engagement insights.
          </p>
          <div className="pt-2">
            <Link
              to="/wizard"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-200"
            >
              <span>Create Portfolio</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { stats, chartData, monthlyData, deviceStats, projectClickStats, recentActivity } = analyticsData || {
    stats: { totalViews: 0, uniqueVisitors: 0, totalProjectClicks: 0, clickThroughRate: '0%' },
    chartData: [],
    monthlyData: [],
    deviceStats: [],
    projectClickStats: [],
    recentActivity: [],
  }

  const COLORS = ['#7c3aed', '#06b6d4', '#ec4899', '#f59e0b']

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header & Portfolio Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-purple-600 mb-1">
              <BarChart3 className="w-4 h-4" />
              <span>Real-Time Visitor Telemetry</span>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Performance & Traffic Analytics
            </h1>
            <p className="text-xs text-gray-500 font-light mt-0.5">
              Accurate, zero-cookie visitor tracking powered by backend event APIs.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <label className="text-xs font-bold text-gray-600 hidden sm:inline">Portfolio:</label>
            <select
              value={selectedPortfolioId}
              onChange={(e) => handleSelectPortfolio(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              {portfolios.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.title} ({p.published ? 'Live' : 'Draft'})
                </option>
              ))}
            </select>

            {selectedPortfolio && (
              <a
                href={`/u/${selectedPortfolio.slug}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors"
                title="View live portfolio"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
        {selectionError && <p role="alert" className="-mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{selectionError}</p>}
        {loadingMetrics && <p role="status" className="-mt-5 text-xs font-medium text-slate-500">Loading analytics for the selected portfolio…</p>}

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Page Views</span>
              <Eye className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-black text-gray-900">{stats.totalViews}</p>
            <p className="text-xs text-gray-400">Total portfolio impressions</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Unique Visitors</span>
              <Users className="w-5 h-5 text-cyan-600" />
            </div>
            <p className="text-3xl font-black text-gray-900">{stats.uniqueVisitors}</p>
            <p className="text-xs text-cyan-600 font-medium">Distinct audience reach</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Project Clicks</span>
              <MousePointerClick className="w-5 h-5 text-pink-600" />
            </div>
            <p className="text-3xl font-black text-gray-900">{stats.totalProjectClicks}</p>
            <p className="text-xs text-gray-400">GitHub & Live demo interactions</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Click-Through Rate</span>
              <TrendingUp className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-3xl font-black text-gray-900">{stats.clickThroughRate}</p>
            <p className="text-xs text-emerald-600 font-medium">Engagement conversion</p>
          </div>
        </div>

        {/* Charts Row: 14-Day Traffic Trend + Device Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Traffic Area Chart */}
          <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Traffic & Interaction Velocity</h3>
                <p className="text-xs text-gray-500">Past 14 days activity trend</p>
              </div>
              <div className="flex items-center space-x-3 text-xs font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                  Views
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                  Project Clicks
                </span>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="clicksGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      color: '#fff',
                      borderRadius: '12px',
                      border: 'none',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#7c3aed"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#viewsGrad)"
                    name="Page Views"
                  />
                  <Area
                    type="monotone"
                    dataKey="projectClicks"
                    stroke="#ec4899"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#clicksGrad)"
                    name="Project Clicks"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Device Breakdown Pie Chart */}
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">Device Breakdown</h3>
              <p className="text-xs text-gray-500">Visitor viewport categories</p>
            </div>

            <div className="h-52 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceStats}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {deviceStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      color: '#fff',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 text-center text-xs">
              {deviceStats.map((d, i) => (
                <div key={d.name} className="space-y-0.5">
                  <div className="flex items-center justify-center space-x-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-gray-500">{d.name}</span>
                  </div>
                  <p className="font-bold text-gray-900">{d.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Monthly Traffic</h3>
            <p className="text-xs text-gray-500">Portfolio views and project clicks over the past 12 months</p>
          </div>
          {monthlyData.every((month) => month.views === 0 && month.projectClicks === 0) ? (
            <p className="py-8 text-center text-sm text-gray-400">No analytics recorded yet. Views and project interactions will appear here.</p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="views" name="Views" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="projectClicks" name="Project clicks" fill="#ec4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Second Row: Top Performing Projects + Recent Visitor Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Top Clicked Projects Bar Chart */}
          <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Project Engagement</h3>
              <p className="text-xs text-gray-500">Most visited projects and repositories</p>
            </div>

            {projectClickStats.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                No project clicks recorded yet. Share your portfolio link to collect interactions!
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={projectClickStats}
                    layout="vertical"
                    margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={120} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        color: '#fff',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="clicks" fill="#7c3aed" radius={[0, 6, 6, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Recent Visitor Activity Log */}
          <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Recent Visitor Log</h3>
              <p className="text-xs text-gray-500">Live feed of visitor events</p>
            </div>

            {recentActivity.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                No activity logged yet. View your public link to trigger your first event!
              </div>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {recentActivity.map((act, i) => (
                  <div
                    key={act._id || i}
                    className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          act.event === 'project_click'
                            ? 'bg-pink-100 text-pink-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {act.event === 'project_click' ? 'Project Click' : 'Page View'}
                      </span>
                      <span className="text-gray-700 font-medium capitalize">
                        {act.metadata?.projectTitle || act.device || 'Direct Visitor'}
                      </span>
                    </div>

                    <div className="text-right text-gray-400 text-[11px]">
                      {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
