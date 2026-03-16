"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle, ArrowRight, Star, Sparkles, Crown, Zap, Download, Mail, Calendar, CreditCard, Shield, Gift, X, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { useNotifications } from "@/context/NotificationContext";
import { useSubscription, SubscriptionPlan } from "@/context/SubscriptionContext";
import { useSession } from "next-auth/react";

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentDetails?: {
    payment_id: string | null;
    order_id: string | null;
    plan: string | null;
    amount: string | null;
    currency: string | null;
    billing: string | null;
  } | null;
}

export default function PaymentSuccessModal({ isOpen, onClose, paymentDetails }: PaymentSuccessModalProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { addNotification } = useNotifications();
  const { setPlan, theme } = useSubscription();
  const [showConfetti, setShowConfetti] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  
  const [wasSynced, setWasSynced] = useState(false);
  
  const currentDetails = React.useMemo(() => ({
    paymentId: paymentDetails?.payment_id || searchParams.get('payment_id') || `pay_${Date.now()}`,
    planParam: paymentDetails?.plan || searchParams.get('plan') || 'Market Dominator',
    amount: paymentDetails?.amount || searchParams.get('amount') || '5999',
    billingCycle: paymentDetails?.billing || searchParams.get('billing') || 'monthly',
    currency: paymentDetails?.currency || searchParams.get('currency') || 'INR'
  }), [paymentDetails, searchParams]);

  const { paymentId, planParam, amount, billingCycle, currency } = currentDetails;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      // Auto-advance steps
      const stepTimers = [
        setTimeout(() => setCurrentStep(1), 2000),
        setTimeout(() => setCurrentStep(2), 4000),
        setTimeout(() => setCurrentStep(3), 6000),
      ];

      // Hide confetti after 5 seconds
      const confettiTimer = setTimeout(() => setShowConfetti(false), 5000);

      const planMapping: Record<string, SubscriptionPlan> = {
        'Starter': 'free',
        'Market Explorer': 'free',
        'Professional': 'professional',
        'Growth Accelerator': 'professional', 
        'Enterprise': 'enterprise',
        'Market Dominator': 'enterprise',
        'free': 'free',
        'professional': 'professional',
        'enterprise': 'enterprise'
      };
      const currentPlan = planMapping[planParam] || (planParam.toLowerCase() as SubscriptionPlan);

      const planFeaturesMap = {
        'free': { max_analyses: 5, features: { advancedFeatures: false, prioritySupport: false, exportToPdf: false, apiAccess: false } },
        'professional': { max_analyses: 50, features: { advancedFeatures: true, prioritySupport: true, exportToPdf: true, apiAccess: true } },
        'enterprise': { max_analyses: -1, features: { advancedFeatures: true, prioritySupport: true, exportToPdf: true, apiAccess: true, dedicatedManager: true } }
      };

      const syncPlanWithBackend = async () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const userEmail = session?.user?.email?.toLowerCase().trim();
        
        if (!userEmail) return;

        const payload = {
          user_email: userEmail,
          plan_name: currentPlan,
          plan_display_name: planParam,
          billing_cycle: billingCycle,
          price: parseFloat(amount),
          currency: currency,
          max_analyses: planFeaturesMap[currentPlan].max_analyses,
          features: planFeaturesMap[currentPlan].features
        };

        try {
          // 1. Create/Update Subscription
          const subResponse = await fetch(`${apiUrl}/api/subscriptions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          
          if (!subResponse.ok) throw new Error('Subscription sync failed');
          const subData = await subResponse.json();
          
          // 2. Create Payment Record (linked to subscription)
          await fetch(`${apiUrl}/api/payments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_email: userEmail,
              subscription_id: subData.id,
              razorpay_payment_id: paymentId,
              razorpay_order_id: paymentDetails?.order_id || `ord_${Date.now()}`,
              amount: parseFloat(amount),
              currency: currency,
              status: 'success',
              plan_name: planParam,
              billing_cycle: billingCycle
            })
          });
          
          console.log('✅ Plan and Payment synced successfully');
          addNotification({
            type: 'payment',
            title: 'Payment Successful',
            message: `Your ${planParam} plan is now active.`,
            priority: 'medium'
          });

          // Wait a bit and then refresh profile data if possible
          setTimeout(() => {
            router.refresh();
          }, 3000);

        } catch (err) {
          console.error('❌ Failed to sync plan with backend:', err);
        }
      };

      setPlan(currentPlan);
      if (session?.user?.email && !wasSynced) {
        setWasSynced(true);
        syncPlanWithBackend();
      }
      
      return () => {
        document.body.style.overflow = 'unset';
        stepTimers.forEach(clearTimeout);
        clearTimeout(confettiTimer);
      };
    }
  }, [isOpen, planParam, setPlan, session?.user?.email, amount, billingCycle, currency, paymentId]);

  const handleCheckEmail = () => {
    addNotification({
      type: 'payment',
      title: 'Receipt Delivery',
      message: 'Initiating receipt delivery sequence... Please check your inbox.',
      priority: 'medium',
      actionUrl: '/profile?tab=billing'
    });
    if (session?.user?.email) {
      window.open(`mailto:${session.user.email}?subject=TrendAI Payment Receipt - ${planParam}&body=Thank you for your payment! Your receipt and setup guide are attached.`, '_blank');
    } else {
      window.open('mailto:', '_blank');
    }
  };

  const handleDownloadResources = () => {
    addNotification({
      type: 'trending',
      title: 'Resources',
      message: 'Opening resources... Just a moment.',
      priority: 'low',
      actionUrl: '/resources'
    });
    setTimeout(() => {
      router.push('/resources');
      onClose();
    }, 800);
  };

  const handleManageBilling = () => {
    addNotification({
      type: 'system',
      title: 'Billing Portal',
      message: 'Redirecting to secure billing portal...',
      priority: 'high',
      actionUrl: '/profile?tab=billing'
    });
    setTimeout(() => {
      router.push('/profile?tab=billing');
      onClose();
    }, 800);
  };

  const handleViewRoadmap = () => {
    addNotification({
      type: 'market',
      title: 'Roadmap Protocol',
      message: 'Loading your personalized strategic roadmap...',
      priority: 'medium',
      actionUrl: '/roadmap'
    });
    setTimeout(() => {
      router.push('/roadmap');
      onClose();
    }, 800);
  };

  const handleUpdateProfile = () => {
    addNotification({
      type: 'system',
      title: 'Profile Access',
      message: 'Opening profile configuration...',
      priority: 'medium',
      actionUrl: '/profile'
    });
    setTimeout(() => {
      router.push('/profile');
      onClose();
    }, 800);
  };

  const planFeatures = {
    'Starter': {
      analyses: 5,
      features: ['Basic Search', 'Email Support', 'Standard Reports'],
      color: '#10b981'
    },
    'Professional': {
      analyses: 50,
      features: ['Advanced AI Tools', 'Priority Support', 'Custom Reports', 'API Access'],
      color: '#3b82f6'
    },
    'Enterprise': {
      analyses: -1,
      features: ['Unlimited Searches', '24/7 Premium Support', 'Custom Reports', 'Full API Access', 'Custom Integrations', 'Account Manager'],
      color: '#8b5cf6'
    }
  };

  const currentPlanFeatures = planFeatures[planParam as keyof typeof planFeatures] || planFeatures['Enterprise'];

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.95, y: 30, filter: 'blur(10px)' }}
            transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
            className="relative w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto bg-white dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-3xl sm:rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] custom-scrollbar overflow-hidden"
          >
            {/* Grain Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />
            
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-8 right-8 p-3 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all z-50 group hover:rotate-90 duration-300"
            >
              <X size={18} />
            </button>

            {/* Content Container */}
            <div className="p-6 sm:p-10 text-center relative">
              {/* Confetti */}
              <AnimatePresence>
                {showConfetti && (
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(50)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute"
                        style={{ left: `${Math.random() * 100}%`, top: '-20px' }}
                        initial={{ y: -20, rotate: 0, opacity: 1 }}
                        animate={{ y: 800, rotate: 360, x: Math.random() * 200 - 100 }}
                        transition={{ duration: 3 + Math.random() * 2, ease: "easeOut" }}
                      >
                        <div 
                          className="w-1.5 h-1.5 rounded-full" 
                          style={{ backgroundColor: i % 3 === 0 ? currentPlanFeatures.color : i % 3 === 1 ? '#fbbf24' : '#3b82f6' }} 
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>

              <div className="space-y-8 sm:space-y-10">
                {/* Success Icon Group */}
                <div className="relative inline-block">
                   <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", bounce: 0.6 }}
                    className="relative z-10 w-20 h-20 sm:w-28 sm:h-28 rounded-[1.5rem] sm:rounded-[2rem] border-4 flex items-center justify-center bg-white dark:bg-slate-900 shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500"
                    style={{ borderColor: currentPlanFeatures.color }}
                  >
                    <CheckCircle className="w-10 h-10 sm:w-14 sm:h-14" style={{ color: currentPlanFeatures.color }} />
                  </motion.div>
                  <motion.div 
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 text-amber-400 drop-shadow-lg"
                  >
                    <Star size={24} className="sm:w-8 sm:h-8" fill="currentColor" />
                  </motion.div>
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -bottom-2 -left-4 sm:-bottom-2 sm:-left-6 text-blue-500 opacity-50"
                  >
                    <Sparkles size={18} className="sm:w-6 sm:h-6" />
                  </motion.div>
                </div>

                {/* Title Section */}
                <div className="space-y-4">
                  <motion.h1 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase"
                  >
                    Your Plan <br className="sm:hidden" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-gray-200 dark:to-white">is Active</span>
                  </motion.h1>
                  
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-2 sm:py-2.5 rounded-full bg-slate-900/5 dark:bg-white/[0.05] border border-slate-900/10 dark:border-white/10 backdrop-blur-3xl shadow-xl"
                  >
                    <Crown size={16} className="sm:w-[20px] sm:h-[20px] animate-pulse" style={{ color: currentPlanFeatures.color }} />
                    <span className="font-black text-sm sm:text-base tracking-tight uppercase" style={{ color: currentPlanFeatures.color }}>
                      {planParam} Tier
                    </span>
                  </motion.div>
                </div>

                {/* Details Grid */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-slate-50 dark:bg-white/[0.01] rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 border border-slate-200 dark:border-white/5 mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 relative overflow-hidden group/details"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-emerald-500/5 dark:to-emerald-500/[0.02] opacity-0 group-hover/details:opacity-100 transition-opacity duration-700" />
                  
                  <div className="text-center relative z-10">
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-1 sm:mb-2">Receipt ID</p>
                    <p className="font-mono text-[9px] sm:text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate px-2">{paymentId}</p>
                  </div>
                  <div className="text-center relative z-10">
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-1 sm:mb-2">Total Paid</p>
                    <p className="font-black text-xl sm:text-2xl text-slate-900 dark:text-emerald-400 tracking-tighter italic">
                      {currency === 'INR' ? '₹' : '$'}{parseInt(amount).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center relative z-10">
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-1 sm:mb-2">Billing Cycle</p>
                    <p className="font-black text-slate-900 dark:text-white uppercase italic text-xs sm:text-sm tracking-[0.2em]">{billingCycle}</p>
                  </div>
                </motion.div>

                {/* Features & Actions Container */}
                <div className="flex flex-col gap-6 sm:gap-8 text-left">
                  {/* Features List */}
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-slate-900/5 dark:bg-white/[0.02] rounded-2xl sm:rounded-[2rem] p-5 sm:p-7 border border-slate-900/10 dark:border-white/5"
                  >
                    <h3 className="text-[9px] sm:text-[10px] font-black text-slate-900 dark:text-white mb-4 sm:mb-6 uppercase tracking-[0.4em] italic opacity-60 text-center">Included Features</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentPlanFeatures.features.map((feature: string) => (
                         <div
                          key={feature}
                          className="flex items-center gap-3 group/feat"
                        >
                          <div className="w-5 h-5 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover/feat:scale-110 transition-transform">
                            <CheckCircle size={10} strokeWidth={3} />
                          </div>
                          <span className="text-slate-600 dark:text-slate-300 text-[11px] font-bold uppercase tracking-tight">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Actions Column */}
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                    className="flex flex-col sm:flex-row gap-3 sm:gap-4"
                  >
                    <button
                      onClick={onClose}
                      className="group relative flex-1 h-14 sm:h-16 rounded-xl sm:rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] shadow-xl sm:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all overflow-hidden italic"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
                        Execute Terminal <Zap size={16} className="sm:w-[18px] sm:h-[18px]" fill="currentColor" />
                      </span>
                    </button>
                    
                    <button
                      onClick={handleManageBilling}
                      className="flex-1 flex items-center justify-center gap-2 h-14 sm:h-16 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-all group"
                    >
                      <CreditCard size={16} className="text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Billing Portal</span>
                    </button>
                    <button
                      onClick={handleCheckEmail}
                      className="flex-1 flex items-center justify-center gap-2 h-14 sm:h-16 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-all group hidden sm:flex"
                    >
                      <Mail size={16} className="text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Secure Receipt</span>
                    </button>
                  </motion.div>
                </div>

                {/* Secure Trust Footer */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="pt-6 sm:pt-8 border-t border-slate-100 dark:border-white/5 flex flex-col items-center gap-4 sm:gap-6"
                >
                  <div className="flex flex-wrap justify-center gap-x-12 gap-y-4">
                    {[
                      { icon: <Calendar size={14} />, label: "Strategy Roadmap", action: handleViewRoadmap },
                      { icon: <User size={14} />, label: "Profile Protocol", action: handleUpdateProfile },
                      { icon: <Download size={14} />, label: "Intel Assets", action: handleDownloadResources }
                    ].map((item, i) => (
                      <button 
                        key={i}
                        onClick={item.action}
                        className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all group italic"
                      >
                        <span className="text-slate-300 dark:text-slate-700 group-hover:text-emerald-500 transition-colors">{item.icon}</span>
                        {item.label}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                    <Shield size={12} className="text-emerald-500" />
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600">Encrypted Sovereign Connection: Verified</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
