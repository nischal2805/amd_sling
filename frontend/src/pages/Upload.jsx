import { useState, useRef } from 'react'

const PLATFORMS = [
  { id: 'youtube', label: 'YouTube', icon: '▶', accept: 'video/*', maxLabel: '256 GB' },
  { id: 'instagram', label: 'Instagram', icon: '◎', accept: 'video/*,image/*', maxLabel: '100 MB' },
]

function FileDropZone({ label, accept, file, onFile, hint }) {
  const ref = useRef()
  const [drag, setDrag] = useState(false)

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files[0]) }}
      onClick={() => ref.current?.click()}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${drag ? 'border-teal-500 bg-teal-500/10' : file ? 'border-cyan-400 bg-cyan-900/10' : 'border-sand-300 hover:border-sand-400'}`}
    >
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={e => onFile(e.target.files[0])} />
      {file ? (
        <div className="space-y-1">
          <p className="text-sm font-medium text-cyan-400">✓ {file.name}</p>
          <p className="text-xs text-navy-300">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
          <button onClick={e => { e.stopPropagation(); onFile(null) }} className="text-xs text-red-400 hover:text-red-300 mt-1">Remove</button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-2xl text-navy-300">⬆</p>
          <p className="text-sm font-medium text-navy-500">{label}</p>
          <p className="text-xs text-navy-300">{hint}</p>
        </div>
      )}
    </div>
  )
}

export default function Upload() {
  const [platform, setPlatform] = useState('youtube')
  const [videoFile, setVideoFile] = useState(null)
  const [thumbFile, setThumbFile] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', tags: '', privacy: 'public', caption: '' })
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }))

  const canUpload = videoFile && (platform === 'youtube' ? form.title : form.caption)

  function handleUpload() {
    setUploading(true)
    setProgress(0)
    setResult(null)
    // Simulate upload progress
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval)
          setUploading(false)
          setResult({ success: true, message: `Successfully uploaded to ${platform === 'youtube' ? 'YouTube' : 'Instagram'}!` })
          return 100
        }
        return p + Math.random() * 15
      })
    }, 400)
  }

  function resetAll() {
    setVideoFile(null)
    setThumbFile(null)
    setForm({ title: '', description: '', tags: '', privacy: 'public', caption: '' })
    setProgress(0)
    setResult(null)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-navy-900">Upload Content</h1>
        <p className="text-sm text-navy-500 mt-0.5">Upload videos and thumbnails to YouTube & Instagram</p>
      </div>

      {/* Platform selector */}
      <div className="flex gap-2">
        {PLATFORMS.map(p => (
          <button
            key={p.id}
            onClick={() => { setPlatform(p.id); resetAll() }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${platform === p.id ? 'bg-teal-500 text-white' : 'bg-sand-100 text-navy-500 hover:bg-sand-200'}`}
          >
            <span className="text-base">{p.icon}</span>
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: File uploads */}
        <div className="space-y-4">
          <div className="bg-sand-100 rounded-lg border border-sand-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-navy-900">
              {platform === 'youtube' ? 'Video File' : 'Video / Image'}
            </h2>
            <FileDropZone
              label={platform === 'youtube' ? 'Drop your video here' : 'Drop video or image here'}
              accept={PLATFORMS.find(p => p.id === platform).accept}
              file={videoFile}
              onFile={setVideoFile}
              hint={`Click to browse · Max ${PLATFORMS.find(p => p.id === platform).maxLabel}`}
            />
          </div>

          {platform === 'youtube' && (
            <div className="bg-sand-100 rounded-lg border border-sand-200 p-5 space-y-4">
              <h2 className="text-sm font-semibold text-navy-900">Thumbnail</h2>
              <FileDropZone
                label="Drop thumbnail image here"
                accept="image/*"
                file={thumbFile}
                onFile={setThumbFile}
                hint="1280×720 recommended · JPG, PNG"
              />
              {thumbFile && (
                <div className="rounded-lg overflow-hidden border border-sand-200">
                  <img src={URL.createObjectURL(thumbFile)} alt="Thumbnail preview" className="w-full h-36 object-cover" />
                </div>
              )}
            </div>
          )}

          {/* File info */}
          {videoFile && (
            <div className="bg-sand-100 rounded-lg border border-sand-200 p-4">
              <h3 className="text-xs font-medium text-navy-500 mb-2">File Details</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-navy-300">Name:</span> <span className="text-navy-600">{videoFile.name}</span></div>
                <div><span className="text-navy-300">Size:</span> <span className="text-navy-600">{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</span></div>
                <div><span className="text-navy-300">Type:</span> <span className="text-navy-600">{videoFile.type || 'Unknown'}</span></div>
                {thumbFile && <div><span className="text-navy-300">Thumb:</span> <span className="text-navy-600">{thumbFile.name}</span></div>}
              </div>
            </div>
          )}
        </div>

        {/* Right: Metadata form */}
        <div className="space-y-4">
          <div className="bg-sand-100 rounded-lg border border-sand-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-navy-900">
              {platform === 'youtube' ? 'Video Details' : 'Post Details'}
            </h2>

            {platform === 'youtube' ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-navy-600 mb-1">Title *</label>
                  <input value={form.title} onChange={set('title')} maxLength={100}
                    className="w-full border border-sand-200 rounded-lg px-3 py-2 text-sm bg-sand-50 text-sand-600 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    placeholder="My awesome video" />
                  <p className="text-xs text-navy-300 mt-1">{form.title.length}/100</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-navy-600 mb-1">Description</label>
                  <textarea value={form.description} onChange={set('description')} rows={5}
                    className="w-full border border-sand-200 rounded-lg px-3 py-2 text-sm bg-sand-50 text-sand-600 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                    placeholder="Tell viewers about your video..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-navy-600 mb-1">Tags</label>
                  <input value={form.tags} onChange={set('tags')}
                    className="w-full border border-sand-200 rounded-lg px-3 py-2 text-sm bg-sand-50 text-sand-600 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    placeholder="tech, productivity, tutorial" />
                  <p className="text-xs text-navy-300 mt-1">Comma separated</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-navy-600 mb-1">Privacy</label>
                  <select value={form.privacy} onChange={set('privacy')}
                    className="w-full border border-sand-200 rounded-lg px-3 py-2 text-sm bg-sand-50 text-sand-600 focus:outline-none focus:ring-2 focus:ring-teal-400">
                    <option value="public">Public</option>
                    <option value="unlisted">Unlisted</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-medium text-navy-600 mb-1">Caption *</label>
                  <textarea value={form.caption} onChange={set('caption')} rows={5}
                    className="w-full border border-sand-200 rounded-lg px-3 py-2 text-sm bg-sand-50 text-sand-600 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                    placeholder="Write your Instagram caption..." />
                  <p className="text-xs text-navy-300 mt-1">{form.caption.length} characters</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-navy-600 mb-1">Hashtags</label>
                  <input value={form.tags} onChange={set('tags')}
                    className="w-full border border-sand-200 rounded-lg px-3 py-2 text-sm bg-sand-50 text-sand-600 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    placeholder="#tech #creator #productivity" />
                </div>
              </>
            )}
          </div>

          {/* Upload button + progress */}
          <div className="space-y-3">
            {uploading && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-navy-500">
                  <span>Uploading...</span>
                  <span>{Math.min(Math.round(progress), 100)}%</span>
                </div>
                <div className="w-full bg-sand-200 rounded-full h-2">
                  <div className="bg-teal-500 h-2 rounded-full transition-all duration-300" style={{ width: `${Math.min(progress, 100)}%` }} />
                </div>
              </div>
            )}

            {result && (
              <div className={`p-3 rounded-lg text-sm ${result.success ? 'bg-green-900/30 text-green-400 border border-green-900/40' : 'bg-red-900/30 text-red-400 border border-red-900/40'}`}>
                {result.success ? '✅' : '❌'} {result.message}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleUpload}
                disabled={!canUpload || uploading}
                className="flex-1 bg-teal-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? 'Uploading...' : `Upload to ${platform === 'youtube' ? 'YouTube' : 'Instagram'}`}
              </button>
              <button
                onClick={resetAll}
                className="px-4 py-2.5 border border-sand-200 text-navy-500 rounded-lg text-sm hover:bg-sand-200 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
