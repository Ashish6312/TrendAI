"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export type SubscriptionPlan = 'free' | 'professional' | 'enterprise';

export interface SubscriptionTheme {
  primary: string;
  secondary: string;
  accent: string;
  gradient: string;
  badge: string;
  glow: string;
}

interface SubscriptionContextType {
  plan: SubscriptionPlan;
  theme: SubscriptionTheme;
  setPlan: (plan: SubscriptionPlan) => void;
  isSubscribed: boolean;
  planFeatures: {
    maxAnalyses: number;
    advancedFeatures: boolean;
    prioritySupport: boolean;
    customReports: boolean;
    apiAccess: boolean;
    competitorInsights: boolean;
    realTimeAlerts: boolean;
    exportToPdf: boolean;
    customBranding: boolean;
    dedicatedManager: boolean;
    whiteLabel: boolean;
    phoneSupport: boolean;
    advancedDashboard: boolean;
    customDataSources: boolean;
    planName: string;
    planDescription: string;
  };
  canAccessFeature: (feature: keyof typeof planFeatures.free) => boolean;
  getRemainingAnalyses: (currentCount: number) => number;
  hasReachedAnalysisLimit: (currentCount: number) => boolean;
  isLoading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const themes: Record<SubscriptionPlan, SubscriptionTheme> = {
  free: {
    primary: '#6b7280', // Gray
    secondary: '#9ca3af',
    accent: '#3b82f6', // Blue
    gradient: 'from-gray-600 to-gray-500',
    badge: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    glow: 'shadow-[0_0_30px_-5px_rgba(107,114,128,0.4)]'
  },
  professional: {
    primary: '#10b981', // Emerald
    secondary: '#34d399',
    accent: '#059669',
    gradient: 'from-emerald-600 to-emerald-500',
    badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    glow: 'shadow-[0_0_30px_-5px_rgba(16,185,129,0.4)]'
  },
  enterprise: {
    primary: '#8b5cf6', // Purple
    secondary: '#a78bfa',
    accent: '#7c3aed',
    gradient: 'from-purple-600 to-purple-500',
    badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    glow: 'shadow-[0_0_30px_-5px_rgba(139,92,246,0.4)]'
  }
};

const planFeatures = {
  free: {
    maxAnalyses: 5,
    advancedFeatures: false,
    prioritySupport: false,
    customReports: false,
    apiAccess: false,
    competitorInsights: false,
    realTimeAlerts: false,
    exportToPdf: false,
    customBranding: false,
    dedicatedManager: false,
    whiteLabel: false,
    phoneSupport: false,
    advancedDashboard: false,
    customDataSources: false,
    planName: 'Starter',
    planDescription: 'Perfect for exploring basic market data and validating your first business ideas.'
  },
  professional: {
    maxAnalyses: -1, // Unlimited
    advancedFeatures: true,
    prioritySupport: true,
    customReports: true,
    apiAccess: false,
    competitorInsights: true,
    realTimeAlerts: true,
    exportToPdf: true,
    customBranding: true,
    dedicatedManager: false,
    whiteLabel: false,
    phoneSupport: false,
    advancedDashboard: true,
    customDataSources: false,
    planName: 'Professional',
    planDescription: 'Designed for serious business owners ready to scale their research with advanced AI.'
  },
  enterprise: {
    maxAnalyses: -1, // Unlimited
    advancedFeatures: true,
    prioritySupport: true,
    customReports: true,
    apiAccess: true,
    competitorInsights: true,
    realTimeAlerts: true,
    exportToPdf: true,
    customBranding: true,
    dedicatedManager: true,
    whiteLabel: true,
    phoneSupport: true,
    advancedDashboard: true,
    customDataSources: true,
    planName: 'Enterprise',
    planDescription: 'The complete solution for large companies requiring deep data and custom integrations.'
  }
};

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [plan, setPlanState] = useState<SubscriptionPlan>('free');
  const [isLoading, setIsLoading] = useState(true);

