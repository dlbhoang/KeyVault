# KeyVault Desktop App - Module Live Update System

## Overview
This document shows how a desktop app should integrate with the KeyVault module live update system.

## Architecture

```
Desktop App Structure:
┌─────────────────────────────────────┐
│  KeyVault Desktop Application       │
├─────────────────────────────────────┤
│ Core (Always Active)                │
│ - License validation                │
│ - Module manager                    │
│ - Update checker                    │
│ - Notification system               │
├─────────────────────────────────────┤
│ Modules (Licensed)                  │
│ ├─ /modules/analytics/v1.2.0       │
│ ├─ /modules/reports/v1.1.0         │
│ ├─ /modules/crm/v1.0.0             │
│ └─ /modules/inventory/v1.0.1       │
└─────────────────────────────────────┘

        ↓↑ (API Calls)

┌─────────────────────────────────────┐
│  KeyVault Server (Node.js)          │
├─────────────────────────────────────┤
│ /api/modules/versions               │
│ /api/modules/check-updates          │
│ /api/modules/:id/download           │
│ /api/admin/modules/history          │
└─────────────────────────────────────┘
```

## Key Principles

1. **No Full App Updates** - Only update changed modules
2. **License Validation** - Check key before downloading
3. **Version Tracking** - Each module tracks its own version
4. **File History** - Server logs who downloaded what when
5. **Background Updates** - App checks updates silently
6. **User Notifications** - Only notify when updates available

## Desktop App Implementation Example

### 1. Initialize App with License Key

```javascript
// main.js
import { ModuleManager } from './services/ModuleManager'
import { LicenseValidator } from './services/LicenseValidator'
import { UpdateChecker } from './services/UpdateChecker'

class KeyVaultApp {
  constructor() {
    this.license = null
    this.modules = null
    this.updateChecker = null
  }

  async init() {
    // 1. Load user's license
    this.license = await this.loadLicense()
    
    // 2. Validate license
    const isValid = await LicenseValidator.validate(this.license)
    if (!isValid) {
      this.showError('License invalid or expired')
      return
    }
    
    // 3. Initialize module manager with licensed modules
    this.modules = new ModuleManager(this.license.modules)
    
    // 4. Load locally installed modules
    await this.modules.loadLocalModules()
    
    // 5. Start background update checker
    this.updateChecker = new UpdateChecker(this.modules, this.license)
    this.updateChecker.start()
    
    // 6. Render available modules
    this.renderUI()
  }

  async loadLicense() {
    // License stored in license.key file from KeyVault activation
    // Format: LICENSE.key (text file with key details)
    const fs = require('fs')
    const path = require('path')
    
    const licensePath = path.join(
      process.env.HOME,
      '.keyvault',
      'licenses',
      'LICENSE.key'
    )
    
    try {
      const content = fs.readFileSync(licensePath, 'utf-8')
      return this.parseLicenseFile(content)
    } catch (e) {
      console.error('License not found:', e)
      return null
    }
  }

  parseLicenseFile(content) {
    // Parse LICENSE.key format
    const lines = content.split('\n')
    const data = {}
    
    let currentSection = null
    lines.forEach(line => {
      const trimmed = line.trim()
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        currentSection = trimmed.slice(1, -1)
        data[currentSection] = {}
      } else if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...values] = trimmed.split('=')
        if (key && values.length > 0) {
          data[currentSection][key.trim()] = values.join('=').trim()
        }
      }
    })
    
    return {
      key: data.LICENSE?.Key || '',
      plan: data.LICENSE?.Plan || '',
      email: data.LICENSE?.Email || '',
      expires: data.LICENSE?.Expires || '',
      modules: Object.keys(data.MODULES || {}),
    }
  }

  renderUI() {
    // Show only licensed modules
    const unlockedModules = this.modules.getAvailable()
    // Update UI with available modules
  }
}

const app = new KeyVaultApp()
app.init()
```

### 2. Module Manager Service

