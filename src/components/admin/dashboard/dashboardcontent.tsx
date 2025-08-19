import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase/supabaseClient';

import {
    Users,
    Building,
    BarChart,
    TrendingUp,
    Sparkles,
    DollarSign,
    Trophy, 
    Crown,
    Medal,
    Calendar,
    ArrowUp,
  } from 'lucide-react';
  

const DashboardContent: React.FC = () => {
  // State for property data
  const [availableLots, setAvailableLots] = useState<number>(0);
  const [soldLots, setSoldLots] = useState<number>(0);
  const [totalLots, setTotalLots] = useState<number>(0);
  const [activeAccounts, setActiveAccounts] = useState<number>(0);
  const [livingWaterStats, setLivingWaterStats] = useState<{ available: number, sold: number, total: number }>({ available: 0, sold: 0, total: 0 });
  const [havahillsStats, setHavahillsStats] = useState<{ available: number, sold: number, total: number }>({ available: 0, sold: 0, total: 0 });
  
  // State for leaderboard and payments
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  // Define LeaderboardAgent interface
  interface LeaderboardAgent {
    fullname: string;
    totalSales: number;
    salesCount: number;
    rank: number;
  }

  useEffect(() => {
    fetchLotData();
    fetchActiveAccounts();
    fetchLeaderboardData();
    fetchRecentPayments();
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

  const fetchLeaderboardData = async () => {
    try {
      // Get all agents first
      const { data: agents, error: agentsError } = await supabase
        .from('Agents')
        .select('fullname, email, status')
        .eq('status', 'active');

      if (agentsError) {
        console.error('Error fetching agents:', agentsError);
        return;
      }

      if (!agents || agents.length === 0) {
        console.log('No active agents found');
        setTopPerformers([]);
        return;
      }

      // Get sales data for all agents
      const { data: salesData, error: salesError } = await supabase
        .from('Sales')
        .select('sellersname, TCP')
        .eq('Status', 'confirmed');

      if (salesError) {
        console.error('Error fetching sales data for leaderboard:', salesError);
        return;
      }

      // Calculate totals for each agent
      const agentSales: { [key: string]: { total: number; count: number } } = {};

      // Initialize all active agents with 0 sales
      agents.forEach(agent => {
        agentSales[agent.fullname] = { total: 0, count: 0 };
      });

      // Calculate actual sales
      if (salesData && salesData.length > 0) {
        console.log('Sales data sample:', salesData[0]); // Debug log
        salesData.forEach(sale => {
          if (agentSales[sale.sellersname]) {
            const tcp = parseFloat(sale.TCP || '0');
            console.log(`Processing sale: ${sale.sellersname}, TCP: ${sale.TCP}, Parsed: ${tcp}`); // Debug log
            if (!isNaN(tcp)) {
              agentSales[sale.sellersname].total += tcp;
              agentSales[sale.sellersname].count += 1;
            }
          }
        });
      }

      // Convert to leaderboard format and sort
      const leaderboardData: LeaderboardAgent[] = Object.entries(agentSales)
        .map(([fullname, data]) => ({
          fullname,
          totalSales: data.total,
          salesCount: data.count,
          rank: 0
        }))
        .sort((a, b) => b.totalSales - a.totalSales)
        .map((agent, index) => ({
          ...agent,
          rank: index + 1
        }));

      console.log('Leaderboard data:', leaderboardData);
      
      // Take only top 5 performers for the dashboard
      setTopPerformers(leaderboardData.slice(0, 5));

    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    }
  };

  const fetchRecentPayments = async () => {
    try {
      const { data: payments, error } = await supabase
        .from('Payment')
        .select('Name, Project, "Payment Amount", "Month of Payment", Status, created_at')
        .order('created_at', { ascending: false })
        .limit(15); // Increased limit for more data

      if (error) {
        console.error('Error fetching payment data:', error);
        return;
      }

      console.log('Payment data:', payments); // Debug log
      setRecentPayments(payments || []);
    } catch (error) {
      console.error('Error fetching payment data:', error);
      setRecentPayments([]);
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

  const getColorClasses = (color: string) => {
    const colors = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
      green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
      yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' },
      red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' }
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getLeaderboardIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown className="h-5 w-5 text-yellow-500" />;
      case 1: return <Medal className="h-5 w-5 text-gray-400" />;
      case 2: return <Trophy className="h-5 w-5 text-amber-600" />;
      default: return <span className="text-sm font-bold text-gray-500">#{index + 1}</span>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-2xl h-[94vh] flex flex-col overflow-hidden">
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
                <p className="text-gray-500">Welcome back, Admin! Here's your property overview.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-8 py-6 space-y-6 min-h-0 overflow-y-auto">
        {/* Top Section: Stats Grid + Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side: Stats Grid (2x2) */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>

          {/* Right Side: Leaderboard */}
          <div className="lg:col-span-1">
            <div className="bg-white backdrop-blur-sm rounded-2xl border border-gray-100 p-6 h-full">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Leaderboard</h2>
              </div>
              <div className="space-y-4">
                {topPerformers.length > 0 ? (
                  topPerformers.map((performer, index) => {
                    // Debug logging
                    console.log('Performer data:', performer);
                    
                    const salesAmount = performer.totalSales || 0;
                    const salesCount = performer.salesCount || 0;
                    const agentName = performer.fullname || 'Unknown Agent';
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {getLeaderboardIcon(index)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{agentName}</p>
                            <p className="text-xs text-gray-500">{salesCount} sales</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm text-gray-900">
                            {salesAmount >= 1000000 
                              ? `₱${(salesAmount / 1000000).toFixed(1)}M` 
                              : salesAmount >= 1000 
                              ? `₱${(salesAmount / 1000).toFixed(0)}K`
                              : salesAmount > 0 
                              ? `₱${salesAmount.toLocaleString()}`
                              : '₱0'}
                          </p>
                          <div className="flex items-center space-x-1">
                            <ArrowUp className="h-3 w-3 text-green-500" />
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">
                      <Trophy className="h-12 w-12 mx-auto opacity-50" />
                    </div>
                    <p className="text-gray-500 text-sm">No sales data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Enhanced Payment Table */}
        <div className="flex-1 bg-white backdrop-blur-sm rounded-2xl border border-gray-100 flex flex-col min-h-0">
          {/* Table Header */}
          <div className="flex-shrink-0 px-6 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">PAYMENT TABLE</h2>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>Recent Transactions</span>
              </div>
            </div>
          </div>
          
          {/* Table Content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <div className="h-full overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 bg-gray-50/50">Client</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 bg-gray-50/50">Project</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 bg-gray-50/50">Amount</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 bg-gray-50/50">Month</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 bg-gray-50/50">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.length > 0 ? (
                    recentPayments.slice(0, 4).map((payment, index) => (
                      <tr key={index} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors duration-200">
                        <td className="py-5 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                              {(payment.Name || 'N').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{payment.Name || 'N/A'}</div>
                              <div className="text-xs text-gray-500">Client</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="text-gray-700 font-medium">{payment.Project || 'N/A'}</div>
                          <div className="text-xs text-gray-500 mt-1">Property Project</div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="font-bold text-gray-900 text-lg">
                            ₱{payment['Payment Amount'] ? parseFloat(payment['Payment Amount']).toLocaleString() : '0'}
                          </div>
                          <div className="text-xs text-gray-500">Payment</div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="text-gray-700 font-medium">{payment['Month of Payment'] || 'N/A'}</div>
                          <div className="text-xs text-gray-500">Period</div>
                        </td>
                        <td className="py-5 px-6">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(payment.Status || 'unknown')}`}>
                            {payment.Status || 'Unknown'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <div className="flex flex-col items-center space-y-3">
                          <div className="text-gray-400">
                            <DollarSign className="h-12 w-12 mx-auto opacity-50" />
                          </div>
                          <p className="text-gray-500 text-sm">No payment data available</p>
                          <p className="text-gray-400 text-xs">Payment records will appear here once available</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;