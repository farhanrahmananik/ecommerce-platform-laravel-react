const statusDetails = {
  pending: { label: 'Pending', icon: 'bi-clock', tone: 'warning' },
  processing: { label: 'Processing', icon: 'bi-arrow-repeat', tone: 'info' },
  shipped: { label: 'Shipped', icon: 'bi-truck', tone: 'info' },
  delivered: { label: 'Delivered', icon: 'bi-check-circle', tone: 'success' },
  cancelled: { label: 'Cancelled', icon: 'bi-x-circle', tone: 'danger' },
}

function AdminOrderStatusBadge({ status }) {
  const normalizedStatus = String(status || 'pending').toLowerCase()
  const details = statusDetails[normalizedStatus] || {
    label: normalizedStatus.replaceAll('_', ' '),
    icon: 'bi-circle',
    tone: 'neutral',
  }

  return (
    <span className={`admin-order-status admin-status-badge ${details.tone} status-${normalizedStatus}`}>
      <i className={`bi ${details.icon}`} aria-hidden="true" />
      {details.label}
    </span>
  )
}

export default AdminOrderStatusBadge
