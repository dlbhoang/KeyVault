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
  loading: [
    { version: '1.0.0', releaseDate: '2026-01-01', hash: 'ldg100...', fileSize: 980000, changelog: 'Initial release' },
  ],
  analysis: [
    { version: '1.0.0', releaseDate: '2026-01-05', hash: 'anl100...', fileSize: 2100000, changelog: 'Initial release' },
    { version: '1.1.0', releaseDate: '2026-03-20', hash: 'anl110...', fileSize: 2150000, changelog: 'Solver improvements' },
  ],
  reinforced_concrete: [
    { version: '1.0.0', releaseDate: '2026-01-10', hash: 'rcc100...', fileSize: 3200000, changelog: 'Initial release' },
  ],
  steel: [
    { version: '1.0.0', releaseDate: '2026-01-12', hash: 'stl100...', fileSize: 2800000, changelog: 'Initial release' },
  ],
  composite: [
    { version: '1.0.0', releaseDate: '2026-02-01', hash: 'cmp100...', fileSize: 1900000, changelog: 'Initial release' },
  ],
  timber: [
    { version: '1.0.0', releaseDate: '2026-02-08', hash: 'tmb100...', fileSize: 1650000, changelog: 'Initial release' },
  ],
  geotechnical: [
    { version: '1.0.0', releaseDate: '2026-01-18', hash: 'geo100...', fileSize: 2400000, changelog: 'Initial release' },
  ],
  connections: [
    { version: '1.0.0', releaseDate: '2026-01-22', hash: 'con100...', fileSize: 1400000, changelog: 'Initial release' },
  ],
  general: [
    { version: '1.0.0', releaseDate: '2026-01-25', hash: 'gen100...', fileSize: 890000, changelog: 'Initial release' },
    { version: '1.0.1', releaseDate: '2026-04-08', hash: 'gen101...', fileSize: 905000, changelog: 'Bug fixes' },
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
        groupCode: mod.groupCode,
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
 * @param {object} desktopVersions - Current versions on user's desktop {loading: '1.0.0', ...}
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
  
  let moduleData = versions.find(v => v.version === version)
  if (!moduleData) {
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
