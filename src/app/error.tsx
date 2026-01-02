'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-6xl font-bold text-destructive mb-4">Oops!</h1>
      <h2 className="text-2xl font-semibold mb-2">Something went wrong</h2>
      <p className="text-muted-foreground mb-8 text-center max-w-md">
        We're sorry, but something unexpected happened. Please try again or contact support if the problem persists.
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-xl border px-6 py-3 text-sm font-medium hover:bg-muted transition-colors"
        >
          Go Home
        </a>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <pre className="mt-8 p-4 bg-muted rounded-lg text-xs overflow-auto max-w-2xl">
          {error.message}
          {error.stack}
        </pre>
      )}
    </div>
  );
}
