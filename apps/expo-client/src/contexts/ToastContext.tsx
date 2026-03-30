import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { ToastContainer } from "../components/common/ToastContainer";

/**
 * Represents an action button within a toast notification.
 */
export interface ToastAction {
  /** The text label for the action button. */
  label: string;
  /** Callback function executed when the action is pressed. */
  onPress: () => void;
}

/**
 * Represents a single toast notification.
 */
export interface Toast {
  /** Unique identifier for the toast. */
  id: string;
  /** The message text to display. */
  message: string;
  /** Optional callback for an "Undo" action. */
  onUndo?: () => void;
  /** Optional duration in milliseconds before auto-hiding. Defaults to 5000ms. */
  duration?: number;
}

interface ToastContextType {
  showToast: (
    message: string,
    options?: { onUndo?: () => void; duration?: number },
  ) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const hideToast = useCallback((id: string) => {
    // Clear the timer if it exists
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, options?: { onUndo?: () => void; duration?: number }) => {
      const id = Math.random().toString(36).substring(2, 9);
      const duration = options?.duration ?? 5000;

      const newToast: Toast = {
        id,
        message,
        onUndo: options?.onUndo,
        duration,
      };

      setToasts((prev) => [...prev, newToast]);

      if (duration !== Infinity) {
        const timer = setTimeout(() => {
          hideToast(id);
        }, duration);
        timers.current.set(id, timer);
      }
    },
    [hideToast],
  );

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      timers.current.forEach((timer) => {
        clearTimeout(timer);
      });
      timers.current.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={hideToast} />
    </ToastContext.Provider>
  );
};

/**
 * Hook to access the toast context and trigger notifications.
 *
 * @returns {ToastContextType} The toast context value.
 * @throws {Error} If called outside of a ToastProvider.
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
