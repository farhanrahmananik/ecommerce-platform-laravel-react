import { useEffect, useRef, useState } from 'react'

function normalizeValue(value) {
  return String(value ?? '')
}

function ErrorMessages({ error, id }) {
  if (!error) {
    return null
  }

  const messages = Array.isArray(error) ? error : [error]

  return messages.map((message, index) => (
    <div
      className="category-field-error"
      id={index === 0 ? id : undefined}
      key={`${message}-${index}`}
    >
      {message}
    </div>
  ))
}

function AdminSelect({
  id,
  name,
  label,
  value,
  options = [],
  onChange,
  error,
  placeholder = 'Select an option',
  disabled = false,
  optional = false,
  helperText = '',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef(null)
  const controlRef = useRef(null)
  const optionRefs = useRef([])
  const requestedFocusIndex = useRef(null)
  const normalizedValue = normalizeValue(value)
  const selectedIndex = options.findIndex(
    (option) => normalizeValue(option.value) === normalizedValue,
  )
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null
  const hasError = Array.isArray(error) ? error.length > 0 : Boolean(error)
  const menuId = `${id}-menu`
  const errorId = `${id}-error`
  const helperId = `${id}-helper`
  const describedBy = [hasError ? errorId : '', helperText ? helperId : '']
    .filter(Boolean)
    .join(' ') || undefined

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const focusIndex =
      requestedFocusIndex.current ?? Math.max(selectedIndex, 0)
    requestedFocusIndex.current = null
    const animationFrame = window.requestAnimationFrame(() => {
      optionRefs.current[focusIndex]?.focus()
    })

    return () => window.cancelAnimationFrame(animationFrame)
  }, [isOpen, selectedIndex])

  const closeAndFocusControl = () => {
    setIsOpen(false)
    window.requestAnimationFrame(() => controlRef.current?.focus())
  }

  const openWithFocus = (index) => {
    if (disabled || options.length === 0) {
      return
    }

    requestedFocusIndex.current = index
    setIsOpen(true)
  }

  const handleControlClick = () => {
    if (isOpen) {
      setIsOpen(false)

      return
    }

    openWithFocus(Math.max(selectedIndex, 0))
  }

  const handleControlKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      openWithFocus(Math.max(selectedIndex, 0))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      openWithFocus(selectedIndex >= 0 ? selectedIndex : options.length - 1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      openWithFocus(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      openWithFocus(options.length - 1)
    } else if (event.key === 'Escape' && isOpen) {
      event.preventDefault()
      setIsOpen(false)
    }
  }

  const handleOptionKeyDown = (event, index) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      optionRefs.current[(index + 1) % options.length]?.focus()
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      optionRefs.current[(index - 1 + options.length) % options.length]?.focus()
    } else if (event.key === 'Home') {
      event.preventDefault()
      optionRefs.current[0]?.focus()
    } else if (event.key === 'End') {
      event.preventDefault()
      optionRefs.current[options.length - 1]?.focus()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      closeAndFocusControl()
    }
  }

  const handleSelect = (option) => {
    onChange(option.value)
    closeAndFocusControl()
  }

  return (
    <div
      className={`admin-select ${isOpen ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''} ${hasError ? 'has-error' : ''}`}
      ref={rootRef}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false)
        }
      }}
    >
      <label className="category-form-label" htmlFor={id}>
        {label}
        {optional && <small>Optional</small>}
      </label>

      <input type="hidden" name={name} value={normalizedValue} />
      <button
        className="admin-select__control"
        id={id}
        type="button"
        ref={controlRef}
        onClick={handleControlClick}
        onKeyDown={handleControlKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-describedby={describedBy}
        aria-invalid={hasError || undefined}
        disabled={disabled}
      >
        <span className={selectedOption ? '' : 'is-placeholder'}>
          {selectedOption?.label || placeholder}
        </span>
        <i className="bi bi-chevron-down" aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="admin-select__menu" id={menuId} role="listbox">
          {options.map((option, index) => {
            const isSelected = normalizeValue(option.value) === normalizedValue

            return (
              <button
                className={`admin-select__option ${isSelected ? 'is-selected' : ''}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                tabIndex="-1"
                ref={(element) => {
                  optionRefs.current[index] = element
                }}
                onClick={() => handleSelect(option)}
                onKeyDown={(event) => handleOptionKeyDown(event, index)}
                key={`${normalizeValue(option.value)}-${option.label}`}
              >
                <span>{option.label}</span>
                {isSelected && <i className="bi bi-check2" aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      )}

      {helperText && (
        <span className="admin-select__helper" id={helperId}>
          {helperText}
        </span>
      )}
      <ErrorMessages error={error} id={errorId} />
    </div>
  )
}

export default AdminSelect
