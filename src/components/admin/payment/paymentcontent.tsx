import React, { useState, useEffect, Fragment, useMemo } from 'react';
import { supabase } from '../../../supabase/supabaseClient';
import { X} from 'lucide-react';
import { Dialog, Transition, Combobox } from '@headlessui/react';
import { ChevronsDownUp } from 'lucide-react';
import toast from 'react-hot-toast';

// Helper to format 'YYYY-MM-DD' or 'YYYY-MM' to 'Month YYYY' (e.g., 'April 2025')
function formatMonthYear(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  // Accepts 'YYYY-MM-DD' or 'YYYY-MM' or 'YYYY/MM/DD'
  let d = dateStr;
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) d = d.slice(0, 7); // 'YYYY-MM'
  if (/^\d{4}-\d{2}$/.test(d)) {
    const [year, month] = d.split('-');
    const monthNum = parseInt(month, 10);
    if (monthNum >= 1 && monthNum <= 12) {
      const date = new Date(Number(year), monthNum - 1);
      return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    }
  }
  return 'N/A';
}


interface Payment {
  id: number;
  Name: string;
  "Block & Lot": string;
  "Payment Amount": number;
  "Penalty Amount"?: number | null;
  Vat?: string | null;

  "Date of Payment": string;
  Status: string;
  receipt_path: string;
  ar_receipt_path?: string;
  notified?: boolean;
  Project: string;
  "Payment Type"?: string;
  "Month of Payment": string;
  "MONTHS PAID"?: number | null;
  "Reference Number"?: string;
  "Due Date"?: string;
}

interface ViewReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptUrl: string | null;
  isLoading: boolean;
  payment: Payment | null;
}

interface UploadPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: () => void;
}

interface EditPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  onSave: () => void;
}

