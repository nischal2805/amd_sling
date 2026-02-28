import { useQuery } from '@tanstack/react-query'
import { getDashboard, getRevenueAnalytics } from '../api/client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Link } from 'react-router-dom'

const STAGE_LABELS = {
  inbound: 'Inbound', qualified: 'Qualified', negotiation: 'Negotiation',
  contract_sent: 'Contract Sent', in_production: 'In Production',
  client_review: 'Review', posted: 'Posted', invoice_sent: 'Invoice Sent',
  paid: 'Paid', declined: 'Declined'
}

const STAGE_COLORS = {
  inbound: 'bg-sand-200 text-navy-700',
  qualified: 'bg-cyan-100 text-cyan-800',
  negotiation: 'bg-yellow-100 text-yellow-700',
  contract_sent: 'bg-teal-100 text-teal-700',
  in_production: 'bg-orange-100 text-orange-700',
  client_review: 'bg-cyan-50 text-teal-700',
  posted: 'bg-teal-50 text-teal-700',
  invoice_sent: 'bg-navy-100 text-navy-700',
  paid: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700'
}

function fmt(n) {
  return `₹${(Number(n) || 0).toLocaleString()}`
}

function StatCard({ label, value, sub, highlight }) {
  return (
    <div className="bg-white border border-sand-200 rounded-lg p-5 shadow-sm">
      <p className="text-sm text-navy-400">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${highlight || 'text-navy-800'}`}>{value}</p>
      {sub && <p className="text-xs text-navy-300 mt-1">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard })
  const { data: revenueData } = useQuery({ queryKey: ['revenue-analytics'], queryFn: getRevenueAnalytics })

  if (isLoading) return (
    <div className="p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-sand-200 rounded w-32"></div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-sand-100 rounded-lg"></div>)}
        </div>
      </div>
    </div>
  )

  const d = data || {}
  const revenue = d.revenue || {}
  const pipeline = d.pipeline || {}
  const invoices = d.invoices || {}
  const recentDeals = d.recent_deals || []
  const topBrands = d.top_brands || []

  const momText = revenue.mom_growth_percent > 0
    ? `+${revenue.mom_growth_percent}% vs last month`
    : revenue.mom_growth_percent < 0
      ? `${revenue.mom_growth_percent}% vs last month`
      : 'vs last month'

  const chartData = (revenueData?.monthly || []).slice(-6).map(m => ({
    month: m.month.slice(5),
    amount: Number(m.amount)
  }))

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-navy-800">Dashboard</h1>
        <p className="text-sm text-navy-400 mt-0.5">Your creator business at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Revenue this month"
          value={fmt(revenue.this_month)}
          sub={momText}
        />
        <StatCard
          label="Active pipeline"
          value={fmt(pipeline.total_active_value)}
          sub={`${pipeline.deals_count || 0} active deals`}
        />
        <StatCard
          label="Outstanding invoices"
          value={fmt(invoices.outstanding_value)}
          sub={invoices.overdue_count > 0 ? `${invoices.overdue_count} overdue` : `${invoices.outstanding_count || 0} outstanding`}
          highlight={invoices.overdue_count > 0 ? 'text-red-600' : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Revenue chart */}
        <div className="bg-white border border-sand-200 rounded-lg shadow-sm p-5">
          <h2 className="text-sm font-medium text-navy-800 mb-4">Revenue by month</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8DCC8" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#5a759d' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#5a759d' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? `${v / 1000}k` : v}`} />
                <Tooltip formatter={v => [`₹${v.toLocaleString()}`, 'Revenue']} contentStyle={{ borderColor: '#E8DCC8', borderRadius: 8 }} />
                <Bar dataKey="amount" fill="#1B98A0" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-navy-300 text-sm">No revenue data yet</div>
          )}
        </div>

        {/* Top brands */}
        <div className="bg-white border border-sand-200 rounded-lg shadow-sm p-5">
          <h2 className="text-sm font-medium text-navy-800 mb-4">Top brands by revenue</h2>
          {topBrands.length > 0 ? (
            <div className="space-y-2.5">
              {topBrands.map(b => (
                <div key={b.name} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-navy-800">{b.name}</p>
                    <p className="text-xs text-navy-300">{b.deal_count} deal{b.deal_count !== 1 ? 's' : ''}</p>
                  </div>
                  <span className="text-sm font-medium text-teal-600">{fmt(b.total_revenue)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-navy-300">No brand revenue recorded yet</p>
          )}
        </div>
      </div>

      {/* Recent deals */}
      <div className="bg-white border border-sand-200 rounded-lg shadow-sm">
        <div className="px-5 py-4 border-b border-sand-200 flex items-center justify-between">
          <h2 className="text-sm font-medium text-navy-800">Recent deals</h2>
          <Link to="/pipeline" className="text-xs text-teal-600 hover:underline">View all →</Link>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-navy-400 border-b border-sand-100">
              <th className="px-5 py-2.5 font-medium">Deal</th>
              <th className="px-4 py-2.5 font-medium">Brand</th>
              <th className="px-4 py-2.5 font-medium">Value</th>
              <th className="px-4 py-2.5 font-medium">Stage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-50">
            {recentDeals.map(deal => (
              <tr key={deal.id} className="hover:bg-sand-50 transition-colors">
                <td className="px-5 py-3">
                  <Link to={`/deals/${deal.id}`} className="text-sm text-navy-800 hover:text-teal-600">{deal.title}</Link>
                </td>
                <td className="px-4 py-3 text-sm text-navy-500">{deal.brand?.name || '—'}</td>
                <td className="px-4 py-3 text-sm text-navy-800">{deal.total_value ? fmt(deal.total_value) : '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_COLORS[deal.stage] || 'bg-sand-100 text-navy-600'}`}>
                    {STAGE_LABELS[deal.stage] || deal.stage}
                  </span>
                </td>
              </tr>
            ))}
            {recentDeals.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-navy-300">No deals yet — <Link to="/pipeline" className="text-teal-600 hover:underline">create one</Link></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
