import Link from "next/link";
import { Zap, Shield, ChevronRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="bg-slate-50 dark:bg-gray-950/80 border-t border-slate-200 dark:border-white/5 backdrop-blur-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 lg:pt-20 pb-24 lg:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 lg:gap-16">
          
          {/* Company Info - Takes more space */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-tr from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                 <Zap className="text-white fill-current" size={20} />
              </div>
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic">
                Trend<span className="text-emerald-600 dark:text-emerald-500">AI</span>
              </span>
            </Link>
            <p className="text-slate-500 dark:text-gray-400 max-w-md text-base font-medium leading-relaxed">
              {t('foot_desc')}
            </p>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">
                {t('foot_status')}
              </span>
            </div>
          </div>

          {/* Strategic Links */}
          <div className="space-y-6">
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <Zap size={14} className="text-emerald-500" />
              {t('foot_strategic')}
            </h2>
            <ul className="space-y-4">
              {[
                { label: t('foot_scan'), path: "/dashboard" },
                { label: t('nav_pricing'), path: "/acquisition-tiers" },
                { label: t('foot_regional'), path: "/dashboard" }
              ].map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.path} 
                    className="group flex items-center gap-2 text-sm text-slate-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-500 transition-all duration-300 font-bold"
                  >
                    <ChevronRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-6">
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <Shield size={14} className="text-blue-500" />
              {t('foot_legal')}
            </h2>
            <ul className="space-y-4">
              {[
                { label: t('foot_privacy'), path: "/privacy" },
                { label: t('foot_terms'), path: "/terms" },
                { label: t('foot_compliance'), path: "/compliance" },
                { label: t('foot_contact'), path: "/contact" }
              ].map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.path} 
                    className="group flex items-center gap-2 text-sm text-slate-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-500 transition-all duration-300 font-bold"
                  >
                    <ChevronRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-16 pt-8 border-t border-slate-200 dark:border-white/5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
              <span className="text-sm font-bold text-slate-400 dark:text-gray-600 uppercase tracking-wider">
                © 2024 TrendAI Pro. {t('foot_all_rights')}.
              </span>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-slate-400 dark:text-gray-600 uppercase tracking-wider">
                  Live Status
                </span>
              </div>
              <div className="h-4 w-px bg-slate-300 dark:bg-gray-600"></div>
              <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider">
                {t('foot_stable')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
