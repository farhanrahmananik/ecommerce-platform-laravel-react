function AdminStatCard({ stat }) {
  const formattedValue = new Intl.NumberFormat('en-US').format(stat.value || 0)

  return (
    <article className={`admin-stat-card admin-stat-card-${stat.variant} app-stat-card app-card-hover`}>
      <div className="admin-stat-card-topline">
        <span className="admin-stat-icon" aria-hidden="true">
          <i className={`bi ${stat.icon}`} />
        </span>
        <span className="admin-stat-trend">
          <i className="bi bi-dash" aria-hidden="true" />
          Live
        </span>
      </div>
      <span className="admin-stat-label">{stat.label}</span>
      <div className="admin-stat-value-row">
        <strong>{formattedValue}</strong>
        <span aria-hidden="true" />
      </div>
      <p>{stat.description}</p>
    </article>
  )
}

export default AdminStatCard
