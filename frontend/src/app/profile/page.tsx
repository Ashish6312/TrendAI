"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  User, Phone, FileText, Loader2, Save, CheckCircle2, ArrowLeft, ArrowRight,
  ShieldCheck, Crown, Zap, Star, Settings, Calendar, 
  MapPin, Globe, Award, BarChart3, Activity, Clock, Building2, 
  Target, Sparkles, ChevronRight, Edit3, Camera,
  CreditCard, X, RefreshCw
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { useNotifications } from "@/context/NotificationContext";
import { getPricingForCountry, formatPrice } from "@/utils/locationPricing";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import ProtectedRoute from "../../components/ProtectedRoute";
import LoginHistory from "../../components/LoginHistory";
import InvoiceModal from "../../components/InvoiceModal";

// Enhanced location detection with GPS and validation
const getAccurateLocation = async (): Promise<{ country: string; city: string; currency: string; coordinates?: { lat: number; lng: number } } | null> => {
  // Race IP detection with GPS (IP is usually faster)
  const ipFetch = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const proxyRes = await fetch(`${apiUrl}/api/system/location`);
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        return {
          country: data.country || 'Unknown',
          city: data.city || 'Unknown',
          currency: data.currency || 'USD'
        };
      }
    } catch (e) {
      console.warn('Backend location proxy failed, falling back to direct...');
    }
    
    const ipResponse = await fetch('https://ipapi.co/json/');
    if (ipResponse.ok) {
      const ipData = await ipResponse.json();
      return {
        country: ipData.country_name || 'Unknown',
        city: ipData.city || 'Unknown',
        currency: ipData.currency || 'USD'
      };
    }
    throw new Error('IP fetch failed');
  };

  const gpsFetch = async () => {
    if (!navigator.geolocation) throw new Error('No GPS');
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { 
        enableHighAccuracy: true, timeout: 5000, maximumAge: 300000 
      });
    });
    const { latitude, longitude } = position.coords;
    const revResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
    if (revResponse.ok) {
      const geoData = await revResponse.json();
      return {
        country: geoData.countryName || 'Unknown',
        city: geoData.locality || geoData.city || 'Unknown',
        currency: getCurrencyByCountry(geoData.countryName || 'Unknown'),
        coordinates: { lat: latitude, lng: longitude }
      };
    }
    throw new Error('RevGeo failed');
  };

  try {
    // Race them for speed, but prefer GPS if it finishes fast
    return await Promise.any([gpsFetch(), ipFetch()]);
  } catch (error) {
    console.error('All location methods failed', error);
    return null;
  }
};

const getCurrencyByCountry = (country: string): string => {
  const currencyMap: { [key: string]: string } = {
    'India': 'INR',
    'United States': 'USD',
    'United Kingdom': 'GBP',
    'Germany': 'EUR',
    'France': 'EUR',
    'Japan': 'JPY',
    'China': 'CNY',
    'Brazil': 'BRL',
    'Canada': 'CAD',
    'Australia': 'AUD',
    // Add more as needed
  };
  return currencyMap[country] || 'USD';
};

const getProfessionalPlanName = (name: string): string => {
  const map: { [key: string]: string } = {
    'free': 'Starter',
    'starter': 'Starter',
    'professional': 'Professional',
    'professional monthly': 'Professional',
    'professional yearly': 'Professional',
    'enterprise': 'Enterprise',
    'enterprise monthly': 'Enterprise',
    'enterprise yearly': 'Enterprise'
  };
  
  const normalized = name.toLowerCase();
  return map[normalized] || name;
};

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}

function ProfilePageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { plan, theme, planFeatures } = useSubscription();
  const { userLocation, addNotification } = useNotifications();
  
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    phone: "",
    image_url: "",
    company: "",
    location: "",
    website: "",
    industry: "",
  });
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [analysisCount, setAnalysisCount] = useState(0);
  const [joinDate, setJoinDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'billing'>('profile');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(true);
  const [autoSave, setAutoSave] = useState(false);
  const [locationDetecting, setLocationDetecting] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showAllPayments, setShowAllPayments] = useState(false);
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fallback timeout to ensure form is always accessible
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!hasLoaded) {
        setHasLoaded(true);
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeout);
  }, [hasLoaded]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      addNotification({
        type: 'alert',
        title: 'Buffer Overflow',
        message: 'Image payload exceeds 2MB limit. Please provide a high-efficiency compressed visual.',
        priority: 'medium'
      } as any);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setFormData(prev => ({ ...prev, image_url: base64String }));
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      try {
        await fetch(`${apiUrl}/api/users/${session?.user?.email}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            image_url: base64String
          }),
        });
        
        addNotification({
          type: 'profile',
          title: 'Biometric Sync',
          message: 'Your visual identifier has been updated across the neural network.',
          priority: 'low'
        });
      } catch (error) {
        console.error("Failed to sync visual identifier:", error);
      }
    };
    reader.readAsDataURL(file);
  };
  
  // Tab handling from URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'billing' || tab === 'profile' || tab === 'overview') {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  const [detectedLocation, setDetectedLocation] = useState<{ country: string; city: string; currency: string; coordinates?: { lat: number; lng: number } } | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  
  // Get location-based pricing
  const locationPricing = getPricingForCountry(userLocation?.country || 'Global');

  const planIcons = {
    free: Star,
    professional: Zap,
    enterprise: Crown
  };

  const PlanIcon = planIcons[plan];
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Real-time connectivity monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-save functionality with debouncing
  useEffect(() => {
    if (!autoSave || !session?.user?.email) return;

    const timeoutId = setTimeout(() => {
      handleSubmit(new Event('submit') as any, true); // Silent save
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [formData, autoSave, session?.user?.email]);

  // Real-time data refresh
  useEffect(() => {
    if (!session?.user?.email) return;

    const fetchProfileSilent = async () => {
      if (!session?.user?.email) return;
      
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/users/${session.user.email}`);
        if (response.ok) {
          const data = await response.json();
          setFormData(prev => ({
            ...prev,
            name: data.name || prev.name || session?.user?.name || "",
            bio: data.bio !== undefined && data.bio !== null ? data.bio : prev.bio,
            phone: data.phone !== undefined && data.phone !== null ? data.phone : prev.phone,
            image_url: data.image_url || data.image || prev.image_url || session?.user?.image || "",
            company: data.company !== undefined && data.company !== null ? data.company : prev.company,
            location: data.location !== undefined && data.location !== null ? data.location : prev.location,
            website: data.website !== undefined && data.website !== null ? data.website : prev.website,
            industry: data.industry !== undefined && data.industry !== null ? data.industry : prev.industry,
          }));
          setLastUpdated(new Date());
        }

        const historyResponse = await fetch(`${apiUrl}/api/history/${session.user.email}`);
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setAnalysisCount(historyData.length);
        }
      } catch (error) {
        console.error("Silent refresh failed:", error);
      }
    };

    const interval = setInterval(() => {
      fetchProfileSilent(); // Silent refresh
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [session?.user?.email]);
  // Enhanced location detection on mount
  useEffect(() => {
    const detectLocation = async () => {
      setLocationDetecting(true);
      try {
        const location = await getAccurateLocation();
        if (location) {
          setDetectedLocation(location);
        }
      } catch (error) {
        console.error('Location detection failed:', error);
      } finally {
        setLocationDetecting(false);
      }
    };

    detectLocation();
  }, []);

  // Auto-detect location button handler
  const handleAutoDetectLocation = async () => {
    setLocationDetecting(true);
    try {
      const location = await getAccurateLocation();
      if (location) {
        setDetectedLocation(location);
        const locationString = location.coordinates 
          ? `${location.city}, ${location.country}` 
          : `${location.city}, ${location.country}`;
        setFormData({ ...formData, location: locationString });
        setMessage('Location detected and updated successfully!');
        setTimeout(() => setMessage(''), 3000);
        
        // Add location detection notification
        addNotification({
          type: 'system',
          title: 'Location Detected',
          message: `Your location has been automatically detected as ${locationString}`,
          priority: 'medium',
          actionUrl: '/profile',
          metadata: {
            location: locationString,
            coordinates: location.coordinates,
            detection_method: location.coordinates ? 'GPS' : 'IP'
          }
        });
      } else {
        setMessage('Unable to detect location. Please enter manually.');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Location detection failed:', error);
      setMessage('Location detection failed. Please enter manually.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLocationDetecting(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);
  useEffect(() => {
    const fetchProfile = async (silent = false) => {
      if (!session?.user?.email) return;
      
      // Only show full loading screen on the very first load
      if (!silent && !hasLoaded) setLoading(true);

      const email = session.user.email.toLowerCase().trim();

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        
        // First, sync the user to ensure they exist in the database
        const userSync = await fetch(`${apiUrl}/api/users/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            name: session?.user?.name || "",
            image_url: session?.user?.image || ""
          }),
        });

        if (!userSync.ok) {
          console.warn('User sync failed, but continuing with profile fetch');
        }

        // Now fetch profile data after sync is complete
        const [userRes, historyRes, profileRes] = await Promise.all([
          fetch(`${apiUrl}/api/users/${email}`),
          fetch(`${apiUrl}/api/history/${email}`),
          fetch(`${apiUrl}/api/users/${email}/profile`)
        ]);

        if (userRes.ok) {
          const data = await userRes.json();
          setFormData({
            name: data.name || session?.user?.name || "",
            bio: data.bio || "",
            phone: data.phone || "",
            image_url: data.image_url || session?.user?.image || "",
            company: data.company || "",
            location: data.location || "",
            website: data.website || "",
            industry: data.industry || "",
          });
          setJoinDate(data.created_at ? new Date(data.created_at) : null);
        }

        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setAnalysisCount(historyData.length);
        }

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setSubscriptionDetails(profileData.subscription);
          setPayments(profileData.recent_payments || []);
          console.log('Profile data loaded:', {
            subscription: profileData.subscription,
            payments: profileData.recent_payments?.length || 0
          });
        } else {
          console.error('Failed to load profile data:', await profileRes.text());
        }

        setLastUpdated(new Date());
        setHasLoaded(true);
      } catch (error: any) {
        console.error("Optimized fetch failed:", error);
        if (!silent) setMessage("Operating in Lite Mode (Connection Issues)");
        setHasLoaded(true); // Set hasLoaded to true even on error to show the form
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated" && !hasLoaded) {
      fetchProfile();
    }
  }, [session?.user?.email, status]);
  const handleSubmit = async (e: React.FormEvent, silent = false) => {
    e.preventDefault();
    if (!silent) setSaving(true);
    if (!silent) setMessage("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      // Enhanced validation
      if (!formData.name.trim()) {
        throw new Error('Name is required');
      }
      
      if (formData.name.trim().length < 2) {
        throw new Error('Name must be at least 2 characters long');
      }
      
      if (formData.phone && formData.phone.trim() && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
        throw new Error('Please enter a valid phone number');
      }
      
      if (formData.website && formData.website.trim() && !formData.website.match(/^https?:\/\/.+/)) {
        const websiteWithProtocol = `https://${formData.website.trim()}`;
        setFormData({ ...formData, website: websiteWithProtocol });
      }

      // Prepare data for submission
      const submitData = {
        name: formData.name.trim(),
        bio: formData.bio.trim(),
        phone: formData.phone.trim(),
        image_url: formData.image_url || session?.user?.image || "",
        company: formData.company.trim(),
        location: formData.location.trim(),
        website: formData.website.trim(),
        industry: formData.industry.trim()
      };

      const email = session?.user?.email?.toLowerCase().trim() || "";
      const response = await fetch(`${apiUrl}/api/users/${email}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(submitData),
      });

      console.log('Profile update response status:', response.status);
      
      if (response.ok) {
        const updatedUser = await response.json();
        console.log('Profile updated successfully:', updatedUser);
        setLastUpdated(new Date());
        if (!silent) {
          setMessage("Profile updated successfully!");
          setTimeout(() => setMessage(""), 3000);
          
          // Add simple notification
          addNotification({
            type: 'profile',
            title: 'Profile Updated',
            message: 'Your profile has been successfully updated with the latest information.',
            priority: 'low',
            actionUrl: '/profile',
            metadata: {
              profile_completion: completionPercentage(),
              updated_at: new Date().toISOString()
            }
          });
        }
        
        // Update form data with server response to ensure consistency
        setFormData({
          name: updatedUser.name || "",
          bio: updatedUser.bio || "",
          phone: updatedUser.phone || "",
          image_url: updatedUser.image_url || session?.user?.image || "",
          company: updatedUser.company || "",
          location: updatedUser.location || "",
          website: updatedUser.website || "",
          industry: updatedUser.industry || "",
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }
    } catch (error: any) {
      console.error("Failed to update profile", error);
      if (!silent) {
        setMessage(error.message || "Failed to update profile. Please try again.");
        setTimeout(() => setMessage(""), 5000);
      }
    } finally {
      if (!silent) setSaving(false);
    }
  };

  const downloadTransactions = () => {
    if (!payments.length) return;
    
    const headers = ["Invoice ID", "Date", "Plan", "Billing Cycle", "Amount", "Currency", "Status"];
    const csvRows = [
      headers.join(","),
      ...payments.map(p => [
        p.razorpay_payment_id || p.id,
        new Date(p.payment_date).toLocaleDateString(),
        p.plan_name,
        p.billing_cycle,
        p.amount,
        p.currency,
        p.status
      ].join(","))
    ];
    
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `TrendAI_Transactions_${session?.user?.email}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addNotification({
      type: 'system',
      title: 'Download Complete',
      message: 'Your transaction history has been exported successfully.',
      priority: 'low',
      actionUrl: '/profile?tab=billing'
    });
  };
  // Enhanced loading guard: Only show full-screen loader on initial mount
  // Subsequent session revalidations or silent refreshes won't interrupt the UI
  if ((status === "loading" || loading) && !hasLoaded && status !== "authenticated") {
    return (
      <div className="min-h-screen bg-white dark:bg-[#020617] flex items-center justify-center transition-colors duration-500">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative mb-8">
            {/* Elegant loading rings */}
            <div className="relative w-20 h-20 mx-auto">
              <motion.div 
                className="absolute inset-0 border-4 border-t-transparent rounded-full"
                style={{ borderTopColor: theme.primary, borderRightColor: `${theme.primary}30`, borderBottomColor: `${theme.primary}30`, borderLeftColor: `${theme.primary}30` }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <motion.div 
                className="absolute inset-2 border-2 border-r-transparent rounded-full"
                style={{ borderTopColor: `${theme.secondary}40`, borderRightColor: 'transparent', borderBottomColor: `${theme.secondary}40`, borderLeftColor: `${theme.secondary}40` }}
                animate={{ rotate: -360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
              <motion.div 
                className="absolute inset-0 flex items-center justify-center"
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              >
                <PlanIcon size={32} style={{ color: theme.primary }} />
              </motion.div>
            </div>
          </div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-black text-slate-900 dark:text-white mb-2 italic"
          >
            Loading Your Profile
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-slate-500 dark:text-gray-400 font-medium"
          >
            Preparing your {planFeatures.planName} experience...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  const completionPercentage = () => {
    const fields = [
      formData.name, 
      formData.phone, 
      formData.company, 
      formData.location, 
      formData.bio, 
      formData.industry,
      formData.website
    ];
    const completed = fields.filter(field => field && field.trim() !== '').length;
    return Math.round((completed / fields.length) * 100);
  };

  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };
  return (
    <div className="min-h-screen bg-white dark:bg-[#020617] relative transition-colors duration-500">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-grid-white/[0.02]" />
        <div className="absolute inset-0 noise-bg opacity-10" />
        <div className="absolute inset-0 opacity-20">
          {/* Elegant floating orbs instead of particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full blur-xl"
              style={{
                background: `radial-gradient(circle, ${theme.primary}40, transparent)`,
                width: `${Math.random() * 200 + 100}px`,
                height: `${Math.random() * 200 + 100}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                x: [0, Math.random() * 100 - 50, 0],
                y: [0, Math.random() * 100 - 50, 0],
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 8 + Math.random() * 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 responsive-container py-6 md:py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 lg:mb-8"
        >
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()} 
              className="flex items-center gap-2 lg:gap-3 px-4 lg:px-6 py-2 lg:py-3 rounded-xl lg:rounded-2xl bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 hover:bg-slate-900/10 dark:hover:bg-white/10 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-all group backdrop-blur-sm text-sm lg:text-base italic"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-black">Back</span>
              <span className="hidden sm:inline">to Dashboard</span>
            </button>

            {/* Real-time Status Indicator */}
            <div className="flex items-center gap-2">
              <motion.div
                animate={{
                  scale: isOnline ? [1, 1.2, 1] : 1,
                  opacity: isOnline ? [0.7, 1, 0.7] : 0.5
                }}
                transition={{
                  duration: 2,
                  repeat: isOnline ? Infinity : 0,
                  ease: "easeInOut"
                }}
                className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}
              />
              <span className="text-xs text-slate-500 dark:text-gray-400">
               {isOnline ? 'Live' : 'Offline'}
              </span>
              <span className="text-xs text-slate-400 dark:text-gray-500">
                • {currentTime.toLocaleTimeString()}
              </span>
            </div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 lg:gap-4 w-full sm:w-auto justify-center sm:justify-end"
          >
            <div 
              className="px-4 lg:px-6 py-2 lg:py-3 rounded-xl lg:rounded-2xl border font-bold text-xs lg:text-sm flex items-center gap-2 lg:gap-3 backdrop-blur-sm min-w-0"
              style={{ 
                backgroundColor: `${theme.primary}15`,
                borderColor: `${theme.primary}40`,
                color: theme.primary,
                boxShadow: `0 8px 32px ${theme.primary}20`
              }}
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="flex-shrink-0"
              >
                <PlanIcon size={16} className="lg:w-5 lg:h-5" />
              </motion.div>
              <span className="truncate">{planFeatures.planName}</span>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: theme.primary }}
              />
            </div>
          </motion.div>
        </motion.div>
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Left Sidebar - Profile Card */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 order-1 lg:order-1"
          >
            <div 
              className="glass-card p-6 lg:p-8 text-center relative overflow-hidden bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-white/10"
              style={{ 
                borderColor: `${theme.primary}20`,
                background: `linear-gradient(135deg, ${theme.primary}08, transparent)`
              }}
            >
              {/* Profile Image with Plan-based Animation */}
              <div className="relative mb-4 lg:mb-6">
                {/* Elegant pulsing ring instead of spinning gradient */}
                <motion.div 
                  className="absolute -inset-3 lg:-inset-4 rounded-full"
                  style={{ 
                    background: `linear-gradient(135deg, ${theme.primary}40, ${theme.secondary}40, ${theme.primary}40)`,
                    filter: 'blur(8px)'
                  }}
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.4, 0.8, 0.4],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                {/* Secondary ring for depth */}
                <motion.div 
                  className="absolute -inset-2 lg:-inset-3 rounded-full border-2 opacity-30"
                  style={{ borderColor: theme.primary }}
                  animate={{
                    scale: [1.05, 0.95, 1.05],
                    opacity: [0.2, 0.6, 0.2],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                />
                <div 
                  className="relative group cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <img 
                    src={formData.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || session?.user?.name || 'User')}&background=${theme.primary.slice(1)}&color=ffffff&size=200&bold=true`} 
                    className="w-24 h-24 lg:w-32 lg:h-32 rounded-full border-4 border-white/20 shadow-2xl object-cover mx-auto relative z-10 group-hover:opacity-60 transition-all duration-500"
                    alt="Profile"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <Camera className="text-white w-8 h-8 lg:w-10 lg:h-10" />
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  <motion.div 
                    className="absolute -bottom-1 -right-1 lg:-bottom-2 lg:-right-2 p-2 lg:p-3 rounded-full shadow-xl border-2 lg:border-4 border-white dark:border-slate-800"
                    style={{ backgroundColor: theme.primary }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{
                      boxShadow: [
                        `0 0 20px ${theme.primary}40`,
                        `0 0 30px ${theme.primary}60`,
                        `0 0 20px ${theme.primary}40`
                      ]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <PlanIcon size={16} className="lg:w-5 lg:h-5 text-white" />
                  </motion.div>
                </div>
              </div>

              {/* User Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white mb-2 italic tracking-tighter">
                  {formData.name || session?.user?.name || 'Welcome'}
                </h1>
                <p className="text-slate-500 dark:text-gray-400 text-xs lg:text-sm mb-3 lg:mb-4 break-all px-2 font-medium">{session?.user?.email}</p>
                
                {formData.company && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-center gap-2 text-xs lg:text-sm text-slate-600 dark:text-gray-300 mb-2 font-bold"
                  >
                    <Building2 size={12} className="lg:w-3.5 lg:h-3.5" />
                    <span className="truncate px-2 italic">{formData.company}</span>
                  </motion.div>
                )}
                
                {(formData.location || userLocation?.country !== 'Unknown') && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-center gap-2 text-xs lg:text-sm text-slate-600 dark:text-gray-300 mb-2 font-bold"
                  >
                    <MapPin size={12} className="lg:w-3.5 lg:h-3.5" />
                    <span className="truncate px-2 italic">{formData.location || `${userLocation?.city}, ${userLocation?.country}`}</span>
                  </motion.div>
                )}

                {joinDate && (
                  <div className="flex items-center justify-center gap-2 text-xs lg:text-sm text-slate-500 dark:text-gray-400 mb-3 lg:mb-4 font-black italic uppercase tracking-widest">
                    <Calendar size={12} className="lg:w-3.5 lg:h-3.5" />
                    <span>Member since {joinDate.toLocaleDateString()}</span>
                  </div>
                )}
              </motion.div>
              {/* Profile Completion */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-4 lg:mb-6"
              >
                <div className="flex items-center justify-between mb-2 font-black italic">
                  <span className="text-xs lg:text-[10px] uppercase tracking-widest text-slate-500 dark:text-gray-300">Profile Completion</span>
                  <span className="text-xs lg:text-sm font-black" style={{ color: theme.primary }}>
                    {completionPercentage()}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-gray-700 rounded-full h-1.5 lg:h-2 overflow-hidden">
                  <motion.div 
                    className="h-1.5 lg:h-2 rounded-full"
                    style={{ backgroundColor: theme.primary }}
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPercentage()}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
              </motion.div>

              {/* Stats Grid */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-2 gap-3 lg:gap-4 mb-4 lg:mb-6"
              >
                <div className="text-center p-3 lg:p-4 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
                  <motion.div 
                    className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mb-1 italic tracking-tighter"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8, type: "spring", bounce: 0.5 }}
                  >
                    {analysisCount}
                  </motion.div>
                  <div className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest">Analyses</div>
                </div>
                <div className="text-center p-3 lg:p-4 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
                  <motion.div 
                    className="text-2xl lg:text-3xl font-black mb-1 italic tracking-tighter"
                    style={{ color: theme.primary }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1, type: "spring", bounce: 0.5 }}
                  >
                    {planFeatures.maxAnalyses === -1 ? '∞' : planFeatures.maxAnalyses}
                  </motion.div>
                  <div className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest">Limit</div>
                </div>
              </motion.div>

              {/* Upgrade CTA for Free Users */}
              {plan === 'free' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                >
                  <Link 
                    href="/acquisition-tiers"
                    className="block w-full py-3 lg:py-4 px-4 lg:px-6 rounded-xl font-bold text-xs lg:text-sm transition-all hover:scale-105 group relative overflow-hidden"
                    style={{ 
                      background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                      color: 'white'
                    }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-white/20"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '100%' }}
                      transition={{ duration: 0.6 }}
                    />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Sparkles size={14} className="lg:w-4 lg:h-4" />
                      <span>Upgrade Plan</span>
                      <ChevronRight size={14} className="lg:w-4 lg:h-4" />
                    </span>
                  </Link>
                </motion.div>
              )}
            </div>
          </motion.div>
          {/* Right Content - Tabs */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3 order-2 lg:order-2"
          >
            {/* Tab Navigation */}
            <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 mb-6 lg:mb-8 p-1 bg-slate-100/50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 backdrop-blur-sm">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'profile', label: 'Profile Settings', icon: User },
                { id: 'billing', label: 'Plan & Billing', icon: Crown }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 lg:px-6 py-3 lg:py-4 rounded-xl font-black text-xs sm:text-sm transition-all italic tracking-tight ${
                    activeTab === tab.id
                      ? 'text-slate-900 dark:text-white shadow-lg'
                      : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/5'
                  }`}
                  style={{
                    backgroundColor: activeTab === tab.id ? `${theme.primary}20` : 'transparent',
                    border: activeTab === tab.id ? `1px solid ${theme.primary}40` : '1px solid transparent'
                  }}
                >
                  <tab.icon size={16} className="sm:inline hidden" />
                  <tab.icon size={14} className="sm:hidden" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden text-xs">{tab.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  {/* Elite Founder Protocol - High Engagement Dashboard */}
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-10 bg-gradient-to-br from-emerald-500/10 via-white dark:via-slate-900/95 to-white/95 dark:to-slate-900 overflow-hidden relative border-emerald-500/20 shadow-2xl"
                  >
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 blur-[120px] rounded-full -mr-48 -mt-48" />
                    
                    <div className="relative z-10">
                      <div className="flex flex-col lg:flex-row items-center gap-12">
                        {/* Interactive Progress Ring */}
                        <div className="relative shrink-0">
                          <svg className="w-48 h-48 transform -rotate-90">
                            <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-900/5 dark:text-white/5" />
                            <motion.circle
                              cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent"
                              strokeDasharray={552}
                              initial={{ strokeDashoffset: 552 }}
                              animate={{ strokeDashoffset: 552 - (552 * completionPercentage()) / 100 }}
                              transition={{ duration: 2, ease: "easeOut" }}
                              className="text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-5xl font-black text-slate-900 dark:text-white italic tracking-tighter">{completionPercentage()}%</span>
                            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-500/50 uppercase tracking-[0.3em] mt-1">Readiness</span>
                          </div>
                        </div>

                        <div className="flex-1 space-y-10 text-center lg:text-left">
                          <div className="space-y-4">
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter leading-tight">Profile Summary</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold leading-relaxed max-w-xl italic">
                              Complete your profile to get the most out of our AI business tools and personalized market insights.
                            </p>
                          </div>

                          {/* Status Badges - High Engagement */}
                          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                             <div className={`px-5 py-2.5 rounded-2xl border flex items-center gap-3 transition-all duration-500 font-black italic ${completionPercentage() > 80 ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-xl' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-500'}`}>
                                <Award size={18} />
                                <span className="text-[10px] uppercase tracking-widest">{completionPercentage() > 80 ? 'Pro User' : 'Basic User'}</span>
                             </div>
                             <div className={`px-5 py-2.5 rounded-2xl border flex items-center gap-3 transition-all duration-500 group relative font-black italic ${formData.location ? 'bg-blue-500/20 border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-xl' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-500'}`}>
                                <Globe size={18} className={`${formData.location ? 'animate-pulse' : ''}`} />
                                <span className="text-[10px] uppercase tracking-widest">{formData.location ? `Searching in ${formData.location.split(',')[0]}` : 'No Location Set'}</span>
                             </div>
                             <div className="px-5 py-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center gap-3 font-black italic">
                                <Target size={18} />
                                <span className="text-[10px] uppercase tracking-widest">Rank: Top 10%</span>
                             </div>
                          </div>

                          {/* Critical Actions */}
                          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center gap-6">
                             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Next Steps:</span>
                             <div className="flex gap-4">
                                {completionPercentage() < 100 && (
                                  <button 
                                    onClick={() => setActiveTab('profile')}
                                    className="text-[11px] font-bold text-emerald-400 hover:text-white flex items-center gap-2 group transition-colors"
                                  >
                                     Finish Profile <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                  </button>
                                )}
                                <button 
                                  onClick={() => router.push('/dashboard')}
                                  className="text-[11px] font-bold text-blue-400 hover:text-white flex items-center gap-2 group transition-colors"
                                >
                                   Search Now <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  {/* Plan Features Overview */}
                  <div 
                    className="glass-card p-8"
                    style={{ borderColor: `${theme.primary}20` }}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div 
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: `${theme.primary}20` }}
                      >
                        <Settings size={24} style={{ color: theme.primary }} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter">Plan Overview</h2>
                        <p className="text-slate-500 dark:text-gray-400 font-medium">Your current subscription and features</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                      {/* Usage Stats */}
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2 italic tracking-tighter">
                          <Activity size={20} style={{ color: theme.primary }} />
                          Usage Statistics
                        </h3>
                        <div className="space-y-4">
                          <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
                            <div className="flex items-center justify-between mb-2 font-black italic">
                              <span className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-gray-300">Searches Used</span>
                              <span className="text-sm text-slate-900 dark:text-white">
                                {analysisCount} / {planFeatures.maxAnalyses === -1 ? '∞' : planFeatures.maxAnalyses}
                              </span>
                            </div>
                            {planFeatures.maxAnalyses !== -1 && (
                              <div className="w-full bg-slate-200 dark:bg-gray-700 rounded-full h-2">
                                <motion.div 
                                  className="h-2 rounded-full transition-all duration-300"
                                  style={{ backgroundColor: theme.primary }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min((analysisCount / planFeatures.maxAnalyses) * 100, 100)}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Features List */}
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2 italic tracking-tighter">
                          <Target size={20} style={{ color: theme.primary }} />
                          Available Features
                        </h3>
                        <div className="space-y-3">
                          {[
                            { key: 'advancedFeatures', label: 'AI Profit Engine', icon: BarChart3 },
                            { key: 'prioritySupport', label: 'Priority Support', icon: ShieldCheck },
                            { key: 'exportToPdf', label: 'PDF Reports', icon: FileText },
                            { key: 'apiAccess', label: 'Full API Access', icon: Globe },
                            { key: 'realTimeAlerts', label: 'Market Alerts', icon: Activity },
                            { key: 'customReports', label: 'Custom Analysis', icon: Award }
                          ].map((feature, index) => (
                            <motion.div 
                              key={feature.key}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-center justify-between p-3 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 transition-all font-black italic"
                            >
                              <div className="flex items-center gap-3">
                                <feature.icon size={16} className="text-slate-400 dark:text-gray-500" />
                                <span className="text-[10px] uppercase tracking-widest text-slate-600 dark:text-gray-300">{feature.label}</span>
                              </div>
                              <motion.span 
                                className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${
                                  planFeatures[feature.key as keyof typeof planFeatures] 
                                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                                    : 'bg-slate-500/20 text-slate-500 dark:text-gray-500 border border-slate-500/30'
                                }`}
                                whileHover={{ scale: 1.05 }}
                              >
                                {planFeatures[feature.key as keyof typeof planFeatures] ? '✓ Included' : 'Upgrade'}
                              </motion.span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <motion.div
                      whileHover={{ scale: 1.02, y: -5 }}
                      className="glass-card p-6 text-center cursor-pointer group"
                      style={{ borderColor: `${theme.primary}20` }}
                      onClick={() => router.push('/dashboard')}
                    >
                      <div 
                        className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: `${theme.primary}20` }}
                      >
                        <BarChart3 size={24} style={{ color: theme.primary }} />
                      </div>
                      <h3 className="font-black text-slate-900 dark:text-white mb-2 italic tracking-tighter">Dashboard</h3>
                      <p className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">View your analytics</p>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02, y: -5 }}
                      className="glass-card p-6 text-center cursor-pointer group"
                      style={{ borderColor: `${theme.primary}20` }}
                      onClick={() => setActiveTab('profile')}
                    >
                      <div 
                        className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: `${theme.primary}20` }}
                      >
                        <Edit3 size={24} style={{ color: theme.primary }} />
                      </div>
                      <h3 className="font-black text-slate-900 dark:text-white mb-2 italic tracking-tighter">Edit Profile</h3>
                      <p className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">Update your information</p>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02, y: -5 }}
                      className="glass-card p-6 text-center cursor-pointer group"
                      style={{ borderColor: `${theme.primary}20` }}
                      onClick={() => router.push('/acquisition-tiers')}
                    >
                      <div 
                        className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: `${theme.primary}20` }}
                      >
                        <Crown size={24} style={{ color: theme.primary }} />
                      </div>
                      <h3 className="font-black text-slate-900 dark:text-white mb-2 italic tracking-tighter">Upgrade Plan</h3>
                      <p className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">Unlock more features</p>
                    </motion.div>
                  </div>
                </motion.div>
              )}
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <div 
                    className="glass-card p-8"
                    style={{ borderColor: `${theme.primary}20` }}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div 
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: `${theme.primary}20` }}
                      >
                        <User size={24} style={{ color: theme.primary }} />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter">Profile Settings</h2>
                        <p className="text-slate-500 dark:text-gray-400 font-medium">Update your personal information</p>
                      </div>
                      
                      {/* Auto-save Toggle */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">Auto-save</span>
                        <button
                          onClick={() => setAutoSave(!autoSave)}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            autoSave ? 'bg-green-500' : 'bg-gray-600'
                          }`}
                        >
                          <motion.div
                            animate={{ x: autoSave ? 24 : 2 }}
                            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                          />
                        </button>
                      </div>
                    </div>

                    {message && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mb-6 p-4 rounded-xl border flex items-center gap-2 ${
                          message.includes('successfully') 
                            ? 'bg-green-500/20 border-green-500/30 text-green-400'
                            : message.includes('offline') || message.includes('locally')
                            ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
                            : 'bg-red-500/20 border-red-500/30 text-red-400'
                        }`}
                      >
                        {message.includes('successfully') ? (
                          <CheckCircle2 size={16} />
                        ) : message.includes('offline') || message.includes('locally') ? (
                          <Clock size={16} />
                        ) : (
                          <X size={16} />
                        )}
                        <span>{message}</span>
                        {autoSave && message.includes('successfully') && (
                          <span className="ml-auto text-xs opacity-70">Auto-saved</span>
                        )}
                      </motion.div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Name */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Full Name *
                          </label>
                          <div className="relative">
                            <User size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all font-black italic tracking-tight"
                              style={{ '--tw-ring-color': theme.primary } as React.CSSProperties}
                              placeholder="Enter your full name"
                              required
                            />
                          </div>
                        </div>

                        {/* Phone */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Phone Number
                          </label>
                          <div className="relative">
                            <Phone size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all font-black italic tracking-tight"
                              style={{ '--tw-ring-color': theme.primary } as React.CSSProperties}
                              placeholder="+91 98765 43210"
                            />
                          </div>
                        </div>

                        {/* Company */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Company
                          </label>
                          <div className="relative">
                            <Building2 size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={formData.company}
                              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                              className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all font-black italic tracking-tight"
                              style={{ '--tw-ring-color': theme.primary } as React.CSSProperties}
                              placeholder="Your company name"
                            />
                          </div>
                        </div>

                        {/* Location */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Location
                          </label>
                          <div className="relative">
                            <MapPin size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={formData.location}
                              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                              className="w-full pl-12 pr-24 py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all font-black italic tracking-tight"
                              style={{ '--tw-ring-color': theme.primary } as React.CSSProperties}
                              placeholder="Enter your location"
                            />
                            <button
                              type="button"
                              onClick={handleAutoDetectLocation}
                              disabled={locationDetecting}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1.5 text-xs rounded-lg transition-all hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                              style={{ color: theme.primary }}
                              title="Auto-detect location using GPS"
                            >
                              {locationDetecting ? (
                                <>
                                  <Loader2 size={12} className="animate-spin" />
                                  <span>Detecting...</span>
                                </>
                              ) : (
                                <>
                                  <Globe size={12} />
                                  <span>Auto</span>
                                </>
                              )}
                            </button>
                          </div>
                          {detectedLocation && (
                            <div className="mt-2 p-2 bg-white/5 rounded-lg border border-white/10">
                              <p className="text-xs text-gray-400 mb-1">Detected location:</p>
                              <p className="text-sm text-white">
                                {detectedLocation.city}, {detectedLocation.country}
                                {detectedLocation.coordinates && (
                                  <span className="text-xs text-gray-400 ml-2">
                                    (GPS: {detectedLocation.coordinates.lat.toFixed(4)}, {detectedLocation.coordinates.lng.toFixed(4)})
                                  </span>
                                )}
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  const locationString = `${detectedLocation.city}, ${detectedLocation.country}`;
                                  setFormData({ ...formData, location: locationString });
                                }}
                                className="text-xs mt-1 px-2 py-1 rounded transition-all hover:bg-white/10"
                                style={{ color: theme.primary }}
                              >
                                Use this location
                              </button>
                            </div>
                          )}
                          {userLocation && userLocation.country !== 'Unknown' && !detectedLocation && (
                            <p className="text-xs text-gray-400 mt-1">
                              Fallback: {userLocation.city !== 'Unknown' ? `${userLocation.city}, ` : ''}{userLocation.country}
                            </p>
                          )}
                        </div>

                        {/* Website */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Website
                          </label>
                          <div className="relative">
                            <Globe size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="url"
                              value={formData.website}
                              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                              className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all font-black italic tracking-tight"
                              style={{ '--tw-ring-color': theme.primary } as React.CSSProperties}
                              placeholder="https://yourwebsite.com"
                            />
                          </div>
                        </div>

                        {/* Industry */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Industry
                          </label>
                          <div className="relative">
                            <Target size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <select
                              value={formData.industry}
                              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                              className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all appearance-none cursor-pointer font-black italic tracking-tight"
                              style={{ '--tw-ring-color': theme.primary } as React.CSSProperties}
                            >
                              <option value="" className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white">Select your industry</option>
                              <option value="Technology" className="bg-slate-800">Technology</option>
                              <option value="Healthcare" className="bg-slate-800">Healthcare</option>
                              <option value="Finance" className="bg-slate-800">Finance</option>
                              <option value="Education" className="bg-slate-800">Education</option>
                              <option value="Retail" className="bg-slate-800">Retail</option>
                              <option value="Manufacturing" className="bg-slate-800">Manufacturing</option>
                              <option value="Real Estate" className="bg-slate-800">Real Estate</option>
                              <option value="Food & Beverage" className="bg-slate-800">Food & Beverage</option>
                              <option value="Consulting" className="bg-slate-800">Consulting</option>
                              <option value="Marketing" className="bg-slate-800">Marketing</option>
                              <option value="Agriculture" className="bg-slate-800">Agriculture</option>
                              <option value="Transportation" className="bg-slate-800">Transportation</option>
                              <option value="Entertainment" className="bg-slate-800">Entertainment</option>
                              <option value="Other" className="bg-slate-800">Other</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      {/* Bio */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-semibold text-gray-300">
                            Bio
                          </label>
                          <span className="text-xs text-gray-500">
                            {formData.bio.length}/500
                          </span>
                        </div>
                        <div className="relative">
                          <FileText size={18} className="absolute left-4 top-4 text-gray-400" />
                          <textarea
                            value={formData.bio}
                            onChange={(e) => {
                              if (e.target.value.length <= 500) {
                                setFormData({ ...formData, bio: e.target.value });
                              }
                            }}
                            rows={4}
                            className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all resize-none font-bold italic tracking-tight"
                            style={{ '--tw-ring-color': theme.primary } as React.CSSProperties}
                            placeholder="Tell us about yourself and your business goals..."
                          />
                        </div>
                      </div>

                      {/* Submit Button */}
                      <motion.button
                        type="submit"
                        disabled={saving}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-4 px-6 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                        style={{ 
                          background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                        }}
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {saving ? (
                            <>
                              <Loader2 size={20} className="animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save size={20} />
                              Save Changes
                            </>
                          )}
                        </span>
                      </motion.button>
                    </form>
                  </div>
                </motion.div>
              )}
              {activeTab === 'billing' && (
                <motion.div
                  key="billing"
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <div 
                    className="glass-card p-6 lg:p-8"
                    style={{ borderColor: `${theme.primary}20` }}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                      <div className="flex items-center gap-3">
                        <div 
                          className="p-3 rounded-xl"
                          style={{ backgroundColor: `${theme.primary}20` }}
                        >
                          <Crown size={24} style={{ color: theme.primary }} />
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter">Plan & Billing</h2>
                          <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">Review your subscription, usage, and transaction history</p>
                        </div>
                      </div>
                      
                      <Link 
                        href="/acquisition-tiers"
                        className="px-6 py-2.5 rounded-xl font-bold text-sm bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all flex items-center justify-center gap-2"
                      >
                        <Zap size={16} style={{ color: theme.primary }} />
                        Compare Tiers
                      </Link>
                    </div>

                    {/* Current Subscription Status */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                      {/* Plan Card */}
                      <div className="lg:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-slate-100/50 dark:from-slate-800/80 to-slate-200/50 dark:to-slate-900/80 border border-slate-200 dark:border-white/5 relative overflow-hidden group shadow-xl">
                        <div 
                          className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-20 transition-all group-hover:opacity-30" 
                          style={{ background: theme.primary }} 
                        />
                        
                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-6">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Current Plan</span>
                                {subscriptionDetails?.status === 'active' && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase tracking-tighter border border-emerald-500/20">Active</span>
                                )}
                              </div>
                              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight italic">{planFeatures.planName}</h3>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Price</span>
                              <div className="text-2xl font-black text-slate-900 dark:text-white italic">
                                {plan === 'free' ? 'Free Access' : formatPrice(subscriptionDetails?.price || 0, getPricingForCountry(userLocation?.country || 'Global'))}
                                <span className="text-xs text-slate-400 dark:text-gray-500 font-black ml-1">/ {subscriptionDetails?.billing_cycle || 'Cycle'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-200 dark:border-white/5">
                            <div>
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">Renews on</span>
                              <span className="text-sm font-black text-slate-700 dark:text-slate-200 italic">
                                {subscriptionDetails?.subscription_end ? new Date(subscriptionDetails.subscription_end).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">Cycle</span>
                              <span className="text-sm font-black text-slate-700 dark:text-slate-200 capitalize italic">
                                {subscriptionDetails?.billing_cycle || 'Monthly'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">Searches</span>
                              <span className="text-sm font-black text-slate-700 dark:text-slate-200 italic">
                                {analysisCount} / {planFeatures.maxAnalyses === -1 ? '∞' : planFeatures.maxAnalyses}
                              </span>
                            </div>
                            <div className="flex items-end justify-end">
                              <Link 
                                href="/acquisition-tiers"
                                className="text-xs font-black uppercase tracking-widest flex items-center gap-1 transition-colors hover:text-white"
                                style={{ color: theme.primary }}
                              >
                                {plan === 'free' ? 'Upgrade' : 'Manage'} <ChevronRight size={12} />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Transaction History Section */}
                    <div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 italic tracking-tighter">
                          <Activity size={18} className="text-blue-500" />
                          Recent Transactions
                        </h3>
                        <div className="flex flex-wrap items-center gap-3">
                          <button 
                            onClick={async () => {
                              if (!session?.user?.email) return;
                              try {
                                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                                const profileRes = await fetch(`${apiUrl}/api/users/${session.user.email}/profile`);
                                if (profileRes.ok) {
                                  const profileData = await profileRes.json();
                                  setPayments(profileData.recent_payments || []);
                                }
                              } catch (error) {
                                console.error('Failed to refresh transactions:', error);
                              }
                            }}
                            className="text-xs font-black text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors uppercase tracking-[0.2em] flex items-center gap-2 group italic"
                          >
                            <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-500" />
                            Refresh
                          </button>
                          <button 
                            onClick={async () => {
                              if (!session?.user?.email) return;
                              try {
                                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                                const response = await fetch(`${apiUrl}/payments/download-all-receipts?email=${session.user.email}`);
                                if (response.ok) {
                                  const blob = await response.blob();
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `receipts-${Date.now()}.zip`;
                                  document.body.appendChild(a);
                                  a.click();
                                  a.remove();
                                }
                              } catch (err) {
                                console.error('Failed to download receipts', err);
                              }
                            }}
                            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-all flex items-center gap-2 group italic"
                          >
                            <FileText size={12} className="group-hover:scale-110 transition-transform" />
                            Download All
                          </button>
                        </div>
                      </div>

                      {payments.length > 0 ? (
                        <>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="border-b border-slate-200 dark:border-white/5">
                                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Invoice ID</th>
                                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Date</th>
                                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Plan</th>
                                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Amount</th>
                                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Status</th>
                                  <th className="pb-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {(showAllPayments ? payments : payments.slice(0, 3)).map((payment: any) => (
                                  <tr key={payment.id} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="py-4 font-mono text-xs text-slate-600 dark:text-slate-300 italic">{payment.razorpay_payment_id?.slice(0, 12)}...</td>
                                    <td className="py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter">{new Date(payment.payment_date).toLocaleDateString()}</td>
                                    <td className="py-4">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-slate-900 dark:text-white italic">{getProfessionalPlanName(payment.plan_name)}</span>
                                        <span className="text-[8px] font-black uppercase tracking-tighter text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50 rounded-md px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800/50">{payment.billing_cycle}</span>
                                      </div>
                                    </td>
                                    <td className="py-4 text-xs font-black text-slate-900 dark:text-white tracking-tight italic">
                                      <span className="text-blue-600 dark:text-blue-400 font-black mr-1">{payment.currency === 'INR' ? '₹' : '$'}</span>
                                      {parseFloat(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                                    </td>
                                    <td className="py-4">
                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                                        payment.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                                        'bg-red-500/10 text-red-400 border border-red-500/20'
                                      }`}>
                                        {payment.status}
                                      </span>
                                    </td>
                                    <td className="py-4 text-right">
                                      <button 
                                        onClick={() => {
                                          setSelectedPayment(payment);
                                          setIsInvoiceModalOpen(true);
                                        }}
                                        className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-all flex items-center gap-2 shadow-sm italic"
                                        title="View Professional Invoice"
                                      >
                                        <FileText size={14} />
                                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Receipt</span>
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {payments.length > 3 && (
                            <div className="mt-6 text-center">
                              <button
                                onClick={() => setShowAllPayments(!showAllPayments)}
                                className="px-6 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-all hover:bg-slate-200 dark:hover:bg-white/10 flex items-center gap-2 mx-auto italic"
                              >
                                {showAllPayments ? (
                                  <>Show Fewer Transactions <ChevronRight size={14} className="rotate-[-90deg]" /></>
                                ) : (
                                  <>+ {payments.length - 3} More Transactions <ChevronRight size={14} className="rotate-[90deg]" /></>
                                )}
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-12 bg-slate-100/50 dark:bg-white/5 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                          <CreditCard size={40} className="mx-auto mb-4 text-slate-300 dark:text-slate-600 opacity-50" />
                          <p className="text-sm font-black text-slate-500 dark:text-slate-400 italic mb-2">No transactions found</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-4">
                            {plan === 'free' ? 'Upgrade your plan to see billing history' : 'Your payment records will appear here'}
                          </p>
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button 
                              onClick={async () => {
                                if (!session?.user?.email) return;
                                try {
                                  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                                  const profileRes = await fetch(`${apiUrl}/api/users/${session.user.email}/profile`);
                                  if (profileRes.ok) {
                                    const profileData = await profileRes.json();
                                    setPayments(profileData.recent_payments || []);
                                    addNotification({
                                      type: 'system',
                                      title: 'Transactions Refreshed',
                                      message: `Found ${profileData.recent_payments?.length || 0} transaction records`,
                                      priority: 'low'
                                    });
                                  }
                                } catch (error) {
                                  console.error('Failed to refresh transactions:', error);
                                }
                              }}
                              className="px-4 py-2 bg-slate-200 dark:bg-white/10 rounded-lg text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-2"
                            >
                              <RefreshCw size={12} />
                              Refresh Transactions
                            </button>
                            {plan === 'free' && (
                              <Link 
                                href="/acquisition-tiers"
                                className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
                                style={{ 
                                  backgroundColor: `${theme.primary}20`,
                                  color: theme.primary,
                                  border: `1px solid ${theme.primary}40`
                                }}
                              >
                                <Crown size={12} />
                                Upgrade Plan
                              </Link>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Security & Access Quick View */}
                  <div className="glass-card p-6 lg:p-8 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 shadow-xl" style={{ borderColor: `${theme.primary}10` }}>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 italic tracking-tighter">
                        <ShieldCheck size={18} className="text-blue-500 dark:text-blue-400" />
                        Login History
                      </h3>
                      <button 
                        onClick={() => router.push('/profile?tab=security')}
                        className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors italic"
                      >
                        Manage All Sessions
                      </button>
                    </div>
                    <LoginHistory userEmail={session?.user?.email || ""} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      <InvoiceModal 
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        payment={selectedPayment}
        userData={{
          name: formData.name || session?.user?.name || "Premium User",
          email: session?.user?.email || "billing@trendai.com",
          company: formData.company,
          location: formData.location
        }}
      />
    </div>
  );
}