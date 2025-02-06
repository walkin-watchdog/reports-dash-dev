import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { login } from '../../services/api';
import { setCredentials } from '../../store/slices/authSlice';
import { Hotel } from 'lucide-react';
import { componentStyles } from '../../theme';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await login(email, password);
      localStorage.setItem('auth_token', response.body.token);
      dispatch(
        setCredentials({ user: response.body.user, token: response.body.token })
      );
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await login('demo@example.com', 'demo');
      localStorage.setItem('auth_token', response.body.token);
      dispatch(
        setCredentials({ user: response.body.user, token: response.body.token })
      );
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={componentStyles.loginPage.container}>
      <Card sx={componentStyles.loginPage.card}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 1 }}>
            {logoError ? (
              <Box sx={componentStyles.loginPage.hotelIcon}>
                <Hotel size={64} color="#6366F1" data-testid="hotel-icon" />
              </Box>
            ) : (
              <Box
                component="img"
                src="src/images/logo.jpg"
                alt="Walk-in Watchdog Logo"
                onError={() => setLogoError(true)}
                sx={componentStyles.loginPage.logo}
              />
            )}
            <Typography
              variant="h4"
              component="h1"
              sx={componentStyles.loginPage.title}
            >
              Walk-in Watchdog
            </Typography>
            <Typography
              variant="subtitle1"
              color="text.secondary"
              sx={componentStyles.loginPage.subtitle}
            >
              Peace of Mind for Hoteliers
            </Typography>
          </Box>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoFocus
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              disabled={loading}
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </form>
          {import.meta.env.DEV && (
            <Button
              fullWidth
              onClick={handleDemoLogin}
              variant="outlined"
              size="large"
              disabled={loading}
              sx={{ mt: 2 }}
            >
              Demo Login
            </Button>
          )}
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              color="primary"
              onClick={() => navigate('/forgot-password')}
              disabled={loading}
            >
              Forgot Password?
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;
