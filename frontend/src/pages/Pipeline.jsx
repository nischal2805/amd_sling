import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDeals, getBrands, createDeal, moveDealStage } from '../api/client'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

const STAGES = [
  { key: 'inbound', label: 'Inbound' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'negotiation', label: 'Negotiation' },
  { key: 'contract_sent', label: 'Contract Sent' },
  { key: 'in_production', label: 'In Production' },
  { key: 'client_review', label: 'Review' },
  { key: 'posted', label: 'Posted' },
  { key: 'invoice_sent', label: 'Invoice Sent' },
  { key: 'paid', label: 'Paid' },
]

function fmt(n) { return `₹${(Number(n) || 0).toLocaleString()}` }

function NewDealModal({ onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ title: '', brand_name: '', total_value: '', stage: 'inbound' })
  const mutation = useMutation({
    mutationFn: createDeal,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['deals'] }); onClose() }
  })
  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  return (
    <div className="fixed inset-0 bg-navy-900/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md border border-sand-200">
        <h2 className="text-base font-semibold text-navy-800 mb-4">New Deal</h2>
        <form onSubmit={e => { e.preventDefault(); mutation.mutate(form) }} className="space-y-3">
          <div>
            <label className="block text-sm text-navy-700 mb-1">Title *</label>
            <input value={form.title} onChange={set('title')} required className="w-full border border-sand-200 rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500" />
          </div>
          <div>
            <label className="block text-sm text-navy-700 mb-1">Brand</label>
            <input value={form.brand_name} onChange={set('brand_name')} placeholder="Enter brand name" className="w-full border border-sand-200 rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500" />
          </div>
          <div>
            <label className="block text-sm text-navy-700 mb-1">Value (₹)</label>
            <input type="number" value={form.total_value} onChange={set('total_value')} className="w-full border border-sand-200 rounded px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-navy-700 mb-1">Stage</label>
            <select value={form.stage} onChange={set('stage')} className="w-full border border-sand-200 rounded px-3 py-1.5 text-sm">
              {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          {mutation.error && <p className="text-red-600 text-sm">{mutation.error.response?.data?.error || 'Error'}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-sand-200 text-navy-600 py-1.5 rounded text-sm hover:bg-sand-50">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 bg-teal-500 text-white py-1.5 rounded text-sm hover:bg-teal-600 disabled:opacity-50">
              {mutation.isPending ? 'Creating...' : 'Create Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Pipeline() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [showNew, setShowNew] = useState(false)
  const [brandFilter, setBrandFilter] = useState('')

  const { data: deals = [], isLoading } = useQuery({ queryKey: ['deals'], queryFn: () => getDeals() })
  const { data: brands = [] } = useQuery({ queryKey: ['brands'], queryFn: getBrands })

  const stageMutation = useMutation({
    mutationFn: ({ id, stage }) => moveDealStage(id, stage),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deals'] })
  })

  const filtered = brandFilter ? deals.filter(d => d.brand_id === brandFilter) : deals
  const byStage = Object.fromEntries(STAGES.map(s => [s.key, filtered.filter(d => d.stage === s.key)]))

  function onDragEnd(result) {
    if (!result.destination) return
    const { draggableId, destination } = result
    const newStage = destination.droppableId
    stageMutation.mutate({ id: draggableId, stage: newStage })
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-navy-800">Pipeline</h1>
          <p className="text-sm text-navy-400 mt-0.5">{deals.length} total deals</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={brandFilter}
            onChange={e => setBrandFilter(e.target.value)}
            className="border border-sand-200 rounded px-3 py-1.5 text-sm text-navy-700"
          >
            <option value="">All brands</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <button
            onClick={() => setShowNew(true)}
            className="bg-teal-500 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-teal-600"
          >
            + New Deal
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.slice(0, 5).map(s => (
            <div key={s.key} className="w-56 shrink-0 bg-sand-100 rounded-lg h-40 animate-pulse" />
          ))}
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-4">
            {STAGES.map(stage => (
              <div key={stage.key} className="w-56 shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-navy-600 uppercase tracking-wide">{stage.label}</span>
                  <span className="text-xs text-navy-400 bg-sand-100 rounded-full px-1.5 py-0.5">{byStage[stage.key]?.length || 0}</span>
                </div>
                <Droppable droppableId={stage.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-20 rounded-lg p-1.5 space-y-2 transition-colors ${snapshot.isDraggingOver ? 'bg-cyan-50 border border-teal-300' : 'bg-sand-50 border border-sand-200'}`}
                    >
                      {byStage[stage.key]?.map((deal, index) => (
                        <Draggable key={deal.id} draggableId={deal.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => navigate(`/deals/${deal.id}`)}
                              className={`bg-white border border-sand-200 rounded-md p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${snapshot.isDragging ? 'shadow-lg rotate-1 border-teal-400' : ''}`}
                            >
                              <p className="text-sm font-medium text-navy-800 line-clamp-2">{deal.title}</p>
                              {deal.brand && <p className="text-xs text-navy-400 mt-1">{deal.brand.name}</p>}
                              {deal.total_value && (
                                <p className="text-sm font-semibold text-teal-600 mt-2">{fmt(deal.total_value)}</p>
                              )}
                              {deal.posting_deadline && (
                                <p className="text-xs text-navy-300 mt-1">
                                  Due {new Date(deal.posting_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}

      {showNew && <NewDealModal onClose={() => setShowNew(false)} />}
    </div>
  )
}
