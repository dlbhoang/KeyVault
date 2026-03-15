import axios from 'axios'

const BASE = 'https://key-vault-nine.vercel.app/api'

const api = axios.create({ baseURL: BASE })

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
    const msg = err.response?.data?.error || err.message || 'Lỗi không xác định'
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

export default api
