"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white dark:bg-[#020617] text-slate-900 dark:text-white transition-colors duration-500">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.button 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()} 
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-all group mb-8 font-black uppercase tracking-widest text-[10px]"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span>Go Back</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="prose dark:prose-invert max-w-none"
        >
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-8 italic tracking-tighter">Terms of Service</h1>
          
          <div className="space-y-8 text-slate-600 dark:text-gray-300 leading-relaxed font-medium">
            <section>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tight">1. Acceptance of Terms</h2>
              <p>By accessing and using TrendAI, you accept and agree to be bound by the terms and provision of this agreement.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tight">2. Use License</h2>
              <p>Permission is granted to temporarily use TrendAI for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tight">3. Service Description</h2>
              <p>TrendAI provides AI-powered market analysis and business intelligence services. We strive to provide accurate and up-to-date information, but cannot guarantee the completeness or accuracy of all data.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tight">4. User Responsibilities</h2>
              <p>Users are responsible for maintaining the confidentiality of their account information and for all activities that occur under their account.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tight">5. Contact Information</h2>
              <p>For questions about these Terms of Service, please contact us at <span className="text-emerald-600 dark:text-emerald-400 font-bold">legal@trendai.com</span></p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}