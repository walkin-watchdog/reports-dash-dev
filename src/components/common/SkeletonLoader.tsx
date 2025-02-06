import React from 'react';
import { Box, Skeleton } from '@mui/material';
import { keyframes } from '@mui/system';

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

interface SkeletonLoaderProps {
  type: 'chart' | 'table' | 'summary';
  rows?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type, rows = 5 }) => {
  const commonStyles = {
    animation: `${shimmer} 2s infinite linear`,
    background:
      'linear-gradient(to right, #f6f7f8 8%, #edeef1 18%, #f6f7f8 33%)',
    backgroundSize: '2000px 100%',
  };

  switch (type) {
    case 'chart':
      return (
        <Box
          sx={{ width: '100%', height: 300, ...commonStyles, borderRadius: 1 }}
          data-testid="chart-skeleton"
        />
      );
    case 'table':
      return (
        <Box sx={{ width: '100%' }} data-testid="table-skeleton">
          <Box sx={{ display: 'flex', mb: 1 }}>
            {[...Array(4)].map((_, i) => (
              <Box
                key={i}
                sx={{
                  flex: 1,
                  height: 40,
                  mr: 1,
                  ...commonStyles,
                  borderRadius: 1,
                }}
              />
            ))}
          </Box>
          {[...Array(rows)].map((_, i) => (
            <Box key={i} sx={{ display: 'flex', mb: 1 }}>
              {[...Array(4)].map((_, j) => (
                <Box
                  key={j}
                  sx={{
                    flex: 1,
                    height: 30,
                    mr: 1,
                    ...commonStyles,
                    borderRadius: 1,
                  }}
                />
              ))}
            </Box>
          ))}
        </Box>
      );
    case 'summary':
      return (
        <Box sx={{ width: '100%' }} data-testid="summary-skeleton">
          <Skeleton
            variant="rectangular"
            height={60}
            sx={{ mb: 2, ...commonStyles }}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            {[...Array(3)].map((_, i) => (
              <Box key={i} sx={{ flex: 1 }}>
                <Skeleton
                  variant="rectangular"
                  height={100}
                  sx={{ ...commonStyles }}
                />
              </Box>
            ))}
          </Box>
        </Box>
      );
    default:
      return null;
  }
};

export default SkeletonLoader;
