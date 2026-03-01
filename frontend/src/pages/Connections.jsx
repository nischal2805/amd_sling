import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getConnections, disconnectPlatform, getPlatformAuthUrl, getGmailStatus, getGmailConnectUrl, scanGmail } from '../api/client'
import { useState } from 'react'

const PLATFORMS = [
  { key: 'gmail', label: 'Gmail', description: 'Scan inbox for sponsorship emails', icon: '✉️' },
  { key: 'youtube', label: 'YouTube', description: 'Publish videos and shorts', icon: '▶️' },
  { key: 'instagram', label: 'Instagram', description: 'Post reels and photos', icon: '📷' },
  { key: 'linkedin', label: 'LinkedIn', description: 'Share professional updates', icon: '💼' },
  { key: 'twitter', label: 'Twitter / X', description: 'Post tweets and threads', icon: '𝕏' },
]

function PlatformCard({ platform, connection, gmailStatus, onConnect, onDisconnect, onScan, scanning }) {
  const isGmail = platform.key === 'gmail'
  const isConnected = isGmail ? gmailStatus?.connected : !!connection

  const username = isGmail
    ? gmailStatus?.email
    : connection?.platform_username || connection?.platform_email || connection?.platform_user_id

  return (
    <div className="bg-white border border-sand-200 rounded-lg shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{platform.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-navy-800">{platform.label}</h3>
              {isConnected ? (
                <span className="inline-flex items-center gap-1 text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 inline-block"></span>
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-navy-300 bg-sand-100 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-navy-200 inline-block"></span>
                  Not connected
                </span>
              )}
            </div>
            <p className="text-xs text-navy-400 mt-0.5">{platform.description}</p>
            {isConnected && username && (
              <p className="text-xs text-navy-300 mt-1">@{username}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isConnected && isGmail && (
            <button
              onClick={onScan}
              disabled={scanning}
              className="text-xs border border-navy-200 text-navy-600 px-3 py-1.5 rounded hover:bg-sand-50 disabled:opacity-50"
            >
              {scanning ? 'Scanning...' : 'Scan inbox'}
            </button>
          )}
          {isConnected ? (
            <button
              onClick={() => { if (confirm(`Disconnect ${platform.label}?`)) onDisconnect() }}
              className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded hover:bg-red-50"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={onConnect}
              className="text-xs bg-teal-500 text-white px-3 py-1.5 rounded hover:bg-teal-600"
            >
              Connect
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Connections() {
  const qc = useQueryClient()
  const [scanning, setScanning] = useState(false)
  const [scanResults, setScanResults] = useState(null)
  const [scanError, setScanError] = useState(null)

  const { data: connections = [] } = useQuery({ queryKey: ['connections'], queryFn: getConnections })
  const { data: gmailStatus } = useQuery({ queryKey: ['gmail-status'], queryFn: getGmailStatus })

  const disconnectMutation = useMutation({
    mutationFn: disconnectPlatform,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['connections'] }); qc.invalidateQueries({ queryKey: ['gmail-status'] }) }
  })

  function getConnection(platform) {
    return connections.find(c => c.platform === platform)
  }

  async function handleConnect(platform) {
    try {
      if (platform === 'gmail') {
        const res = await getGmailConnectUrl()
        if (res?.url) window.location.href = res.url
      } else {
        const res = await getPlatformAuthUrl(platform)
        if (res?.url) window.location.href = res.url
      }
    } catch (e) {
      alert('Could not get auth URL: ' + (e.response?.data?.error || e.message))
    }
  }

  async function handleScan() {
    setScanning(true)
    setScanResults(null)
    setScanError(null)
    try {
      const res = await scanGmail()
      setScanResults(res)
    } catch (e) {
      setScanError(e.response?.data?.error || 'Scan failed')
    } finally {
      setScanning(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-navy-800">Connections</h1>
        <p className="text-sm text-navy-400 mt-0.5">Connect your social accounts and email</p>
      </div>

      <div className="space-y-3">
        {PLATFORMS.map(platform => (
          <PlatformCard
            key={platform.key}
            platform={platform}
            connection={getConnection(platform.key)}
            gmailStatus={gmailStatus}
            onConnect={() => handleConnect(platform.key)}
            onDisconnect={() => disconnectMutation.mutate(platform.key)}
            onScan={handleScan}
            scanning={scanning}
          />
        ))}
      </div>

      {/* Scan results */}
      {scanResults && (
        <div className="mt-5 bg-white border border-sand-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-sand-100 bg-sand-50 flex items-center justify-between">
            <h2 className="text-sm font-medium text-navy-800">Scan results — {scanResults.sponsorships?.length || 0} potential deals found</h2>
            <button onClick={() => setScanResults(null)} className="text-navy-300 hover:text-navy-500 text-lg leading-none">&times;</button>
          </div>
          {(!scanResults.sponsorships || scanResults.sponsorships.length === 0) ? (
            <div className="px-5 py-6 text-sm text-navy-300 text-center">No sponsorship emails found with high confidence</div>
          ) : (
            <div className="divide-y divide-sand-50">
              {scanResults.sponsorships.map((item, i) => (
                <div key={i} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-navy-800">{item.subject || item.brand_name || 'Unknown'}</p>
                      <p className="text-xs text-navy-400 mt-0.5">From: {item.from || item.sender || '—'}</p>
                      {item.parsed && (
                        <div className="mt-2 space-y-1">
                          {item.parsed.brand_name && <p className="text-xs text-navy-500">Brand: <span className="font-medium">{item.parsed.brand_name}</span></p>}
                          {item.parsed.deal_value && <p className="text-xs text-navy-500">Value: <span className="font-medium text-teal-600">₹{item.parsed.deal_value.toLocaleString()}</span></p>}
                          {item.parsed.deliverables && <p className="text-xs text-navy-500">Deliverables: {item.parsed.deliverables}</p>}
                          {item.parsed.summary && <p className="text-xs text-navy-400 mt-1">{item.parsed.summary}</p>}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-teal-600 font-medium">{Math.round((item.confidence || 0) * 100)}% confidence</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {scanError && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded px-4 py-3 text-sm text-red-700">
          {scanError}
        </div>
      )}

      {/* Info box */}
      <div className="mt-5 bg-cyan-50 border border-cyan-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-navy-700 mb-1">How connections work</h4>
        <ul className="text-xs text-navy-500 space-y-1 list-disc list-inside">
          <li>Connecting Gmail lets BuzzStack scan for sponsorship inquiries and auto-populate the pipeline</li>
          <li>Connecting YouTube, Instagram, LinkedIn, or Twitter lets you publish content directly from Compose</li>
          <li>OAuth tokens are stored securely and never shared</li>
          <li>You can disconnect any account at any time</li>
        </ul>
      </div>
    </div>
  )
}
