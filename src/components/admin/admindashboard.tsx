import React, { useEffect, useState } from 'react';
import {
  LogOut,
  Home,
  Users,
  Building,
  File,
  DollarSign,
  BarChart2,
  FileText,
  Ticket,
  Menu,
  X,
  Monitor,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase/supabaseClient';
import './admindashboard.css';

import DashboardContent from './dashboard/dashboardcontent';
import InventoryPage from './inventory/inventorycontent';
import ClientsPage from './clients/clientscontent';
import BalancePage from './balance/balancecontent';
import ReportPage from './report/reportcontent';
import TicketPage from './ticket/ticketcontent';
import PaymentPage from './payment/paymentcontent';
import AgentPage from './agent/agentcontent';
import DocumentsPage from './document/documentscontent';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [userFullName, setUserFullName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [activeItem, setActiveItem] = useState<string>('Dashboard');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  // Notification states
  const [notifications, setNotifications] = useState<{[key: string]: number}>({
    Ticket: 0,
    Payment: 0,
    // Add more notification counters as needed
  });

  // Check if screen is mobile size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Check on initial load
    checkScreenSize();

    // Add event listener for resize
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Mobile Warning Component
  const MobileWarning = () => (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-70 z-50 flex items-center justify-center p-4">
  <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6 text-center">
    <div className="flex justify-center mb-4">
      <Monitor className="h-10 w-10 text-blue-600" />
    </div>
    <h1 className="text-xl font-semibold text-gray-900 mb-2">
      Desktop Required
    </h1>
    <p className="text-sm text-gray-600 mb-4">
      This system is not optimized for handheld devices.  
      Please use a desktop or laptop for the best experience.
    </p>
    <p className="text-xs text-gray-500 mb-6">
      Minimum resolution: 1024×768
    </p>
    <button
      onClick={() => window.location.reload()}
      className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 transition"
    >
      Refresh Page
    </button>
  </div>
</div>

  );

  const handleLogout = () => {
    // Clear custom user data
    localStorage.removeItem("adminName");
    localStorage.removeItem("userEmail");
  
    // Clear Supabase auth token (you can clear all Supabase keys like this)
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("sb-")) {
        localStorage.removeItem(key);
      }
    });
  
    // (Optional) Clear sessionStorage and cookies
    sessionStorage.clear();
    document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  
    console.log("✅ LocalStorage after logout:", { ...localStorage });
  
    // Navigate to login or home
    navigate('/');
  };

  useEffect(() => {
    const adminName = localStorage.getItem("adminName");
    const tokenKey = Object.keys(localStorage).find(key => key.startsWith("sb-"));
  
    if (!adminName || !tokenKey) {
      alert("Access denied. Please login first.");
      navigate('/');
    }
  }, []);

  // Function to fetch notification counts
  const fetchNotificationCounts = async () => {
    try {
      // Fetch new and in_progress ticket count
      const { data: ticketData, error: ticketError } = await supabase
        .from('Tickets') // Replace with your actual tickets table name
        .select('id', { count: 'exact' })
        .in('Status', ['new', 'in_progress']); // Using your actual status values

      if (ticketError) {
        console.error('Error fetching ticket notifications:', ticketError);
      } else {
        setNotifications(prev => ({
          ...prev,
          Ticket: ticketData?.length || 0
        }));
      }

      // Fetch pending payment count
      const { data: paymentData, error: paymentError } = await supabase
        .from('Payment') // Replace with your actual payments table name
        .select('id', { count: 'exact' })
        .eq('Status', 'Pending'); // Using your actual status value

      if (paymentError) {
        console.error('Error fetching payment notifications:', paymentError);
      } else {
        setNotifications(prev => ({
          ...prev,
          Payment: paymentData?.length || 0
        }));
      }

    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Set up real-time subscription for notifications
  useEffect(() => {
    // Initial fetch
    fetchNotificationCounts();

    // Set up real-time subscription for tickets
    const ticketSubscription = supabase
      .channel('ticket-notifications')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'Tickets' // Replace with your actual table name
        },
        (payload) => {
          console.log('Ticket change detected:', payload);
          fetchNotificationCounts(); // Refetch counts when changes occur
        }
      )
      .subscribe();

    // Set up real-time subscription for payments
    const paymentSubscription = supabase
      .channel('payment-notifications')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'Payments' // Replace with your actual table name
        },
        (payload) => {
          console.log('Payment change detected:', payload);
          fetchNotificationCounts(); // Refetch counts when changes occur
        }
      )
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(ticketSubscription);
      supabase.removeChannel(paymentSubscription);
    };
  }, []);

  const fetchUserData = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
        console.error('Error fetching user:', userError);
        setLoading(false);
        return;
    }

    if (!user) {
        console.error('No user is logged in');
        setLoading(false);
        return;
    }

    const { data, error } = await supabase
        .from('Admin')
        .select('Name, Email')
        .eq('Email', user.email)
        .single();

    if (error) {
        console.error('Error fetching user data:', error);
        setLoading(false);
        return;
    }

    if (data) {
        setUserFullName(data.Name);
        setUserEmail(data.Email);
    }

    setLoading(false);
  };

  const handleNavItemClick = (itemName: string) => {
    setActiveItem(itemName);
    console.log(`Navigating to: ${itemName}`);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const allMainNavItems = [
    { name: 'Dashboard', icon: Home },
    { name: 'Inventory', icon: Building },
    { name: 'Clients', icon: Users },
    { name: 'Documents', icon: File },
    { name: 'Payment', icon: DollarSign },
    { name: 'Balance', icon: BarChart2 },
    { name: 'Report', icon: FileText },
    { name: 'Ticket', icon: Ticket },
    { name: 'Agent', icon: Users },
  ];

  const getFilteredNavItems = (items: { name: string; icon: any }[]) => {
    const emailPermissions: { [key: string]: string[] } = {
      'hdc.ellainegarcia@gmail.com': ['Ticket', 'Clients', 'Documents'],
      'rtdesignbuilders@gmail.com': ['Agent'],
      'angelap.hdc@gmail.com': ['Inventory', 'Payment', 'Balance', 'Report'],
      'rowelhal.hdc@gmail.com': ['Inventory', 'Payment', 'Balance', 'Report'],
    };
  
    const allowedItems = emailPermissions[userEmail];
  
    if (allowedItems) {
      return items.filter(item => allowedItems.includes(item.name));
    }
  
    return items;
  };
  
  // Add this function to get the default route
  const getDefaultRoute = (userEmail: string) => {
    const emailPermissions: { [key: string]: string[] } = {
      'hdc.ellainegarcia@gmail.com': ['Ticket', 'Clients', 'Documents'],
      'rtdesignbuilders@gmail.com': ['Agent'],
      'angelap.hdc@gmail.com': ['Inventory', 'Payment', 'Balance', 'Report'],
      'rowelhal.hdc@gmail.com': ['Inventory', 'Payment', 'Balance', 'Report'],
    };
  
    const allowedItems = emailPermissions[userEmail];
  
    if (allowedItems && allowedItems.length > 0) {
      // The first item in the list will be the default route
      return allowedItems[0];
    }
  
    return 'Dashboard'; // Default fallback
  };
  

  const mainNavItems = getFilteredNavItems(allMainNavItems);

  const renderActiveContent = () => {
    switch (activeItem) {
      case 'Dashboard':
        return <DashboardContent />;
      case 'Inventory':
        return<InventoryPage/>;
      case 'Clients':
       return<ClientsPage/>;
      case 'Payment':
        return<PaymentPage/>;
      case 'Balance':
        return<BalancePage/>;
      case 'Report':
        return<ReportPage/>;
      case 'Ticket':
        return<TicketPage/>;
      case 'Agent':
        return<AgentPage/>;
      case 'Documents':
        return<DocumentsPage/>;
      default:
        return <DashboardContent />;
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Add this new useEffect to handle redirection after userEmail is set
  useEffect(() => {
    if (userEmail) {
      const defaultRoute = getDefaultRoute(userEmail);
      if (defaultRoute !== 'Dashboard') {
        setActiveItem(defaultRoute);
      }
    }
  }, [userEmail]);

  // Show mobile warning if screen is too small
  if (isMobile) {
    return <MobileWarning />;
  }

  return (
    <div className="flex max-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Sidebar Container with Padding */}
      <div className={`${isCollapsed ? 'w-32' : 'w-80'} p-4 flex flex-col h-screen transition-all duration-300 ease-in-out`}>
        {/* Floating Sidebar Card */}
        <aside className="flex-1 bg-white text-gray-800 shadow-2xl rounded-2xl flex flex-col backdrop-blur-sm overflow-hidden">
          {/* Enhanced Header */}
          <div className="bg-gradient-to-r from-white to-blue-50/30 border-b border-gray-100/50">
            <div className="p-6">
              <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-4'}`}>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-blue-100">
                    <span className="text-white font-bold text-lg">O</span>
                  </div>
                  {!isCollapsed && (
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 tracking-wide">Omni Portal</h2>
                      <p className="text-gray-600 text-sm font-medium">Admin Dashboard</p>
                    </div>
                  )}
                </div>
                
                {/* Toggle Button - only show when expanded */}
                {!isCollapsed && (
                  <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200/50 focus:outline-none transform transition-all duration-200 hover:scale-110 hover:shadow-md group"
                    title="Collapse Sidebar"
                  >
                    <X className="h-5 w-5 text-gray-600 transition-all duration-200 group-hover:text-gray-800" />
                  </button>
                )}
                
                {/* Toggle Button for collapsed state - positioned as overlay, half outside */}
                {isCollapsed && (
                  <button
                    onClick={toggleSidebar}
                    className="absolute top-6 -right-4 p-2 rounded-full bg-white hover:bg-gray-50 border border-gray-200 focus:outline-none transform transition-all duration-200 hover:scale-110 hover:shadow-lg group z-20 shadow-lg"
                    title="Expand Sidebar"
                  >
                    <Menu className="h-4 w-4 text-gray-600 transition-all duration-200 group-hover:text-gray-800" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Main Navigation */}
          <nav className="flex-1 px-6 py-6 space-y-2">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.name;
              const notificationCount = notifications[item.name] || 0;
              
              return (
                <div key={item.name}>
                  <button
                    onClick={() => handleNavItemClick(item.name)}
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'space-x-4 px-4'} py-3.5 text-sm font-medium transition-all duration-300 transform relative group ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-lg shadow-blue-200/50 scale-105'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl hover:translate-x-1 hover:shadow-md'
                    }`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <div className="relative">
                      <Icon className={`h-5 w-5 transition-all duration-300 ${
                        isActive ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'
                      }`} />
                      
                      {/* Notification Badge for collapsed state */}
                      {isCollapsed && notificationCount > 0 && (
                        <div className="absolute -top-2 -right-2 flex items-center justify-center min-w-[18px] h-4 rounded-full text-xs font-bold shadow-lg ring-2 bg-gradient-to-r from-red-500 to-red-600 text-white ring-red-200">
                          <span className="relative z-10">
                            {notificationCount > 9 ? '9+' : notificationCount}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {!isCollapsed && (
                      <>
                        <span className="truncate font-medium flex-1 text-left">{item.name}</span>
                        
                        {/* Notification Badge for expanded state */}
                        {notificationCount > 0 && (
                          <div className={`relative flex items-center justify-center min-w-[24px] h-6 rounded-full text-xs font-bold shadow-lg ring-2 transition-all duration-300 transform ${
                            isActive 
                              ? 'bg-gradient-to-r from-white to-gray-50 text-blue-700 ring-blue-200 shadow-blue-200/50' 
                              : 'bg-gradient-to-r from-red-500 to-red-600 text-white ring-red-200 group-hover:from-red-600 group-hover:to-red-700 group-hover:scale-110 shadow-red-300/50'
                          }`}>
                            <span className="relative z-10">
                              {notificationCount > 99 ? '99+' : notificationCount}
                            </span>
                            {/* Pulse animation for new notifications */}
                            <div className={`absolute inset-0 rounded-full animate-ping ${
                              isActive ? 'bg-blue-400/30' : 'bg-red-400/30'
                            }`}></div>
                          </div>
                        )}
                        
                        {isActive && !notificationCount && (
                          <div className="absolute right-3 w-2 h-2 bg-white rounded-full opacity-80"></div>
                        )}
                      </>
                    )}
                  </button>
                  {/* Divider */}
                  {!isCollapsed && <hr className="my-2 border-gray-200" />}
                </div>
              );
            })}
          </nav>

          {/* Bottom Section */}
          <div className={`border-t border-gray-100/50 bg-gradient-to-r from-gray-50/30 to-blue-50/20 ${isCollapsed ? 'px-2 py-6' : 'px-6 py-4'}`}>
            {isCollapsed ? (
              /* Collapsed state - only logout button with extra spacing */
              <div className="flex justify-center">
                <button 
                  onClick={handleLogout} 
                  className="p-3 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200/50 focus:outline-none transform transition-all duration-200 hover:scale-110 hover:shadow-md group"
                  title="Logout"
                >
                  <LogOut className="h-6 w-6 text-red-500 transition-all duration-200 group-hover:text-red-600" />
                </button>
              </div>
            ) : (
              /* Expanded state - full profile section */
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-4 border border-gray-200/50 shadow-sm backdrop-blur-sm">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center relative group transition-all duration-300 ease-in-out">
                    <span className="text-white font-bold text-lg">{userFullName.charAt(0)}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {loading ? (
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded-lg w-3/4 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded-lg w-1/2 animate-pulse"></div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{userFullName}</p>
                        <p className="text-xs text-gray-600 truncate bg-white/80 px-2 py-1 rounded-md shadow-sm">{userEmail}</p>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={handleLogout} 
                    className="p-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200/50 focus:outline-none transform transition-all duration-200 hover:scale-110 hover:shadow-md group"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5 text-red-500 transition-all duration-200 group-hover:text-red-600 group-hover:scale-110" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {renderActiveContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;