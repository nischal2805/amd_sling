import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getInvoices, createInvoice, updateInvoiceStatus, getDeals } from '../api/client'
import { useState } from 'react'
import { Link } from 'react-router-dom'

const STATUS_CONFIG = {
  draft: { label: 'Draft', bg: 'bg-sand-100 text-navy-600', dot: 'bg-navy-300' },
  sent: { label: 'Sent', bg: 'bg-cyan-50 text-cyan-700', dot: 'bg-cyan-500' },
  paid: { label: 'Paid', bg: 'bg-green-50 text-green-700', dot: 'bg-green-500' },
  overdue: { label: 'Overdue', bg: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
  cancelled: { label: 'Cancelled', bg: 'bg-sand-100 text-navy-400', dot: 'bg-navy-200' }
}

function fmt(n) { return `₹${(Number(n) || 0).toLocaleString()}` }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' }

function NewInvoiceModal({ onClose, deals }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ deal_id: '', amount: '', due_date: '', notes: '' })
  const mutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['invoices'] }); onClose() }
  })
  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  // Auto-fill amount when deal selected
  function onDealChange(e) {
    const dealId = e.target.value
    setForm(f => ({ ...f, deal_id: dealId }))
    if (dealId) {
      const deal = deals.find(d => d.id === dealId)
      if (deal?.total_value) setForm(f => ({ ...f, amount: deal.total_value.toString() }))
    }
  }

  return (
    <div className="fixed inset-0 bg-navy-900/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md border border-sand-200">
        <h2 className="text-base font-semibold text-navy-800 mb-4">Create Invoice</h2>
        <form onSubmit={e => { e.preventDefault(); mutation.mutate(form) }} className="space-y-3">
          <div>
            <label className="text-sm text-navy-700 block mb-1">Link to Deal</label>
            <select value={form.deal_id} onChange={onDealChange} className="w-full border border-sand-200 rounded px-3 py-1.5 text-sm">
              <option value="">— No deal —</option>
              {(deals || []).map(d => <option key={d.id} value={d.id}>{d.title} {d.brand?.name ? `(${d.brand.name})` : ''}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-navy-700 block mb-1">Amount (₹) *</label>
              <input type="number" value={form.amount} onChange={set('amount')} required className="w-full border border-sand-200 rounded px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-sm text-navy-700 block mb-1">Due Date</label>
              <input type="date" value={form.due_date} onChange={set('due_date')} className="w-full border border-sand-200 rounded px-3 py-1.5 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-sm text-navy-700 block mb-1">Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={2} className="w-full border border-sand-200 rounded px-3 py-1.5 text-sm resize-none" />
          </div>
          {mutation.error && <p className="text-red-600 text-sm">{mutation.error.response?.data?.error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-sand-200 text-navy-600 py-1.5 rounded text-sm hover:bg-sand-50">Cancel</button>
            <button type="submit" disabled={mutation.isPending || !form.amount} className="flex-1 bg-teal-500 text-white py-1.5 rounded text-sm hover:bg-teal-600 disabled:opacity-50">
              {mutation.isPending ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Invoices() {
  const qc = useQueryClient()
  const [showNew, setShowNew] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  const { data: invoices = [], isLoading } = useQuery({ queryKey: ['invoices'], queryFn: getInvoices })
  const { data: deals = [] } = useQuery({ queryKey: ['deals'], queryFn: () => getDeals() })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateInvoiceStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] })
  })

  const filtered = statusFilter ? invoices.filter(i => i.status === statusFilter) : invoices

  // Summary stats
  const totalDraft = invoices.filter(i => i.status === 'draft').reduce((s, i) => s + parseFloat(i.amount), 0)
  const totalSent = invoices.filter(i => i.status === 'sent').reduce((s, i) => s + parseFloat(i.amount), 0)
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + parseFloat(i.amount), 0)
  const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + parseFloat(i.amount), 0)

  // Check for overdue invoices (past due_date and still 'sent')
  const now = new Date()
  const overdueAlerts = invoices.filter(i =>
    i.status === 'sent' && i.due_date && new Date(i.due_date) < now
  )

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-navy-800">Invoices</h1>
          <p className="text-sm text-navy-400 mt-0.5">{invoices.length} total · {fmt(totalSent + totalOverdue)} outstanding</p>
        </div>
        <button onClick={() => setShowNew(true)} className="bg-teal-500 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-teal-600 transition-colors">
          + New Invoice
        </button>
      </div>

      {/* Overdue alert banner */}
      {overdueAlerts.length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <span className="text-red-500 text-lg">⚠</span>
          <div>
            <p className="text-sm font-medium text-red-800">{overdueAlerts.length} invoice(s) past due date</p>
            <p className="text-xs text-red-600 mt-0.5">Consider marking them as overdue or following up with the brand</p>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="bg-white border border-sand-200 rounded-lg p-4 shadow-sm">
          <p className="text-xs text-navy-400">Draft</p>
          <p className="text-lg font-semibold text-navy-600 mt-1">{fmt(totalDraft)}</p>
          <p className="text-xs text-navy-300 mt-0.5">{invoices.filter(i => i.status === 'draft').length} invoices</p>
        </div>
        <div className="bg-white border border-cyan-200 rounded-lg p-4 shadow-sm">
          <p className="text-xs text-cyan-600">Sent / Awaiting</p>
          <p className="text-lg font-semibold text-cyan-700 mt-1">{fmt(totalSent)}</p>
          <p className="text-xs text-navy-300 mt-0.5">{invoices.filter(i => i.status === 'sent').length} invoices</p>
        </div>
        <div className="bg-white border border-green-200 rounded-lg p-4 shadow-sm">
          <p className="text-xs text-green-600">Paid</p>
          <p className="text-lg font-semibold text-green-700 mt-1">{fmt(totalPaid)}</p>
          <p className="text-xs text-navy-300 mt-0.5">{invoices.filter(i => i.status === 'paid').length} invoices</p>
        </div>
        <div className="bg-white border border-red-200 rounded-lg p-4 shadow-sm">
          <p className="text-xs text-red-600">Overdue</p>
          <p className="text-lg font-semibold text-red-700 mt-1">{fmt(totalOverdue)}</p>
          <p className="text-xs text-navy-300 mt-0.5">{invoices.filter(i => i.status === 'overdue').length} invoices</p>
        </div>
      </div>

      {/* Invoices table */}
      <div className="bg-white border border-sand-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-sand-200 flex items-center gap-3">
          <h2 className="text-sm font-medium text-navy-800 flex-1">All Invoices</h2>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-sand-200 rounded px-2 py-1 text-xs">
            <option value="">All statuses</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-navy-400 border-b border-sand-100 bg-sand-50">
              <th className="px-5 py-2.5 font-medium">Invoice #</th>
              <th className="px-4 py-2.5 font-medium">Deal / Brand</th>
              <th className="px-4 py-2.5 font-medium">Amount</th>
              <th className="px-4 py-2.5 font-medium">Due Date</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-50">
            {isLoading ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-navy-300">Loading invoices...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-navy-300">No invoices yet — create your first one</td></tr>
            ) : filtered.map(inv => {
              const cfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.draft
              const isPastDue = inv.status === 'sent' && inv.due_date && new Date(inv.due_date) < now
              return (
                <tr key={inv.id} className={`hover:bg-sand-50 ${isPastDue ? 'bg-red-50/40' : ''}`}>
                  <td className="px-5 py-3">
                    <span className="text-sm font-mono text-navy-700">{inv.invoice_number}</span>
                  </td>
                  <td className="px-4 py-3">
                    {inv.deal ? (
                      <div>
                        <Link to={`/deals/${inv.deal.id}`} className="text-sm text-navy-800 hover:text-teal-600">{inv.deal.title}</Link>
                        {inv.deal.brand && <p className="text-xs text-navy-300">{inv.deal.brand.name}</p>}
                      </div>
                    ) : <span className="text-sm text-navy-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-navy-800">{fmt(inv.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-sm ${isPastDue ? 'text-red-600 font-medium' : 'text-navy-500'}`}>
                      {fmtDate(inv.due_date)}
                      {isPastDue && ' ⚠'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${cfg.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {inv.status === 'draft' && (
                        <button
                          onClick={() => statusMutation.mutate({ id: inv.id, status: 'sent' })}
                          className="text-xs bg-cyan-50 text-cyan-700 px-2.5 py-1 rounded hover:bg-cyan-100 font-medium transition-colors"
                        >
                          Mark Sent
                        </button>
                      )}
                      {(inv.status === 'sent' || inv.status === 'overdue') && (
                        <button
                          onClick={() => statusMutation.mutate({ id: inv.id, status: 'paid' })}
                          className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded hover:bg-green-100 font-medium transition-colors"
                        >
                          Mark Paid
                        </button>
                      )}
                      {inv.status === 'sent' && isPastDue && (
                        <button
                          onClick={() => statusMutation.mutate({ id: inv.id, status: 'overdue' })}
                          className="text-xs bg-red-50 text-red-700 px-2.5 py-1 rounded hover:bg-red-100 font-medium transition-colors"
                        >
                          Mark Overdue
                        </button>
                      )}
                      {inv.status === 'draft' && (
                        <button
                          onClick={() => statusMutation.mutate({ id: inv.id, status: 'cancelled' })}
                          className="text-xs text-navy-300 hover:text-red-500 px-1 transition-colors"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Timeline / recent activity */}
      {invoices.length > 0 && (
        <div className="mt-5 bg-white border border-sand-200 rounded-lg shadow-sm p-5">
          <h2 className="text-sm font-medium text-navy-800 mb-3">Recent Activity</h2>
          <div className="space-y-2.5">
            {invoices.filter(i => i.paid_at || i.sent_at).slice(0, 5).map(inv => (
              <div key={inv.id} className="flex items-center gap-3 text-sm">
                <span className={`w-2 h-2 rounded-full ${inv.paid_at ? 'bg-green-500' : 'bg-cyan-500'}`}></span>
                <span className="text-navy-700 font-mono text-xs">{inv.invoice_number}</span>
                <span className="text-navy-400">
                  {inv.paid_at ? `Paid on ${fmtDate(inv.paid_at)}` : `Sent on ${fmtDate(inv.sent_at)}`}
                </span>
                <span className="ml-auto text-navy-600 font-medium">{fmt(inv.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showNew && <NewInvoiceModal onClose={() => setShowNew(false)} deals={deals} />}
    </div>
  )
}
