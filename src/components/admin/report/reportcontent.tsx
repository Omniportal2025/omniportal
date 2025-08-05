import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../../../supabase/supabaseClient';
import PageTransition from '../../../components/PageTransition';
import { 
  Search, 
  BarChart,
  File,
  AlertTriangle, 
  Edit, 
  Printer, 
  X 
} from 'lucide-react';
import hdcLogo from '../../../assets/HDC LOGO.png';
import hheLogo from '../../../assets/HHE LOGO.png';

interface PaymentRecord {
  id: number;
  created_at: string;
  Name: string;
  Amount: number;
  Project: string;
  Block: string;
  Lot: string;
  Penalty: number;
  Vat?: string | null;
  "Payment Type": string;
  "Payment for the Month of": string;
  "Due Date": string;
}

const ReportPage = (): ReactNode => {
  const projects = [
    'all',
    'Living Water Subdivision',
    'Havahills Estate'
  ];

  const paymentTypes = [
    'all',
    'cash',
    'SB-HRM',
    'SB-LWS',
    'SB-HHE',
    'CBS-LWS',
    'CBS-HHE'
  ];

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];

  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedPrintProject, setSelectedPrintProject] = useState(projects.find(p => p !== 'all') || '');
  const [filteredRecords, setFilteredRecords] = useState<PaymentRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaymentType, setSelectedPaymentType] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [reportStartDate, setReportStartDate] = useState<string>('');
  const [editingRecord, setEditingRecord] = useState<PaymentRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<PaymentRecord | null>(null);

  useEffect(() => {
    fetchPaymentRecords();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [paymentRecords, searchTerm, selectedPaymentType, selectedProject, selectedDate]);

  const filterRecords = () => {
    let filtered = [...paymentRecords];
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(record =>
        record.Name.toLowerCase().includes(searchLower) ||
        record.Project.toLowerCase().includes(searchLower) ||
        record.Block.toLowerCase().includes(searchLower) ||
        record.Lot.toLowerCase().includes(searchLower)
      );
    }

    if (selectedPaymentType !== 'all') {
      filtered = filtered.filter(record => record["Payment Type"] === selectedPaymentType);
    }

    if (selectedProject !== 'all') {
      filtered = filtered.filter(record => record.Project === selectedProject);
    }

    // Apply date filter if a date is selected
    if (selectedDate) {
      const selected = new Date(selectedDate);
      const nextDay = new Date(selected);
      nextDay.setDate(selected.getDate() + 1);
      
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.created_at);
        return recordDate >= selected && recordDate < nextDay;
      });
    }



    setFilteredRecords(filtered);
  };

  const handleEdit = async (record: PaymentRecord) => {
    setEditingRecord(record);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (record: PaymentRecord) => {
    setRecordToDelete(record);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;

    try {
      const { error } = await supabase
        .from('Payment Record')
        .delete()
        .eq('id', recordToDelete.id);

      if (error) throw error;

      // Refresh the payment records
      await fetchPaymentRecords();
      setIsDeleteModalOpen(false);
      setRecordToDelete(null);
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  const handleUpdateRecord = async (updatedRecord: PaymentRecord) => {
    try {
      const { error } = await supabase
        .from('Payment Record')
        .update({
          Name: updatedRecord.Name,
          Amount: updatedRecord.Amount,
          Penalty: updatedRecord.Penalty,
          Project: updatedRecord.Project,
          Block: updatedRecord.Block,
          Lot: updatedRecord.Lot,
          "Payment Type": updatedRecord["Payment Type"],
          "Due Date": updatedRecord["Due Date"],
          Vat: updatedRecord.Vat // Save VAT value
        })
        .eq('id', updatedRecord.id);

      if (error) throw error;

      setIsEditModalOpen(false);
      setEditingRecord(null);
      await fetchPaymentRecords();
    } catch (error) {
      console.error('Error updating record:', error);
    }
  };

  const fetchPaymentRecords = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('Payment Record')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPaymentRecords(data || []);
      setFilteredRecords(data || []);
    } catch (error) {
      console.error('Error fetching payment records:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (records: PaymentRecord[]) => {
    return records.reduce((acc, record) => ({
      amount: acc.amount + (parseFloat(record.Amount?.toString() || '0') || 0),
      penalty: acc.penalty + (parseFloat(record.Penalty?.toString() || '0') || 0)
    }), { amount: 0, penalty: 0 });

  };

  const calculateTotalsByPaymentType = (records: PaymentRecord[]) => {
    return records.reduce((acc, record) => {
      const paymentType = record["Payment Type"] || 'cash';
      const amount = (parseFloat(record.Amount?.toString() || '0') || 0) + (parseFloat(record.Penalty?.toString() || '0') || 0);
      acc[paymentType] = (acc[paymentType] || 0) + amount;
      return acc;
    }, {} as { [key: string]: number });
  };

  const totals = calculateTotals(filteredRecords);

  const getMonthlyTotal = (project: string) => {
    return paymentRecords
      .filter(record => record.Project === project)
      .reduce((sum, record) => sum + (Number(record.Amount) + (Number(record.Penalty) || 0)), 0);
  };

  const convertImageToBase64 = async (imgUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = imgUrl;
    });
  };

  const handlePrint = async () => {
    let printRecords = paymentRecords.filter(record => record.Project === selectedPrintProject);
    
    // Filter by selected date if provided
    if (reportStartDate) {
      const selectedDate = new Date(reportStartDate);
      const nextDay = new Date(selectedDate);
      nextDay.setDate(selectedDate.getDate() + 1);
      
      printRecords = printRecords.filter(record => {
        const recordDate = new Date(record.created_at);
        return recordDate >= selectedDate && recordDate < nextDay;
      });
    }
    const printTotals = calculateTotals(printRecords);
    const printTotalsByType = calculateTotalsByPaymentType(printRecords);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const currentDate = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    const selectedLogo = selectedPrintProject === 'Havahills Estate' ? hheLogo : hdcLogo;
    const themeColor = selectedPrintProject === 'Havahills Estate' ? '#094D2F' : '#0A0D50';
    const logoBase64 = await convertImageToBase64(selectedLogo);
    const html = `
      <html>
        <head>
          <title></title>
          <style>
            @page {
              margin: 0;
              size: A4;
            }
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { 
              font-family: 'Inter', system-ui, -apple-system, sans-serif;
              margin: 0;
              padding: 0;
              color: #1f2937;
              line-height: 1.5;
              background-color: #f3f4f6;
            }
            .report-wrapper {
              background: white;
              margin: 0 auto;
              min-height: 100vh;
              position: relative;
              z-index: 1;
              max-width: 1200px;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            .pattern-border {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              height: 6px;
              background: linear-gradient(90deg, #0A0D50, #141B7A);
            }
            .content {
              padding: 24px;
              position: relative;
              z-index: 2;
            }
            .header {
              margin-bottom: 24px;
              position: relative;
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding-bottom: 16px;
              border-bottom: 1px solid #e5e7eb;
            }
            .header-left {
              display: flex;
              align-items: center;
              gap: 16px;
            }
            .logo {
              width: 60px;
              height: auto;
            }
            .report-title {
              color: ${themeColor};
              font-size: 20px;
              font-weight: 600;
              margin: 0;
              letter-spacing: -0.025em;
            }
            .report-info {
              text-align: right;
              color: #4b5563;
            }
            .report-info p {
              margin: 2px 0;
              font-size: 12px;
              line-height: 1.4;
            }
            table { 
              width: 100%; 
              border-collapse: separate;
              border-spacing: 0;
              margin: 20px 0;
              border-radius: 6px;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }
            th { 
              background-color: ${themeColor}; 
              color: white;
              padding: 10px;
              text-align: left;
              font-size: 11px;
              font-weight: 500;
              letter-spacing: 0.05em;
              text-transform: uppercase;
            }
            td { 
              padding: 10px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 12px;
              background: white;
              color: #374151;
            }
            tr:last-child td {
              border-bottom: none;
            }
            tr:hover td {
              background-color: #f9fafb;
            }
            .total-section {
              margin: 20px 0;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
            }
            .totals {
              background-color: white;
              padding: 16px;
              border-radius: 8px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }
            .totals p {
              margin: 0;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 12px;
              padding: 8px 0;
              border-bottom: 1px solid #e5e7eb;
              color: #4b5563;
            }
            .totals p:last-child {
              border-bottom: none;
            }
            .total-amount {
              font-weight: 600;
              color: ${themeColor};
              font-size: 13px;
              font-variant-numeric: tabular-nums;
            }
            .breakdown-section {
              background-color: white;
              padding: 16px;
              border-radius: 8px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }
            .breakdown-title {
              font-size: 13px;
              font-weight: 600;
              color: ${themeColor};
              margin-bottom: 12px;
              padding-bottom: 8px;
              border-bottom: 2px solid #e5e7eb;
              letter-spacing: -0.025em;
            }
            .breakdown-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px 0;
              border-bottom: 1px solid #e5e7eb;
              font-size: 12px;
              color: #4b5563;
            }
            .breakdown-item span:last-child {
              font-weight: 500;
              color: ${themeColor};
              font-variant-numeric: tabular-nums;
            }
            .breakdown-item:last-child {
              border-bottom: none;
            }
            .first-page {
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 40px;
              height: auto;
              margin-bottom: 40px;
            }
            .center-content {
              text-align: center;
              max-width: 600px;
              margin: 0 auto;
            }
            .large-logo {
              width: 200px;
              height: auto;
              margin-bottom: 32px;
            }
            .main-title {
              font-size: 36px;
              font-weight: 700;
              color: ${themeColor};
              margin: 0 0 40px;
              letter-spacing: -0.025em;
            }
            .report-details {
              display: flex;
              flex-direction: column;
              gap: 16px;
              margin-top: 40px;
              padding: 24px;
              background: #f8fafc;
              border-radius: 12px;
            }
            .detail-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .detail-item:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-size: 14px;
              font-weight: 500;
              color: #4b5563;
            }
            .detail-value {
              font-size: 14px;
              font-weight: 600;
              color: #0A0D50;
            }
            @media print {
              body { background: none; }
              .pattern-border, .pattern-border-bottom { display: none; }
              th { background-color: ${themeColor} !important; color: white !important; }
              .report-wrapper { margin: 0; box-shadow: none; }
              thead { display: table-header-group; }
              tfoot { display: table-footer-group; }
              .first-page {
                height: auto;
                page-break-after: always;
              }
              .page-content {
                page-break-before: always;
              }
              .page-break {
                page-break-before: always;
                padding-top: 20px;
              }
              .page-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 24px;
                border-bottom: 1px solid #e5e7eb;
                padding-bottom: 16px;
              }
              .page-header-left {
                display: flex;
                flex-direction: column;
                gap: 4px;
              }
              .page-header-title {
                font-size: 16px;
                font-weight: 600;
                color: ${themeColor};
              }
              .page-header-subtitle {
                font-size: 12px;
                color: #4b5563;
              }
              .page-header-right {
                text-align: right;
                font-size: 12px;
                color: #4b5563;
              }
            }
          </style>
        </head>
        <body>
          <div class="pattern-border"></div>
          <div class="pattern-border-bottom"></div>
          <div class="report-wrapper">
            <div class="content">
              <div class="first-page">
                <div class="center-content">
                  <img src="${logoBase64}" alt="HDC Logo" class="large-logo">
                  <h1 class="main-title">Payment Report</h1>
                  <div class="report-details">
                    <div class="detail-item">
                      <span class="detail-label">Project:</span>
                      <span class="detail-value">${selectedPrintProject}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Generated on:</span>
                      <span class="detail-value">${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              </div>
          <div class="page-content">
            <div class="page-header">
              <div class="page-header-left">
                <div class="page-header-title">Payment Report</div>
                <div class="page-header-subtitle">Project: ${selectedPrintProject}</div>
              </div>
              <div class="report-info">
                <p>Generated on: ${currentDate}</p>
                <p>Project: ${selectedPrintProject}</p>
              </div>
            </div>
            <table>
              <thead>
              <tr>
                <th>Date</th>
                <th>Payment for the Month of</th>
                <th>Name</th>
                <th>Project</th>
                <th>Block & Lot</th>
                <th>Amount</th>
                <th>Penalty</th>
                <th>Payment Type</th>
                <th>Due Date</th>
                <th>VAT</th>
              </tr>
            </thead>
            <tbody>
              ${printRecords.map(record => `
                <tr>
                  <td>${new Date(record.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td>${record["Payment for the Month of"] || ''}</td>
                  <td>${record.Name}</td>
                  <td>${record.Project}</td>
                  <td>Block ${record.Block} Lot ${record.Lot}</td>
                  <td>₱${record.Amount.toLocaleString()}</td>
                  <td>${record.Penalty ? `₱${record.Penalty.toLocaleString()}` : 'N/A'}</td>
                  <td>${record["Payment Type"]}</td>
                  <td>${record["Due Date"] || 'N/A'}</td>
                  <td>${record.Vat || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
              <div class="page-break">
                <div class="page-header">
                  <div class="page-header-left">
                    <div class="page-header-title">Payment Summary</div>
                    <div class="page-header-subtitle">Project: ${selectedPrintProject}</div>
                  </div>
                  <div class="page-header-right">
                    <div>Generated on: ${currentDate}</div>
                  </div>
                </div>
                <div class="total-section">
                <div class="totals mb-4">
                  <p><span>Total Amount:</span> <span class="total-amount">${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(printTotals.amount)}</span></p>
                  <p><span>Total Penalty:</span> <span class="total-amount">${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(printTotals.penalty)}</span></p>
                  <p><span>Grand Total:</span> <span class="total-amount">${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(printTotals.amount + printTotals.penalty)}</span></p>
                  <p><span>Monthly Total:</span> <span class="total-amount">${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(getMonthlyTotal(selectedPrintProject))}</span></p>
                </div>
                <div class="breakdown-section">
                  <p class="breakdown-title">Payment Type Breakdown:</p>
                  ${Object.entries(printTotalsByType)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([type, amount]) => `
                    <div class="breakdown-item">
                      <span>${type}</span>
                      <span>${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount)}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  return (
    <PageTransition>
    <div className="w-full max-w-none mx-auto">
      {/* Single Unified Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden h-[calc(100vh-3rem)]">
        {/* Hero Header Section with Integrated Content */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full transform translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full transform -translate-x-12 translate-y-12"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">Payment Reports</h1>
                <p className="text-slate-300 text-lg mb-6">Comprehensive overview of all payment transactions and reports</p>
              </div>
            </div>

            {/* Combined Summary Stats and Filters Section */}
            <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
              {/* Summary Stats */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mr-2">
                      <File className="w-5 h-5 text-blue-300" />
                    </div>
                    <span className="font-bold text-xl text-white">{filteredRecords.length}</span>
                    <span className="ml-2 text-slate-300 text-sm">Total Records</span>
                  </div>
                </div>
                <div className="w-px h-6 bg-slate-600"></div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <BarChart className="w-5 h-5 text-green-300" />
                  </div>
                  <div>
                    <span className="font-bold text-xl text-white">
                      {new Intl.NumberFormat('en-PH', {
                        style: 'currency',
                        currency: 'PHP',
                        maximumFractionDigits: 0
                      }).format(totals.amount)}
                    </span>
                    <span className="ml-2 text-slate-300 text-sm">Total Amount</span>
                  </div>
                </div>
                <div className="w-px h-6 bg-slate-600"></div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <span className="font-bold text-xl text-white">
                      {new Intl.NumberFormat('en-PH', {
                        style: 'currency',
                        currency: 'PHP',
                        maximumFractionDigits: 0
                      }).format(totals.penalty)}
                    </span>
                    <span className="ml-2 text-slate-300 text-sm">Total Penalties</span>
                  </div>
                </div>
              </div>

              {/* Filters Section */}
              <div className="flex flex-col lg:flex-row lg:items-end gap-3">
                {/* Date Filter */}
                <div className="w-full sm:w-auto">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Filter by Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full h-9 px-3 text-sm bg-slate-700/80 border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-white"
                  />
                </div>

                {/* Search Bar */}
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Search Documents</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Type to search..."
                      className="w-full h-9 pl-3 pr-9 text-sm bg-slate-700/80 border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 placeholder-slate-500 text-white"
                    />
                    <Search className="absolute right-2.5 top-2 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                {/* Payment Type Filter */}
                <div className="w-full lg:w-48">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Payment Type</label>
                  <div className="relative">
                    <select
                      value={selectedPaymentType}
                      onChange={(e) => setSelectedPaymentType(e.target.value)}
                      className="w-full h-9 pl-3 pr-7 text-sm bg-slate-700/80 border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent cursor-pointer appearance-none transition-all duration-200 text-white"
                    >
                      {paymentTypes.map((type) => (
                        <option key={type} value={type}>
                          {type === 'all' ? 'All Types' : type.toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Project Filter */}
                <div className="w-full lg:w-56">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Project</label>
                  <div className="relative">
                    <select
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      className="w-full h-9 pl-3 pr-7 text-sm bg-slate-700/80 border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent cursor-pointer appearance-none transition-all duration-200 text-white"
                    >
                      {projects.map((project) => (
                        <option key={project} value={project}>
                          {project === 'all' ? 'All Projects' : project}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Generate Report Button */}
                <div className="w-full lg:w-auto mt-1">
                  <button
                    onClick={() => setIsPrintModalOpen(true)}
                    className="w-full group relative flex items-center gap-2 justify-center px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform-gpu overflow-hidden">
                    <span className="relative z-10 gap-2 flex items-center">
                      <Printer className="h-4 w-4 text-white/90 group-hover:scale-110 transition-transform duration-200" />
                      <span>Generate Report</span>
                    </span>
                    <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          
        {/* Data Table Section */}
        <div className="flex-1 flex flex-col min-h-0 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v0a2 2 0 012-2h6.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V7" />
              </svg>
              Payment Records
            </h3>
            <span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              <span className="font-semibold text-slate-900">{filteredRecords.length}</span> records
            </span>
          </div>
          
          {/* Table Container with Fixed Height and Scroll */}
          <div className="border border-slate-200 rounded-xl overflow-hidden flex-1 flex flex-col bg-white z-1">
            <div className="overflow-y-auto flex-1" style={{ maxHeight: 'calc(100vh - 300px)' }}>
              <table className="min-w-full table-fixed">
                <thead className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-900 z-10">
                  <tr>
                    <th scope="col" className="px-4 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider w-[180px]">
                      Date
                    </th>
                    <th scope="col" className="px-4 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider w-[180px]">
                      Payment Month
                    </th>
                    <th scope="col" className="px-4 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider w-[200px]">
                      Project
                    </th>
                    <th scope="col" className="px-4 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider w-[180px]">
                      Name
                    </th>
                    <th scope="col" className="px-4 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider w-[100px]">
                      Block
                    </th>
                    <th scope="col" className="px-4 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider w-[100px]">
                      Lot
                    </th>
                    <th scope="col" className="px-4 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider w-[120px]">
                      Amount
                    </th>
                    <th scope="col" className="px-4 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider w-[120px]">
                      Penalty
                    </th>
                    <th scope="col" className="px-4 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider w-[120px]">
                      Payment Type
                    </th>
                    <th scope="col" className="px-4 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider w-[120px]">
                      Due Date
                    </th>
                    <th scope="col" className="px-4 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider w-[100px]">
                      VAT
                    </th>
                    <th scope="col" className="px-4 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider w-[140px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={12} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                          <p className="text-sm text-slate-500">Loading payment records...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="bg-slate-100 rounded-full p-4 mb-4">
                            <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-slate-900 mb-2">No payment records found</h3>
                          <p className="text-sm text-slate-500">
                            {searchTerm ? 'Try adjusting your search criteria or filters' : 'No records available at the moment'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record, index) => (
                      <tr key={record.id} className={`hover:bg-slate-50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-25'}`}>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
                          {new Date(record.created_at).toLocaleDateString('en-PH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">
                          {record["Payment for the Month of"] || '—'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {record.Project}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900">
                          {record.Name}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600 text-center">
                          {record.Block}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600 text-center">
                          {record.Lot}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                          {new Intl.NumberFormat('en-PH', {
                            style: 'currency',
                            currency: 'PHP'
                          }).format(record.Amount)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                          {record.Penalty ? new Intl.NumberFormat('en-PH', {
                            style: 'currency',
                            currency: 'PHP'
                          }).format(record.Penalty) : '₱0.00'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {record["Payment Type"] || 'GCASH'}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">
                          {record["Due Date"] || '—'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">
                          {record.Vat || '—'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(record)}
                              className="text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-all duration-200 flex items-center space-x-1.5 text-xs font-medium"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(record)}
                              className="text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-all duration-200 flex items-center space-x-1.5 text-xs font-medium"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span>Delete</span>
                            </button>
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
      </div>
    </div>

      {/* Print Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 bg-[#162035]">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Printer className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Generate Report</h3>
                </div>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Project Selector */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Select Project</label>
                <div className="relative">
                  <select
                    value={selectedPrintProject}
                    onChange={(e) => setSelectedPrintProject(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none bg-white/50 backdrop-blur-sm"
                  >
                    <option value="">Choose a project</option>
                    {projects.filter(p => p !== 'all').map((project) => (
                      <option key={project} value={project}>{project}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Date Picker */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Select Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1.5">Leave empty to include all records</p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handlePrint}
                disabled={!selectedPrintProject}
                className={`px-5 py-2.5 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ${
                  !selectedPrintProject 
                  ? 'bg-slate-300 cursor-not-allowed' 
                  : 'bg-[#162035] hover:bg-[#1a2742] shadow-sm hover:shadow-md transform hover:-translate-y-0.5'
                }`}
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && recordToDelete && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all">
              <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900">Delete Payment Record</h3>
                </div>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="px-6 py-4">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this payment record? This action cannot be undone.
                </p>
                <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm">
                    <p><span className="font-medium text-gray-900">Client:</span> {recordToDelete.Name}</p>
                    <p><span className="font-medium text-gray-900">Amount:</span> {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(recordToDelete.Amount)}</p>
                    <p><span className="font-medium text-gray-900">Date:</span> {new Date(recordToDelete.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 rounded-b-lg">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {isEditModalOpen && editingRecord && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full transform transition-all">
              <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Edit className="h-5 w-5 text-[#0A0D50]" />
                  <h3 className="text-lg font-medium text-gray-900">Edit Payment Record</h3>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (editingRecord) handleUpdateRecord(editingRecord);
              }} className="px-6 py-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      value={editingRecord.Name}
                      onChange={(e) => setEditingRecord({ ...editingRecord, Name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0A0D50] focus:ring-[#0A0D50] sm:text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Payment for the Month of</label>
                      <select
                        value={editingRecord["Payment for the Month of"] || ''}
                        onChange={(e) => setEditingRecord({ ...editingRecord, "Payment for the Month of": e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0A0D50] focus:ring-[#0A0D50] sm:text-sm"
                      >
                        <option value="">Select month</option>
                        {months.map((month) => (
                          <option key={month} value={month}>{month}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">₱</span>
                        </div>
                        <input
                          type="number"
                          value={editingRecord.Amount}
                          onChange={(e) => setEditingRecord({ ...editingRecord, Amount: parseFloat(e.target.value) })}
                          className="block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-[#0A0D50] focus:ring-[#0A0D50] sm:text-sm"
                          placeholder="0.00"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Penalty</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">₱</span>
                        </div>
                        <input
                          type="number"
                          value={editingRecord.Penalty}
                          onChange={(e) => setEditingRecord({ ...editingRecord, Penalty: parseFloat(e.target.value) })}
                          className="block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-[#0A0D50] focus:ring-[#0A0D50] sm:text-sm"
                          placeholder="0.00"
                          step="0.01"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Payment Type</label>
                      <select
                        value={editingRecord["Payment Type"] || ''}
                        onChange={(e) => setEditingRecord({ ...editingRecord, "Payment Type": e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0A0D50] focus:ring-[#0A0D50] sm:text-sm"
                      >
                        {paymentTypes.filter(type => type !== 'all').map((type) => (
                          <option key={type} value={type}>
                            {type.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {/* VAT Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">VAT</label>
                    <select
                      value={editingRecord.Vat || ''}
                      onChange={e => setEditingRecord({ ...editingRecord, Vat: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0A0D50] focus:ring-[#0A0D50] sm:text-sm"
                    >
                      <option value="Non Vat">Non Vat</option>
                      <option value="Vatable">Vatable</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Block</label>
                      <input
                        type="text"
                        value={editingRecord.Block}
                        onChange={(e) => setEditingRecord({ ...editingRecord, Block: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0A0D50] focus:ring-[#0A0D50] sm:text-sm"
                        placeholder="Enter block number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Lot</label>
                      <input
                        type="text"
                        value={editingRecord.Lot}
                        onChange={(e) => setEditingRecord({ ...editingRecord, Lot: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0A0D50] focus:ring-[#0A0D50] sm:text-sm"
                        placeholder="Enter lot number"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Project</label>
                    <select
                      value={editingRecord.Project}
                      onChange={(e) => setEditingRecord({ ...editingRecord, Project: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0A0D50] focus:ring-[#0A0D50] sm:text-sm"
                    >
                      {projects.filter(project => project !== 'all').map((project) => (
                        <option key={project} value={project}>
                          {project}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0A0D50]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-[#0A0D50] rounded-md hover:bg-[#141B7A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0A0D50]"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </PageTransition> 
  );
};

export default ReportPage;
