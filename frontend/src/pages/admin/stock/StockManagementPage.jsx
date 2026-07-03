import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import {
  adjustProductStock,
  getProductStockMovements,
  getStockProducts,
} from '../../../services/adminStockService.js'
import { getApiErrorMessage, getValidationErrors } from '../../../utils/apiErrors.js'

function formatAmount(value) { const number = Number(value); return Number.isFinite(number) ? number.toFixed(2) : '-' }
function formatDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '-' : new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date) }
function stockState(quantity) { if (quantity === 0) return ['out', 'Out of stock']; if (quantity <= 5) return ['low', 'Low stock']; return ['in', 'In stock'] }

function StockManagementPage() {
  const [products, setProducts] = useState([])
  const [meta, setMeta] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [lowStock, setLowStock] = useState(false)
  const [page, setPage] = useState(1)
  const [version, setVersion] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [adjusting, setAdjusting] = useState(null)
  const [adjustForm, setAdjustForm] = useState({ quantity: 0, reason: '' })
  const [adjustErrors, setAdjustErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [historyProduct, setHistoryProduct] = useState(null)
  const [movements, setMovements] = useState([])
  const [movementMeta, setMovementMeta] = useState(null)
  const [movementPage, setMovementPage] = useState(1)
  const [movementLoading, setMovementLoading] = useState(false)
  const [movementError, setMovementError] = useState('')

  useEffect(() => {
    let mounted = true
    getStockProducts({ page, per_page: 15, search: search || undefined, low_stock: lowStock ? 1 : undefined })
      .then((response) => { if (mounted) { setProducts(response.data || []); setMeta(response.meta || null); setError('') } })
      .catch((requestError) => mounted && setError(getApiErrorMessage(requestError, 'Stock products could not be loaded.')))
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [lowStock, page, search, version])

  useEffect(() => {
    if (!historyProduct) return undefined
    let mounted = true
    getProductStockMovements(historyProduct.id, { page: movementPage, per_page: 10 })
      .then((response) => { if (mounted) { setMovements(response.data || []); setMovementMeta(response.meta || null); setMovementError('') } })
      .catch((requestError) => mounted && setMovementError(getApiErrorMessage(requestError, 'Movement history could not be loaded.')))
      .finally(() => mounted && setMovementLoading(false))
    return () => { mounted = false }
  }, [historyProduct, movementPage])

  const refresh = () => { setLoading(true); setVersion((v) => v + 1) }
  const openAdjust = (product) => { setAdjusting(product); setAdjustForm({ quantity: product.stock_quantity, reason: '' }); setAdjustErrors({}) }
  const openHistory = (product) => { setHistoryProduct(product); setMovementPage(1); setMovementLoading(true); setMovements([]) }
  const submitSearch = (event) => { event.preventDefault(); setLoading(true); setSearch(searchInput.trim()); setPage(1) }

  const submitAdjustment = async (event) => {
    event.preventDefault()
    const quantity = Number(adjustForm.quantity)
    if (!Number.isInteger(quantity) || quantity < 0) { setAdjustErrors({ quantity: ['Quantity must be a whole number of zero or more.'] }); return }
    setSaving(true); setAdjustErrors({})
    try {
      await adjustProductStock(adjusting.id, { quantity, reason: adjustForm.reason.trim() || null })
      setAdjusting(null); refresh()
      await Swal.fire({ icon: 'success', title: 'Stock updated', text: `${adjusting.name} now has ${quantity} units.`, timer: 1500, showConfirmButton: false, customClass: { popup: 'storefront-alert' } })
    } catch (requestError) {
      const validation = getValidationErrors(requestError); setAdjustErrors(validation)
      if (Object.keys(validation).length === 0) await Swal.fire({ icon: 'error', title: 'Adjustment failed', text: getApiErrorMessage(requestError, 'Stock could not be adjusted.'), buttonsStyling: false, customClass: { popup: 'storefront-alert', confirmButton: 'swal-brand-button' } })
    } finally { setSaving(false) }
  }

  const totalUnits = products.reduce((sum, product) => sum + Number(product.stock_quantity || 0), 0)
  const lowCount = products.filter((product) => product.stock_quantity > 0 && product.stock_quantity <= 5).length
  const outCount = products.filter((product) => product.stock_quantity === 0).length

  return <main className="admin-stock-page admin-list-page app-page-shell">
    <header className="category-list-heading admin-list-header app-page-header admin-stock-header"><div className="admin-list-title-group"><span className="admin-eyebrow app-page-eyebrow">Inventory control</span><h1 className="app-page-title">Stock Management</h1><p className="app-page-subtitle">Monitor availability, correct inventory, and audit every stock change.</p></div><button className="admin-refresh-button" type="button" onClick={refresh} disabled={loading} aria-label="Refresh stock data"><i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`} /></button></header>
    <section className="stock-summary-grid admin-stock-summary">{[['Products shown', products.length, 'bi-box-seam', 'blue'], ['Low stock', lowCount, 'bi-exclamation-triangle', 'amber'], ['Out of stock', outCount, 'bi-box2', 'red'], ['Units shown', totalUnits, 'bi-stack', 'green']].map(([label, value, icon, tone]) => <article className="app-stat-card" key={label}><span className={`tone-${tone}`}><i className={`bi ${icon}`} /></span><div><small>{label}</small><strong>{value}</strong></div></article>)}</section>
    <section className="category-list-card stock-list-card admin-table-card"><div className="stock-toolbar admin-table-toolbar admin-filter-card"><form className="category-search-form admin-filter-control" onSubmit={submitSearch}><i className="bi bi-search" /><input type="search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search name, slug, or SKU..." /><button type="submit">Search</button></form><button className={`stock-low-filter ${lowStock ? 'active' : ''}`} type="button" onClick={() => { setLoading(true); setLowStock((v) => !v); setPage(1) }}><i className="bi bi-exclamation-triangle" /> Low stock only</button></div>
      {error && <div className="alert category-alert category-alert-danger"><i className="bi bi-exclamation-octagon" /><span>{error}</span><button type="button" onClick={refresh}>Retry</button></div>}
      {loading ? <div className="category-table-loading">{[1,2,3,4].map((n)=><span key={n}/>)}</div> : products.length === 0 ? <div className="category-empty-state admin-empty-state"><span className="category-empty-icon"><i className="bi bi-boxes" /></span><h2>No stock products found</h2><p>Try clearing the current search or low-stock filter.</p></div> : <><div className="table-responsive category-table-wrap admin-table-wrap"><table className="table category-table stock-table admin-table align-middle mb-0"><thead><tr><th>Product</th><th>Status</th><th>Stock</th><th>Price</th><th>Updated</th><th className="text-end">Actions</th></tr></thead><tbody>{products.map((product) => { const [tone,label]=stockState(product.stock_quantity); return <tr key={product.id}><td data-label="Product"><div className="stock-product-cell"><span>{product.primary_image?.url ? <img src={product.primary_image.url} alt=""/> : <i className="bi bi-box-seam"/>}</span><div><strong>{product.name}</strong><small>{product.sku || product.slug}</small></div></div></td><td data-label="Status"><span className={`category-status-badge admin-status-badge ${product.is_active ? 'is-active success':'is-inactive neutral'}`}><span/>{product.is_active?'Active':'Inactive'}</span></td><td data-label="Stock"><span className={`stock-level admin-stock-indicator ${tone === 'in' ? 'in-stock' : tone === 'low' ? 'low-stock' : 'out-of-stock'} is-${tone}`}><strong>{product.stock_quantity}</strong><small>{label}</small></span></td><td data-label="Price"><strong>{formatAmount(product.price)}</strong></td><td data-label="Updated"><span className="category-created-date">{formatDate(product.updated_at)}</span></td><td data-label="Actions"><div className="stock-actions admin-table-actions"><button type="button" onClick={()=>openAdjust(product)}><i className="bi bi-sliders"/> Adjust Stock</button><button type="button" onClick={()=>openHistory(product)}><i className="bi bi-clock-history"/> Movements</button></div></td></tr>})}</tbody></table></div>{meta?.last_page>1&&<footer className="category-pagination admin-pagination-wrap"><span>Showing <strong>{meta.from||0}</strong> to <strong>{meta.to||0}</strong> of <strong>{meta.total}</strong></span><nav><button type="button" disabled={page<=1} onClick={()=>{setLoading(true);setPage(p=>p-1)}}><i className="bi bi-chevron-left"/></button><span>Page {meta.current_page} of {meta.last_page}</span><button type="button" disabled={page>=meta.last_page} onClick={()=>{setLoading(true);setPage(p=>p+1)}}><i className="bi bi-chevron-right"/></button></nav></footer>}</>}
    </section>
    {adjusting && <div className="stock-modal-backdrop"><section className="stock-modal app-form-card admin-stock-adjustment-modal" role="dialog" aria-modal="true"><header><div><span>Inventory adjustment</span><h2>{adjusting.name}</h2></div><button type="button" onClick={()=>setAdjusting(null)} aria-label="Close stock adjustment"><i className="bi bi-x-lg"/></button></header><form className="admin-stock-adjustment-form" onSubmit={submitAdjustment}><label htmlFor="stock-quantity">New stock quantity</label><input id="stock-quantity" type="number" min="0" step="1" value={adjustForm.quantity} onChange={(e)=>setAdjustForm(f=>({...f,quantity:e.target.value}))}/>{adjustErrors.quantity?.map(m=><span className="category-field-error" key={m}>{m}</span>)}<label htmlFor="stock-reason">Reason <small>Optional</small></label><textarea id="stock-reason" rows="4" maxLength="1000" value={adjustForm.reason} onChange={(e)=>setAdjustForm(f=>({...f,reason:e.target.value}))}/>{adjustErrors.reason?.map(m=><span className="category-field-error" key={m}>{m}</span>)}<footer><button className="btn btn-admin-soft" type="button" onClick={()=>setAdjusting(null)}>Cancel</button><button className="btn btn-admin-primary" type="submit" disabled={saving}>{saving?'Saving...':'Save adjustment'}</button></footer></form></section></div>}
    {historyProduct && <div className="stock-modal-backdrop"><section className="stock-modal stock-history-modal app-section-card admin-stock-movement-modal" role="dialog" aria-modal="true"><header><div><span>Movement history</span><h2>{historyProduct.name}</h2></div><button type="button" onClick={()=>setHistoryProduct(null)} aria-label="Close movement history"><i className="bi bi-x-lg"/></button></header><div className="stock-movement-list admin-stock-movement-list">{movementError&&<div className="category-alert category-alert-danger">{movementError}</div>}{movementLoading?<div className="category-table-loading"><span/><span/><span/></div>:movements.length===0?<div className="stock-movement-empty admin-empty-state"><i className="bi bi-clock-history"/><p>No stock movements yet.</p></div>:movements.map((movement)=><article className="admin-stock-movement-item" key={movement.id}><span className={`movement-icon is-${movement.type}`}><i className={`bi ${movement.type==='order_placed'?'bi-cart-check':'bi-sliders'}`}/></span><div><header><strong>{movement.type.replaceAll('_',' ')}</strong><time>{formatDate(movement.created_at)}</time></header><p>{movement.reason||'No reason provided.'}</p><div><span>Before <b>{movement.quantity_before}</b></span><span className={`admin-movement-delta ${movement.quantity_changed > 0 ? 'positive' : movement.quantity_changed < 0 ? 'negative' : 'neutral'}`}>{movement.quantity_changed>0?'+':''}{movement.quantity_changed}</span><span>After <b>{movement.quantity_after}</b></span></div>{movement.reference&&<small>Reference: {movement.reference.type} #{movement.reference.id}</small>}{movement.created_by&&<small>By {movement.created_by.name}</small>}</div></article>)}</div>{movementMeta?.last_page>1&&<footer className="stock-history-pagination"><button type="button" disabled={movementPage<=1} onClick={()=>{setMovementLoading(true);setMovementPage(p=>p-1)}}>Previous</button><span>{movementMeta.current_page} / {movementMeta.last_page}</span><button type="button" disabled={movementPage>=movementMeta.last_page} onClick={()=>{setMovementLoading(true);setMovementPage(p=>p+1)}}>Next</button></footer>}</section></div>}
  </main>
}

export default StockManagementPage
