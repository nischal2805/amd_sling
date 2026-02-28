import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCalendar, publishPost, deletePost } from '../api/client'
import { useState } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, isSameMonth, addMonths, subMonths, parseISO } from 'date-fns'

const STATUS_COLORS = {
  draft: 'bg-sand-100 text-navy-600 border-sand-300',
  scheduled: 'bg-teal-50 text-teal-700 border-teal-200',
  publishing: 'bg-amber-50 text-amber-700 border-amber-200',
  published: 'bg-cyan-50 text-cyan-600 border-cyan-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
}

function buildCalendarDays(month) {
  const start = startOfWeek(startOfMonth(month))
  const end = endOfWeek(endOfMonth(month))
  const days = []
  let d = start
  while (d <= end) { days.push(d); d = addDays(d, 1) }
  return days
}

export default function Calendar() {
  const qc = useQueryClient()
  const [month, setMonth] = useState(new Date())
  const [selected, setSelected] = useState(null)

  const { data: posts = [] } = useQuery({
    queryKey: ['calendar'],
    queryFn: () => getCalendar()
  })

  const publishMutation = useMutation({
    mutationFn: publishPost,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar'] })
  })

  const deleteMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['calendar'] }); setSelected(null) }
  })

  const days = buildCalendarDays(month)

  function getPostsForDay(day) {
    return posts.filter(p => p.scheduled_at && isSameDay(parseISO(p.scheduled_at), day))
  }

  const selectedDayPosts = selected ? getPostsForDay(selected) : []

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-navy-800">Content Calendar</h1>
          <p className="text-sm text-navy-400 mt-0.5">Scheduled and published posts</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMonth(m => subMonths(m, 1))} className="p-1.5 border border-sand-200 rounded hover:bg-sand-50 text-navy-400">&#8249;</button>
          <span className="text-sm font-medium text-navy-600 min-w-[120px] text-center">{format(month, 'MMMM yyyy')}</span>
          <button onClick={() => setMonth(m => addMonths(m, 1))} className="p-1.5 border border-sand-200 rounded hover:bg-sand-50 text-navy-400">&#8250;</button>
          <button onClick={() => setMonth(new Date())} className="ml-2 text-xs text-teal-600 hover:underline">Today</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar grid */}
        <div className="lg:col-span-2 bg-white border border-sand-200 rounded-lg shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-sand-100">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="text-center text-xs text-navy-400 py-2 font-medium">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day, i) => {
              const dayPosts = getPostsForDay(day)
              const isCurrentMonth = isSameMonth(day, month)
              const isToday = isSameDay(day, new Date())
              const isSelected = selected && isSameDay(day, selected)

              return (
                <div
                  key={i}
                  onClick={() => setSelected(isSelected ? null : day)}
                  className={`min-h-[80px] border-b border-r border-sand-100 p-1.5 cursor-pointer transition-colors ${
                    isSelected ? 'bg-cyan-50' : isToday ? 'bg-sand-50' : 'hover:bg-sand-50'
                  }`}
                >
                  <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-teal-500 text-white' : isCurrentMonth ? 'text-navy-600' : 'text-navy-200'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {dayPosts.slice(0, 3).map(post => (
                      <div key={post.id} className={`text-xs px-1 py-0.5 rounded border truncate ${STATUS_COLORS[post.status] || 'bg-sand-100 text-navy-600 border-sand-300'}`}>
                        {post.title || post.body?.slice(0, 20) || 'Untitled'}
                      </div>
                    ))}
                    {dayPosts.length > 3 && <div className="text-xs text-navy-300 pl-1">+{dayPosts.length - 3} more</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-3">
          {selected ? (
            <div className="bg-white border border-sand-200 rounded-lg shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-sand-100 bg-sand-50">
                <h3 className="text-sm font-medium text-navy-800">{format(selected, 'EEEE, MMMM d')}</h3>
                <p className="text-xs text-navy-300">{selectedDayPosts.length} post{selectedDayPosts.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="divide-y divide-sand-50">
                {selectedDayPosts.length === 0 ? (
                  <div className="px-4 py-5 text-sm text-navy-300 text-center">No posts</div>
                ) : selectedDayPosts.map(post => (
                  <div key={post.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-navy-800 font-medium truncate">{post.title || 'Untitled'}</p>
                        {post.body && <p className="text-xs text-navy-400 mt-0.5 line-clamp-2">{post.body.slice(0, 80)}</p>}
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            { draft: 'bg-sand-100 text-navy-600', scheduled: 'bg-teal-100 text-teal-700', publishing: 'bg-amber-100 text-amber-700', published: 'bg-cyan-100 text-cyan-600', failed: 'bg-red-100 text-red-700' }[post.status]
                          }`}>{post.status}</span>
                          {post.platforms && post.platforms.length > 0 && (
                            <span className="text-xs text-navy-300">{post.platforms.map(p => p.platform).join(', ')}</span>
                          )}
                        </div>
                        {post.scheduled_at && <p className="text-xs text-navy-300 mt-1">{format(parseISO(post.scheduled_at), 'h:mm a')}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      {['draft', 'scheduled'].includes(post.status) && (
                        <button
                          onClick={() => publishMutation.mutate(post.id)}
                          disabled={publishMutation.isPending}
                          className="text-xs text-teal-600 hover:underline disabled:opacity-50"
                        >Publish now</button>
                      )}
                      <button
                        onClick={() => { if (confirm('Delete this post?')) deleteMutation.mutate(post.id) }}
                        className="text-xs text-navy-300 hover:text-red-500"
                      >Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-sand-200 rounded-lg shadow-sm p-4">
              <p className="text-sm text-navy-300">Click a day to see posts</p>
            </div>
          )}

          {/* Legend */}
          <div className="bg-white border border-sand-200 rounded-lg shadow-sm p-4">
            <h4 className="text-xs font-medium text-navy-400 uppercase mb-2">Legend</h4>
            <div className="space-y-1.5">
              {Object.entries({ draft: 'Draft', scheduled: 'Scheduled', publishing: 'Publishing', published: 'Published', failed: 'Failed' }).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-sm border ${STATUS_COLORS[k]}`}></span>
                  <span className="text-xs text-navy-500">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming */}
          <div className="bg-white border border-sand-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-sand-100 bg-sand-50">
              <h4 className="text-sm font-medium text-navy-800">Upcoming</h4>
            </div>
            <div className="divide-y divide-sand-50 max-h-60 overflow-y-auto">
              {posts.filter(p => p.scheduled_at && new Date(p.scheduled_at) >= new Date() && p.status === 'scheduled')
                .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
                .slice(0, 8)
                .map(post => (
                  <div key={post.id} className="px-4 py-2.5">
                    <p className="text-xs font-medium text-navy-700 truncate">{post.title || 'Untitled'}</p>
                    <p className="text-xs text-navy-300 mt-0.5">{format(parseISO(post.scheduled_at), 'MMM d, h:mm a')}</p>
                  </div>
                ))}
              {posts.filter(p => p.scheduled_at && new Date(p.scheduled_at) >= new Date() && p.status === 'scheduled').length === 0 && (
                <div className="px-4 py-4 text-xs text-navy-300 text-center">No upcoming scheduled posts</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
