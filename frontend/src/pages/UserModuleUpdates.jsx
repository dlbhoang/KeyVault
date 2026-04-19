import React, { useEffect, useState } from 'react'
import { moduleApi } from '../../utils/api'

/**
 * User Module Updates Component
 * Shows available module updates and allows installation
 */

export default function UserModuleUpdates() {
  const [updates, setUpdates] = useState(null)
  const [installedVersions, setInstalledVersions] = useState({})
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [installing, setInstalling] = useState(null)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [lastCheck, setLastCheck] = useState(null)

  useEffect(() => {
    checkUpdates()
  }, [])

  const checkUpdates = async () => {
    setChecking(true)
    setError(null)
    try {
      // In real app: load installed versions from ~/.keyvault/modules/
      // For demo: use mock versions
      const mockVersions = {
        loading: '1.0.0',
        analysis: '1.0.0',
        steel: '1.0.0',
        general: '1.0.0',
      }

      const result = await moduleApi.checkUpdates(mockVersions)
      setUpdates(result.updates)
      setInstalledVersions(mockVersions)
      setLastCheck(new Date().toLocaleString('vi-VN'))
    } catch (e) {
      setError(e.message)
    } finally {
      setChecking(false)
      setLoading(false)
    }
  }

  const handleInstall = async (moduleId, version) => {
    setInstalling(moduleId)
    setError(null)
    try {
      const downloadUrl = moduleApi.downloadModule(moduleId, version)

      // In real app: this would trigger actual download and installation
      // For demo: simulate success
      console.log('Downloading from:', downloadUrl)

      // Simulate download delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Update local version
      setInstalledVersions(prev => ({
        ...prev,
        [moduleId]: version
      }))

      // Remove from updates list
      setUpdates(prev => prev.filter(u => u.moduleId !== moduleId))

      setSuccessMessage(`✅ Module "${moduleId}" updated to v${version}`)
      setTimeout(() => setSuccessMessage(null), 3000)

      // Refresh the list
      checkUpdates()
    } catch (e) {
      setError(`Failed to install ${moduleId}: ${e.message}`)
    } finally {
      setInstalling(null)
    }
  }

  const newModules = updates?.filter(u => u.type === 'new') || []
  const moduleUpdates = updates?.filter(u => u.type === 'update') || []

  return (
    <div className="user-module-updates">
      <div className="header">
        <h2>📦 My Modules</h2>
        <button
          onClick={checkUpdates}
          disabled={checking}
          className="refresh-btn"
        >
          {checking ? '🔄 Checking...' : '🔄 Check Updates'}
        </button>
      </div>

      {lastCheck && (
        <p className="last-check">Last checked: {lastCheck}</p>
      )}

      {error && (
        <div className="error-message">
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

      {loading ? (
        <div className="loading">
          <p>Loading your modules...</p>
        </div>
      ) : (
        <>
          {/* Available Updates */}
          {moduleUpdates.length > 0 && (
            <section className="updates-section">
              <h3>⬆️ Available Updates ({moduleUpdates.length})</h3>
              <div className="update-cards">
                {moduleUpdates.map(update => (
                  <div key={update.moduleId} className="update-card">
                    <div className="card-header">
                      <h4>{update.moduleId}</h4>
                      <span className="update-badge">UPDATE</span>
                    </div>

                    <div className="version-info">
                      <div className="version-row">
                        <span className="label">Current:</span>
                        <span className="version-old">
                          v{update.desktopVersion || 'not installed'}
                        </span>
                      </div>
                      <div className="arrow">→</div>
                      <div className="version-row">
                        <span className="label">Available:</span>
                        <span className="version-new">v{update.currentVersion}</span>
                      </div>
                    </div>

                    <div className="changelog">
                      <strong>What's new:</strong>
                      <p>{update.changelog}</p>
                    </div>

                    <div className="meta">
                      <small>
                        Released:{' '}
                        {new Date(update.releaseDate).toLocaleDateString(
                          'vi-VN'
                        )}
                      </small>
                      <small>
                        Size:{' '}
                        {(update.fileSize / 1024 / 1024).toFixed(1)} MB
                      </small>
                    </div>

                    <button
                      onClick={() =>
                        handleInstall(update.moduleId, update.currentVersion)
                      }
                      disabled={installing === update.moduleId}
                      className="install-btn"
                    >
                      {installing === update.moduleId
                        ? '⬇️ Downloading...'
                        : '⬇️ Update'}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* New Modules Available */}
          {newModules.length > 0 && (
            <section className="new-modules-section">
              <h3>✨ New Modules ({newModules.length})</h3>
              <div className="new-module-cards">
                {newModules.map(module => (
                  <div key={module.moduleId} className="new-module-card">
                    <div className="card-header">
                      <h4>{module.moduleId}</h4>
                      <span className="new-badge">NEW</span>
                    </div>

                    <div className="version-info">
                      <span className="version-new">v{module.currentVersion}</span>
                    </div>

                    <div className="changelog">
                      <p>{module.changelog}</p>
                    </div>

                    <div className="meta">
                      <small>
                        {(module.fileSize / 1024 / 1024).toFixed(1)} MB
                      </small>
                    </div>

                    <button
                      onClick={() =>
                        handleInstall(module.moduleId, module.currentVersion)
                      }
                      disabled={installing === module.moduleId}
                      className="install-btn install-new"
                    >
                      {installing === module.moduleId
                        ? '⬇️ Installing...'
                        : '⬇️ Install'}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* All Up to Date */}
          {moduleUpdates.length === 0 && newModules.length === 0 && (
            <div className="up-to-date">
              <p className="up-to-date-icon">✅</p>
              <h3>All up to date!</h3>
              <p>
                You have the latest versions of all your modules installed.
              </p>
            </div>
          )}

          {/* Installed Modules Summary */}
          {Object.keys(installedVersions).length > 0 && (
            <section className="installed-modules">
              <h3>📋 Your Installed Modules</h3>
              <div className="module-list">
                {Object.entries(installedVersions).map(([moduleId, version]) => (
                  <div key={moduleId} className="module-item">
                    <span className="module-name">{moduleId}</span>
                    <span className="module-version">v{version}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Info Box */}
          <div className="info-box">
            <h4>ℹ️ How Updates Work</h4>
            <ol>
              <li>
                Your desktop app checks for module updates <strong>automatically</strong>
              </li>
              <li>
                You'll see a notification when updates are available
              </li>
              <li>
                Updates are <strong>optional</strong> — you choose when to
                install them
              </li>
              <li>
                Only the changed modules are downloaded — <strong>not the entire app</strong>
              </li>
              <li>
                Your license key is never affected by module updates
              </li>
            </ol>
          </div>
        </>
      )}

      <style jsx>{`
        .user-module-updates {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        h2 {
          margin: 0;
          color: #1f2937;
        }

        .refresh-btn {
          padding: 10px 20px;
          background: #4f46e5;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .refresh-btn:hover:not(:disabled) {
          background: #4338ca;
          transform: translateY(-1px);
        }

        .refresh-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .last-check {
          color: #6b7280;
          font-size: 14px;
          margin: 0 0 20px 0;
        }

        .error-message {
          padding: 12px 16px;
          background: #fee2e2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          color: #991b1b;
          margin-bottom: 20px;
        }

        .error-message strong {
          display: block;
          margin-bottom: 4px;
        }

        .success-message {
          padding: 12px 16px;
          background: #dcfce7;
          border: 1px solid #86efac;
          border-radius: 6px;
          color: #166534;
          margin-bottom: 20px;
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .loading {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }

        /* Updates Section */
        .updates-section,
        .new-modules-section,
        .installed-modules {
          margin-bottom: 30px;
        }

        .updates-section h3,
        .new-modules-section h3,
        .installed-modules h3 {
          color: #1f2937;
          margin-bottom: 15px;
          font-size: 18px;
        }

        .update-cards,
        .new-module-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 15px;
        }

        .update-card,
        .new-module-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          background: white;
          transition: all 0.2s;
        }

        .update-card:hover,
        .new-module-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-color: #d1d5db;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .card-header h4 {
          margin: 0;
          color: #1f2937;
          font-size: 16px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .update-badge,
        .new-badge {
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        .update-badge {
          background: #fef3c7;
          color: #92400e;
        }

        .new-badge {
          background: #dbeafe;
          color: #0369a1;
        }

        .version-info {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 6px;
        }

        .version-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .version-info .label {
          color: #6b7280;
          font-size: 12px;
          text-transform: uppercase;
          font-weight: 600;
        }

        .version-old {
          color: #dc2626;
          font-weight: 600;
        }

        .version-new {
          color: #059669;
          font-weight: 600;
        }

        .arrow {
          color: #9ca3af;
          font-weight: 600;
        }

        .changelog {
          margin-bottom: 12px;
        }

        .changelog strong {
          display: block;
          color: #374151;
          font-size: 13px;
          margin-bottom: 4px;
        }

        .changelog p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
          line-height: 1.5;
        }

        .meta {
          display: flex;
          gap: 12px;
          margin-bottom: 15px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f3f4f6;
        }

        .meta small {
          color: #9ca3af;
          font-size: 12px;
        }

        .install-btn,
        .install-new {
          width: 100%;
          padding: 10px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .install-btn {
          background: #f59e0b;
          color: white;
        }

        .install-btn:hover:not(:disabled) {
          background: #d97706;
        }

        .install-new {
          background: #3b82f6;
          color: white;
        }

        .install-new:hover:not(:disabled) {
          background: #2563eb;
        }

        .install-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Up to Date */
        .up-to-date {
          text-align: center;
          padding: 60px 20px;
          background: #f0fdf4;
          border: 2px solid #86efac;
          border-radius: 8px;
          margin: 30px 0;
        }

        .up-to-date-icon {
          font-size: 48px;
          margin: 0;
        }

        .up-to-date h3 {
          color: #166534;
          margin: 10px 0 5px 0;
        }

        .up-to-date p {
          color: #4b7c4a;
          margin: 0;
        }

        /* Installed Modules */
        .module-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .module-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #f3f4f6;
          border-radius: 6px;
          font-size: 14px;
        }

        .module-name {
          font-weight: 600;
          color: #1f2937;
          text-transform: capitalize;
        }

        .module-version {
          background: #e5e7eb;
          padding: 4px 10px;
          border-radius: 4px;
          color: #6b7280;
          font-weight: 600;
        }

        /* Info Box */
        .info-box {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          padding: 20px;
          margin-top: 30px;
        }

        .info-box h4 {
          margin-top: 0;
          color: #1e40af;
          font-size: 15px;
        }

        .info-box ol {
          margin: 10px 0;
          padding-left: 20px;
          color: #1e3a8a;
        }

        .info-box li {
          margin: 8px 0;
          line-height: 1.6;
        }

        .info-box strong {
          color: #1e40af;
        }

        @media (max-width: 768px) {
          .header {
            flex-direction: column;
            gap: 15px;
            align-items: flex-start;
          }

          .refresh-btn {
            width: 100%;
          }

          .update-cards,
          .new-module-cards {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
