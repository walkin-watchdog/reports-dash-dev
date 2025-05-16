# Hotel Occupancy Dashboard

A comprehensive dashboard application for managing hotel occupancy data across multiple properties, featuring integrated Reports and Live views. Built with React, Material UI, and AWS services.

## Features

### Dashboard Views

- Reports Dashboard: Historical occupancy data and analytics with detailed reports
- Live Dashboard: Real-time room status monitoring with instant updates
- Seamless navigation between both dashboards

### Authentication & User Access

- Secure login with email and password
- Forgot password workflow with email verification
- Multi-hotel access management
- Demo login available in development mode

### Reports Dashboard Features

- Day View with detailed occupancy information
- Range View (weekly, monthly, custom dates)
- Comparative Analysis between dates
- Real-time occupancy tracking
- Early check-in and late check-out monitoring

### Live Dashboard Features

- Real-time room status updates
- Instant occupancy changes
- Pull-to-refresh functionality for data updates
- Active/Inactive room monitoring
- Room category filtering
- Smooth transitions between views
- Mobile-responsive design

### Data Visualization

- Interactive charts using Chart.js
- Occupancy trends and patterns
- Room category distribution

### Export & Reports

- PDF export functionality
- Customizable date ranges
- Detailed occupancy reports

## Technology Stack

### Frontend

- React 18 with TypeScript
- Material UI & Tailwind CSS
- WebSocket integration for real-time updates
- Chart.js with react-chartjs-2
- Redux Toolkit for state management
- React Router for navigation
- Date-fns for date manipulation

### Backend Integration

- AWS Amplify
- API Gateway
- Lambda Functions
- DynamoDB
- WebSocket for real-time updates in Live Dashboard

## Navigation

The application features seamless integrated navigation between Reports and Live dashboards:

### Reports to Live

- Access the Live Dashboard through the Live tab in the top AppBar
- Opens in the same browser tab without external redirects
- Automatically maintains selected hotel context

### Live to Reports

- Use the third tab in the bottom toggle slider
- Returns to Reports Dashboard in the same tab
- Preserves hotel selection and authentication state

### Shared Context

- Hotel selection is maintained across both dashboards
- Authentication state is shared between views
- Seamless user experience with no need to re-authenticate

## Local Storage

The application uses local storage for:

- Authentication:
  - JWT Token for secure authentication across dashboards
  - Automatic token refresh handling
- Hotel Context:
  - Selected hotel ID for consistent views
  - Used by both REST API and WebSocket connections
- Cache Storage:
  - Optimizes data loading and state persistence
  - Reduces unnecessary API calls

## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── live/          # Live Dashboard components
│   ├── reports/       # Reports Dashboard components
│   └── common/        # Shared components
├── config/            # Configuration files
├── hooks/             # Custom React hooks
├── pages/             # Page components
├── services/          # API and service layer
│   ├── api.ts         # REST API service
│   ├── websocket.ts   # WebSocket service
│   └── cacheStorage.ts # Cache management
├── store/             # Redux store and slices
├── styles/            # Global styles
├── theme/             # Theme configuration
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
    ├── analytics.ts   # Analytics tracking
    ├── errorHandling.ts # Error management
    └── pdfExport.ts   # PDF export functionality
```

## Environment Configuration

The application uses a multi-environment configuration system:

### Environment Files

- `.env`: Production environment variables
- `.env.example`: Template for environment variables

### Required Environment Variables

```bash
# API Configuration
VITE_API_ENDPOINT=http://localhost:3000
VITE_API_REGION=local
VITE_API_NAME=native

# API Base Path
VITE_API_BASE_PATH=/api
VITE_API_VERSION=v1

# Auth Endpoints
VITE_AUTH_LOGIN=/auth/login
VITE_AUTH_REFRESH=/auth/refresh
VITE_AUTH_FORGOT_PASSWORD=/auth/forgot-password
VITE_AUTH_RESET_PASSWORD=/auth/reset-password
VITE_AUTH_VERIFY_CODE=/auth/verify-code
VITE_AUTH_CHECK_EMAIL=/auth/check-email

# Hotel Endpoints
VITE_HOTEL_OCCUPANCY=/hotels/:hotelId/occupancy
VITE_HOTEL_OCCUPANCY_RANGE=/hotels/:hotelId/occupancy/range

# WebSocket Configuration
VITE_WS_ENDPOINT=wss://your-websocket-endpoint.com
```

## Development

### Prerequisites

- Node.js 18+
- npm 9+
- AWS account with appropriate permissions for both REST API and WebSocket access

### Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create `.env` file with AWS configuration
4. Start development server:

```bash
npm run dev
```

### Building

```bash
npm run build
```

## API Integration

### Endpoints

REST API Endpoints:

- Authentication:
  - `/auth/login` - User authentication
  - `/auth/forgot-password` - Password reset initiation
  - `/auth/verify-code` - Verification code validation
  - `/auth/reset-password` - Password reset completion
- Reports Dashboard:
  - `/hotels/:hotelId/occupancy` - Get occupancy data
  - `/hotels/:hotelId/occupancy/range` - Get occupancy range data

WebSocket Integration:

- Connection: `wss://WS_ENDPOINT?token={jwt}&hotelId={id}`
- Message Types:
  - `INITIAL_DATA` - Initial room state
  - `ROOM_UPDATE` - Real-time room updates
  - `PING` - Connection health check
  - `SUBSCRIBE_HOTEL` - Lets the same socket switch hotels without reconnecting
  - `DISCONNECT` - Graceful FIN before closing
  - `ERROR` - Indicates an error

### Request/Response Flow

1. Client sends request with JWT
2. API Gateway validates token
3. Lambda processes request
4. Response is transformed and cached
5. Client updates local state

## Performance Optimizations

### Frontend

- Component code splitting
- Image optimization
- WebSocket connection pooling
- CSS purging
- Tree shaking
- Memoization
- Virtual scrolling

### API

- Request batching
- Response caching
- Connection pooling
- Compression
- CDN integration
- WebSocket message batching

## Security Measures

### Frontend

- Input sanitization
- Output encoding
- WebSocket message validation
- CSRF tokens
- Content Security Policy
- Secure cookie attributes

### API

- JWT validation
- Rate limiting
- Request signing
- IP filtering
- CORS configuration
- WebSocket connection validation

## Error Handling

### Client-side

- Network errors
- API errors
- WebSocket connection errors
- Validation errors
- Authentication errors
- Offline handling

### Server-side

- Input validation
- Error logging
- Status codes
- Error messages
- Recovery mechanisms
- WebSocket error handling

## Monitoring & Logging

### Metrics

- API latency
- Error rates
- WebSocket connection status
- User sessions
- Room status changes
- Cache hit rates

### Logs

- API requests
- Authentication events
- Error events
- State changes
- Performance metrics
- WebSocket events

## Best Practices

### Code Quality

- TypeScript strict mode
- ESLint configuration
- WebSocket connection management
- Prettier formatting

### Security

- Regular dependency updates
- Security audits
- Token rotation
- Error sanitization
- Input validation
- WebSocket message validation

### Performance

- Bundle size monitoring
- Lazy loading
- WebSocket message optimization
- Cache optimization
- API batching
- State normalization