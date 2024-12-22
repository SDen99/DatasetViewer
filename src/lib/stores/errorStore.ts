import { writable } from 'svelte/store';

// Error types
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface AppError {
  id: string;
  message: string;
  severity: ErrorSeverity;
  timestamp: Date;
  context?: Record<string, any>;
  retry?: () => Promise<void>;
}

// Error store
interface ErrorState {
  errors: AppError[];
  hasUnreadErrors: boolean;
}

function createErrorStore() {
  const { subscribe, update } = writable<ErrorState>({
    errors: [],
    hasUnreadErrors: false
  });

  const removeError = (errorId: string) => {
    update(state => ({
      ...state,
      errors: state.errors.filter(e => e.id !== errorId)
    }));
  };

  return {
    subscribe,
    addError: (error: Omit<AppError, 'id' | 'timestamp'>) => {
      const newError = {
        ...error,
        id: crypto.randomUUID(),
        timestamp: new Date()
      };

      update(state => ({
        errors: [...state.errors, newError],
        hasUnreadErrors: true
      }));

      // Automatically remove info and warning messages after 5 seconds
      if (error.severity === ErrorSeverity.INFO || error.severity === ErrorSeverity.WARNING) {
        setTimeout(() => {
          removeError(newError.id);
        }, 5000);
      }

      return newError.id;
    },
    removeError,
    clearErrors: () => {
      update(() => ({
        errors: [],
        hasUnreadErrors: false
      }));
    },
    markErrorsAsRead: () => {
      update(state => ({
        ...state,
        hasUnreadErrors: false
      }));
    }
  };
}

export const errorStore = createErrorStore();

// Error boundary for components
export function handleError(error: unknown, context?: Record<string, any>) {
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
  
  console.error('Application error:', error);
  
  return errorStore.addError({
    message: errorMessage,
    severity: ErrorSeverity.ERROR,
    context
  });
}

// Wrapper for async operations
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: Record<string, any>
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    handleError(error, context);
    return undefined;
  }
}