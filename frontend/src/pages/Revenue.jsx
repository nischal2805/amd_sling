import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRevenue, createRevenue, deleteRevenue, getRevenueSummary, getBrands, getRevenueForecast } from '../api/client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useState } from 'react'

const SOURCE_TYPES = ['sponsorship', 'affiliate', 'adsense', 'membership', 'product', 'consulting', 'other']
const PLATFORMS = ['youtube', 'instagram', 'linkedin', 'twitter', 'tiktok', 'other']

function fmt(n) { return `₹${(Number(n) || 0).toLocaleString()}` }

function AddRevenueModal({ onClose, brands }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ source_type: 'sponsorship', source_name: '', amount: '', date: new Date().toISOString().slice(0, 10), platform: '', brand_id: '', notes: '' })
  const mutation = useMutation({
    mutationFn: createRevenue,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['revenue'] }); qc.invalidateQueries({ queryKey: ['revenue-summary'] }); onClose() }
  })
  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  return (
    <div className="fixed inset-0 bg-navy-900/50 flex items-center justify-center z-50">
      <div className="bg-sand-100 rounded-lg shadow-lg p-6 w-full max-w-md border border-sand-200">
        <h2 className="text-base font-semibold text-navy-900 mb-4">Add Revenue Entry</h2>
        <form onSubmit={e => { e.preventDefault(); mutation.mutate(form) }} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-navy-600 block mb-1">Type *</label>
              <select value={form.source_type} onChange={set('source_type')} className="w-full border border-sand-200 rounded px-3 py-1.5 text-sm bg-sand-50 text-sand-600">
                {SOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-navy-600 block mb-1">Amount (₹) *</label>
              <input type="number" value={form.amount} onChange={set('amount')} required className="w-full border border-sand-200 rounded px-3 py-1.5 text-sm bg-sand-50 text-sand-600" />
            </div>
            <div>
              <label className="text-sm text-navy-600 block mb-1">Date *</label>
              <input type="date" value={form.date} onChange={set('date')} required className="w-full border border-sand-200 rounded px-3 py-1.5 text-sm bg-sand-50 text-sand-600" />
            </div>
            <div>
              <label className="text-sm text-navy-600 block mb-1">Platform</label>
              <select value={form.platform} onChange={set('platform')} className="w-full border border-sand-200 rounded px-3 py-1.5 text-sm bg-sand-50 text-sand-600">
                <option value="">—</option>
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-sm text-navy-600 block mb-1">Source name</label>
              <input value={form.source_name} onChange={set('source_name')} placeholder="e.g. Nike Q3 Deal" className="w-full border border-sand-200 rounded px-3 py-1.5 text-sm bg-sand-50 text-sand-600" />
            </div>
            <div className="col-span-2">
              <label className="text-sm text-navy-600 block mb-1">Brand</label>
              <select value={form.brand_id} onChange={set('brand_id')} className="w-full border border-sand-200 rounded px-3 py-1.5 text-sm bg-sand-50 text-sand-600">
                <option value="">—</option>
                {(brands || []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-sm text-navy-600 block mb-1">Notes</label>
              <input value={form.notes} onChange={set('notes')} className="w-full border border-sand-200 rounded px-3 py-1.5 text-sm bg-sand-50 text-sand-600" />
            </div>
          </div>
          {mutation.error && <p className="text-red-400 text-sm">{mutation.error.response?.data?.error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-sand-200 text-navy-600 py-1.5 rounded text-sm hover:bg-sand-50">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 bg-teal-500 text-white py-1.5 rounded text-sm hover:bg-teal-600 disabled:opacity-50">
              {mutation.isPending ? 'Saving...' : 'Add Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Revenue() {
  const qc = useQueryClient()
  const [showNew, setShowNew] = useState(false)
  const [sourceFilter, setSourceFilter] = useState('')

  const { data: entries = [], isLoading } = useQuery({ queryKey: ['revenue'], queryFn: () => getRevenue() })
  const { data: summary } = useQuery({ queryKey: ['revenue-summary'], queryFn: () => getRevenueSummary() })
  const { data: brands = [] } = useQuery({ queryKey: ['brands'], queryFn: getBrands })
  const { data: forecast } = useQuery({ queryKey: ['revenue-forecast'], queryFn: getRevenueForecast })

  const deleteMutation = useMutation({
    mutationFn: deleteRevenue,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['revenue'] }); qc.invalidateQueries({ queryKey: ['revenue-summary'] }) }
  })

  const filtered = sourceFilter ? entries.filter(e => e.source_type === sourceFilter) : entries

  const chartData = (summary?.by_month || []).slice(-6).map(m => ({
    month: m.month.slice(5),
    amount: Number(m.amount)
  }))

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-navy-900">Revenue</h1>
          <p className="text-sm text-navy-400 mt-0.5">{fmt(summary?.total)} total recorded</p>
        </div>
        <button onClick={() => setShowNew(true)} className="bg-teal-500 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-teal-600">
          + Add Entry
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {(summary?.by_source || []).map(s => (
          <div key={s.source_type} className="bg-sand-100 border border-sand-200 rounded-lg p-4 shadow-sm">
            <p className="text-xs text-navy-400 capitalize">{s.source_type}</p>
            <p className="text-lg font-semibold text-navy-900 mt-1">{fmt(s.amount)}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {/* Chart */}
        <div className="lg:col-span-2 bg-sand-100 border border-sand-200 rounded-lg shadow-sm p-5">
          <h2 className="text-sm font-medium text-navy-900 mb-4">Monthly revenue</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barSize={26}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8DCC8" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#5a759d' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#5a759d' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? `${v / 1000}k` : v}`} />
                <Tooltip formatter={v => [`₹${v.toLocaleString()}`, 'Revenue']} contentStyle={{ borderColor: '#E8DCC8', borderRadius: 8 }} />
                <Bar dataKey="amount" fill="#1B98A0" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-navy-300 text-sm">No data</div>
          )}
        </div>

        {/* By platform */}
        <div className="bg-sand-100 border border-sand-200 rounded-lg shadow-sm p-5">
          <h2 className="text-sm font-medium text-navy-900 mb-3">By platform</h2>
          <div className="space-y-2">
            {(summary?.by_platform || []).map(p => (
              <div key={p.platform} className="flex justify-between items-center">
                <span className="text-sm text-navy-500 capitalize">{p.platform}</span>
                <span className="text-sm font-medium text-navy-900">{fmt(p.amount)}</span>
              </div>
            ))}
            {!summary?.by_platform?.length && <p className="text-sm text-navy-300">No data</p>}
          </div>
        </div>
      </div>

      {/* Forecast card */}
      {forecast && (
        <div className="bg-gradient-to-r from-navy-800 to-navy-700 border border-navy-600 rounded-lg shadow-sm p-5 mb-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-navy-200 uppercase tracking-wide font-medium">📈 Next Month Forecast</p>
              <p className="text-2xl font-bold mt-1">{fmt(forecast.forecast_next_month)}</p>
              <p className="text-xs text-navy-300 mt-1">Based on last {forecast.based_on_months?.length || 0} months average</p>
            </div>
            {forecast.monthly_values?.length > 0 && (
              <div className="flex items-end gap-1.5 h-12">
                {forecast.monthly_values.map((v, i) => {
                  const max = Math.max(...forecast.monthly_values, 1)
                  const h = Math.max(4, (v / max) * 48)
                  return <div key={i} className="w-5 bg-teal-400/60 rounded-t" style={{ height: h }} title={`₹${v.toLocaleString()}`} />
                })}
                <div className="w-5 bg-cyan-400 rounded-t border-2 border-dashed border-cyan-300" style={{ height: Math.max(4, (forecast.forecast_next_month / Math.max(...forecast.monthly_values, 1)) * 48) }} title={`Forecast: ₹${forecast.forecast_next_month?.toLocaleString()}`} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Entries table */}
      <div className="bg-sand-100 border border-sand-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-sand-200 flex items-center gap-3">
          <h2 className="text-sm font-medium text-navy-900 flex-1">All entries</h2>
          <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="border border-sand-200 rounded px-2 py-1 text-xs bg-sand-50 text-sand-600">
            <option value="">All types</option>
            {SOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-navy-400 border-b border-sand-100 bg-sand-50">
              <th className="px-5 py-2.5 font-medium">Date</th>
              <th className="px-4 py-2.5 font-medium">Source</th>
              <th className="px-4 py-2.5 font-medium">Type</th>
              <th className="px-4 py-2.5 font-medium">Platform</th>
              <th className="px-4 py-2.5 font-medium">Amount</th>
              <th className="px-4 py-2.5 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-50">
            {isLoading ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-navy-300">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-navy-300">No entries yet</td></tr>
            ) : filtered.map(e => (
              <tr key={e.id} className="hover:bg-sand-50">
                <td className="px-5 py-3 text-sm text-navy-500">{new Date(e.date).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-sm text-navy-900">{e.source_name || (e.brand?.name) || '—'}</td>
                <td className="px-4 py-3 text-xs text-navy-400 capitalize">{e.source_type}</td>
                <td className="px-4 py-3 text-xs text-navy-400 capitalize">{e.platform || '—'}</td>
                <td className="px-4 py-3 text-sm font-medium text-teal-600">{fmt(e.amount)}</td>
                <td className="px-4 py-3">
                  <button onClick={() => { if (confirm('Delete entry?')) deleteMutation.mutate(e.id) }} className="text-xs text-navy-200 hover:text-red-400">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNew && <AddRevenueModal onClose={() => setShowNew(false)} brands={brands} />}
    </div>
  )
}
