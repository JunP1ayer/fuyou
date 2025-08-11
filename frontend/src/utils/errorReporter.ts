type ErrorDetails = {
  message: string;
  stack?: string;
  componentStack?: string;
  url?: string;
  userAgent?: string;
  traceId?: string;
  extra?: Record<string, unknown>;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export async function reportClientError(details: ErrorDetails, level: 'error' | 'warn' | 'info' = 'error') {
  try {
    const res = await fetch(`${API_BASE}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level,
        message: details.message,
        details: {
          stack: details.stack,
          componentStack: details.componentStack,
          url: details.url || window.location.href,
          extra: details.extra,
        },
        userAgent: details.userAgent || navigator.userAgent,
        traceId: details.traceId,
        timestamp: new Date().toISOString(),
      }),
    });
    if (!res.ok) {
      // Silently ignore to avoid error loops
      console.warn('Failed to report client error');
    }
  } catch {
    // Network errors are ignored intentionally
  }
}


