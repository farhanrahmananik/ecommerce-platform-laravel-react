function ReviewStars({
  rating = 0,
  interactive = false,
  onChange,
  disabled = false,
  label,
}) {
  const roundedRating = Math.round(Number(rating) || 0)

  return (
    <div
      className={`review-stars ${interactive ? 'is-interactive' : ''}`}
      aria-label={label || `${rating} out of 5 stars`}
      role={interactive ? 'radiogroup' : 'img'}
    >
      {[1, 2, 3, 4, 5].map((star) =>
        interactive ? (
          <button
            type="button"
            role="radio"
            aria-checked={star === roundedRating}
            aria-label={`${star} ${star === 1 ? 'star' : 'stars'}`}
            className={star <= roundedRating ? 'is-filled' : ''}
            onClick={() => onChange(star)}
            disabled={disabled}
            key={star}
          >
            <i className={`bi ${star <= roundedRating ? 'bi-star-fill' : 'bi-star'}`} />
          </button>
        ) : (
          <i
            className={`bi ${star <= roundedRating ? 'bi-star-fill' : 'bi-star'}`}
            aria-hidden="true"
            key={star}
          />
        ),
      )}
    </div>
  )
}

export default ReviewStars
