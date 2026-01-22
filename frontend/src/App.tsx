import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { UserProvider } from '@/contexts/UserContext'
import { DarkModeProvider } from '@/contexts/DarkModeContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Movies from '@/pages/Movies'
import Rankings from '@/pages/Rankings'
import MyRankings from '@/pages/MyRankings'
import Users from '@/pages/Users'
import Profile from '@/pages/Profile'
import Login from '@/pages/Login'

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = localStorage.getItem('user')
  return user ? <>{children}</> : <Navigate to="/login" />
}

function App() {
  return (
    <ErrorBoundary>
      <DarkModeProvider>
        <UserProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
                }>
                  <Route index element={<Dashboard />} />
                  <Route path="movies" element={<Movies />} />
                  <Route path="rankings" element={<Rankings />} />
                  <Route path="my-rankings" element={<MyRankings />} />
                  <Route path="users" element={<Users />} />
                  <Route path="profile" element={<Profile />} />
                </Route>
            </Routes>
          </Router>
        </UserProvider>
      </DarkModeProvider>
    </ErrorBoundary>
  )
}

export default App