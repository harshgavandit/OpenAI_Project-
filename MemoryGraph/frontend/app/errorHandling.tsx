/**
 * Error Resilience & Recovery
 * Handles slow API, failed uploads, network issues gracefully
 */

interface ErrorState {
  type: 'network' | 'timeout' | 'auth' | 'validation' | 'server' | 'storage' | 'upload' | 'demo';
  message: string;
  retryable: boolean;
  action?: string;
}

type ErrorLike = {
  message?: string;
  name?: string;
  code?: string;
  status?: number;
  toString?: () => string;
};

function asErrorLike(error: unknown): ErrorLike {
  if (typeof error === 'object' && error !== null) {
    return error as ErrorLike;
  }
  return { message: String(error) };
}

export class ErrorHandler {
  static isNetworkError(error: unknown): boolean {
    const parsed = asErrorLike(error);
    return parsed.message?.includes('Failed to fetch') ||
           parsed.message?.includes('Network') ||
           parsed.code === 'ECONNREFUSED';
  }

  static isTimeoutError(error: unknown): boolean {
    const parsed = asErrorLike(error);
    return parsed.message?.includes('timeout') ||
           parsed.name === 'AbortError';
  }

  static parseError(error: unknown): ErrorState {
    const parsed = asErrorLike(error);

    if (this.isNetworkError(error)) {
      return {
        type: 'network',
        message: 'Connection lost. Check your internet and try again.',
        retryable: true,
        action: 'Retrying...'
      };
    }

    if (this.isTimeoutError(error)) {
      return {
        type: 'timeout',
        message: 'Request took too long. Server might be busy.',
        retryable: true,
        action: 'Retry'
      };
    }

    if (parsed.status === 401) {
      return {
        type: 'auth',
        message: 'Your session expired. Please log in again.',
        retryable: false,
      };
    }

    if (parsed.status === 402) {
      return {
        type: 'storage',
        message: 'Storage limit reached. Please upgrade your plan to continue.',
        retryable: false,
      };
    }

    if (parsed.status === 413) {
      return {
        type: 'storage',
        message: 'File is too large. Maximum is 50MB per file.',
        retryable: false,
      };
    }

    if (parsed.status === 400) {
      return {
        type: 'validation',
        message: 'Invalid input. Please check your data and try again.',
        retryable: false,
      };
    }

    if (parsed.status !== undefined && parsed.status >= 500) {
      return {
        type: 'server',
        message: 'Server error. We\'re investigating. Try again soon.',
        retryable: true,
        action: 'Retry in a moment'
      };
    }

    // Parse friendly messages from error text
    const errorMessage = parsed.message || parsed.toString?.() || 'Something went wrong.';
    
    // Check for demo seed errors
    if (errorMessage.includes('Demo') || errorMessage.includes('seed')) {
      return {
        type: 'demo',
        message: 'Could not load demo data. Please check your connection and try again.',
        retryable: true,
      };
    }

    // Check for upload errors
    if (errorMessage.includes('Upload') || errorMessage.includes('upload')) {
      return {
        type: 'upload',
        message: 'Upload failed. Please try with a different file or check your connection.',
        retryable: true,
      };
    }

    return {
      type: 'validation',
      message: errorMessage.length > 100 ? 'An error occurred. Please try again.' : errorMessage,
      retryable: true,
    };
  }

  static async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    delayMs = 1000
  ): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        const errorState = this.parseError(error);
        if (!errorState.retryable || attempt === maxRetries - 1) {
          throw error;
        }
        // Exponential backoff
        await new Promise(r => setTimeout(r, delayMs * Math.pow(2, attempt)));
      }
    }
    throw new Error('Max retries exceeded');
  }
}

/**
 * React hook for error handling with automatic recovery
 */
import { useState, useCallback } from 'react';

export function useErrorHandler() {
  const [error, setError] = useState<ErrorState | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleError = useCallback((err: unknown) => {
    const errorState = ErrorHandler.parseError(err);
    setError(errorState);
    return errorState;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const retry = useCallback(async (fn: () => Promise<unknown>) => {
    if (!error?.retryable) return;
    
    setIsRetrying(true);
    try {
      await ErrorHandler.withRetry(fn, 2, 500);
      clearError();
    } catch (err) {
      handleError(err);
    } finally {
      setIsRetrying(false);
    }
  }, [error, clearError, handleError]);

  return { error, handleError, clearError, retry, isRetrying };
}

/**
 * Error Display Component
 */
interface ErrorDisplayProps {
  error: ErrorState | null;
  onDismiss: () => void;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function ErrorDisplay({
  error,
  onDismiss,
  onRetry,
  isRetrying = false,
}: ErrorDisplayProps) {
  if (!error) return null;

  const colorMap = {
    network: 'red',
    timeout: 'orange',
    auth: 'purple',
    validation: 'yellow',
    server: 'red',
    storage: 'amber',
    upload: 'blue',
    demo: 'green',
  };

  const color = colorMap[error.type];
  const bgColor = `bg-${color}-50 dark:bg-${color}-900/20`;
  const borderColor = `border-${color}-300 dark:border-${color}-900`;
  const textColor = `text-${color}-900 dark:text-${color}-100`;

  return (
    <div className={`${bgColor} border-l-4 ${borderColor} ${textColor} p-4 rounded-r-lg mb-4 flex items-start justify-between gap-4`}>
      <div className="flex gap-3">
        <span className="text-xl flex-shrink-0">⚠️</span>
        <div>
          <p className="font-semibold text-sm">{error.message}</p>
          {error.action && (
            <p className="text-xs opacity-75 mt-1">{error.action}</p>
          )}
        </div>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        {error.retryable && onRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className={`text-xs font-medium px-3 py-1 rounded hover:opacity-80 transition disabled:opacity-50 ${
              isRetrying ? 'cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {isRetrying ? '🔄 Retrying...' : '🔄 Retry'}
          </button>
        )}
        <button
          onClick={onDismiss}
          className="text-lg font-bold hover:opacity-60 transition"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/**
 * Upload with timeout & retry support
 */
export async function uploadWithResilience(
  file: File,
  token: string,
  apiBaseUrl: string = process.env.NEXT_PUBLIC_API_URL || '/api',
  onProgress?: (percent: number) => void
): Promise<Response> {
  const formData = new FormData();
  formData.append('file', file);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout
  onProgress?.(0);

  try {
    const response = await fetch(`${apiBaseUrl}/memories/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const error = new Error(`Upload failed: ${response.status}`);
      (error as Error & { status: number }).status = response.status;
      throw error;
    }

    onProgress?.(100);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

/**
 * API fetch with automatic retry
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit & { maxRetries?: number; timeout?: number } = {}
): Promise<Response> {
  const { maxRetries = 3, timeout = 30000, ...fetchOptions } = options;

  return ErrorHandler.withRetry(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }, maxRetries);
}
