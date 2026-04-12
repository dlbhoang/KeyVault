# Module Live Update System - Implementation Guide

## 📋 Overview

I've created a complete **module live update system** for KeyVault that allows:

1. ✅ **Users unlock modules based on their license key** - Only showed modules they have
2. ✅ **Live module-level updates** - Update individual modules instead of entire app
3. ✅ **Background update checking** - Desktop app checks for updates hourly
4. ✅ **Server file history tracking** - Admin can see who downloaded what
5. ✅ **Update notifications** - Users see available updates
6. ✅ **Key system unaffected** - License validation remains unchanged

## 🎯 What Was Created

### Backend Files

#### 1. `/backend/modules.js` - Module Management System
- **Module version tracking** - track version history for each module
- **Download history logging** - audit trail of module downloads
- **Update checking logic** - determine which modules have updates available
- **Module file serving** - prepare module files for download

Key Functions:
```javascript
getModuleVersion(moduleId)           // Get latest version
checkUpdates(userModules, versions)  // Check what's new
logModuleDownload(...)                // Record download
getModuleFile(...)                    // Retrieve module
getModuleDownloadHistory(...)         // Audit trail
```

#### 2. `/backend/server.js` - New API Endpoints
Extended with 5 new endpoints:

```
GET  /api/modules/versions
     Get current version of all modules

POST /api/modules/check-updates
     Check which modules user can update (requires valid key)

GET  /api/modules/:moduleId/download?version=1.2.0
     Download specific module (validates key access)

GET  /api/admin/modules/history
     View download history (admin only)

GET  /api/admin/modules/users-updates
     See which users need which updates (admin only)
```

### Frontend Files

#### 3. `/frontend/src/utils/api.js` - API Client Functions
Added two new API groups:
```javascript
moduleApi.getVersions()           // Get all module versions
moduleApi.checkUpdates(versions)  // Check for updates
moduleApi.downloadModule(id, ver) // Get download URL

adminModuleApi.getHistory()       // Get download history
adminModuleApi.getUsersUpdates()  // Get update report
```

#### 4. `/frontend/src/pages/UserModuleUpdates.jsx` - User Interface
Beautiful UI for users to:
- Check for available module updates
- See update details & changelogs
- Install updates or new modules
- View their installed modules
- Get real-time status updates

Features:
- 🔄 One-click update checking
- 📋 Sorted by priority (new modules, updates)
- 📊 File size & release date info
- ✅ Success/error feedback
- 📱 Responsive design

#### 5. `/frontend/src/pages/AdminModuleUpdates.jsx` - Admin Dashboard
Three-tab admin interface:

**Summary Tab:**
- Module grid view
- How the system works (guide)

**Users Needing Updates Tab:**
- List of users and their modules
- Which modules they need to install/update
- Update count per user

**Download History Tab:**
- Full audit trail
- Filter by module
- User email, version, timestamp
- Reason for download

### Documentation Files

#### 6. `/DESKTOP_APP_MODULE_UPDATES.md` - Desktop App Guide
Complete implementation guide showing:
- Architecture diagrams
- Service structure (ModuleManager, UpdateChecker, etc.)
- Code examples in JavaScript
- License validation
- File structure on user's computer
- Testing steps
- Key system safety explanation

## 🔄 How It Works

### User Level Flow

```
1. User has KeyVault Desktop App
   ↓
2. App loads license.key (has modules: [analytics, reports, crm])
   ↓
3. App validates license (not revoked, not expired)
   ↓
4. ModuleManager loads locally installed modules
   ↓
5. UpdateChecker background task starts (hourly)
   ↓
6. Checks: POST /api/modules/check-updates
   {desktopVersions: {analytics: "1.0.0", reports: "1.0.0"}}
   ↓
7. Server checks if user's key includes these modules ✓
   ↓
8. Server returns available updates
   ↓
9. App shows notification: "Update available: analytics 1.0.0 → 1.2.0"
   ↓
10. User clicks "Update"
   ↓
11. App downloads: GET /api/modules/analytics/download?version=1.2.0
    (Server validates key access before sending)
   ↓
12. App extracts to ~/.keyvault/modules/analytics/
   ↓
13. Module restarts, update complete!
```

### Admin Level Flow

```
Admin → Dashboard → Module Updates Tab
    ↓
    → Users Needing Updates
        Shows: John (3 modules, 2 updates available)
               Mary (2 modules, all up-to-date)
               ...
    ↓
    → Download History
        Shows: who downloaded what, when
               Filter by module to see trends
               Audit trail for compliance
```

