import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { getDeal, moveDealStage, updateDeliverableStatus, createDeliverable, deleteDeliverable, parseEmail, suggestRate, draftResponse, generateBrief, negotiationCoach, toggleDeliverableLock, lockAllDeliverables, getNegotiationNotes, createNegotiationNote, deleteNegotiationNote } from '../api/client'
import { useState } from 'react'

const STAGES = ['inbound', 'qualified', 'negotiation', 'contract_sent', 'in_production', 'client_review', 'posted', 'invoice_sent', 'paid', 'declined']
const STAGE_LABELS = { inbound: 'Inbound', qualified: 'Qualified', negotiation: 'Negotiation', contract_sent: 'Contract Sent', in_production: 'In Production', client_review: 'Client Review', posted: 'Posted', invoice_sent: 'Invoice Sent', paid: 'Paid', declined: 'Declined' }
const STAGE_COLORS = { inbound: 'bg-sand-200 text-navy-700', qualified: 'bg-cyan-100 text-cyan-800', negotiation: 'bg-yellow-100 text-yellow-700', contract_sent: 'bg-teal-100 text-teal-700', in_production: 'bg-orange-100 text-orange-700', client_review: 'bg-cyan-50 text-teal-700', posted: 'bg-teal-50 text-teal-700', invoice_sent: 'bg-navy-100 text-navy-700', paid: 'bg-green-100 text-green-700', declined: 'bg-red-100 text-red-700' }
const DELIV_STATUSES = ['not_started', 'in_progress', 'pending_review', 'approved', 'posted', 'completed']
const DELIV_STATUS_COLORS = { not_started: 'text-navy-400', in_progress: 'text-cyan-600', pending_review: 'text-yellow-600', approved: 'text-teal-600', posted: 'text-navy-600', completed: 'text-green-600' }
const NOTE_TYPES = ['general', 'budget_range', 'discount', 'payment_terms', 'revision_demand', 'rate_card']
const NOTE_TYPE_LABELS = { general: 'General', budget_range: 'Budget Range', discount: 'Discount', payment_terms: 'Payment Terms', revision_demand: 'Revision', rate_card: 'Rate Card' }
const NOTE_TYPE_COLORS = { general: 'bg-sand-100 text-navy-600', budget_range: 'bg-green-50 text-green-700', discount: 'bg-yellow-50 text-yellow-700', payment_terms: 'bg-cyan-50 text-cyan-700', revision_demand: 'bg-red-50 text-red-700', rate_card: 'bg-teal-50 text-teal-700' }

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
  const [showAddNote, setShowAddNote] = useState(false)
  const [newNote, setNewNote] = useState({ note_type: 'general', content: '' })

  const { data: deal, isLoading } = useQuery({ queryKey: ['deal', id], queryFn: () => getDeal(id) })
  const { data: negoNotes = [] } = useQuery({
    queryKey: ['nego-notes', deal?.brand_id],
    queryFn: () => getNegotiationNotes({ brand_id: deal.brand_id }),
    enabled: !!deal?.brand_id
  })

  const stageMutation = useMutation({ mutationFn: (stage) => moveDealStage(id, stage), onSuccess: () => qc.invalidateQueries({ queryKey: ['deal', id] }) })
  const delivStatusMutation = useMutation({ mutationFn: ({ delivId, status }) => updateDeliverableStatus(id, delivId, status), onSuccess: () => qc.invalidateQueries({ queryKey: ['deal', id] }) })
  const addDelivMutation = useMutation({ mutationFn: (data) => createDeliverable(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['deal', id] }); setShowAddDeliv(false); setNewDeliv({ title: '', type: '', platform: '', deadline: '' }) } })
  const deleteDelivMutation = useMutation({ mutationFn: (delivId) => deleteDeliverable(id, delivId), onSuccess: () => qc.invalidateQueries({ queryKey: ['deal', id] }) })
  const lockMutation = useMutation({ mutationFn: (delivId) => toggleDeliverableLock(id, delivId), onSuccess: () => qc.invalidateQueries({ queryKey: ['deal', id] }) })
  const lockAllMutation = useMutation({ mutationFn: () => lockAllDeliverables(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['deal', id] }) })
  const addNoteMutation = useMutation({ mutationFn: (data) => createNegotiationNote(data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['nego-notes'] }); setShowAddNote(false); setNewNote({ note_type: 'general', content: '' }) } })
  const deleteNoteMutation = useMutation({ mutationFn: (noteId) => deleteNegotiationNote(noteId), onSuccess: () => qc.invalidateQueries({ queryKey: ['nego-notes'] }) })

  async function runAI() {
    setAiLoading(true); setAiResult(null)
    try {
      if (aiTab === 'parse') {
        setAiResult(await parseEmail({ email_text: emailText, deal_id: id }))
      } else if (aiTab === 'rate') {
        setAiResult(await suggestRate({ niche: 'tech', platform: deal?.brand?.name, deliverables: deal?.deliverables || [], deal_id: id }))
      } else if (aiTab === 'draft') {
        setAiResult(await draftResponse({ deal_id: id, deal_title: deal?.title, brand_name: deal?.brand?.name, stage: deal?.stage, user_action: draftAction }))
      } else if (aiTab === 'brief') {
        setAiResult(await generateBrief({ deal_id: id, brand_name: deal?.brand?.name, deal_title: deal?.title, deal_value: deal?.total_value, deliverables: deal?.deliverables, brand_industry: deal?.brand?.industry, deadline: deal?.posting_deadline }))
      } else if (aiTab === 'coach') {
        setAiResult(await negotiationCoach({ deal_id: id, brand_name: deal?.brand?.name, total_deals: deal?.brand?.total_deals, avg_deal_value: deal?.brand?.average_deal_value, payment_reliability: deal?.brand?.payment_reliability, avg_payment_days: deal?.brand?.average_payment_days, warmth_score: deal?.brand?.warmth_score, past_notes: negoNotes.slice(0, 5).map(n => n.content), proposed_value: deal?.total_value, deliverables: deal?.deliverables }))
      }
    } catch (e) { setAiResult({ error: e.response?.data?.error || 'AI request failed' }) }
    setAiLoading(false)
  }

  if (isLoading) return <div className="p-6 text-navy-300 text-sm">Loading deal...</div>
  if (!deal) return <div className="p-6 text-red-600 text-sm">Deal not found</div>

  const deliverables = deal.deliverables || []
  const isContractStage = ['contract_sent', 'in_production', 'client_review', 'posted', 'invoice_sent', 'paid'].includes(deal.stage)
  const hasUnlocked = deliverables.some(d => !d.locked)

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center gap-2 text-sm text-navy-400 mb-4">
        <Link to="/pipeline" className="hover:text-teal-600">Pipeline</Link>
        <span>/</span>
        <span className="text-navy-700">{deal.title}</span>
      </div>

      <div className="flex gap-5">
        {/* Left — deal info */}
        <div className="flex-1 space-y-4 min-w-0">
          {/* Header */}
          <div className="bg-white border border-sand-200 rounded-lg shadow-sm p-5">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-lg font-semibold text-navy-800">{deal.title}</h1>
                {deal.brand && <p className="text-sm text-navy-400 mt-0.5">{deal.brand.name}</p>}
              </div>
              <div className="text-right">
                {deal.total_value && <p className="text-xl font-bold text-teal-600">{fmt(deal.total_value)}</p>}
                <p className="text-xs text-navy-300">INR</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm text-navy-500">Stage:</label>
                <select value={deal.stage} onChange={e => stageMutation.mutate(e.target.value)} className="border border-sand-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-teal-500">
                  {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                </select>
                <span className={`text-xs px-2 py-0.5 rounded-full ${STAGE_COLORS[deal.stage]}`}>{STAGE_LABELS[deal.stage]}</span>
              </div>
              <div className="flex gap-0.5">
                {STAGES.filter(s => s !== 'declined').map(s => {
                  const ci = STAGES.indexOf(deal.stage), ti = STAGES.indexOf(s)
                  return <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${ti <= ci && deal.stage !== 'declined' ? 'bg-teal-500' : 'bg-sand-200'}`} />
                })}
              </div>
            </div>
            {deal.description && <p className="mt-3 text-sm text-navy-600 bg-sand-50 rounded p-3">{deal.description}</p>}
            <div className="mt-3 flex gap-6 text-xs text-navy-300">
              {deal.posting_deadline && <span>Deadline: {new Date(deal.posting_deadline).toLocaleDateString()}</span>}
              {deal.start_date && <span>Start: {new Date(deal.start_date).toLocaleDateString()}</span>}
              {deal.end_date && <span>End: {new Date(deal.end_date).toLocaleDateString()}</span>}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {deal.contract_sent_at && <span className="text-teal-600 bg-teal-50 px-2 py-0.5 rounded">Contract sent {new Date(deal.contract_sent_at).toLocaleDateString()}</span>}
              {deal.contract_signed_at && <span className="text-teal-600 bg-teal-50 px-2 py-0.5 rounded">Signed {new Date(deal.contract_signed_at).toLocaleDateString()}</span>}
              {deal.invoice_sent_at && <span className="text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded">Invoice {new Date(deal.invoice_sent_at).toLocaleDateString()}</span>}
              {deal.payment_received_at && <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded">Paid {new Date(deal.payment_received_at).toLocaleDateString()}</span>}
            </div>
          </div>

          {/* Deliverables with Lock */}
          <div className="bg-white border border-sand-200 rounded-lg shadow-sm">
            <div className="px-5 py-3 border-b border-sand-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-medium text-navy-800">Deliverables</h2>
                {deliverables.some(d => d.locked) && <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">🔒 {deliverables.filter(d => d.locked).length} locked</span>}
              </div>
              <div className="flex items-center gap-2">
                {isContractStage && hasUnlocked && deliverables.length > 0 && (
                  <button onClick={() => lockAllMutation.mutate()} className="text-xs text-yellow-700 bg-yellow-50 hover:bg-yellow-100 px-2.5 py-1 rounded transition-colors font-medium">🔒 Lock All</button>
                )}
                <button onClick={() => setShowAddDeliv(true)} className="text-xs text-teal-600 hover:underline">+ Add</button>
              </div>
            </div>
            {deliverables.length === 0 ? (
              <p className="px-5 py-4 text-sm text-navy-300">No deliverables yet</p>
            ) : (
              <div className="divide-y divide-sand-50">
                {deliverables.map(d => (
                  <div key={d.id} className={`px-5 py-3 flex items-center justify-between ${d.locked ? 'bg-yellow-50/30' : ''}`}>
                    <div className="flex items-center gap-2.5">
                      {d.locked && <span className="text-xs" title={`Locked${d.locked_at ? ` on ${new Date(d.locked_at).toLocaleDateString()}` : ''}`}>🔒</span>}
                      <div>
                        <p className={`text-sm ${d.locked ? 'text-navy-500' : 'text-navy-800'}`}>{d.title}</p>
                        <p className="text-xs text-navy-300 mt-0.5">{d.type} · {d.platform}{d.deadline && <span> · Due {new Date(d.deadline).toLocaleDateString()}</span>}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {d.locked ? (
                        <span className={`text-xs px-2 py-1 rounded ${DELIV_STATUS_COLORS[d.status]} bg-sand-50`}>{d.status.replace('_', ' ')}</span>
                      ) : (
                        <select value={d.status} onChange={e => delivStatusMutation.mutate({ delivId: d.id, status: e.target.value })} className={`text-xs border border-sand-200 rounded px-2 py-1 ${DELIV_STATUS_COLORS[d.status]}`}>
                          {DELIV_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                      )}
                      <button onClick={() => lockMutation.mutate(d.id)} className="text-xs text-navy-300 hover:text-yellow-600" title={d.locked ? 'Unlock' : 'Lock'}>{d.locked ? '🔓' : '🔒'}</button>
                      {!d.locked && <button onClick={() => deleteDelivMutation.mutate(d.id)} className="text-navy-200 hover:text-red-500 text-xs">✕</button>}
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

          {/* Negotiation Memory */}
          {deal.brand_id && (
            <div className="bg-white border border-sand-200 rounded-lg shadow-sm">
              <div className="px-5 py-3 border-b border-sand-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-medium text-navy-800">💡 Negotiation Memory</h2>
                  <p className="text-xs text-navy-300 mt-0.5">History with {deal.brand?.name}</p>
                </div>
                <button onClick={() => setShowAddNote(true)} className="text-xs text-teal-600 hover:underline">+ Add Note</button>
              </div>
              {negoNotes.length === 0 && !showAddNote ? (
                <p className="px-5 py-4 text-sm text-navy-300">No notes yet — record negotiation insights for future deals</p>
              ) : (
                <div className="divide-y divide-sand-50 max-h-60 overflow-y-auto">
                  {negoNotes.map(n => (
                    <div key={n.id} className="px-5 py-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${NOTE_TYPE_COLORS[n.note_type] || NOTE_TYPE_COLORS.general}`}>{NOTE_TYPE_LABELS[n.note_type] || n.note_type}</span>
                          {n.deal && n.deal.id !== id && <span className="text-xs text-navy-300">from {n.deal.title}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-navy-200">{new Date(n.created_at).toLocaleDateString()}</span>
                          <button onClick={() => deleteNoteMutation.mutate(n.id)} className="text-navy-200 hover:text-red-500 text-xs">✕</button>
                        </div>
                      </div>
                      <p className="text-sm text-navy-600 mt-1.5">{n.content}</p>
                    </div>
                  ))}
                </div>
              )}
              {showAddNote && (
                <div className="px-5 py-3 bg-sand-50 border-t border-sand-100 space-y-2">
                  <select value={newNote.note_type} onChange={e => setNewNote(f => ({ ...f, note_type: e.target.value }))} className="border border-sand-200 rounded px-2 py-1 text-sm w-full">
                    {NOTE_TYPES.map(t => <option key={t} value={t}>{NOTE_TYPE_LABELS[t]}</option>)}
                  </select>
                  <textarea placeholder="What happened? Budget discussed, discounts offered..." value={newNote.content} onChange={e => setNewNote(f => ({ ...f, content: e.target.value }))} className="w-full border border-sand-200 rounded p-2 text-sm h-20 resize-none" />
                  <div className="flex gap-2">
                    <button onClick={() => setShowAddNote(false)} className="text-xs text-navy-400 hover:text-navy-800 px-2 py-1">Cancel</button>
                    <button onClick={() => addNoteMutation.mutate({ brand_id: deal.brand_id, deal_id: id, ...newNote })} disabled={!newNote.content} className="text-xs bg-teal-500 text-white px-3 py-1 rounded hover:bg-teal-600 disabled:opacity-50">Save Note</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right — AI panel */}
        <div className="w-80 shrink-0">
          <div className="bg-white border border-sand-200 rounded-lg shadow-sm sticky top-6">
            <div className="px-4 py-3 border-b border-sand-100 bg-navy-800 rounded-t-lg">
              <h2 className="text-sm font-medium text-white">🤖 AI Assistant</h2>
            </div>
            <div className="flex border-b border-sand-100">
              {[{ key: 'parse', label: 'Parse' }, { key: 'rate', label: 'Rate' }, { key: 'draft', label: 'Draft' }, { key: 'brief', label: 'Brief' }, { key: 'coach', label: 'Coach' }].map(tab => (
                <button key={tab.key} onClick={() => { setAiTab(tab.key); setAiResult(null) }}
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${aiTab === tab.key ? 'text-teal-600 border-b-2 border-teal-500' : 'text-navy-400 hover:text-navy-700'}`}>{tab.label}</button>
              ))}
            </div>
            <div className="p-4 space-y-3">
              {aiTab === 'parse' && <textarea value={emailText} onChange={e => setEmailText(e.target.value)} placeholder="Paste sponsorship email here..." className="w-full border border-sand-200 rounded p-2 text-xs h-28 resize-none focus:outline-none focus:ring-1 focus:ring-teal-500" />}
              {aiTab === 'draft' && (
                <div>
                  <label className="text-xs text-navy-500 block mb-1">I want to:</label>
                  <select value={draftAction} onChange={e => setDraftAction(e.target.value)} className="w-full border border-sand-200 rounded px-2 py-1.5 text-xs">
                    <option value="accept">Accept the deal</option>
                    <option value="negotiate">Counter-offer / negotiate</option>
                    <option value="request more details">Request more details</option>
                    <option value="decline politely">Decline politely</option>
                    <option value="follow up">Follow up</option>
                  </select>
                </div>
              )}
              {aiTab === 'rate' && <p className="text-xs text-navy-400">Analyzes deliverables and suggests a rate range.</p>}
              {aiTab === 'brief' && <p className="text-xs text-navy-400">Generates a content brief from this deal's deliverables, brand, and requirements.</p>}
              {aiTab === 'coach' && <p className="text-xs text-navy-400">AI negotiation coach using brand history{negoNotes.length > 0 ? ` & ${negoNotes.length} past notes` : ''}.</p>}

              <button onClick={runAI} disabled={aiLoading || (aiTab === 'parse' && !emailText)} className="w-full bg-teal-500 text-white text-xs py-2 rounded hover:bg-teal-600 disabled:opacity-50 transition-colors">
                {aiLoading ? '✨ Thinking...' : aiTab === 'parse' ? 'Parse Email' : aiTab === 'rate' ? 'Suggest Rate' : aiTab === 'draft' ? 'Draft Reply' : aiTab === 'brief' ? 'Generate Brief' : 'Get Coaching'}
              </button>

              {aiResult && (
                <div className="mt-3 border border-sand-200 rounded p-3 bg-sand-50 text-xs space-y-1.5 max-h-80 overflow-y-auto">
                  {aiResult.error ? <p className="text-red-600">{aiResult.error}</p>
                  : aiTab === 'parse' ? (
                    <>
                      <p className={`font-medium ${aiResult.is_sponsorship ? 'text-teal-600' : 'text-navy-400'}`}>{aiResult.is_sponsorship ? `✓ Sponsorship (${Math.round((aiResult.confidence || 0) * 100)}%)` : '✗ Not a sponsorship'}</p>
                      {aiResult.brand_name && <p><span className="text-navy-400">Brand:</span> {aiResult.brand_name}</p>}
                      {aiResult.budget_amount && <p><span className="text-navy-400">Budget:</span> ₹{aiResult.budget_amount?.toLocaleString()}</p>}
                      {aiResult.summary && <p className="text-navy-500 mt-1 pt-1 border-t border-sand-200">{aiResult.summary}</p>}
                    </>
                  ) : aiTab === 'rate' ? (
                    <>
                      <p className="font-medium text-navy-800">₹{aiResult.low_estimate?.toLocaleString()} – ₹{aiResult.high_estimate?.toLocaleString()}</p>
                      <p className="text-navy-400">Mid: ₹{aiResult.mid_estimate?.toLocaleString()}</p>
                      {aiResult.reasoning && <p className="text-navy-500 mt-1">{aiResult.reasoning}</p>}
                      {aiResult.negotiation_tips?.map((tip, i) => <p key={i} className="text-navy-400">• {tip}</p>)}
                    </>
                  ) : aiTab === 'draft' ? (
                    <p className="text-navy-700 whitespace-pre-wrap leading-relaxed">{aiResult.draft}</p>
                  ) : aiTab === 'brief' ? (
                    <>
                      <p className="font-semibold text-navy-800 text-sm">{aiResult.title}</p>
                      {aiResult.objective && <p className="text-navy-500 mt-1"><span className="font-medium text-navy-600">Objective:</span> {aiResult.objective}</p>}
                      {aiResult.key_messages && <div className="mt-2"><p className="font-medium text-navy-600 mb-1">Key Messages:</p>{aiResult.key_messages.map((m, i) => <p key={i} className="text-navy-500 ml-2">• {m}</p>)}</div>}
                      {aiResult.content_outline && <div className="mt-2"><p className="font-medium text-navy-600">Outline:</p><p className="text-navy-500 mt-0.5">{aiResult.content_outline}</p></div>}
                      {aiResult.dos && <div className="mt-2"><p className="font-medium text-green-600">✓ Do's:</p>{aiResult.dos.map((d, i) => <p key={i} className="text-navy-500 ml-2">• {d}</p>)}</div>}
                      {aiResult.donts && <div className="mt-2"><p className="font-medium text-red-600">✗ Don'ts:</p>{aiResult.donts.map((d, i) => <p key={i} className="text-navy-500 ml-2">• {d}</p>)}</div>}
                      {aiResult.hashtags && <div className="mt-2 flex flex-wrap gap-1">{aiResult.hashtags.map((h, i) => <span key={i} className="text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded text-xs">{h.startsWith('#') ? h : `#${h}`}</span>)}</div>}
                      {aiResult.estimated_production_time && <p className="mt-2 text-navy-400">⏱ {aiResult.estimated_production_time}</p>}
                    </>
                  ) : aiTab === 'coach' ? (
                    <>
                      {aiResult.recommended_rate && <p className="font-medium text-teal-700">💰 Recommended: {aiResult.recommended_rate}</p>}
                      {aiResult.strategy && <p className="text-navy-600 mt-1">{aiResult.strategy}</p>}
                      {aiResult.leverage_points && <div className="mt-2"><p className="font-medium text-green-600">Leverage:</p>{aiResult.leverage_points.map((p, i) => <p key={i} className="text-navy-500 ml-2">✓ {p}</p>)}</div>}
                      {aiResult.risk_flags && <div className="mt-2"><p className="font-medium text-red-600">Risks:</p>{aiResult.risk_flags.map((f, i) => <p key={i} className="text-navy-500 ml-2">⚠ {f}</p>)}</div>}
                      {aiResult.payment_terms_suggestion && <p className="mt-2 text-navy-500"><span className="font-medium text-navy-600">Payment:</span> {aiResult.payment_terms_suggestion}</p>}
                      {aiResult.walk_away_threshold && <p className="text-navy-500"><span className="font-medium text-navy-600">Walk-away:</span> {aiResult.walk_away_threshold}</p>}
                    </>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
