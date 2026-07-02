const statusDetails = {
  pending: { label: 'Pending', icon: 'bi-clock' },
  processing: { label: 'Processing', icon: 'bi-arrow-repeat' },
  shipped: { label: 'Shipped', icon: 'bi-truck' },
  delivered: { label: 'Delivered', icon: 'bi-check-circle' },
  cancelled: { label: 'Cancelled', icon: 'bi-x-circle' },
}

function AdminOrderStatusBadge({ status }) {
  const normalizedStatus = String(status || 'pending').toLowerCase()
  const details = statusDetails[normalizedStatus] || {
    label: normalizedStatus.replaceAll('_', ' '),
    icon: 'bi-circle',
  }

  return (
    <span className={`admin-order-status status-${normalizedStatus}`}>
      <i className={`bi ${details.icon}`} aria-hidden="true" />
      {details.label}
    </span>
  )
}

export default AdminOrderStatusBadge
