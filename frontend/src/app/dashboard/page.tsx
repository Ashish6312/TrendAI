"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import ProtectedRoute from "../../components/ProtectedRoute";
import { 
  Loader2, TrendingUp, MapPin, 
  Target, BarChart3, Globe2, Lightbulb, 
  ArrowRight, FileText, Clock, ChevronRight,
  Cpu
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useNotifications } from "@/context/NotificationContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import PaymentSuccessModal from "../../components/PaymentSuccessModal";
import UniformCard from "@/components/UniformCard";
import AIAnalysisCanvas from "@/components/AIAnalysisCanvas";
import AIAnalysisWidget from "@/components/AIAnalysisWidget";
import { useTheme } from "next-themes";

const renderFormattedText = (text: string) => {
  if (!text) return null;
  
  const cleanText = text.replace(/^"|"$/g, '').trim();
  
  // Split into lines and process each
  const lines = cleanText.split('\n').filter(l => l.trim().length > 0);
  
  return (
    <div className="space-y-4">
      {lines.map((line, i) => {
        // Detect bullet points
        const isBullet = /^[•\-\*]/.test(line.trim());
        const displayLine = isBullet ? line.trim().replace(/^[•\-\*]\s*/, '') : line.trim();
        
        // Match phrases ending with colon for bolding (e.g., "Key Facts:")
        const parts = displayLine.split(/(\d{4} government data|\d{4} government initiative|Key Market Facts \(2025 Data\):|Economic Indicators \(Current\):|Government Support \(2025 Policies\):|[^:]+:)/i);
        
        const content = (
          <span className="text-slate-600 dark:text-gray-300 leading-relaxed font-medium">
            {parts.map((part, pi) => {
              // Basic heuristic for headers: ends with colon and isn't too long, or matches common pattern
              const isHeader = (part.endsWith(':') && part.length < 50) || 
                               /Key Market Facts|Economic Indicators|Government Support/i.test(part);
              
              if (isHeader) {
                return (
                  <span key={pi} className="block mt-4 mb-2 text-slate-900 dark:text-white font-black text-sm uppercase tracking-wider">
                    {part}
                  </span>
                );
              }
              return part;
            })}
          </span>
        );

        if (isBullet) {
          return (
            <div key={i} className="flex gap-3 items-start pl-2">
              <span className="text-emerald-500 mt-1.5 flex-shrink-0 text-sm font-black tracking-widest">•</span>
              <div className="flex-1">{content}</div>
            </div>
          );
        }
        
        return (
          <p key={i} className="flex-1 text-slate-600 dark:text-gray-300 leading-relaxed font-medium">
            {content}
          </p>
        );
      })}
    </div>
  );
};

