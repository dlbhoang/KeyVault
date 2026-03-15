import { create } from 'zustand'
import { authApi, adminApi, userApi } from '../utils/api.js'

export const MODULES = [
  { id:'analytics', name:'Analytics',  icon:'📊', color:'#6366f1' },
  { id:'reports',   name:'Reports',    icon:'📄', color:'#0ea5e9' },
  { id:'crm',       name:'CRM',        icon:'🤝', color:'#10b981' },
  { id:'inventory', name:'Inventory',  icon:'📦', color:'#f59e0b' },
  { id:'hr',        name:'HR Manager', icon:'👔', color:'#ec4899' },
  { id:'finance',   name:'Finance',    icon:'💰', color:'#ef4444' },
  { id:'ai',        name:'AI Tools',   icon:'🤖', color:'#8b5cf6' },
  { id:'api',       name:'API Access', icon:'🔌', color:'#14b8a6' },
]

export const KEY_PLANS = {
  full6m:    { label:'Full Access · 6 tháng', days:182, badge:'TRIAL', allMods:true  },
  full1y:    { label:'Full Access · 1 năm',   days:365, badge:'PRO',   allMods:true  },
  desktop1y: { label:'Desktop App · 1 năm',   days:365, badge:'DESK',  allMods:false },
  custom:    { label:'Tùy chỉnh',              days:null, badge:'CUST', allMods:false },
}

// ── AUTH STORE ────────────────────────────────────────────────────────────
export const useAuthStore = create((set, get) => ({
  user:     null,
  role:     null,   // 'admin' | 'user' | null
  token:    localStorage.getItem('kv_token') || null,
  loading:  false,
  error:    null,

  init: async () => {
    const token = localStorage.getItem('kv_token')
    const role  = localStorage.getItem('kv_role')
    if (!token) return
    set({ token, role })
    try {
      if (role === 'user') {
        const data = await authApi.me()
        set({ user: data.user })
      } else if (role === 'admin') {
        const stored = localStorage.getItem('kv_user')
        if (stored) set({ user: JSON.parse(stored) })
      }
    } catch {
      get().logout()
    }
  },

  adminLogin: async (username, password) => {
    set({ loading: true, error: null })
    try {
      const data = await authApi.adminLogin({ username, password })
      localStorage.setItem('kv_token', data.token)
      localStorage.setItem('kv_role', 'admin')
      localStorage.setItem('kv_user', JSON.stringify(data.user))
      set({ token: data.token, role: 'admin', user: data.user, loading: false })
      return true
    } catch (e) {
      set({ error: e.message, loading: false })
      return false
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null })
    try {
      const data = await authApi.register({ name, email, password })
      localStorage.setItem('kv_token', data.token)
      localStorage.setItem('kv_role', 'user')
      set({ token: data.token, role: 'user', user: data.user, loading: false })
      return true
    } catch (e) {
      set({ error: e.message, loading: false })
      return false
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const data = await authApi.login({ email, password })
      localStorage.setItem('kv_token', data.token)
      localStorage.setItem('kv_role', 'user')
      set({ token: data.token, role: 'user', user: data.user, loading: false })
      return true
    } catch (e) {
      set({ error: e.message, loading: false })
      return false
    }
  },

  forgotPassword: async (email) => {
    set({ loading: true, error: null })
    try {
      const data = await authApi.forgotPassword({ email })
      set({ loading: false })
      return data
    } catch (e) {
      set({ error: e.message, loading: false })
      return null
    }
  },

  resetPassword: async (token, newPassword) => {
    set({ loading: true, error: null })
    try {
      await authApi.resetPassword({ token, newPassword })
      set({ loading: false })
      return true
    } catch (e) {
      set({ error: e.message, loading: false })
      return false
    }
  },

  clearError: () => set({ error: null }),

  logout: () => {
    localStorage.removeItem('kv_token')
    localStorage.removeItem('kv_role')
    localStorage.removeItem('kv_user')
    set({ user: null, role: null, token: null, error: null })
  },
}))

// ── USER STORE ────────────────────────────────────────────────────────────
export const useUserStore = create((set) => ({
  keys:    [],
  loading: false,

  loadMe: async () => {
    set({ loading: true })
    try {
      const data = await authApi.me()
      set({ keys: data.keys, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  activateKey: async (keyCode) => {
    const data = await userApi.activate(keyCode)
    set(s => ({
      keys: s.keys.find(k => k.id === data.key.id)
        ? s.keys.map(k => k.id === data.key.id ? data.key : k)
        : [...s.keys, data.key]
    }))
    return data.key
  },
}))

// ── ADMIN STORE ───────────────────────────────────────────────────────────
export const useAdminStore = create((set) => ({
  stats:   null,
  keys:    [],
  users:   [],
  logs:    [],
  loading: false,

  loadStats: async () => {
    const s = await adminApi.stats()
    set({ stats: s })
  },

  loadKeys: async () => {
    set({ loading: true })
    const k = await adminApi.keys()
    set({ keys: k, loading: false })
  },

  createKeys: async (payload) => {
    const created = await adminApi.createKeys(payload)
    set(s => ({ keys: [...created, ...s.keys] }))
    return created
  },

  revokeKey: async (id) => {
    await adminApi.revokeKey(id)
    set(s => ({ keys: s.keys.map(k => k.id === id ? { ...k, revoked: true, status: 'revoked' } : k) }))
  },

  deleteKey: async (id) => {
    await adminApi.deleteKey(id)
    set(s => ({ keys: s.keys.filter(k => k.id !== id) }))
  },

  loadUsers: async () => {
    const u = await adminApi.users()
    set({ users: u })
  },

  deleteUser: async (id) => {
    await adminApi.deleteUser(id)
    set(s => ({ users: s.users.filter(u => u.id !== id) }))
  },

  loadLogs: async () => {
    const l = await adminApi.logs()
    set({ logs: l })
  },

  clearLogs: async () => {
    await adminApi.clearLogs()
    set({ logs: [] })
  },
}))
