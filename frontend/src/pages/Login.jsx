import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register } from '../api/client'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', full_name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const fn = mode === 'login' ? login : register
      const data = mode === 'login'
        ? { email: form.email, password: form.password }
        : { email: form.email, password: form.password, full_name: form.full_name }
      const res = await fn(data)
      localStorage.setItem('token', res.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function demoLogin() {
    setForm({ email: 'demo@creatoros.com', password: 'demo1234', full_name: '' })
    setLoading(true)
    setError('')
    try {
      const res = await login({ email: 'demo@creatoros.com', password: 'demo1234' })
      localStorage.setItem('token', res.token)
      navigate('/dashboard')
    } catch (err) {
      setError('Demo login failed — make sure seed data is loaded')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy-800 flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-white">CreatorOS</h1>
          <p className="text-teal-300 text-sm mt-1">Sponsorship CRM for creators</p>
        </div>

        <div className="bg-white border border-sand-200 rounded-lg shadow-lg p-6">
          <div className="flex border border-sand-200 rounded-md mb-6 p-0.5 bg-sand-50">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-1.5 text-sm rounded transition-colors ${mode === 'login' ? 'bg-white shadow-sm text-navy-800 font-medium' : 'text-navy-400'}`}
            >
              Sign in
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-1.5 text-sm rounded transition-colors ${mode === 'register' ? 'bg-white shadow-sm text-navy-800 font-medium' : 'text-navy-400'}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm text-navy-700 mb-1">Full name</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={set('full_name')}
                  required
                  className="w-full border border-sand-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-navy-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                required
                className="w-full border border-sand-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm text-navy-700 mb-1">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={set('password')}
                required
                className="w-full border border-sand-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-500 text-white py-2 rounded-md text-sm font-medium hover:bg-teal-600 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Loading...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-sand-200">
            <button
              onClick={demoLogin}
              disabled={loading}
              className="w-full border border-navy-200 text-navy-700 py-2 rounded-md text-sm hover:bg-sand-50 disabled:opacity-50 transition-colors"
            >
              Use demo account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
