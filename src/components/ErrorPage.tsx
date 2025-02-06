import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { componentStyles } from '../theme';

const ErrorPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Box sx={componentStyles.errorPage.container}>
      <Box sx={componentStyles.errorPage.content}>
        {/* Wrap the AlertTriangle to center it */}
        <Box sx={{ mb: 1, display: 'flex', justifyContent: 'center' }}>
          <AlertTriangle size={64} color="#f44336" />
        </Box>
        <Typography variant="h3" gutterBottom>
          404: Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          The page you're looking for doesn't exist or has been moved.
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/dashboard')}
          sx={componentStyles.errorPage.button}
        >
          Return to Dashboard
        </Button>
      </Box>
    </Box>
  );
};

export default ErrorPage;
