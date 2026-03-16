import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from './store/index.js'
import Landing from './pages/Landing.jsx'
import { AdminLogin, UserLogin, UserRegister, ForgotPassword, ResetPassword } from './pages/Auth.jsx'
import AdminLayout from './pages/AdminLayout.jsx'
import UserPortal from './pages/UserPortal.jsx'

const transition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -12 },
  transition: { duration: .2 }
}

function Wrap({ children }) {
  return (
    <motion.div {...transition} style={{ minHeight: '100vh' }}>
      {children}
    </motion.div>
  )
}

// Guard: chưa login → về /login hoặc /admin/login
function PrivateRoute({ children, requiredRole }) {
  const { role, token } = useAuthStore()
  if (!token) {
    return <Navigate to={requiredRole === 'admin' ? '/admin/login' : '/login'} replace />
  }
  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/" replace />
  }
  return children
}

function AnimatedRoutes() {
  const location = useLocation()
  const { role, token, init } = useAuthStore()

  useEffect(() => { init() }, [])

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>

        {/* Trang chủ */}
        <Route path="/" element={
          token
            ? <Navigate to={role === 'admin' ? '/admin' : '/portal'} replace />
            : <Wrap><Landing /></Wrap>
        }/>

        {/* Auth pages */}
        <Route path="/login"            element={<Wrap><UserLogin /></Wrap>} />
        <Route path="/register"         element={<Wrap><UserRegister /></Wrap>} />
        <Route path="/forgot-password"  element={<Wrap><ForgotPassword /></Wrap>} />
        <Route path="/reset-password/:token" element={<Wrap><ResetPassword /></Wrap>} />

        {/* Admin login — PHẢI đặt TRƯỚC /admin/* */}
        <Route path="/admin/login" element={
          token && role === 'admin'
            ? <Navigate to="/admin" replace />
            : <Wrap><AdminLogin /></Wrap>
        }/>

        {/* Admin panel — protected */}
        <Route path="/admin/*" element={
          <PrivateRoute requiredRole="admin">
            <Wrap><AdminLayout /></Wrap>
          </PrivateRoute>
        }/>

        {/* User portal — protected */}
        <Route path="/portal/*" element={
          <PrivateRoute requiredRole="user">
            <Wrap><UserPortal /></Wrap>
          </PrivateRoute>
        }/>

        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  )
}