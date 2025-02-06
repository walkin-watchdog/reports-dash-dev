import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from './store/slices/authSlice';
import LiveErrorBoundary from './components/live/LiveErrorBoundary';
import LoginPage from './components/auth/LoginPage';
import LiveDashboard from './components/live/LiveDashboard';
import ErrorBoundary from './components/ErrorBoundary';
import { analytics } from './utils/analytics';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { LinearProgress, Box, useTheme } from '@mui/material';
import SkipLink from './components/common/SkipLink';

// Lazy load components
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const ForgotPassword = lazy(() => import('./components/auth/ForgotPassword'));

const PrivateRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  return isAuthenticated ? element : <Navigate to="/login" replace />;
};

function App() {
  const location = useLocation();
  const theme = useTheme();

  useEffect(() => {
    analytics.trackPageView(location.pathname);
  }, [location]);

  return (
    <Box sx={{ bgcolor: theme.palette.background.default, minHeight: '100vh' }}>
      <ErrorBoundary>
        <SkipLink />
        <Suspense fallback={
          <Box sx={{ width: '100%', position: 'fixed', top: 0, zIndex: 9999 }}>
            <LinearProgress />
          </Box>
        }>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route
              path="/dashboard/*"
              element={<PrivateRoute element={<Dashboard />} />}
            />
            <Route
              path="/live/*"
              element={<PrivateRoute element={
                <LiveErrorBoundary>
                  <LiveDashboard />
                </LiveErrorBoundary>
              } />}
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Box>
  );
}

export default App;