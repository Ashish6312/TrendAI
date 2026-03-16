"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, DollarSign, TrendingUp, Target, Users, AlertTriangle, 
  CheckCircle, BarChart3, FileText, Lightbulb, Shield, Zap, 
  Play, Pause, Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UniformLayout from '@/components/UniformLayout';
import UniformCard from '@/components/UniformCard';

export default function BusinessPlanPage() {
  const router = useRouter();
  const [planData, setPlanData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentMonth, setCurrentMonth] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [milestoneProgress, setMilestoneProgress] = useState<number[]>([]);

  useEffect(() => {
    const storedPlan = sessionStorage.getItem('business_plan');
    if (storedPlan) {
      setPlanData(JSON.parse(storedPlan));
      const plan = JSON.parse(storedPlan);
      if (plan.plan?.monthly_milestones) {
        setMilestoneProgress(new Array(plan.plan.monthly_milestones.length).fill(0));
      }
    } else {
      router.push('/dashboard');
    }
    setLoading(false);
  }, [router]);

  // Auto-play financial projections
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && planData?.plan?.financial_projections) {
      interval = setInterval(() => {
        setCurrentMonth(prev => {
          const months = Object.keys(planData.plan.financial_projections);
          return prev >= months.length ? 1 : prev + 1;
        });
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, planData]);

  // Simulate milestone progress
  useEffect(() => {
    if (planData?.plan?.monthly_milestones) {
      const interval = setInterval(() => {
        setMilestoneProgress(prev => 
          prev.map((progress) => {
            return Math.min(100, progress + Math.random() * 5);
          })
        );
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [planData, currentMonth]);

  const tabs = [
    { 
      id: 'overview', 
      label: 'Overview', 
      icon: <Lightbulb className="w-5 h-5" />, 
      active: activeTab === 'overview',
      onClick: () => setActiveTab('overview')
    },
    { 
      id: 'financial', 
      label: 'Financial', 
      icon: <DollarSign className="w-5 h-5" />, 
      active: activeTab === 'financial',
      onClick: () => setActiveTab('financial')
    },
    { 
      id: 'marketing', 
      label: 'Marketing', 
      icon: <Target className="w-5 h-5" />, 
      active: activeTab === 'marketing',
      onClick: () => setActiveTab('marketing')
    },
    { 
      id: 'operations', 
      label: 'Operations', 
      icon: <Users className="w-5 h-5" />, 
      active: activeTab === 'operations',
      onClick: () => setActiveTab('operations')
    },
    { 
      id: 'milestones', 
      label: 'Milestones', 
      icon: <Calendar className="w-5 h-5" />, 
      active: activeTab === 'milestones',
      onClick: () => setActiveTab('milestones')
    },
    { 
      id: 'risks', 
      label: 'Risks', 
      icon: <Shield className="w-5 h-5" />, 
      active: activeTab === 'risks',
      onClick: () => setActiveTab('risks')
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 animate-pulse text-emerald-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-gray-400 text-lg">Loading business plan...</p>
        </div>
      </div>
    );
  }

  if (!planData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-gray-400 text-lg">No business plan data found</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const locationString = `${planData.area}`;

  return (
    <UniformLayout
      title={`6-Month Business Plan`}
      subtitle={planData.business?.title || 'Business Plan'}
      location={locationString}
      tabs={tabs}
      actions={
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center space-x-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white transition-colors text-sm"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>
        </div>
      }
    >
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Business Overview */}
            <UniformCard 
              title="Business Overview" 
              icon={<Building className="w-6 h-6" />}
              variant="gradient"
            >
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-slate-600 dark:text-gray-400 leading-relaxed">
                  {planData.plan?.business_overview || 'Comprehensive business plan overview...'}
                </p>
              </div>
            </UniformCard>

            {/* Market Analysis */}
            <UniformCard 
              title="Market Analysis" 
              icon={<BarChart3 className="w-6 h-6" />}
            >
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-slate-600 dark:text-gray-400 leading-relaxed">
                  {planData.plan?.market_analysis || 'Market analysis for the target location...'}
                </p>
              </div>
            </UniformCard>

            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {planData.plan?.financial_projections && Object.entries(planData.plan.financial_projections).slice(0, 4).map(([month, data]: [string, any], index) => (
                <UniformCard 
                  key={month}
                  title={`Month ${index + 1}`}
                  size="sm"
                  delay={index * 0.1}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-gray-400 text-sm">Revenue</span>
                      <span className="text-green-600 dark:text-green-400 font-bold text-sm">{data.revenue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-gray-400 text-sm">Expenses</span>
                      <span className="text-red-600 dark:text-red-400 font-bold text-sm">{data.expenses}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 dark:border-white/10 pt-2">
                      <span className="text-slate-900 dark:text-white font-medium text-sm">Profit</span>
                      <span className={`font-bold text-sm ${data.profit.includes('-') ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {data.profit}
                      </span>
                    </div>
                  </div>
                </UniformCard>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'financial' && (
          <motion.div
            key="financial"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <UniformCard 
              title="Financial Projections" 
              icon={<DollarSign className="w-6 h-6" />}
              variant="glass"
              size="lg"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Monthly Breakdown */}
                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4">6-Month Financial Breakdown</h4>
                  <div className="space-y-4">
                    {planData.plan?.financial_projections && Object.entries(planData.plan.financial_projections).map(([month, data]: [string, any], index) => (
                      <div key={month} className="p-4 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-bold text-slate-900 dark:text-white">Month {index + 1}</h5>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            data.profit.includes('-') 
                              ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' 
                              : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                          }`}>
                            {data.profit.includes('-') ? 'Loss' : 'Profit'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-slate-600 dark:text-gray-400">Revenue</p>
                            <p className="font-bold text-green-600 dark:text-green-400">{data.revenue}</p>
                          </div>
                          <div>
                            <p className="text-slate-600 dark:text-gray-400">Expenses</p>
                            <p className="font-bold text-red-600 dark:text-red-400">{data.expenses}</p>
                          </div>
                          <div>
                            <p className="text-slate-600 dark:text-gray-400">Net</p>
                            <p className={`font-bold ${data.profit.includes('-') ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                              {data.profit}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chart Placeholder */}
                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Growth Visualization</h4>
                  <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-500 dark:text-gray-500">Financial Chart</p>
                      <p className="text-xs text-slate-400 dark:text-gray-600">Interactive visualization coming soon</p>
                    </div>
                  </div>
                </div>
              </div>
            </UniformCard>
          </motion.div>
        )}

        {activeTab === 'marketing' && (
          <motion.div
            key="marketing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <UniformCard 
              title="Marketing Strategy" 
              icon={<Target className="w-6 h-6" />}
            >
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-slate-600 dark:text-gray-400 leading-relaxed">
                  {planData.plan?.marketing_strategy || 'Comprehensive marketing strategy for your business...'}
                </p>
              </div>
            </UniformCard>
          </motion.div>
        )}

        {activeTab === 'operations' && (
          <motion.div
            key="operations"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <UniformCard 
              title="Operational Plan" 
              icon={<Users className="w-6 h-6" />}
            >
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-slate-600 dark:text-gray-400 leading-relaxed">
                  {planData.plan?.operational_plan || 'Detailed operational plan and procedures...'}
                </p>
              </div>
            </UniformCard>
          </motion.div>
        )}

        {activeTab === 'milestones' && (
          <motion.div
            key="milestones"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <UniformCard 
              title="Monthly Milestones" 
              icon={<Calendar className="w-6 h-6" />}
            >
              <div className="space-y-4">
                {planData.plan?.monthly_milestones?.map((milestone: string, index: number) => (
                  <div key={index} className="flex items-start space-x-4 p-4 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
                    <div className="flex-shrink-0 w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-900 dark:text-white font-medium">{milestone}</p>
                      <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${milestoneProgress[index] || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </UniformCard>
          </motion.div>
        )}

        {activeTab === 'risks' && (
          <motion.div
            key="risks"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <UniformCard 
              title="Risk Analysis" 
              icon={<Shield className="w-6 h-6" />}
            >
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-slate-600 dark:text-gray-400 leading-relaxed">
                  {planData.plan?.risk_analysis || 'Comprehensive risk analysis and mitigation strategies...'}
                </p>
              </div>
            </UniformCard>
          </motion.div>
        )}
      </AnimatePresence>
    </UniformLayout>
  );
}