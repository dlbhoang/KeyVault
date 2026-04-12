# Integration Guide - Adding Module Update UI to Existing Pages

## For Users: Add to Portal

### Step 1: Update `/frontend/src/pages/UserPortal.jsx`

Add the import at the top:
```javascript
import UserModuleUpdates from './UserModuleUpdates'
```

Then add the route inside your Routes (if using sub-routes):
```javascript
<Route path="/modules" element={<UserModuleUpdates />} />
```

Or add as a tab/component on the main portal page.

### Step 2: Update Navigation in UserPortal

Add navigation link:
```javascript
import { Link } from 'react-router-dom'

// In the navigation/sidebar:
<Link to="/portal/modules" className="nav-link">
  📦 My Modules
</Link>
```

## For Admin: Add to Dashboard

### Step 1: Update `/frontend/src/pages/AdminLayout.jsx`

Add the import at the top:
```javascript
import AdminModuleUpdates from './AdminModuleUpdates'
```

Then add the route:
```javascript
<Route path="/modules" element={<AdminModuleUpdates />} />
```

### Step 2: Update Admin Navigation

Add tab or menu item:
```javascript
<Link to="/admin/modules" className="nav-link">
  📦 Module Updates
</Link>
```

## Complete Route Examples

### User Portal (UserPortal.jsx)
```javascript
import React from 'react'
import { Routes, Route } from 'react-router-dom'
import UserDashboard from './UserDashboard' // existing
import UserModuleUpdates from './UserModuleUpdates' // NEW

export default function UserPortal() {
  return (
    <div className="user-portal">
      <aside className="sidebar">
        <nav>
          <a href="/portal">🏠 Dashboard</a>
          <a href="/portal/modules">📦 My Modules</a>
          <a href="/portal/profile">👤 Profile</a>
        </nav>
      </aside>

      <main className="content">
        <Routes>
          <Route path="/" element={<UserDashboard />} />
          <Route path="/modules" element={<UserModuleUpdates />} />
        </Routes>
      </main>
    </div>
  )
}
```

### Admin Layout (AdminLayout.jsx)
```javascript
import React from 'react'
import { Routes, Route } from 'react-router-dom'
import AdminDashboard from './AdminDashboard' // existing
import AdminKeys from './AdminKeys' // existing
import AdminUsers from './AdminUsers' // existing
import AdminModuleUpdates from './AdminModuleUpdates' // NEW

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <nav>
          <a href="/admin">📊 Dashboard</a>
          <a href="/admin/keys">🔑 Keys</a>
          <a href="/admin/users">👥 Users</a>
          <a href="/admin/modules">📦 Module Updates</a>
          <a href="/admin/logs">📋 Logs</a>
        </nav>
      </aside>

      <main className="content">
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/keys" element={<AdminKeys />} />
          <Route path="/users" element={<AdminUsers />} />
          <Route path="/modules" element={<AdminModuleUpdates />} />
        </Routes>
      </main>
    </div>
  )
}
```

## Tab-Based Navigation (Alternative)

If your app uses tabs instead of routes:

### For User Portal:
```javascript
export default function UserPortal() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div>
      <div className="tabs">
        <button
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={activeTab === 'modules' ? 'active' : ''}
          onClick={() => setActiveTab('modules')}
        >
          📦 My Modules
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'dashboard' && <UserDashboard />}
        {activeTab === 'modules' && <UserModuleUpdates />}
      </div>
    </div>
  )
}
```

### For Admin:
```javascript
export default function AdminLayout() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div>
      <div className="tabs">
        <button
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={activeTab === 'keys' ? 'active' : ''}
          onClick={() => setActiveTab('keys')}
        >
          Keys
        </button>
        <button
          className={activeTab === 'modules' ? 'active' : ''}
          onClick={() => setActiveTab('modules')}
        >
          📦 Module Updates
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'dashboard' && <AdminDashboard />}
        {activeTab === 'keys' && <AdminKeys />}
        {activeTab === 'modules' && <AdminModuleUpdates />}
      </div>
    </div>
  )
}
```

## Styling Integration

The components come with built-in `<style jsx>` tags, so they should work out of the box.

But if you want to customize:

