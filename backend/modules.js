/**
 * Module Management & Versioning System
 * - Tracks versions of each module
 * - Manages module updates
 * - Validates user access to modules
 */

const { v4: uuidv4 } = require('uuid')
const { format } = require('date-fns')
const { MODULES } = require('./keyUtils')

// Module Update History (in-memory, extend with DB)
const moduleVersions = {
  analytics: [
    { version: '1.0.0', releaseDate: '2026-01-01', hash: 'abc123...', fileSize: 1024000, changelog: 'Initial release' },
    { version: '1.1.0', releaseDate: '2026-02-15', hash: 'def456...', fileSize: 1052000, changelog: 'Fixed charts, added export' },
    { version: '1.2.0', releaseDate: '2026-04-10', hash: 'ghi789...', fileSize: 1080000, changelog: 'Performance optimization, new filters' },
  ],
  reports: [
    { version: '1.0.0', releaseDate: '2026-01-05', hash: 'jkl012...', fileSize: 892000, changelog: 'Initial release' },
    { version: '1.1.0', releaseDate: '2026-03-20', hash: 'mno345...', fileSize: 920000, changelog: 'Added PDF export, custom templates' },
  ],
  crm: [
    { version: '1.0.0', releaseDate: '2026-01-10', hash: 'pqr678...', fileSize: 1544000, changelog: 'Initial release' },
  ],
  inventory: [
    { version: '1.0.0', releaseDate: '2026-02-01', hash: 'stu901...', fileSize: 2048000, changelog: 'Initial release' },
    { version: '1.0.1', releaseDate: '2026-04-05', hash: 'vwx234...', fileSize: 2076000, changelog: 'Bug fixes, barcode scanning' },
  ],
  hr: [
    { version: '1.0.0', releaseDate: '2026-01-15', hash: 'yza567...', fileSize: 1240000, changelog: 'Initial release' },
  ],
  finance: [
    { version: '1.0.0', releaseDate: '2026-01-20', hash: 'bcd890...', fileSize: 1808000, changelog: 'Initial release' },
    { version: '1.1.0', releaseDate: '2026-03-30', hash: 'efg123...', fileSize: 1856000, changelog: 'New tax calculations, audit trail' },
  ],
  ai: [
    { version: '1.0.0', releaseDate: '2026-02-10', hash: 'hij456...', fileSize: 3144000, changelog: 'Initial release - AI models' },
  ],
  api: [
    { version: '1.0.0', releaseDate: '2026-01-25', hash: 'klm789...', fileSize: 512000, changelog: 'Initial API SDK' },
    { version: '1.1.0', releaseDate: '2026-04-08', hash: 'nop012...', fileSize: 540000, changelog: 'Added webhooks, improved docs' },
  ],
}

// Track instances when modules are downloaded (file history)
const downloadHistory = []

/**
 * Get current version of a module
 */
function getModuleVersion(moduleId) {
  const versions = moduleVersions[moduleId]
  if (!versions || versions.length === 0) return null
  return versions[versions.length - 1]
}

/**
 * Get all versions of a module
 */
function getAllModuleVersions(moduleId) {
  return moduleVersions[moduleId] || []
}

/**
 * Get all module versions (for version check endpoint)
 */
function getAllModulesVersions() {
  const result = {}
  MODULES.forEach(mod => {
    const versions = moduleVersions[mod.id]
    if (versions && versions.length > 0) {
      result[mod.id] = {
        name: mod.name,
        currentVersion: versions[versions.length - 1].version,
        lastUpdated: versions[versions.length - 1].releaseDate,
        hash: versions[versions.length - 1].hash,
        fileSize: versions[versions.length - 1].fileSize,
      }
    }
  })
  return result
}

/**
 * Log module download (file history)
 * @param {string} moduleId - Module identifier
 * @param {string} version - Version downloaded
 * @param {object} user - User object {id, email}
 * @param {string} reason - Why downloaded (first-time, update, etc.)
 */
function logModuleDownload(moduleId, version, user, reason = 'download') {
  const record = {
    id: uuidv4(),
    moduleId,
    version,
    userId: user?.id || 'anonymous',
    userEmail: user?.email || 'unknown',
    timestamp: new Date().toISOString(),
    reason,
    ip: 'tracked-by-middleware', // Set by API middleware
  }
  downloadHistory.push(record)
  return record
}

/**
 * Get download history for a module (for server audit)
 */
function getModuleDownloadHistory(moduleId = null, limit = 100) {
  let records = downloadHistory
  if (moduleId) {
    records = records.filter(r => r.moduleId === moduleId)
  }
  return records.slice(-limit).reverse()
}

/**
 * Check what modules need updates
 * @param {array} userModules - Module IDs user has license for
 * @param {object} desktopVersions - Current versions on user's desktop {analytics: '1.0.0', ...}
 * @returns {array} - Modules with available updates
 */
function checkUpdates(userModules, desktopVersions = {}) {
  const updates = []
  
  userModules.forEach(moduleId => {
    const currentVersion = getModuleVersion(moduleId)
    if (!currentVersion) return // Module doesn't exist
    
    const desktopVersion = desktopVersions[moduleId]
    if (!desktopVersion) {
      // Module not installed yet - suggest installation
      updates.push({
        moduleId,
        type: 'new',
        currentVersion: currentVersion.version,
        desktopVersion: null,
        hash: currentVersion.hash,
        fileSize: currentVersion.fileSize,
        changelog: currentVersion.changelog,
        releaseDate: currentVersion.releaseDate,
        message: `Module "${moduleId}" available for installation`,
      })
    } else if (desktopVersion !== currentVersion.version) {
      // Update available
      updates.push({
        moduleId,
        type: 'update',
        currentVersion: currentVersion.version,
        desktopVersion,
        hash: currentVersion.hash,
        fileSize: currentVersion.fileSize,
        changelog: currentVersion.changelog,
        releaseDate: currentVersion.releaseDate,
        message: `Update available: ${desktopVersion} → ${currentVersion.version}`,
      })
    }
  })
  
  return updates
}

/**
 * Simulate module file download
 * Creates a file buffer for desktop app to use
 */
function getModuleFile(moduleId, version) {
  const versions = moduleVersions[moduleId]
  if (!versions) return null
  
  const moduleData = versions.find(v => v.version === version)
  if (!moduleData) {
    // Return latest version if specific version not found
    moduleData = versions[versions.length - 1]
  }
  
  // In real app: load actual module file from storage
  // For now: return metadata + stub
  return {
    moduleId,
    version: moduleData.version,
    name: `module-${moduleId}-${moduleData.version}`,
    fileName: `module-${moduleId}-${moduleData.version}.zip`,
    hash: moduleData.hash,
    fileSize: moduleData.fileSize,
    releaseDate: moduleData.releaseDate,
    changelog: moduleData.changelog,
    // In production: actual Buffer or stream
    buffer: Buffer.from(`Module: ${moduleId}\nVersion: ${moduleData.version}\nFile: stub`)
  }
}

module.exports = {
  // Exports
  moduleVersions,
  downloadHistory,
  
  // Functions
  getModuleVersion,
  getAllModuleVersions,
  getAllModulesVersions,
  logModuleDownload,
  getModuleDownloadHistory,
  checkUpdates,
  getModuleFile,
}
