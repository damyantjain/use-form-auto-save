import { useEffect } from 'react';

type UseRetryHandlerProps = {
  shouldRetry: boolean;
  retryCount: number;
  maxRetries: number;
  logDebug: (...args: any[]) => void;
  onRetry: () => void;
  onRetryExhausted?: () => void;
};

export const useRetryHandler = ({
  shouldRetry,
  retryCount,
  maxRetries,
  logDebug,
  onRetry,
  onRetryExhausted,
}: UseRetryHandlerProps) => {
  useEffect(() => {
    if (!shouldRetry) return;

    if (retryCount >= maxRetries) {
      logDebug(`Max retry limit (${maxRetries}) reached. Auto-save will not retry.`);
      onRetryExhausted?.();
      return;
    }

    const retryDelay = Math.pow(2, retryCount) * 1000;
    logDebug(`Retrying auto-save in ${retryDelay}ms...`);

    const timer = setTimeout(() => {
      onRetry();
    }, retryDelay);

    return () => clearTimeout(timer);
  }, [shouldRetry, retryCount, maxRetries, logDebug, onRetry, onRetryExhausted]);
};
