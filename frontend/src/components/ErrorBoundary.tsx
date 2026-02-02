import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground bg-secondary/10 rounded-lg">
                    <AlertCircle className="h-8 w-8 mb-2 text-destructive" />
                    <p className="text-sm font-medium text-foreground">Something went wrong</p>
                    <p className="text-xs max-w-[200px] truncate" title={this.state.error?.message}>
                        {this.state.error?.message || "Unknown error"}
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}
