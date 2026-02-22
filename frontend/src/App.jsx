import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/user/LoginPage'
import { RegisterPage } from './pages/user/RegisterPage'
import { HomePage } from './pages/dashboard/HomePage'
import { AdminDashboard } from './pages/dashboard/AdminDashboard'
import { AuthorityDashboard } from './pages/dashboard/AuthorityDashboard'
import { UnauthorizedPage } from './pages/UnauthorizedPage'

function App() {
  const { isAuthenticated, initializing } = useAuth()

  if (initializing) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/home" /> : <LandingPage />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/home" /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/home" /> : <RegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Protected Routes */}
      <Route
        path="/home"
        element={
          <ProtectedRoute allowedRoles={['citizen']}>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/authority-dashboard"
        element={
          <ProtectedRoute allowedRoles={['authority']}>
            <AuthorityDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
