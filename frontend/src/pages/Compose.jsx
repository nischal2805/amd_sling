import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPosts, createPost, deletePost, publishPost, getBrands } from '../api/client'
import { useState } from 'react'

const PLATFORMS = ['youtube', 'instagram', 'linkedin', 'twitter']
const STATUS_COLORS = { draft: 'bg-sand-100 text-navy-600', scheduled: 'bg-teal-100 text-teal-700', publishing: 'bg-amber-900/40 text-amber-400', published: 'bg-cyan-50 text-cyan-600', failed: 'bg-red-900/40 text-red-400' }

export default function Compose() {
  const qc = useQueryClient()
  const [selPlatforms, setSelPlatforms] = useState([])
  const [form, setForm] = useState({ title: '', body: '', media_url: '', media_type: 'text', scheduled_at: '', youtube_title: '', youtube_description: '', instagram_caption: '', linkedin_text: '', twitter_text: '' })
  const [saved, setSaved] = useState(null)

  const { data: posts = [] } = useQuery({ queryKey: ['posts'], queryFn: () => getPosts() })
  const { data: brands = [] } = useQuery({ queryKey: ['brands'], queryFn: () => getBrands() })

  const createMutation = useMutation({
    mutationFn: (data) => createPost(data),
    onSuccess: (post) => { qc.invalidateQueries({ queryKey: ['posts'] }); setSaved(post); resetForm() }
  })

  const publishMutation = useMutation({
    mutationFn: publishPost,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] })
  })

  const deleteMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] })
  })

  function resetForm() {
    setForm({ title: '', body: '', media_url: '', media_type: 'text', scheduled_at: '', youtube_title: '', youtube_description: '', instagram_caption: '', linkedin_text: '', twitter_text: '' })
    setSelPlatforms([])
  }

  function togglePlatform(p) {
    setSelPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  function save(draft = true) {
    createMutation.mutate({ ...form, platforms: selPlatforms, scheduled_at: draft ? null : form.scheduled_at || null })
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-navy-900">Compose</h1>
        <p className="text-sm text-navy-400 mt-0.5">Write and publish content across platforms</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Compose form */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-sand-100 border border-sand-200 rounded-lg shadow-sm p-5 space-y-3">
            <div>
              <label className="text-sm text-navy-600 block mb-1">Title</label>
              <input value={form.title} onChange={set('title')} className="w-full border border-navy-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-sand-50 text-sand-600" placeholder="Post title" />
            </div>
            <div>
              <label className="text-sm text-navy-600 block mb-1">Body / Caption</label>
              <textarea value={form.body} onChange={set('body')} rows={5} className="w-full border border-navy-200 rounded px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-sand-50 text-sand-600" placeholder="Write your content here..." />
            </div>
            <div>
              <label className="text-sm text-navy-600 block mb-1">Media URL</label>
              <input value={form.media_url} onChange={set('media_url')} className="w-full border border-navy-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-sand-50 text-sand-600" placeholder="https://..." />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-sm text-navy-600 block mb-1">Media type</label>
                <select value={form.media_type} onChange={set('media_type')} className="w-full border border-navy-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-sand-50 text-sand-600">
                  <option value="text">Text only</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-sm text-navy-600 block mb-1">Schedule for</label>
                <input type="datetime-local" value={form.scheduled_at} onChange={set('scheduled_at')} className="w-full border border-navy-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-sand-50 text-sand-600" />
              </div>
            </div>
          </div>

          {/* Platform overrides */}
          {selPlatforms.includes('youtube') && (
            <div className="bg-sand-100 border border-sand-200 rounded-lg shadow-sm p-4 space-y-2">
              <h3 className="text-sm font-medium text-navy-900">YouTube overrides</h3>
              <input value={form.youtube_title} onChange={set('youtube_title')} placeholder="YouTube title" className="w-full border border-navy-200 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-sand-50 text-sand-600" />
              <textarea value={form.youtube_description} onChange={set('youtube_description')} placeholder="YouTube description" rows={3} className="w-full border border-navy-200 rounded px-3 py-1.5 text-sm resize-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-sand-50 text-sand-600" />
            </div>
          )}
          {selPlatforms.includes('instagram') && (
            <div className="bg-sand-100 border border-sand-200 rounded-lg shadow-sm p-4 space-y-2">
              <h3 className="text-sm font-medium text-navy-900">Instagram overrides</h3>
              <textarea value={form.instagram_caption} onChange={set('instagram_caption')} placeholder="Instagram caption" rows={3} className="w-full border border-navy-200 rounded px-3 py-1.5 text-sm resize-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-sand-50 text-sand-600" />
            </div>
          )}
          {selPlatforms.includes('twitter') && (
            <div className="bg-sand-100 border border-sand-200 rounded-lg shadow-sm p-4 space-y-2">
              <h3 className="text-sm font-medium text-navy-900">Twitter/X overrides</h3>
              <textarea value={form.twitter_text} onChange={set('twitter_text')} placeholder="Tweet (280 chars)" maxLength={280} rows={2} className="w-full border border-navy-200 rounded px-3 py-1.5 text-sm resize-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-sand-50 text-sand-600" />
              <p className="text-xs text-navy-300 text-right">{form.twitter_text.length}/280</p>
            </div>
          )}
          {selPlatforms.includes('linkedin') && (
            <div className="bg-sand-100 border border-sand-200 rounded-lg shadow-sm p-4 space-y-2">
              <h3 className="text-sm font-medium text-navy-900">LinkedIn overrides</h3>
              <textarea value={form.linkedin_text} onChange={set('linkedin_text')} placeholder="LinkedIn post text" rows={3} className="w-full border border-navy-200 rounded px-3 py-1.5 text-sm resize-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-sand-50 text-sand-600" />
            </div>
          )}

          {saved && <p className="text-sm text-teal-700 bg-teal-50 rounded px-3 py-2">Post saved as {saved.status}</p>}
          {createMutation.error && <p className="text-sm text-red-400">{createMutation.error.response?.data?.error}</p>}
        </div>

        {/* Right panel: platforms + actions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-sand-100 border border-sand-200 rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-medium text-navy-900 mb-3">Publish to</h3>
            <div className="space-y-2">
              {PLATFORMS.map(p => (
                <label key={p} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selPlatforms.includes(p)}
                    onChange={() => togglePlatform(p)}
                    className="rounded text-teal-500 focus:ring-teal-500"
                  />
                  <span className="text-sm text-navy-600 capitalize">{p}</span>
                </label>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => save(true)}
                disabled={createMutation.isPending}
                className="w-full border border-navy-200 text-navy-600 py-2 rounded text-sm hover:bg-sand-50 disabled:opacity-50"
              >
                Save as draft
              </button>
              <button
                onClick={() => save(false)}
                disabled={createMutation.isPending || selPlatforms.length === 0}
                className="w-full bg-teal-500 text-white py-2 rounded text-sm hover:bg-teal-600 disabled:opacity-50"
              >
                {form.scheduled_at ? 'Schedule' : 'Schedule / Save'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent posts */}
      <div className="mt-6 bg-sand-100 border border-sand-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-sand-200">
          <h2 className="text-sm font-medium text-navy-900">Recent posts</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-navy-400 border-b border-sand-100 bg-sand-50">
              <th className="px-5 py-2.5 font-medium">Title</th>
              <th className="px-4 py-2.5 font-medium">Platforms</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Scheduled</th>
              <th className="px-4 py-2.5 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-50">
            {posts.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-navy-300">No posts yet</td></tr>
            ) : posts.map(post => (
              <tr key={post.id} className="hover:bg-sand-50">
                <td className="px-5 py-3 text-sm text-navy-900">{post.title || post.body?.slice(0,40) || '—'}</td>
                <td className="px-4 py-3 text-xs text-navy-400">{(post.platforms || []).map(p => p.platform).join(', ') || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[post.status]}`}>{post.status}</span>
                </td>
                <td className="px-4 py-3 text-xs text-navy-300">{post.scheduled_at ? new Date(post.scheduled_at).toLocaleString() : '—'}</td>
                <td className="px-4 py-3 flex items-center gap-2">
                  {['draft','scheduled'].includes(post.status) && (
                    <button onClick={() => publishMutation.mutate(post.id)} className="text-xs text-teal-600 hover:underline">Publish now</button>
                  )}
                  <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(post.id) }} className="text-xs text-navy-300 hover:text-red-400">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
