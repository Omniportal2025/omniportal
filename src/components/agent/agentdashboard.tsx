import { useState, useEffect } from 'react';
import { TrendingUp, Target, Award, LogOut, Plus, DollarSign, Users, Building2, Upload, ChevronDown, Trophy, Crown, Medal} from 'lucide-react';
import { supabase} from '../../supabase/supabaseClient'; 
import toast from 'react-hot-toast';

interface LeaderboardAgent {
  fullname: string;
  totalSales: number;
  salesCount: number;
  rank: number;
}

const AgentDashboard = () => {
  const [totalSales, setTotalSales] = useState(0); // Changed from 4500000 to 0
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [animatedSales, setAnimatedSales] = useState(0);
  const [showAddSaleModal, setShowAddSaleModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const [userFullName, setUserFullName] = useState<string>('');
  const [buyerName, setBuyerName] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState('');
  const [unitDetails, setUnitDetails] = useState('');
  const [projectDeveloper, setProjectDeveloper] = useState('');
  const [reservationDate, setReservationDate] = useState('');
  const [tcp, setTcp] = useState('');
  const [reservationReceipt, setReservationReceipt] = useState<File | null>(null);
  const [additionalReceipt, setAdditionalReceipt] = useState<File | null>(null);
  const [leaderboardAgents, setLeaderboardAgents] = useState<LeaderboardAgent[]>([]);

  const salesTiers = [
    { threshold: 0, allowance: 0, label: 'No Allowance' },
    { threshold: 3000000, allowance: 5000, label: 'Bronze Tier' },
    { threshold: 6000000, allowance: 10000, label: 'Silver Tier' },
    { threshold: 10000000, allowance: 20000, label: 'Gold Tier' },
  ];

  // Add function to get current user and verify against Agents table
  const getCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Error getting user:', error);
        toast.error('Error getting user information');
        return null;
      }

      if (user) {
        console.log('Current user from auth:', user);
        
        // Check if user exists in Agents table
        const { data: agentData, error: agentError } = await supabase
          .from('Agents')
          .select('fullname, email, status')
          .eq('email', user.email)
          .single();

        if (agentError) {
          console.error('Error fetching agent data:', agentError);
          toast.error('Agent not found in system. Please contact administrator.');
          return null;
        }

        if (!agentData) {
          toast.error('Agent not found in system. Please contact administrator.');
          return null;
        }

        // Check if agent is active
        if (agentData.status !== 'active') {
          toast.error('Your agent account is not active. Please contact administrator.');
          return null;
        }

        console.log('Agent data found:', agentData);
        
        setUserFullName(agentData.fullname);
        
        return agentData.fullname; // Return the fullname from Agents table
      }
      
      return null;
    } catch (err) {
      console.error('Error fetching user:', err);
      toast.error('Failed to get user information');
      return null;
    }
  };

  // Add function to fetch sales data from database
  const fetchSalesData = async (agentFullName?: string) => {
    try {
      setIsLoading(true);
      
      if (!agentFullName) {
        console.log('No agent full name provided');
        setTotalSales(0);
        return;
      }

      console.log('Fetching sales for agent:', agentFullName);

      // Query Sales table using exact match with the fullname from Agents table
      const { data, error } = await supabase
        .from('Sales')
        .select('TCP, sellersname, Status, created_at')
        .eq('Status', 'confirmed') // Only count approved sales
        .eq('sellersname', agentFullName); // Exact match with agent's fullname

      if (error) {
        console.error('Error fetching sales data:', error);
        toast.error('Error loading sales data');
        return;
      }

      console.log('Sales data fetched:', data);
      console.log('Number of approved sales found:', data?.length || 0);

      // Calculate total sales from database for this specific agent
      const total = data?.reduce((sum, sale) => {
        const tcp = parseFloat(sale.TCP || 0);
        console.log(`Adding TCP: ₱${tcp.toLocaleString()} from sale on ${sale.created_at}`);
        return sum + tcp;
      }, 0) || 0;
      
      console.log('Total sales calculated:', `₱${total.toLocaleString()}`);
      setTotalSales(total);
      
      // Show summary
      if (data && data.length > 0) {
        toast.success(`Found ${data.length} approved sale${data.length > 1 ? 's' : ''} totaling ₱${total.toLocaleString()}`);
      } else {
        console.log('No approved sales found for agent:', agentFullName);
      }
      
    } catch (err) {
      console.error('Error fetching sales:', err);
      toast.error('Failed to load sales data');
    } finally {
      setIsLoading(false);
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
        salesData.forEach(sale => {
          if (agentSales[sale.sellersname]) {
            const tcp = parseFloat(sale.TCP || 0);
            agentSales[sale.sellersname].total += tcp;
            agentSales[sale.sellersname].count += 1;
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
      setLeaderboardAgents(leaderboardData);
  
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    }
  };

  // Fetch sales data on component mount
  useEffect(() => {
    const initializeDashboard = async () => {
      const agentFullName = await getCurrentUser();
      if (agentFullName) {
        await Promise.all([
          fetchSalesData(agentFullName),
          fetchLeaderboardData() // ADD THIS LINE
        ]);
      } else {
        // If no valid agent found, redirect to login
        toast.error('Please log in with a valid agent account');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    };
  
    initializeDashboard();
  }, []);

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

  const resetForm = () => {
    setBuyerName('');
    setSellerName('');
    setProjectName('');
    setProjectType('');
    setUnitDetails('');
    setProjectDeveloper('');
    setReservationDate('');
    setTcp('');
    setReservationReceipt(null);
    setAdditionalReceipt(null);
  };

  const handleAddSale = async () => {
    const amount = parseFloat(tcp);
    
    // Validate required fields
    if (!amount || amount <= 0 || !buyerName || !sellerName || !projectName || !projectType || !unitDetails || !projectDeveloper || !reservationDate) {
      toast.error('Please fill in all required fields');
      return;
    }
  
    // Create loading toast once
    const loadingToastId = toast.loading('Uploading sale information...');
  
    try {
      let reservationURL = null;
      let receiptURL = null;
  
      // 1. Upload reservation receipt to ReservationReceipt bucket
      if (reservationReceipt) {
        const fileExt = reservationReceipt.name.split('.').pop() || '';
        const timestamp = new Date().getTime();
        const fileName = `${sellerName.trim()}_reservation_${timestamp}.${fileExt}`;
        const filePath = `${projectName}/${sellerName.trim()}/${fileName}`;
  
        const { error: uploadError, data } = await supabase.storage
          .from('ReservationReceipt')
          .upload(filePath, reservationReceipt, { upsert: true });
  
        if (uploadError) {
          console.error('Reservation receipt upload error:', uploadError);
          throw new Error(`Failed to upload reservation receipt: ${uploadError.message}`);
        }
  
        if (!data?.path) {
          throw new Error('No file path returned from reservation receipt upload');
        }
  
        reservationURL = data.path;
      }
  
      // 2. Upload additional receipt to SalesReceipt bucket
      if (additionalReceipt) {
        const fileExt = additionalReceipt.name.split('.').pop() || '';
        const timestamp = new Date().getTime();
        const fileName = `${sellerName.trim()}_sales_${timestamp}.${fileExt}`; 
        const filePath = `${projectName}/${sellerName.trim()}/${fileName}`;
  
        const { error: uploadError, data } = await supabase.storage
          .from('SalesReceipt')
          .upload(filePath, additionalReceipt, { upsert: true });
  
        if (uploadError) {
          console.error('Sales receipt upload error:', uploadError);
          throw new Error(`Failed to upload sales receipt: ${uploadError.message}`);
        }
  
        if (!data?.path) {
          throw new Error('No file path returned from sales receipt upload');
        }
  
        receiptURL = data.path;
      }
  
      // Update the existing toast
      toast.success('Files uploaded! Saving sale details...', { id: loadingToastId });
      
      // Create a new loading toast for the database operation
      const dbLoadingToastId = toast.loading('Saving sale details...');
  
      // 3. Save to Sales table
      const saleData = {
        sellersname: sellerName,
        buyersname: buyerName,
        projecttype: projectType,
        phaseblocklotunit: unitDetails,
        projectdeveloper: projectDeveloper,
        reservationdate: new Date(reservationDate).toISOString().split('T')[0], // Convert to YYYY-MM-DD format for Date type
        TCP: tcp,
        reservationURL: reservationURL,
        receiptURL: receiptURL,
        Status: 'pending',
        created_at: new Date().toISOString()
      };
  
      const { error: dbError } = await supabase
        .from('Sales')
        .insert(saleData);
  
      if (dbError) {
        // Dismiss the database loading toast before showing error
        toast.dismiss(dbLoadingToastId);
        throw new Error(`Error saving sale information: ${dbError.message}`);
      }
  
      // Success - dismiss loading toast and show success
      toast.dismiss(dbLoadingToastId);
      toast.success('Sale added successfully!');
      
      // Refresh sales data from database instead of just adding to state
      await fetchSalesData(userFullName);
      await fetchLeaderboardData();
      resetForm();
      setShowAddSaleModal(false);
  
    } catch (err: any) {
      console.error('Error adding sale:', err);
      toast.error(err.message, { id: loadingToastId });
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        toast.error('Error signing out');
      } else {
        toast.success('Logged out successfully');
        window.location.href = '/login';
      }
    } catch (err) {
      console.error('Error during logout:', err);
      toast.error('Error during logout');
      // Still redirect even if there's an error
      window.location.href = '/login';
    }
  };

  

  
useEffect(() => {
  // Initialize seller name with user's full name if not already set
  if (userFullName && !sellerName) {
    setSellerName(userFullName);
  }

  setTimeout(() => setAnimatedProgress(progress), 300);
  setTimeout(() => {
    const increment = totalSales / 50;
    let current = animatedSales;
    const targetSales = totalSales;
    
    if (current < targetSales) {
      const interval = setInterval(() => {
        current += increment;
        if (current >= targetSales) {
          setAnimatedSales(targetSales);
          clearInterval(interval);
        } else {
          setAnimatedSales(Math.floor(current));
        }
      }, 20);
    }
  }, 100);
}, [totalSales, progress, userFullName, sellerName]);

    // Show loading state while fetching data
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-white via-blue-50 to-sky-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-sky-600">Verifying agent account...</p>
          <p className="text-sm text-sky-500 mt-2">Checking Agents table and loading sales data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white via-blue-50 to-sky-100 min-h-screen text-gray-800 font-sans px-6 py-8">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-wide text-sky-800">Agent Dashboard</h1>
          <p className="text-sm text-sky-600">
            Welcome back, {userFullName || 'Agent'}! Track your sales and progress
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddSaleModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-medium shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline text-sm tracking-wide">Add Sale</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-medium shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline text-sm tracking-wide">Logout</span>
          </button>
        </div>
      </div>

      {/* Progress Card */}
      {nextTier && (
        <div className="rounded-2xl bg-white/60 backdrop-blur-md border border-white/30 p-6 shadow-xl mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-sky-800">Progress to Next Tier</h2>
            <span className="text-sm text-sky-600">{animatedProgress.toFixed(1)}% complete</span>
          </div>
          <div className="w-full h-4 bg-sky-100 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-blue-600 shadow-lg rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${animatedProgress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-sky-700">
            <span>₱{totalSales.toLocaleString()}</span>
            <span>₱{nextTier.threshold.toLocaleString()} ({nextTier.label})</span>
          </div>
          <p className="text-sm text-sky-600 mt-2">
            ₱{remainingToNextTier.toLocaleString()} remaining to reach <span className="font-semibold">{nextTier.label}</span>
          </p>
        </div>
      )}

      {/* Leaderboard Card */}
      <div className="rounded-2xl bg-white/60 backdrop-blur-md border border-white/30 p-6 shadow-xl mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-sky-800 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top Performers
          </h2>
          <span className="text-sm text-sky-600">Based on confirmed sales</span>
        </div>

        {leaderboardAgents.length > 0 ? (
          <div className="space-y-4">
            {/* Top 3 with special styling */}
            {leaderboardAgents.slice(0, 3).map((agent, index) => {
              const isCurrentUser = agent.fullname === userFullName;
              const icons = [
                <Crown className="h-6 w-6 text-yellow-500" key="crown" />,
                <Medal className="h-6 w-6 text-gray-400" key="silver" />,
                <Medal className="h-6 w-6 text-amber-600" key="bronze" />
              ];
              const bgColors = [
                'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200',
                'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200',
                'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
              ];
              
              return (
                <div
                  key={agent.fullname}
                  className={`p-4 rounded-xl border-2 transition-all ${bgColors[index]} ${
                    isCurrentUser ? 'ring-2 ring-sky-400 ring-offset-2' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm">
                        {icons[index]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-lg ${isCurrentUser ? 'text-sky-800' : 'text-gray-800'}`}>
                            {isCurrentUser ? 'You' : agent.fullname}
                          </span>
                          {isCurrentUser && (
                            <span className="px-2 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-medium">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {agent.salesCount} sale{agent.salesCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xl text-gray-900">
                        ₱{agent.totalSales.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">#{agent.rank}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Rest of the agents (if user is not in top 3) */}
            {leaderboardAgents.length > 3 && (
              <div className="pt-4 border-t border-sky-100">
                {leaderboardAgents.slice(3).map((agent) => {
                  const isCurrentUser = agent.fullname === userFullName;
                  if (!isCurrentUser) return null; // Only show current user if they're not in top 3
                  
                  return (
                    <div
                      key={agent.fullname}
                      className="p-3 rounded-lg bg-sky-50 border border-sky-200 ring-2 ring-sky-400 ring-offset-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-sky-200 flex items-center justify-center">
                            <span className="font-bold text-sky-700">#{agent.rank}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sky-800">You</span>
                              <span className="px-2 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-medium">
                                You
                              </span>
                            </div>
                            <p className="text-sm text-sky-600">
                              {agent.salesCount} sale{agent.salesCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-sky-900">
                            ₱{agent.totalSales.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Show message if no sales yet */}
            {leaderboardAgents.every(agent => agent.totalSales === 0) && (
              <div className="text-center py-8 text-gray-500">
                <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p>No confirmed sales yet. Be the first to make a sale!</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
            <p className="mt-3">Loading leaderboard...</p>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-white/30 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="text-blue-600" />
          </div>
          <p className="text-sm text-sky-600">Total Sales</p>
          <p className="text-2xl font-bold text-sky-900">₱{animatedSales.toLocaleString()}</p>
        </div>

        <div className="bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-white/30 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <Award className="text-green-600" />
          </div>
          <p className="text-sm text-sky-600">Current Allowance</p>
          <p className="text-2xl font-bold text-green-700">₱{currentTier.allowance.toLocaleString()}</p>
          <p className="text-xs text-green-500">{currentTier.label}</p>
        </div>

        <div className="bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-white/30 shadow-md">
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
        </div>
      </div>

      {/* Enhanced Add Sale Modal - Mobile Responsive with Required Field Indicators */}
      {showAddSaleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-4xl h-full sm:h-auto sm:max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-4 sm:px-8 py-4 sm:py-6 border-b border-sky-100/50 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-2xl font-bold text-gray-900">Add New Sale</h3>
                    <p className="text-xs sm:text-sm text-gray-500">Fill in the details below</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAddSaleModal(false);
                    resetForm();
                  }}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <span className="text-gray-400 text-lg sm:text-xl">×</span>
                </button>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 sm:px-8 py-4 sm:py-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                  {/* Left Column - Basic Info */}
                  <div className="space-y-4 sm:space-y-6">
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-emerald-100">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                        <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                        Financial Details
                      </h4>
                      
                      {/* TCP */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Total Contract Price (₱) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={tcp}
                          onChange={(e) => setTcp(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none transition-all text-base sm:text-lg font-semibold"
                        />
                      </div>
                    </div>

                    {/* Client Information */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-100">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        Client Information
                      </h4>

                      <div>
                      <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                        <span>
                          Seller's Name <span className="text-red-500">*</span>
                        </span>
                        <p className="text-xs text-gray-500">
                          Logged in as: <span className="font-semibold text-blue-600">{userFullName}</span>
                        </p>
                      </label>
                        <input
                          type="text"
                          value={sellerName || userFullName || ""}
                          onChange={(e) => setSellerName(e.target.value)}
                          placeholder="Enter seller's full name"
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                      
                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Buyer's Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={buyerName}
                            onChange={(e) => setBuyerName(e.target.value)}
                            placeholder="Enter buyer's full name"
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Property Info */}
                  <div className="space-y-4 sm:space-y-6">
                    {/* Property Details */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-purple-100">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                        <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                        Property Details
                      </h4>
                      
                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Project Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="Enter project name"
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition-all"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Project Type <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <select
                                value={projectType}
                                onChange={(e) => setProjectType(e.target.value)}
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition-all appearance-none"
                              >
                                <option value="">Select type</option>
                                <option value="house-and-lot">House & Lot</option>
                                <option value="condo">Condominium</option>
                                <option value="lot-only">Lot Only</option>
                                <option value="parking-lot">Parking Lot</option>
                              </select>
                              <ChevronDown className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5 pointer-events-none" />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Reservation Date <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              value={reservationDate}
                              onChange={(e) => setReservationDate(e.target.value)}
                              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition-all"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Unit Details <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={unitDetails}
                            onChange={(e) => setUnitDetails(e.target.value)}
                            placeholder="Phase 1, Block 2, Lot 15 or Unit 204"
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Project Developer <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={projectDeveloper}
                            onChange={(e) => setProjectDeveloper(e.target.value)}
                            placeholder="Enter developer name"
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Documents */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-amber-100 w-full max-w-2xl mx-auto">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                        <Upload className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                        Documents
                      </h4>
                      
                      <div className="space-y-3 sm:space-y-4">
                        {/* Reservation Receipt */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Reservation Receipt</label>
                          <div className="relative border-2 border-dashed border-amber-200 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:border-amber-300 transition-colors bg-white/50">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => setReservationReceipt(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="text-center">
                              <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-amber-400 mx-auto mb-2" />
                              <p className="text-xs sm:text-sm text-gray-600">
                                {reservationReceipt ? (
                                  <span className="text-amber-600 font-medium break-all">{reservationReceipt.name}</span>
                                ) : (
                                  'Click to upload receipt'
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Additional Receipt */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Additional Receipt</label>
                          <div className="relative border-2 border-dashed border-amber-200 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:border-amber-300 transition-colors bg-white/50">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => setAdditionalReceipt(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="text-center">
                              <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-amber-400 mx-auto mb-2" />
                              <p className="text-xs sm:text-sm text-gray-600">
                                {additionalReceipt ? (
                                  <span className="text-amber-600 font-medium break-all">{additionalReceipt.name}</span>
                                ) : (
                                  'Click to upload receipt'
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer - Fixed at bottom */}
            <div className="bg-gray-50/50 px-4 sm:px-8 py-4 sm:py-6 border-t border-gray-100 flex-shrink-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div className="text-xs sm:text-sm text-gray-500">
                  All fields marked with <span className="text-red-500">*</span> are required
                </div>
                <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setShowAddSaleModal(false);
                      resetForm();
                    }}
                    className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddSale}
                    disabled={!tcp || parseFloat(tcp) <= 0 || !buyerName || !sellerName || !projectName || !projectType || !unitDetails || !projectDeveloper || !reservationDate}
                    className="flex-1 sm:flex-none px-4 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-lg sm:rounded-xl font-medium hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 text-sm sm:text-base"
                  >
                    Create Sale
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <footer className="mt-12 text-center text-sm text-gray-500 pb-6">
        © {new Date().getFullYear()} OMNIPORTAL. All rights reserved.
      </footer>
    </div>
  );
};

export default AgentDashboard;