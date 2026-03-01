import { useQuery } from '@tanstack/react-query'
import { getBusinessHealth } from '../api/client'
import { Link } from 'react-router-dom'

function fmt(n) { return `₹${(Number(n) || 0).toLocaleString()}` }

function ScoreRing({ value, size = 120, label, color }) {
  const radius = (size - 12) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  const clr = color || (value >= 70 ? '#1B98A0' : value >= 40 ? '#d97706' : '#dc2626')

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E8DCC8" strokeWidth="8" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={clr} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-2xl font-bold text-navy-800">{value}</span>
        <span className="text-xs text-navy-400">/ 100</span>
      </div>
      {label && <span className="text-xs text-navy-500 font-medium">{label}</span>}
    </div>
  )
}

function MetricBar({ label, value, max = 100, inverted = false }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const displayVal = inverted ? max - value : value
  const color = inverted
    ? (value > 60 ? 'bg-red-500' : value > 30 ? 'bg-yellow-500' : 'bg-teal-500')
    : (value >= 70 ? 'bg-teal-500' : value >= 40 ? 'bg-yellow-500' : 'bg-red-500')

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm text-navy-600">{label}</span>
        <span className="text-sm font-semibold text-navy-800">{value}%</span>
      </div>
      <div className="h-2.5 bg-sand-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ease-out ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function AlertBadge({ type, message }) {
  const styles = {
    danger: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-cyan-50 border-cyan-200 text-cyan-700'
  }
  const icons = { danger: '🔴', warning: '🟡', info: '🔵' }

  return (
    <div className={`flex items-start gap-2.5 px-4 py-3 rounded-lg border ${styles[type]}`}>
      <span className="text-sm mt-0.5">{icons[type]}</span>
      <span className="text-sm">{message}</span>
    </div>
  )
}

