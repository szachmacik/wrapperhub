import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-lg text-center">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
              <AlertTriangle size={32} className="text-destructive" />
            </div>

            <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-6">
              An unexpected error occurred. You can try reloading the page or go back to the dashboard.
            </p>

            {/* Error details (collapsible) */}
            <details className="w-full mb-6 text-left">
              <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors mb-2">
                Show error details
              </summary>
              <div className="p-4 rounded-lg bg-muted overflow-auto max-h-48">
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-all">
                  {this.state.error?.message}
                  {"\n\n"}
                  {this.state.error?.stack}
                </pre>
              </div>
            </details>

            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                  "bg-primary text-primary-foreground",
                  "hover:opacity-90 cursor-pointer transition-opacity"
                )}
              >
                <RotateCcw size={16} />
                Reload Page
              </button>
              <button
                onClick={() => { window.location.href = "/dashboard"; }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                  "border border-border bg-background text-foreground",
                  "hover:bg-muted cursor-pointer transition-colors"
                )}
              >
                <Home size={16} />
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