function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { language, t } = useLanguage();
  const { addNotification, userLocation, refreshLocation } = useNotifications();
  const { theme, planFeatures, hasReachedAnalysisLimit } = useSubscription();
  const { resolvedTheme } = useTheme();
  const searchParams = useSearchParams();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [area, setArea] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    const isPaymentSuccess = searchParams.get('payment_success') === 'true';
    const paymentId = searchParams.get('payment_id');
    
    if (isPaymentSuccess && paymentId) {
      // Check if we've already shown this success modal in this session
      const processedPayments = JSON.parse(sessionStorage.getItem('processed_payments') || '[]');
      if (!processedPayments.includes(paymentId)) {
        const details = {
          payment_id: paymentId,
          order_id: searchParams.get('order_id'),
          plan: searchParams.get('plan'),
          amount: searchParams.get('amount'),
          currency: searchParams.get('currency'),
          billing: searchParams.get('billing')
        };
        setPaymentDetails(details);
        setShowSuccessModal(true);
        
        // Mark as processed
        processedPayments.push(paymentId);
        sessionStorage.setItem('processed_payments', JSON.stringify(processedPayments));
        
        // Clear the URL parameters by replacing the current entry in history
        const newUrl = window.location.pathname;
        router.replace(newUrl);
      }
    }
    
    const areaParam = searchParams.get('area') || searchParams.get('q');
    if (areaParam) {
      setArea(decodeURIComponent(areaParam));
    } else if (userLocation && !area) {
      setArea(userLocation.city);
    }
  }, [searchParams, userLocation]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  // Sync user with backend when session is available
  useEffect(() => {
    const syncUser = async () => {
      if (session?.user?.email && session?.user?.name) {
        try {
          const response = await fetch(`${apiUrl}/api/users/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: session.user.email,
              name: session.user.name,
              image_url: session.user.image || ''
            })
          });
          
          if (response.ok) {
            console.log('User synced successfully');
          } else {
            console.error('Failed to sync user:', response.status);
          }
        } catch (error) {
          console.error('Error syncing user:', error);
        }
      }
    };

    if (session?.user?.email) {
      syncUser();
    }
  }, [session]);
  
  // Fetch history function
  useEffect(() => {
    if (session?.user?.email) {
      fetchHistory();
    }
  }, [session]);

  const fetchHistory = async () => {
    if (!session?.user?.email) return;
    try {
      const encodedEmail = encodeURIComponent(session.user.email);
      const url = `${apiUrl}/api/history/${encodedEmail}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setHistory(data);
      setAnalysisCount(data.length);
    } catch (e) {
      console.error("Failed to fetch history", e);
      setHistory([]);
      setAnalysisCount(0);
    }
  };

  // Location suggestions
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (area && showSuggestions && area.length > 2) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(area)}&limit=5`);
          const data = await res.json();
          setSuggestions(data);
        } catch (e) {
          console.error("Error fetching locations", e);
        }
      } else {
        setSuggestions([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [area, showSuggestions]);

  const handleSelectSuggestion = (suggestion: any) => {
    setArea(suggestion.display_name);
    setShowSuggestions(false);
  };
  // Handle analyze function
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!area) return;
    
    if (hasReachedAnalysisLimit(analysisCount)) {
      addNotification({
        type: 'alert',
        title: 'Analysis Limit Reached',
        message: `You've reached your analysis limit. Please upgrade your plan to continue.`,
        priority: 'high'
      });
      router.push('/acquisition-tiers');
      return;
    }
    
    setLoading(true);
    setLoadingProgress(0);
    setResult(null);

    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 95) return prev;
        const increment = Math.random() * (prev < 50 ? 8 : prev < 80 ? 3 : 1);
        return Math.min(prev + increment, 95);
      });
    }, 800);

    try {
      const response = await fetch(`${apiUrl}/api/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          area, 
          user_email: session?.user?.email,
          language: language,
          timestamp: Date.now()
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setLoadingProgress(100);
      setTimeout(() => {
        setResult(data);
        clearInterval(progressInterval);
        setLoading(false);
        
        if (session?.user?.email) {
          addNotification({
            type: 'analysis',
            title: 'Analysis Complete',
            message: `Found ${data.recommendations?.length || 0} business opportunities in ${area}`,
            priority: 'high'
          });
        }
        fetchHistory();
      }, 500);
    } catch (error) {
      console.error("Failed to fetch recommendations", error);
      clearInterval(progressInterval);
      setLoading(false);
      
      addNotification({
        type: 'alert',
        title: 'Analysis Failed',
        message: 'Failed to analyze market data. Please check your connection and try again.',
        priority: 'high'
      });
    }
  };

  const loadFromHistory = (item: any) => {
    try {
      setArea(item.area);
      setResult({
        area: item.area,
        analysis: item.analysis,
        recommendations: item.recommendations,
        id: item.id
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error loading from history:', error);
      addNotification({
        type: 'alert',
        title: 'Load Failed',
        message: 'Failed to load historical data. Please try again.',
        priority: 'medium'
      });
    }
  };
  // Loading state
  if (status === "loading") {
    return (
      <ProtectedRoute>
        <div className="flex h-screen items-center justify-center bg-white dark:bg-[#020617] relative overflow-hidden transition-colors duration-500">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),transparent_70%)]" />
          <div className="relative">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="w-32 h-32 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full shadow-[0_0_50px_rgba(16,185,129,0.2)]" 
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Target className="text-emerald-500" size={40} />
              </motion.div>
            </div>
          </div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-12 text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500/40 italic"
          >
            Loading Dashboard...
          </motion.div>
        </div>
      </ProtectedRoute>
    );
  }
  // Main dashboard render
  return (
    <ProtectedRoute>
      <div className="bg-white dark:bg-[#020617] min-h-screen text-slate-900 dark:text-white transition-all duration-500 relative">
        {/* Theme-aware Background with Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/20 via-white to-emerald-50/20 dark:from-[#020617] dark:via-[#0f172a] dark:to-[#1e1b4b] pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-[500px] bg-emerald-500/[0.03] dark:bg-emerald-500/5 blur-[120px] pointer-events-none" />
        
        {/* Main Content Container */}
        <div className="responsive-container py-8 sm:py-12 lg:py-16 relative z-10">
          
          {/* Professional Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-10 sm:mb-16 border-b border-slate-200 dark:border-white/5 pb-10"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                    Neural Terminal v.2.0
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Active Scan</span>
                  </div>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-slate-900 dark:text-white leading-none tracking-tight mb-4">
                  {t('dash_ai_insights')}
                </h1>
                <p className="text-slate-600 dark:text-gray-400 text-base sm:text-xl max-w-2xl font-medium leading-relaxed">
                  {t('dash_ai_desc')}
                </p>
                
                {/* Status Indicator Pills from Image */}
                <div className="flex flex-wrap gap-3 pt-4">
                  {[
                    { label: t('dash_vector_global'), active: true, icon: <TrendingUp size={12} /> },
                    userLocation ? { 
                      label: `${userLocation.city}, ${userLocation.country}`, 
                      active: true, 
                      icon: <Globe2 size={12} className="text-blue-400" />,
                      special: true 
                    } : null,
                    { label: t('dash_vector_predict'), active: false, icon: <Cpu size={12} /> },
                    { label: "Smart Insights", active: false, icon: <Lightbulb size={12} /> }
                  ].filter(Boolean).map((pill: any, idx) => (
                    <motion.div 
                      key={idx}
                      whileHover={{ scale: 1.05 }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-widest transition-all duration-300 whitespace-nowrap shrink-0 group ${
                        pill.active 
                        ? pill.special 
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)] animate-pulse-slow'
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-white dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-500 dark:text-gray-500 shadow-sm'
                      }`}
                    >
                      <div className={`transition-all duration-300 group-hover:scale-125 ${pill.active ? pill.special ? 'text-blue-500' : 'text-emerald-500' : 'text-slate-400'}`}>
                        {pill.icon}
                      </div>
                      {pill.label}
                    </motion.div>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col items-start md:items-end gap-2 text-left md:text-right mt-4 md:mt-0">
                <div className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-[0.3em]">System Timestamp</div>
                <div className="text-xl font-mono font-bold text-slate-800 dark:text-white/80">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-500 font-bold uppercase tracking-widest">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Professional Layout */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10"
          >
            
            {/* Left Panel: SEARCH AREA */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* Region Search Card */}
              <UniformCard 
                title={t('dash_market_scope')}
                subtitle={t('dash_empty_desc')}
                icon={<Target className="w-5 h-5 sm:w-6 sm:h-6" />}
                variant="glass"
                size="lg"
                className="shadow-xl border-2 border-slate-200/50 dark:border-white/10"
              >
                <form onSubmit={handleAnalyze} className="space-y-6 sm:space-y-8">
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-500 dark:text-gray-500 uppercase tracking-wider pl-1">
                      {t('dash_target_loc')}
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 dark:text-gray-400 z-10" size={18} />
                      <input
                        type="text"
                        value={area}
                        onChange={(e) => {
                          setArea(e.target.value);
                          setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        className="w-full bg-white dark:bg-[#050818] border-2 border-slate-300 dark:border-slate-600 rounded-xl py-4 sm:py-5 pl-12 sm:pl-14 pr-14 text-base font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 focus:outline-none hover:border-slate-400 dark:hover:border-slate-500 shadow-sm"
                        placeholder={t('dash_enter_city')}
                        required
                        autoComplete="off"
                      />
                      
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button 
                          type="button"
                          onClick={() => {
                            refreshLocation();
                            addNotification({
                              type: 'location',
                              title: 'Finding Location',
                              message: 'Getting your current location... Please wait.',
                              priority: 'low'
                            } as any);
                          }}
                          className="p-3 rounded-lg hover:bg-emerald-500/10 text-slate-600 dark:text-gray-400 hover:text-emerald-500 transition-all"
                          title={t('dash_use_current_loc')}
                        >
                          <MapPin size={18} className={`${!userLocation ? "animate-spin" : ""} transition-transform`} />
                        </button>
                      </div>
                      {/* Location Suggestions Dropdown */}
                      <AnimatePresence>
                        {showSuggestions && suggestions.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute z-50 w-full mt-3 bg-white dark:bg-[#0a0f25] border-2 border-slate-300 dark:border-slate-600 rounded-xl shadow-xl max-h-80 overflow-y-auto p-2"
                          >
                            {suggestions.map((s, i) => (
                              <button
                                key={i}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleSelectSuggestion(s);
                                }}
                                className="w-full text-left p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all border border-transparent hover:border-slate-300 dark:hover:border-slate-600"
                              >
                                <div className="truncate">{s.display_name}</div>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  
                  {/* Search Button */}
                  <button
                    type="submit"
                    disabled={loading || !area || hasReachedAnalysisLimit(analysisCount)}
                    className={`w-full py-4 sm:py-5 bg-gradient-to-r ${theme.gradient} hover:opacity-90 disabled:bg-slate-300 dark:disabled:bg-slate-700 rounded-xl text-base font-bold text-white disabled:text-slate-500 transition-all shadow-lg disabled:shadow-none hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-3">
                        <Loader2 className="animate-spin" size={20} />
                        <span>{t('dash_analyzing')}</span>
                      </div>
                    ) : hasReachedAnalysisLimit(analysisCount) ? (
                      t('dash_limit_reached')
                    ) : (
                      t('dash_analyze')
                    )}
                  </button>

                  {/* Upgrade Notice */}
                  {hasReachedAnalysisLimit(analysisCount) && (
                    <div className="text-center p-4 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-200 dark:border-red-500/20">
                      <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">{t('dash_limit_desc')}</p>
                      <Link href="/acquisition-tiers" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline">
                        {t('dash_upgrade_now')} →
                      </Link>
                    </div>
                  )}
                </form>
              </UniformCard>
                  {/* Recent Searches Card */}
                  <UniformCard 
                    title={t('dash_recent_searches')}
                    icon={<Clock className="w-6 h-6" />}
                    variant="default"
                    size="lg"
                    className="shadow-lg border-2 border-slate-300 dark:border-white/10"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-sm font-medium text-slate-600 dark:text-gray-400">{t('dash_history_desc')}</span>
                      <button
                        onClick={fetchHistory}
                        className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                      >
                        {t('dash_refresh')}
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {history.length > 0 ? (
                        <>
                          {(showAllHistory ? history : history.slice(0, 3)).map((item, i: number) => (
                            <button 
                              key={i}
                              type="button"
                              onClick={() => loadFromHistory(item)}
                              className="w-full p-4 rounded-xl bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 hover:border-blue-500/30 hover:bg-slate-50 dark:hover:bg-white/10 text-left group transition-all hover:shadow-md"
                            >
                              <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate mb-1">
                                {item.area}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-gray-500">
                                {new Date(item.created_at).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric' 
                                })}
                              </div>
                            </button>
                          ))}
                        </>
                      ) : (
                        <div className="py-12 text-center">
                          <Clock className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                          <div className="text-sm font-medium text-slate-500 dark:text-gray-500">No search history yet</div>
                          <div className="text-xs text-slate-400 dark:text-gray-600 mt-1">Start searching to see your history here</div>
                        </div>
                      )}
                      
                      {history.length > 3 && (
                        <div className="pt-2 text-center border-t border-slate-100 dark:border-white/5">
                          <button
                            onClick={() => setShowAllHistory(!showAllHistory)}
                            className="text-[10px] font-bold text-slate-400 dark:text-gray-600 uppercase tracking-widest hover:text-blue-500 dark:hover:text-blue-400 transition-colors flex items-center gap-2 mx-auto"
                          >
                            {showAllHistory ? (
                              <>Show Fewer History <ChevronRight size={12} className="rotate-[-90deg]" /></>
                            ) : (
                              <>+ {history.length - 3} More Items Hidden <ChevronRight size={12} className="rotate-[90deg]" /></>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </UniformCard>

              {/* Smart Features Card with AI Widget */}
              <UniformCard 
                title="AI Engine"
                subtitle="Real-time market analysis"
                icon={<Lightbulb className="w-6 h-6" />}
                variant="gradient"
                size="lg"
                className="shadow-xl border-2 border-slate-200/50 dark:border-white/10"
              >
                {/* AI Widget */}
                <div className="flex justify-center mb-6">
                  <AIAnalysisWidget size="md" showStatus={true} />
                </div>
                
                <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed mb-6">
                  Our AI continuously analyzes local search trends, competition, and market data to find the best business opportunities for your specific location.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500 flex-shrink-0">
                      <Globe2 size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-700 dark:text-gray-300">Live Market Data</div>
                      <div className="text-xs text-slate-500 dark:text-gray-500">Real-time business intelligence</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 flex-shrink-0">
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-700 dark:text-gray-300">Profit Predictions</div>
                      <div className="text-xs text-slate-500 dark:text-gray-500">AI-powered ROI calculations</div>
                    </div>
                  </div>
                </div>
              </UniformCard>
            </div>
            {/* Right Panel: ANALYSIS RESULTS */}
            <div className="lg:col-span-8 space-y-10">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div 
                    key="loading-terminal"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                  >
                    <UniformCard 
                      variant="glass" 
                      size="lg"
                      className="min-h-[500px] relative overflow-hidden shadow-2xl border-2 border-slate-200/50 dark:border-white/10"
                    >
                      {/* AI Animation Background */}
                      <AIAnalysisCanvas className="absolute inset-0 w-full h-full" />
                      
                      {/* Loading Content Overlay */}
                      <div className="relative z-20 h-full flex flex-col items-center justify-center text-center p-8">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white/90 dark:bg-[#0a0f25]/90 backdrop-blur-xl rounded-3xl p-8 border border-slate-200 dark:border-white/10 max-w-2xl shadow-2xl"
                        >
                          <div className="w-20 h-20 relative mb-8 mx-auto">
                            <div className="absolute inset-0 rounded-full border-2 border-blue-400/30 animate-ping" />
                            <div className="absolute inset-2 rounded-full border border-blue-500/50 animate-pulse" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Loader2 className="text-blue-500 animate-spin" size={32} />
                            </div>
                          </div>
                          
                          <h2 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight mb-4 drop-shadow-lg">
                            Analyzing Market
                          </h2>
                          
                          <p className="text-slate-600 text-base font-medium uppercase tracking-wider mb-8 max-w-md drop-shadow-sm">
                            Finding the best business opportunities for {area}...
                          </p>
                          
                          <div className="w-full max-w-lg h-3 bg-slate-200 rounded-full overflow-hidden backdrop-blur-sm border border-slate-300">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${loadingProgress}%` }}
                              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg"
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                          <div className="mt-4 text-sm font-bold text-blue-600">
                            {Math.round(loadingProgress)}% Complete
                          </div>
                        </motion.div>
                      </div>
                    </UniformCard>
                  </motion.div>
                ) : result ? (
                  <motion.div 
                    key="results-terminal"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    {/* Results Header */}
                    <UniformCard 
                      variant="gradient" 
                      size="lg"
                      className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 shadow-2xl border-2 border-slate-200/50 dark:border-white/10"
                    >
                      <div className="space-y-4">
                        <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{t('dash_results_header')}</div>
                        <h2 className="text-4xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                          {area}
                        </h2>
                        <p className="text-slate-600 dark:text-gray-400 text-lg font-medium">
                          Found {result.recommendations?.length || 0} {t('dash_strategic_opps')}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button 
                          type="button" 
                          onClick={() => window.print()} 
                          className="px-8 py-4 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-700 dark:text-white transition-all hover:shadow-md"
                        >
                          Save Report
                        </button>
                        <Link 
                          href={`/roadmap?area=${encodeURIComponent(area)}&title=${encodeURIComponent(result.recommendations?.[0]?.title || "New Business")}&desc=${encodeURIComponent(
                            (typeof result.analysis === 'object' ? result.analysis?.executive_summary : result.analysis) || "Market Opportunity"
                          )}&lang=${language}`} 
                          className={`px-8 py-4 bg-gradient-to-r ${theme.gradient} hover:opacity-90 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]`}
                        >
                          {t('dash_view_plan')}
                        </Link>
                      </div>
                    </UniformCard>

                    {/* Analysis Summary */}
                    <div className="grid lg:grid-cols-2 gap-8 items-stretch mb-12">
                      <UniformCard 
                        title="Market Summary"
                        variant="glass"
                        size="lg"
                        className="shadow-lg border-2 border-slate-200/50 dark:border-white/10 h-full flex flex-col"
                      >
                        <div className="flex-grow">
                          {renderFormattedText(typeof result.analysis === 'object' 
                            ? (result.analysis?.executive_summary || result.analysis?.market_overview) 
                            : (result.analysis || "Market analysis in progress..."))}
                        </div>
                      </UniformCard>
                      <UniformCard 
                        title="Key Metrics"
                        variant="glass"
                        size="lg"
                        className="shadow-lg border-2 border-slate-200/50 dark:border-white/10 h-full flex flex-col"
                      >
                        <div className="flex-grow flex flex-col justify-center">
                          <div className="grid grid-cols-2 gap-8">
                            <div className="text-center p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 hover:border-emerald-500/30 transition-all group">
                              <div className="flex justify-center mb-4">
                                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                  <Target className="w-6 h-6" />
                                </div>
                              </div>
                              <div className="text-xs font-bold text-slate-500 dark:text-gray-500 uppercase tracking-widest mb-1">Success Rate</div>
                              <div className="text-4xl lg:text-5xl font-black text-emerald-500 tracking-tighter tabular-nums drop-shadow-sm">{
                                (typeof result.analysis === 'object' ? result.analysis?.confidence_score : "85%")
                              }</div>
                              <div className="mt-2 text-[10px] font-bold text-emerald-600/60 dark:text-emerald-400/40 uppercase">High Potential</div>
                            </div>
                            
                            <div className="text-center p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 hover:border-blue-500/30 transition-all group">
                              <div className="flex justify-center mb-4">
                                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                  <TrendingUp className="w-6 h-6" />
                                </div>
                              </div>
                              <div className="text-xs font-bold text-slate-500 dark:text-gray-500 uppercase tracking-widest mb-1">Market Gap</div>
                              <div className="text-4xl lg:text-5xl font-black text-blue-500 tracking-tighter drop-shadow-sm">{
                                (typeof result.analysis === 'object' ? result.analysis?.market_gap_intensity : "High")
                              }</div>
                              <div className="mt-2 text-[10px] font-bold text-blue-600/60 dark:text-blue-400/40 uppercase">Unsaturated</div>
                            </div>
                          </div>
                        </div>
                      </UniformCard>
                    </div>

                    {/* Business Opportunities */}
                    <div className="space-y-8">
                      <div className="text-center">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4">
                          Business Opportunities
                        </h3>
                        <p className="text-slate-600 dark:text-gray-400 text-lg">
                          {result.recommendations?.length || 0} premium opportunities found for {area}
                        </p>
                      </div>
                      <div className="grid gap-8">
                        {result.recommendations?.map((rec: any, idx: number) => (
                          <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}>
                            <UniformCard 
                              variant="glass"
                              hover={true}
                              delay={idx * 0.1}
                              className="group relative overflow-hidden shadow-xl border-2 border-slate-200/50 dark:border-white/10"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                              
                              <div className="relative z-10">
                                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-6">
                                  <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                                        <span className="text-emerald-500 font-black text-lg">#{idx + 1}</span>
                                      </div>
                                      <div>
                                        <h4 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                          {rec.title}
                                        </h4>
                                      </div>
                                    </div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-gray-300 leading-relaxed max-w-3xl">
                                      {rec.description}
                                    </p>
                                  </div>
                                  
                                  <div className="flex flex-col items-center lg:items-end gap-2 min-w-[120px]">
                                    <div className="text-xs font-bold text-slate-500 dark:text-gray-500 uppercase tracking-wider">Profit Score</div>
                                    <div className="text-3xl font-black text-emerald-500 italic">
                                      {rec.profitability_score || 85}/100
                                    </div>
                                    <div className="w-20 h-2 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-1000"
                                        style={{ width: `${rec.profitability_score || 85}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Financial Grid */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
                                  <div className="text-center">
                                    <div className="text-xs font-bold text-slate-500 dark:text-gray-500 uppercase tracking-wider mb-1">Investment</div>
                                    <div className="text-lg font-black text-blue-600 dark:text-blue-400">{rec.funding_required || '₹5L-₹15L'}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-xs font-bold text-slate-500 dark:text-gray-500 uppercase tracking-wider mb-1">Revenue</div>
                                    <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">{rec.estimated_revenue || '₹25L/year'}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-xs font-bold text-slate-500 dark:text-gray-500 uppercase tracking-wider mb-1">Profit</div>
                                    <div className="text-lg font-black text-yellow-600 dark:text-yellow-400">{rec.estimated_profit || '₹15L/year'}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-xs font-bold text-slate-500 dark:text-gray-500 uppercase tracking-wider mb-1">ROI</div>
                                    <div className="text-lg font-black text-purple-600 dark:text-purple-400">{rec.roi_percentage || 120}%</div>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                  <button
                                    onClick={async () => {
                                      try {
                                        setLoadingPlan(rec.title);
                                        
                                        const response = await fetch(`${apiUrl}/api/business-plan`, {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            business_title: rec.title,
                                            area: area,
                                            user_email: session?.user?.email,
                                            language: language
                                          })
                                        });
                                        
                                        if (response.ok) {
                                          const planData = await response.json();
                                          sessionStorage.setItem('business_plan', JSON.stringify({
                                            business: rec,
                                            plan: planData,
                                            area: area
                                          }));
                                          
                                          addNotification({
                                            type: 'analysis',
                                            title: 'Business Plan Generated',
                                            message: `6-month plan for ${rec.title} is ready!`,
                                            priority: 'high'
                                          });
                                          
                                          router.push('/business-plan');
                                        } else {
                                          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                                        }
                                      } catch (error) {
                                        console.error('Failed to generate business plan:', error);
                                        addNotification({
                                          type: 'alert',
                                          title: 'Generation Failed',
                                          message: 'Failed to generate business plan. Please try again.',
                                          priority: 'high'
                                        });
                                      } finally {
                                        setLoadingPlan(null);
                                      }
                                    }}
                                    disabled={loadingPlan === rec.title}
                                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r ${theme.gradient} hover:opacity-90 text-white rounded-xl font-bold text-sm transition-all hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                                  >
                                    {loadingPlan === rec.title ? (
                                      <>
                                        <Loader2 className="animate-spin" size={16} />
                                        Generating...
                                      </>
                                    ) : (
                                      <>
                                        <FileText size={16} />
                                        Get 6-Month Plan
                                      </>
                                    )}
                                  </button>
                                  
                                  <button
                                    onClick={() => {
                                      sessionStorage.setItem('selected_business', JSON.stringify({
                                        business: rec,
                                        area: area
                                      }));
                                      
                                      addNotification({
                                        type: 'profile',
                                        title: 'Loading Details',
                                        message: `Opening detailed analysis for ${rec.title}`,
                                        priority: 'low'
                                      });
                                      
                                      router.push('/business-details');
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all hover:scale-105 shadow-lg"
                                  >
                                    <BarChart3 size={16} />
                                    View Details
                                  </button>
                                  
                                  <button
                                    onClick={async () => {
                                      const businessInfo = `Business: ${rec.title}\nLocation: ${area}\nInvestment: ${rec.funding_required}\nRevenue: ${rec.estimated_revenue}\nProfit: ${rec.estimated_profit}\nROI: ${rec.roi_percentage}%`;
                                      
                                      try {
                                        await navigator.clipboard.writeText(businessInfo);
                                        addNotification({
                                          type: 'system',
                                          title: 'Copied to Clipboard',
                                          message: 'Business information copied successfully',
                                          priority: 'low'
                                        });
                                      } catch (error) {
                                        const textArea = document.createElement('textarea');
                                        textArea.value = businessInfo;
                                        document.body.appendChild(textArea);
                                        textArea.select();
                                        document.execCommand('copy');
                                        document.body.removeChild(textArea);
                                        
                                        addNotification({
                                          type: 'system',
                                          title: 'Copied to Clipboard',
                                          message: 'Business information copied successfully',
                                          priority: 'low'
                                        });
                                      }
                                    }}
                                    className="px-4 py-3 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-xl font-bold text-sm transition-all border border-slate-200 dark:border-white/10 hover:shadow-md"
                                    title="Copy business information"
                                  >
                                    <ArrowRight size={16} />
                                  </button>
                                </div>
                              </div>
                            </UniformCard>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* READY TO SEARCH - Idle State with AI Animation */
                  <motion.div 
                    key="ready-to-search"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-8"
                  >
                    {/* AI Analysis Animation */}
                    <UniformCard 
                      variant="glass" 
                      size="lg"
                      className="min-h-[500px] relative overflow-hidden shadow-2xl border-2 border-slate-200/50 dark:border-white/10"
                    >
                      <AIAnalysisCanvas className="absolute inset-0 w-full h-full" />
                      
                      {/* Overlay Content */}
                      <div className="relative z-20 h-full flex flex-col items-center justify-center text-center p-8">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                          className="bg-white/90 dark:bg-[#0a0f25]/90 backdrop-blur-xl rounded-3xl p-8 border border-slate-200 dark:border-white/10 max-w-2xl shadow-2xl"
                        >
                          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4 drop-shadow-lg">
                            AI Market Analysis
                          </h2>
                          
                          <p className="text-slate-600 dark:text-gray-400 text-lg font-medium mb-8 leading-relaxed drop-shadow-sm">
                            Enter a city or region to discover profitable business opportunities. 
                            Our AI analyzes market data, competition, and local trends in real-time.
                          </p>
                          
                          <div className="flex flex-wrap justify-center gap-4 text-sm">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 backdrop-blur-sm whitespace-nowrap shrink-0">
                              <div className="w-2 h-2 shrink-0 bg-blue-500 rounded-full animate-pulse" />
                              <span className="text-blue-700 dark:text-blue-400 font-bold uppercase tracking-widest text-[10px]">Live Market Data</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-sm whitespace-nowrap shrink-0">
                              <div className="w-2 h-2 shrink-0 bg-slate-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                              <span className="text-slate-700 dark:text-gray-400 font-bold uppercase tracking-widest text-[10px]">AI Predictions</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-sm whitespace-nowrap shrink-0">
                              <div className="w-2 h-2 shrink-0 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                              <span className="text-slate-600 dark:text-gray-500 font-bold uppercase tracking-widest text-[10px]">Smart Insights</span>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </UniformCard>
                    
                    {/* Feature Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      <UniformCard 
                        variant="glass"
                        className="text-center p-6 shadow-lg border-2 border-slate-200/50 dark:border-white/10"
                      >
                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4 mx-auto">
                          <Globe2 className="text-blue-500" size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Market Analysis</h3>
                        <p className="text-sm text-slate-600 dark:text-gray-400">Real-time market data and competition analysis</p>
                      </UniformCard>
                      
                      <UniformCard 
                        variant="glass"
                        className="text-center p-6 shadow-lg border-2 border-slate-200/50 dark:border-white/10"
                      >
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4 mx-auto">
                          <TrendingUp className="text-emerald-500" size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Profit Predictions</h3>
                        <p className="text-sm text-slate-600 dark:text-gray-400">AI-powered ROI and revenue forecasting</p>
                      </UniformCard>
                      
                      <UniformCard 
                        variant="glass"
                        className="text-center p-6 shadow-lg border-2 border-slate-200/50 dark:border-white/10 sm:col-span-2 lg:col-span-1"
                      >
                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4 mx-auto">
                          <Lightbulb className="text-purple-500" size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Smart Insights</h3>
                        <p className="text-sm text-slate-600 dark:text-gray-400">Location-specific business recommendations</p>
                      </UniformCard>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Payment Success Modal */}
        <PaymentSuccessModal 
          isOpen={showSuccessModal} 
          onClose={() => setShowSuccessModal(false)}
          paymentDetails={paymentDetails}
        />
      </div>
    </ProtectedRoute>
  );
}

export default Dashboard;