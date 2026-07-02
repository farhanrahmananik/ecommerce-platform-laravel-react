import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import AdminSelect from '../../../components/admin/common/AdminSelect.jsx'
import AdminOrderStatusBadge from '../../../components/admin/orders/AdminOrderStatusBadge.jsx'
import {
  getAdminOrder,
  updateAdminOrderStatus,
} from '../../../services/adminOrderService.js'
import {
  getApiErrorMessage,
  getValidationErrors,
} from '../../../utils/apiErrors.js'

const statusLabels = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const allowedTransitions = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
}

function formatAmount(value) {
  const amount = Number(value)

  return Number.isFinite(amount)
    ? new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)
    : '-'
}

function formatDate(value) {
  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? '-'
    : new Intl.DateTimeFormat('en-US', {
        dateStyle: 'long',
        timeStyle: 'short',
      }).format(date)
}

function labelize(value) {
  return String(value || 'Not specified')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function AdminAddressCard({ address, icon, title }) {
  if (!address) {
    return null
  }

  return (
    <article className="admin-order-address-card">
      <span aria-hidden="true"><i className={`bi ${icon}`} /></span>
      <div>
        <h3>{title}</h3>
        <address>
          <strong>{address.line1}</strong>
          {address.line2 && <span>{address.line2}</span>}
          <span>{[address.city, address.state, address.postal_code].filter(Boolean).join(', ')}</span>
          <span>{address.country}</span>
        </address>
      </div>
    </article>
  )
}

function AdminOrderItem({ item }) {
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = item.product_image_url && !imageFailed

  return (
    <article className="admin-order-item">
      <div className="admin-order-item__image">
        {showImage ? (
          <img
            src={item.product_image_url}
            alt={item.product_name || 'Product'}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <i className="bi bi-image" aria-hidden="true" />
        )}
      </div>
      <div className="admin-order-item__name">
        <strong>{item.product_name || 'Product'}</strong>
        <small>{item.product_sku || item.product_slug || 'Snapshot item'}</small>
      </div>
      <div><small>Unit price</small><strong>{formatAmount(item.unit_price)}</strong></div>
      <div><small>Quantity</small><strong>{item.quantity}</strong></div>
      <div className="admin-order-item__total"><small>Line total</small><strong>{formatAmount(item.total)}</strong></div>
    </article>
  )
}

function AdminOrderDetailsPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState('')
  const [statusError, setStatusError] = useState('')
  const [requestVersion, setRequestVersion] = useState(0)

  useEffect(() => {
    let isMounted = true

    getAdminOrder(id)
      .then((response) => {
        if (isMounted) {
          const nextOrder = response.data ?? response
          setOrder(nextOrder)
          setSelectedStatus(nextOrder.status)
          setError('')
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(getApiErrorMessage(requestError, 'Order details could not be loaded.'))
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [id, requestVersion])

  const retry = () => {
    setError('')
    setIsLoading(true)
    setRequestVersion((current) => current + 1)
  }

  const handleStatusUpdate = async () => {
    if (!order || isUpdating) {
      return
    }

    const nextLabel = statusLabels[selectedStatus] || selectedStatus
    const confirmation = await Swal.fire({
      icon: 'question',
      title: 'Update order status?',
      text:
        selectedStatus === order.status
          ? `${order.order_number} will remain ${nextLabel}.`
          : `${order.order_number} will move from ${statusLabels[order.status]} to ${nextLabel}.`,
      showCancelButton: true,
      confirmButtonText: 'Update Status',
      cancelButtonText: 'Keep Current',
      reverseButtons: true,
      buttonsStyling: false,
      customClass: {
        popup: 'storefront-alert',
        confirmButton: 'swal-brand-button',
        cancelButton: 'swal-soft-button',
      },
    })

    if (!confirmation.isConfirmed) {
      return
    }

    setIsUpdating(true)
    setStatusError('')

    try {
      const response = await updateAdminOrderStatus(order.id, selectedStatus)
      const updatedOrder = response.data ?? response

      setOrder(updatedOrder)
      setSelectedStatus(updatedOrder.status)

      await Swal.fire({
        icon: 'success',
        title: 'Status updated',
        text: `${updatedOrder.order_number} is now ${statusLabels[updatedOrder.status]}.`,
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: 'storefront-alert' },
      })
    } catch (requestError) {
      const validationErrors = getValidationErrors(requestError)
      const message =
        validationErrors.status?.[0] ||
        getApiErrorMessage(requestError, 'The order status could not be updated.')

      setStatusError(message)
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <main className="admin-orders-page" aria-busy="true">
        <div className="admin-order-detail-loading">
          {[0, 1, 2].map((item) => <span key={item} />)}
          <span className="visually-hidden">Loading order details</span>
        </div>
      </main>
    )
  }

  if (!order) {
    return (
      <main className="admin-orders-page">
        <div className="category-empty-state admin-order-error-state">
          <span className="category-empty-icon"><i className="bi bi-cloud-slash" /></span>
          <h2>Order details unavailable</h2>
          <p>{error}</p>
          <div>
            <Link className="btn btn-admin-soft" to="/admin/orders">Back to Orders</Link>
            <button className="btn btn-admin-primary" type="button" onClick={retry}>Try again</button>
          </div>
        </div>
      </main>
    )
  }

  const transitions = allowedTransitions[order.status] || []
  const isTerminal = transitions.length === 0
  const statusOptions = [order.status, ...transitions].map((status) => ({
    value: status,
    label: `${statusLabels[status]}${status === order.status ? ' (Current)' : ''}`,
  }))

  return (
    <main className="admin-orders-page">
      <header className="admin-order-detail-heading">
        <div>
          <Link to="/admin/orders"><i className="bi bi-arrow-left" /> Back to Orders</Link>
          <span className="admin-eyebrow">Order management</span>
          <h1>{order.order_number}</h1>
          <p>Placed {formatDate(order.created_at)}</p>
        </div>
        <AdminOrderStatusBadge status={order.status} />
      </header>

      <div className="admin-order-detail-grid">
        <div className="admin-order-detail-main">
          <section className="admin-order-panel">
            <header><div><span>Customer</span><h2>Customer summary</h2></div><i className="bi bi-person" /></header>
            <div className="admin-order-customer-grid">
              <div><small>Name</small><strong>{order.customer?.name || order.customer_name}</strong></div>
              <div><small>Email</small><strong>{order.customer?.email || order.customer_email}</strong></div>
              <div><small>Phone</small><strong>{order.customer_phone || 'Not provided'}</strong></div>
            </div>
          </section>

          <section className="admin-order-panel admin-order-items-panel">
            <header><div><span>Products</span><h2>Order items</h2></div><b>{order.items?.length || 0}</b></header>
            <div>{(order.items || []).map((item) => <AdminOrderItem item={item} key={item.id} />)}</div>
          </section>

          <section className="admin-order-address-grid">
            <AdminAddressCard address={order.shipping_address} icon="bi-truck" title="Shipping address" />
            <AdminAddressCard address={order.billing_address} icon="bi-receipt" title="Billing address" />
          </section>

          {order.notes && (
            <section className="admin-order-notes">
              <i className="bi bi-chat-left-text" /><div><h2>Order notes</h2><p>{order.notes}</p></div>
            </section>
          )}
        </div>

        <aside className="admin-order-detail-side">
          <section className="admin-order-panel admin-status-workflow">
            <header><div><span>Fulfillment</span><h2>Status workflow</h2></div><i className="bi bi-signpost-split" /></header>
            <AdminOrderStatusBadge status={order.status} />
            {isTerminal ? (
              <div className="admin-terminal-status">
                <i className="bi bi-lock" /><span>This status is terminal and cannot be changed.</span>
              </div>
            ) : (
              <>
                <AdminSelect
                  id="admin-order-next-status"
                  name="status"
                  label="Next status"
                  value={selectedStatus}
                  options={statusOptions}
                  onChange={(value) => {
                    setSelectedStatus(String(value))
                    setStatusError('')
                  }}
                  error={statusError}
                  disabled={isUpdating}
                />
                <button
                  className="btn btn-admin-primary admin-status-update-button"
                  type="button"
                  onClick={handleStatusUpdate}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <><span className="spinner-border spinner-border-sm" /> Updating...</>
                  ) : (
                    <><i className="bi bi-arrow-repeat" /> Update Status</>
                  )}
                </button>
              </>
            )}
          </section>

          <section className="admin-order-panel admin-payment-summary">
            <header><div><span>Payment</span><h2>{labelize(order.payment_method)}</h2></div><i className="bi bi-cash-stack" /></header>
            <div className="admin-payment-status"><span>Payment status</span><b>{labelize(order.payment_status)}</b></div>
            <dl>
              <div><dt>Subtotal</dt><dd>{formatAmount(order.subtotal)}</dd></div>
              <div><dt>Shipping</dt><dd>{formatAmount(order.shipping_amount)}</dd></div>
              <div><dt>Discount</dt><dd>{formatAmount(order.discount_amount)}</dd></div>
              <div><dt>Tax</dt><dd>{formatAmount(order.tax_amount)}</dd></div>
              <div className="admin-order-grand-total"><dt>Total</dt><dd>{formatAmount(order.total)}</dd></div>
            </dl>
          </section>
        </aside>
      </div>
    </main>
  )
}

export default AdminOrderDetailsPage
