import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorReporting } from "../utils/error-reporting";

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Standard React Error Boundary component.
 * Catches rendering errors in its child component tree to prevent app crashes.
 */
export class AppErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  /**
   * Updates the state when an error is caught during rendering.
   *
   * @param {Error} _ - The error that was thrown.
   * @returns {State} The new state to trigger fallback UI.
   */
  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  /**
   * Lifecycle method called after an error has been thrown by a descendant component.
   * Used for logging and reporting errors to the tracking service.
   *
   * @param {Error} error - The error that was thrown.
   * @param {ErrorInfo} errorInfo - An object with a componentStack key containing information about the component that threw.
   * @returns {void}
   */
  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    ErrorReporting.report(error, { componentStack: errorInfo.componentStack });
  }

  /**
   * Renders either the fallback UI or the children components based on error state.
   *
   * @returns {React.ReactNode} The rendered component tree.
   */
  public render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
