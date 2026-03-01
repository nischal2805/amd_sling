import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth
export const login = (data) => api.post('/auth/login', data).then(r => r.data)
export const register = (data) => api.post('/auth/register', data).then(r => r.data)
export const getMe = () => api.get('/auth/me').then(r => r.data)
export const updateMe = (data) => api.put('/auth/me', data).then(r => r.data)

// Brands
export const getBrands = () => api.get('/brands').then(r => r.data)
export const createBrand = (data) => api.post('/brands', data).then(r => r.data)
export const getBrand = (id) => api.get(`/brands/${id}`).then(r => r.data)
export const updateBrand = (id, data) => api.put(`/brands/${id}`, data).then(r => r.data)
export const deleteBrand = (id) => api.delete(`/brands/${id}`).then(r => r.data)

// Deals
export const getDeals = (params) => api.get('/deals', { params }).then(r => r.data)
export const createDeal = (data) => api.post('/deals', data).then(r => r.data)
export const getDeal = (id) => api.get(`/deals/${id}`).then(r => r.data)
export const updateDeal = (id, data) => api.put(`/deals/${id}`, data).then(r => r.data)
export const deleteDeal = (id) => api.delete(`/deals/${id}`).then(r => r.data)
export const moveDealStage = (id, stage) => api.patch(`/deals/${id}/stage`, { stage }).then(r => r.data)

// Deliverables
export const getDeliverables = (dealId) => api.get(`/deals/${dealId}/deliverables`).then(r => r.data)
export const createDeliverable = (dealId, data) => api.post(`/deals/${dealId}/deliverables`, data).then(r => r.data)
export const updateDeliverable = (dealId, id, data) => api.put(`/deals/${dealId}/deliverables/${id}`, data).then(r => r.data)
export const deleteDeliverable = (dealId, id) => api.delete(`/deals/${dealId}/deliverables/${id}`).then(r => r.data)
export const updateDeliverableStatus = (dealId, id, status) => api.patch(`/deals/${dealId}/deliverables/${id}/status`, { status }).then(r => r.data)
export const toggleDeliverableLock = (dealId, id) => api.patch(`/deals/${dealId}/deliverables/${id}/lock`).then(r => r.data)
export const lockAllDeliverables = (dealId) => api.post(`/deals/${dealId}/lock-all`).then(r => r.data)

// Revenue
export const getRevenue = (params) => api.get('/revenue', { params }).then(r => r.data)
export const createRevenue = (data) => api.post('/revenue', data).then(r => r.data)
export const updateRevenue = (id, data) => api.put(`/revenue/${id}`, data).then(r => r.data)
export const deleteRevenue = (id) => api.delete(`/revenue/${id}`).then(r => r.data)
export const getRevenueSummary = (params) => api.get('/revenue/summary', { params }).then(r => r.data)
export const getRevenueForecast = () => api.get('/revenue/forecast').then(r => r.data)

// Invoices
export const getInvoices = () => api.get('/invoices').then(r => r.data)
export const createInvoice = (data) => api.post('/invoices', data).then(r => r.data)
export const getInvoice = (id) => api.get(`/invoices/${id}`).then(r => r.data)
export const updateInvoice = (id, data) => api.put(`/invoices/${id}`, data).then(r => r.data)
export const updateInvoiceStatus = (id, status) => api.patch(`/invoices/${id}/status`, { status }).then(r => r.data)

// Analytics
export const getDashboard = () => api.get('/analytics/dashboard').then(r => r.data)
export const getPipelineAnalytics = () => api.get('/analytics/pipeline').then(r => r.data)
export const getBrandsAnalytics = () => api.get('/analytics/brands').then(r => r.data)
export const getRevenueAnalytics = () => api.get('/analytics/revenue').then(r => r.data)
export const getBusinessHealth = () => api.get('/analytics/health').then(r => r.data)

// AI
export const parseEmail = (data) => api.post('/ai/parse-email', data).then(r => r.data)
export const suggestRate = (data) => api.post('/ai/suggest-rate', data).then(r => r.data)
export const draftResponse = (data) => api.post('/ai/draft-response', data).then(r => r.data)
export const repurposeContent = (data) => api.post('/ai/repurpose', data).then(r => r.data)
export const generateBrief = (data) => api.post('/ai/generate-brief', data).then(r => r.data)
export const negotiationCoach = (data) => api.post('/ai/negotiation-coach', data).then(r => r.data)

// Negotiation Notes
export const getNegotiationNotes = (params) => api.get('/negotiations', { params }).then(r => r.data)
export const createNegotiationNote = (data) => api.post('/negotiations', data).then(r => r.data)
export const deleteNegotiationNote = (id) => api.delete(`/negotiations/${id}`).then(r => r.data)

// Posts
export const getPosts = (params) => api.get('/posts', { params }).then(r => r.data)
export const createPost = (data) => api.post('/posts', data).then(r => r.data)
export const getPost = (id) => api.get(`/posts/${id}`).then(r => r.data)
export const updatePost = (id, data) => api.put(`/posts/${id}`, data).then(r => r.data)
export const deletePost = (id) => api.delete(`/posts/${id}`).then(r => r.data)
export const publishPost = (id) => api.post(`/posts/${id}/publish`).then(r => r.data)
export const getCalendar = (params) => api.get('/posts/calendar', { params }).then(r => r.data)

// Connections
export const getConnections = () => api.get('/connections').then(r => r.data)
export const disconnectPlatform = (platform) => api.delete(`/connections/${platform}`).then(r => r.data)
export const getGmailStatus = () => api.get('/gmail/status').then(r => r.data)
export const scanGmail = () => api.post('/gmail/scan').then(r => r.data)
export const getGmailConnectUrl = () => api.get('/gmail/connect').then(r => r.data)
export const getPlatformAuthUrl = (platform) => api.get(`/connections/${platform}/auth`).then(r => r.data)

export default api
