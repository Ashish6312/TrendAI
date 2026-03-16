"use client";

import { ArrowLeft, Key, Plus, Copy, Trash2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";

export default function ApiKeysPage() {
  const router = useRouter();
  const [keys, setKeys] = useState([
    { id: 1, name: "Production Key", key: "sk_live_************************4a2b", status: "Active", created: "2024-03-10" },
    { id: 2, name: "Development Key", key: "sk_test_************************9f3e", status: "Active", created: "2024-03-15" }
  ]);

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
          className="space-y-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2 italic tracking-tighter">API Command Center</h1>
              <p className="text-slate-500 dark:text-gray-400 font-medium">Manage your neural integration keys and access tokens.</p>
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95">
              <Plus size={18} />
              <span>Generate New Key</span>
            </button>
          </div>
          
          <div className="grid gap-6">
            {keys.map((k) => (
              <div key={k.id} className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl border-l border-b border-emerald-500/20">
                  {k.status}
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       <Key size={16} className="text-emerald-500" />
                       <h3 className="text-lg font-black text-slate-900 dark:text-white">{k.name}</h3>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-sm text-slate-500 dark:text-gray-400 bg-white dark:bg-black/20 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/5">
                      {k.key}
                      <button className="ml-2 p-1 hover:text-emerald-500 transition-colors">
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Created</div>
                      <div className="text-sm font-bold text-slate-600 dark:text-gray-300">{k.created}</div>
                    </div>
                    <button className="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/20 flex gap-4 items-start">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-500">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Security Protocol</h4>
              <p className="text-sm text-slate-600 dark:text-blue-200/60 font-medium leading-relaxed">
                Never share your API keys in client-side code or public repositories. Use environment variables for secure server-side neural requests.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
