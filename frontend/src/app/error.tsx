"use client";

import { useEffect } from "react";
import { 
  AlertTriangle, RefreshCcw, ArrowLeft, Terminal, 
  ShieldAlert, Home, Cpu, Activity
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Critical Layout Interruption:', error);
  }, [error]);

  const handleHardReset = () => {
    // Attempt to clear specific corrupted states
    try {
      localStorage.clear(); 
      sessionStorage.clear();
      reset();
      window.location.href = '/';
    } catch (e) {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-2xl w-full bg-white dark:bg-slate-900/40 backdrop-blur-3xl border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl relative overflow-hidden"
      >
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-grid-slate-900/[0.02] dark:bg-grid-white/[0.02] pointer-events-none" />
        
        {/* Error Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-500 text-[10px] font-black uppercase tracking-widest italic">
              Runtime Exception
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic">
              Segment <span className="text-amber-500">Fault</span>
            </h1>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-xl shadow-amber-500/10">
            <AlertTriangle size={32} className="text-amber-500" />
          </div>
        </div>

        <p className="text-slate-600 dark:text-slate-400 text-lg font-medium leading-relaxed mb-10 relative z-10">
          We encountered a synchronization error while processing the neural data for this section. The system remains stable, but a manual re-initialization is required.
        </p>

        {/* Action Grid */}
        <div className="grid sm:grid-cols-2 gap-4 mb-10 relative z-10">
          <button
            onClick={reset}
            className="group flex items-center justify-center gap-3 px-8 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest italic rounded-2xl transition-all shadow-xl active:scale-95"
          >
            <RefreshCcw size={20} className="group-hover:rotate-180 transition-transform duration-700" />
            Restore Node
          </button>
          
          <button
            onClick={handleHardReset}
            className="flex items-center justify-center gap-3 px-8 py-5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-200 font-black uppercase tracking-widest italic rounded-2xl transition-all active:scale-95 border border-slate-200 dark:border-white/5"
          >
            <Cpu size={20} />
            Hard Reset
          </button>
        </div>

        {/* Home Link */}
        <div className="flex justify-center relative z-10">
           <Link 
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-500 font-bold uppercase tracking-widest text-xs transition-colors p-2"
           >
              <ArrowLeft size={14} />
              Return to Neural Home
           </Link>
        </div>

        {/* Technical Trace (Conditional) */}
        {process.env.NODE_ENV === 'development' && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-10 pt-6 border-t border-slate-100 dark:border-white/5"
          >
             <div className="p-4 bg-slate-50 dark:bg-black/40 rounded-2xl border border-slate-200 dark:border-white/10 font-mono text-[10px] text-red-500/80 break-all overflow-hidden">
                <div className="flex items-center gap-2 mb-2 opacity-50 uppercase tracking-widest">
                   <Terminal size={12} />
                   <span>ERROR_DUMP_STREAM</span>
                </div>
                {error.message || "Unknown segment fault"}
             </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