## 🔐 Key System Safety Guarantee

The key validation system is **100% untouched**:

```
License Key Validation:
✓ Key code validation     (unchanged)
✓ Expiration checking     (unchanged)
✓ Module list in key      (unchanged) ← this controls what you see
✓ Revocation checking     (unchanged)
✓ User assignment         (unchanged)

Module Update System:
✓ Only adds new endpoints
✓ Validates key before download
✓ Never modifies key data
✓ Key expiry still blocks access
✓ Key revocation still blocks access

Result:
→ If user doesn't have "analytics" in their key, they can't see it
→ If key expires, all module downloads blocked
→ If key revoked, all modules (old and new) stop working
→ Key system works exactly as before
```

## 📋 API Endpoints Reference

### 1. GET /api/modules/versions
Public endpoint - no auth needed
```
Response:
{
  timestamp: "2026-04-12T10:00:00Z",
  modules: {
    analytics: {
      name: "Analytics",
      currentVersion: "1.2.0",
      lastUpdated: "2026-04-10T00:00:00Z",
      hash: "ghi789...",
      fileSize: 1080000
    },
    ...
  }
}
```

### 2. POST /api/modules/check-updates
**Required:** Valid user token
```
Request:
{
  desktopVersions: {
    analytics: "1.0.0",
    reports: "1.0.0"
  }
}

Response:
{
  timestamp: "2026-04-12T10:00:00Z",
  updates: [
    {
      moduleId: "analytics",
      type: "update",
      desktopVersion: "1.0.0",
      currentVersion: "1.2.0",
      changelog: "Performance optimization...",
      message: "Update available: 1.0.0 → 1.2.0"
    },
    {
      moduleId: "crm",
      type: "new",
      currentVersion: "1.0.0",
      message: "Module 'crm' available for installation"
    }
  ],
  totalAvailable: 2,
  userModules: ["analytics", "reports", "crm", "inventory"]
}
```

### 3. GET /api/modules/:moduleId/download
**Required:** Valid user token + key with module
```
Query params: ?version=1.2.0 (optional, defaults to latest)

Server checks:
1. Module exists?
2. User's key includes this module?
3. User's key is not revoked?
4. User's key is not expired?
5. Version exists?

If all pass → Download file + log in history
If fail → 403 Forbidden or 404 Not Found
```

### 4. GET /api/admin/modules/history
**Required:** Admin token
```
Query params: ?moduleId=analytics&limit=50

Response:
{
  timestamp: "2026-04-12T10:00:00Z",
  total: 5,
  records: [
    {
      moduleId: "analytics",
      version: "1.2.0",
      userEmail: "john@example.com",
      timestamp: "2026-04-12T09:15:00Z",
      reason: "user-download"
    },
    ...
  ]
}
```

### 5. GET /api/admin/modules/users-updates
**Required:** Admin token
```
Response:
{
  timestamp: "2026-04-12T10:00:00Z",
  totalUsers: 10,
  usersNeedingUpdates: 3,
  details: [
    {
      userId: "user-1",
      userEmail: "john@example.com",
      userName: "John Doe",
      modules: ["analytics", "reports", "crm"],
      updateCount: 2,
      availableUpdates: [
        {
          moduleId: "analytics",
          desktopVersion: "1.0.0",
          currentVersion: "1.2.0",
          changelog: "..."
        },
        ...
      ]
    },
    ...
  ]
}
```

## 🚀 Quick Start Testing

### 1. Start Backend
```bash
cd backend
npm install
npm start

# Should see:
# 🔑  KeyVault API  →  http://localhost:3001
# 📦 Module Update System available at:
#    GET  /api/modules/versions
#    POST /api/modules/check-updates
#    ...
```

### 2. Test Module Versions Endpoint
```bash
curl http://localhost:3001/api/modules/versions | jq
```

### 3. Check Updates (need auth token)
```bash
# First, login to get token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Copy the token, then check updates
curl -X POST http://localhost:3001/api/modules/check-updates \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "desktopVersions": {
      "analytics": "1.0.0",
      "reports": "1.0.0"
    }
  }'
```

