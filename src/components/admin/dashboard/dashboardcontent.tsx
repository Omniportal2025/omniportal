import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase/supabaseClient';

import {
    Users,
    Building,
    BarChart,
    TrendingUp,
    Eye,
    Bell,
    Settings,
    Sparkles,
    DollarSign,
    Banknote,
  } from 'lucide-react';
  

const DashboardContent: React.FC = () => {
  // State for property data
  const [availableLots, setAvailableLots] = useState<number>(0);
  const [soldLots, setSoldLots] = useState<number>(0);
  const [totalLots, setTotalLots] = useState<number>(0);
  const [activeAccounts, setActiveAccounts] = useState<number>(0);
  const [livingWaterStats, setLivingWaterStats] = useState<{ available: number, sold: number, total: number }>({ available: 0, sold: 0, total: 0 });
  const [havahillsStats, setHavahillsStats] = useState<{ available: number, sold: number, total: number }>({ available: 0, sold: 0, total: 0 });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    fetchLotData();
    fetchActiveAccounts();
    fetchRecentTransactions();
    fetchNotifications();
  }, []);

  const fetchLotData = async () => {
    try {
      // Fetch Living Water Subdivision lots
      const { data: livingWaterLots, error: livingWaterError } = await supabase
        .from('Living Water Subdivision')
        .select('*');

      // Fetch Havahills Estate lots
      const { data: havahillsLots, error: havahillsError } = await supabase
        .from('Havahills Estate')
        .select('*');

      if (livingWaterError) {
        console.error('Living Water Error:', livingWaterError.message);
        setLivingWaterStats({ available: 0, sold: 0, total: 0 });
      } else {
        // Living Water Stats
        const lwAvailable = livingWaterLots?.filter((lot: any) => 
          lot.Status?.toLowerCase() === 'available'
        ).length || 0;
        const lwSold = livingWaterLots?.filter((lot: any) => 
          lot.Status?.toLowerCase() === 'sold'
        ).length || 0;
        const lwTotal = livingWaterLots?.length || 0;
        
        setLivingWaterStats({ available: lwAvailable, sold: lwSold, total: lwTotal });
      }
      
      if (havahillsError) {
        console.error('Havahills Error:', havahillsError.message);
        setHavahillsStats({ available: 0, sold: 0, total: 0 });
      } else {
        // Havahills Stats
        const hhAvailable = havahillsLots?.filter((lot: any) => 
          lot.Status?.toLowerCase() === 'available'
        ).length || 0;
        const hhSold = havahillsLots?.filter((lot: any) => 
          lot.Status?.toLowerCase() === 'sold'
        ).length || 0;
        const hhTotal = havahillsLots?.length || 0;
        
        setHavahillsStats({ available: hhAvailable, sold: hhSold, total: hhTotal });
      }
      
      // Set total counts
      const totalAvailable = 
        (livingWaterError ? 0 : (livingWaterLots?.filter((lot: any) => lot.Status?.toLowerCase() === 'available').length || 0)) + 
        (havahillsError ? 0 : (havahillsLots?.filter((lot: any) => lot.Status?.toLowerCase() === 'available').length || 0));
      
      const totalSold = 
        (livingWaterError ? 0 : (livingWaterLots?.filter((lot: any) => lot.Status?.toLowerCase() === 'sold').length || 0)) + 
        (havahillsError ? 0 : (havahillsLots?.filter((lot: any) => lot.Status?.toLowerCase() === 'sold').length || 0));
      
      const totalLots = 
        (livingWaterError ? 0 : (livingWaterLots?.length || 0)) + 
        (havahillsError ? 0 : (havahillsLots?.length || 0));
      
      setAvailableLots(totalAvailable);
      setSoldLots(totalSold);
      setTotalLots(totalLots);
      
    } catch (error: any) {
      console.error('Error fetching lot data:', error?.message || 'Unknown error');
      setLivingWaterStats({ available: 0, sold: 0, total: 0 });
      setHavahillsStats({ available: 0, sold: 0, total: 0 });
      setAvailableLots(0);
      setSoldLots(0);
      setTotalLots(0);
    }
  };

  const fetchActiveAccounts = async () => {
    try {
      const { data: clients, error } = await supabase
        .from('Clients')
        .select('*');

      if (error) {
        console.error('Clients Error:', error.message);
        throw error;
      }

      // Count only clients that have an email
      const activeCount = clients?.filter((client: any) => 
        client.Email && client.Email.trim() !== ''
      ).length || 0;

      setActiveAccounts(activeCount);
    } catch (error: any) {
      console.error('Error fetching active accounts:', error?.message || 'Unknown error');
    }
  };

  const fetchRecentTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('Transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentTransactions(data || []);
    } catch (error: any) {
      console.error('Error fetching transactions:', error?.message);
      setRecentTransactions([]);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('Notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error: any) {
      console.error('Error fetching notifications:', error?.message);
      setNotifications([]);
    }
  };


  // Stats configuration with real data
  const stats = [
    {
      title: 'Available Lots',
      value: availableLots.toString(),
      change: `${((availableLots / totalLots) * 100).toFixed(1)}%`,
      trend: 'up',
      icon: Building,
      color: 'blue',
      description: 'Ready for sale'
    },
    {
      title: 'Sold Lots',
      value: soldLots.toString(),
      change: `${((soldLots / totalLots) * 100).toFixed(1)}%`,
      trend: 'up',
      icon: DollarSign,
      color: 'green',
      description: 'Completed sales'
    },
    {
      title: 'Total Properties',
      value: totalLots.toString(),
      change: `${livingWaterStats.total + havahillsStats.total}`,
      trend: 'up',
      icon: BarChart,
      color: 'yellow',
      description: 'All subdivisions'
    },
    {
      title: 'Active Clients',
      value: activeAccounts.toString(),
      change: `+${Math.floor(activeAccounts * 0.1)}`,
      trend: 'up',
      icon: Users,
      color: 'red',
      description: 'Registered accounts'
    }
  ];

  const quickActions = [
    { name: 'Add Property', icon: Building, color: 'blue', bgColor: 'bg-blue-500' },
    { name: 'View Reports', icon: BarChart, color: 'green', bgColor: 'bg-green-500' },
    { name: 'Manage Payments', icon: Banknote, color: 'yellow', bgColor: 'bg-yellow-500' },
    { name: 'Settings', icon: Settings, color: 'purple', bgColor: 'bg-purple-500' }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
      green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
      yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' },
      red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' }
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  // Format recent activities from transactions and notifications
  const recentActivities = [
    ...recentTransactions.slice(0, 3).map((transaction, index) => ({
      id: `trans-${index}`,
      type: 'Transaction',
      description: `₱${transaction.amount?.toLocaleString()} - ${transaction.description || 'Payment received'}`,
      time: new Date(transaction.created_at).toLocaleDateString(),
      status: 'success',
      avatar: '₱'
    })),
    ...notifications.slice(0, 2).map((notification, index) => ({
      id: `notif-${index}`,
      type: notification.title || 'Notification',
      description: notification.message || 'System update',
      time: new Date(notification.created_at).toLocaleDateString(),
      status: notification.type === 'success' ? 'success' : 'info',
      avatar: notification.type === 'success' ? '✓' : 'ℹ'
    })),
    // Add property-specific activities
    {
      id: 'property-1',
      type: 'New Reservation',
      description: `Living Water - Block 1, Lot ${Math.floor(Math.random() * 50) + 1}`,
      time: '2h ago',
      status: 'pending',
      avatar: 'LW'
    },
    {
      id: 'property-2',
      type: 'Sale Completed',
      description: `Havahills Estate - Premium lot sold`,
      time: '5h ago',
      status: 'success',
      avatar: 'HE'
    }
  ];

  return (
    <div className="bg-white rounded-2xl min-h-[95vh] flex flex-col overflow-hidden">
      {/* Hero Header */}
      <div className="flex-shrink-0 px-8 py-6 bg-white/80 backdrop-blur-sm rounded-2xl border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Property Dashboard
                </h1>
                <p className="text-gray-500">Welcome back, {localStorage.getItem('adminName') || 'Admin'}! Here's your property overview.</p>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <button className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all duration-200 hover:scale-105 relative">
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
            <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg hover:shadow-blue-200 hover:scale-105">
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-8 py-6 space-y-8 min-h-0">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const colors = getColorClasses(stat.color);
            return (
              <div key={index} className="group relative overflow-hidden bg-white backdrop-blur-sm rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:shadow-gray-100 hover:bg-white/80 transition-all duration-300 hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-gray-50 to-transparent rounded-full -translate-y-6 translate-x-6 opacity-50"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${colors.bg} ${colors.border} border group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`h-6 w-6 ${colors.text}`} />
                    </div>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-semibold text-green-600">
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                    <p className="text-gray-900 font-medium text-sm">{stat.title}</p>
                    <p className="text-gray-500 text-xs mt-1">{stat.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Section - Expanded to fill remaining space */}
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 flex-1 min-h-0">
          {/* Recent Activities */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-100 p-6 h-full flex flex-col hover:bg-white/80 transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recent Activities</h2>
                <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium text-sm px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors duration-200">
                  <span>View All</span>
                  <Eye className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-4 flex-1 overflow-y-auto">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold text-white ${
                        activity.status === 'success' ? 'bg-green-500' :
                        activity.status === 'pending' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`}>
                        {activity.avatar}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900 text-sm">{activity.type}</p>
                        <span className="text-xs text-gray-500">{activity.time}</span>
                      </div>
                      <p className="text-gray-600 text-sm truncate">{activity.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions & Property Stats */}
          <div className="lg:col-span-3 flex flex-col space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <button key={index} className="group flex flex-col items-center p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-solid hover:border-gray-300 hover:bg-gray-50 transition-all duration-200">
                      <div className={`p-3 rounded-full ${action.bgColor} group-hover:scale-110 transition-transform duration-200 mb-3`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 text-center">{action.name}</span>
                    </button>
                  );
                })}
              </div>
              
              {/* Featured Projects */}
              <div className="space-y-3 mb-6">
                <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">Living Water Subdivision</h3>
                      <p className="text-blue-100 text-xs">{livingWaterStats.available} lots available</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{livingWaterStats.total}</p>
                      <p className="text-xs text-blue-100">Total lots</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">Havahills Estate</h3>
                      <p className="text-emerald-100 text-xs">{havahillsStats.available} lots available</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{havahillsStats.total}</p>
                      <p className="text-xs text-emerald-100">Total lots</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Property Metrics */}
              <div className="space-y-4">
               
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;