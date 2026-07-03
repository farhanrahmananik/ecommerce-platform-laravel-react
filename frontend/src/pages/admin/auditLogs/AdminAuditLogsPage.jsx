import { useEffect, useMemo, useState } from 'react'
import AdminSelect from '../../../components/admin/common/AdminSelect.jsx'
import {
  getAuditLog,
  getAuditLogs,
} from '../../../services/admin/auditLogService.js'
import { getApiErrorMessage } from '../../../utils/apiErrors.js'

const emptyFilters = {
  search: '',
  module: '',
  action: '',
  event: '',
  date_from: '',
  date_to: '',
  per_page: '20',
}

const moduleOptions = [
  { value: '', label: 'All modules' },
  { value: 'categories', label: 'Categories' },
  { value: 'products', label: 'Products' },
  { value: 'product_images', label: 'Product images' },
  { value: 'coupons', label: 'Coupons' },
  { value: 'orders', label: 'Orders' },
  { value: 'reviews', label: 'Reviews' },
  { value: 'stock', label: 'Stock' },
  { value: 'checkout', label: 'Checkout' },
]

const actionOptions = [
  { value: '', label: 'All actions' },
  { value: 'created', label: 'Created' },
  { value: 'updated', label: 'Updated' },
  { value: 'deleted', label: 'Deleted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'status_updated', label: 'Status updated' },
  { value: 'adjusted', label: 'Adjusted' },
  { value: 'placed', label: 'Placed' },
  { value: 'uploaded', label: 'Uploaded' },
  { value: 'primary_updated', label: 'Primary updated' },
]

const perPageOptions = [20, 50, 100].map((value) => ({
  value: String(value),
  label: `${value} per page`,
}))

const moduleIcons = {
  categories: 'bi-tags',
  products: 'bi-box-seam',
  product_images: 'bi-images',
  coupons: 'bi-ticket-perforated',
  orders: 'bi-receipt',
  reviews: 'bi-chat-square-heart',
  stock: 'bi-boxes',
  checkout: 'bi-cart-check',
}

function formatLabel(value) {
  return String(value || 'Unknown')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function formatDateTime(value) {
  if (!value) {
    return { date: 'Unknown date', time: '' }
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return { date: 'Unknown date', time: '' }
  }

  return {
    date: new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date),
    time: new Intl.DateTimeFormat('en-US', { timeStyle: 'short' }).format(date),
  }
}

function cleanParams(filters, page) {
  return Object.fromEntries(
    Object.entries({ ...filters, page }).filter(([, value]) => value !== ''),
  )
}

function JsonSection({ title, icon, value, emptyText }) {
  const hasValue = value && Object.keys(value).length > 0

  return (
    <section className="audit-detail-json">
      <header>
        <i className={`bi ${icon}`} aria-hidden="true" />
        <h3>{title}</h3>
      </header>
      {hasValue ? (
        <pre>{JSON.stringify(value, null, 2)}</pre>
      ) : (
        <p>{emptyText}</p>
      )}
    </section>
  )
}

function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([])
  const [meta, setMeta] = useState(null)
  const [draftFilters, setDraftFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const [page, setPage] = useState(1)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedLog, setSelectedLog] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  useEffect(() => {
    let mounted = true

    getAuditLogs(cleanParams(filters, page))
      .then((response) => {
        if (mounted) {
          setLogs(response.data || [])
          setMeta(response.meta || null)
          setError('')
        }
      })
      .catch((requestError) => {
        if (mounted) {
          setLogs([])
          setError(
            getApiErrorMessage(requestError, 'Audit logs could not be loaded.'),
          )
        }
      })
      .finally(() => mounted && setLoading(false))

    return () => {
      mounted = false
    }
  }, [filters, page, refreshVersion])

  useEffect(() => {
    if (!selectedLog) {
      return undefined
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setSelectedLog(null)
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => document.removeEventListener('keydown', handleEscape)
  }, [selectedLog])

  const activeFiltersCount = useMemo(
    () =>
      ['search', 'module', 'action', 'event', 'date_from', 'date_to'].filter(
        (key) => Boolean(filters[key]),
      ).length,
    [filters],
  )

  const updateDraft = (field, value) => {
    setDraftFilters((current) => ({ ...current, [field]: String(value) }))
  }

  const applyFilters = (event) => {
    event.preventDefault()
    setLoading(true)
    setPage(1)
    setFilters({ ...draftFilters })
  }

  const resetFilters = () => {
    setLoading(true)
    setDraftFilters(emptyFilters)
    setFilters(emptyFilters)
    setPage(1)
    setRefreshVersion((current) => current + 1)
  }

  const refresh = () => {
    setLoading(true)
    setRefreshVersion((current) => current + 1)
  }

  const openDetails = async (log) => {
    setSelectedLog(log)
    setDetailLoading(true)
    setDetailError('')

    try {
      const response = await getAuditLog(log.id)
      setSelectedLog(response.data || response)
    } catch (requestError) {
      setDetailError(
        getApiErrorMessage(requestError, 'Audit log details could not be loaded.'),
      )
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <main className="admin-audit-page">
      <header className="category-list-heading audit-page-heading">
        <div>
          <span className="admin-eyebrow">Security and accountability</span>
          <h1>Audit Logs</h1>
          <p>
            Review critical administrator and customer actions across the
            platform.
          </p>
        </div>
        <button
          className="admin-refresh-button"
          type="button"
          onClick={refresh}
          disabled={loading}
          aria-label="Refresh audit logs"
        >
          <i
            className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}
            aria-hidden="true"
          />
        </button>
      </header>

      <section className="audit-summary-grid" aria-label="Audit log summary">
        <article>
          <span className="is-indigo"><i className="bi bi-database-check" /></span>
          <div><small>Total records</small><strong>{meta?.total ?? logs.length}</strong></div>
        </article>
        <article>
          <span className="is-blue"><i className="bi bi-list-check" /></span>
          <div><small>On this page</small><strong>{logs.length}</strong></div>
        </article>
        <article>
          <span className="is-amber"><i className="bi bi-funnel" /></span>
          <div><small>Active filters</small><strong>{activeFiltersCount}</strong></div>
        </article>
      </section>

      <section className="audit-filter-card">
        <header>
          <div>
            <span><i className="bi bi-sliders" /> Filter activity</span>
            <p>Narrow results by source, action, event, or date range.</p>
          </div>
        </header>
        <form onSubmit={applyFilters}>
          <label className="audit-filter-field audit-filter-search" htmlFor="audit-search">
            Search
            <span><i className="bi bi-search" /><input id="audit-search" type="search" value={draftFilters.search} onChange={(event) => updateDraft('search', event.target.value)} placeholder="Description, user, IP, or model..." /></span>
          </label>
          <div className="audit-filter-select"><AdminSelect id="audit-module" name="module" label="Module" value={draftFilters.module} options={moduleOptions} onChange={(value) => updateDraft('module', value)} /></div>
          <div className="audit-filter-select"><AdminSelect id="audit-action" name="action" label="Action" value={draftFilters.action} options={actionOptions} onChange={(value) => updateDraft('action', value)} /></div>
          <label className="audit-filter-field" htmlFor="audit-event">Event<input id="audit-event" type="text" value={draftFilters.event} onChange={(event) => updateDraft('event', event.target.value)} placeholder="e.g. product.updated" /></label>
          <label className="audit-filter-field" htmlFor="audit-date-from">From<input id="audit-date-from" type="date" value={draftFilters.date_from} onChange={(event) => updateDraft('date_from', event.target.value)} /></label>
          <label className="audit-filter-field" htmlFor="audit-date-to">To<input id="audit-date-to" type="date" value={draftFilters.date_to} min={draftFilters.date_from || undefined} onChange={(event) => updateDraft('date_to', event.target.value)} /></label>
          <div className="audit-filter-select"><AdminSelect id="audit-per-page" name="per_page" label="Rows" value={draftFilters.per_page} options={perPageOptions} onChange={(value) => updateDraft('per_page', value)} /></div>
          <div className="audit-filter-actions">
            <button className="btn btn-admin-primary" type="submit"><i className="bi bi-funnel-fill" /> Apply Filters</button>
            <button className="btn btn-admin-soft" type="button" onClick={resetFilters}><i className="bi bi-arrow-counterclockwise" /> Reset</button>
          </div>
        </form>
      </section>

      <section className="category-list-card audit-list-card">
        {error && (
          <div className="alert category-alert category-alert-danger">
            <i className="bi bi-exclamation-octagon" aria-hidden="true" />
            <span>{error}</span>
            <button type="button" onClick={refresh}>Retry</button>
          </div>
        )}

        {loading ? (
          <div className="category-table-loading" aria-label="Loading audit logs">
            {[1, 2, 3, 4, 5].map((item) => <span key={item} />)}
          </div>
        ) : logs.length === 0 ? (
          <div className="category-empty-state audit-empty-state">
            <span className="category-empty-icon"><i className="bi bi-journal-x" /></span>
            <h2>{activeFiltersCount ? 'No matching activity' : 'No audit logs yet'}</h2>
            <p>{activeFiltersCount ? 'Try broadening or resetting the current filters.' : 'Critical platform activity will appear here as it happens.'}</p>
            {activeFiltersCount > 0 && <button className="btn btn-admin-soft" type="button" onClick={resetFilters}>Clear filters</button>}
          </div>
        ) : (
          <>
            <div className="table-responsive category-table-wrap">
              <table className="table category-table audit-table align-middle mb-0">
                <thead><tr><th>Time</th><th>User</th><th>Module</th><th>Event</th><th>Action</th><th>Description</th><th>IP Address</th><th className="text-end">Details</th></tr></thead>
                <tbody>
                  {logs.map((log) => {
                    const timestamp = formatDateTime(log.created_at)

                    return (
                      <tr key={log.id}>
                        <td data-label="Time"><time className="audit-time"><strong>{timestamp.date}</strong><small>{timestamp.time}</small></time></td>
                        <td data-label="User"><div className="audit-user"><span>{log.user?.name?.charAt(0)?.toUpperCase() || <i className="bi bi-cpu" />}</span><div><strong>{log.user?.name || 'System'}</strong><small>{log.user?.email || 'Automated action'}</small></div></div></td>
                        <td data-label="Module"><span className={`audit-module-badge is-${log.module}`}><i className={`bi ${moduleIcons[log.module] || 'bi-grid'}`} />{formatLabel(log.module)}</span></td>
                        <td data-label="Event"><code className="audit-event-badge">{log.event}</code></td>
                        <td data-label="Action"><span className={`audit-action-badge is-${log.action}`}>{formatLabel(log.action)}</span></td>
                        <td data-label="Description"><p className="audit-description">{log.description || 'No description provided.'}</p></td>
                        <td data-label="IP Address"><code className="audit-ip">{log.ip_address || '—'}</code></td>
                        <td data-label="Details"><button className="audit-detail-button" type="button" onClick={() => openDetails(log)}><i className="bi bi-eye" /> View</button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {meta?.last_page > 1 && (
              <footer className="category-pagination">
                <span>Showing <strong>{meta.from || 0}</strong> to <strong>{meta.to || 0}</strong> of <strong>{meta.total}</strong></span>
                <nav aria-label="Audit log pagination">
                  <button type="button" disabled={page <= 1} onClick={() => { setLoading(true); setPage((current) => current - 1) }} aria-label="Previous page"><i className="bi bi-chevron-left" /></button>
                  <span>Page {meta.current_page} of {meta.last_page}</span>
                  <button type="button" disabled={page >= meta.last_page} onClick={() => { setLoading(true); setPage((current) => current + 1) }} aria-label="Next page"><i className="bi bi-chevron-right" /></button>
                </nav>
              </footer>
            )}
          </>
        )}
      </section>

      {selectedLog && (
        <div className="audit-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelectedLog(null)}>
          <section className="audit-detail-modal" role="dialog" aria-modal="true" aria-labelledby="audit-detail-title">
            <header>
              <div><span>Audit record #{selectedLog.id}</span><h2 id="audit-detail-title">Activity details</h2></div>
              <button type="button" onClick={() => setSelectedLog(null)} aria-label="Close audit details"><i className="bi bi-x-lg" /></button>
            </header>
            {detailLoading ? (
              <div className="audit-detail-loading"><span className="spinner-border" aria-hidden="true" /><p>Loading complete record…</p></div>
            ) : (
              <div className="audit-detail-body">
                {detailError && <div className="category-alert category-alert-danger"><i className="bi bi-exclamation-octagon" /><span>{detailError}</span></div>}
                <section className="audit-detail-hero"><span><i className={`bi ${moduleIcons[selectedLog.module] || 'bi-shield-check'}`} /></span><div><small>{selectedLog.event}</small><h3>{selectedLog.description || 'Recorded platform activity'}</h3><p>{formatDateTime(selectedLog.created_at).date} at {formatDateTime(selectedLog.created_at).time}</p></div></section>
                <dl className="audit-detail-grid">
                  <div><dt>User</dt><dd>{selectedLog.user ? <><strong>{selectedLog.user.name}</strong><small>{selectedLog.user.email} · {formatLabel(selectedLog.user.role)}</small></> : <strong>System</strong>}</dd></div>
                  <div><dt>Module</dt><dd>{formatLabel(selectedLog.module)}</dd></div>
                  <div><dt>Action</dt><dd>{formatLabel(selectedLog.action)}</dd></div>
                  <div><dt>Event</dt><dd><code>{selectedLog.event}</code></dd></div>
                  <div><dt>Auditable type</dt><dd><code>{selectedLog.auditable_type || '—'}</code></dd></div>
                  <div><dt>Auditable ID</dt><dd>{selectedLog.auditable_id ?? '—'}</dd></div>
                  <div><dt>IP address</dt><dd><code>{selectedLog.ip_address || '—'}</code></dd></div>
                  <div><dt>Updated</dt><dd>{formatDateTime(selectedLog.updated_at).date} {formatDateTime(selectedLog.updated_at).time}</dd></div>
                </dl>
                <section className="audit-user-agent"><span><i className="bi bi-browser-chrome" /> User agent</span><p>{selectedLog.user_agent || 'Not available'}</p></section>
                <div className="audit-json-grid">
                  <JsonSection title="Old values" icon="bi-clock-history" value={selectedLog.old_values} emptyText="No previous values were recorded." />
                  <JsonSection title="New values" icon="bi-stars" value={selectedLog.new_values} emptyText="No new values were recorded." />
                </div>
                <JsonSection title="Metadata" icon="bi-braces" value={selectedLog.metadata} emptyText="No additional metadata was recorded." />
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  )
}

export default AdminAuditLogsPage
