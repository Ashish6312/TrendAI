"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-[#020617]">
          <div className="max-w-md w-full glass-card p-8 border-red-500/20 text-center space-y-6">
            <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto border border-red-500/20 animate-pulse">
              <AlertCircle size={40} className="text-red-500" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                Protocol Interrupted
              </h1>
              <p className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest leading-relaxed">
                A critical exception has occurred in the neural interface.
              </p>
            </div>

            <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/10 text-left overflow-auto max-h-32">
              <p className="font-mono text-[10px] text-red-400 break-words">
                {this.state.error?.message || "System-level synchronization failure"}
              </p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-xl"
            >
              <RefreshCw size={16} />
              Reboot Interface
            </button>
            
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-50">
              Neural Emergency Protocol v4.0.1
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
