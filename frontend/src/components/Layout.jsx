import { Outlet, NavLink, useNavigate } from 'react-router-dom'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '▣' },
  { to: '/pipeline', label: 'Pipeline', icon: '◈' },
  { to: '/brands', label: 'Brands', icon: '◉' },
  { to: '/invoices', label: 'Invoices', icon: '◧' },
  { to: '/revenue', label: 'Revenue', icon: '◎' },
  { to: '/health', label: 'Health', icon: '♥' },
  { to: '/compose', label: 'Compose', icon: '✎' },
  { to: '/calendar', label: 'Calendar', icon: '◻' },
  { to: '/connections', label: 'Connections', icon: '⟳' },
]

export default function Layout() {
  const navigate = useNavigate()

  function logout() {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-sand-50">
      {/* Sidebar */}
      <aside className="w-56 bg-navy-800 flex flex-col">
        <div className="h-14 flex items-center px-5 border-b border-navy-700">
          <span className="text-white font-semibold text-base tracking-tight">CreatorOS</span>
        </div>
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-teal-500/20 text-cyan-400 font-medium'
                    : 'text-navy-200 hover:bg-navy-700 hover:text-white'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-navy-700">
          <button
            onClick={logout}
            className="w-full text-left px-3 py-2 text-sm text-navy-300 hover:text-white hover:bg-navy-700 rounded-md transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
