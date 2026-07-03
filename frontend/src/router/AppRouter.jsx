import { Navigate, Route, Routes } from 'react-router-dom'
import AdminRoute from '../components/common/AdminRoute.jsx'
import GuestRoute from '../components/common/GuestRoute.jsx'
import ProtectedRoute from '../components/common/ProtectedRoute.jsx'
import AdminLayout from '../layouts/AdminLayout.jsx'
import AppLayout from '../layouts/AppLayout.jsx'
import AuthLayout from '../layouts/AuthLayout.jsx'
import AccountDashboardPage from '../pages/account/AccountDashboardPage.jsx'
import OrderDetailsPage from '../pages/account/OrderDetailsPage.jsx'
import OrdersPage from '../pages/account/OrdersPage.jsx'
import MyReviewsPage from '../pages/account/MyReviewsPage.jsx'
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.jsx'
import AdminCouponCreatePage from '../pages/admin/coupons/AdminCouponCreatePage.jsx'
import AdminCouponDetailsPage from '../pages/admin/coupons/AdminCouponDetailsPage.jsx'
import AdminCouponEditPage from '../pages/admin/coupons/AdminCouponEditPage.jsx'
import AdminCouponListPage from '../pages/admin/coupons/AdminCouponListPage.jsx'
import AdminOrderDetailsPage from '../pages/admin/orders/AdminOrderDetailsPage.jsx'
import AdminOrdersPage from '../pages/admin/orders/AdminOrdersPage.jsx'
import AdminProductReviewsPage from '../pages/admin/reviews/AdminProductReviewsPage.jsx'
import StockManagementPage from '../pages/admin/stock/StockManagementPage.jsx'
import CategoryCreatePage from '../pages/admin/categories/CategoryCreatePage.jsx'
import CategoryEditPage from '../pages/admin/categories/CategoryEditPage.jsx'
import CategoryListPage from '../pages/admin/categories/CategoryListPage.jsx'
import ProductCreatePage from '../pages/admin/products/ProductCreatePage.jsx'
import ProductEditPage from '../pages/admin/products/ProductEditPage.jsx'
import ProductListPage from '../pages/admin/products/ProductListPage.jsx'
import LoginPage from '../pages/auth/LoginPage.jsx'
import RegisterPage from '../pages/auth/RegisterPage.jsx'
import CartPage from '../pages/cart/CartPage.jsx'
import CheckoutPage from '../pages/checkout/CheckoutPage.jsx'
import NotFoundPage from '../pages/errors/NotFoundPage.jsx'
import HomePage from '../pages/HomePage.jsx'
import ProductDetailPage from '../pages/storefront/ProductDetailPage.jsx'
import ProductListingPage from '../pages/storefront/ProductListingPage.jsx'

function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductListingPage />} />
        <Route path="products/:slug" element={<ProductDetailPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="account" element={<AccountDashboardPage />} />
          <Route path="account/orders" element={<OrdersPage />} />
          <Route path="account/orders/:id" element={<OrderDetailsPage />} />
          <Route path="account/reviews" element={<MyReviewsPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route element={<GuestRoute />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="categories" element={<CategoryListPage />} />
          <Route path="categories/create" element={<CategoryCreatePage />} />
          <Route path="categories/:id/edit" element={<CategoryEditPage />} />
          <Route path="products" element={<ProductListPage />} />
          <Route path="products/create" element={<ProductCreatePage />} />
          <Route path="products/:id/edit" element={<ProductEditPage />} />
          <Route path="coupons" element={<AdminCouponListPage />} />
          <Route path="coupons/create" element={<AdminCouponCreatePage />} />
          <Route path="coupons/:id" element={<AdminCouponDetailsPage />} />
          <Route path="coupons/:id/edit" element={<AdminCouponEditPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="orders/:id" element={<AdminOrderDetailsPage />} />
          <Route path="product-reviews" element={<AdminProductReviewsPage />} />
          <Route path="stock" element={<StockManagementPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default AppRouter
