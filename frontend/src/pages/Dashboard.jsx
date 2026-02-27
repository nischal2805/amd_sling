import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

function formatMoney(n) {
  if (n == null) return '—';
  return '$' + Number(n).toLocaleString('en-US');
}

function StatCard({ label, value, color = 'text-gray-900' }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-semibold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

const STAGE_COLORS = {
  inbound: 'bg-gray-100 text-gray-700',
  negotiation: 'bg-blue-50 text-blue-700',
  contract_sent: 'bg-amber-50 text-amber-700',
  in_production: 'bg-green-50 text-green-700',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-50 text-red-600',
};

function stageLabel(stage) {
  return (stage || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Dashboard() {
  const { data: dashboard, isLoading: dashLoading, error: dashError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/api/analytics/dashboard').then((r) => r.data),
  });

  const { data: revenueData, isLoading: revLoading } = useQuery({
    queryKey: ['revenue-analytics'],
    queryFn: () => api.get('/api/analytics/revenue').then((r) => r.data),
  });

  const { data: dealsData, isLoading: dealsLoading } = useQuery({
    queryKey: ['deals-recent'],
    queryFn: () => api.get('/api/deals?limit=5').then((r) => r.data),
  });

  if (dashLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (dashError) {
    return (
      <div className="text-red-500 text-sm">Failed to load dashboard data.</div>
    );
  }

  const deals = Array.isArray(dealsData) ? dealsData : [];
  const recentDeals = deals.slice(0, 5);

  const chartData = Array.isArray(revenueData) ? revenueData : [];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Revenue This Month"
          value={formatMoney(dashboard?.revenue_this_month)}
          color="text-green-600"
        />
        <StatCard
          label="Pipeline Value"
          value={formatMoney(dashboard?.pipeline_value)}
          color="text-blue-600"
        />
        <StatCard
          label="Outstanding Invoices"
          value={formatMoney(dashboard?.outstanding_invoices)}
          color={dashboard?.overdue_count > 0 ? 'text-red-500' : 'text-amber-500'}
        />
      </div>

      {/* Revenue chart */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Monthly Revenue</h2>
        {revLoading ? (
          <div className="flex items-center justify-center h-48">
            <LoadingSpinner />
          </div>
        ) : chartData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">No revenue data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value) => [formatMoney(value), 'Revenue']}
                contentStyle={{ fontSize: 12, borderColor: '#e5e7eb' }}
              />
              <Bar dataKey="total" fill="#2563eb" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent deals table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-700">Recent Deals</h2>
          <Link to="/pipeline" className="text-xs text-blue-600 hover:underline">
            View all →
          </Link>
        </div>
        {dealsLoading ? (
          <div className="flex items-center justify-center h-24">
            <LoadingSpinner />
          </div>
        ) : recentDeals.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No deals yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="px-5 py-3 font-medium">Brand</th>
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Stage</th>
                <th className="px-5 py-3 font-medium text-right">Value</th>
                <th className="px-5 py-3 font-medium">Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentDeals.map((deal) => (
                <tr key={deal.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">
                    {deal.brand?.name ?? deal.brand_name ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-700">
                    <Link to={`/deals/${deal.id}`} className="hover:text-blue-600 hover:underline">
                      {deal.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        STAGE_COLORS[deal.stage] ?? 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {stageLabel(deal.stage)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-green-600 font-medium">
                    {formatMoney(deal.value)}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {deal.posting_deadline
                      ? format(new Date(deal.posting_deadline), 'MMM d, yyyy')
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