  // Load subscription plan from API or localStorage
  useEffect(() => {
    const loadUserPlan = async () => {
      if (session?.user?.email) {
        setIsLoading(true);
        const email = session.user.email.toLowerCase().trim();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

        try {
          // 1. Try fetching from API first (Source of Truth)
          const response = await fetch(`${apiUrl}/api/subscriptions/${email}`);
            if (response.ok) {
              const data = await response.json();
              console.log('📡 AI Terminal: Fetching subscription for', email);
              if (data.plan_name && ['free', 'professional', 'enterprise'].includes(data.plan_name)) {
                console.log('✅ Subscription synced from database:', data.plan_name);
                setPlanState(data.plan_name as SubscriptionPlan);
                localStorage.setItem(`subscription_${email}`, data.plan_name);
                setIsLoading(false);
                return;
              } else {
                console.warn('⚠️ API returned invalid plan name:', data.plan_name);
              }
            } else {
              console.error('❌ API failed with status:', response.status);
            }
          } catch (error) {
            console.error('❌ Database sync connection error:', error);
          }

        try {
          // 2. Fallback to localStorage
          const savedPlan = localStorage.getItem(`subscription_${email}`) as SubscriptionPlan;
          if (savedPlan && ['free', 'professional', 'enterprise'].includes(savedPlan)) {
            setPlanState(savedPlan);
          }

          // 3. Check for recent payment in URL (immediate activation)
          const urlParams = new URLSearchParams(window.location.search);
          const paymentPlan = urlParams.get('plan');
          if (paymentPlan) {
            const planMapping: Record<string, SubscriptionPlan> = {
              'Starter': 'free',
              'Market Explorer': 'free',
              'Professional': 'professional',
              'Growth Accelerator': 'professional', 
              'Enterprise': 'enterprise',
              'Market Dominator': 'enterprise'
            };
            const newPlan = planMapping[paymentPlan] || (paymentPlan.toLowerCase() as SubscriptionPlan);
            if (['free', 'professional', 'enterprise'].includes(newPlan)) {
              setPlan(newPlan);
            }
          }
        } catch (error) {
          console.error('Error loading fallback plan:', error);
        }
      }
      setIsLoading(false);
    };

    loadUserPlan();
  }, [session?.user?.email]);

  const setPlan = (newPlan: SubscriptionPlan) => {
    setPlanState(newPlan);
    if (session?.user?.email) {
      localStorage.setItem(`subscription_${session.user.email}`, newPlan);
    }
    
    // Update CSS custom properties for theme
    const theme = themes[newPlan];
    document.documentElement.style.setProperty('--subscription-primary', theme.primary);
    document.documentElement.style.setProperty('--subscription-secondary', theme.secondary);
    document.documentElement.style.setProperty('--subscription-accent', theme.accent);
    
    // Add plan-specific body class for global styling
    document.body.className = document.body.className.replace(/plan-\w+/g, '');
    document.body.classList.add(`plan-${newPlan}`);
  };

  // Apply theme on mount and plan change
  useEffect(() => {
    const theme = themes[plan];
    document.documentElement.style.setProperty('--subscription-primary', theme.primary);
    document.documentElement.style.setProperty('--subscription-secondary', theme.secondary);
    document.documentElement.style.setProperty('--subscription-accent', theme.accent);
    
    // Add plan-specific body class
    document.body.className = document.body.className.replace(/plan-\w+/g, '');
    document.body.classList.add(`plan-${plan}`);
  }, [plan]);

  const isSubscribed = plan !== 'free';

  // Plan enforcement functions
  const canAccessFeature = (feature: keyof typeof planFeatures.free): boolean => {
    return planFeatures[plan][feature] as boolean;
  };

  const getRemainingAnalyses = (currentCount: number): number => {
    const maxAnalyses = planFeatures[plan].maxAnalyses;
    if (maxAnalyses === -1) return -1; // Unlimited
    return Math.max(0, maxAnalyses - currentCount);
  };

  const hasReachedAnalysisLimit = (currentCount: number): boolean => {
    const maxAnalyses = planFeatures[plan].maxAnalyses;
    if (maxAnalyses === -1) return false; // Unlimited
    return currentCount >= maxAnalyses;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <SubscriptionContext.Provider value={{
      plan,
      theme: themes[plan],
      setPlan,
      isSubscribed,
      planFeatures: planFeatures[plan],
      canAccessFeature,
      getRemainingAnalyses,
      hasReachedAnalysisLimit,
      isLoading
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}