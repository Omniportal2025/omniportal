import type { FC } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../supabase/supabaseClient';
import PageTransition from '../../../components/PageTransition';
import EditBalanceModal from '../../../components/EditBalanceModal';
import type { EditBalanceData } from '../../../components/EditBalanceModal';
import EditBalanceDetailsModal from '../../../components/EditBalanceDetailsModal';
import type { EditBalanceDetailsData } from '../../../components/EditBalanceDetailsModal';

interface BalanceData {
  id: number;
  "Project": string;
  "Block": string;
  "Lot": string;
  "Name": string;
  "Remaining Balance": number | null;
  "Amount": number | null;
  "TCP": number | null;
  "Months Paid": string;
  "MONTHS PAID": string;
  "Terms": string;
  "Due Date": string | null;
  "Monthly Amortization": number | null;
  "sqm"?: number | null;
  "pricepersqm"?: number | null;
  penalty?: number | null;
}

type SortType = 'name-asc' | 'name-desc' | 'block-lot-asc' | 'block-lot-desc';

const PROJECTS = ['Living Water Subdivision', 'Havahills Estate'];

const formatCurrency = (value: number | null): string => {
  if (value == null) return '₱0.00';
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const BalancePage: FC = () => {
  const [balances, setBalances] = useState<BalanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditDetailsModalOpen, setIsEditDetailsModalOpen] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<BalanceData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [sortType, setSortType] = useState<SortType>('name-asc');
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    fetchBalances();
  }, []);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('Balance')
        .select('id, "Project", "Block", "Lot", "Name", "Remaining Balance", "Amount", "TCP", "Months Paid", "MONTHS PAID", "Terms", "Due Date", "Monthly Amortization", "sqm", "pricepersqm", "penalty"')
        .order('"Name"', { ascending: true });

      if (error) throw error;

      const processedData = (data || []).map(item => ({
        ...item,
        "Remaining Balance": item["Remaining Balance"] ? parseFloat(item["Remaining Balance"].toString().replace(/,/g, '')) : null,
        "Amount": item["Amount"] ? parseFloat(item["Amount"].toString().replace(/,/g, '')) : null,
        "TCP": item["TCP"] ? parseFloat(item["TCP"].toString().replace(/,/g, '')) : null,
        "Months Paid": item["Months Paid"]?.toString() || '',
        "MONTHS PAID": item["MONTHS PAID"]?.toString() || '',
        "Terms": item["Terms"]?.toString() || ''
      }));

      setBalances(processedData);
    } catch (err: any) {
      console.error('Error fetching balances:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (balance: BalanceData) => {
    setSelectedBalance(balance);
    setIsEditModalOpen(true);
  };

  const handleEditDetails = (balance: BalanceData) => {
    setSelectedBalance(balance);
    setIsEditDetailsModalOpen(true);
  };

  const handleSave = async (updatedData: EditBalanceData) => {
    try {
      // Update the Balance record with the new data
      const { error } = await supabase
        .from('Balance')
        .update({
          "Project": updatedData["Project"],
          "Block": updatedData["Block"],
          "Lot": updatedData["Lot"],
          "Name": updatedData["Name"],
          "Remaining Balance": updatedData["Remaining Balance"],
          "Amount": updatedData["Amount"],
          "TCP": updatedData["TCP"],
          "Months Paid": updatedData["Months Paid"],
          "MONTHS PAID": updatedData["MONTHS PAID"],
          "Terms": updatedData["Terms"]
        })
        .eq('id', updatedData.id);

      if (error) throw error;

      // Refresh the balances list
      await fetchBalances();
    } catch (err: any) {
      console.error('Error updating balance:', err.message);
      setError(err.message);
    }
  };

  const handleSaveDetails = async (updatedData: EditBalanceDetailsData) => {
    try {
      const { error } = await supabase
        .from('Balance')
        .update({
          Name: updatedData.Name,
          Block: updatedData.Block,
          Lot: updatedData.Lot,
          Project: updatedData.Project,
          Terms: updatedData.Terms,
          TCP: updatedData.TCP,
          Amount: updatedData.Amount,
          "Remaining Balance": updatedData["Remaining Balance"],
          "Monthly Amortization": updatedData["Monthly Amortization"],
          "sqm": updatedData["sqm"],
          "pricepersqm": updatedData["pricepersqm"],
          "Months Paid": updatedData["Months Paid"],
          "MONTHS PAID": updatedData["MONTHS PAID"],
          "Due Date": updatedData["Due Date"]
        })
        .eq('id', updatedData.id);

      if (error) throw error;

      // Fetch fresh data from the database
      await fetchBalances();

      setIsEditDetailsModalOpen(false);
      setSelectedBalance(null);
    } catch (error: any) {
      console.error('Error updating balance:', error.message);
      alert('Failed to update balance: ' + error.message);
    }
  };

  const handleView = (balance: BalanceData) => {
    setSelectedBalance(balance);
    setIsViewModalOpen(true);
  };

  const compareBlockLot = (a: BalanceData, b: BalanceData): number => {
    // Handle null/undefined cases
    const blockA = (a.Block || '').toString();
    const blockB = (b.Block || '').toString();
    const lotA = (a.Lot || '').toString();
    const lotB = (b.Lot || '').toString();

    // Extract numeric parts from Block
    const blockNumA = parseInt(blockA.replace(/\D/g, '') || '0');
    const blockNumB = parseInt(blockB.replace(/\D/g, '') || '0');

    if (blockNumA !== blockNumB) {
      return blockNumA - blockNumB;
    }

    // If blocks are the same, compare lots
    const lotNumA = parseInt(lotA.replace(/\D/g, '') || '0');
    const lotNumB = parseInt(lotB.replace(/\D/g, '') || '0');
    return lotNumA - lotNumB;
  };

  const isPaymentCompleted = (balance: any) => {
    return balance["Amount"] === balance["TCP"] && balance["MONTHS PAID"] === balance["Terms"];
  };

  const renderActionButtons = (balance: any) => {
    if (isPaymentCompleted(balance)) {
      return (
        <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-200/60 shadow-sm rounded-lg font-semibold text-xs">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Payment Completed
        </div>
      );
    }
  
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleEditDetails(balance)}
          className="inline-flex items-center px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 rounded-lg border border-blue-200 hover:border-blue-300 transition-all duration-200 text-xs font-semibold shadow-sm hover:shadow-md"
          title="Edit Balance"
        >
          <svg xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 mr-1.5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span>Edit</span>
        </button>
        {!isPaymentCompleted(balance) && (
          <button
            onClick={() => handleEdit(balance)}
            className="inline-flex items-center px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 rounded-lg border border-emerald-200 hover:border-emerald-300 transition-all duration-200 text-xs font-semibold shadow-sm hover:shadow-md"
            title="Add Payment"
          >
            <svg xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 mr-1.5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Payment</span>
          </button>
        )}
      </div>
    );
  };

  // Filter and sort balances
  const filteredBalances = useMemo(() => {
    try {
      let filtered = [...balances];

      // Apply search filter
      if (searchTerm && searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase().trim();
        filtered = filtered.filter(balance => {
          try {
            const name = String(balance.Name || '').toLowerCase();
            const block = String(balance.Block || '').toLowerCase();
            const lot = String(balance.Lot || '').toLowerCase();
            const project = String(balance.Project || '').toLowerCase();
            
            return name.includes(searchLower) || 
                   block.includes(searchLower) || 
                   lot.includes(searchLower) || 
                   project.includes(searchLower);
          } catch (err) {
            console.error('Error filtering balance:', err);
            return false;
          }
        });
      }

      // Apply project filter
      if (selectedProject) {
        filtered = filtered.filter(balance => balance.Project === selectedProject);
      }

      return filtered;
    } catch (err) {
      console.error('Error in filteredBalances:', err);
      return balances;
    }
  }, [balances, searchTerm, selectedProject]);

  // Sort the filtered balances
  const sortedBalances = useMemo(() => {
    return [...filteredBalances].sort((a, b) => {
      const nameA = a.Name || '';
      const nameB = b.Name || '';

      if (sortType === 'name-asc') return nameA.localeCompare(nameB);
      if (sortType === 'name-desc') return nameB.localeCompare(nameA);
      if (sortType === 'block-lot-asc') {
        return compareBlockLot(a, b);
      }
      return compareBlockLot(b, a); // Reverse for descending order
    });
  }, [filteredBalances, sortType]);

  if (loading) {
    return (
      <PageTransition>
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Balance Records</h1>
            <p className="text-gray-600">Manage and view client balances</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg flex flex-col h-[calc(100vh-16rem)]">
            <div className="flex justify-center items-center h-full bg-gray-50">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent shadow-sm"></div>
                <p className="mt-4 text-sm font-medium text-gray-500">Loading balance records...</p>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Balance Records</h1>
            <p className="text-gray-600">Manage and view client balances</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 border border-red-200">
            <div className="flex items-center text-red-600">
              <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Error loading balance data: {error}</span>
            </div>
            <p className="mt-2 text-sm text-gray-600">Please try refreshing the page or contact support if the problem persists.</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      {/* Single Unified Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden h-[calc(100vh-4rem)] ">

        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full transform translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full transform -translate-x-12 translate-y-12"></div>
            
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Balance Records Dashboard
                  </h1>
                  <p className="text-slate-300 mb-4">
                    Manage and track all your balance records in one place
                  </p>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <span className="font-bold text-xl text-white">{filteredBalances.length}</span>
                        <span className="ml-2 text-slate-300 text-sm">Total Records</span>
                      </div>
                    </div>
                    <div className="w-px h-6 bg-slate-600"></div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <span className="font-bold text-xl text-white">{sortedBalances.length}</span>
                        <span className="ml-2 text-slate-300 text-sm">Showing</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Search and Filters - Integrated into Header */}
                <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
                  {/* Search Bar */}
                  <div className="w-full lg:w-64">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Search Records
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by name..."
                        className="w-full h-10 pl-4 pr-10 text-sm bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 placeholder-slate-400 text-white"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <circle cx="11" cy="11" r="8"></circle>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                      </div>
                    </div>
                  </div>
  
                  {/* Project Filter */}
                  <div className="w-full lg:w-48">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Project
                    </label>
                    <div className="relative">
                      <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="w-full h-10 pl-4 pr-8 text-sm bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent cursor-pointer appearance-none transition-all duration-200 text-white"
                      >
                        <option value="">All Projects</option>
                        {PROJECTS.map((project, index) => (
                          <option key={index} value={project}>{project}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
  
                  {/* Sort Filter */}
                  <div className="w-full lg:w-48">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Sort By
                    </label>
                    <div className="relative">
                      <select
                        value={sortType}
                        onChange={(e) => setSortType(e.target.value as SortType)}
                        className="w-full h-10 pl-4 pr-8 text-sm bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent cursor-pointer appearance-none transition-all duration-200 text-white"
                      >
                        <option value="name-asc">Name (A-Z)</option>
                        <option value="name-desc">Name (Z-A)</option>
                        <option value="block-lot-asc">Block/Lot ↑</option>
                        <option value="block-lot-desc">Block/Lot ↓</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
  
          {/* Table Section */}
          <div className="flex-1 flex flex-col" style={{ height: 'calc(100vh - 12rem)' }}>
            {/* Table Container */}
            <div className="flex-1 overflow-x-auto bg-white round-xl shadow-sm border border-slate-200/60">
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">
                      Project
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">
                      Block
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">
                      Lot
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">
                      Remaining Balance
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">
                      Amount Paid
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">
                      TCP
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">
                      Months Paid
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">
                      Months Paid
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">
                      Terms
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">
                      Due Date
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">
                      Monthly Amortization
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">
                      SQM
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">
                      Price Per SQM
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">
                      Penalty
                    </th>
                    <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedBalances.length === 0 ? (
                    <tr>
                      <td colSpan={16} className="px-6 py-20">
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
                            <svg className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-semibold text-slate-800 mb-3">No balance records found</h3>
                          <p className="text-slate-500 max-w-md leading-relaxed">
                            {searchTerm ? 'Try adjusting your search or filter criteria to find the records you\'re looking for.' : 'No records are available at the moment. Check back later or contact support if this seems incorrect.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sortedBalances.map((balance) => (
                      <tr 
                        key={balance.id} 
                        className="group hover:bg-slate-50/80 transition-all duration-200 border-b border-slate-50 last:border-b-0"
                      >
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full shadow-sm"></div>
                            <span className="text-sm font-medium text-slate-800">{balance.Project}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="text-sm text-slate-600 font-medium">{balance.Block}</span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="text-sm text-slate-600 font-medium">{balance.Lot}</span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="text-sm font-semibold text-slate-800">{balance.Name}</span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border border-orange-200/60 shadow-sm">
                            {formatCurrency(balance["Remaining Balance"])}
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="text-sm font-medium text-slate-700">{formatCurrency(balance["Amount"])}</span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="text-sm font-medium text-slate-700">{formatCurrency(balance["TCP"])}</span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-200/60 shadow-sm">
                            {balance["Months Paid"]}
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-200/60 shadow-sm">
                            {balance["MONTHS PAID"]}
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="text-sm font-medium text-slate-700">{balance["Terms"]}</span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="text-sm text-slate-600">{balance["Due Date"] || 'N/A'}</span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="text-sm font-medium text-slate-700">{formatCurrency(balance["Monthly Amortization"])}</span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="text-sm font-medium text-slate-700">{balance["sqm"]?.toLocaleString() || '0'}</span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="text-sm font-medium text-slate-700">{balance["pricepersqm"]?.toLocaleString() || '0'}</span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200/60 shadow-sm">
                            {balance.penalty ? formatCurrency(balance.penalty) : formatCurrency(0)}
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleView(balance)}
                              className="inline-flex items-center px-4 py-2 bg-white hover:bg-blue-50 text-blue-600 hover:text-blue-700 rounded-lg border border-blue-200 hover:border-blue-300 transition-all duration-200 text-xs font-semibold shadow-sm hover:shadow-md group-hover:shadow-md"
                            >
                              <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View
                            </button>
                            {renderActionButtons(balance)}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {isEditModalOpen && selectedBalance && (
          <EditBalanceModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedBalance(null);
            }}
            onSave={handleSave}
            
            data={selectedBalance}
          />
        )}

        {/* Edit Balance Details Modal */}
        {isEditDetailsModalOpen && selectedBalance && (
          <EditBalanceDetailsModal
            isOpen={isEditDetailsModalOpen}
            onClose={() => {
              setIsEditDetailsModalOpen(false);
              setSelectedBalance(null);
            }}
            onSave={handleSaveDetails}
            data={selectedBalance}
          />
        )}

        {/* Statement of Account Modal */}
        {isViewModalOpen && selectedBalance && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-white via-gray-50 to-blue-50/30 rounded-3xl shadow-2xl max-w-md w-full transform transition-all scale-100 opacity-100 border border-white/20">
              {/* Header with gradient background */}
              <div className="relative px-8 pt-8 pb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-[#0A0D50]/5 to-blue-600/5 rounded-t-3xl"></div>
                
                <div className="relative flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-gradient-to-r from-[#0A0D50] to-blue-600 text-white p-2.5 rounded-xl shadow-lg">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                          Statement of Account
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="h-1 w-8 bg-gradient-to-r from-[#0A0D50] to-blue-600 rounded-full"></div>
                          <div className="h-1 w-4 bg-gradient-to-r from-blue-400 to-blue-300 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">{selectedBalance.Name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{selectedBalance.Project}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const printWindow = window.open('', '_blank');
                        if (printWindow) {
                          printWindow.document.write(`
                            <!DOCTYPE html>
                            <html>
                              <head>
                                <title>Statement of Account</title>
                                <style media="print">
                                  @page {
                                    size: auto;
                                    margin: 0mm;
                                  }
                                </style>
                                <style>
                                  @media print {
                                    @page { 
                                      size: A5;
                                      margin: 0;
                                    }
                                    body { 
                                      -webkit-print-color-adjust: exact;
                                      print-color-adjust: exact;
                                    }
                                    .print-container {
                                      border: none !important;
                                      box-shadow: none !important;
                                    }
                                  }
                                  @page { margin: 0; }
                                  @media print {
                                    html, body {
                                      height: 100%;
                                      margin: 0 !important;
                                      padding: 0 !important;
                                    }
                                  }
                                  body {
                                    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
                                    line-height: 1.4;
                                    color: #1f2937;
                                    margin: 0;
                                    padding: 20px;
                                    display: flex;
                                    justify-content: center;
                                    align-items: flex-start;
                                    min-height: 100vh;
                                    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                                  }
                                  .print-container {
                                    background: white;
                                    width: 420px;
                                    padding: 30px;
                                    border-radius: 16px;
                                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                                    border: 1px solid #e5e7eb;
                                  }
                                  .header {
                                    text-align: center;
                                    padding: 20px 0;
                                    margin-bottom: 25px;
                                    border-bottom: 3px solid transparent;
                                    background: linear-gradient(white, white) padding-box,
                                               linear-gradient(90deg, #0A0D50, #3b82f6) border-box;
                                    border-radius: 8px 8px 0 0;
                                  }
                                  .header h2 {
                                    margin: 0 0 8px 0;
                                    background: linear-gradient(135deg, #0A0D50, #3b82f6);
                                    -webkit-background-clip: text;
                                    -webkit-text-fill-color: transparent;
                                    background-clip: text;
                                    font-size: 24px;
                                    font-weight: 700;
                                    letter-spacing: -0.5px;
                                  }
                                  .header p {
                                    margin: 0;
                                    color: #6b7280;
                                    font-size: 14px;
                                    font-weight: 500;
                                  }
                                  .property-details {
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                    margin-bottom: 25px;
                                    padding: 16px;
                                    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                                    border-radius: 12px;
                                    font-size: 13px;
                                    border: 1px solid #e5e7eb;
                                  }
                                  .badge {
                                    background: linear-gradient(135deg, #dbeafe, #bfdbfe);
                                    color: #1e40af;
                                    padding: 6px 12px;
                                    border-radius: 8px;
                                    font-weight: 600;
                                    font-size: 12px;
                                    margin-right: 8px;
                                    border: 1px solid #93c5fd;
                                  }
                                  .terms-badge {
                                    background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
                                    color: #0c4a6e;
                                    padding: 6px 12px;
                                    border-radius: 8px;
                                    font-weight: 600;
                                    font-size: 12px;
                                    border: 1px solid #7dd3fc;
                                  }
                                  .financial-grid {
                                    display: grid;
                                    grid-template-columns: 1fr 1fr;
                                    gap: 16px;
                                    margin-bottom: 20px;
                                  }
                                  .card {
                                    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
                                    border: 1px solid #e5e7eb;
                                    padding: 18px;
                                    border-radius: 12px;
                                    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
                                    position: relative;
                                    overflow: hidden;
                                  }
                                  .card::before {
                                    content: '';
                                    position: absolute;
                                    top: 0;
                                    left: 0;
                                    right: 0;
                                    height: 3px;
                                    background: linear-gradient(90deg, #0A0D50, #3b82f6);
                                  }
                                  .card-label {
                                    font-size: 12px;
                                    color: #6b7280;
                                    margin-bottom: 6px;
                                    font-weight: 500;
                                    text-transform: uppercase;
                                    letter-spacing: 0.5px;
                                  }
                                  .card-value {
                                    font-size: 18px;
                                    font-weight: 700;
                                    letter-spacing: -0.5px;
                                  }
                                  .progress-container {
                                    margin-top: 12px;
                                  }
                                  .progress-bar {
                                    width: 100%;
                                    height: 8px;
                                    background: #f1f5f9;
                                    border-radius: 6px;
                                    overflow: hidden;
                                    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
                                  }
                                  .progress-fill {
                                    height: 100%;
                                    border-radius: 6px;
                                    transition: width 0.3s ease;
                                  }
                                  .progress-fill.primary {
                                    background: linear-gradient(90deg, #0A0D50, #3b82f6);
                                  }
                                  .progress-fill.success {
                                    background: linear-gradient(90deg, #059669, #10b981);
                                  }
                                  .green { color: #059669; }
                                  .red { color: #dc2626; }
                                  .balance-card {
                                    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
                                    border: 1px solid #fecaca;
                                  }
                                  .balance-card::before {
                                    background: linear-gradient(90deg, #dc2626, #ef4444);
                                  }
                                  .progress-card {
                                    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                                    border: 1px solid #bbf7d0;
                                    margin-top: 20px;
                                  }
                                  .progress-card::before {
                                    background: linear-gradient(90deg, #059669, #10b981);
                                  }
                                </style>
                              </head>
                              <body onload="window.print();window.close()">
                                <div class="print-container">
                                  <div class="header">
                                    <h2>Statement of Account</h2>
                                    <p>${selectedBalance.Name} • ${selectedBalance.Project}</p>
                                  </div>
                                
                                  <div class="property-details">
                                    <div>
                                      <span class="badge">Block ${selectedBalance.Block}</span>
                                      <span class="badge">Lot ${selectedBalance.Lot}</span>
                                    </div>
                                    <div class="terms-badge">${selectedBalance.Terms} Terms</div>
                                  </div>

                                  <div class="financial-grid">
                                    <div class="card">
                                      <div class="card-label">Total Contract Price</div>
                                      <div class="card-value">${formatCurrency(selectedBalance.TCP)}</div>
                                    </div>
                                    <div class="card">
                                      <div class="card-label">Amount Paid</div>
                                      <div class="card-value green">${formatCurrency(selectedBalance.Amount)}</div>
                                    </div>
                                  </div>

                                  <div class="card balance-card">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                      <div class="card-label">Remaining Balance</div>
                                      <div class="card-value red">${formatCurrency(selectedBalance["Remaining Balance"])}</div>
                                    </div>
                                    <div class="progress-container">
                                      <div class="progress-bar">
                                        <div class="progress-fill primary" style="width: ${selectedBalance.Amount && selectedBalance.TCP ? (selectedBalance.Amount / selectedBalance.TCP) * 100 : 0}%"></div>
                                      </div>
                                    </div>
                                  </div>

                                  <div class="card progress-card">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                      <div class="card-label">Payment Progress</div>
                                      <div class="card-value">${selectedBalance["MONTHS PAID"]} / ${selectedBalance.Terms} months</div>
                                    </div>
                                    <div style="font-size: 12px; color: #6b7280; margin: 6px 0 10px; font-weight: 500;">Latest Payment: ${selectedBalance["Months Paid"]}</div>
                                    <div class="progress-bar">
                                      <div class="progress-fill success" style="width: ${selectedBalance["MONTHS PAID"] && selectedBalance.Terms ? (parseInt(selectedBalance["MONTHS PAID"]) / parseInt(selectedBalance.Terms)) * 100 : 0}%"></div>
                                    </div>
                                  </div>
                                </div>
                              </body>
                            </html>
                          `);
                          printWindow.document.close();
                        }
                      }}
                      className="group bg-white/80 backdrop-blur-sm hover:bg-white text-blue-600 hover:text-blue-700 border border-blue-200/50 hover:border-blue-300 rounded-xl p-2.5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                    >
                      <svg className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setIsViewModalOpen(false)}
                      className="group bg-white/80 backdrop-blur-sm hover:bg-red-50 text-gray-400 hover:text-red-500 border border-gray-200/50 hover:border-red-200 rounded-xl p-2.5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                    >
                      <svg className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Property Details Section */}
                <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/30 rounded-2xl p-4 mb-6 border border-blue-100/50">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 rounded-lg font-semibold text-xs shadow-md">
                        Block {selectedBalance.Block}
                      </div>
                      <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-3 py-1.5 rounded-lg font-semibold text-xs shadow-md">
                        Lot {selectedBalance.Lot}
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-3 py-1.5 rounded-lg font-semibold text-xs shadow-md">
                      {selectedBalance.Terms} Terms
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="px-8 pb-8 space-y-5">
                {/* Financial Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="group relative bg-gradient-to-br from-white to-gray-50/50 p-4 rounded-2xl shadow-sm border border-gray-100/50 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Contract</p>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedBalance.TCP)}</p>
                    </div>
                  </div>
                  
                  <div className="group relative bg-gradient-to-br from-white to-green-50/30 p-4 rounded-2xl shadow-sm border border-green-100/50 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Amount Paid</p>
                      </div>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(selectedBalance.Amount)}</p>
                    </div>
                  </div>
                </div>

                {/* Remaining Balance Card */}
                <div className="group relative bg-gradient-to-br from-white to-red-50/30 p-5 rounded-2xl shadow-sm border border-red-100/50 hover:shadow-md transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-gradient-to-r from-red-500 to-red-600 rounded-full"></div>
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Remaining Balance</p>
                      </div>
                      <p className="text-xl font-bold text-red-600">{formatCurrency(selectedBalance["Remaining Balance"])}</p>
                    </div>
                    
                    <div className="relative">
                      <div className="h-3 bg-gradient-to-r from-gray-100 to-gray-150 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className="h-full bg-gradient-to-r from-[#0A0D50] via-blue-600 to-blue-500 rounded-full transition-all duration-1000 ease-out shadow-sm"
                          style={{
                            width: `${selectedBalance.Amount && selectedBalance.TCP ? 
                              (selectedBalance.Amount / selectedBalance.TCP) * 100 : 0}%`
                          }}
                        />
                      </div>
                      <div className="mt-2 text-right">
                        <span className="text-xs font-medium text-gray-500">
                          {selectedBalance.Amount && selectedBalance.TCP ? 
                            `${((selectedBalance.Amount / selectedBalance.TCP) * 100).toFixed(1)}% paid` : '0% paid'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Progress Card */}
                <div className="group relative bg-gradient-to-br from-white to-emerald-50/30 p-5 rounded-2xl shadow-sm border border-emerald-100/50 hover:shadow-md transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full"></div>
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Payment Progress</p>
                      </div>
                      <p className="text-sm font-bold text-gray-900">
                        {selectedBalance["MONTHS PAID"]} / {selectedBalance.Terms} months
                      </p>
                    </div>
                    
                    <div className="mb-3">
                      <div className="bg-gradient-to-r from-emerald-100/50 to-green-100/50 rounded-lg px-3 py-2 border border-emerald-200/30">
                        <p className="text-xs text-emerald-700 font-medium">Latest Payment: {selectedBalance["Months Paid"]}</p>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <div className="h-3 bg-gradient-to-r from-gray-100 to-gray-150 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 via-green-500 to-green-400 rounded-full transition-all duration-1000 ease-out shadow-sm"
                          style={{
                            width: `${selectedBalance["MONTHS PAID"] && selectedBalance.Terms ? 
                              (parseInt(selectedBalance["MONTHS PAID"]) / parseInt(selectedBalance.Terms)) * 100 : 0}%`
                          }}
                        />
                      </div>
                      <div className="mt-2 text-right">
                        <span className="text-xs font-medium text-gray-500">
                          {selectedBalance["MONTHS PAID"] && selectedBalance.Terms ? 
                            `${((parseInt(selectedBalance["MONTHS PAID"]) / parseInt(selectedBalance.Terms)) * 100).toFixed(1)}% complete` : '0% complete'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

    </PageTransition>
  );
};

export default BalancePage;
