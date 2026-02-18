import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background">
          <div className="glass-panel border-0 max-w-md w-full mx-4 p-6 text-center">
            <div className="text-lg font-semibold text-white">Something went wrong</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Please refresh the page. If the issue persists, try again later.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}