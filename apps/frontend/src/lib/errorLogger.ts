import axios from './axios';

export interface ErrorContext {
  severity?: 'critical' | 'error' | 'warning' | 'info';
  category?: string;
  source?: 'frontend' | 'backend' | 'api';
  metadata?: Record<string, any>;
  fileKey?: string;
  nodeId?: string;
  componentName?: string;
  userAction?: string;
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private isEnabled: boolean = true;
  private queue: Array<{ error: Error; context: ErrorContext }> = [];
  private isProcessing: boolean = false;

  private constructor() {
    // Setup global error handlers
    if (typeof window !== 'undefined') {
      window.addEventListener('error', this.handleGlobalError.bind(this));
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    }
  }

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  /**
   * Log an error to the backend
   */
  async logError(error: Error, context: ErrorContext = {}): Promise<void> {
    if (!this.isEnabled) {
      console.warn('Error logging is disabled');
      return;
    }

    // Add to queue
    this.queue.push({ error, context });

    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Process the error queue
   */
  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const { error, context } = this.queue.shift()!;

      try {
        await this.sendErrorToBackend(error, context);
      } catch (err) {
        console.error('Failed to log error to backend:', err);
        // Don't retry to avoid infinite loops
      }

      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isProcessing = false;
  }

  /**
   * Send error to backend API
   */
  private async sendErrorToBackend(error: Error, context: ErrorContext): Promise<void> {
    const errorData = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      source: context.source || 'frontend',
      severity: context.severity || this.determineSeverity(error, context),
      category: context.category || this.determineCategory(error, context),
      metadata: {
        ...context.metadata,
        componentName: context.componentName,
        userAction: context.userAction,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      },
      fileKey: context.fileKey,
      nodeId: context.nodeId,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    try {
      await axios.post('/errors/log', errorData);
      console.log('Error logged successfully:', error.message);
    } catch (err) {
      // Log to console as fallback
      console.error('Failed to log error:', err);
      console.error('Original error:', error);
    }
  }

  /**
   * Handle global errors
   */
  private handleGlobalError(event: ErrorEvent): void {
    const error = event.error || new Error(event.message);
    this.logError(error, {
      severity: 'error',
      category: 'unknown',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  }

  /**
   * Handle unhandled promise rejections
   */
  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason));

    this.logError(error, {
      severity: 'error',
      category: 'unknown',
      metadata: {
        type: 'unhandledRejection',
      },
    });
  }

  /**
   * Determine error severity based on error characteristics
   */
  private determineSeverity(error: Error, context: ErrorContext): 'critical' | 'error' | 'warning' | 'info' {
    const message = error.message.toLowerCase();

    // Critical errors
    if (
      message.includes('network') ||
      message.includes('auth') ||
      message.includes('failed to fetch')
    ) {
      return 'critical';
    }

    // Regular errors
    if (
      message.includes('error') ||
      message.includes('failed') ||
      message.includes('invalid')
    ) {
      return 'error';
    }

    return 'warning';
  }

  /**
   * Determine error category based on context and error type
   */
  private determineCategory(error: Error, context: ErrorContext): string {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    if (message.includes('auth') || message.includes('login') || message.includes('token')) {
      return 'authentication';
    }
    if (message.includes('permission') || message.includes('forbidden')) {
      return 'authorization';
    }
    if (message.includes('render') || stack.includes('react')) {
      return 'ui_render';
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }
    if (message.includes('figma')) {
      return 'figma_api';
    }
    if (context.componentName) {
      return 'ui_render';
    }

    return 'unknown';
  }

  /**
   * Enable error logging
   */
  enable(): void {
    this.isEnabled = true;
  }

  /**
   * Disable error logging
   */
  disable(): void {
    this.isEnabled = false;
  }
}

// Export singleton instance
export const errorLogger = ErrorLogger.getInstance();

// Export convenience function
export function logError(error: Error, context?: ErrorContext): void {
  errorLogger.logError(error, context);
}
