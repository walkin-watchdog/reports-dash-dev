// src/components/live/CellErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';

/**
 * A small ErrorBoundary that wraps each RoomGrid cell.
 * If a cell throws during render, we fall back to an empty <div>
 * (or you can render a “broken cell” indicator).
 */
interface CellErrorBoundaryProps {
  children: ReactNode;
  // Optionally: pass down row/column indices or room id for logging
}
interface CellErrorBoundaryState {
  hasError: boolean;
}

export class CellErrorBoundary extends Component<CellErrorBoundaryProps, CellErrorBoundaryState> {
  constructor(props: CellErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): CellErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[CellErrorBoundary] caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // fallback to a pale red cell (same dimensions)
      return <div style={{ width: '100%', height: '100%', backgroundColor: 'rgba(255,0,0,0.1)' }} />;
    }
    return this.props.children;
  }
}

export default CellErrorBoundary;