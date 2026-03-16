"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Shield, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      // Redirect to auth page with callback URL
      router.push(`/auth?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative mb-8">
            <div className="w-20 h-20 mx-auto">
              <motion.div 
                className="absolute inset-0 border-4 border-t-transparent rounded-full border-blue-500"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <motion.div 
                className="absolute inset-2 border-2 border-r-transparent rounded-full border-purple-500"
                animate={{ rotate: -360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Shield size={32} className="text-blue-500" />
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Authenticating</h2>
          <p className="text-gray-400">Verifying your access...</p>
        </motion.div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return fallback || (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 border-2 border-red-500/30 flex items-center justify-center">
              <Lock size={32} className="text-red-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Access Restricted</h2>
            <p className="text-gray-400 mb-8">
              You need to sign in to access this page. Join thousands of entrepreneurs using TrendAI for market intelligence.
            </p>
            <Link 
              href={`/auth?callbackUrl=${encodeURIComponent(pathname)}`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              Sign In to Continue
              <ArrowRight size={18} />
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}