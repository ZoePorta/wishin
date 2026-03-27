import React, { createContext, useContext, useState, useCallback } from "react";
import { ToastContainer } from "../components/common/ToastContainer";

export interface ToastAction {
  label: string;
  onPress: () => void;
}

export interface Toast {
  id: string;
  message: string;
  onUndo?: () => void;
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

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, options?: { onUndo?: () => void; duration?: number }) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = {
        id,
        message,
        onUndo: options?.onUndo,
        duration: options?.duration ?? 5000,
      };

      setToasts((prev) => [...prev, newToast]);

      if (newToast.duration !== Infinity) {
        setTimeout(() => {
          hideToast(id);
        }, newToast.duration);
      }
    },
    [hideToast],
  );

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={hideToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
