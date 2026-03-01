import { useState } from 'react'
import { creatorAnalysis } from '../api/client'

export default function CreatorAI() {
    const [form, setForm] = useState({ video_title: '', video_description: '', platform: 'YouTube', profile_url: '' })
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [copied, setCopied] = useState('')

    async function handleGenerate(e) {
        e.preventDefault()
        if (!form.video_title.trim()) return setError('Video title is required')
        setError('')
        setLoading(true)
        setResult(null)
        try {
            const data = await creatorAnalysis(form)
            if (data.error) setError('AI returned an unparseable response. Try again.')
            else setResult(data)
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to generate. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    function copy(text, label) {
        navigator.clipboard.writeText(text)
        setCopied(label)
        setTimeout(() => setCopied(''), 2000)
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-navy-900">Creator AI</h1>
                <p className="text-sm text-navy-500 mt-1">
                    Paste your YouTube or Instagram profile — AI analyzes your last 3 videos and generates a personalized script, captions & hashtags
                </p>
            </div>

            {/* Input Form */}
            <form onSubmit={handleGenerate} className="bg-sand-100 rounded-xl border border-sand-200 p-6 space-y-4">
                {/* Profile URL — prominent */}
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-200 p-4">
                    <label className="block text-sm font-medium text-teal-800 mb-1">🔗 Your Creator Profile URL</label>
                    <input
                        type="url"
                        value={form.profile_url}
                        onChange={e => setForm(f => ({ ...f, profile_url: e.target.value }))}
                        placeholder="https://www.youtube.com/@yourchannel  or  https://www.instagram.com/yourprofile"
                        className="w-full px-3 py-2.5 border border-teal-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-sand-100"
                    />
                    <p className="text-xs text-teal-600 mt-1.5">
                        We'll scrape your last 3 videos/posts to analyze your content style. YouTube works best.
                    </p>
                </div>

                <div className="border-t border-sand-200 pt-4">
                    <h3 className="text-sm font-semibold text-navy-600 mb-3">Your Next Video Idea</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-navy-600 mb-1">Video Title *</label>
                            <input
                                type="text"
                                value={form.video_title}
                                onChange={e => setForm(f => ({ ...f, video_title: e.target.value }))}
                                placeholder="e.g. 5 Productivity Hacks That Changed My Life"
                                className="w-full px-3 py-2.5 border border-sand-300 rounded-lg text-sm bg-sand-50 text-sand-600 focus:outline-none focus:ring-2 focus:ring-teal-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-navy-600 mb-1">What do you want to cover?</label>
                            <textarea
                                value={form.video_description}
                                onChange={e => setForm(f => ({ ...f, video_description: e.target.value }))}
                                rows={3}
                                placeholder="Describe what you want to talk about, key points, specific things to include..."
                                className="w-full px-3 py-2.5 border border-sand-300 rounded-lg text-sm bg-sand-50 text-sand-600 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                            />
                        </div>
                        <div className="max-w-xs">
                            <label className="block text-sm font-medium text-navy-600 mb-1">Target Platform</label>
                            <select
                                value={form.platform}
                                onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
                                className="w-full px-3 py-2.5 border border-sand-300 rounded-lg text-sm bg-sand-50 text-sand-600 focus:outline-none focus:ring-2 focus:ring-teal-400"
                            >
                                <option>YouTube</option>
                                <option>Instagram</option>
                                <option>LinkedIn</option>
                                <option>Twitter</option>
                                <option>TikTok</option>
                            </select>
                        </div>
                    </div>
                </div>

                {error && <p className="text-sm text-red-400 bg-red-900/30 border border-red-200 rounded-lg p-3">{error}</p>}
                <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {loading ? (
                        <>
                            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Scraping & analyzing your content...
                        </>
                    ) : (
                        <>✦ Generate Script & Captions</>
                    )}
                </button>
            </form>

            {/* Results */}
            {result && (
                <div className="space-y-5">
                    {/* Style Analysis */}
                    {result.style_analysis && (
                        <Section title="🎯 Your Content Style" color="teal">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <InfoCard label="Tone" value={result.style_analysis.tone} />
                                <InfoCard label="Vocabulary" value={result.style_analysis.vocabulary} />
                                <InfoCard label="Content Pattern" value={result.style_analysis.content_pattern} />
                            </div>
                            {result.style_analysis.signature_elements && (
                                <div className="mt-3">
                                    <p className="text-[11px] uppercase tracking-wide text-navy-400 mb-1">Your Signature Elements</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {result.style_analysis.signature_elements.map((el, i) => (
                                            <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">{el}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Section>
                    )}

                    {/* Script */}
                    {result.script && (
                        <Section title="📝 Video Script" color="indigo">
                            <div className="space-y-3">
                                <ScriptBlock label="🪝 Hook" text={result.script.hook} bg="bg-red-900/30 border-red-200 text-red-400" copy={copy} copied={copied} />
                                <ScriptBlock label="📣 Intro" text={result.script.intro} bg="bg-amber-900/30 border-amber-200 text-amber-400" copy={copy} copied={copied} />

                                {result.script.sections?.map((section, i) => (
                                    <div key={i} className="bg-sand-100 rounded-lg border border-sand-200 p-4">
                                        <h4 className="font-semibold text-navy-900 text-sm mb-2">Section {i + 1}: {section.heading}</h4>
                                        <div className="space-y-2">
                                            <div className="bg-blue-900/30 border border-blue-200 rounded-md p-3">
                                                <p className="text-[11px] font-semibold text-blue-400 mb-0.5">🎤 Talking Points</p>
                                                <p className="text-xs text-blue-400 leading-relaxed whitespace-pre-line">{section.talking_points}</p>
                                            </div>
                                            <div className="bg-violet-900/30 border border-violet-200 rounded-md p-3">
                                                <p className="text-[11px] font-semibold text-violet-400 mb-0.5">🎬 Visual Notes</p>
                                                <p className="text-xs text-violet-800 leading-relaxed">{section.visual_notes}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <ScriptBlock label="📣 Call to Action" text={result.script.cta} bg="bg-green-900/30 border-green-200 text-green-400" copy={copy} copied={copied} />
                                <ScriptBlock label="👋 Outro" text={result.script.outro} bg="bg-navy-50 border-navy-200 text-navy-900" copy={copy} copied={copied} />

                                {result.script.estimated_duration && (
                                    <p className="text-xs text-navy-400">⏱ Estimated duration: {result.script.estimated_duration}</p>
                                )}
                            </div>
                        </Section>
                    )}

                    {/* Captions */}
                    {result.captions && (
                        <Section title="💬 Captions" color="amber">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                <CaptionCard label="YouTube Description" text={result.captions.youtube_description} icon="▶" copy={copy} copied={copied} />
                                <CaptionCard label="Instagram Caption" text={result.captions.instagram_caption} icon="📷" copy={copy} copied={copied} />
                                <CaptionCard label="LinkedIn Post" text={result.captions.linkedin_text} icon="💼" copy={copy} copied={copied} />
                                <CaptionCard label="Twitter / X" text={result.captions.twitter_text} icon="𝕏" copy={copy} copied={copied} />
                            </div>
                        </Section>
                    )}

                    {/* Hashtags */}
                    {result.hashtags && (
                        <Section title="# Hashtags" color="rose">
                            <div className="space-y-3">
                                <HashtagGroup label="Primary" tags={result.hashtags.primary} color="bg-rose-900/30 text-rose-400 border-rose-200" copy={copy} copied={copied} />
                                <HashtagGroup label="Reach" tags={result.hashtags.secondary} color="bg-orange-900/30 text-orange-400 border-orange-200" copy={copy} copied={copied} />
                                <HashtagGroup label="Niche" tags={result.hashtags.niche} color="bg-violet-900/30 text-violet-400 border-violet-200" copy={copy} copied={copied} />
                                <button
                                    onClick={() => copy([...(result.hashtags.primary || []), ...(result.hashtags.secondary || []), ...(result.hashtags.niche || [])].join(' '), 'all-hashtags')}
                                    className="text-xs px-3 py-1.5 rounded-md bg-sand-100 text-navy-600 hover:bg-sand-200 transition-colors"
                                >
                                    {copied === 'all-hashtags' ? '✓ Copied!' : '📋 Copy all hashtags'}
                                </button>
                            </div>
                        </Section>
                    )}

                    {/* Thumbnail */}
                    {result.thumbnail_suggestion && (
                        <Section title="🖼️ Thumbnail Idea" color="violet">
                            <p className="text-sm text-navy-600 leading-relaxed">{result.thumbnail_suggestion}</p>
                        </Section>
                    )}
                </div>
            )}
        </div>
    )
}

/* ── Helper Components ── */

function Section({ title, color, children }) {
    const borders = { teal: 'border-teal-300', indigo: 'border-indigo-300', amber: 'border-amber-300', rose: 'border-rose-300', violet: 'border-violet-300' }
    return (
        <div className={`bg-sand-50 rounded-xl border ${borders[color] || 'border-sand-200'} p-5`}>
            <h3 className="text-base font-semibold text-navy-900 mb-3">{title}</h3>
            {children}
        </div>
    )
}

function InfoCard({ label, value }) {
    return (
        <div className="bg-sand-100 rounded-lg border border-sand-200 p-3">
            <p className="text-[11px] uppercase tracking-wide text-navy-400 mb-0.5">{label}</p>
            <p className="text-sm text-navy-600">{value || '—'}</p>
        </div>
    )
}

function ScriptBlock({ label, text, bg, copy, copied }) {
    const id = label.replace(/\s/g, '-').toLowerCase()
    return (
        <div className={`rounded-md border p-3 ${bg} relative group`}>
            <div className="flex items-center justify-between mb-0.5">
                <p className="text-[11px] font-semibold">{label}</p>
                <button onClick={() => copy(text, id)}
                    className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity px-1.5 py-0.5 rounded bg-black/10">
                    {copied === id ? '✓' : '📋'}
                </button>
            </div>
            <p className="text-xs leading-relaxed whitespace-pre-line">{text}</p>
        </div>
    )
}

function CaptionCard({ label, text, icon, copy, copied }) {
    const id = `caption-${label.replace(/\s/g, '-').toLowerCase()}`
    return (
        <div className="bg-sand-100 rounded-lg border border-sand-200 p-4 group">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-navy-600">{icon} {label}</h4>
                <button onClick={() => copy(text, id)}
                    className="text-xs px-2 py-0.5 rounded bg-sand-100 text-navy-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-sand-200">
                    {copied === id ? '✓ Copied!' : 'Copy'}
                </button>
            </div>
            <p className="text-xs text-navy-600 leading-relaxed whitespace-pre-line">{text}</p>
        </div>
    )
}

function HashtagGroup({ label, tags, color, copy, copied }) {
    const id = `hashtags-${label.toLowerCase()}`
    if (!tags || tags.length === 0) return null
    return (
        <div>
            <div className="flex items-center gap-2 mb-1">
                <p className="text-[11px] uppercase tracking-wide text-navy-400">{label}</p>
                <button onClick={() => copy(tags.join(' '), id)}
                    className="text-[10px] text-navy-400 hover:text-navy-600">
                    {copied === id ? '✓' : '📋'}
                </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
                {tags.map((tag, i) => (
                    <span key={i} className={`text-xs px-2 py-0.5 rounded-full border ${color}`}>{tag}</span>
                ))}
            </div>
        </div>
    )
}
