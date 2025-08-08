import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, Award, LogOut } from 'lucide-react';

const AgentDashboard: React.FC = () => {
  // Demo value - replace with your actual totalSales data
  const totalSales = 4500000; // Example: 4.5M PHP
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [animatedSales, setAnimatedSales] = useState(0);

  // Sales tiers and allowances
  const salesTiers = [
    { threshold: 0, allowance: 0, label: "No Allowance" },
    { threshold: 3000000, allowance: 5000, label: "Bronze Tier" },
    { threshold: 6000000, allowance: 10000, label: "Silver Tier" },
    { threshold: 10000000, allowance: 20000, label: "Gold Tier" }
  ];

  // Calculate current allowance based on sales
  const calculateAllowance = (sales: number) => {
    let currentTier = salesTiers[0];
    for (let i = salesTiers.length - 1; i >= 0; i--) {
      if (sales >= salesTiers[i].threshold) {
        currentTier = salesTiers[i];
        break;
      }
    }
    return currentTier;
  };

  // Get next tier information
  const getNextTier = (sales: number) => {
    for (let i = 0; i < salesTiers.length; i++) {
      if (sales < salesTiers[i].threshold) {
        return salesTiers[i];
      }
    }
    return null; // Already at highest tier
  };

  const currentTier = calculateAllowance(totalSales);
  const nextTier = getNextTier(totalSales);
  
  // Calculate progress to next tier
  const calculateProgress = () => {
    if (!nextTier) return 100; // At max tier
    
    const previousThreshold = currentTier.threshold;
    const nextThreshold = nextTier.threshold;
    const progress = ((totalSales - previousThreshold) / (nextThreshold - previousThreshold)) * 100;
    
    return Math.min(Math.max(progress, 0), 100);
  };

  const progress = calculateProgress();
  const remainingToNextTier = nextTier ? nextTier.threshold - totalSales : 0;

  // Animation effects
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 300);

    const timer2 = setTimeout(() => {
      const increment = totalSales / 50;
      let current = 0;
      const counter = setInterval(() => {
        current += increment;
        if (current >= totalSales) {
          setAnimatedSales(totalSales);
          clearInterval(counter);
        } else {
          setAnimatedSales(Math.floor(current));
        }
      }, 20);
    }, 100);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [totalSales, progress]);

  const handleLogout = () => {
    // Remove authentication tokens or user info
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login';
  };  
  
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Enhanced Header with Logout */}
      <div className="bg-white border-b border-gray-100 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agent Dashboard</h1>
            <p className="text-gray-500 text-sm">Track your sales performance and allowance tiers</p>
          </div>
          
          {/* User Info & Logout */}
          <div className="flex items-center space-x-4">
            
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {      /* Main Content */}
      <div className="px-8 py-6 space-y-6">
        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%) skewX(-12deg); }
            100% { transform: translateX(200%) skewX(-12deg); }
          }
          .animate-shimmer {
            animation: shimmer 2s ease-in-out infinite;
          }
        `}</style>
        
        {/* Enhanced Animated Progress Section */}
        {nextTier && (
          <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Progress to Next Tier</h2>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 font-medium">Active</span>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Progress Header */}
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {currentTier.label}
                  </span>
                  <div className="flex items-center space-x-2 text-gray-400">
                    <div className="w-8 h-0.5 bg-gray-300"></div>
                    <Target className="h-4 w-4" />
                    <div className="w-8 h-0.5 bg-gray-300"></div>
                  </div>
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                    {nextTier.label}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-blue-600">{animatedProgress.toFixed(1)}%</span>
                  <p className="text-xs text-gray-500">Complete</p>
                </div>
              </div>
              
              {/* Enhanced Animated Progress Bar */}
              <div className="relative">
                <div className="w-full bg-gray-100 rounded-full h-5 shadow-inner border border-gray-200">
                  <div 
                    className="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 h-5 rounded-full transition-all duration-2000 ease-in-out relative overflow-hidden shadow-md"
                    style={{ width: `${animatedProgress}%` }}
                  >
                    {/* Multiple shine effects */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-40 -skew-x-12 animate-shimmer"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-300 to-blue-400 opacity-50 animate-pulse"></div>
                    {/* Progress glow */}
                    <div className="absolute inset-0 rounded-full shadow-lg shadow-blue-400/50"></div>
                  </div>
                  {/* Progress track markers */}
                  <div className="absolute top-1 left-0 right-0 flex justify-between px-2">
                    <div className="w-1 h-3 bg-white/30 rounded-full"></div>
                    <div className="w-1 h-3 bg-white/30 rounded-full"></div>
                    <div className="w-1 h-3 bg-white/30 rounded-full"></div>
                    <div className="w-1 h-3 bg-white/30 rounded-full"></div>
                  </div>
                </div>
                
                {/* Progress markers */}
                <div className="flex justify-between mt-3 text-sm">
                  <span className="text-blue-600 font-semibold">₱{totalSales.toLocaleString()}</span>
                  <span className="text-orange-600 font-semibold">₱{nextTier.threshold.toLocaleString()}</span>
                </div>
              </div>
              
              {/* Progress Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-blue-200 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-blue-700" />
                    </div>
                    <h3 className="font-semibold text-blue-900">Current Progress</h3>
                  </div>
                  <p className="text-2xl font-bold text-blue-700 mb-1">
                    ₱{(totalSales - currentTier.threshold).toLocaleString()}
                  </p>
                  <p className="text-sm text-blue-600">Above current tier minimum</p>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-orange-200 rounded-lg">
                      <Target className="h-5 w-5 text-orange-700" />
                    </div>
                    <h3 className="font-semibold text-orange-900">Remaining Target</h3>
                  </div>
                  <p className="text-2xl font-bold text-orange-700 mb-1">
                    ₱{remainingToNextTier.toLocaleString()}
                  </p>
                  <p className="text-sm text-orange-600">To reach {nextTier.label}</p>
                </div>
              </div>
              
              {/* Reward Preview */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-200 rounded-xl">
                      <Award className="h-6 w-6 text-green-700" />
                    </div>
                    <div>
                      <h3 className="font-bold text-green-900 text-lg">Next Tier Reward</h3>
                      <p className="text-green-700">
                        Reach <span className="font-semibold">{nextTier.label}</span> to unlock
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-600">
                      ₱{nextTier.allowance.toLocaleString()}
                    </p>
                    <p className="text-sm text-green-600">Monthly Allowance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Sales */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">₱{animatedSales.toLocaleString()}</p>
            </div>
          </div>

          {/* Current Allowance */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-50 rounded-lg">
                <Award className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Current Allowance</p>
              <p className="text-2xl font-bold text-gray-900">₱{currentTier.allowance.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1">{currentTier.label}</p>
            </div>
          </div>

          {/* Next Target */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Target className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Next Target</p>
              {nextTier ? (
                <>
                  <p className="text-2xl font-bold text-gray-900">₱{nextTier.threshold.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-1">{nextTier.label}</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-gray-900">Max Tier</p>
                  <p className="text-xs text-gray-400 mt-1">Gold Achieved</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;