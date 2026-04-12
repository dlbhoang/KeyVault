# Module Live Update System - Visual Architecture

## System Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DESKTOP USER'S COMPUTER                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ KeyVault Desktop Application                                       │ │
│  ├────────────────────────────────────────────────────────────────────┤ │
│  │                                                                    │ │
│  │ 1. Load License Key                                               │ │
│  │    ~/.keyvault/licenses/LICENSE.key                               │ │
│  │    ├─ Key Code: KV-ABC123-DEF456-GHI789-JKL012                    │ │
│  │    ├─ Plan: Full Access · 1 năm                                   │ │
│  │    ├─ Expires: 31/12/2026                                         │ │
│  │    └─ Modules: [analytics, reports, crm, inventory, hr]          │ │
│  │                                                                    │ │
│  │ 2. Validate License                                               │ │
│  │    ✓ Not revoked                                                  │ │
│  │    ✓ Not expired                                                  │ │
│  │    ✓ Checksum valid                                               │ │
│  │                                                                    │ │
│  │ 3. Initialize Module Manager                                      │ │
│  │    Allowed Modules: [analytics, reports, crm, inventory, hr]     │ │
│  │                                                                    │ │
│  │ 4. Load Installed Modules                                         │ │
│  │    ~/.keyvault/modules/                                           │ │
│  │    ├─ analytics/          (v1.0.0)                                │ │
│  │    ├─ reports/            (v1.0.0)                                │ │
│  │    ├─ crm/                (v1.0.0)                                │ │
│  │    ├─ inventory/          (v1.0.1)                                │ │
│  │    └─ hr/                 (NOT INSTALLED)                         │ │
│  │                                                                    │ │
│  │ 5. Start Update Checker (Background)                              │ │
│  │    Every 60 minutes:                                              │ │
│  │    SEND: {desktopVersions: {analytics: "1.0.0", ...}}            │ │
│  │                                                                    │ │
│  │ 6. Show Available Updates                                         │ │
│  │    📊 Analytics: 1.0.0 → 1.2.0 (Performance optimization)        │ │
│  │    📄 Reports: 1.0.0 → 1.1.0 (Added PDF export)                  │ │
│  │    👔 HR: [NEW] v1.0.0 (Install now)                             │ │
│  │                                                                    │ │
│  │ 7. User Installs Update                                           │ │
│  │    a) Click "Update Analytics"                                    │ │
│  │    b) App downloads module zip (not full app!)                    │ │
│  │    c) App extracts to ~/.keyvault/modules/analytics/              │ │
│  │    d) Updates version.json                                        │ │
│  │    e) Module restarts                                             │ │
│  │                                                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    ↕↕↕ HTTPS ↕↕↕                      │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                      KEYVAULT BACKEND SERVER                             │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ API Endpoints                                                      │ │
│  │                                                                    │ │
│  │ 1. GET /api/modules/versions                                      │ │
│  │    Response: {analytics: {version: 1.2.0, hash: abc123...}}      │ │
│  │                                                                    │ │
│  │ 2. POST /api/modules/check-updates                                │ │
│  │    Check: Is user's key valid? ✓                                  │ │
│  │    Compare: What versions are newer? → Send updates               │ │
│  │                                                                    │ │
│  │ 3. GET /api/modules/:id/download                                  │ │
│  │    Check: Does user's key include this module? ✓                  │ │
│  │    Check: Is key expired? ✗ (not expired)                         │ │
│  │    Check: Is key revoked? ✗ (not revoked)                         │ │
│  │    Check: Does version exist? ✓                                   │ │
│  │    ✅ ALLOW: Send module file                                      │ │
│  │    ❌ DENY: 403 Forbidden (key doesn't have module)                │ │
│  │                                                                    │ │
│  │ 4. GET /api/admin/modules/history                                 │ │
│  │    Log: [                                                         │ │
│  │      {moduleId: "analytics", version: "1.2.0", user: john@...}   │ │
│  │      {moduleId: "reports", version: "1.1.0", user: john@...}     │ │
│  │      {moduleId: "analytics", version: "1.2.0", user: mary@...}   │ │
│  │    ]                                                              │ │
│  │                                                                    │ │
│  │ 5. GET /api/admin/modules/users-updates                           │ │
│  │    Report:                                                        │ │
│  │    - John (5 modules): 2 updates available                        │ │
│  │    - Mary (3 modules): all up-to-date                             │ │
│  │    - Bob (7 modules): 4 updates available                         │ │
│  │                                                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ Module Versions Database                                          │ │
│  │                                                                    │ │
│  │ analytics:                                                        │ │
│  │   v1.0.0 (2026-01-01) - Initial release                          │ │
│  │   v1.1.0 (2026-02-15) - Fixed charts, added export               │ │
│  │   v1.2.0 (2026-04-10) - Performance optimization ← LATEST        │ │
│  │                                                                    │ │
│  │ reports:                                                          │ │
│  │   v1.0.0 (2026-01-05) - Initial release                          │ │
│  │   v1.1.0 (2026-03-20) - Added PDF export ← LATEST                │ │
│  │                                                                    │ │
│  │ crm, inventory, hr, finance, ai, api: [versions...]              │ │
│  │                                                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ Download History (Audit Trail)                                    │ │
│  │                                                                    │ │
│  │ 2026-04-12 09:15:30 | john@example.com | analytics v1.2.0 ✓     │ │
│  │ 2026-04-12 09:16:15 | john@example.com | reports v1.1.0 ✓       │ │
│  │ 2026-04-12 10:30:45 | mary@example.com | analytics v1.2.0 ✓     │ │
│  │ 2026-04-12 11:45:20 | bob@example.com  | crm v1.0.0 ❌ (no key) │ │
│  │ 2026-04-12 12:00:00 | john@example.com | hr v1.0.0 ✓            │ │
│  │                                                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ Key Validation (Still Works Exactly Same)                         │ │
│  │                                                                    │ │
│  │ User's License Key: KV-ABC123-DEF456-GHI789-JKL012                │ │
│  │                                                                    │ │
│  │ Before Module Download:                                           │ │
│  │ 1. Check: Key exists           ✓                                  │ │
│  │ 2. Check: Key format valid     ✓                                  │ │
│  │ 3. Check: Key not revoked      ✓                                  │ │
│  │ 4. Check: Key not expired      ✓  (expires 31/12/2026)           │ │
│  │ 5. Check: Key has module       ✓  (analytics in module list)     │ │
│  │                                                                    │ │
│  │ All pass → Download allowed                                       │ │
│  │ Any fail → 403 Forbidden or 404 Not Found                         │ │
│  │                                                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## User Update Flow (Sequence Diagram)

```
Desktop App                    Backend Server
    │                                 │
    │─── 1. POST /modules/check ──────>│
    │     (desktopVersions)             │
    │                                   │
    │<──────── Check Key ────────────────>│
    │     (Is valid? Has modules?)      │
    │                                   │
    │<── 2. List available updates ────│
    │     {analytics: 1.0→1.2,         │
    │      reports: 1.0→1.1,           │
    │      hr: new→1.0}                │
    │                                   │
    │ [Show notification to user]       │
    │                                   │
    │─── 3. GET /modules/analytics/download ──>│
    │         ?version=1.2.0             │
    │                                   │
    │<──── Validate Key ────────────────>│
    │  (Has analytics? Expired? Revoked?)│
    │                                   │
    │<── 4. Send module file ──────────│
    │    (+ log in history)             │
    │                                   │
    │ [Extract to ~.keyvault/modules/]  │
    │                                   │
    │ [Show success: "Analytics v1.2.0"]│
    │                                   │
```

## Admin Dashboard View

```
┌──────────────────────────────────────────────────────────┐
│ Module Update Management                                 │
├──────────────────────────────────────────────────────────┤
│ [Summary] [Users Needing Updates] [Download History]    │
└──────────────────────────────────────────────────────────┘

TAB 1: Summary
┌────────────────────────────────────┐
│ 📦 8 Modules:                       │
│                                    │
│ 📊 Analytics  📄 Reports  🤝 CRM   │
│ 📦 Inventory  👔 HR Manager         │
│ 💰 Finance    🤖 AI Tools  🔌 API │
│                                    │
│ How the system works...            │
└────────────────────────────────────┘

TAB 2: Users Needing Updates
┌──────────────────────────────────────┐
│ Total Users: 15                      │
│ Needing Updates: 8                   │
│                                      │
│ 👤 John Doe (john@example.com)      │
│    3 modules | 2 updates available   │
│    • analytics: 1.0.0 → 1.2.0       │
│    • reports: 1.0.0 → 1.1.0         │
│                                      │
│ 👤 Mary Smith (mary@example.com)    │
│    5 modules | All up-to-date        │
│                                      │
│ 👤 Bob Johnson (bob@example.com)    │
│    2 modules | 1 update available    │
│    • crm: 1.0.0 → 1.0.0 (New)      │
│                                      │
│ [... more users ...]                │
└──────────────────────────────────────┘

TAB 3: Download History
┌───────────────────────────────────────────────┐
│ Filter: [All Modules ▼] [Refresh]            │
│                                               │
│ Module    Version   User        Date    Reason│
│───────────────────────────────────────────────│
│analytics  v1.2.0   john@ex...  14:15  download│
│reports    v1.1.0   john@ex...  14:16  download│
│analytics  v1.2.0   mary@ex...  15:30  download│
│crm        v1.0.0   bob@ex...   16:45  blocked │
│inventory  v1.0.1   alice@ex... 17:00  download│
│───────────────────────────────────────────────│
└───────────────────────────────────────────────┘
```

## User Module Updates Screen

```
┌─────────────────────────────────────────────────────────┐
│ 📦 My Modules                      [🔄 Check Updates]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ⬆️ AVAILABLE UPDATES (2)                                │
│ ┌─────────────────────────────────────────────────────┐│
│ │ 📊 Analytics                    [UPDATE]            ││
│ │ Current: v1.0.0 → Available: v1.2.0                ││
│ │ What's new:                                        ││
│ │ Performance optimization, new filters             ││
│ │ Released: 10/04/2026                             ││
│ │ Size: 1.08 MB                  [⬇️ Update]        ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │ 📄 Reports                      [UPDATE]            ││
│ │ Current: v1.0.0 → Available: v1.1.0                ││
│ │ What's new:                                        ││
│ │ Added PDF export, custom templates                 ││
│ │ Released: 20/03/2026                             ││
│ │ Size: 0.92 MB                  [⬇️ Update]        ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ ✨ NEW MODULES (1)                                    │
│ ┌─────────────────────────────────────────────────────┐│
│ │ 👔 HR Manager                    [NEW]             ││
│ │ Available: v1.0.0                                  ││
│ │ Description: Complete HR management module         ││
│ │ Released: 01/04/2026                             ││
│ │ Size: 1.24 MB                  [⬇️ Install]       ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ 📋 YOUR INSTALLED MODULES                              │
│ • analytics       v1.0.0                               │
│ • reports         v1.0.0                               │
│ • crm             v1.0.0                               │
│ • inventory       v1.0.1                               │
│                                                         │
│ ℹ️ How Updates Work                                    │
│ 1. Your app checks for updates automatically           │
│ 2. You'll see notifications when ready                │
│ 3. Updates are optional                               │
│ 4. Only changed modules download                      │
│ 5. Your license key is never affected                 │
└─────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌────────────────┐
│  Desktop App   │
│                │
│ Loads License  │
│      Key       │
└────────────────┘
        │
        ├─────────────────────────────────────────┐
        │                                         │
        v                                         v
┌───────────────────┐               ┌─────────────────────┐
│ Validate License  │               │ Load Local Modules  │
│  • Not revoked    │               │                     │
│  • Not expired    │               │ ~/.keyvault/modules/│
│  • Checksum OK    │               └─────────────────────┘
└───────────────────┘                         │
        │                                     │
        └─────────────────┬───────────────────┘
                          │
                          v
                ┌────────────────────┐
                │ Start Update Check │
                │ (Hourly)           │
                └────────────────────┘
                          │
                          v
        ┌─────────────────────────────────┐
        │ POST /api/modules/check-updates │
        │ {analytics: "1.0.0", ...}       │
        └─────────────────────────────────┘
                          │
                          v
        ┌─────────────────────────────────┐
        │   Backend Checks Key Access     │
        │   • User exists?                │
        │   • Key valid?                  │
        │   • Has modules?                │
        │   • Expired?                    │
        │   • Revoked?                    │
        └─────────────────────────────────┘
                          │
                    ┌─────┴─────┐
                    │           │
        ┌───────────v      ┌────v─────────┐
        │ KEY OK: Return   │ KEY INVALID:  │
        │ available        │ Block access  │
        │ updates          │ 403 or 404    │
        └───────────┬      └───────────────┘
                    │
                    v
        ┌──────────────────────────┐
        │ Show Notification        │
        │ "Analytics 1.0→1.2 Ready"│
        └──────────────────────────┘
                    │
                    v
        ┌──────────────────────────┐
        │ User Clicks "Update"     │
        └──────────────────────────┘
                    │
                    v
        ┌──────────────────────────────────┐
        │ GET /api/modules/analytics/      │
        │     download?version=1.2.0       │
        └──────────────────────────────────┘
                    │
                    v
        ┌─────────────────────────────────┐
        │ Backend Validates Again:        │
        │ • Module exists?                │
        │ • User has key?                 │
        │ • Key has module?               │
        │ • Version exists?               │
        └─────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
   ┌────v─────────┐   ┌────────v──────┐
   │ ALLOWED:     │   │ DENIED: 403   │
   │ Send module  │   │ or 404        │
   │ + Log        │   └───────────────┘
   │   history    │
   └────┬─────────┘
        │
        v
┌───────────────────────┐
│ Download Complete     │
│ Extract to modules/   │
│ Update version.json   │
│ Show "Success"        │
│ Module ready to use   │
└───────────────────────┘
```

## Key Validation Decision Tree (CRITICAL)

```
User requests module download
        │
        ├─ Module exists? ──NO──> 404 Not Found
        │
        ├─ User logged in? ──NO──> 401 Unauthorized
        │
        ├─ User's key exists? ──NO──> 403 Forbidden
        │
        ├─ Key is revoked? ──YES──> 403 Forbidden (Key Revoked)
        │
        ├─ Key is expired? ──YES──> 403 Forbidden (Key Expired)
        │
        ├─ Module in key.modules list? ──NO──> 403 Forbidden
        │
        ├─ Version exists? ──NO──> 404 Not Found
        │
        └─ ALL CHECKS PASS ──YES──>
                    │
                    v
            ┌───────────────────┐
            │ Send Module File  │
            │ Log in History    │
            │ Return 200 OK     │
            └───────────────────┘
```

This demonstrates that **key validation happens at every single module download**, making the system completely safe and secure.