```javascript
// services/ModuleManager.js
import fs from 'fs'
import path from 'path'
import { UnzipService } from './UnzipService'

export class ModuleManager {
  constructor(licenseModules) {
    this.licenseModules = licenseModules // Modules in license file
    this.installedModules = {} // Local installed modules
    this.modulesPath = path.join(
      process.env.HOME || process.env.USERPROFILE,
      '.keyvault',
      'modules'
    )
  }

  /**
   * Load locally installed modules and their versions
   */
  async loadLocalModules() {
    if (!fs.existsSync(this.modulesPath)) {
      return
    }

    const dirs = fs.readdirSync(this.modulesPath)
    
    for (const dir of dirs) {
      const modulePath = path.join(this.modulesPath, dir)
      const versionFilePath = path.join(modulePath, 'version.json')
      
      if (fs.existsSync(versionFilePath)) {
        const versionData = JSON.parse(
          fs.readFileSync(versionFilePath, 'utf-8')
        )
        this.installedModules[dir] = versionData
      }
    }
  }

  /**
   * Get available modules (licensed + installed)
   */
  getAvailable() {
    return this.licenseModules.map(modId => ({
      id: modId,
      installed: !!this.installedModules[modId],
      version: this.installedModules[modId]?.version || null,
    }))
  }

  /**
   * Install/update a module
   */
  async installModule(moduleId, downloadUrl) {
    try {
      // 1. Download module zip
      const zipPath = await this.downloadModule(downloadUrl)
      
      // 2. Extract to modules folder
      const targetPath = path.join(this.modulesPath, moduleId)
      await UnzipService.extract(zipPath, targetPath)
      
      // 3. Update version tracking
      const versionFile = path.join(targetPath, 'version.json')
      const versionData = JSON.parse(
        fs.readFileSync(versionFile, 'utf-8')
      )
      
      this.installedModules[moduleId] = versionData
      
      // 4. Restart module if it's running
      this.restartModule(moduleId)
      
      return true
    } catch (e) {
      console.error(`Failed to install ${moduleId}:`, e)
      return false
    }
  }

  /**
   * Get installed versions
   */
  getInstalledVersions() {
    const versions = {}
    Object.entries(this.installedModules).forEach(([id, data]) => {
      versions[id] = data.version
    })
    return versions
  }

  private async downloadModule(url) {
    // Download and save to temp directory
    // Return path to downloaded file
  }

  private restartModule(moduleId) {
    // Send event to main app to restart the module
    // This prevents disrupting user's active work
  }
}
```

### 3. Update Checker Service (Background Task)

```javascript
// services/UpdateChecker.js
import { moduleApi } from '../api'
import * as store from './store'

export class UpdateChecker {
  constructor(moduleManager, license) {
    this.moduleManager = moduleManager
    this.license = license
    this.checkInterval = 60 * 60 * 1000 // Check every hour
    this.isChecking = false
  }

  start() {
    // Initial check
    this.check()
    
    // Periodic check
    this.intervalId = setInterval(() => this.check(), this.checkInterval)
    
    console.log('Update checker started (hourly)')
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }
  }

  /**
   * Check for available updates
   */
  async check() {
    if (this.isChecking) return
    
    try {
      this.isChecking = true
      
      // Get installed versions
      const installed = this.moduleManager.getInstalledVersions()
      
      // Call server API
      const result = await moduleApi.checkUpdates(installed)
      
      // Handle updates
      if (result.updates && result.updates.length > 0) {
        this.handleUpdatesAvailable(result.updates)
      }
    } catch (e) {
      console.error('Update check failed:', e)
    } finally {
      this.isChecking = false
    }
  }

  /**
   * Process available updates
   */
  handleUpdatesAvailable(updates) {
    console.log(`Found ${updates.length} available updates`)
    
    // Categorize updates
    const newModules = updates.filter(u => u.type === 'new')
    const moduleUpdates = updates.filter(u => u.type === 'update')
    
    // Store for UI to display
    store.setAvailableUpdates({
      new: newModules,
      updates: moduleUpdates,
    })
    
    // Show notification
    if (moduleUpdates.length > 0) {
      this.notifyUser(
        `${moduleUpdates.length} module updates available`,
        moduleUpdates.map(u => `${u.moduleId}: ${u.currentVersion}`).join(', ')
      )
    }
    
    if (newModules.length > 0) {
      this.notifyUser(
        `${newModules.length} new modules available`,
        newModules.map(u => u.moduleId).join(', ')
      )
    }
  }

  notifyUser(title, message) {
    // Send desktop notification or emit event
    const { ipcMain } = require('electron')
    ipcMain.emit('update-available', { title, message })
  }
}
```

### 4. Update Notification UI

```javascript
// components/UpdateNotification.jsx
import React, { useEffect, useState } from 'react'
import { moduleApi } from '../api/module'
import * as store from '../store'

export default function UpdateNotification() {
  const [updates, setUpdates] = useState(null)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    // Subscribe to updates
    const unsubscribe = store.subscribe(state => {
      if (state.availableUpdates) {
        setUpdates(state.availableUpdates)
      }
    })
    
    return unsubscribe
  }, [])

  if (!updates || (updates.new.length === 0 && updates.updates.length === 0)) {
    return null
  }

  const handleInstall = async (moduleId, version) => {
    setInstalling(true)
    try {
      // Get download URL
      const downloadUrl = moduleApi.downloadModule(moduleId, version)
      
      // Trigger module installation
      await ipcRenderer.invoke('install-module', {
        moduleId,
        downloadUrl,
      })
      
      // Remove from pending updates
      store.removeUpdate(moduleId)
    } catch (e) {
      alert(`Failed to install: ${e.message}`)
    } finally {
      setInstalling(false)
    }
  }

  return (
    <div className="update-notification">
      <h3>📦 Updates Available</h3>
      
      {updates.updates.length > 0 && (
        <div className="updates-section">
          <h4>Module Updates</h4>
          <ul>
            {updates.updates.map(u => (
              <li key={u.moduleId}>
                <span>{u.moduleId}</span>
                <span>{u.desktopVersion} → {u.currentVersion}</span>
                <p>{u.changelog}</p>
                <button
                  onClick={() => handleInstall(u.moduleId, u.currentVersion)}
                  disabled={installing}
                >
                  Update
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {updates.new.length > 0 && (
        <div className="new-modules-section">
          <h4>New Modules</h4>
          <ul>
            {updates.new.map(u => (
              <li key={u.moduleId}>
                <span>{u.moduleId}</span>
                <span>v{u.currentVersion}</span>
                <p>{u.changelog}</p>
                <button
                  onClick={() => handleInstall(u.moduleId, u.currentVersion)}
                  disabled={installing}
                >
                  Install
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
```

