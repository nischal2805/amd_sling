import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { getDeal, moveDealStage, updateDeliverableStatus, createDeliverable, deleteDeliverable, parseEmail, suggestRate, draftResponse } from '../api/client'
import { useState } from 'react'

const STAGES = ['inbound', 'qualified', 'negotiation', 'contract_sent', 'in_production', 'client_review', 'posted', 'invoice_sent', 'paid', 'declined']
const STAGE_LABELS = { inbound: 'Inbound', qualified: 'Qualified', negotiation: 'Negotiation', contract_sent: 'Contract Sent', in_production: 'In Production', client_review: 'Client Review', posted: 'Posted', invoice_sent: 'Invoice Sent', paid: 'Paid', declined: 'Declined' }
const DELIV_STATUSES = ['not_started', 'in_progress', 'pending_review', 'approved', 'posted', 'completed']
const DELIV_STATUS_COLORS = { not_started: 'text-navy-400', in_progress: 'text-cyan-600', pending_review: 'text-yellow-600', approved: 'text-teal-600', posted: 'text-navy-600', completed: 'text-green-600' }

function fmt(n) { return `₹${(Number(n) || 0).toLocaleString()}` }

export default function DealDetail() {
  const { id } = useParams()
  const qc = useQueryClient()
  const [aiTab, setAiTab] = useState('parse')
  const [emailText, setEmailText] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [draftAction, setDraftAction] = useState('accept')
  const [showAddDeliv, setShowAddDeliv] = useState(false)
  const [newDeliv, setNewDeliv] = useState({ title: '', type: '', platform: '', deadline: '' })

  const { data: deal, isLoading } = useQuery({ queryKey: ['deal', id], queryFn: () => getDeal(id) })

  const stageMutation = useMutation({
    mutationFn: (stage) => moveDealStage(id, stage),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deal', id] })
  })

  const delivStatusMutation = useMutation({
    mutationFn: ({ delivId, status }) => updateDeliverableStatus(id, delivId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deal', id] })
  })

  const addDelivMutation = useMutation({
    mutationFn: (data) => createDeliverable(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['deal', id] }); setShowAddDeliv(false); setNewDeliv({ title: '', type: '', platform: '', deadline: '' }) }
  })

  const deleteDelivMutation = useMutation({
    mutationFn: (delivId) => deleteDeliverable(id, delivId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deal', id] })
  })

  async function runAI() {
    setAiLoading(true); setAiResult(null)
    try {
      if (aiTab === 'parse') {
        const r = await parseEmail({ email_text: emailText, deal_id: id })
        setAiResult(r)
      } else if (aiTab === 'rate') {
        const r = await suggestRate({ niche: 'tech', platform: deal?.brand?.name, deliverables: deal?.deliverables || [], deal_id: id })
        setAiResult(r)
      } else if (aiTab === 'draft') {
        const r = await draftResponse({ deal_id: id, deal_title: deal?.title, brand_name: deal?.brand?.name, stage: deal?.stage, user_action: draftAction })
        setAiResult(r)
      }
    } catch (e) {
      setAiResult({ error: e.response?.data?.error || 'AI request failed' })
    }
    setAiLoading(false)
  }

  if (isLoading) return <div className="p-6 text-navy-300 text-sm">Loading deal...</div>
  if (!deal) return <div className="p-6 text-red-600 text-sm">Deal not found</div>

  const deliverables = deal.deliverables || []

  return (
    <div className="p-6 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-navy-400 mb-4">
        <Link to="/pipeline" className="hover:text-teal-600">Pipeline</Link>
        <span>/</span>
        <span className="text-navy-700">{deal.title}</span>
      </div>

      <div className="flex gap-5">
        {/* Main deal panel */}
        <div className="flex-1 space-y-4">
          {/* Header */}
          <div className="bg-white border border-sand-200 rounded-lg shadow-sm p-5">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-lg font-semibold text-navy-800">{deal.title}</h1>
                {deal.brand && <p className="text-sm text-navy-400 mt-0.5">{deal.brand.name}</p>}
              </div>
              <div className="text-right">
                {deal.total_value && <p className="text-xl font-bold text-teal-600">{fmt(deal.total_value)}</p>}
                <p className="text-xs text-navy-300">{deal.currency || 'INR'}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <label className="text-sm text-navy-500">Stage:</label>
              <select
                value={deal.stage}
                onChange={e => stageMutation.mutate(e.target.value)}
                className="border border-sand-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-teal-500"
              >
                {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
              </select>
            </div>
            {deal.description && <p className="mt-3 text-sm text-navy-600 bg-sand-50 rounded p-3">{deal.description}</p>}
            <div className="mt-3 flex gap-6 text-xs text-navy-300">
              {deal.posting_deadline && <span>Deadline: {new Date(deal.posting_deadline).toLocaleDateString()}</span>}
              {deal.start_date && <span>Start: {new Date(deal.start_date).toLocaleDateString()}</span>}
              {deal.end_date && <span>End: {new Date(deal.end_date).toLocaleDateString()}</span>}
            </div>
          </div>

          {/* Deliverables */}
          <div className="bg-white border border-sand-200 rounded-lg shadow-sm">
            <div className="px-5 py-3 border-b border-sand-100 flex items-center justify-between">
              <h2 className="text-sm font-medium text-navy-800">Deliverables</h2>
              <button onClick={() => setShowAddDeliv(true)} className="text-xs text-teal-600 hover:underline">+ Add</button>
            </div>
            {deliverables.length === 0 ? (
              <p className="px-5 py-4 text-sm text-navy-300">No deliverables yet</p>
            ) : (
              <div className="divide-y divide-sand-50">
                {deliverables.map(d => (
                  <div key={d.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-navy-800">{d.title}</p>
                      <p className="text-xs text-navy-300 mt-0.5">{d.type} · {d.platform}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={d.status}
                        onChange={e => delivStatusMutation.mutate({ delivId: d.id, status: e.target.value })}
                        className={`text-xs border border-sand-200 rounded px-2 py-1 ${DELIV_STATUS_COLORS[d.status]}`}
                      >
                        {DELIV_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                      </select>
                      <button onClick={() => deleteDelivMutation.mutate(d.id)} className="text-navy-200 hover:text-red-500 text-xs">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {showAddDeliv && (
              <div className="px-5 py-3 bg-sand-50 border-t border-sand-100 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Title *" value={newDeliv.title} onChange={e => setNewDeliv(f => ({ ...f, title: e.target.value }))} className="border border-sand-200 rounded px-2 py-1 text-sm col-span-2" />
                  <input placeholder="Type (youtube_video…)" value={newDeliv.type} onChange={e => setNewDeliv(f => ({ ...f, type: e.target.value }))} className="border border-sand-200 rounded px-2 py-1 text-sm" />
                  <input placeholder="Platform" value={newDeliv.platform} onChange={e => setNewDeliv(f => ({ ...f, platform: e.target.value }))} className="border border-sand-200 rounded px-2 py-1 text-sm" />
                  <input type="date" value={newDeliv.deadline} onChange={e => setNewDeliv(f => ({ ...f, deadline: e.target.value }))} className="border border-sand-200 rounded px-2 py-1 text-sm" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowAddDeliv(false)} className="text-xs text-navy-400 hover:text-navy-800 px-2 py-1">Cancel</button>
                  <button onClick={() => addDelivMutation.mutate(newDeliv)} disabled={!newDeliv.title} className="text-xs bg-teal-500 text-white px-3 py-1 rounded hover:bg-teal-600 disabled:opacity-50">Add</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Panel */}
        <div className="w-80 shrink-0">
          <div className="bg-white border border-sand-200 rounded-lg shadow-sm">
            <div className="px-4 py-3 border-b border-sand-100 bg-navy-800 rounded-t-lg">
              <h2 className="text-sm font-medium text-white">AI Assistant</h2>
            </div>
            <div className="flex border-b border-sand-100">
              {['parse', 'rate', 'draft'].map(tab => (
                <button
                  key={tab}
                  onClick={() => { setAiTab(tab); setAiResult(null) }}
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${aiTab === tab ? 'text-teal-600 border-b-2 border-teal-500' : 'text-navy-400 hover:text-navy-700'}`}
                >
                  {tab === 'parse' ? 'Parse Email' : tab === 'rate' ? 'Suggest Rate' : 'Draft Reply'}
                </button>
              ))}
            </div>
            <div className="p-4 space-y-3">
              {aiTab === 'parse' && (
                <textarea
                  value={emailText}
                  onChange={e => setEmailText(e.target.value)}
                  placeholder="Paste sponsorship email here..."
                  className="w-full border border-sand-200 rounded p-2 text-xs h-28 resize-none focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              )}
              {aiTab === 'draft' && (
                <div>
                  <label className="text-xs text-navy-500 block mb-1">I want to:</label>
                  <select value={draftAction} onChange={e => setDraftAction(e.target.value)} className="w-full border border-sand-200 rounded px-2 py-1.5 text-xs">
                    <option value="accept">Accept the deal</option>
                    <option value="negotiate">Counter-offer / negotiate</option>
                    <option value="request more details">Request more details</option>
                    <option value="decline politely">Decline politely</option>
                    <option value="follow up">Follow up on previous email</option>
                  </select>
                </div>
              )}
              {aiTab === 'rate' && (
                <p className="text-xs text-navy-400">Analyzes your deal deliverables and suggests a rate range based on current market data.</p>
              )}

              <button
                onClick={runAI}
                disabled={aiLoading || (aiTab === 'parse' && !emailText)}
                className="w-full bg-teal-500 text-white text-xs py-2 rounded hover:bg-teal-600 disabled:opacity-50"
              >
                {aiLoading ? 'Thinking...' : aiTab === 'parse' ? 'Parse Email' : aiTab === 'rate' ? 'Suggest Rate' : 'Draft Reply'}
              </button>

              {aiResult && (
                <div className="mt-3 border border-sand-200 rounded p-3 bg-sand-50 text-xs space-y-1.5 max-h-64 overflow-y-auto">
                  {aiResult.error ? (
                    <p className="text-red-600">{aiResult.error}</p>
                  ) : aiTab === 'parse' ? (
                    <>
                      <p className={`font-medium ${aiResult.is_sponsorship ? 'text-teal-600' : 'text-navy-400'}`}>
                        {aiResult.is_sponsorship ? `✓ Sponsorship (${Math.round((aiResult.confidence || 0) * 100)}% confidence)` : '✗ Not a sponsorship'}
                      </p>
                      {aiResult.brand_name && <p><span className="text-navy-400">Brand:</span> {aiResult.brand_name}</p>}
                      {aiResult.budget_amount && <p><span className="text-navy-400">Budget:</span> ₹{aiResult.budget_amount?.toLocaleString()} {aiResult.currency}</p>}
                      {aiResult.summary && <p className="text-navy-500 mt-1 pt-1 border-t border-sand-200">{aiResult.summary}</p>}
                    </>
                  ) : aiTab === 'rate' ? (
                    <>
                      <p className="font-medium text-navy-800">₹{aiResult.low_estimate?.toLocaleString()} – ₹{aiResult.high_estimate?.toLocaleString()}</p>
                      <p className="text-navy-400">Mid: ₹{aiResult.mid_estimate?.toLocaleString()}</p>
                      {aiResult.reasoning && <p className="text-navy-500 mt-1">{aiResult.reasoning}</p>}
                      {aiResult.negotiation_tips?.map((tip, i) => <p key={i} className="text-navy-400">• {tip}</p>)}
                    </>
                  ) : (
                    <p className="text-navy-700 whitespace-pre-wrap leading-relaxed">{aiResult.draft}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