export default function BusinessHealth() {
  const { data, isLoading } = useQuery({ queryKey: ['business-health'], queryFn: getBusinessHealth })

  if (isLoading) return (
    <div className="p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-sand-200 rounded w-48"></div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-sand-100 rounded-lg"></div>)}
        </div>
      </div>
    </div>
  )

  const d = data || {}
  const metrics = d.metrics || {}
  const cashFlow = d.cash_flow || {}
  const renewals = d.renewal_candidates || []
  const alerts = d.alerts || []
  const summary = d.summary || {}

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-navy-800">Business Health</h1>
        <p className="text-sm text-navy-400 mt-0.5">Your creator business risk assessment & insights</p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2 mb-6">
          {alerts.map((a, i) => <AlertBadge key={i} type={a.type} message={a.message} />)}
        </div>
      )}

      {/* Overall score + key metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        {/* Big score ring */}
        <div className="bg-white border border-sand-200 rounded-lg shadow-sm p-6 flex flex-col items-center justify-center relative">
          <p className="text-xs text-navy-400 mb-3 font-medium uppercase tracking-wide">Overall Health</p>
          <ScoreRing value={d.overall_score || 0} size={140} />
          <p className="text-xs text-navy-300 mt-3">
            {d.overall_score >= 70 ? 'Strong business fundamentals' :
             d.overall_score >= 40 ? 'Room for improvement' : 'Needs attention'}
          </p>
        </div>

        {/* Metrics breakdown */}
        <div className="lg:col-span-3 bg-white border border-sand-200 rounded-lg shadow-sm p-6">
          <h2 className="text-sm font-medium text-navy-800 mb-5">Health Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <MetricBar label="Revenue Diversification" value={100 - metrics.concentration_risk} />
            <MetricBar label="Brand Diversity" value={metrics.brand_diversity} />
            <MetricBar label="Income Stability" value={metrics.income_stability} />
            <MetricBar label="Pipeline Health" value={metrics.pipeline_health} />
            <MetricBar label="Payment Health" value={metrics.payment_health} />
            <MetricBar label="Delivery Rate" value={metrics.delivery_rate} />
          </div>
        </div>
      </div>

      {/* Cash flow overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-sand-200 rounded-lg shadow-sm p-6">
          <h2 className="text-sm font-medium text-navy-800 mb-4">Cash Flow Snapshot</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-sand-100">
              <div>
                <p className="text-sm text-navy-600">Pending Invoices</p>
                <p className="text-xs text-navy-300">Sent & awaiting payment</p>
              </div>
              <span className="text-lg font-semibold text-cyan-600">{fmt(cashFlow.pending_invoice_value)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-sand-100">
              <div>
                <p className="text-sm text-navy-600">Near Payment</p>
                <p className="text-xs text-navy-300">Deals in 'Invoice Sent' stage</p>
              </div>
              <span className="text-lg font-semibold text-teal-600">{fmt(cashFlow.near_payment)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-sand-100">
              <div>
                <p className="text-sm text-navy-600">Pipeline Expected</p>
                <p className="text-xs text-navy-300">Active deal total value</p>
              </div>
              <span className="text-lg font-semibold text-navy-600">{fmt(cashFlow.pipeline_expected)}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-navy-600">Avg Monthly Revenue</p>
                <p className="text-xs text-navy-300">Based on recorded entries</p>
              </div>
              <span className="text-lg font-semibold text-navy-800">{fmt(cashFlow.avg_monthly_revenue)}</span>
            </div>
          </div>
        </div>

        {/* Business summary */}
        <div className="bg-white border border-sand-200 rounded-lg shadow-sm p-6">
          <h2 className="text-sm font-medium text-navy-800 mb-4">Business Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-sand-50 rounded-lg p-3.5">
              <p className="text-xs text-navy-400">Total Revenue</p>
              <p className="text-lg font-bold text-navy-800 mt-1">{fmt(summary.total_revenue)}</p>
            </div>
            <div className="bg-sand-50 rounded-lg p-3.5">
              <p className="text-xs text-navy-400">Win Rate</p>
              <p className="text-lg font-bold text-navy-800 mt-1">{summary.win_rate || 0}%</p>
            </div>
            <div className="bg-sand-50 rounded-lg p-3.5">
              <p className="text-xs text-navy-400">Total Deals</p>
              <p className="text-lg font-bold text-navy-800 mt-1">{summary.total_deals || 0}</p>
              <p className="text-xs text-navy-300">{summary.active_deals || 0} active</p>
            </div>
            <div className="bg-sand-50 rounded-lg p-3.5">
              <p className="text-xs text-navy-400">Brand Partners</p>
              <p className="text-lg font-bold text-navy-800 mt-1">{summary.total_brands || 0}</p>
              <p className="text-xs text-navy-300">{summary.active_brands || 0} active</p>
            </div>
            <div className="bg-sand-50 rounded-lg p-3.5">
              <p className="text-xs text-navy-400">Total Invoiced</p>
              <p className="text-lg font-bold text-navy-800 mt-1">{fmt(summary.total_invoiced)}</p>
            </div>
            <div className="bg-sand-50 rounded-lg p-3.5">
              <p className="text-xs text-navy-400">Overdue Invoices</p>
              <p className={`text-lg font-bold mt-1 ${summary.overdue_count > 0 ? 'text-red-600' : 'text-navy-800'}`}>
                {summary.overdue_count || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Brand renewal tracker */}
      {renewals.length > 0 && (
        <div className="bg-white border border-sand-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-sand-200 bg-gradient-to-r from-teal-500/5 to-transparent">
            <h2 className="text-sm font-medium text-navy-800">🔄 Brand Renewal Opportunities</h2>
            <p className="text-xs text-navy-400 mt-0.5">Brands you've worked with that may be ready for a new collaboration</p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-navy-400 border-b border-sand-100 bg-sand-50">
                <th className="px-5 py-2.5 font-medium">Brand</th>
                <th className="px-4 py-2.5 font-medium">Last Collab</th>
                <th className="px-4 py-2.5 font-medium">Days Since</th>
                <th className="px-4 py-2.5 font-medium">Warmth</th>
                <th className="px-4 py-2.5 font-medium">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-50">
              {renewals.map(r => (
                <tr key={r.id} className="hover:bg-sand-50">
                  <td className="px-5 py-3">
                    <Link to="/brands" className="text-sm text-navy-800 hover:text-teal-600 font-medium">{r.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-navy-500">
                    {new Date(r.last_collab).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${r.days_since > 120 ? 'text-red-600' : 'text-yellow-600'}`}>
                      {r.days_since}d ago
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-sand-200 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full" style={{ width: `${r.warmth}%` }} />
                      </div>
                      <span className="text-xs text-navy-400">{r.warmth}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-navy-700">{fmt(r.total_revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
