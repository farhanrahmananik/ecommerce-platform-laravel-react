import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { CartContext } from '../hooks/useCart.js'
import {
  addCartItem,
  clearCart as clearCartRequest,
  getCart,
  removeCartItem,
  updateCartItem,
} from '../services/cartService.js'
import {
  getApiErrorMessage,
  getValidationErrors,
} from '../utils/apiErrors.js'

const emptySummary = {
  items: [],
  itemsCount: 0,
  subtotal: '0.00',
  total: '0.00',
}

function getCartErrorMessage(error, fallbackMessage) {
  const validationErrors = getValidationErrors(error)
  const firstValidationMessage = Object.values(validationErrors)
    .flat()
    .find((message) => typeof message === 'string')

  return firstValidationMessage || getApiErrorMessage(error, fallbackMessage)
}

function extractCart(response) {
  return response?.data ?? null
}

export function CartProvider({ children }) {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)
  const requestVersionRef = useRef(0)
  const fetchVersionRef = useRef(0)
  const actionVersionRef = useRef(0)
  const loadedUserIdRef = useRef(null)

  const clearCartState = useCallback(() => {
    setCart(null)
    setLoading(false)
    setActionLoading(false)
    setError(null)
  }, [])

  const resetCart = useCallback(() => {
    requestVersionRef.current += 1
    fetchVersionRef.current += 1
    actionVersionRef.current += 1
    loadedUserIdRef.current = null
    clearCartState()
  }, [clearCartState])

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      resetCart()

      return null
    }

    const requestVersion = ++requestVersionRef.current
    const fetchVersion = ++fetchVersionRef.current
    setLoading(true)
    setError(null)

    try {
      const response = await getCart()
      const nextCart = extractCart(response)

      if (requestVersion === requestVersionRef.current) {
        setCart(nextCart)
      }

      return nextCart
    } catch (requestError) {
      if (requestVersion === requestVersionRef.current) {
        setError(
          getCartErrorMessage(
            requestError,
            'Unable to load your cart. Please try again.',
          ),
        )
      }

      throw requestError
    } finally {
      if (fetchVersion === fetchVersionRef.current) {
        setLoading(false)
      }
    }
  }, [isAuthenticated, resetCart])

  const runCartAction = useCallback(async (request, fallbackMessage) => {
    const requestVersion = ++requestVersionRef.current
    const actionVersion = ++actionVersionRef.current
    setActionLoading(true)
    setError(null)

    try {
      const response = await request()
      const nextCart = extractCart(response)

      if (requestVersion === requestVersionRef.current) {
        setCart(nextCart)
      }

      return nextCart
    } catch (requestError) {
      if (requestVersion === requestVersionRef.current) {
        setError(getCartErrorMessage(requestError, fallbackMessage))
      }

      throw requestError
    } finally {
      if (actionVersion === actionVersionRef.current) {
        setActionLoading(false)
      }
    }
  }, [])

  const addItem = useCallback(
    (productId, quantity = 1) =>
      runCartAction(
        () => addCartItem({ product_id: productId, quantity }),
        'Unable to add this product to your cart.',
      ),
    [runCartAction],
  )

  const updateItem = useCallback(
    (cartItemId, quantity) =>
      runCartAction(
        () => updateCartItem(cartItemId, { quantity }),
        'Unable to update this cart item.',
      ),
    [runCartAction],
  )

  const removeItem = useCallback(
    (cartItemId) =>
      runCartAction(
        () => removeCartItem(cartItemId),
        'Unable to remove this cart item.',
      ),
    [runCartAction],
  )

  const clearCart = useCallback(
    () =>
      runCartAction(
        () => clearCartRequest(),
        'Unable to clear your cart.',
      ),
    [runCartAction],
  )

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (!isAuthenticated) {
      const resetTimeout = window.setTimeout(resetCart, 0)

      return () => window.clearTimeout(resetTimeout)
    }

    if (loadedUserIdRef.current === user?.id) {
      return
    }

    loadedUserIdRef.current = user?.id
    fetchCart().catch(() => undefined)
  }, [authLoading, fetchCart, isAuthenticated, resetCart, user?.id])

  const summary = useMemo(() => {
    if (!cart) {
      return emptySummary
    }

    return {
      items: Array.isArray(cart.items) ? cart.items : [],
      itemsCount: Number(cart.items_count ?? 0),
      subtotal: cart.subtotal ?? '0.00',
      total: cart.total ?? '0.00',
    }
  }, [cart])

  const value = useMemo(
    () => ({
      cart,
      ...summary,
      loading,
      actionLoading,
      error,
      fetchCart,
      addItem,
      updateItem,
      removeItem,
      clearCart,
      resetCart,
    }),
    [
      actionLoading,
      addItem,
      cart,
      clearCart,
      error,
      fetchCart,
      loading,
      removeItem,
      resetCart,
      summary,
      updateItem,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
