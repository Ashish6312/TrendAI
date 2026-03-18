"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { 
  ArrowLeft, CheckCircle2, Loader2, Play, 
  ChevronRight, Calendar, Users, Rocket,
  ShieldCheck, Sparkle, MapPin, Printer, Globe2, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import ProtectedRoute from "@/components/ProtectedRoute";

function RoadmapContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  
  const area = searchParams.get('area');
  const title = searchParams.get('title');
  const desc = searchParams.get('desc');
  const language = searchParams.get('lang') || "English";
  
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (!area || !title || !desc) {
      router.push("/dashboard");
      return;
    }

    const fetchRoadmap = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/roadmap`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            area, 
            title, 
            description: desc,
            user_email: (status === "authenticated" && (status as any)?.data?.user?.email) || "anonymous",
            language: language 
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setSteps(data.steps || []);
        } else {
          console.error("Failed to fetch roadmap");
        }
      } catch (error) {
        console.error("Error connecting to API:", error);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchRoadmap();
    }
  }, [area, title, desc, status, router, language]);

  if (status === "loading" || loading) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-8">
        <div className="relative">
          <div className="w-24 h-24 border-2 border-blue-500/20 rounded-full animate-ping absolute inset-0" />
          <div className="w-24 h-24 border-t-2 border-blue-600 rounded-full animate-spin shadow-[0_0_30px_rgba(37,99,235,0.3)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Rocket className="text-blue-500 w-10 h-10 animate-pulse" />
          </div>
        </div>
        <div className="space-y-3 text-center">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase selection:bg-blue-600">{t("road_preparing")}</h2>
          <p className="text-slate-500 dark:text-gray-500 text-[10px] font-black tracking-[0.4em] uppercase opacity-70">{t("road_analyzing")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[var(--background)]">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0 select-none">
        <motion.img 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5 }}
          src="/roadmap_bg.png" 
          alt="Roadmap Architecture" 
          className="w-full h-full object-cover opacity-10 dark:opacity-20 blur-[2px] animate-pulse-slow"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-100/90 via-white/40 to-white dark:from-[#020617]/40 dark:via-[#020617] dark:to-[#020617] transition-colors duration-500" />
      </div>

      <div className="responsive-container navbar-aware pb-16 md:pb-20 lg:pb-24 navbar-content">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-10 mb-16 md:mb-20 lg:mb-24">
          <motion.button 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => router.back()} 
            className="group flex items-center gap-3 md:gap-4 px-4 md:px-6 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 hover:border-emerald-500/20 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-all w-fit shadow-2xl backdrop-blur-xl"
          >
            <ArrowLeft size={18} className="md:w-5 md:h-5 group-hover:-translate-x-1.5 transition-transform" />
            <span className="responsive-text-xs font-black uppercase tracking-[0.3em]">{t("road_return")}</span>
          </motion.button>
          
          <div className="flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 bg-emerald-500/10 rounded-xl md:rounded-2xl border border-emerald-500/20 responsive-text-xs font-black text-emerald-400 uppercase tracking-[0.3em] shadow-lg">
             <Globe2 size={14} className="md:w-4 md:h-4" /> {language} {t("road_strategy")}
          </div>
        </div>

        <header className="mb-20 md:mb-24 lg:mb-32 space-y-6 md:space-y-8 lg:space-y-10 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-6 md:gap-8 justify-center"
          >
            <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent flex-1" />
            <Sparkle className="text-emerald-500 animate-pulse md:w-10 md:h-10" size={32} fill="currentColor" />
            <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent flex-1" />
          </motion.div>
          
          <div className="space-y-4 md:space-y-6">
            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="inline-flex items-center gap-2 px-3 md:px-4 py-1 md:py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 responsive-text-xs font-black text-blue-400 uppercase tracking-widest mb-3 md:mb-4"
            >
               <ShieldCheck size={12} className="md:w-[14px] md:h-[14px]" /> {t("road_directive")}
            </motion.div>
            <h1 className="responsive-text-2xl sm:responsive-text-4xl md:text-6xl lg:text-8xl font-black text-slate-900 dark:text-white tracking-tighter leading-none max-w-5xl mx-auto italic px-4">
               {t("road_plan_title")}
            </h1>
            <div className="flex flex-col items-center gap-6 md:gap-8">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="responsive-text-lg sm:responsive-text-xl md:responsive-text-3xl font-black bg-white dark:bg-white/5 px-4 sm:px-6 md:px-10 py-2 sm:py-3 md:py-4 rounded-2xl sm:rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 dark:border-white/10 text-emerald-600 dark:text-emerald-400 shadow-2xl tracking-tight selection:bg-emerald-600 select-all"
              >
                {title}
              </motion.h2>
              <div className="flex items-center gap-2 md:gap-3 text-gray-500 font-bold tracking-widest uppercase responsive-text-xs">
                 <MapPin size={16} className="md:w-[18px] md:h-[18px] text-emerald-500" /> 
                 {area}
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 md:gap-12 lg:gap-20">
          {/* Progress Sidebar */}
          <div className="hidden lg:block space-y-6 md:space-y-8 sticky top-36 h-fit">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-10 bg-gradient-to-b from-emerald-600/15 via-emerald-600/5 to-transparent border-emerald-500/20 shadow-2xl"
            >
               <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-8 border-b border-white/5 pb-5">{t("road_milestones")}</h4>
               <div className="space-y-6">
                 {steps.map((_, i) => (
                   <div key={i} className="flex items-center gap-5 group cursor-default">
                     <div className={`w-2.5 h-2.5 rounded-full transition-all duration-700 ${i === 0 ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,1)] scale-125' : 'bg-slate-200 dark:bg-gray-800'}`} />
                     <span className={`text-[11px] font-black tracking-widest uppercase transition-colors duration-500 ${i === 0 ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-gray-600 group-hover:text-slate-600 dark:group-hover:text-gray-500'}`}>{t("road_phase")} 0{i+1}</span>
                   </div>
                 ))}
               </div>
            </motion.div>
            
             <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-10 space-y-10 border-slate-200 dark:border-white/5 shadow-xl"
            >
               <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-white/5 flex items-center justify-center shadow-inner"><Calendar className="text-slate-500 dark:text-gray-500" size={20} /></div>
                  <div className="space-y-1">
                     <div className="text-[9px] font-black text-slate-400 dark:text-gray-600 uppercase tracking-widest">{t("road_timeline")}</div>
                     <div className="text-sm font-black text-slate-700 dark:text-gray-300 italic tracking-tight">{t("road_6_months")}</div>
                  </div>
               </div>
               <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-white/5 flex items-center justify-center shadow-inner"><Users className="text-slate-500 dark:text-gray-500" size={20} /></div>
                  <div className="space-y-1">
                     <div className="text-[9px] font-black text-slate-400 dark:text-gray-600 uppercase tracking-widest">{t("road_team")}</div>
                     <div className="text-sm font-black text-slate-700 dark:text-gray-300 italic tracking-tight">{t("road_taskforce")}</div>
                  </div>
               </div>
            </motion.div>

            {/* NEW: Implementation Hacks */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-10 bg-gradient-to-br from-blue-600/10 to-transparent border-blue-500/20"
            >
               <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6">{t("road_expert_exec")}</h4>
               <ul className="space-y-5">
                 {[
                   { icon: <Zap size={14} />, text: t("road_tip_1") },
                   { icon: <Globe2 size={14} />, text: t("road_tip_2") },
                   { icon: <Rocket size={14} />, text: t("road_tip_3") }
                 ].map((tip, i) => (
                   <li key={i} className="flex items-center gap-4 text-[11px] font-bold text-gray-400 group cursor-default">
                     <span className="text-blue-500 group-hover:scale-125 transition-transform">{tip.icon}</span>
                     {tip.text}
                   </li>
                 ))}
               </ul>
            </motion.div>
          </div>

          {/* Steps Content */}
          <div className="lg:col-span-3 space-y-36 relative">
            <div className="absolute left-[59px] top-12 bottom-12 w-px bg-gradient-to-b from-emerald-500/30 via-white/5 to-emerald-500/30 hidden md:block" />
            
            <AnimatePresence>
              {steps.map((step, index) => (
                <motion.div 
                  key={index} 
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-10%" }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  className="relative pl-0 md:pl-32 group"
                >
                  {/* Number Badge */}
                  <div className="hidden md:flex absolute left-0 top-0 w-28 h-28 items-center justify-center">
                    <div className="w-20 h-20 bg-white dark:bg-gray-950 border-2 border-slate-200 dark:border-white/10 rounded-[2.5rem] flex items-center justify-center text-emerald-600 dark:text-emerald-500 font-black text-3xl z-10 group-hover:border-emerald-600 group-hover:text-white group-hover:bg-emerald-600 transition-all duration-700 shadow-2xl group-hover:shadow-emerald-600/30 group-hover:-translate-y-2">
                      {step.step_number}
                    </div>
                  </div>
                  
                  <div className="glass-card p-10 md:p-16 bg-white/80 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 hover:border-emerald-500/30 transition-all duration-700 relative overflow-hidden group shadow-2xl hover:shadow-[0_40px_100px_-20px_rgba(16,185,129,0.1)]">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[120px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    
                    <div className="flex items-center gap-6 mb-8 relative z-10">
                      <div className="w-2.5 h-10 bg-emerald-600 rounded-full shadow-[0_0_30px_#10b981] group-hover:h-12 transition-all duration-500" />
                      <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-none">
                        {step.step_title}
                      </h3>
                    </div>
                    
                    <div className="space-y-8 relative z-10">
                       <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg md:text-xl font-medium tracking-tight opacity-80 group-hover:opacity-100 transition-opacity">
                         {step.step_description}
                       </p>
                       
                       <div className="flex flex-wrap gap-4 pt-10 border-t border-slate-100 dark:border-white/5">
                          <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">
                             <ShieldCheck size={16} /> {t("road_priority")}
                          </div>
                          <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/15 text-[9px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest hover:bg-amber-500/10 transition-colors cursor-pointer">
                             <Play size={16} fill="currentColor" /> {t("road_action")}
                          </div>
                       </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Implementation Strategies Matrix */}
            <div className="md:ml-32 space-y-12">
               <div className="flex items-center gap-6">
                  <div className="h-px bg-white/10 flex-1" />
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">{t("road_strategies")}</h4>
                  <div className="h-px bg-white/10 flex-1" />
               </div>
               
               <motion.div 
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   className="grid md:grid-cols-2 gap-8"
                >
                   <div className="glass-card p-12 bg-white/50 dark:bg-gradient-to-br dark:from-indigo-600/10 dark:to-transparent border border-slate-200 dark:border-indigo-500/20 group hover:border-indigo-500/40 transition-all duration-700">
                      <div className="w-14 h-14 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-indigo-600 transition-all duration-500 text-indigo-600 dark:text-indigo-400 group-hover:text-white"><Rocket size={28} /></div>
                      <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">{t("road_fast_growth")}</h4>
                      <p className="text-slate-500 dark:text-gray-500 font-medium leading-relaxed text-sm">{t("road_fast_desc")}</p>
                   </div>
                   <div className="glass-card p-12 bg-white/50 dark:bg-gradient-to-br dark:from-emerald-600/10 dark:to-transparent border border-slate-200 dark:border-emerald-500/20 group hover:border-emerald-500/40 transition-all duration-700">
                      <div className="w-14 h-14 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-emerald-600 transition-all duration-500 text-emerald-600 dark:text-emerald-400 group-hover:text-white"><ShieldCheck size={28} /></div>
                      <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">{t("road_market_safety")}</h4>
                      <p className="text-slate-500 dark:text-gray-500 font-medium leading-relaxed text-sm">{t("road_safety_desc")}</p>
                   </div>
                </motion.div>
            </div>

            {/* Conclusion */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="glass-card p-16 md:p-24 bg-white/80 dark:bg-gradient-to-br dark:from-emerald-600/15 dark:via-transparent dark:to-amber-600/15 border border-slate-200 dark:border-emerald-500/30 flex flex-col items-center text-center relative overflow-hidden shadow-3xl group mb-24"
            >
              <div className="absolute inset-0 bg-grid-white/[0.01] pointer-events-none" />
              <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-600/10 rounded-full blur-[100px] group-hover:opacity-100 transition-opacity" />
              
              <div className="w-28 h-28 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-[0_0_80px_-10px_rgba(16,185,129,0.5)] border-2 border-emerald-500/30 animate-pulse relative z-10">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter uppercase italic relative z-10">{t("road_readiness")}</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-xl md:text-2xl font-bold leading-relaxed tracking-tight relative z-10 mb-16 px-4">
                {t("road_success_conf")}
              </p>
              <button 
                onClick={() => window.print()} 
                className="h-20 px-12 sm:px-16 bg-white text-black font-black rounded-[2rem] text-[11px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all duration-700 shadow-2xl flex items-center gap-6 hover:-translate-y-3 active:scale-95 relative z-10"
              >
                <Printer size={24} />
                {t("road_print")}
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  const { t } = useLanguage();
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="flex h-screen items-center justify-center flex-col gap-8 text-gray-500 font-black animate-pulse uppercase tracking-[0.4em] text-xs"><Loader2 className="animate-spin mb-4 w-12 h-12" /> {t("road_loading_strat")}</div>}>
        <RoadmapContent />
      </Suspense>
    </ProtectedRoute>
  );
}
