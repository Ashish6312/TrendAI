"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCcw, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center space-y-6 bg-white dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-xl"
      >
        <div className="w-20 h-20 mx-auto rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
          <AlertCircle size={40} className="text-amber-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">System Interruption</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
            We encountered a temporary issue while loading this page. Don't worry, your progress is safe.
          </p>
        </div>

        <div className="grid gap-3">
          <button
            onClick={reset}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            <RefreshCcw size={18} />
            RESTORE SYSTEM
          </button>
          
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-200 font-bold rounded-2xl transition-all active:scale-95"
          >
            <ArrowLeft size={18} />
            BACK TO HOME
          </Link>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/10 text-left">
            <p className="text-[10px] font-mono text-red-500 break-all opacity-70">
              {error.message || "Unknown error"}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
