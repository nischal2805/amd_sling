import { useState, useEffect } from 'react'
import { getTeam, createTeamMember, updateTeamMember, deleteTeamMember } from '../api/client'

const ROLE_COLORS = {
    Editor: 'bg-blue-100 text-blue-700 border-blue-200',
    'Thumbnail Designer': 'bg-pink-100 text-pink-700 border-pink-200',
    'Content Writer': 'bg-amber-100 text-amber-700 border-amber-200',
    Scriptwriter: 'bg-violet-100 text-violet-700 border-violet-200',
    Manager: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Video Editor': 'bg-cyan-100 text-cyan-700 border-cyan-200',
}

function roleColor(role) {
    return ROLE_COLORS[role] || 'bg-sand-100 text-navy-600 border-sand-200'
}

export default function Team() {
    const [members, setMembers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ name: '', email: '', role: '' })
    const [editId, setEditId] = useState(null)
    const [error, setError] = useState('')

    useEffect(() => { load() }, [])

    async function load() {
        try {
            const data = await getTeam()
            setMembers(data)
        } catch { setError('Failed to load team') }
        finally { setLoading(false) }
    }

    async function handleSubmit(e) {
        e.preventDefault()
        if (!form.name.trim()) return setError('Name is required')
        setError('')
        try {
            if (editId) {
                await updateTeamMember(editId, form)
            } else {
                await createTeamMember(form)
            }
            setForm({ name: '', email: '', role: '' })
            setEditId(null)
            setShowForm(false)
            load()
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save')
        }
    }

    function startEdit(m) {
        setForm({ name: m.name, email: m.email || '', role: m.role })
        setEditId(m.id)
        setShowForm(true)
    }

    async function handleDelete(id) {
        if (!confirm('Remove this team member?')) return
        try { await deleteTeamMember(id); load() } catch { }
    }

    async function toggleStatus(m) {
        await updateTeamMember(m.id, { status: m.status === 'active' ? 'inactive' : 'active' })
        load()
    }

    // Role stats
    const roleGroups = {}
    members.forEach(m => {
        if (!roleGroups[m.role]) roleGroups[m.role] = 0
        roleGroups[m.role]++
    })

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-navy-900">Team</h1>
                    <p className="text-sm text-navy-500 mt-0.5">{members.length} member{members.length !== 1 ? 's' : ''}</p>
                </div>
                <button onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', email: '', role: '' }) }}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
                    + Add Member
                </button>
            </div>

            {/* Role summary */}
            {Object.keys(roleGroups).length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {Object.entries(roleGroups).map(([role, count]) => (
                        <span key={role} className={`text-xs px-2.5 py-1 rounded-full border ${roleColor(role)}`}>
                            {role}: {count}
                        </span>
                    ))}
                </div>
            )}

            {/* Add/Edit Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-sand-200 p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-navy-700">{editId ? 'Edit Member' : 'Add Team Member'}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-navy-600 mb-1">Name *</label>
                            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="John Doe" className="w-full px-3 py-2 border border-sand-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-navy-600 mb-1">Email</label>
                            <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                placeholder="john@example.com" className="w-full px-3 py-2 border border-sand-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-navy-600 mb-1">Role / Designation *</label>
                            <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                                placeholder="e.g. Editor, Thumbnail Designer"
                                list="role-suggestions"
                                className="w-full px-3 py-2 border border-sand-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                            <datalist id="role-suggestions">
                                <option value="Editor" />
                                <option value="Video Editor" />
                                <option value="Thumbnail Designer" />
                                <option value="Content Writer" />
                                <option value="Scriptwriter" />
                                <option value="Manager" />
                                <option value="Social Media Manager" />
                                <option value="Graphic Designer" />
                            </datalist>
                        </div>
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div className="flex gap-2">
                        <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
                            {editId ? 'Save Changes' : 'Add Member'}
                        </button>
                        <button type="button" onClick={() => { setShowForm(false); setEditId(null) }}
                            className="px-4 py-2 bg-sand-100 text-navy-600 rounded-lg text-sm hover:bg-sand-200 transition-colors">
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* Team List */}
            {loading ? (
                <p className="text-sm text-navy-400">Loading team...</p>
            ) : members.length === 0 ? (
                <div className="bg-white rounded-xl border border-sand-200 p-8 text-center">
                    <p className="text-navy-500 text-sm">No team members yet. Add your first team member to start assigning work!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {members.map(m => (
                        <div key={m.id} className={`bg-white rounded-xl border border-sand-200 p-4 transition-all ${m.status === 'inactive' ? 'opacity-50' : ''}`}>
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-semibold">
                                        {m.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-navy-800">{m.name}</h3>
                                        {m.email && <p className="text-[11px] text-navy-400">{m.email}</p>}
                                    </div>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${roleColor(m.role)}`}>
                                    {m.role}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-3">
                                <button onClick={() => startEdit(m)}
                                    className="text-xs px-2 py-1 rounded bg-sand-100 text-navy-500 hover:bg-sand-200 transition-colors">
                                    Edit
                                </button>
                                <button onClick={() => toggleStatus(m)}
                                    className="text-xs px-2 py-1 rounded bg-sand-100 text-navy-500 hover:bg-sand-200 transition-colors">
                                    {m.status === 'active' ? 'Deactivate' : 'Activate'}
                                </button>
                                <button onClick={() => handleDelete(m.id)}
                                    className="text-xs px-2 py-1 rounded bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
