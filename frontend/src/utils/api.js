import axios from 'axios'

// Determine API base URL
const getBaseURL = () => {
  // If running on Vercel or specified in import.meta.env
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE
  }
  
  // Local development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001/api'
  }
  
  // Production - assume API at same domain
  return `${window.location.origin}/api`
}

const BASE = getBaseURL()

const api = axios.create({ 
  baseURL: BASE,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Attach token automatically
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('kv_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Extract error message
api.interceptors.response.use(
  r => r,
  err => {
    console.error('API Error:', {
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      message: err.message
    })
    
    let msg = 'Lỗi không xác định'
    if (err.response?.data?.error) {
      msg = err.response.data.error
    } else if (err.response?.statusText) {
      msg = `Lỗi ${err.response.status}: ${err.response.statusText}`
    } else if (err.message) {
      msg = err.message
    }
    
    return Promise.reject(new Error(msg))
  }
)

// ── AUTH ──────────────────────────────────────────────────────────────────
export const authApi = {
  adminLogin:    (d)  => api.post('/auth/admin/login',  d).then(r => r.data),
  register:      (d)  => api.post('/auth/register',     d).then(r => r.data),
  login:         (d)  => api.post('/auth/login',        d).then(r => r.data),
  me:            ()   => api.get('/auth/me').then(r => r.data),
  forgotPassword:(d)  => api.post('/auth/forgot-password', d).then(r => r.data),
  resetPassword: (d)  => api.post('/auth/reset-password',  d).then(r => r.data),
}

// ── USER KEYS ─────────────────────────────────────────────────────────────
export const userApi = {
  activate: (keyCode) => api.post('/keys/activate', { keyCode }).then(r => r.data),
  downloadZipUrl: (id) => `${BASE}/user/keys/${id}/download`,
}

// ── ADMIN ─────────────────────────────────────────────────────────────────
export const adminApi = {
  stats:      ()    => api.get('/admin/stats').then(r => r.data),
  keys:       ()    => api.get('/admin/keys').then(r => r.data),
  createKeys: (d)   => api.post('/admin/keys', d).then(r => r.data),
  revokeKey:  (id)  => api.patch(`/admin/keys/${id}/revoke`).then(r => r.data),
  deleteKey:  (id)  => api.delete(`/admin/keys/${id}`).then(r => r.data),
  downloadZipUrl: (id) => `${BASE}/admin/keys/${id}/download`,
  users:      ()    => api.get('/admin/users').then(r => r.data),
  deleteUser: (id)  => api.delete(`/admin/users/${id}`).then(r => r.data),
  logs:       ()    => api.get('/admin/logs').then(r => r.data),
  clearLogs:  ()    => api.delete('/admin/logs').then(r => r.data),
}

// ── HEALTH ─────────────────────────────────────────────────────────────────
export const healthApi = {
  check: () => api.get('/health').then(r => r.data),
}

// ── MODULE LIVE UPDATE ──────────────────────────────────────────────────────
export const moduleApi = {
  /**
   * Get current versions of all modules
   */
  getVersions: () => api.get('/modules/versions').then(r => r.data),
  
  /**
   * Check which modules have updates available
   * @param {object} desktopVersions - {analytics: '1.0.0', reports: '1.1.0', ...}
   */
  checkUpdates: (desktopVersions) => 
    api.post('/modules/check-updates', { desktopVersions }).then(r => r.data),
  
  /**
   * Download specific module version
   * @param {string} moduleId - e.g., 'analytics'
   * @param {string} version - e.g., '1.2.0'
   */
  downloadModule: (moduleId, version) => {
    const url = `${BASE}/modules/${moduleId}/download?version=${version}`
    return url
  },
}

// ── ADMIN MODULE MANAGEMENT ────────────────────────────────────────────────
export const adminModuleApi = {
  /**
   * Get download history (admin only)
   * @param {string} moduleId - Optional, filter by module
   * @param {number} limit - Number of records to return
   */
  getHistory: (moduleId = null, limit = 100) => {
    const params = { limit }
    if (moduleId) params.moduleId = moduleId
    return api.get('/admin/modules/history', { params }).then(r => r.data)
  },
  
  /**
   * Get report of which users need which module updates
   */
  getUsersUpdates: () => api.get('/admin/modules/users-updates').then(r => r.data),
}

export default api