```javascript
// In UserModuleUpdates.jsx, modify the inline styles:
<style jsx>{`
  .user-module-updates {
    // Customize your theme colors
    background: var(--bg-color, #f9fafb);
  }
  
  .install-btn {
    background: var(--primary-color, #4f46e5);
  }
`}</style>
```

## Component Props (if you want to extend)

### UserModuleUpdates
```javascript
<UserModuleUpdates
  // No required props - uses API directly
  // Extend by adding props:
  // onUpdate={() => refetchData()}
  // showImportantOnly={true}
/>
```

### AdminModuleUpdates
```javascript
<AdminModuleUpdates
  // No required props - uses API directly
  // Extend by adding props:
  // defaultView="users"
  // exportData={true}
/>
```

## Testing the Integration

### 1. Check Router Setup
```bash
# Make sure your app uses React Router
npm list react-router-dom
```

### 2. Add Console Logs (temporary)
```javascript
useEffect(() => {
  console.log('✅ UserModuleUpdates mounted')
  return () => console.log('❌ UserModuleUpdates unmounted')
}, [])
```

### 3. Test Navigation
- Click the link to `/portal/modules` or `/admin/modules`
- Component should load
- Console should show mount message

### 4. Test API Calls
Open browser DevTools → Network tab
- Should see `/api/modules/check-updates` POST
- Should see `/api/admin/modules/history` GET (for admin)

## Troubleshooting Integration

### Components Not Showing
```
Check 1: Is import correct?
  import UserModuleUpdates from './UserModuleUpdates'

Check 2: Is route correct?
  <Route path="/modules" element={<UserModuleUpdates />} />

Check 3: Is path matching?
  Navigate to /portal/modules (not just /modules)

Check 4: Check console for errors
  Open DevTools → Console tab
```

### API Errors
```
Check 1: Is backend running?
  npm start (in backend directory)

Check 2: Is token available?
  Check localStorage.getItem('kv_token')

Check 3: Are headers correct?
  Check Network tab → Request Headers
```

### Styling Issues
```
Check 1: CSS conflicts?
  Check Inspect Element → Styles tab

Check 2: Dark mode?
  Components support light theme
  Add CSS variables for dark mode:
  --bg-color: #1f2937;
  --text-color: #f3f4f6;
```

## Example Full User Portal File

```javascript
// frontend/src/pages/UserPortal.jsx

import React, { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/index'
import UserDashboard from './UserPortal' // existing
import UserModuleUpdates from './UserModuleUpdates' // NEW

export default function UserPortalLayout() {
  const { logout } = useAuthStore()

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: '200px',
        background: '#f3f4f6',
        padding: '20px',
        borderRight: '1px solid #e5e7eb'
      }}>
        <h2 style={{ marginTop: 0 }}>🔑 KeyVault</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <a href="/portal" style={{
            padding: '10px',
            borderRadius: '6px',
            textDecoration: 'none',
            color: 'inherit'
          }}>
            📊 Dashboard
          </a>
          <a href="/portal/modules" style={{
            padding: '10px',
            borderRadius: '6px',
            textDecoration: 'none',
            color: 'inherit',
            background: '#e5e7eb'
          }}>
            📦 My Modules
          </a>
          <a href="/portal/profile" style={{
            padding: '10px',
            borderRadius: '6px',
            textDecoration: 'none',
            color: 'inherit'
          }}>
            👤 Profile
          </a>
          <button onClick={logout} style={{
            padding: '10px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}>
            🚪 Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '20px' }}>
        <Routes>
          <Route path="/" element={<UserDashboard />} />
          <Route path="/modules" element={<UserModuleUpdates />} />
        </Routes>
      </main>
    </div>
  )
}
```

## Example Full Admin Layout File

```javascript
// frontend/src/pages/AdminLayout.jsx

import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuthStore } from '../store/index'
import AdminDashboard from './AdminDashboard'
import AdminKeys from './AdminKeys'
import AdminUsers from './AdminUsers'
import AdminModuleUpdates from './AdminModuleUpdates' // NEW

export default function AdminLayout() {
  const { logout } = useAuthStore()

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: '220px',
        background: '#1f2937',
        color: 'white',
        padding: '20px',
        overflow: 'auto'
      }}>
        <h2 style={{ marginTop: 0 }}>🔑 KeyVault Admin</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <a href="/admin" style={{
            padding: '12px',
            borderRadius: '6px',
            textDecoration: 'none',
            color: 'white',
            background: '#374151'
          }}>
            📊 Dashboard
          </a>
          <a href="/admin/keys" style={{
            padding: '12px',
            borderRadius: '6px',
            textDecoration: 'none',
            color: 'white'
          }}>
            🔑 Keys Management
          </a>
          <a href="/admin/users" style={{
            padding: '12px',
            borderRadius: '6px',
            textDecoration: 'none',
            color: 'white'
          }}>
            👥 Users
          </a>
          <a href="/admin/modules" style={{
            padding: '12px',
            borderRadius: '6px',
            textDecoration: 'none',
            color: 'white'
          }}>
            📦 Module Updates
          </a>
          <a href="/admin/logs" style={{
            padding: '12px',
            borderRadius: '6px',
            textDecoration: 'none',
            color: 'white'
          }}>
            📋 System Logs
          </a>
          <button onClick={logout} style={{
            padding: '12px',
            background: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginTop: '20px'
          }}>
            🚪 Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/keys" element={<AdminKeys />} />
          <Route path="/users" element={<AdminUsers />} />
          <Route path="/modules" element={<AdminModuleUpdates />} />
        </Routes>
      </main>
    </div>
  )
}
```

## Checklist for Integration

- [ ] Import UserModuleUpdates in UserPortal
- [ ] Import AdminModuleUpdates in AdminLayout
- [ ] Add routes/tabs for both components
- [ ] Add navigation links
- [ ] Test navigation to new pages
- [ ] Check API calls in Network tab
- [ ] Verify styling looks good
- [ ] Test with different browsers
- [ ] Check mobile responsiveness
- [ ] Test error handling

## Next Steps

1. ✅ Backend is ready (api endpoints)
2. ✅ Frontend components are ready (UI)
3. ⏳ **You are here:** Integrate into routing
4. ⏳ Start frontend dev server
5. ⏳ Test in browser
6. ⏳ Build desktop app

See `/SYSTEM_SUMMARY.md` for quick start guide.
