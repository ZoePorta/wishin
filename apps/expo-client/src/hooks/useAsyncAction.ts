import { useState, useCallback } from "react";

/**
 * Return type for the useAsyncAction hook.
 */
export interface UseAsyncActionReturn {
  /** Whether an action is currently in progress. */
  loading: boolean;
  /** The error message from the last failed action, or null. */
  error: string | null;
  /** Wraps an action, manages loading/error, returns result or null. */
  wrapAsyncAction: <TArgs extends unknown[], TResult>(
    actionName: string,
    action: (...args: TArgs) => Promise<TResult>,
  ) => (...args: TArgs) => Promise<TResult | null>;
  /** Wraps an action, manages loading/error, and re-throws errors. */
  wrapAsyncActionEx: <TArgs extends unknown[], TResult>(
    actionName: string,
    action: (...args: TArgs) => Promise<TResult>,
  ) => (...args: TArgs) => Promise<TResult>;
}

/**
 * Hook to manage loading and error states for asynchronous actions.
 * @returns An object containing the loading state, error state, and a wrapper for async actions.
 */
export function useAsyncAction(): UseAsyncActionReturn {
  const [loadingCount, setLoadingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const increment = useCallback(() => {
    setLoadingCount((prev) => prev + 1);
  }, []);
  const decrement = useCallback(() => {
    setLoadingCount((prev) => Math.max(0, prev - 1));
  }, []);

  /**
   * Wraps an asynchronous action with loading and error handling.
   * @param actionName - The name of the action for logging purposes.
   * @param action - The asynchronous action to execute.
   * @returns A safe version of the action that manages loading and error states.
   */
  const wrapAsyncAction = useCallback(
    <TArgs extends unknown[], TResult>(
      actionName: string,
      action: (...args: TArgs) => Promise<TResult>,
    ) => {
      return async (...args: TArgs): Promise<TResult | null> => {
        increment();
        setError(null);
        try {
          const result = await action(...args);
          return result;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "An error occurred";
          setError(message);
          console.error(`Error in ${actionName}:`, err);
          return null;
        } finally {
          decrement();
        }
      };
    },
    [increment, decrement],
  );

  /**
   * Wraps an asynchronous action with loading and error handling, but re-throws errors.
   * Useful when the caller needs to handle the error specifically (e.g., show an Alert).
   *
   * @param actionName - The name of the action for logging purposes.
   * @param action - The asynchronous action to execute.
   * @returns A version of the action that manages loading/error states and re-throws.
   * @throws {*} Re-throws the original rejection value (may be non-Error).
   */
  const wrapAsyncActionEx = useCallback(
    <TArgs extends unknown[], TResult>(
      actionName: string,
      action: (...args: TArgs) => Promise<TResult>,
    ) => {
      return async (...args: TArgs): Promise<TResult> => {
        increment();
        setError(null);
        try {
          const result = await action(...args);
          return result;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "An error occurred";
          setError(message);
          console.error(`Error in ${actionName}:`, err);
          throw err;
        } finally {
          decrement();
        }
      };
    },
    [increment, decrement],
  );

  return {
    loading: loadingCount > 0,
    error,
    wrapAsyncAction,
    wrapAsyncActionEx,
  };
}
