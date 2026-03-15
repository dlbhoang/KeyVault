import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from './store/index.js'
import Landing from './pages/Landing.jsx'
import { AdminLogin, UserLogin, UserRegister, ForgotPassword, ResetPassword } from './pages/Auth.jsx'
import AdminLayout from './pages/AdminLayout.jsx'
import UserPortal from './pages/UserPortal.jsx'

export default function App() {
  const { role, token, init } = useAuthStore()
  const [view, setView] = useState('landing')
  const [resetToken, setResetToken] = useState('')
  const [isAdminRoute, setIsAdminRoute] = useState(false)

  useEffect(() => {
    const path = window.location.pathname

    if (path === '/admin' || path.startsWith('/admin/')) {
      setIsAdminRoute(true)
      setView('adminLogin')
      return
    }

    init().then(() => {
      const r = localStorage.getItem('kv_role')
      if (r === 'admin') setView('adminPanel')
      else if (r === 'user') setView('userPortal')
    })
  }, [])

  useEffect(() => {
    if (isAdminRoute) return

    if (!token) {
      setView('landing')
      return
    }

    if (role === 'admin') setView('adminPanel')
    else if (role === 'user') setView('userPortal')
  }, [role, token, isAdminRoute])

  const go = (v, extra) => {
    if (extra?.resetToken) setResetToken(extra.resetToken)
    setView(v)
  }

  const transition = {
    initial: { opacity:0, y:12 },
    animate: { opacity:1, y:0 },
    exit: { opacity:0, y:-12 },
    transition: { duration:.2 }
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div key={view} {...transition} style={{ minHeight:'100vh' }}>

        {view === 'landing' && (
          <Landing
            onUserLogin={()=>go('userLogin')}
            onUserRegister={()=>go('userRegister')}
          />
        )}

        {view === 'adminLogin' && (
          <AdminLogin
            onSuccess={()=>go('adminPanel')}
            onBack={()=>go('landing')}
          />
        )}

        {view === 'userLogin' && (
          <UserLogin
            onSuccess={()=>go('userPortal')}
            onRegister={()=>go('userRegister')}
            onForgot={()=>go('forgotPassword')}
            onBack={()=>go('landing')}
          />
        )}

        {view === 'userRegister' && (
          <UserRegister
            onSuccess={()=>go('userPortal')}
            onLogin={()=>go('userLogin')}
            onBack={()=>go('landing')}
          />
        )}

        {view === 'forgotPassword' && (
          <ForgotPassword onBack={()=>go('userLogin')} />
        )}

        {view === 'resetPassword' && (
          <ResetPassword
            token={resetToken}
            onSuccess={()=>go('userLogin')}
            onBack={()=>go('userLogin')}
          />
        )}

        {view === 'adminPanel' && <AdminLayout />}
        {view === 'userPortal' && <UserPortal />}

      </motion.div>
    </AnimatePresence>
  )
}