const ViewReceiptModal: React.FC<ViewReceiptModalProps> = ({ isOpen, onClose, receiptUrl, isLoading, payment }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Enhanced download function with payment details
  const downloadReceiptAsImage = async (receiptUrl: string, payment: any, format: string = 'png') => {
    setIsDownloading(true);
    try {
      // Create a temporary container
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.width = '794px'; // A4 width in pixels at 96 DPI
      container.style.minHeight = '1123px'; // A4 height in pixels at 96 DPI
      container.style.backgroundColor = 'white';
      container.style.fontFamily = 'Arial, sans-serif';
      container.style.padding = '40px';
      container.style.boxSizing = 'border-box';

      // Create the HTML content
      container.innerHTML = `
  <div style="
    max-width: 800px; 
    margin: 0 auto; 
    padding: 40px; 
    background: #ffffff; 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #1f2937;
  ">
    <!-- Header -->
    <div style="
      text-align: center; 
      margin-bottom: 40px;
      padding-bottom: 24px;
      border-bottom: 1px solid #e5e7eb;
    ">
      <h1 style="
        margin: 0 0 8px 0; 
        color: #111827; 
        font-size: 32px; 
        font-weight: 700;
        letter-spacing: -0.025em;
      ">Payment Receipt</h1>
      <p style="
        margin: 0;
        color: #6b7280;
        font-size: 16px;
      ">Official Payment Confirmation</p>
    </div>
    
    <!-- Payment Details Card -->
    <div style="
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 32px;
      margin-bottom: 32px;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    ">
      <div style="
        display: grid;
        gap: 20px;
        grid-template-columns: 1fr;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px;">
          <span style="font-weight: 600; color: #374151; font-size: 15px;">Customer Name</span>
          <span style="color: #111827; font-size: 15px;">${payment.Name}</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
          <span style="font-weight: 600; color: #374151; font-size: 15px;">Block & Lot</span>
          <span style="color: #111827; font-size: 15px;">${payment['Block & Lot']}</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
          <span style="font-weight: 600; color: #374151; font-size: 15px;">Project</span>
          <span style="color: #111827; font-size: 15px;">${payment.Project}</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
          <span style="font-weight: 600; color: #374151; font-size: 15px;">Payment Date</span>
          <span style="color: #111827; font-size: 15px;">${payment['Date of Payment']}</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
          <span style="font-weight: 600; color: #374151; font-size: 15px;">Payment Period</span>
          <span style="color: #111827; font-size: 15px;">${formatMonthYear(payment['Month of Payment'])}</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
          <span style="font-weight: 600; color: #374151; font-size: 15px;">Due Date</span>
          <span style="color: #111827; font-size: 15px;">${payment['Due Date'] || 'N/A'}</span>
        </div>
        
        <!-- Amount - Highlighted -->
        <div style="
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          padding: 20px;
          margin-top: 12px;
          background: #dbeafe;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
        ">
          <span style="font-weight: 700; color: #1e40af; font-size: 18px;">Total Amount</span>
          <span style="font-weight: 800; color: #1e40af; font-size: 24px;">₱${payment['Payment Amount'].toLocaleString()}</span>
        </div>
      </div>
    </div>
    
    <!-- Receipt Image -->
    <div style="
      text-align: center;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    ">
      <h3 style="
        margin: 0 0 20px 0;
        color: #374151;
        font-size: 18px;
        font-weight: 600;
      ">Receipt Document</h3>
      
      <img 
        id="receipt-img" 
        src="${receiptUrl}" 
        style="
          max-width: 100%; 
          height: auto; 
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease-in-out;
        " 
        alt="Payment Receipt"
        onmouseover="this.style.transform='scale(1.02)'"
        onmouseout="this.style.transform='scale(1)'"
      />
    </div>
    
    <!-- Footer -->
    <div style="
      text-align: center;
      margin-top: 40px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
    ">
      <p style="
        margin: 0;
        color: #9ca3af;
        font-size: 14px;
      ">Thank you for your payment • This is an official receipt</p>
    </div>
  </div>
`;

      document.body.appendChild(container);

      // Wait for the image to load
      const img = container.querySelector('#receipt-img') as HTMLImageElement;
      await new Promise<void>((resolve, reject) => {
        if (img && img.complete) {
          resolve();
        } else if (img) {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Failed to load image'));
        } else {
          reject(new Error('Image element not found'));
        }
      });

      // Dynamically import html2canvas
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(container, {
        backgroundColor: 'white',
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: 794,
        height: container.scrollHeight
      });

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `payment_receipt_${payment?.Name?.replace(/\s+/g, '_') || 'unknown'}_${new Date().toISOString().split('T')[0]}.${format}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }, `image/${format}`, 0.95);

      // Clean up
      document.body.removeChild(container);

    } catch (error) {
      console.error('Error generating image:', error);
      alert('Error generating image. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4 flex justify-between items-center">
                  Payment Receipt
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => {
                        if (receiptUrl && payment) {
                          const printWindow = window.open('', '_blank');
                          if (printWindow) {
                            printWindow.document.write(`
                              <!DOCTYPE html>
                              <html>
                                <head>
                                  <title>Payment Receipt</title>
                                  <style>
                                    @media print {
                                      @page { 
                                        margin: 0;
                                        size: A4 portrait;
                                      }
                                      body { 
                                        margin: 1cm;
                                        -webkit-print-color-adjust: exact;
                                        print-color-adjust: exact;
                                      }
                                    }
                                    @page {
                                      size: A4;
                                      margin: 0;
                                    }
                                    body {
                                      font-family: Arial, sans-serif;
                                      line-height: 1.4;
                                      color: #333;
                                      width: 210mm;
                                      min-height: 297mm;
                                      margin: 0 auto;
                                      padding: 15mm;
                                      box-sizing: border-box;
                                    }
                                    .receipt-header {
                                      text-align: center;
                                      padding: 10px 0;
                                      margin-bottom: 15px;
                                      border-bottom: 2px solid #2563eb;
                                    }
                                    .receipt-header h2 {
                                      margin: 0;
                                      color: #2563eb;
                                      font-size: 20px;
                                      font-weight: bold;
                                    }
                                    .client-details {
                                      width: 100%;
                                      margin-bottom: 15px;
                                      padding: 15px;
                                      background: #f8fafc;
                                      border: 1px solid #e2e8f0;
                                      border-radius: 4px;
                                    }
                                    .detail-row {
                                      display: flex;
                                      align-items: center;
                                      margin-bottom: 6px;
                                      font-size: 13px;
                                    }
                                    .detail-row:last-child {
                                      margin-bottom: 0;
                                      padding-top: 6px;
                                      border-top: 1px solid #e2e8f0;
                                    }
                                    .detail-label {
                                      color: #1e40af;
                                      font-weight: 600;
                                      width: 180px;
                                      flex-shrink: 0;
                                    }
                                    .detail-value {
                                      flex-grow: 1;
                                    }
                                    .receipt-image-container {
                                      width: 100%;
                                      text-align: center;
                                      max-height: calc(297mm - 140mm);
                                      overflow: hidden;
                                    }
                                    .receipt-image {
                                      width: 65%;
                                      height: auto;
                                      max-height: calc(297mm - 150mm);
                                      object-fit: contain;
                                      border: 1px solid #e2e8f0;
                                      border-radius: 4px;
                                      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                                    }
                                  </style>
                                </head>
                                <body onload="window.print();window.close()">
                                  <div class="container">
                                    <div class="receipt-header">
                                      <h2>Payment Receipt</h2>
                                    </div>
                                    <div class="client-details">
                                      <div class="detail-row">
                                        <div class="detail-label">Name:</div>
                                        <div class="detail-value">${payment.Name}</div>
                                      </div>
                                      <div class="detail-row">
                                        <div class="detail-label">Block & Lot:</div>
                                        <div class="detail-value">${payment['Block & Lot']}</div>
                                      </div>
                                      <div class="detail-row">
                                        <div class="detail-label">Project:</div>
                                        <div class="detail-value">${payment.Project}</div>
                                      </div>
                                      <div class="detail-row">
                                        <div class="detail-label">Date:</div>
                                        <div class="detail-value">${payment['Date of Payment']}</div>
                                      </div>
                                      <div class="detail-row">
                                        <div class="detail-label">Payment For The Month Of:</div>
                                        <div class="detail-value">${formatMonthYear(payment['Month of Payment'])}</div>
                                      </div>
                                      <div class="detail-row">
                                        <div class="detail-label">Due Date:</div>
                                        <div class="detail-value">${payment['Due Date'] || 'N/A'}</div>
                                      </div>
                                      <div class="detail-row">
                                        <div class="detail-label">Amount:</div>
                                        <div class="detail-value">₱${payment['Payment Amount'].toLocaleString()}</div>
                                      </div>
                                    </div>
                                    <div class="receipt-image-container">
                                      <img src="${receiptUrl}" class="receipt-image" alt="Receipt" />
                                    </div>
                                  </div>
                                </body>
                              </html>
                            `);
                            printWindow.document.close();
                          }
                        }
                      }}
                      className="text-blue-600 hover:text-blue-700 focus:outline-none p-1.5 rounded-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!receiptUrl}
                      title="Print Receipt"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        if (receiptUrl && payment && !isDownloading) {
                          downloadReceiptAsImage(receiptUrl, payment, 'png');
                        }
                      }}
                      className="text-green-600 hover:text-green-700 focus:outline-none p-1.5 rounded-md hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed relative"
                      disabled={!receiptUrl || isDownloading}
                      title={isDownloading ? "Generating image..." : "Download as PNG with Details"}
                    >
                      {isDownloading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-gray-500 focus:outline-none p-1.5 hover:bg-gray-100 rounded-md"
                      title="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </Dialog.Title>

                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : receiptUrl ? (
                  <div className="relative max-h-[80vh] overflow-hidden flex items-center justify-center">
                    <img
                      src={receiptUrl}
                      className="max-w-full max-h-[75vh] object-contain rounded-lg"
                      alt="Payment Receipt"
                      style={{ margin: 'auto' }} />
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No receipt available
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

interface ClientData {
  Name: string;
  Project: string;
  'Block & Lot': string;
}

const UploadPaymentModal: React.FC<UploadPaymentModalProps> = ({ isOpen, onClose, onUpload }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedName, setSelectedName] = useState<string>('');
  const [query, setQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedBlockLot, setSelectedBlockLot] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [penalty, setPenalty] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [paymentMonth, setPaymentMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [dueDate, setDueDate] = useState<string>('15th');
  const [vat, setVat] = useState<string>('Non Vat');
  const [clients, setClients] = useState<ClientData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        console.log('Modal open status:', isOpen);
        console.log('Fetching clients from Balance table...');
        
        const { data, error } = await supabase
          .from('Balance')
          .select('Name, Project, Block, Lot');

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        
        console.log('Raw data from Balance table:', data);
        
        if (!data || data.length === 0) {
          console.log('No data received from Balance table');
          return;
        }

        // Map the data to ensure we have the correct property names
        const mappedData = data.map(item => ({
          Name: item.Name,
          Project: item.Project,
          'Block & Lot': `Block ${item.Block} Lot ${item.Lot}`
        }));

        console.log('Mapped data:', mappedData);

        // Remove duplicates based on all fields
        const uniqueClients = mappedData.filter((client, index, self) =>
          index === self.findIndex(c => 
            c.Name === client.Name && 
            c.Project === client.Project && 
            c['Block & Lot'] === client['Block & Lot']
          )
        );

        console.log('Unique clients after filtering:', uniqueClients);
        setClients(uniqueClients);
      } catch (error) {
        console.error('Error fetching clients:', error);
        toast.error('Failed to load client list');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      console.log('Modal opened, fetching clients...');
      fetchClients();
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setSelectedName('');
      setSelectedProject('');
      setSelectedBlockLot('');
      setAmount('');
      setPenalty('');
      setReferenceNumber('');
      setPaymentDate('');
      setPaymentMonth('');
      setVat('Non Vat'); // Reset VAT
    }
  }, [isOpen]);

  // Derived state for filtered options
  const availableProjects = useMemo(() => {
    if (!selectedName) return [];
    return [...new Set(clients
      .filter(client => client.Name === selectedName)
      .map(client => client.Project))];
  }, [clients, selectedName]);

  const availableBlockLots = useMemo(() => {
    if (!selectedName || !selectedProject) return [];
    return [...new Set(clients
      .filter(client => 
        client.Name === selectedName && 
        client.Project === selectedProject)
      .map(client => client['Block & Lot']))];
  }, [clients, selectedName, selectedProject]);

  // Get unique client names
  const uniqueNames = useMemo(() => {
    if (!clients) return [];
    const names = Array.from(new Set(clients.map(client => client.Name || ''))).filter(Boolean);
    return names.sort();
  }, [clients]);

  const filteredNames = useMemo(() => {
    if (!uniqueNames) return [];
    if (!query) return uniqueNames;
    return uniqueNames.filter((name) =>
      name.toLowerCase().includes(query.toLowerCase())
    );
  }, [uniqueNames, query]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    // Validate required fields
    if (!file || !selectedName || !selectedProject || !selectedBlockLot || !amount || !paymentDate || !paymentMonth || !referenceNumber) {
      toast.error('Please fill in all required fields');
      return;
    }
  
    setIsUploading(true);
    
    // Create loading toast once
    const loadingToastId = toast.loading('Uploading receipt...');
  
    try {
      // 1. Upload file to storage
      const fileExt = file.name.split('.').pop() || '';
      const timestamp = new Date().getTime();
      const fileName = `${selectedName.trim()}_${timestamp}.${fileExt}`;
      const filePath = `${selectedProject}/${selectedName.trim()}/${fileName}`;
  
      const { error: uploadError, data } = await supabase.storage
        .from('Payment Receipt')
        .upload(filePath, file, { upsert: true });
  
      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Failed to upload receipt: ${uploadError.message}`);
      }
  
      if (!data?.path) {
        throw new Error('No file path returned from upload');
      }
  
      // Update the existing toast instead of creating a new one
      toast.success('Receipt uploaded! Saving payment details...', { id: loadingToastId });
      
      // Create a new loading toast for the database operation
      const dbLoadingToastId = toast.loading('Saving payment details...');
  
      // 2. Save to Payment table
      const { error: dbError } = await supabase
        .from('Payment')
        .insert({
          "receipt_path": data.path,
          "Block & Lot": selectedBlockLot,
          "Payment Amount": parseFloat(amount),
          "Penalty Amount": penalty ? parseFloat(penalty) : null,
          "Date of Payment": paymentDate,
          "Month of Payment": paymentMonth + "-01", // Add day to make it a valid date
          "Due Date": dueDate,
          "Name": selectedName,
          "Project": selectedProject,
          "Status": "Pending",
          "Reference Number": referenceNumber,
          "Vat": vat, // Save VAT selection
          created_at: new Date().toISOString()
        });
  
      if (dbError) {
        // Dismiss the database loading toast before showing error
        toast.dismiss(dbLoadingToastId);
        throw new Error(`Error saving payment information: ${dbError.message}`);
      }
  
      // Success - dismiss loading toast and show success
      toast.dismiss(dbLoadingToastId);
      toast.success('Payment uploaded successfully!');
      
      onUpload();
      onClose();
    } catch (err: any) {
      console.error('Error uploading payment:', err);
      toast.error(err.message, { id: loadingToastId });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>
  
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl bg-white rounded-lg shadow-lg">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                    Upload Payment
                  </Dialog.Title>
                  <p className="text-sm text-gray-500 mt-1">Fill in the payment details below</p>
                </div>
  
                {/* Content */}
                <div className="px-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Client Name - Full Width */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Client Name <span className="text-red-500">*</span>
                      </label>
                      <Combobox
                        value={selectedName}
                        onChange={(value: string) => {
                          setSelectedName(value);
                          setSelectedProject('');
                          setSelectedBlockLot('');
                        }}
                      >
                        <div className="relative">
                          <div className="flex">
                            <Combobox.Input
                              className="w-full border border-gray-300 rounded-l-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              onChange={(event) => setQuery(event.target.value)}
                              displayValue={(item: string) => item}
                              placeholder="Search for client name..."
                            />
                            <Combobox.Button className="border border-l-0 border-gray-300 rounded-r-md px-2 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500">
                              <ChevronsDownUp className="h-4 w-4 text-gray-400" />
                            </Combobox.Button>
                          </div>
                          <Combobox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto bg-white border border-gray-300 rounded-md shadow-lg">
                            {filteredNames.length === 0 ? (
                              <div className="py-2 px-3 text-sm text-gray-500">
                                Nothing found.
                              </div>
                            ) : (
                              filteredNames.map((name) => (
                                <Combobox.Option
                                  key={name}
                                  value={name}
                                  className={({ active }) =>
                                    `cursor-pointer select-none py-2 px-3 text-sm ${
                                      active ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                                    }`
                                  }
                                >
                                  {({ selected }) => (
                                    <span className={selected ? 'font-medium' : 'font-normal'}>
                                      {name}
                                    </span>
                                  )}
                                </Combobox.Option>
                              ))
                            )}
                          </Combobox.Options>
                        </div>
                      </Combobox>
                      {isLoading && (
                        <p className="text-sm text-blue-600 mt-1 flex items-center">
                          <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Loading clients...
                        </p>
                      )}
                    </div>
  
                    {/* Project */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Project <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedProject}
                        onChange={(e) => {
                          setSelectedProject(e.target.value);
                          setSelectedBlockLot('');
                        }}
                        disabled={!selectedName || isLoading}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                      >
                        <option value="">Select Project</option>
                        {availableProjects.map((project) => (
                          <option key={project} value={project}>
                            {project}
                          </option>
                        ))}
                      </select>
                    </div>
  
                    {/* Block & Lot */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Block & Lot <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedBlockLot}
                        onChange={(e) => setSelectedBlockLot(e.target.value)}
                        disabled={!selectedProject || isLoading}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                      >
                        <option value="">Select Block & Lot</option>
                        {availableBlockLots.map((blockLot) => (
                          <option key={blockLot} value={blockLot}>
                            {blockLot}
                          </option>
                        ))}
                      </select>
                    </div>
  
                    {/* Payment Amount */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Amount <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
  
                    {/* Reference Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reference Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter reference number"
                      />
                    </div>
  
                    {/* VAT */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        VAT <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={vat}
                        onChange={e => setVat(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="Non Vat">Non Vat</option>
                        <option value="Vatable">Vatable</option>
                      </select>
                    </div>
  
                    {/* Penalty */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Penalty <span className="text-gray-400">(if applicable)</span>
                      </label>
                      <input
                        type="number"
                        value={penalty}
                        onChange={(e) => setPenalty(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
  
                    {/* Date of Payment */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Payment <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
  
                    {/* Month of Payment */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Month of Payment <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="month"
                        value={paymentMonth}
                        onChange={(e) => {
                          const selectedValue = e.target.value;
                          setPaymentMonth(selectedValue);
                        }}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
  
                    {/* Due Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Due Date <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="15th">15th</option>
                        <option value="30th">30th</option>
                      </select>
                    </div>
  
                    {/* Receipt Image - Full Width */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Receipt Image <span className="text-red-500">*</span>
                      </label>
                      <div 
                        className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-gray-400 cursor-pointer"
                        onClick={() => document.getElementById('receipt-upload')?.click()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const droppedFile = e.dataTransfer.files[0];
                          if (droppedFile && droppedFile.type.startsWith('image/')) {
                            setFile(droppedFile);
                          }
                        }}
                        onDragOver={(e) => e.preventDefault()}
                      >
                        <input
                          id="receipt-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        {file ? (
                          <div className="flex items-center justify-center">
                            <div className="flex items-center space-x-2">
                              <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-sm text-gray-600">{file.name}</span>
                              <span className="text-xs text-gray-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="mt-2 text-sm text-gray-600">
                              <span className="font-medium">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 10MB</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
  
                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                    onClick={handleUpload}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Uploading...
                      </>
                    ) : (
                      'Upload Payment'
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

const EditPaymentModal: React.FC<EditPaymentModalProps> = ({ isOpen, onClose, payment, onSave }) => {
  const [editedPayment, setEditedPayment] = useState<Payment | null>(null);

  useEffect(() => {
    setEditedPayment(payment);
  }, [payment]);

  const handleSave = async () => {
    if (!editedPayment) return;

    try {
      console.log('Attempting to update payment with:', editedPayment);
      const { data, error } = await supabase
        .from('Payment')
        .update({
          Name: editedPayment.Name,
          'Block & Lot': editedPayment['Block & Lot'],
          'Payment Amount': editedPayment['Payment Amount'],
          'Penalty Amount': editedPayment['Penalty Amount'],
          Vat: editedPayment.Vat,
          'Date of Payment': editedPayment['Date of Payment'],
          'Month of Payment': editedPayment['Month of Payment'],
          'Reference Number': editedPayment['Reference Number'],
          Project: editedPayment.Project,
          'Payment Type': editedPayment['Payment Type'],
          'MONTHS PAID': editedPayment['MONTHS PAID'],
          'Due Date': editedPayment['Due Date']
        })
        .eq('id', editedPayment.id);
      console.log('Supabase update result:', { data, error });
      if (error) throw error;
      
      toast.success('Payment updated successfully');
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error updating payment:', error);
      toast.error(`Failed to update payment: ${error?.message || JSON.stringify(error)}`);
    }
  };


  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!editedPayment) return null;

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!editedPayment?.Name?.trim()) newErrors.Name = 'Name is required.';
    if (!editedPayment?.['Payment Amount'] && editedPayment?.['Payment Amount'] !== 0) newErrors['Payment Amount'] = 'Payment Amount is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveWithValidation = async () => {
    if (!validate()) return;
    await handleSave();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>
  
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl bg-white rounded-lg shadow-lg">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Edit Payment
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">Update payment details • {payment?.Name}</p>
                    </div>
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
  
                {/* Content */}
                <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                  <div className="space-y-6">
                    {/* Payment Details */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Payment Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={editedPayment.Name}
                            onChange={(e) => setEditedPayment({ ...editedPayment, Name: e.target.value })}
                            className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${errors.Name ? 'border-red-400' : 'border-gray-300'}`}
                          />
                          {errors.Name && <p className="text-xs text-red-500 mt-1">{errors.Name}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Block & Lot</label>
                          <input
                            type="text"
                            value={editedPayment['Block & Lot']}
                            onChange={(e) => setEditedPayment({ ...editedPayment, 'Block & Lot': e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount <span className="text-red-500">*</span></label>
                          <input
                            type="number"
                            value={editedPayment['Payment Amount']}
                            onChange={(e) => setEditedPayment({ ...editedPayment, 'Payment Amount': parseFloat(e.target.value) })}
                            className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${errors['Payment Amount'] ? 'border-red-400' : 'border-gray-300'}`}
                          />
                          {errors['Payment Amount'] && <p className="text-xs text-red-500 mt-1">{errors['Payment Amount']}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Penalty Amount</label>
                          <input
                            type="number"
                            value={editedPayment['Penalty Amount'] || ''}
                            onChange={(e) => setEditedPayment({ ...editedPayment, 'Penalty Amount': e.target.value ? parseFloat(e.target.value) : null })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Payment</label>
                          <input
                            type="date"
                            value={editedPayment['Date of Payment'].split('T')[0]}
                            onChange={(e) => setEditedPayment({ ...editedPayment, 'Date of Payment': e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Month of Payment</label>
                          <input
                            type="month"
                            value={editedPayment['Month of Payment']?.split('T')[0].slice(0, 7)}
                            onChange={(e) => setEditedPayment({ ...editedPayment, 'Month of Payment': e.target.value + '-01' })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                          <input
                            type="text"
                            value={editedPayment['Reference Number'] || ''}
                            onChange={(e) => setEditedPayment({ ...editedPayment, 'Reference Number': e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                          <select
                            value={editedPayment.Project}
                            onChange={(e) => setEditedPayment({ ...editedPayment, Project: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="Living Water Subdivision">Living Water Subdivision</option>
                            <option value="Havahills Estate">Havahills Estate</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                          <select
                            value={editedPayment['Due Date'] || ''}
                            onChange={(e) => setEditedPayment({ ...editedPayment, 'Due Date': e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select Due Date</option>
                            <option value="15th">15th</option>
                            <option value="30th">30th</option>
                          </select>
                        </div>
                      </div>
                    </div>
  
                    {/* VAT Details */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">VAT Details</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">VAT Type <span className="text-red-500">*</span></label>
                        <select
                          value={editedPayment.Vat ?? ''}
                          onChange={e => setEditedPayment({ ...editedPayment, Vat: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select VAT Type</option>
                          <option value="Vatable">Vatable</option>
                          <option value="Non Vat">Non Vat</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Choose if this payment is subject to VAT or not.</p>
                      </div>
                    </div>
                  </div>
                </div>
  
                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveWithValidation}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    Save Changes
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

const PaymentPage: React.FC = () => {
  // ...existing state
  const [showNoARReceiptsOnly, setShowNoARReceiptsOnly] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [totalPaymentCount, setTotalPaymentCount] = useState<number>(0);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(500); // Show 50 records per page
  
  const projects = [
    'all',
    'Living Water Subdivision',
    'Havahills Estate'
  ];

  const statuses = [
    { value: 'all', label: 'All Status' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' }
  ];

  const handleUploadReceipt = async (payment: Payment, file: File, isAR: boolean = false) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${payment.Name.replace(/\s+/g, '_')}_${isAR ? 'AR_' : ''}${Date.now()}.${fileExt}`;
      const filePath = `${payment.Project}/${payment.Name}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(isAR ? 'ar-receipt' : 'Payment Receipt')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('Payment')
        .update({ 
          [isAR ? 'ar_receipt_path' : 'receipt_path']: filePath 
        })
        .eq('id', payment.id);

      if (updateError) throw updateError;

      toast.success(`${isAR ? 'AR' : ''} Receipt uploaded successfully`);
      await fetchAllPayments();
    } catch (error) {
      console.error('Error uploading receipt:', error);
      toast.error('Failed to upload receipt');
    }
  };

  const handleViewReceipt = async (payment: Payment, isAR: boolean = false) => {
    if (!payment?.Name) {
      toast.error('Payment information not found');
      return;
    }

    setIsLoadingReceipt(true);
    setIsReceiptModalOpen(true);
    setReceiptUrl(null);
    setViewingPayment(payment);

    try {
      const receiptPath = isAR ? payment.ar_receipt_path : payment.receipt_path;
      if (!receiptPath) {
        toast.error('Receipt not found');
        setIsLoadingReceipt(false);
        return;
      }

      const { data, error } = await supabase.storage
        .from(isAR ? 'ar-receipt' : 'Payment Receipt')
        .download(receiptPath);

      if (error) {
        console.error('Error downloading receipt:', error);
        toast.error('Failed to download receipt');
        setIsLoadingReceipt(false);
        return;
      }

      if (data instanceof Blob) {
        const objectUrl = URL.createObjectURL(data);
        setReceiptUrl(objectUrl);

        const cleanup = () => {
          URL.revokeObjectURL(objectUrl);
          setReceiptUrl(null);
          setViewingPayment(null);
        };

        return cleanup;
      }
    } catch (err) {
      console.error('Error viewing receipt:', err);
      toast.error('Failed to view receipt. Please try again later.');
    } finally {
      setIsLoadingReceipt(false);
    }
  };

  useEffect(() => {
    fetchAllPayments();
  }, [currentPage]); // Refetch when page changes

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedProject, selectedStatus, showNoARReceiptsOnly]);

  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const matchesSearch = payment.Name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProject = selectedProject === 'all' || payment.Project === selectedProject;
      const matchesStatus = selectedStatus === 'all' || payment.Status === selectedStatus;
      const matchesNoAR = !showNoARReceiptsOnly || !payment.ar_receipt_path;
      return matchesSearch && matchesProject && matchesStatus && matchesNoAR;
    });
  }, [payments, searchTerm, selectedProject, selectedStatus, showNoARReceiptsOnly]);

  const fetchAllPayments = async () => {
    setIsLoadingPayments(true);
    try {
      // First, get the total count
      const { count, error: countError } = await supabase
        .from('Payment')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;
      setTotalPaymentCount(count ?? 0);

      // Calculate offset for pagination
      const offset = (currentPage - 1) * pageSize;

      // Fetch paginated records
      const { data, error } = await supabase
        .from('Payment')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const handleConfirmPayment = async (payment: Payment) => {
    try {
      const { error } = await supabase
        .from('Payment')
        .update({ Status: 'Approved' })
        .eq('id', payment.id);

      if (error) throw error;
      
      toast.success('Payment confirmed successfully');
      await fetchAllPayments(); // Refresh the payments list
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('Failed to confirm payment');
    }
  };

  // Handler for deleting a payment
  const handleDeletePayment = async (payment: Payment) => {
    try {
      const { error } = await supabase
        .from('Payment')
        .delete()
        .eq('id', payment.id);
      if (error) throw error;
      toast.success('Payment deleted successfully');
      await fetchAllPayments();
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('Failed to delete payment');
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalPaymentCount / pageSize);
  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalPaymentCount);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <>
      <div className="min-h-[90vh] overflow-hidden">
        <div className="h-full">
          {/* Single Card Container */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden h-[calc(100vh-4.5rem)]">
            {/* Hero Header Section */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-5 relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full transform translate-x-16 -translate-y-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full transform -translate-x-12 translate-y-12"></div>
              
              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-white mb-2">
                      Payment Records
                    </h1>
                    <p className="text-slate-300 mb-4">
                      Manage and track all payment records in one place
                    </p>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <div>
                          <span className="font-bold text-xl text-white">{totalPaymentCount}</span>
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
                          <span className="font-bold text-xl text-white">{filteredPayments.length}</span>
                          <span className="ml-2 text-slate-300 text-sm">Showing</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Search and Filters - Integrated into Header */}
                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                    {/* Search Bar */}
                    <div className="w-full md:w-64">
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

                    {/* Upload Button */}
                    <button
                      onClick={() => setIsUploadModalOpen(true)}
                      className="h-10 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-all duration-200 shadow-sm hover:shadow-md self-end"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Upload Payment
                    </button>
                  </div>
                </div>

                {/* Bottom Filters */}
                <div className="mt-6 pt-4 border-t border-slate-700">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                      {/* No AR Receipt Filter */}
                      <label className="flex items-center space-x-2 text-sm text-slate-200">
                        <input
                          type="checkbox"
                          checked={showNoARReceiptsOnly}
                          onChange={e => setShowNoARReceiptsOnly(e.target.checked)}
                          className="form-checkbox h-4 w-4 text-blue-400 bg-slate-700 border-slate-600 rounded focus:ring-blue-400"
                        />
                        <span>No AR Receipt</span>
                      </label>

                      {/* Project Filter */}
                      <div className="relative">
                        <select
                          value={selectedProject}
                          onChange={(e) => setSelectedProject(e.target.value)}
                          className="block w-48 h-10 pl-3 pr-10 text-sm bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white cursor-pointer appearance-none"
                        >
                          {projects.map((project) => (
                            <option key={project} value={project}>
                              {project === 'all' ? 'All Projects' : project}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      
                      {/* Status Filter */}
                      <div className="relative">
                        <select
                          value={selectedStatus}
                          onChange={(e) => setSelectedStatus(e.target.value)}
                          className="block w-48 h-10 pl-3 pr-10 text-sm bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white cursor-pointer appearance-none"
                        >
                          {statuses.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-slate-300">
                        {totalPaymentCount > 0 ? (
                          <>Showing {startRecord}-{endRecord} of {totalPaymentCount}</>
                        ) : (
                          'No records'
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handlePreviousPage}
                          disabled={currentPage <= 1 || isLoadingPayments}
                          className="p-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <span className="text-sm text-slate-300 min-w-[60px] text-center">
                          {currentPage} / {totalPages}
                        </span>
                        <button
                          onClick={handleNextPage}
                          disabled={currentPage >= totalPages || isLoadingPayments}
                          className="p-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Table Section - No scrolling */}
            <div className="flex-1 overflow-hidden">
              {isLoadingPayments ? (
                <div className="flex justify-center py-12">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-200 border-t-blue-600"></div>
                    <p className="text-sm text-slate-600 font-medium">Loading payments...</p>
                  </div>
                </div>
              ) : filteredPayments.length > 0 ? (
                <div className="overflow-y-auto h-full">
                <div className="max-h-[80vh] flex-1 overflow-auto bg-white rounded-xl shadow-sm border border-slate-200/60">
                  {/* Horizontal Scroll Wrapper */}
                  <div className="overflow-x-auto">
                    <table className="min-w-[1500px] table-auto">
                      <thead className="sticky top-0 z-10 bg-white">
                        <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">Payment Date</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">Payment For The Month Of</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">Due Date</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">Name</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">Reference Number</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">Project</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">Block & Lot</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">Amount</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">Penalty Amount</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">VAT</th>
                          <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">Client Receipt</th>
                          <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">AR Receipt</th>
                          <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">Action</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredPayments.map((payment, index) => (
                          <tr key={index} className="group hover:bg-slate-50/80 transition-all duration-200 border-b border-slate-50 last:border-b-0">
                            <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-slate-700">
                              {new Date(payment["Date of Payment"]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-600">
                              {payment["Month of Payment"] ? new Date(payment["Month of Payment"]).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-600">
                              {payment["Due Date"] || 'N/A'}
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-sm font-semibold text-slate-800">
                              {payment.Name}
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-slate-700">
                              {payment["Reference Number"] || 'N/A'}
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-600">
                              {payment.Project}
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-600">
                              {payment["Block & Lot"]}
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-sm font-semibold text-slate-800">
                              <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200/60 shadow-sm">
                                ₱{payment["Payment Amount"].toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-600">
                              {payment["Penalty Amount"] ? (
                                <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200/60 shadow-sm">
                                  ₱{payment["Penalty Amount"].toLocaleString()}
                                </div>
                              ) : (
                                <span className="text-slate-400">N/A</span>
                              )}
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-600">
                              {payment.Vat || 'N/A'}
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-center">
                              {payment.receipt_path ? (
                                <button
                                  onClick={() => handleViewReceipt(payment)}
                                  disabled={isLoadingReceipt}
                                  className={`inline-flex items-center px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 rounded-lg border border-blue-200 hover:border-blue-300 transition-all duration-200 text-xs font-semibold shadow-sm hover:shadow-md ${
                                    isLoadingReceipt ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                >
                                  {isLoadingReceipt ? (
                                    <svg className="animate-spin h-4 w-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  )}
                                  <span>{isLoadingReceipt ? 'Loading...' : 'View'}</span>
                                </button>
                              ) : payment.Status === "Approved" ? (
                                <>
                                  <input
                                    type="file"
                                    id={`receipt-upload-${payment.id}`}
                                    className="hidden"
                                    accept="image/*,.pdf"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleUploadReceipt(payment, file, false);
                                      }
                                    }}
                                  />
                                  <button
                                    onClick={() => document.getElementById(`receipt-upload-${payment.id}`)?.click()}
                                    className="inline-flex items-center px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-800 rounded-lg border border-purple-200 hover:border-purple-300 transition-all duration-200 text-xs font-semibold shadow-sm hover:shadow-md"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    <span>Upload</span>
                                  </button>
                                </>
                              ) : (
                                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs text-slate-400 bg-slate-50 border border-slate-200">No receipt</span>
                              )}
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-center">
                              {payment.ar_receipt_path ? (
                                <button
                                  onClick={() => handleViewReceipt(payment, true)}
                                  disabled={isLoadingReceipt}
                                  className={`inline-flex items-center px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 rounded-lg border border-emerald-200 hover:border-emerald-300 transition-all duration-200 text-xs font-semibold shadow-sm hover:shadow-md ${
                                    isLoadingReceipt ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                >
                                  {isLoadingReceipt ? (
                                    <svg className="animate-spin h-4 w-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  )}
                                  <span>{isLoadingReceipt ? 'Loading...' : 'View AR'}</span>
                                </button>
                              ) : payment.Status === "Approved" ? (
                                <>
                                  <input
                                    type="file"
                                    id={`ar-receipt-upload-${payment.id}`}
                                    className="hidden"
                                    accept="image/*,.pdf"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleUploadReceipt(payment, file, true);
                                      }
                                    }}
                                  />
                                  <button
                                    onClick={() => document.getElementById(`ar-receipt-upload-${payment.id}`)?.click()}
                                    className="inline-flex items-center px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 rounded-lg border border-emerald-200 hover:border-emerald-300 transition-all duration-200 text-xs font-semibold shadow-sm hover:shadow-md"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    <span>Upload AR</span>
                                  </button>
                                </>
                              ) : (
                                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs text-slate-400 bg-slate-50 border border-slate-200">No AR receipt</span>
                              )}
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-center">
                              <div className="flex justify-center items-center space-x-2">
                                {payment.Status === "Pending" && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setEditingPayment(payment);
                                        setIsEditModalOpen(true);
                                      }}
                                      className="inline-flex items-center px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 rounded-lg border border-blue-200 hover:border-blue-300 transition-all duration-200 text-xs font-semibold shadow-sm hover:shadow-md"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                      <span>Edit</span>
                                    </button>
                                    <button
                                      onClick={() => handleConfirmPayment(payment)}
                                      className="inline-flex items-center px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 rounded-lg border border-emerald-200 hover:border-emerald-300 transition-all duration-200 text-xs font-semibold shadow-sm hover:shadow-md"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span>Confirm</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                      }}
                                      className="inline-flex items-center px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 rounded-lg border border-red-200 hover:border-red-300 transition-all duration-200 text-xs font-semibold shadow-sm hover:shadow-md"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                      <span>Reject</span>
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => {
                                    setDeletingPayment(payment);
                                    setIsDeleteModalOpen(true);
                                  }}
                                  className="inline-flex items-center px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 rounded-lg border border-red-200 hover:border-red-300 transition-all duration-200 text-xs font-semibold shadow-sm hover:shadow-md"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  <span>Delete</span>
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm
                                ${payment.Status === "Approved" ? "bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-200/60" : 
                                  payment.Status === "Rejected" ? "bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200/60" : 
                                  "bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border border-amber-200/60"}`}>
                                {payment.Status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
                    <svg className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-3">No payments found</h3>
                  <p className="text-slate-500 max-w-md leading-relaxed">
                    There are no payment records to display at the moment. Check back later or adjust your filters.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Receipt Viewing Modal */}
        <ViewReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => {
            setIsReceiptModalOpen(false);
            setViewingPayment(null);
          }}
          receiptUrl={receiptUrl}
          isLoading={isLoadingReceipt}
          payment={viewingPayment}
        />

        {/* Upload Payment Modal */}
        <UploadPaymentModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUpload={fetchAllPayments}
        />

        {/* Edit Payment Modal */}
        <EditPaymentModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingPayment(null);
          }}
          payment={editingPayment}
          onSave={fetchAllPayments}
        />
      </div>

          {/* Delete Confirmation Modal */}
          <Transition appear show={isDeleteModalOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => setIsDeleteModalOpen(false)}>
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black bg-opacity-25" />
              </Transition.Child>
              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                  >
                    <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                        Confirm Deletion
                      </Dialog.Title>
                      <div className="mb-6 text-gray-700">
                        Are you sure you want to delete this payment? This action cannot be undone.
                      </div>
                      <div className="flex justify-end space-x-3">
                        <button
                          className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0A0D50]"
                          onClick={() => setIsDeleteModalOpen(false)}
                        >
                          Cancel
                        </button>
                        <button
                          className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600"
                          onClick={async () => {
                            if (deletingPayment) {
                              await handleDeletePayment(deletingPayment);
                              setIsDeleteModalOpen(false);
                              setDeletingPayment(null);
                            }
                          }}
                        >
                          Yes, Delete
                        </button>
                      </div>
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </Transition>
    </>
  );
};

export default PaymentPage;