### 4. Admin View History
```bash
# Login as admin first
curl -X POST http://localhost:3001/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'

# View download history
curl http://localhost:3001/api/admin/modules/history \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

## 📱 Frontend Integration

### Add Routes to `/frontend/src/App.jsx`
```javascript
// For users
<Route path="/portal/modules" element={
  <PrivateRoute requiredRole="user">
    <UserPortal />  {/* Add UserModuleUpdates inside */}
  </PrivateRoute>
}/>

// For admin
<Route path="/admin/modules" element={
  <PrivateRoute requiredRole="admin">
    <AdminLayout /> {/* Add AdminModuleUpdates tab */}
  </PrivateRoute>
}/>
```

### Add Navigation Links
```javascript
// In UserPortal.jsx
<NavLink to="/portal/modules">📦 My Modules</NavLink>

// In AdminLayout.jsx
<NavLink to="/admin/modules">📦 Module Updates</NavLink>
```

## ⚙️ Configuration

### Module Versions (Edit as Needed)
In `/backend/modules.js`, customize:
```javascript
const moduleVersions = {
  analytics: [
    { version: '1.0.0', ... },
    { version: '1.1.0', ... },
    { version: '1.2.0', ... }, // Add here
  ]
}
```

### Update Check Interval (Desktop App)
In `services/UpdateChecker.js`:
```javascript
this.checkInterval = 60 * 60 * 1000  // 1 hour
// Change to:
this.checkInterval = 30 * 60 * 1000  // 30 minutes
```

## 🔍 Monitoring

### Check System Health
```
GET /api/health
```

### View Admin Logs
```
GET /api/admin/logs
```

Shows all system activities including:
- Module downloads
- Update checks
- Key validations
- Any access denials

## 🐛 Troubleshooting

### User Can't See Update Button
**Cause:** Missing token or invalid session
**Fix:** Verify user token is stored and valid

### "Key not found" Error on Download
**Cause:** User's key doesn't include module
**Fix:** Check user's key has correct modules in `key.modules` array

### History Shows No Downloads
**Cause:** System just started, no downloads yet
**Fix:** Trigger download to populate history

### Module Won't Install
**Cause:** File path doesn't exist
**Fix:** Ensure `~/.keyvault/modules/` directory is created

## 📊 Database Schema (for reference)

Module versions stored as:
```javascript
{
  moduleId: "analytics",
  version: "1.2.0",
  releaseDate: "2026-04-10",
  hash: "ghi789...",
  fileSize: 1080000,
  changelog: "Performance optimization..."
}
```

Download history stored as:
```javascript
{
  id: "uuid",
  moduleId: "analytics",
  version: "1.2.0",
  userId: "user-id",
  userEmail: "user@example.com",
  timestamp: "2026-04-12T09:15:00Z",
  reason: "user-download"
}
```

## ✨ Next Steps

1. **Test the API** - Run the curl commands above
2. **Add UI Routes** - Add the new pages to navigation
3. **Build Desktop App** - Follow the desktop app guide
4. **Create Module Files** - Add actual module archives
5. **User Testing** - Invite beta testers
6. **Monitor** - Check download history regularly

## 🎓 Learning Resources

- See `/DESKTOP_APP_MODULE_UPDATES.md` for desktop implementation
- Review `/backend/modules.js` for version management
- Check `/backend/server.js` for API logic
- Study `UserModuleUpdates.jsx` for frontend implementation
- Read API docs above for endpoint details

## ❓ FAQ

**Q: Does this affect my current keys?**
A: No. Key validation is completely separate and unchanged.

**Q: Can I update modules without updating the entire app?**
A: Yes, that's the whole point! Only changed modules are downloaded.

**Q: What if a user's key expires?**
A: They can't download any modules (old or new). System is consistent.

**Q: Can users see modules they don't have keys for?**
A: No. Check-updates validates against their key's modules array.

**Q: Is there a size limit on modules?**
A: No hard limit, but fileSize field helps users decide.

**Q: How do I add a new version?**
A: Add to `moduleVersions[moduleId]` array in `modules.js`.

## 📞 Support

For questions about:
- **API Design:** See `/backend/server.js`
- **Module Logic:** See `/backend/modules.js`
- **Frontend UI:** See `/frontend/src/pages/UserModuleUpdates.jsx`
- **Desktop Integration:** See `/DESKTOP_APP_MODULE_UPDATES.md`
- **Admin Panel:** See `/frontend/src/pages/AdminModuleUpdates.jsx`

---

**Last Updated:** April 12, 2026
**System Status:** ✅ Ready for testing
