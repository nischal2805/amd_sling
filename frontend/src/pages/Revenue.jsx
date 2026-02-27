import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

function formatSourceType(s) {
  return (s ?? '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const SOURCE_TYPES = ['sponsorship', 'affiliate', 'ad_revenue', 'licensing', 'other'];

const SOURCE_BADGE_COLORS = {
  sponsorship: 'bg-blue-50 text-blue-700',
  affiliate: 'bg-green-50 text-green-700',
  ad_revenue: 'bg-amber-50 text-amber-700',
  licensing: 'bg-gray-100 text-gray-700',
  other: 'bg-gray-100 text-gray-600',
};

const EMPTY_FORM = {
  amount: '',
  source_type: 'sponsorship',
  platform: '',
  received_at: '',
  brand_id: '',
  deal_id: '',
};

function AddRevenueForm({ brands, deals, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);
    try {
      await onSave({
        ...form,
        amount: Number(form.amount),
        brand_id: form.brand_id || undefined,
        deal_id: form.deal_id || undefined,
        received_at: form.received_at || undefined,
        platform: form.platform || undefined,
      });
      setForm(EMPTY_FORM);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save entry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Add Revenue Entry</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Amount ($) *</label>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            placeholder="1000"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Source Type *</label>
          <select
            value={form.source_type}
            onChange={(e) => set('source_type', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
          >
            {SOURCE_TYPES.map((s) => (
              <option key={s} value={s}>{formatSourceType(s)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Platform</label>
          <input
            value={form.platform}
            onChange={(e) => set('platform', e.target.value)}
            placeholder="YouTube, Instagram…"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Received At</label>
          <input
            type="date"
            value={form.received_at}
            onChange={(e) => set('received_at', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Brand</label>
          <select
            value={form.brand_id}
            onChange={(e) => set('brand_id', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
          >
            <option value="">— None —</option>
            {(brands ?? []).map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Deal</label>
          <select
            value={form.deal_id}
            onChange={(e) => set('deal_id', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
          >
            <option value="">— None —</option>
            {(deals ?? []).map((d) => (
              <option key={d.id} value={d.id}>{d.title}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Add Entry'}
          </button>
          {success && <span className="text-sm text-green-600">Entry added!</span>}
          {error && <span className="text-sm text-red-500">{error}</span>}
        </div>
      </form>
    </div>
  );
}

export default function Revenue() {
  const queryClient = useQueryClient();

  const { data: revenueEntries, isLoading: revLoading } = useQuery({
    queryKey: ['revenue'],
    queryFn: () => api.get('/api/revenue').then((r) => r.data),
  });

  const { data: revenueAnalytics } = useQuery({
    queryKey: ['revenue-analytics'],
    queryFn: () => api.get('/api/analytics/revenue').then((r) => r.data),
  });

  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: () => api.get('/api/brands').then((r) => r.data),
  });

  const { data: dealsData } = useQuery({
    queryKey: ['deals'],
    queryFn: () => api.get('/api/deals').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/api/revenue', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue'] });
      queryClient.invalidateQueries({ queryKey: ['revenue-analytics'] });
    },
  });

  const entries = Array.isArray(revenueEntries) ? revenueEntries : [];
  const brands = Array.isArray(brandsData) ? brandsData : [];
  const deals = Array.isArray(dealsData) ? dealsData : [];
  const chartData = Array.isArray(revenueAnalytics) ? revenueAnalytics : [];

  const totalRevenue = entries.reduce((s, e) => s + Number(e.amount || 0), 0);

  const bySourceType = entries.reduce((acc, e) => {
    acc[e.source_type] = (acc[e.source_type] || 0) + Number(e.amount || 0);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Revenue</h1>

      {/* Summary */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-xs text-gray-500">Total Revenue</p>
            <p className="text-3xl font-semibold text-green-600">{formatMoney(totalRevenue)}</p>
          </div>
          <div className="flex flex-wrap gap-2 ml-4">
            {Object.entries(bySourceType).map(([type, amount]) => (
              <span
                key={type}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  SOURCE_BADGE_COLORS[type] ?? 'bg-gray-100 text-gray-600'
                }`}
              >
                {formatSourceType(type)}
                <span className="font-semibold">{formatMoney(amount)}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Monthly Revenue</h2>
        {chartData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">No monthly data available.</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
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

      {/* Add form */}
      <AddRevenueForm
        brands={brands}
        deals={deals}
        onSave={(data) => createMutation.mutateAsync(data)}
      />

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-medium text-gray-700">All Entries</h2>
        </div>
        {revLoading ? (
          <div className="flex items-center justify-center h-24">
            <LoadingSpinner />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No revenue entries yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Brand</th>
                <th className="px-5 py-3 font-medium">Source Type</th>
                <th className="px-5 py-3 font-medium">Platform</th>
                <th className="px-5 py-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-600">
                    {entry.received_at
                      ? format(new Date(entry.received_at), 'MMM d, yyyy')
                      : '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-700">
                    {entry.brand?.name ?? entry.brand_name ?? '—'}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        SOURCE_BADGE_COLORS[entry.source_type] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {formatSourceType(entry.source_type)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{entry.platform ?? '—'}</td>
                  <td className="px-5 py-3 text-right text-green-600 font-semibold">
                    {formatMoney(entry.amount)}
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
