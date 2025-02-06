import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
} from '@mui/material';
import { Hotel } from 'lucide-react';
import {
  forgotPassword,
  verifyCode,
  resetPassword,
  checkEmailExists,
} from '../../services/api';
import { componentStyles } from '../../theme';

const steps = ['Enter Email', 'Verify Code', 'Reset Password'];

const ForgotPassword: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [codeVerified, setCodeVerified] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendDisabled && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setResendDisabled(false);
      setCountdown(30);
    }
    return () => clearInterval(timer);
  }, [resendDisabled, countdown]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await checkEmailExists(email);
      await forgotPassword(email);
      setActiveStep(1);
      setResendDisabled(true);
    } catch (err: any) {
      if (err.code === 404)
        setError('This email is not registered in our system.');
      else setError(err.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await verifyCode(email, code);
      setCodeVerified(true);
      setActiveStep(2);
    } catch (err: any) {
      setError(err.message || 'Invalid verification code.');
      setCodeVerified(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeVerified) {
      setError('Please verify your code first.');
      setActiveStep(1);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await resetPassword(email, code, newPassword);
      navigate('/login', {
        state: {
          message:
            'Password reset successful. Please login with your new password.',
        },
      });
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError(null);
    setLoading(true);
    try {
      await forgotPassword(email);
      setResendDisabled(true);
      setCountdown(30);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <form onSubmit={handleEmailSubmit}>
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
              error={!!error}
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3 }}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                'Send Verification Code'
              )}
            </Button>
          </form>
        );
      case 1:
        return (
          <form onSubmit={handleCodeVerification}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              A verification code has been sent to {email}
            </Typography>
            <TextField
              fullWidth
              label="Verification Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              margin="normal"
              required
              autoFocus
              disabled={loading}
              error={!!error}
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Verify Code'}
            </Button>
            <Button
              fullWidth
              onClick={handleResendCode}
              disabled={loading || resendDisabled}
              sx={{ mt: 2 }}
            >
              {resendDisabled ? `Resend Code (${countdown}s)` : 'Resend Code'}
            </Button>
            {resendDisabled && (
              <LinearProgress
                variant="determinate"
                value={(countdown / 30) * 100}
                sx={{ mt: 1 }}
              />
            )}
          </form>
        );
      case 2:
        return (
          <form onSubmit={handlePasswordReset}>
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              margin="normal"
              required
              autoFocus
              disabled={loading}
              error={!!error}
              helperText="Password must be at least 8 characters long"
            />
            <TextField
              fullWidth
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="normal"
              required
              disabled={loading}
              error={!!error}
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || !codeVerified}
              sx={{ mt: 3 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Reset Password'}
            </Button>
          </form>
        );
      default:
        return null;
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
            <Typography variant="h4" component="h1" sx={{ mt: 2 }}>
              Reset Password
            </Typography>
          </Box>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          {renderStepContent()}
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              color="primary"
              onClick={() => navigate('/login')}
              disabled={loading}
            >
              Back to Login
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ForgotPassword;
