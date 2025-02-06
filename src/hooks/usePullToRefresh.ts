import { useState, useRef } from 'react';
import { analytics } from '../utils/analytics';

interface PullToRefreshProps {
  threshold?: number;
  onRefresh: () => void;
  disabled?: boolean;
}

export const usePullToRefresh = ({
  threshold = 60,
  onRefresh,
  disabled = false,
}: PullToRefreshProps) => {
  const [pullStartY, setPullStartY] = useState(0);
  const [pullMoveY, setPullMoveY] = useState(0);
  const [pulling, setPulling] = useState(false);
  const [pullLoading, setPullLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || pullLoading) return;

    // Only enable pull to refresh when at the top of the container
    if (containerRef.current?.scrollTop === 0) {
      setPullStartY(e.touches[0].clientY);
      setPulling(true);
      analytics.trackEvent('PullToRefresh', 'Start');
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!pulling || disabled || pullLoading) return;

    const touch = e.touches[0];
    const pullDistance = touch.clientY - pullStartY;

    // Only handle downward pulls
    if (pullDistance > 0) {
      e.preventDefault();
      setPullMoveY(pullDistance);
      analytics.trackEvent('PullToRefresh', 'Pull', undefined, Math.round(pullDistance));
    }
  };

  const handleTouchEnd = () => {
    if (!pulling || disabled) return;

    setPulling(false);
    
    // If pulled past threshold, trigger refresh
    if (pullMoveY >= threshold) {
      setPullLoading(true);
      analytics.trackEvent('PullToRefresh', 'Refresh');
      
      // Call onRefresh and reset after completion
      Promise.resolve(onRefresh()).finally(() => {
        setPullLoading(false);
        setPullMoveY(0);
      });
    } else {
      setPullMoveY(0);
      analytics.trackEvent('PullToRefresh', 'Cancel');
    }
  };

  return {
    containerRef,
    pullLoading,
    pullDistance: pullMoveY,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};