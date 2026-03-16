"use client";

import { signIn, getSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Zap, TrendingUp, Users, Shield, Star, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import React from "react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const router = useRouter();
  const isDarkMode = theme === 'dark';

  // Ensure component is mounted before rendering theme-dependent content
  useEffect(() => {
    setMounted(true);
    
    // Check if user is already logged in
    const checkSession = async () => {
      try {
        const session = await getSession();
        if (session) {
          const urlParams = new URLSearchParams(window.location.search);
          const callbackUrl = urlParams.get('callbackUrl') || '/dashboard';
          router.push(callbackUrl);
        }
      } catch (error) {
        console.error('Session check failed:', error);
      }
    };
    
    const timeoutId = setTimeout(checkSession, 500);
    return () => clearTimeout(timeoutId);
  }, [router]);

  // Toggle theme function using next-themes
  const toggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError("");
    try {
      // Get callback URL from query params
      const urlParams = new URLSearchParams(window.location.search);
      const callbackUrl = urlParams.get('callbackUrl') || '/dashboard';
      
      // Use redirect for faster Google auth
      const result = await signIn('google', { 
        callbackUrl,
        redirect: false // Don't redirect immediately, handle it manually
      });
      
      if (result?.ok) {
        // Manual redirect for better control
        window.location.href = callbackUrl;
      } else if (result?.error) {
        setError('Google authentication failed. Please try again.');
        setLoading(false);
      }
      
    } catch (error) {
      console.error('Google authentication error:', error);
      setError('Google authentication failed. Please try again.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Fast validation with immediate feedback
    if (!formData.email.trim()) {
      setError("Email is required!");
      return;
    }
    
    if (!formData.email.includes('@')) {
      setError("Please enter a valid email address!");
      return;
    }
    
    if (!formData.password) {
      setError("Password is required!");
      return;
    }
    
    if (!isLogin) {
      if (!formData.name.trim()) {
        setError("Name is required for sign up!");
        return;
      }
      
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters long!");
        return;
      }
      
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords don't match!");
        return;
      }
    }
    
    setLoading(true);
    
    try {
      // Get callback URL from query params
      const urlParams = new URLSearchParams(window.location.search);
      const callbackUrl = urlParams.get('callbackUrl') || '/dashboard';
      
      const result = await signIn('credentials', {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        name: formData.name.trim() || undefined,
        isSignUp: (!isLogin).toString(),
        callbackUrl,
        redirect: false // Handle redirect manually for better UX
      });
      
      if (result?.error) {
        setError(`Authentication failed: ${result.error}`);
      } else if (result?.ok) {
        // Manual redirect for better control
        window.location.href = callbackUrl;
      } else {
        setError('Authentication failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      setError(`Authentication failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: <TrendingUp size={20} />, text: "Smart Market Analysis" },
    { icon: <Users size={20} />, text: "Check Competitors" },
    { icon: <Shield size={20} />, text: "Instant Market Alerts" },
    { icon: <Star size={20} />, text: "Personal Business Reports" }
  ];

  const stats = [
    { value: "$2.3M+", label: "Earnings Made" }, // Original first element
    { value: "94%", label: "Success Rate" },
    { value: "48hrs", label: "Quick Returns" }
  ];

  // Show loading screen while initializing
  if (!mounted) {
    return (
      <div className="h-screen bg-slate-50 dark:bg-[#020617] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#020617] dark:via-[#0f172a] dark:to-[#1e293b] text-slate-900 dark:text-white transition-all duration-700 overflow-hidden">
      <div className="h-screen flex">
        {/* Left Side: Login Portal */}
        <div className="flex-1 flex items-center justify-center p-6 relative">
          {/* Enhanced Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 -left-32 w-96 h-96 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-[120px] animate-pulse delay-1000" />
          </div>

          <div className="w-full max-w-sm relative z-10">
            {/* Theme Toggle Button */}
            <div className="absolute -top-2 -right-2 z-20">
              <button
                onClick={toggleTheme}
                className="w-10 h-10 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 shadow-lg hover:scale-105"
                aria-label="Toggle theme"
              >
                <AnimatePresence mode="wait">
                  {isDarkMode ? (
                    <motion.div
                      key="sun"
                      initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Sun size={18} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ rotate: 90, opacity: 0, scale: 0.8 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: -90, opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Moon size={18} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>

            {/* Logo Area */}
            <div className="text-center mb-8">
              <motion.div 
                 initial={{ scale: 0.9, opacity: 0, y: 20 }}
                 animate={{ scale: 1, opacity: 1, y: 0 }}
                 transition={{ duration: 0.6, ease: "easeOut" }}
                 className="inline-flex items-center gap-3 mb-6"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 flex items-center justify-center shadow-xl shadow-emerald-500/30 border border-emerald-400/30 relative">
                  <Zap className="text-white" size={20} fill="currentColor" />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent" />
                </div>
                <div className="text-left">
                  <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Trend<span className="text-emerald-600 dark:text-emerald-400">AI</span>
                  </span>
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Business Intelligence
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight leading-tight">
                  {isLogin ? "Welcome Back" : "Join TrendAI"}
                </h1>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                  {isLogin 
                    ? "Sign in to access your business insights" 
                    : "Create account to discover opportunities"
                  }
                </p>
              </motion.div>
            </div>

          {/* Mode Switcher */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex bg-slate-100/80 dark:bg-slate-800/50 border-2 border-slate-300/80 dark:border-slate-700/50 rounded-xl p-1.5 mb-6 shadow-lg backdrop-blur-sm"
          >
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                isLogin 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md scale-[1.02] border border-slate-200 dark:border-slate-600' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                !isLogin 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md scale-[1.02] border border-slate-200 dark:border-slate-600' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
               key={isLogin ? 'login' : 'signup'}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               transition={{ duration: 0.4 }}
               className="space-y-4"
            >
               {error && (
                 <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-xs font-medium text-center backdrop-blur-sm"
                 >
                   {error}
                 </motion.div>
               )}

               <form onSubmit={handleSubmit} className="space-y-4">
                 {!isLogin && (
                   <div className="relative group">
                     <div className="relative">
                       <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-500 transition-colors duration-200" size={16} />
                       <input
                         type="text"
                         placeholder="Full Name"
                         value={formData.name}
                         onChange={(e) => setFormData({...formData, name: e.target.value})}
                         className="w-full pl-10 pr-4 py-3 bg-white/90 dark:bg-slate-800/50 border-2 border-slate-300/80 dark:border-slate-700/50 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition-all duration-200 focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none backdrop-blur-sm shadow-sm"
                         required={!isLogin}
                         autoComplete="name"
                       />
                     </div>
                   </div>
                 )}

                 <div className="relative group">
                   <div className="relative">
                     <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-500 transition-colors duration-200" size={16} />
                     <input
                       type="email"
                       placeholder="Email Address"
                       value={formData.email}
                       onChange={(e) => setFormData({...formData, email: e.target.value})}
                       className="w-full pl-10 pr-4 py-3 bg-white/90 dark:bg-slate-800/50 border-2 border-slate-300/80 dark:border-slate-700/50 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition-all duration-200 focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none backdrop-blur-sm shadow-sm"
                       required
                       autoComplete="email"
                     />
                   </div>
                 </div>

                 <div className="relative group">
                   <div className="relative">
                     <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-500 transition-colors duration-200" size={16} />
                     <input
                       type={showPassword ? "text" : "password"}
                       placeholder="Password"
                       value={formData.password}
                       onChange={(e) => setFormData({...formData, password: e.target.value})}
                       className="w-full pl-10 pr-12 py-3 bg-white/90 dark:bg-slate-800/50 border-2 border-slate-300/80 dark:border-slate-700/50 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition-all duration-200 focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none backdrop-blur-sm shadow-sm"
                       required
                       autoComplete={isLogin ? "current-password" : "new-password"}
                     />
                     <button
                       type="button"
                       onClick={() => setShowPassword(!showPassword)}
                       className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors duration-200"
                     >
                       {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                     </button>
                   </div>
                 </div>

                 {!isLogin && (
                   <div className="relative group">
                     <div className="relative">
                       <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-500 transition-colors duration-200" size={16} />
                       <input
                         type={showPassword ? "text" : "password"}
                         placeholder="Confirm Password"
                         value={formData.confirmPassword}
                         onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                         className="w-full pl-10 pr-4 py-3 bg-white/90 dark:bg-slate-800/50 border-2 border-slate-300/80 dark:border-slate-700/50 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition-all duration-200 focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none backdrop-blur-sm shadow-sm"
                         required={!isLogin}
                         autoComplete="new-password"
                       />
                     </div>
                   </div>
                 )}

                 <button
                   type="submit"
                   disabled={loading}
                   className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-slate-400 disabled:to-slate-500 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25"
                 >
                   {loading ? (
                     <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span className="text-sm font-bold">{isLogin ? "Signing in..." : "Creating..."}</span>
                     </div>
                   ) : (
                     <div className="flex items-center gap-2">
                       <span className="text-sm font-bold">
                         {isLogin ? "Sign In" : "Create Account"}
                       </span>
                       <ArrowRight size={16} />
                     </div>
                   )}
                 </button>
               </form>

               <div className="relative py-3">
                 <div className="absolute inset-0 flex items-center">
                   <div className="w-full border-t-2 border-slate-300/80 dark:border-slate-700"></div>
                 </div>
                 <div className="relative flex justify-center text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span className="px-3 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#020617] dark:via-[#0f172a] dark:to-[#1e293b]">Or continue with</span>
                 </div>
               </div>

               {/* Google Auth */}
               <button
                 onClick={handleGoogleAuth}
                 disabled={loading}
                 className="w-full py-3 bg-white dark:bg-slate-800/50 border-2 border-slate-300/80 dark:border-slate-700/50 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all duration-200 rounded-xl flex items-center justify-center gap-3 shadow-sm backdrop-blur-sm disabled:opacity-70 disabled:cursor-not-allowed"
               >
                 <svg className="w-4 h-4" viewBox="0 0 24 24">
                   <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                   <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                   <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                   <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                 </svg>
                 <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Continue with Google</span>
               </button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

        {/* Right Side: Marketing Intelligence Display */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-slate-100 via-white to-slate-50 dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#334155] border-l border-slate-200/50 dark:border-slate-700/50 items-center justify-center p-8 transition-all duration-700">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.05),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.05),transparent_50%)]" />
        
        <div className="max-w-lg relative z-10 space-y-8">
          
          {/* Stats Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-3 gap-6"
          >
            {stats.map((stat, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                className="text-center space-y-2"
              >
                <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{stat.value}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">{stat.label}</div>
                <div className="h-0.5 w-8 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full mx-auto opacity-60" />
              </motion.div>
            ))}
          </motion.div>

          {/* Main Heading */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="space-y-4"
          >
            <h2 className="text-4xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
              Start Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">Business</span><br />
              Journey Today.
            </h2>
            <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-md">
              Our AI analyzes real market data to find profitable business opportunities in your city.
            </p>
          </motion.div>

          {/* Features List */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="space-y-3"
          >
            {features.map((feature, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                className="flex items-center gap-3 group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-emerald-500 group-hover:to-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm">
                  {React.cloneElement(feature.icon, { size: 14 })}
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-200">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Testimonial Card */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 text-slate-200 dark:text-slate-700 opacity-20 group-hover:opacity-30 transition-all duration-500">
               <Shield size={40} />
            </div>
            <div className="relative z-10">
              <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed text-sm mb-4">
                "TrendAI helped us identify a market gap we never would have found. Within 6 months, we were profitable."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs">
                  S
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">Sarah Chen</div>
                  <div className="text-[10px] font-medium text-slate-600 dark:text-slate-400">Founder, LocalTech</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
    </div>
  );
}
