const labels = {
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
}

const tones = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
}

function ReviewStatusBadge({ status, admin = false }) {
  const adminClasses = admin
    ? `admin-status-badge ${tones[status] || 'neutral'}`
    : ''

  return (
    <span className={`review-status-badge ${adminClasses} is-${status || 'pending'}`}>
      <span aria-hidden="true" />
      {labels[status] || status || 'Pending review'}
    </span>
  )
}

export default ReviewStatusBadge
