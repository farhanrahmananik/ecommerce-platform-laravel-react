const labels = {
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
}

function ReviewStatusBadge({ status }) {
  return (
    <span className={`review-status-badge is-${status || 'pending'}`}>
      <span aria-hidden="true" />
      {labels[status] || status || 'Pending review'}
    </span>
  )
}

export default ReviewStatusBadge
