import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { useAuth } from '../../hooks/useAuth.js'
import {
  getApiErrorMessage,
  getValidationErrors,
} from '../../utils/apiErrors.js'

const initialForm = {
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
}

function RegisterPage() {
  const [form, setForm] = useState(initialForm)
  const [fieldErrors, setFieldErrors] = useState({})
  const [generalError, setGeneralError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { register } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

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
      const response = await register(form)

      await Swal.fire({
        icon: 'success',
        title: 'Account created!',
        text: `Welcome to the platform, ${response.data.user.name}.`,
        timer: 1700,
        showConfirmButton: false,
        customClass: { popup: 'storefront-alert' },
      })

      navigate('/account', { replace: true })
    } catch (error) {
      const validationErrors = getValidationErrors(error)

      setFieldErrors(validationErrors)

      if (Object.keys(validationErrors).length === 0) {
        setGeneralError(
          getApiErrorMessage(error, 'Unable to create your account right now.'),
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-card auth-card-polish app-form-card" aria-labelledby="register-title">
      <div className="auth-card-heading auth-card-header">
        <span className="auth-card-icon" aria-hidden="true">
          <i className="bi bi-person-plus" />
        </span>
        <span className="auth-card-kicker">Join the storefront</span>
        <h2 className="auth-title" id="register-title">Create your account</h2>
        <p className="auth-subtitle">Set up your customer profile in just a moment.</p>
      </div>

      {generalError && (
        <div className="alert alert-danger app-alert" role="alert">
          <i className="bi bi-exclamation-octagon" aria-hidden="true" />
          <span>{generalError}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="form-group-modern">
          <label htmlFor="register-name">Full name</label>
          <div className="input-shell">
            <i className="bi bi-person" aria-hidden="true" />
            <input
              id="register-name"
              className={`form-control auth-form-control ${fieldErrors.name ? 'is-invalid' : ''}`}
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              autoComplete="name"
              placeholder="Your full name"
              aria-invalid={Boolean(fieldErrors.name)}
            />
          </div>
          {fieldErrors.name?.map((message) => (
            <div className="field-error" key={message}>
              {message}
            </div>
          ))}
        </div>

        <div className="form-group-modern">
          <label htmlFor="register-email">Email address</label>
          <div className="input-shell">
            <i className="bi bi-envelope" aria-hidden="true" />
            <input
              id="register-email"
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

        <div className="row g-3">
          <div className="col-md-6">
            <div className="form-group-modern">
              <label htmlFor="register-password">Password</label>
              <div className="input-shell">
                <i className="bi bi-lock" aria-hidden="true" />
                <input
                  id="register-password"
                  className={`form-control auth-form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  aria-invalid={Boolean(fieldErrors.password)}
                />
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-group-modern">
              <label htmlFor="register-password-confirmation">Confirm password</label>
              <div className="input-shell">
                <i className="bi bi-shield-lock" aria-hidden="true" />
                <input
                  id="register-password-confirmation"
                  className="form-control auth-form-control"
                  type={showPassword ? 'text' : 'password'}
                  name="password_confirmation"
                  value={form.password_confirmation}
                  onChange={handleChange}
                  autoComplete="new-password"
                  placeholder="Repeat password"
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide passwords' : 'Show passwords'}
                >
                  <i
                    className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
        {fieldErrors.password?.map((message) => (
          <div className="field-error field-error-group" key={message}>
            {message}
          </div>
        ))}

        <div className="password-note">
          <i className="bi bi-info-circle" aria-hidden="true" />
          Use at least 8 characters and keep your password private.
        </div>

        <button
          className="btn btn-brand btn-auth app-gradient-btn"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
              Creating your account...
            </>
          ) : (
            <>
              Create my account
              <i className="bi bi-arrow-right" aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      <div className="auth-card-footer">
        <span>Already have an account?</span>
        <Link className="auth-link" to="/login" state={location.state}>
          Sign in instead
        </Link>
      </div>
    </section>
  )
}

export default RegisterPage
