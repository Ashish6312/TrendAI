"use client";

import { ArrowLeft, Shield, CheckCircle, FileText, Globe, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function CompliancePage() {
  const router = useRouter();

  const standards = [
    { title: "GDPR Compliance", status: "Active", desc: "Full adherence to General Data Protection Regulation for neural data processing." },
    { title: "SOC2 Type II", status: "Certified", desc: "Rigorous security, availability, and processing integrity of market intelligence systems." },
    { title: "CCPA Alignment", status: "Verified", desc: "California Consumer Privacy Act standards implemented for regional intelligence hubs." },
    { title: "ISO/IEC 27001", status: "Maintaining", desc: "International standard for information security management systems." }
  ];

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
          className="space-y-12"
        >
          <div className="text-center space-y-4">
             <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 rounded-2xl text-emerald-500 mb-2">
                <Shield size={40} />
             </div>
             <h1 className="text-4xl font-black text-slate-900 dark:text-white italic tracking-tighter">Strategic Compliance</h1>
             <p className="text-slate-500 dark:text-gray-400 max-w-2xl mx-auto font-medium">
               TrendAI maintains the highest global standards for data integrity and security across all neural market analysis operations.
             </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {standards.map((s, i) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{s.title}</h3>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20">
                    <CheckCircle size={10} />
                    {s.status}
                  </div>
                </div>
                <p className="text-sm text-slate-500 dark:text-gray-400 leading-relaxed font-medium">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="space-y-8">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
              <FileText className="text-blue-500" />
              Governance Framework
            </h2>
            
            <div className="space-y-6">
              {[
                { label: "Data Sovereignty", icon: <Globe size={18} />, text: "Automated localization of data processing based on regional compliance mandates." },
                { label: "Risk Mitigation", icon: <AlertCircle size={18} />, text: "Continuous neural monitoring for potential security vulnerabilities and market data anomalies." }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-5 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-sm">
                  <div className="p-2 bg-slate-100 dark:bg-white/10 rounded-xl text-slate-600 dark:text-gray-400">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white mb-1 uppercase tracking-wider text-xs">{item.label}</h4>
                    <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 dark:border-white/5 text-center">
            <p className="text-sm text-slate-500 dark:text-gray-500 font-medium">
              Need detailed compliance reports? Contact our strategic legal team at <span className="text-emerald-600 dark:text-emerald-400 font-bold">compliance@trendai.com</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
