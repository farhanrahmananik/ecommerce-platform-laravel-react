import { Navigate, Route, Routes } from 'react-router-dom'
import AdminRoute from '../components/common/AdminRoute.jsx'
import GuestRoute from '../components/common/GuestRoute.jsx'
import ProtectedRoute from '../components/common/ProtectedRoute.jsx'
import AdminLayout from '../layouts/AdminLayout.jsx'
import AppLayout from '../layouts/AppLayout.jsx'
import AuthLayout from '../layouts/AuthLayout.jsx'
import AccountDashboardPage from '../pages/account/AccountDashboardPage.jsx'
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.jsx'
import LoginPage from '../pages/auth/LoginPage.jsx'
import RegisterPage from '../pages/auth/RegisterPage.jsx'
import NotFoundPage from '../pages/errors/NotFoundPage.jsx'
import HomePage from '../pages/HomePage.jsx'

function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="account" element={<AccountDashboardPage />} />
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
        </Route>
      </Route>
    </Routes>
  )
}

export default AppRouter
