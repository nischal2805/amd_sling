import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBrands, createBrand, deleteBrand } from '../api/client'
import { useState } from 'react'
import { Link } from 'react-router-dom'

const WARMTH_COLORS = {
  high: 'bg-teal-100 text-teal-700',
  mid: 'bg-sand-200 text-navy-600',
  low: 'bg-cyan-900/40 text-navy-600'
}

function warmthLabel(score) {
  if (score >= 75) return { label: 'Warm', cls: WARMTH_COLORS.high }
  if (score >= 50) return { label: 'Neutral', cls: WARMTH_COLORS.mid }
  return { label: 'Cold', cls: WARMTH_COLORS.low }
}

function fmt(n) { return `₹${(Number(n) || 0).toLocaleString()}` }

function NewBrandModal({ onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: '', website: '', industry: '', contact_name: '', contact_email: '' })
  const mutation = useMutation({
    mutationFn: createBrand,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['brands'] }); onClose() }
  })
  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  return (
    <div className="fixed inset-0 bg-navy-900/50 flex items-center justify-center z-50">
      <div className="bg-sand-100 rounded-lg shadow-lg p-6 w-full max-w-md border border-sand-200">
        <h2 className="text-base font-semibold text-navy-900 mb-4">Add Brand</h2>
        <form onSubmit={e => { e.preventDefault(); mutation.mutate(form) }} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-sm text-navy-600 block mb-1">Brand name *</label>
              <input value={form.name} onChange={set('name')} required className="w-full border border-sand-200 rounded px-3 py-1.5 text-sm bg-sand-50 text-sand-600 focus:ring-1 focus:ring-teal-500 focus:border-teal-500" />
            </div>
            <div>
              <label className="text-sm text-navy-600 block mb-1">Industry</label>
              <input value={form.industry} onChange={set('industry')} className="w-full border border-sand-200 rounded px-3 py-1.5 text-sm bg-sand-50 text-sand-600" />
            </div>
            <div>
              <label className="text-sm text-navy-600 block mb-1">Website</label>
              <input value={form.website} onChange={set('website')} className="w-full border border-sand-200 rounded px-3 py-1.5 text-sm bg-sand-50 text-sand-600" />
            </div>
            <div>
              <label className="text-sm text-navy-600 block mb-1">Contact name</label>
              <input value={form.contact_name} onChange={set('contact_name')} className="w-full border border-sand-200 rounded px-3 py-1.5 text-sm bg-sand-50 text-sand-600" />
            </div>
            <div>
              <label className="text-sm text-navy-600 block mb-1">Contact email</label>
              <input type="email" value={form.contact_email} onChange={set('contact_email')} className="w-full border border-sand-200 rounded px-3 py-1.5 text-sm bg-sand-50 text-sand-600" />
            </div>
          </div>
          {mutation.error && <p className="text-red-400 text-sm">{mutation.error.response?.data?.error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-sand-200 text-navy-600 py-1.5 rounded text-sm hover:bg-sand-50">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 bg-teal-500 text-white py-1.5 rounded text-sm hover:bg-teal-600 disabled:opacity-50">
              {mutation.isPending ? 'Adding...' : 'Add Brand'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Brands() {
  const qc = useQueryClient()
  const [showNew, setShowNew] = useState(false)
  const { data: brands = [], isLoading } = useQuery({ queryKey: ['brands'], queryFn: getBrands })

  const deleteMutation = useMutation({
    mutationFn: deleteBrand,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brands'] })
  })

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-navy-900">Brands</h1>
          <p className="text-sm text-navy-400 mt-0.5">{brands.length} brands</p>
        </div>
        <button onClick={() => setShowNew(true)} className="bg-teal-500 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-teal-600">
          + Add Brand
        </button>
      </div>

      <div className="bg-sand-100 border border-sand-200 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-navy-400 border-b border-sand-200 bg-sand-50">
              <th className="px-5 py-3 font-medium">Brand</th>
              <th className="px-4 py-3 font-medium">Industry</th>
              <th className="px-4 py-3 font-medium">Deals</th>
              <th className="px-4 py-3 font-medium">Total Revenue</th>
              <th className="px-4 py-3 font-medium">Warmth</th>
              <th className="px-4 py-3 font-medium">Last Deal</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-50">
            {isLoading ? (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-navy-300">Loading...</td></tr>
            ) : brands.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-navy-300">No brands yet</td></tr>
            ) : brands.map(brand => {
              const w = warmthLabel(brand.warmth_score)
              return (
                <tr key={brand.id} className="hover:bg-sand-50 transition-colors">
                  <td className="px-5 py-3">
                    <Link to={`/brands/${brand.id}`} className="text-sm font-medium text-navy-900 hover:text-teal-600">{brand.name}</Link>
                    {brand.contact_name && <p className="text-xs text-navy-300">{brand.contact_name}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-navy-500">{brand.industry || '—'}</td>
                  <td className="px-4 py-3 text-sm text-navy-900">{brand.total_deals || 0}</td>
                  <td className="px-4 py-3 text-sm font-medium text-teal-600">{fmt(brand.total_revenue)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex text-xs px-2 py-0.5 rounded-full font-medium ${w.cls}`}>{w.label}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-navy-300">
                    {brand.last_collaboration_date ? new Date(brand.last_collaboration_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { if (confirm(`Delete ${brand.name}?`)) deleteMutation.mutate(brand.id) }}
                      className="text-xs text-navy-200 hover:text-red-400"
                    >Delete</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showNew && <NewBrandModal onClose={() => setShowNew(false)} />}
    </div>
  )
}
