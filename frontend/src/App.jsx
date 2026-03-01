import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Pipeline from './pages/Pipeline'
import DealDetail from './pages/DealDetail'
import Brands from './pages/Brands'
import Revenue from './pages/Revenue'
import Invoices from './pages/Invoices'
import BusinessHealth from './pages/BusinessHealth'
import Compose from './pages/Compose'
import Calendar from './pages/Calendar'
import Connections from './pages/Connections'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="pipeline" element={<Pipeline />} />
        <Route path="deals/:id" element={<DealDetail />} />
        <Route path="brands" element={<Brands />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="revenue" element={<Revenue />} />
        <Route path="health" element={<BusinessHealth />} />
        <Route path="compose" element={<Compose />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="connections" element={<Connections />} />
      </Route>
    </Routes>
  )
}
