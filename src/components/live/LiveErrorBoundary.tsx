import React, { Component, ErrorInfo } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { AlertTriangle } from 'lucide-react';
import { WebSocketService } from '../../services/websocket';
import { analytics } from '../../utils/analytics';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class LiveErrorBoundary extends Component<Props, State> {
  private ws: WebSocketService;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
    this.ws = WebSocketService.getInstance();
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to analytics
    analytics.trackEvent('Error', 'LiveDashboard Error', error.message);

    // Disconnect WebSocket on error
    this.ws.disconnect();
  }

  handleRetry = () => {
    // Reconnect WebSocket
    this.ws.connect();
    
    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default',
            p: 3,
          }}
        >
          <Box sx={{ textAlign: 'center', maxWidth: 'sm' }}>
            <AlertTriangle size={64} color="#f44336" style={{ marginBottom: '1rem' }} />
            <Typography variant="h4" gutterBottom>
              Something went wrong
            </Typography>
            <Typography color="text.secondary" paragraph>
              {this.state.error?.message || 'An unexpected error occurred'}
            </Typography>
            <Button
              variant="contained"
              onClick={this.handleRetry}
              sx={{ mt: 2 }}
            >
              Retry Connection
            </Button>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default LiveErrorBoundary;