import React, { useEffect, useState } from 'react'
import { adminModuleApi } from '../../utils/api'

/**
 * Module Updates Dashboard for Admin
 * Shows:
 * - Which users need which module updates
 * - File download history
 * - Module update statistics
 */

export default function AdminModuleUpdates() {
  const [view, setView] = useState('summary') // 'summary', 'users', 'history'
  const [usersData, setUsersData] = useState(null)
  const [history, setHistory] = useState(null)
  const [selectedModule, setSelectedModule] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [view])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      if (view === 'users') {
        const data = await adminModuleApi.getUsersUpdates()
        setUsersData(data)
      } else if (view === 'history') {
        const data = await adminModuleApi.getHistory(selectedModule, 100)
        setHistory(data)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const MODULES = [
    { id: 'analytics', name: 'Analytics', icon: '📊' },
    { id: 'reports', name: 'Reports', icon: '📄' },
    { id: 'crm', name: 'CRM', icon: '🤝' },
    { id: 'inventory', name: 'Inventory', icon: '📦' },
    { id: 'hr', name: 'HR Manager', icon: '👔' },
    { id: 'finance', name: 'Finance', icon: '💰' },
    { id: 'ai', name: 'AI Tools', icon: '🤖' },
    { id: 'api', name: 'API Access', icon: '🔌' },
  ]

  return (
    <div className="admin-module-updates">
      <h2>📦 Module Update Management</h2>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${view === 'summary' ? 'active' : ''}`}
          onClick={() => setView('summary')}
        >
          Summary
        </button>
        <button
          className={`tab ${view === 'users' ? 'active' : ''}`}
          onClick={() => setView('users')}
        >
          Users Needing Updates
        </button>
        <button
          className={`tab ${view === 'history' ? 'active' : ''}`}
          onClick={() => setView('history')}
        >
          Download History
        </button>
      </div>

      {error && <div className="error-message">❌ {error}</div>}
      {loading && <div className="loading">Loading...</div>}

      {/* Summary View */}
      {view === 'summary' && (
        <div className="summary-view">
          <p>
            This dashboard shows module update information:
          </p>
          <ul>
            <li>
              <strong>Users Needing Updates:</strong> See which users have modules
              that can be updated
            </li>
            <li>
              <strong>Download History:</strong> Audit trail of who downloaded which
              modules and when
            </li>
            <li>
              <strong>Module Versions:</strong> Track which versions are installed by
              your users
            </li>
          </ul>

          <div className="module-grid">
            {MODULES.map(mod => (
              <div key={mod.id} className="module-card">
                <div className="module-icon">{mod.icon}</div>
                <div className="module-name">{mod.name}</div>
                <small>{mod.id}</small>
              </div>
            ))}
          </div>

          <div className="info-box">
            <h4>How Module Updates Work</h4>
            <ol>
              <li>Users activate a license key with specific modules</li>
              <li>Desktop app checks hourly for available module updates</li>
              <li>User receives notification of available updates</li>
              <li>User can install updates on-demand</li>
              <li>Server tracks all downloads for audit purposes</li>
              <li>Key system is NOT affected by module updates</li>
            </ol>
          </div>
        </div>
      )}

      {/* Users Needing Updates */}
      {view === 'users' && usersData && (
        <div className="users-view">
          <div className="summary-stats">
            <div className="stat">
              <strong>{usersData.totalUsers}</strong>
              <span>Total Users</span>
            </div>
            <div className="stat">
              <strong>{usersData.usersNeedingUpdates}</strong>
              <span>Needing Updates</span>
            </div>
          </div>

          {usersData.details.length === 0 ? (
            <p className="no-data">All users are up to date!</p>
          ) : (
            <div className="users-list">
              {usersData.details.map(user => (
                <div key={user.userId} className="user-card">
                  <div className="user-info">
                    <h4>{user.userName}</h4>
                    <p>{user.userEmail}</p>
                  </div>

                  <div className="modules-info">
                    <span className="module-count">
                      {user.modules.length} modules
                    </span>
                    {user.updateCount > 0 && (
                      <span className="update-badge">
                        {user.updateCount} updates available
                      </span>
                    )}
                  </div>

                  {user.updateCount > 0 && (
                    <div className="available-updates">
                      <h5>Available Updates:</h5>
                      <ul>
                        {user.availableUpdates.map(update => (
                          <li key={update.moduleId}>
                            <span>{update.moduleId}</span>
                            <span className="version">
                              {update.desktopVersion || 'not installed'} →{' '}
                              {update.currentVersion}
                            </span>
                            <p className="changelog">{update.changelog}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Download History */}
      {view === 'history' && (
        <div className="history-view">
          <div className="filter-section">
            <label>Filter by Module:</label>
            <select
              value={selectedModule || ''}
              onChange={e => {
                setSelectedModule(e.target.value || null)
              }}
            >
              <option value="">All Modules</option>
              {MODULES.map(mod => (
                <option key={mod.id} value={mod.id}>
                  {mod.name} ({mod.id})
                </option>
              ))}
            </select>
            <button onClick={loadData} disabled={loading}>
              Refresh
            </button>
          </div>

          {history && (
            <div className="history-stats">
              <p>Showing {history.records.length} downloads</p>
            </div>
          )}

          {history && history.records.length === 0 ? (
            <p className="no-data">No download history</p>
          ) : (
            history && (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Module</th>
                    <th>Version</th>
                    <th>User Email</th>
                    <th>Date & Time</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {history.records.map(record => (
                    <tr key={record.id}>
                      <td className="module">{record.moduleId}</td>
                      <td>{record.version}</td>
                      <td>{record.userEmail}</td>
                      <td>
                        {new Date(record.timestamp).toLocaleString('vi-VN')}
                      </td>
                      <td>
                        <span className={`reason ${record.reason}`}>
                          {record.reason}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      )}

      <style jsx>{`
        .admin-module-updates {
          padding: 20px;
          border-radius: 8px;
          background: #f9fafb;
        }

        h2 {
          margin-bottom: 20px;
          color: #1f2937;
        }

        .tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .tab {
          padding: 10px 20px;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          color: #6b7280;
          font-weight: 500;
          transition: all 0.2s;
        }

        .tab:hover {
          color: #4b5563;
        }

        .tab.active {
          color: #4f46e5;
          border-bottom-color: #4f46e5;
        }

        .error-message {
          padding: 12px 16px;
          background: #fee2e2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          color: #991b1b;
          margin-bottom: 20px;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #6b7280;
        }

        /* Summary View */
        .summary-view {
          background: white;
          padding: 20px;
          border-radius: 8px;
        }

        .module-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 15px;
          margin: 20px 0;
        }

        .module-card {
          padding: 15px;
          background: #f3f4f6;
          border-radius: 6px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .module-card:hover {
          background: #e5e7eb;
          transform: translateY(-2px);
        }

        .module-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }

        .module-name {
          font-weight: 600;
          font-size: 14px;
          color: #1f2937;
        }

        .module-card small {
          color: #9ca3af;
          display: block;
          margin-top: 4px;
        }

        .info-box {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 6px;
          padding: 15px;
          margin-top: 20px;
        }

        .info-box h4 {
          margin-top: 0;
          color: #1e40af;
        }

        .info-box ol {
          margin: 10px 0;
          padding-left: 20px;
        }

        .info-box li {
          margin: 6px 0;
          color: #1e3a8a;
        }

        /* Users View */
        .users-view {
          background: white;
          padding: 20px;
          border-radius: 8px;
        }

        .summary-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .stat {
          padding: 15px;
          background: #f3f4f6;
          border-radius: 6px;
          text-align: center;
        }

        .stat strong {
          display: block;
          font-size: 24px;
          color: #4f46e5;
          margin-bottom: 5px;
        }

        .stat span {
          color: #6b7280;
          font-size: 14px;
        }

        .users-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 15px;
        }

        .user-card {
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 15px;
          background: white;
          transition: all 0.2s;
        }

        .user-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .user-info h4 {
          margin: 0 0 5px 0;
          color: #1f2937;
        }

        .user-info p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .modules-info {
          display: flex;
          gap: 10px;
          margin: 10px 0;
          flex-wrap: wrap;
        }

        .module-count {
          background: #f0f9ff;
          color: #0369a1;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        .update-badge {
          background: #fef3c7;
          color: #92400e;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        .available-updates {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #e5e7eb;
        }

        .available-updates h5 {
          margin: 0 0 10px 0;
          font-size: 13px;
          color: #6b7280;
        }

        .available-updates ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .available-updates li {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          font-size: 13px;
          border-bottom: 1px solid #f3f4f6;
        }

        .available-updates li:last-child {
          border-bottom: none;
        }

        .available-updates .version {
          color: #059669;
          font-weight: 600;
        }

        .changelog {
          margin: 4px 0 0 0;
          color: #6b7280;
          font-size: 12px;
          grid-column: 1 / -1;
        }

        /* History View */
        .history-view {
          background: white;
          padding: 20px;
          border-radius: 8px;
        }

        .filter-section {
          display: flex;
          gap: 10px;
          align-items: center;
          margin-bottom: 20px;
        }

        .filter-section label {
          color: #6b7280;
          font-weight: 500;
        }

        .filter-section select {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }

        .filter-section button {
          padding: 8px 16px;
          background: #4f46e5;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }

        .filter-section button:hover {
          background: #4338ca;
        }

        .history-stats {
          margin-bottom: 15px;
          color: #6b7280;
          font-size: 14px;
        }

        .history-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .history-table th {
          background: #f3f4f6;
          padding: 12px;
          text-align: left;
          color: #374151;
          font-weight: 600;
          border-bottom: 2px solid #e5e7eb;
        }

        .history-table td {
          padding: 12px;
          border-bottom: 1px solid #f3f4f6;
        }

        .history-table tr:hover {
          background: #f9fafb;
        }

        .history-table .module {
          font-weight: 600;
          color: #4f46e5;
        }

        .reason {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .reason.user-download {
          background: #dbeafe;
          color: #0369a1;
        }

        .no-data {
          text-align: center;
          padding: 40px;
          color: #9ca3af;
        }
      `}</style>
    </div>
  )
}
