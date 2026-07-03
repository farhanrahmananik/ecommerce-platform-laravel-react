import { Link } from 'react-router-dom'

function AdminQuickActionCard({ action, available = false }) {
  return (
    <Link className="admin-quick-action app-card-hover" to={action.path}>
      <span className="admin-quick-action-icon app-icon-badge" aria-hidden="true">
        <i className={`bi ${action.icon}`} />
      </span>
      <span className="admin-quick-action-copy">
        <strong>{action.label}</strong>
        <small>{action.description}</small>
      </span>
      {!available && <span className="admin-planned-badge">Planned</span>}
      <i className="bi bi-arrow-up-right admin-quick-action-arrow" aria-hidden="true" />
    </Link>
  )
}

export default AdminQuickActionCard