### 5. License Validation

```javascript
// services/LicenseValidator.js
export class LicenseValidator {
  /**
   * Validate license file
   */
  static async validate(license) {
    if (!license) return false
    
    // Check expiration
    const expiryDate = new Date(license.expires)
    if (expiryDate < new Date()) {
      console.log('License expired:', license.expires)
      return false
    }
    
    // Check key format
    if (!license.key.match(/^KV-[A-Z0-9]{6}-[A-Z0-9]{6}-[A-Z0-9]{6}-[A-Z0-9]{6}$/)) {
      console.log('Invalid key format')
      return false
    }
    
    // Optional: Verify checksum
    const checksum = license.checksum
    if (checksum && !this.verifyChecksum(license, checksum)) {
      console.log('Checksum mismatch')
      return false
    }
    
    return true
  }

  static verifyChecksum(license, checksum) {
    const crypto = require('crypto')
    const data = license.key + license.expires
    const computed = Buffer.from(data).toString('base64').slice(0, 32)
    return computed === checksum
  }
}
```

## API Integration Flow

### On App Startup
```
1. App loads license.key file
2. Validates license (expires_at, modules, etc.)
3. Initializes ModuleManager with licensed modules
4. Loads local installed modules
5. Renders UI with only licensed modules
6. Starts UpdateChecker background task
```

### When Update Checker Runs (Hourly)
```
1. Get installed module versions {analytics: "1.0.0", ...}
2. POST /api/modules/check-updates {desktopVersions}
3. Server returns list of available updates
4. App displays notification with changelog
5. User can install updates on-demand
```

### When User Clicks Install
```
1. Call GET /api/modules/:moduleId/download?version=1.2.0
2. Server validates user's license includes module
3. Server logs download in history
4. App downloads module zip
5. App extracts to ~/.keyvault/modules/:moduleId/
6. App updates version.json
7. Module restarts or is available on next app open
```

## File Structure on User's Computer

```
~/.keyvault/
├── licenses/
│   └── LICENSE.key                 (Key info, module list)
├── modules/
│   ├── analytics/
│   │   ├── version.json            {"version": "1.2.0"}
│   │   ├── manifest.json           (Module metadata)
│   │   ├── index.js                (Module entry point)
│   │   └── [module files...]
│   ├── reports/
│   ├── crm/
│   └── ...
└── config/
    └── app-config.json             (Last check times, settings)
```

## Server File History

Admin can see what was downloaded by visiting:
```
GET /api/admin/modules/history?moduleId=analytics&limit=50
```

Response:
```json
{
  "timestamp": "2026-04-12T10:30:00Z",
  "total": 25,
  "records": [
    {
      "moduleId": "analytics",
      "version": "1.2.0",
      "userEmail": "john@example.com",
      "timestamp": "2026-04-12T09:15:00Z",
      "reason": "user-download"
    },
    ...
  ]
}
```

## Important: Key System Is NOT Affected

The module update system **does not change** the key validation:
- License keys still control module access
- Key expiration still prevents access
- Key revocation still blocks all modules
- Download history is just for admin reporting
- User's key data is never modified

The flow is:
```
1. Key determines what MODULES user can access ✓ (unchanged)
2. Update checker checks which modules have updates ✓ (new system)
3. User can DOWNLOAD module versions they have license for ✓ (new system)
4. Key status never changes due to updates ✓ (safe)
```

## Testing

To test locally:

```bash
# 1. Start backend
cd backend
npm install
npm start

# 2. Test API endpoints
curl http://localhost:3001/api/modules/versions

curl -X POST http://localhost:3001/api/modules/check-updates \
  -H "Authorization: Bearer <user-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "desktopVersions": {
      "analytics": "1.0.0",
      "reports": "1.0.0"
    }
  }'

# 3. Download a module
curl http://localhost:3001/api/modules/analytics/download?version=1.2.0 \
  -H "Authorization: Bearer <user-token>" \
  -o module-analytics.zip
```

## Summary

✅ **What This System Provides:**
- Individual module updates (not full app)
- Live update checking (background, hourly)
- User-triggered installations (not automatic)
- Server-side audit trail
- Key-based access control (unchanged)
- Update notifications

❌ **What This System Does NOT Do:**
- Force updates to users
- Change key validation logic
- Modify user data
- Create new key dependencies
