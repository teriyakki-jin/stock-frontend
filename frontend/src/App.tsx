import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import AuthPage from './pages/AuthPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import DashboardPage from './pages/DashboardPage'
import TradePage from './pages/TradePage'
import RankingPage from './pages/RankingPage'
import ProfilePage from './pages/ProfilePage'
import AiReportPage from './pages/AiReportPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Layout><DashboardPage /></Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/trade"
        element={
          <PrivateRoute>
            <Layout><TradePage /></Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/ranking"
        element={
          <Layout><RankingPage /></Layout>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Layout><ProfilePage /></Layout>
          </PrivateRoute>
        }
      />

      <Route
        path="/ai-report"
        element={
          <PrivateRoute>
            <Layout><AiReportPage /></Layout>
          </PrivateRoute>
        }
      />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  )
}
