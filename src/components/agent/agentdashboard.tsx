import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, Award, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

const AgentDashboard: React.FC = () => {
  const totalSales = 4500000;
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [animatedSales, setAnimatedSales] = useState(0);

  const salesTiers = [
    { threshold: 0, allowance: 0, label: 'No Allowance' },
    { threshold: 3000000, allowance: 5000, label: 'Bronze Tier' },
    { threshold: 6000000, allowance: 10000, label: 'Silver Tier' },
    { threshold: 10000000, allowance: 20000, label: 'Gold Tier' },
  ];

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

  const getNextTier = (sales: number) => {
    for (let i = 0; i < salesTiers.length; i++) {
      if (sales < salesTiers[i].threshold) {
        return salesTiers[i];
      }
    }
    return null;
  };

  const currentTier = calculateAllowance(totalSales);
  const nextTier = getNextTier(totalSales);

  const calculateProgress = () => {
    if (!nextTier) return 100;
    const prev = currentTier.threshold;
    const next = nextTier.threshold;
    return ((totalSales - prev) / (next - prev)) * 100;
  };

  const progress = calculateProgress();
  const remainingToNextTier = nextTier ? nextTier.threshold - totalSales : 0;

  useEffect(() => {
    setTimeout(() => setAnimatedProgress(progress), 300);
    setTimeout(() => {
      const increment = totalSales / 50;
      let current = 0;
      const interval = setInterval(() => {
        current += increment;
        if (current >= totalSales) {
          setAnimatedSales(totalSales);
          clearInterval(interval);
        } else {
          setAnimatedSales(Math.floor(current));
        }
      }, 20);
    }, 100);
  }, [totalSales, progress]);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="bg-gradient-to-br from-white via-blue-50 to-sky-100 min-h-screen text-gray-800 font-sans px-6 py-8">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-wide text-sky-800">Agent Dashboard</h1>
          <p className="text-sm text-sky-600">Track your sales and progress</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>

      {nextTier && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl bg-white/60 backdrop-blur-md border border-white/30 p-6 shadow-xl"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-sky-800">Progress to Next Tier</h2>
            <span className="text-sm text-sky-600">{animatedProgress.toFixed(1)}% complete</span>
          </div>
          <div className="w-full h-4 bg-sky-100 rounded-full overflow-hidden mb-4">
            <motion.div
              className="h-full bg-gradient-to-r from-sky-400 to-blue-600 shadow-lg rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${animatedProgress}%` }}
              transition={{ duration: 1, ease: 'easeInOut' }}
            ></motion.div>
          </div>
          <div className="flex justify-between text-sm text-sky-700">
            <span>₱{totalSales.toLocaleString()}</span>
            <span>₱{nextTier.threshold.toLocaleString()} ({nextTier.label})</span>
          </div>
          <p className="text-sm text-sky-600 mt-2">
            ₱{remainingToNextTier.toLocaleString()} remaining to reach <span className="font-semibold">{nextTier.label}</span>
          </p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-white/30 shadow-md"
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="text-blue-600" />
          </div>
          <p className="text-sm text-sky-600">Total Sales</p>
          <p className="text-2xl font-bold text-sky-900">₱{animatedSales.toLocaleString()}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-white/30 shadow-md"
        >
          <div className="flex items-center justify-between mb-2">
            <Award className="text-green-600" />
          </div>
          <p className="text-sm text-sky-600">Current Allowance</p>
          <p className="text-2xl font-bold text-green-700">₱{currentTier.allowance.toLocaleString()}</p>
          <p className="text-xs text-green-500">{currentTier.label}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-white/30 shadow-md"
        >
          <div className="flex items-center justify-between mb-2">
            <Target className="text-orange-500" />
          </div>
          <p className="text-sm text-sky-600">Next Target</p>
          {nextTier ? (
            <>
              <p className="text-2xl font-bold text-orange-600">₱{nextTier.threshold.toLocaleString()}</p>
              <p className="text-xs text-orange-400">{nextTier.label}</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-sky-800">Max Tier</p>
              <p className="text-xs text-sky-500">Gold Achieved</p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AgentDashboard;
