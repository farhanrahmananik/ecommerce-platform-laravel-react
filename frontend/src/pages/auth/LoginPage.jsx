import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { useAuth } from '../../hooks/useAuth.js'
import {
  getApiErrorMessage,
  getValidationErrors,
} from '../../utils/apiErrors.js'

const initialForm = {
  email: '',
  password: '',
}

function LoginPage() {
  const [form, setForm] = useState(initialForm)
  const [fieldErrors, setFieldErrors] = useState({})
  const [generalError, setGeneralError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const intendedLocation = location.state?.from
  const intendedPath = intendedLocation
    ? `${intendedLocation.pathname}${intendedLocation.search || ''}${intendedLocation.hash || ''}`
    : '/account'

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: undefined }))
    setGeneralError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setFieldErrors({})
    setGeneralError('')

    try {
      const response = await login(form)

      await Swal.fire({
        icon: 'success',
        title: 'Welcome back!',
        text: `Signed in as ${response.data.user.name}.`,
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: 'storefront-alert' },
      })

      navigate(intendedPath, { replace: true })
    } catch (error) {
      const validationErrors = getValidationErrors(error)

      setFieldErrors(validationErrors)

      if (Object.keys(validationErrors).length === 0) {
        setGeneralError(
          getApiErrorMessage(error, 'Unable to sign in. Please try again.'),
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-card auth-card-polish app-form-card" aria-labelledby="login-title">
      <div className="auth-card-heading auth-card-header">
        <span className="auth-card-icon" aria-hidden="true">
          <i className="bi bi-person-check" />
        </span>
        <span className="auth-card-kicker">Welcome back</span>
        <h2 className="auth-title" id="login-title">Sign in to your account</h2>
        <p className="auth-subtitle">Continue to your personal storefront space.</p>
      </div>

      {generalError && (
        <div className="alert alert-danger app-alert" role="alert">
          <i className="bi bi-exclamation-octagon" aria-hidden="true" />
          <span>{generalError}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="form-group-modern">
          <label htmlFor="login-email">Email address</label>
          <div className="input-shell">
            <i className="bi bi-envelope" aria-hidden="true" />
            <input
              id="login-email"
              className={`form-control auth-form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={Boolean(fieldErrors.email)}
            />
          </div>
          {fieldErrors.email?.map((message) => (
            <div className="field-error" key={message}>
              {message}
            </div>
          ))}
        </div>

        <div className="form-group-modern">
          <div className="d-flex align-items-center justify-content-between gap-3">
            <label htmlFor="login-password">Password</label>
            <span className="form-hint">At least 8 characters</span>
          </div>
          <div className="input-shell">
            <i className="bi bi-lock" aria-hidden="true" />
            <input
              id="login-password"
              className={`form-control auth-form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              placeholder="Enter your password"
              aria-invalid={Boolean(fieldErrors.password)}
            />
            <button
              className="password-toggle"
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <i
                className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}
                aria-hidden="true"
              />
            </button>
          </div>
          {fieldErrors.password?.map((message) => (
            <div className="field-error" key={message}>
              {message}
            </div>
          ))}
        </div>

        <button
          className="btn btn-brand btn-auth app-gradient-btn"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
              Signing you in...
            </>
          ) : (
            <>
              Sign in securely
              <i className="bi bi-arrow-right" aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      <div className="auth-card-footer">
        <span>New to E-Commerce Platform?</span>
        <Link className="auth-link" to="/register" state={location.state}>
          Create your account
        </Link>
      </div>
    </section>
  )
}

export default LoginPage
