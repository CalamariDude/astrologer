import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  resetErrorBoundary = () => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center">
          <AlertTriangle className="w-8 h-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {this.props.fallbackMessage || 'Something went wrong'}
          </p>
          {this.state.error?.message && (
            <p className="text-xs text-muted-foreground/60 max-w-md font-mono">
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={this.resetErrorBoundary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-muted hover:bg-muted/80 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
