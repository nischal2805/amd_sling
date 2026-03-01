import { useState, useEffect } from 'react'
import { getTickets, getTicketsDashboard, createTicket, updateTicketStatus, deleteTicket, getTeam } from '../api/client'

const STATUSES = ['todo', 'in_progress', 'review', 'done']
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' }
const STATUS_COLORS = {
    todo: 'bg-sand-100 text-navy-600 border-sand-200',
    in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
    review: 'bg-amber-100 text-amber-700 border-amber-200',
    done: 'bg-emerald-100 text-emerald-700 border-emerald-200'
}
const PRIORITY_COLORS = {
    low: 'bg-sand-50 text-navy-500',
    medium: 'bg-blue-50 text-blue-600',
    high: 'bg-orange-50 text-orange-600',
    urgent: 'bg-red-100 text-red-700'
}

export default function Tickets() {
    const [tickets, setTickets] = useState([])
    const [dashboard, setDashboard] = useState(null)
    const [team, setTeam] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ title: '', description: '', category: '', priority: 'medium', assigned_to: '', due_date: '' })
    const [error, setError] = useState('')
    const [filter, setFilter] = useState({ assigned_to: '', priority: '', category: '' })

    useEffect(() => { load() }, [])

    async function load() {
        try {
            const [t, d, m] = await Promise.all([getTickets(), getTicketsDashboard(), getTeam()])
            setTickets(t)
            setDashboard(d)
            setTeam(m.filter(x => x.status === 'active'))
        } catch { }
        finally { setLoading(false) }
    }

    async function handleCreate(e) {
        e.preventDefault()
        if (!form.title.trim()) return setError('Title is required')
        setError('')
        try {
            await createTicket({
                ...form,
                assigned_to: form.assigned_to || null,
                due_date: form.due_date || null
            })
            setForm({ title: '', description: '', category: '', priority: 'medium', assigned_to: '', due_date: '' })
            setShowForm(false)
            load()
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create ticket')
        }
    }

    async function moveStatus(id, newStatus) {
        try { await updateTicketStatus(id, newStatus); load() } catch { }
    }

    async function handleDelete(id) {
        if (!confirm('Delete this ticket?')) return
        try { await deleteTicket(id); load() } catch { }
    }

    // Filter tickets
    const filtered = tickets.filter(t => {
        if (filter.assigned_to && t.assigned_to !== filter.assigned_to) return false
        if (filter.priority && t.priority !== filter.priority) return false
        if (filter.category && t.category !== filter.category) return false
        return true
    })

    const byStatus = {}
    STATUSES.forEach(s => { byStatus[s] = filtered.filter(t => t.status === s) })

    const categories = [...new Set(tickets.map(t => t.category).filter(Boolean))]

    return (
        <div className="p-6 max-w-full mx-auto space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-navy-900">Tickets</h1>
                    <p className="text-sm text-navy-500 mt-0.5">Manage and track work assignments</p>
                </div>
                <button onClick={() => setShowForm(true)}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
                    + New Ticket
                </button>
            </div>

            {/* Dashboard Stats */}
            {dashboard && (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <StatCard label="Total" value={dashboard.total_tickets} color="bg-white" />
                        <StatCard label="To Do" value={dashboard.by_status.todo} color="bg-sand-50" />
                        <StatCard label="In Progress" value={dashboard.by_status.in_progress} color="bg-blue-50" />
                        <StatCard label="Done" value={dashboard.by_status.done} color="bg-emerald-50" />
                    </div>

                    {/* Workload per member */}
                    {dashboard.by_member.length > 0 && (
                        <div className="bg-white rounded-xl border border-sand-200 p-4">
                            <h3 className="text-sm font-semibold text-navy-700 mb-3">Team Workload</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {dashboard.by_member.map((m, i) => (
                                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-sand-50">
                                        <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                            {m.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-navy-700 truncate">{m.name}</p>
                                            <div className="flex gap-1.5 mt-0.5">
                                                {m.todo > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-sand-100 text-navy-500">{m.todo} todo</span>}
                                                {m.in_progress > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-600">{m.in_progress} active</span>}
                                                {m.review > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-600">{m.review} review</span>}
                                                {m.done > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-600">{m.done} done</span>}
                                            </div>
                                        </div>
                                        <span className="text-sm font-semibold text-navy-600">{m.total}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Create Ticket Form */}
            {showForm && (
                <form onSubmit={handleCreate} className="bg-white rounded-xl border border-sand-200 p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-navy-700">New Ticket</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-navy-600 mb-1">Title *</label>
                            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="e.g. Edit episode 45 video" className="w-full px-3 py-2 border border-sand-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-navy-600 mb-1">Description</label>
                            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                rows={2} placeholder="Details about the work..."
                                className="w-full px-3 py-2 border border-sand-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-navy-600 mb-1">Category</label>
                            <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                placeholder="e.g. Editing, Thumbnail, Script"
                                list="cat-suggestions"
                                className="w-full px-3 py-2 border border-sand-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                            <datalist id="cat-suggestions">
                                <option value="Editing" />
                                <option value="Thumbnail" />
                                <option value="Script" />
                                <option value="Caption" />
                                <option value="Graphic Design" />
                                <option value="Research" />
                                <option value="Review" />
                            </datalist>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-navy-600 mb-1">Priority</label>
                            <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                                className="w-full px-3 py-2 border border-sand-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white">
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-navy-600 mb-1">Assign To</label>
                            <select value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
                                className="w-full px-3 py-2 border border-sand-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white">
                                <option value="">Unassigned</option>
                                {team.map(m => <option key={m.id} value={m.id}>{m.name} ({m.role})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-navy-600 mb-1">Due Date</label>
                            <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                                className="w-full px-3 py-2 border border-sand-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                        </div>
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div className="flex gap-2">
                        <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
                            Create Ticket
                        </button>
                        <button type="button" onClick={() => setShowForm(false)}
                            className="px-4 py-2 bg-sand-100 text-navy-600 rounded-lg text-sm hover:bg-sand-200 transition-colors">
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* Filter Bar */}
            <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-navy-500">Filter:</span>
                <select value={filter.assigned_to} onChange={e => setFilter(f => ({ ...f, assigned_to: e.target.value }))}
                    className="text-xs px-2 py-1 border border-sand-300 rounded-md bg-white focus:outline-none">
                    <option value="">All Members</option>
                    {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <select value={filter.priority} onChange={e => setFilter(f => ({ ...f, priority: e.target.value }))}
                    className="text-xs px-2 py-1 border border-sand-300 rounded-md bg-white focus:outline-none">
                    <option value="">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>
                {categories.length > 0 && (
                    <select value={filter.category} onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}
                        className="text-xs px-2 py-1 border border-sand-300 rounded-md bg-white focus:outline-none">
                        <option value="">All Categories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                )}
                {(filter.assigned_to || filter.priority || filter.category) && (
                    <button onClick={() => setFilter({ assigned_to: '', priority: '', category: '' })}
                        className="text-xs text-red-500 hover:text-red-700">✕ Clear</button>
                )}
            </div>

            {/* Kanban Board */}
            {loading ? (
                <p className="text-sm text-navy-400">Loading tickets...</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {STATUSES.map(status => (
                        <div key={status} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className={`text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded ${STATUS_COLORS[status]}`}>
                                    {STATUS_LABELS[status]}
                                </h3>
                                <span className="text-xs text-navy-400">{byStatus[status].length}</span>
                            </div>
                            <div className="space-y-2 min-h-[100px]">
                                {byStatus[status].map(ticket => (
                                    <TicketCard key={ticket.id} ticket={ticket} statuses={STATUSES} moveStatus={moveStatus} onDelete={handleDelete} />
                                ))}
                                {byStatus[status].length === 0 && (
                                    <div className="border border-dashed border-sand-300 rounded-lg p-4 text-center">
                                        <p className="text-xs text-navy-300">No tickets</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function StatCard({ label, value, color }) {
    return (
        <div className={`${color} rounded-xl border border-sand-200 p-3`}>
            <p className="text-[11px] uppercase tracking-wide text-navy-400">{label}</p>
            <p className="text-xl font-bold text-navy-800 mt-0.5">{value}</p>
        </div>
    )
}

function TicketCard({ ticket, statuses, moveStatus, onDelete }) {
    const t = ticket
    const isOverdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done'
    const currentIdx = statuses.indexOf(t.status)

    return (
        <div className={`bg-white rounded-lg border ${isOverdue ? 'border-red-300' : 'border-sand-200'} p-3 space-y-2 group`}>
            <div className="flex items-start justify-between gap-1">
                <h4 className="text-sm font-medium text-navy-800 leading-snug">{t.title}</h4>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 font-medium ${PRIORITY_COLORS[t.priority]}`}>
                    {t.priority}
                </span>
            </div>
            {t.description && <p className="text-xs text-navy-500 line-clamp-2">{t.description}</p>}
            <div className="flex items-center gap-1.5 flex-wrap">
                {t.category && t.category !== 'General' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-600">{t.category}</span>
                )}
                {t.assignee && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-50 text-teal-700">👤 {t.assignee.name}</span>
                )}
                {t.due_date && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-sand-50 text-navy-500'}`}>
                        📅 {t.due_date}
                    </span>
                )}
            </div>
            {/* Status controls */}
            <div className="flex items-center gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {currentIdx > 0 && (
                    <button onClick={() => moveStatus(t.id, statuses[currentIdx - 1])}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-sand-100 text-navy-500 hover:bg-sand-200">
                        ← {STATUS_LABELS[statuses[currentIdx - 1]]}
                    </button>
                )}
                {currentIdx < statuses.length - 1 && (
                    <button onClick={() => moveStatus(t.id, statuses[currentIdx + 1])}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 hover:bg-teal-100">
                        {STATUS_LABELS[statuses[currentIdx + 1]]} →
                    </button>
                )}
                <button onClick={() => onDelete(t.id)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-500 hover:bg-red-100 ml-auto">✕</button>
            </div>
        </div>
    )
}
