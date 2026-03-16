"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center space-y-8">
            {/* Error Icon */}
            <div className="w-24 h-24 mx-auto rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
              <AlertTriangle size={48} className="text-red-400" />
            </div>

            {/* Title */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-white">Something went wrong!</h1>
              <p className="text-gray-400 text-lg">
                An unexpected error occurred. Please try again.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={reset}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all hover:scale-105"
              >
                <RefreshCw size={18} />
                Try Again
              </button>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-all"
              >
                <Home size={18} />
                Go Home
              </Link>
            </div>

            {/* Error details for development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8 p-4 bg-slate-800/50 rounded-xl border border-slate-600/30 text-left">
                <h3 className="text-sm font-semibold text-red-400 mb-2">Error Details:</h3>
                <pre className="text-xs text-gray-400 overflow-auto">
                  {error.message}
                </pre>
              </div>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}