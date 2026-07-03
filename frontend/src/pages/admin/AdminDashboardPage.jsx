import { useEffect, useState } from 'react'
import AdminQuickActionCard from '../../components/admin/AdminQuickActionCard.jsx'
import AdminStatCard from '../../components/admin/AdminStatCard.jsx'
import { getAdminDashboardSummary } from '../../services/adminDashboardApi.js'
import { getApiErrorMessage } from '../../utils/apiErrors.js'

const availableQuickActionPaths = new Set([
  '/admin/categories',
  '/admin/products',
  '/admin/stock',
  '/admin/reports',
])

function AdminDashboardPage() {
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [requestVersion, setRequestVersion] = useState(0)

  useEffect(() => {
    let isMounted = true

    getAdminDashboardSummary()
      .then((response) => {
        if (isMounted) {
          setSummary(response.data)
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(
            getApiErrorMessage(
              requestError,
              'The dashboard summary could not be loaded.',
            ),
          )
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [requestVersion])

  const retry = () => {
    setSummary(null)
    setError('')
    setIsLoading(true)
    setRequestVersion((current) => current + 1)
  }

  if (isLoading) {
    return (
      <div className="admin-dashboard-loading app-page-shell" role="status" aria-live="polite">
        <div className="admin-loading-heading">
          <span />
          <span />
        </div>
        <div className="row g-4">
          {[0, 1, 2, 3].map((item) => (
            <div className="col-sm-6 col-xl-3" key={item}>
              <div className="admin-loading-card" />
            </div>
          ))}
        </div>
        <div className="admin-loading-panel-grid" aria-hidden="true">
          <span />
          <span />
        </div>
        <span className="visually-hidden">Loading admin dashboard</span>
      </div>
    )
  }

  if (error) {
    return (
      <section className="admin-error-state app-empty-state">
        <span className="admin-error-icon" aria-hidden="true">
          <i className="bi bi-cloud-slash" />
        </span>
        <span className="admin-eyebrow">Connection issue</span>
        <h1>Dashboard data is unavailable</h1>
        <p>{error}</p>
        <button className="btn btn-admin-primary" type="button" onClick={retry}>
          <i className="bi bi-arrow-clockwise" aria-hidden="true" />
          Try again
        </button>
      </section>
    )
  }

  const stats = summary?.stats || []
  const quickActions = [
    ...(summary?.quick_actions || []),
    {
      label: 'Stock Management',
      description: 'Review inventory levels and stock movements.',
      icon: 'bi-clipboard-data',
      path: '/admin/stock',
    },
    { label: 'Reports & Analytics', description: 'Explore sales and operational insights.', icon: 'bi-graph-up-arrow', path: '/admin/reports' },
  ]
  const recentActivity = summary?.recent_activity || []
  const system = summary?.system || {}
  const currentDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())

  return (
    <main className="admin-dashboard-page">
      <header className="admin-dashboard-heading app-page-header">
        <div>
          <span className="admin-eyebrow app-page-eyebrow">
            <i className="bi bi-stars" aria-hidden="true" />
            Store operations
          </span>
          <h1 className="app-page-title">Dashboard overview</h1>
          <p className="app-page-subtitle">
            A clear view of your commerce foundation and system readiness.
          </p>
        </div>
        <div className="admin-heading-actions">
          <span className="admin-date-chip">
            <i className="bi bi-calendar3" aria-hidden="true" />
            {currentDate}
          </span>
          <button className="admin-refresh-button" type="button" onClick={retry}>
            <i className="bi bi-arrow-clockwise" aria-hidden="true" />
            <span className="visually-hidden">Refresh dashboard</span>
          </button>
        </div>
      </header>

      <section className="row g-4 admin-dashboard-stats" aria-label="Dashboard statistics">
        {stats.map((stat) => (
          <div className="col-sm-6 col-xl-3" key={stat.label}>
            <AdminStatCard stat={stat} />
          </div>
        ))}
      </section>

      <div className="row g-4 admin-dashboard-grid">
        <div className="col-xl-7">
          <section className="admin-panel app-section-card h-100">
            <div className="admin-panel-heading">
              <div>
                <span>Shortcuts</span>
                <h2>Quick actions</h2>
              </div>
              <span className="admin-panel-badge">
                {quickActions.length} shortcuts
              </span>
            </div>
            <div className="admin-quick-actions">
              {quickActions.map((action) => (
                <AdminQuickActionCard
                  action={action}
                  available={availableQuickActionPaths.has(action.path)}
                  key={action.label}
                />
              ))}
            </div>
          </section>
        </div>

        <div className="col-xl-5">
          <section className="admin-panel app-section-card h-100">
            <div className="admin-panel-heading">
              <div className="admin-dashboard-mini-card">
                <span>System</span>
                <h2>Platform status</h2>
              </div>
              <span className="admin-live-badge">
                <span aria-hidden="true" />
                Live
              </span>
            </div>

            <div className="admin-system-status">
              <div className="admin-dashboard-mini-card">
                <span className="admin-system-icon admin-system-icon-green">
                  <i className="bi bi-cloud-check" aria-hidden="true" />
                </span>
                <span>
                  <small>Laravel API</small>
                  <strong>{system.api_status || 'Unknown'}</strong>
                </span>
                <span className="admin-status-dot" aria-label="Online" />
              </div>
              <div>
                <span className="admin-system-icon admin-system-icon-blue">
                  <i className="bi bi-hdd-stack" aria-hidden="true" />
                </span>
                <span>
                  <small>Environment</small>
                  <strong>{system.environment || 'Unknown'}</strong>
                </span>
                <span className="admin-env-badge">Current</span>
              </div>
            </div>
          </section>
        </div>

        <div className="col-12">
          <section className="admin-panel app-section-card">
            <div className="admin-panel-heading">
              <div>
                <span>Timeline</span>
                <h2>Recent activity</h2>
              </div>
            </div>

            {recentActivity.length > 0 ? (
              <div className="admin-activity-list">
                {recentActivity.map((activity) => (
                  <article key={activity.id}>
                    <span aria-hidden="true">
                      <i className="bi bi-activity" />
                    </span>
                    <div>
                      <strong>{activity.description}</strong>
                      <small>Recorded platform activity</small>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="admin-empty-activity app-empty-state">
                <span aria-hidden="true">
                  <i className="bi bi-clock-history" />
                </span>
                <div>
                  <strong>No activity to show yet</strong>
                  <p>Operational events will appear here in a future scope.</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

export default AdminDashboardPage
