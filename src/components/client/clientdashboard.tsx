import React, { useEffect, useState, Fragment, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase/supabaseClient';
import PageTransition from '../../components/PageTransition';
import { LogOut, UserCircle,CreditCard,AlertCircle, Ticket, X,FileUp, Upload, Key, Check, ChevronDown, Calendar, Eye, Clock, Banknote, DollarSign } from 'lucide-react'; // Updated import
import { Dialog, Transition } from '@headlessui/react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import toast from 'react-hot-toast';

// Define types
interface Client {
  id: number;
  Name: string;
  Email: string;
  Phone: string;
  Address: string;
  'Date Joined': string;
}

interface Balance {
  id: number;
  Name: string;
  Block: string;
  Lot: string;
  TCP: number | null;
  Amount: number | null;
  'Months Paid': string | null;
  'MONTHS PAID': number | null;
  'Remaining Balance': number | null;
  'Monthly Amortization': number | null;
  Project: string;
  Terms: string;
  'sqm'?: number | null;
  'pricepersqm'?: number | null;
  penalty?: number | null;
}

// Ticket Submission Modal Props
interface TicketSubmissionModalProps {
  clientName: string;
  isOpen: boolean;
  closeModal: () => void;
  refreshTickets: () => void;
}

// Function to fetch client tickets
const fetchClientTickets = async (clientName: string, supabaseClient: any): Promise<any[]> => {
  if (!clientName) return [];
  
  try {
    console.log('Fetching tickets for client:', clientName);
    
    // Fetch tickets from Tickets table
    const { data, error } = await supabaseClient
      .from('Tickets')
      .select('*')
      .eq('Name', clientName)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load tickets');
      return [];
    }
    
    console.log('Tickets found:', data);
    return data || [];
  } catch (err) {
    console.error('Error in tickets fetch:', err);
    toast.error('Failed to load tickets');
    return [];
  }
};

// Ticket Submission Modal Component
const TicketSubmissionModal: React.FC<TicketSubmissionModalProps> = ({ 
  clientName, 
  isOpen, 
  closeModal, 
  refreshTickets
}) => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create new ticket in Supabase
      const { error: ticketError } = await supabase
        .from('Tickets')
        .insert([
          {
            Name: clientName,
            Subject: subject,
            Description: description,
            Priority: 'medium', // Default priority
            Status: 'new',
            Assigned: null // Not assigned initially
          }
        ])
        .select();

      if (ticketError) throw ticketError;

      setSuccess(true);
      refreshTickets();
      // Close modal after successful submission
      setTimeout(() => {
        closeModal();
        setSuccess(false);
        setSubject('');
        setDescription('');
      }, 3000);
    } catch (err: any) {
      console.error("Ticket submission error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-8 shadow-xl transition-all">
                <Dialog.Title className="text-2xl font-bold text-gray-900">
                  Submit Support Ticket
                </Dialog.Title>
                <p className="mt-1 text-sm text-gray-600">
                  Need help? Submit a ticket and our team will get back to you shortly.
                </p>
  
                {success ? (
                  <div className="mt-8 rounded-xl bg-green-50 p-6 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <h4 className="mt-4 text-lg font-semibold text-green-800">Ticket submitted successfully!</h4>
                    <p className="mt-1 text-sm text-green-700">Our team will review your request shortly.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="subject" className="block text-sm font-semibold text-gray-900">
                          Subject
                        </label>
                        <input
                          type="text"
                          id="subject"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="mt-2 w-full rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Brief description of your issue"
                          required
                        />
                      </div>
  
                      <div>
                        <label htmlFor="description" className="block text-sm font-semibold text-gray-900">
                          Description
                        </label>
                        <textarea
                          id="description"
                          rows={4}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="mt-2 w-full resize-none rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Please provide details about your issue"
                          required
                        />
                      </div>
                    </div>
  
                    {error && (
                      <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                        <div className="flex items-start">
                          <svg className="h-5 w-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-4a1 1 0 102 0 1 1 0 00-2 0zm.293-7.707a1 1 0 011.414 0L11 7.586V11a1 1 0 11-2 0V7.586l.293-.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {error}
                        </div>
                      </div>
                    )}
  
                    <div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <svg
                              className="h-5 w-5 animate-spin text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            Submitting...
                          </>
                        ) : (
                          'Submit Ticket'
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
  
};

// Payment Receipt Modal Props
interface PaymentReceiptModalProps {
  isOpen: boolean;
  closeModal: () => void;
  clientName: string;
  selectedBlock?: string | null;
  selectedLot?: string | null;
  balanceRecords: Balance[];
}

// Payment Receipt Modal Component
// Helper to sanitize storage keys (removes spaces, special chars, diacritics)
function sanitizeKey(str: string) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({ 
  isOpen, 
  closeModal, 
  clientName,
  selectedBlock,
  selectedLot,
  balanceRecords
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [selectedBlockLot, setSelectedBlockLot] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [penalty, setPenalty] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<Date | null>(null);
  const [paymentMonth, setPaymentMonth] = useState<Date | null>(null);
  const [dueDate, setDueDate] = useState<string>('15th');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'validation' | 'file' | 'upload' | 'database' | 'network' | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper function to handle dates without timezone shifting
  const formatToLocalDate = (date: Date | null) => {
    if (!date) return null;
    // Create a new date with the same year, month, and day, but at noon to avoid timezone issues
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
  };

  // Helper function to set date to first day of the month
  const formatToMonthStart = (date: Date | null) => {
    if (!date) return null;
    // Create a new date set to the first day of the selected month at noon
    return new Date(date.getFullYear(), date.getMonth(), 1, 12, 0, 0);
  };

  // Helper function to set detailed error messages
  const setDetailedError = (message: string, type: 'validation' | 'file' | 'upload' | 'database' | 'network') => {
    setError(message);
    setErrorType(type);
  };

  // Group balance records by project
  const projectBalances = useMemo(() => {
    const grouped = balanceRecords.reduce((acc, record) => {
      if (!acc[record.Project]) {
        acc[record.Project] = [];
      }
      acc[record.Project].push(record);
      return acc;
    }, {} as { [key: string]: Balance[] });
    return grouped;
  }, [balanceRecords]);

  // Set initial selected block and lot
  useEffect(() => {
    if (selectedBlock && selectedLot) {
      setSelectedBlockLot(`Block ${selectedBlock} Lot ${selectedLot}`);
      // Find and set the project for the selected block and lot
      const record = balanceRecords.find(r => r.Block === selectedBlock && r.Lot === selectedLot);
      if (record) {
        setSelectedProject(record.Project);
      }
    } else if (balanceRecords.length > 0) {
      // If client has only one project, auto-select it
      const projects = Object.keys(projectBalances);
      if (projects.length === 1) {
        const singleProject = projects[0];
        setSelectedProject(singleProject);
        
        // If there's only one block & lot for this project, auto-select it
        const blockLots = projectBalances[singleProject];
        if (blockLots.length === 1) {
          const record = blockLots[0];
          setSelectedBlockLot(`Block ${record.Block} Lot ${record.Lot}`);
        }
      }
    }
  }, [selectedBlock, selectedLot, balanceRecords, projectBalances]);

  // Auto-select block & lot when project changes and there's only one option
  useEffect(() => {
    if (selectedProject && projectBalances[selectedProject]) {
      const blockLots = projectBalances[selectedProject];
      if (blockLots.length === 1) {
        const record = blockLots[0];
        setSelectedBlockLot(`Block ${record.Block} Lot ${record.Lot}`);
      }
    }
  }, [selectedProject, projectBalances]);

  // Clear form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setSelectedBlockLot(null);
      setSelectedProject('');
      setAmount('');
      setPenalty('');
      setPaymentDate(null);
      setPaymentMonth(null);
      setError(null);
      setErrorType(null);
      setSuccess(false);
      setPreviewUrl(null);
      setPreviewError(null);
      setIsDragging(false);
      setIsProcessing(false);
    }
  }, [isOpen]);

  const processFile = async (file: File) => {
    setPreviewError(null);
    setIsProcessing(true);

    try {
      // Validate file type (PNG, JPG, JPEG, and HEIC)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif'];
      const fileType = file.type.toLowerCase();
      const fileName = file.name.toLowerCase();
      
      if (!allowedTypes.includes(fileType) && 
          !fileName.endsWith('.heic') && 
          !fileName.endsWith('.heif')) {
        setPreviewError('Invalid file format. Please upload JPG, JPEG, PNG, or HEIC images only.');
        setIsProcessing(false);
        setFile(null);
        return;
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        setPreviewError(`File size is ${(file.size / (1024 * 1024)).toFixed(2)}MB. Maximum allowed size is 10MB.`);
        setIsProcessing(false);
        setFile(null);
        return;
      }

      // Check if file is corrupted or empty
      if (file.size === 0) {
        setPreviewError('The selected file appears to be empty or corrupted. Please try a different image.');
        setIsProcessing(false);
        setFile(null);
        return;
      }

      // Create preview URL for images
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = e.target?.result as string;
          if (!result || result.length < 100) { // Basic check for valid base64 data
            throw new Error('Invalid image data');
          }
          setPreviewUrl(result);
          setIsProcessing(false);
        } catch (err) {
          setPreviewError('Failed to process the image. The file may be corrupted or in an unsupported format.');
          setIsProcessing(false);
          setFile(null);
          return;
        }
      };
      
      reader.onerror = () => {
        setPreviewError('Failed to read the image file. Please try selecting the file again.');
        setIsProcessing(false);
        setFile(null);
        return;
      };
      
      reader.readAsDataURL(file);
      setFile(file);
    } catch (err) {
      setPreviewError('An unexpected error occurred while processing the file. Please try again.');
      setIsProcessing(false);
      setFile(null);
      return;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleProjectChange = (project: string) => {
    setSelectedProject(project);
    // Reset block & lot when project changes
    setSelectedBlockLot(null);
  };

  const handleBlockLotChange = (blockLot: string) => {
    setSelectedBlockLot(blockLot);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setErrorType(null);

    try {
      // Validation checks with specific error messages
      if (!file) {
        toast.error('Please select a receipt file to upload');
        setDetailedError('No receipt file selected. Please choose an image file (JPG, PNG, HEIC) to upload.', 'validation');
        setLoading(false);
        return;
      }

      if (!selectedProject) {
        toast.error('Please select a project');
        setDetailedError('Project selection is required. Please choose a project from the dropdown.', 'validation');
        setLoading(false);
        return;
      }

      if (!selectedBlockLot) {
        toast.error('Please select block and lot');
        setDetailedError('Block and Lot selection is required. Please choose your property location.', 'validation');
        setLoading(false);
        return;
      }

      if (!amount || parseFloat(amount) <= 0) {
        toast.error('Please enter a valid payment amount');
        setDetailedError('Payment amount is required and must be greater than zero. If there is an amount already, check if there is a comma in the amount.',
    'validation');
        setLoading(false);
        return;
      }

      if (!paymentDate) {
        toast.error('Please select payment date');
        setDetailedError('Payment date is required. Please select the date when the payment was made.', 'validation');
        setLoading(false);
        return;
      }

      if (!paymentMonth) {
        toast.error('Please select payment month');
        setDetailedError('Payment month is required. Please select which month this payment is for.', 'validation');
        setLoading(false);
        return;
      }

      if (!referenceNumber?.trim()) {
        toast.error('Please enter reference number');
        setDetailedError('Reference number is required. Please enter the transaction reference from your payment receipt.', 'validation');
        setLoading(false);
        return;
      }


      // Check network connectivity
      if (!navigator.onLine) {
        toast.error('No internet connection');
        setDetailedError('No internet connection detected. Please check your network connection and try again.', 'network');
        setLoading(false);
        return;
      }

      // Create folder path for client's receipts (sanitize all parts)
      const fileExt = file.name.split('.').pop();
      const paymentDateFormatted = paymentDate ? new Date(paymentDate).toISOString().split('T')[0] : '';
      const safeProject = sanitizeKey(selectedProject);
      const safeClientName = sanitizeKey(clientName);
      const safeBlockLot = sanitizeKey(selectedBlockLot || '');
      const fileName = `${paymentDateFormatted}_${safeBlockLot}_${Date.now()}.${fileExt}`;
      const filePath = `${safeProject}/${safeClientName}/${fileName}`;
      
      toast.loading('Uploading receipt...');
      
      // Upload file with detailed error handling
      const { error: uploadError } = await supabase.storage
        .from('Payment Receipt')
        .upload(filePath, file, { upsert: true }); // Use upsert to replace if exists

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Failed to upload receipt');
        
        // Provide specific error messages based on upload error
        if (uploadError.message.includes('Invalid MIME type')) {
          setDetailedError('The uploaded file format is not supported. Please ensure you are uploading a valid JPG, PNG, or HEIC image file.', 'file');
        } else if (uploadError.message.includes('File size')) {
          setDetailedError('The file size exceeds the maximum limit. Please compress your image or choose a smaller file (max 10MB).', 'file');
        } else if (uploadError.message.includes('Network')) {
          setDetailedError('Network error during upload. Please check your internet connection and try again.', 'network');
        } else if (uploadError.message.includes('Storage')) {
          setDetailedError('Server storage error. Our servers may be temporarily unavailable. Please try again in a few minutes.', 'upload');
        } else if (uploadError.message.includes('permission') || uploadError.message.includes('unauthorized')) {
          setDetailedError('Upload permission error. Please contact customer support if this problem persists.', 'upload');
        } else {
          setDetailedError(`Upload failed: ${uploadError.message}. Please try again or contact support if the problem continues.`, 'upload');
        }
        setLoading(false);
        return;
      }

      toast.loading('Saving payment details...');
      
      // Save payment data to Payment table with detailed error handling
      const { error: dbError } = await supabase
        .from('Payment')
        .insert([
          {
            "receipt_path": filePath, // Store the full path including client folder
            "Block & Lot": selectedBlockLot,
            "Payment Amount": parseFloat(amount),
            "Penalty Amount": penalty ? parseFloat(penalty) : null,
            "Date of Payment": formatToLocalDate(paymentDate)?.toISOString(),
            "Month of Payment": formatToMonthStart(paymentMonth)?.toISOString(),
            "Due Date": dueDate, // Add the due date field
            "Name": clientName,
            "Project": selectedProject, // Add the selected project
            "Status": "Pending", // Changed to capital P to match standard status format
            "Reference Number": referenceNumber,
            created_at: new Date().toISOString()
          }
        ]);

      if (dbError) {
        console.error('Database error:', dbError);
        toast.error('Failed to save payment details');
        
        // Provide specific error messages based on database error
        if (dbError.message.includes('duplicate') || dbError.message.includes('unique')) {
          setDetailedError('A payment with this reference number already exists. Please check your reference number or contact support if you believe this is an error.', 'database');
        } else if (dbError.message.includes('foreign key') || dbError.message.includes('constraint')) {
          setDetailedError('Invalid project or property information. Please refresh the page and try again.', 'database');
        } else if (dbError.message.includes('permission') || dbError.message.includes('access')) {
          setDetailedError('Database access error. Please contact customer support to resolve this issue.', 'database');
        } else if (dbError.message.includes('network') || dbError.message.includes('timeout')) {
          setDetailedError('Database connection timeout. Please check your internet connection and try again.', 'network');
        } else {
          setDetailedError(`Database error: ${dbError.message}. Please try again or contact support if the problem persists.`, 'database');
        }
        setLoading(false);
        return;
      }

      toast.success('Payment submitted successfully!');
      setSuccess(true);
      
      // Close modal after successful submission
      setTimeout(() => {
        closeModal();
        setSuccess(false);
        setFile(null);
        setSelectedBlockLot(null);
        setSelectedProject('');
        setAmount('');
        setPenalty('');
        setReferenceNumber('');
        setPaymentDate(null);
        setPaymentMonth(null);
        setPreviewUrl(null);
        setError(null);
        setErrorType(null);
      }, 3000);
    } catch (err: any) {
      console.error("Payment submission error:", err);
      toast.error('Upload failed');
      
      // Handle unexpected errors
      if (err.name === 'NetworkError' || err.message.includes('fetch')) {
        setDetailedError('Network connection error. Please check your internet connection and try again.', 'network');
      } else if (err.message.includes('quota') || err.message.includes('storage')) {
        setDetailedError('Server storage is full. Please contact customer support to resolve this issue.', 'upload');
      } else if (err.message.includes('timeout')) {
        setDetailedError('Request timed out. Please check your internet connection and try again.', 'network');
      } else {
        setDetailedError(`Unexpected error: ${err.message}. Please try again or contact customer support if the problem continues.`, 'upload');
      }
    } finally {
      setLoading(false);
    }
  };

  // Get error icon and color based on error type
  const getErrorDisplay = () => {
    switch (errorType) {
      case 'validation':
        return { icon: '⚠️', color: 'bg-yellow-50 border-yellow-200', textColor: 'text-yellow-800', headerColor: 'text-yellow-800' };
      case 'file':
        return { icon: '📄', color: 'bg-orange-50 border-orange-200', textColor: 'text-orange-800', headerColor: 'text-orange-800' };
      case 'upload':
        return { icon: '☁️', color: 'bg-red-50 border-red-200', textColor: 'text-red-800', headerColor: 'text-red-800' };
      case 'database':
        return { icon: '🗄️', color: 'bg-purple-50 border-purple-200', textColor: 'text-purple-800', headerColor: 'text-purple-800' };
      case 'network':
        return { icon: '🌐', color: 'bg-blue-50 border-blue-200', textColor: 'text-blue-800', headerColor: 'text-blue-800' };
      default:
        return { icon: '❌', color: 'bg-red-50 border-red-200', textColor: 'text-red-800', headerColor: 'text-red-800' };
    }
  };

  const errorDisplay = getErrorDisplay();

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={closeModal}>
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

        <div className="fixed inset-0 overflow-y-auto z-50">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
        
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-5xl">
          {success ? (
            <div className="p-8">
              <div className="rounded-2xl bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-8 text-center border border-green-100">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg mb-6">
                  <Check className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Receipt Uploaded!</h3>
                <p className="text-gray-600 mb-6">Your payment is being processed. You'll receive a confirmation soon.</p>
                <button
                  onClick={closeModal}
                  className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 px-8 py-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
                <div className="relative">
                  <h2 className="text-2xl font-bold text-white mb-2">Upload Payment Receipt</h2>
                  <p className="text-blue-100">Please provide your payment details and upload the receipt</p>
                </div>
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
              </div>

              <div className="px-8 py-8">
                <div className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                      {/* Project Selection */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-900">Project</label>
                        <div className="relative">
                          <select
                            value={selectedProject || ''}
                            onChange={(e) => handleProjectChange(e.target.value)}
                            className="block w-full appearance-none rounded-xl border-0 bg-gray-50 px-4 py-3.5 pr-10 text-gray-900 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:bg-gray-100"
                            required
                          >
                            <option value="" disabled>Select Project</option>
                            {Object.keys(projectBalances).map((project, index) => (
                              <option key={index} value={project}>{project}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                            <ChevronDown className="h-5 w-5" />
                          </div>
                        </div>
                      </div>

                      {/* Block and Lot Selection */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-900">Block and Lot</label>
                        <div className="relative">
                          <select
                            value={selectedBlockLot || ''}
                            onChange={(e) => handleBlockLotChange(e.target.value)}
                            className="block w-full appearance-none rounded-xl border-0 bg-gray-50 px-4 py-3.5 pr-10 text-gray-900 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:bg-gray-100"
                            required
                          >
                            <option value="" disabled>Select Block and Lot</option>
                            {projectBalances[selectedProject] && projectBalances[selectedProject].map((record, index) => (
                              <option key={index} value={`Block ${record.Block} Lot ${record.Lot}`}>
                                Block {record.Block} Lot {record.Lot}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                            <ChevronDown className="h-5 w-5" />
                          </div>
                        </div>
                      </div>

                      {/* Reference Number */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-900">Reference Number</label>
                        <input
                          type="text"
                          value={referenceNumber}
                          onChange={(e) => setReferenceNumber(e.target.value)}
                          className="block w-full rounded-xl border-0 bg-gray-50 px-4 py-3.5 text-gray-900 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:bg-gray-100 placeholder-gray-500"
                          placeholder="Enter reference number"
                          required
                        />
                      </div>

                      {/* Amount Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-900">Amount</label>
                          <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                              <span className="text-gray-500 font-medium">₱</span>
                            </div>
                            <input
                              type="number"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              className="block w-full rounded-xl border-0 bg-gray-50 pl-8 pr-4 py-3.5 text-gray-900 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:bg-gray-100 placeholder-gray-500"
                              placeholder="0.00"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-900">Penalty</label>
                          <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                              <span className="text-gray-500 font-medium">₱</span>
                            </div>
                            <input
                              type="number"
                              value={penalty}
                              onChange={(e) => setPenalty(e.target.value)}
                              className="block w-full rounded-xl border-0 bg-gray-50 pl-8 pr-4 py-3.5 text-gray-900 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:bg-gray-100 placeholder-gray-500"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Date Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-900">Due Date</label>
                          <div className="relative">
                            <select
                              value={dueDate}
                              onChange={(e) => setDueDate(e.target.value)}
                              className="block w-full appearance-none rounded-xl border-0 bg-gray-50 px-4 py-3.5 pr-10 text-gray-900 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:bg-gray-100"
                              required
                            >
                              <option value="15th">15th</option>
                              <option value="30th">30th</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                              <ChevronDown className="h-5 w-5" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-900">Payment Date</label>
                          <div className="relative">
                            <DatePicker
                              selected={paymentDate}
                              onChange={(date) => date && setPaymentDate(formatToLocalDate(date))}
                              dateFormat="MMMM d, yyyy"
                              placeholderText="Select date"
                              className="block w-full rounded-xl border-0 bg-gray-50 pl-4 pr-12 py-3.5 text-gray-900 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:bg-gray-100"
                              required
                            />
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                              <Calendar className="h-5 w-5" />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-900">Payment Month</label>
                          <div className="relative">
                            <DatePicker
                              selected={paymentMonth}
                              onChange={(date) => date && setPaymentMonth(formatToMonthStart(date))}
                              dateFormat="MMMM yyyy"
                              showMonthYearPicker
                              showFullMonthYearPicker
                              placeholderText="Select month"
                              className="block w-full rounded-xl border-0 bg-gray-50 pl-4 pr-12 py-3.5 text-gray-900 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:bg-gray-100"
                              required
                            />
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                              <Calendar className="h-5 w-5" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - File Upload */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-900">Payment Receipt</label>
                      <div 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all duration-300 ${
                          isDragging
                            ? 'border-blue-500 bg-blue-50 scale-105'
                            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                        }`}
                        style={{ minHeight: '320px' }}
                      >
                        {isProcessing ? (
                          <div className="text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 mb-4 animate-pulse">
                              <Upload className="h-10 w-10 text-blue-600" />
                            </div>
                            <p className="text-sm text-gray-600 font-medium">Processing file...</p>
                          </div>
                        ) : file ? (
                          <div className="text-center">
                            {previewUrl && file.type.startsWith('image/') ? (
                              <div className="mb-6">
                                <img
                                  src={previewUrl}
                                  alt="Preview"
                                  className="mx-auto h-40 w-auto rounded-xl border-2 border-gray-100 object-cover shadow-lg"
                                />
                              </div>
                            ) : (
                              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 mb-6">
                                <FileUp className="h-10 w-10 text-green-600" />
                              </div>
                            )}
                            <div className="space-y-3">
                              <p className="text-sm font-semibold text-gray-900">{file.name}</p>
                              <p className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full inline-block">
                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  setFile(null);
                                  setPreviewUrl(null);
                                  setPreviewError(null);
                                }}
                                className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition-all duration-200"
                              >
                                <X className="h-4 w-4 mr-1.5" />
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mb-6">
                              <Upload className="h-10 w-10 text-gray-500" />
                            </div>
                            <div className="space-y-4">
                              <div>
                                <p className="text-lg font-semibold text-gray-900 mb-2">
                                  {isDragging ? 'Drop your file here' : 'Upload your receipt'}
                                </p>
                                <p className="text-sm text-gray-500">Drag and drop or click to browse</p>
                              </div>
                              <label className="relative cursor-pointer">
                                <span className="inline-flex items-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                                  <Upload className="h-4 w-4 mr-2" />
                                  Choose File
                                  <input
                                    type="file"
                                    className="sr-only"
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        processFile(e.target.files[0]);
                                      }
                                    }}
                                    accept="image/jpeg,image/jpg,image/png,image/heic,image/heif,.heic,.heif"
                                  />
                                </span>
                              </label>
                              <p className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                JPG, JPEG, PNG, HEIC (up to 10MB)
                              </p>
                            </div>
                          </div>
                        )}
                        {previewError && (
                          <div className="mt-4">
                            <p className="text-xs text-red-600 bg-red-50 px-3 py-1 rounded-full">{previewError}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className={`rounded-lg border p-4 ${errorDisplay.color}`}>
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <span className="text-lg">{errorDisplay.icon}</span>
                        </div>
                        <div className="ml-3">
                          <h3 className={`text-sm font-semibold ${errorDisplay.headerColor}`}>
                            {errorType === 'validation' ? 'Validation Error' : 'Upload Failed'}
                          </h3>
                          <p className={`text-sm mt-1 ${errorDisplay.textColor}`}>
                            {error}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="inline-flex items-center px-6 py-3 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className={`inline-flex items-center px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-lg transition-all duration-200 ${
                        loading 
                          ? 'bg-blue-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl'
                      }`}
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Receipt
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
      </Dialog>
    </Transition>
  );
};

// Change Password Modal Props
interface ChangePasswordModalProps {
  isOpen: boolean;
  closeModal: () => void;
  userId: string;
  onSuccess: () => void;
}

// Change Password Modal Component
const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ 
  isOpen, 
  closeModal, 
  userId,
  onSuccess
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate passwords
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Update password in Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      // Update the first_login flag in the Clients table
      const updateData: Record<string, boolean> = {
        'first_login': false
      };
      
      console.log('Updating client with data:', updateData);
      
      const { error: clientUpdateError } = await supabase
        .from('Clients')
        .update(updateData)
        .eq('auth_id', userId);

      if (clientUpdateError) {
        console.error('Error updating client first login status:', clientUpdateError);
        throw clientUpdateError;
      }

      setSuccess(true);
      
      // Close modal after successful password change
      setTimeout(() => {
        closeModal();
        setSuccess(false);
        setNewPassword('');
        setConfirmPassword('');
        onSuccess();
      }, 3000);
    } catch (err: any) {
      console.error("Password change error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>
  
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-6 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
             <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-8 text-left shadow-2xl transition-all space-y-6">
              <Dialog.Title className="text-2xl font-semibold text-gray-800">
                Change Your Password
              </Dialog.Title>

              <p className="text-sm text-gray-500">
                For security reasons, change your temporary password to something secure and memorable.
              </p>

              {success ? (
                <div className="rounded-lg bg-green-50 p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <p className="mt-4 text-lg font-medium text-green-800">Password changed successfully!</p>
                  <p className="mt-2 text-sm text-green-700">You can now use your new password to log in.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                        New Password
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="mt-2 w-full rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter new password"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-400">Must be at least 6 characters</p>
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="mt-2 w-full rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Re-enter new password"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 flex items-start space-x-2">
                      <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-4h2v2h-2v-2zm0-8h2v6h-2V6z" clipRule="evenodd" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 transition"
                    >
                      Change Later
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"
                            />
                          </svg>
                          Changing...
                        </>
                      ) : (
                        'Change Password'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </Dialog.Panel>

            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
    
};

// View Payment Modal Props
interface ViewPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payments: any[];
  isLoading: boolean;
  clientName: string;
}

// View Payment Modal Component
const ViewPaymentModal: React.FC<ViewPaymentModalProps> = ({ isOpen, onClose, payments, isLoading, clientName }) => {
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  const handleViewReceipt = async (payment: any, isAR: boolean = false) => {
    if (!payment || !clientName) {
      toast.error('Payment information not found');
      return;
    }

    setIsLoadingReceipt(true);
    setIsReceiptModalOpen(true);
    setReceiptUrl(null);

    try {
      // Get receipt using the path that includes client folder
      const receiptPath = isAR ? payment.ar_receipt_path : payment.receipt_path;
      if (!receiptPath) {
        toast.error('Receipt not found');
        return;
      }
      
      console.log('Fetching receipt:', receiptPath);
      
      const { data, error } = await supabase.storage
        .from(isAR ? 'ar-receipt' : 'Payment Receipt')
        .download(receiptPath);

      if (error) {
        console.error('Error fetching receipt:', error);
        toast.error('Failed to load receipt');
        return;
      }

      if (!data) {
        console.error('Receipt not found');
        toast.error('Receipt not found');
        return;
      }

      // Create a URL for the downloaded file
      const url = URL.createObjectURL(data);
      console.log('Created object URL for receipt:', url);
      setReceiptUrl(url);
      
      // Clean up the URL when the modal is closed
      const cleanup = () => {
        URL.revokeObjectURL(url);
        setReceiptUrl(null);
      };

      return cleanup;
    } catch (err) {
      console.error('Error viewing receipt:', err);
      toast.error('Failed to view receipt. Please try again later.');
    } finally {
      setIsLoadingReceipt(false);
    }
  };

  return (
    <>
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
                <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4 flex justify-between items-center">
                    Payment History
                  </Dialog.Title>
                  
                  {isLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : payments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AR Receipt</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {payments.map((payment, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                  ${payment.Status === "Approved" ? "bg-green-100 text-green-800" : 
                                    payment.Status === "Rejected" ? "bg-red-100 text-red-800" : 
                                    payment.Status === "Pending" ? "bg-yellow-100 text-yellow-800" : 
                                    payment.Status === "closed" ? "bg-gray-100 text-gray-800" : 
                                    "bg-gray-100 text-gray-800"}`}
                                >
                                  {payment.Status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {payment.receipt_path && (
                                  <button 
                                    onClick={() => handleViewReceipt(payment)}
                                    className="text-blue-600 hover:text-blue-800 focus:outline-none flex items-center"
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    View Receipt
                                  </button>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {payment.ar_receipt_path && (
                                  <button 
                                    onClick={() => handleViewReceipt(payment, true)}
                                    className="text-green-600 hover:text-green-800 focus:outline-none flex items-center"
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    View AR
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">No payment records found.</p>
                  )}

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 transition-all duration-200"
                      onClick={onClose}
                    >
                      Close
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <ViewReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          if (receiptUrl) {
            URL.revokeObjectURL(receiptUrl);
            setReceiptUrl(null);
          }
        }}
        receiptUrl={receiptUrl}
        isLoading={isLoadingReceipt}
      />
    </>
  );
};

// View Receipt Modal Props
interface ViewReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptUrl: string | null;
  isLoading: boolean;
}

// View Receipt Modal Component
// View Receipt Modal Component
const ViewReceiptModal: React.FC<ViewReceiptModalProps> = ({ isOpen, onClose, receiptUrl, isLoading }) => {
  // Function to download the image/file
  const handleDownload = async () => {
    if (!receiptUrl) return;
    
    try {
      const response = await fetch(receiptUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from URL or use default
      const urlParts = receiptUrl.split('/');
      const filename = urlParts[urlParts.length - 1] || 'receipt';
      link.download = filename.includes('.') ? filename : `${filename}.jpg`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to opening in new tab
      window.open(receiptUrl, '_blank');
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                  <div className="flex items-center space-x-2">
                    {receiptUrl && !isLoading && (
                      <button
                        onClick={handleDownload}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download
                      </button>
                    )}
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-1"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </Dialog.Title>

                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : receiptUrl ? (
                  <div className="flex justify-center items-center bg-gray-50 rounded-lg p-4" style={{ height: '70vh' }}>
                    <img
                      src={receiptUrl}
                      alt="Payment Receipt"
                      className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '100%',
                        width: 'auto',
                        height: 'auto'
                      }}
                      onError={(e) => {
                        console.error('Failed to load image:', receiptUrl);
                        // Fallback to iframe if image fails
                        const container = e.currentTarget.parentElement;
                        if (container) {
                          container.innerHTML = `
                            <iframe
                              src="${receiptUrl}"
                              class="w-full h-full rounded-lg border border-gray-200"
                              title="Payment Receipt"
                            ></iframe>
                          `;
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2v-3a2 2 0 114 0v-3a2 2 0 002-2V7a2 2 0 00-2-2H5z" />
                    </svg>
                    <p className="text-gray-500 mb-2">No Receipt Found</p>
                    <p className="text-sm text-gray-400">The receipt could not be loaded.</p>
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

const ClientDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [balanceRecords, setBalanceRecords] = useState<Balance[]>([]);
  const [selectedLot, setSelectedLot] = useState<string | null>(null);
  const [selectedBalanceData, setSelectedBalanceData] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // New state for ticket modal
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  // New state for payment receipt modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  // State for change password modal
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [userId, setUserId] = useState<string>('');
  // State for client tickets
  const [clientTickets, setClientTickets] = useState<any[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  // State for payment history
  const [isViewPaymentModalOpen, setIsViewPaymentModalOpen] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [isViewAllTicketsModalOpen, setIsViewAllTicketsModalOpen] = useState(false);

  // Helper function to check if a value is empty (null, undefined, empty string, or zero)
  const isEmpty = (value: any): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (typeof value === 'number' && value === 0) return true;
    return false;
  };

  // Helper function to safely parse a numeric value from various formats
  const safelyParseNumber = (value: any): number | null => {
    if (isEmpty(value)) return null;
    
    try {
      // If it's already a number, return it
      if (typeof value === 'number') return value;
      
      // If it's a string, try to parse it
      if (typeof value === 'string') {
        // Remove any non-numeric characters except decimal point and minus sign
        const cleanedValue = value.replace(/[^\d.-]/g, '');
        const parsedValue = parseFloat(cleanedValue);
        return isNaN(parsedValue) ? null : parsedValue;
      }
      
      // For other types, try to convert to number
      const numValue = Number(value);
      return isNaN(numValue) ? null : numValue;
    } catch (e) {
      console.error('Error parsing number:', e);
      return null;
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking authentication...');
        const { data } = await supabase.auth.getSession();
        
        if (!data.session) {
          console.log('No session found, redirecting to login...');
          navigate('/login');
          return;
        }
        
        console.log('Session found, user ID:', data.session.user.id);
        setUserId(data.session.user.id);
        
        // Get client info using auth_id
        const { data: clientData, error: clientError } = await supabase
          .from('Clients')
          .select('*')
          .eq('auth_id', data.session.user.id)
          .single();
        
        if (clientError) {
          console.error('Client not found error:', clientError);
          setError(clientError.message);
          setLoading(false);
          return;
        }
        
        if (!clientData) {
          console.error('No client data found');
          setError('Client information not found');
          setLoading(false);
          return;
        }
        
        console.log('Client data retrieved:', clientData);
        setClient(clientData);
        
        try {
          // Get all records from the Balance table
          const { data: allBalanceRecords, error: balanceError } = await supabase
            .from('Balance')
            .select('*');
            
          if (balanceError) {
            console.error('Error fetching balance data:', balanceError);
            setError(balanceError.message);
            setLoading(false);
            return;
          }
          
          if (!allBalanceRecords || allBalanceRecords.length === 0) {
            console.log('No balance records found');
            setBalanceRecords([]);
            setLoading(false);
            return;
          }
          
          console.log('All balance records:', allBalanceRecords);
          
          // Find all records that match the client's name
          const matchedRecords = allBalanceRecords.filter(record => 
            record.Name && record.Name.toLowerCase() === clientData.Name.toLowerCase()
          );
          
          console.log('Matched balance records:', matchedRecords);
          
          if (matchedRecords.length > 0) {
            const processedRecords = matchedRecords.map(record => ({
              ...record,
              Block: String(record.Block),
              Lot: String(record.Lot),
              TCP: safelyParseNumber(record.TCP),
              Amount: safelyParseNumber(record.Amount),
              'Remaining Balance': safelyParseNumber(record['Remaining Balance'])
            }));
            
            console.log('Processed records:', processedRecords);
            setBalanceRecords(processedRecords);
            
            // Set the first record as the default selected
            const firstRecord = processedRecords[0];
            setSelectedLot(`Block ${firstRecord.Block} Lot ${firstRecord.Lot}`);
            setSelectedBalanceData(firstRecord);
          }
          
        } catch (err: any) {
          console.error('Error in balance data fetch:', err);
          setError(err.message);
        }
        
      } catch (err: any) {
        console.error('Error in auth check:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate]);
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };
  
  const handleSignOut = handleLogout;
  
  // Function to fetch client tickets
  const fetchClientTicketsForComponent = async () => {
    if (!client?.Name) return;
    
    setIsLoadingTickets(true);
    try {
      const tickets = await fetchClientTickets(client.Name, supabase);
      setClientTickets(tickets);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setClientTickets([]);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  // Call fetchClientTickets when client data is available
  useEffect(() => {
    if (client) {
      fetchClientTicketsForComponent();
    }
  }, [client]);
  
  // Fetch payments
  const fetchPayments = async () => {
    if (!client?.Name) return;
    
    setIsLoadingPayments(true);
    try {
      const { data, error } = await supabase
        .from('Payment')
        .select('*')
        .eq('Name', client.Name)
        .order('created_at', { ascending: false });

      console.log('Fetched payments:', data);
      if (error) throw error;
      
      // Normalize payment status to be consistent
      const normalizedData = data?.map(payment => ({
        ...payment,
        Status: payment.Status?.charAt(0).toUpperCase() + payment.Status?.slice(1).toLowerCase()
      })) || [];

      console.log('Normalized payments:', normalizedData);
      setPayments(normalizedData);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setIsLoadingPayments(false);
    }
  };

 const handleLotChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    setSelectedLot(selectedValue);
    
    console.log('=== DEBUG START ===');
    console.log('Selected value:', selectedValue);
    console.log('All balance records count:', balanceRecords.length);
    
    // Log unique projects to see what's available
    const uniqueProjects = [...new Set(balanceRecords.map(r => r.Project))];
    console.log('Available projects:', uniqueProjects);
    
    // Parse the selected value to extract block and lot numbers
    const selectedOption = selectedValue.match(/Block\s*([\dA-Za-z]+)\s*Lot\s*([\dA-Za-z]+)/i);
    
    if (selectedOption) {
      const [_, block, lot] = selectedOption;
      console.log('Parsed Block:', block, 'Lot:', lot);
      
      setSelectedLot(selectedValue);
      
      // Find the matching record in balanceRecords that match either block OR lot
      const partialMatches = balanceRecords.filter(record => {
        const recordBlock = String(record.Block || '').trim();
        const recordLot = String(record.Lot || '').trim();
        const searchBlock = String(block || '').trim();
        const searchLot = String(lot || '').trim();
        
        return recordBlock === searchBlock || recordLot === searchLot;
      });
      
      console.log('Records with matching block OR lot:', partialMatches.map(r => ({
        Block: r.Block,
        Lot: r.Lot,
        Project: r.Project,
        BlockType: typeof r.Block,
        LotType: typeof r.Lot
      })));
      
      // Find the exact matching record by comparing as strings to ensure exact matches
      const matchedRecord = balanceRecords.find(record => {
        // Trim and normalize block and lot values for comparison
        const recordBlock = String(record.Block || '').trim();
        const recordLot = String(record.Lot || '').trim();
        const searchBlock = String(block || '').trim();
        const searchLot = String(lot || '').trim();
        
        console.log(`Comparing: Record[${recordBlock}, ${recordLot}] (Project: ${record.Project}) with Selection[${searchBlock}, ${searchLot}]`);
        
        return recordBlock === searchBlock && recordLot === searchLot;
      });
      
      console.log('Matched record:', matchedRecord);
      
      if (matchedRecord) {
        // Log the data types to debug NaN issues
        console.log('--- MATCHED RECORD DETAILS ---');
        console.log('TCP type:', typeof matchedRecord.TCP, 'Value:', matchedRecord.TCP);
        console.log('Amount type:', typeof matchedRecord.Amount, 'Value:', matchedRecord.Amount);
        console.log('Remaining Balance type:', typeof matchedRecord['Remaining Balance'], 'Value:', matchedRecord['Remaining Balance']);
        console.log('MONTHS PAID type:', typeof matchedRecord['MONTHS PAID'], 'Value:', matchedRecord['MONTHS PAID']);
        console.log('Terms type:', typeof matchedRecord.Terms, 'Value:', matchedRecord.Terms);
        console.log('Project type:', typeof matchedRecord.Project, 'Value:', matchedRecord.Project);
        
        // Create a new object to ensure React detects the state change
        const updatedRecord = { ...matchedRecord };
        console.log('Setting selected balance data to:', updatedRecord);
        setSelectedBalanceData(updatedRecord);
      } else {
        // Clear selection if no match found
        console.warn('No matching record found for selected lot');
        
        // Enhanced debugging for Living Water Subdivision
        const livingWaterRecords = balanceRecords.filter(r => 
          r.Project && r.Project.toLowerCase().includes('living water')
        );
        console.log('Living Water records:', livingWaterRecords.map(r => ({
          Block: r.Block,
          Lot: r.Lot,
          Project: r.Project,
          BlockType: typeof r.Block,
          LotType: typeof r.Lot,
          BlockValue: JSON.stringify(r.Block),
          LotValue: JSON.stringify(r.Lot)
        })));
        
        // Show all available Block/Lot combinations
        console.log('All available Block/Lot combinations:');
        balanceRecords.forEach((r, index) => {
          console.log(`${index}: Block[${r.Block}] (${typeof r.Block}) Lot[${r.Lot}] (${typeof r.Lot}) Project[${r.Project}]`);
        });
        
        setSelectedBalanceData(null);
      }
    } else {
      // Clear selection if parsing fails
      console.warn('Failed to parse selected lot value:', selectedValue);
      console.log('Regex match result:', selectedValue.match(/Block\s*(\d+)\s*Lot\s*(\d+)/i));
      setSelectedBalanceData(null);
    }
    
    console.log('=== DEBUG END ===');
  };
  

  // Call fetchPayments when client data is available
  useEffect(() => {
    if (client?.Name) {
      fetchPayments();
    }
  }, [client?.Name]);
  
  // Loading state UI
  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading your dashboard</h2>
            <p className="text-gray-500 text-center">Please wait while we retrieve your information...</p>
          </div>
        </div>
      </PageTransition>
    );
  }
  
  // Error state UI  
  if (error) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full">
            <div className="bg-red-100 rounded-full p-3 w-12 h-12 flex items-center justify-center ring-2 ring-white/20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3 text-center">Error Loading Dashboard</h2>
            <p className="text-gray-600 mb-5 text-center">{error}</p>
            <div className="flex justify-center">
              <button 
                onClick={() => window.location.reload()} 
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 014 3.7M4.031 9.865a8.25 8.25 0 014 3.7l3.181-3.182m0-4.991v4.99" />
                </svg>
                Try Again
              </button>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }
  
  return (
  <PageTransition>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
      {/* Sidebar Navigation - Desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white shadow-xl border-r border-blue-100">
          {/* Sidebar Header */}
          <div className="flex items-center px-6 py-8 border-b border-blue-100">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <UserCircle className="h-7 w-7 text-white" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-bold text-gray-900">{client?.Name}</h2>
              <p className="text-sm text-blue-600">{client?.Email}</p>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7" />
                  </svg>
                </div>
                <span className="font-medium text-blue-900">Dashboard</span>
              </div>
            </div>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-blue-100 space-y-2">
            <button
              onClick={() => setIsChangePasswordModalOpen(true)}
              className="flex w-full items-center space-x-3 p-3 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Key className="h-5 w-5" />
              <span>Change Password</span>
            </button>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center space-x-3 p-3 text-red-600 rounded-xl hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <header className="lg:hidden bg-white shadow-sm border-b border-blue-100 p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <UserCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{client?.Name}</h1>
              <p className="text-sm text-blue-600">{client?.Email}</p>
            </div>
          </div>
          <button 
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={1.5} 
              stroke="currentColor" 
              className="w-6 h-6"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"}
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="lg:pl-72">
        <div className="px-4 py-8 lg:px-8">
          {/* Top Section - Welcome & Property Selector */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  {(() => {
                    const hour = new Date().getHours();
                    if (hour < 12) return "Good morning! 🌅";
                    if (hour < 17) return "Good afternoon! ☀️";
                    return "Good evening! 🌙";
                  })()}
                </h1>
                <p className="text-lg text-gray-600">Here's what's happening with your properties today.</p>
              </div>
              
              {/* Property Selector - Only show if there are multiple properties */}
              {balanceRecords && balanceRecords.length > 1 && (
                <div className="lg:w-80">
                  <label htmlFor="lot-selector" className="block mb-2 text-sm font-medium text-gray-700">
                    Active Property
                  </label>
                  <div className="relative">
                    <select
                      id="lot-selector"
                      value={selectedLot || ''}
                      onChange={handleLotChange}
                      className="w-full px-4 py-3 pr-10 border border-blue-200 rounded-xl shadow-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
                    >
                      <option value="" disabled>Select your property...</option>
                      {balanceRecords.map((record, index) => (
                        <option key={`${record.Block}-${record.Lot}-${index}`} value={`Block ${record.Block} Lot ${record.Lot}`}>
                          {record.Project} - Block {record.Block} Lot {record.Lot}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                      <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats Dashboard - Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {/* Total Paid Card */}
            <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <p className="text-blue-100 text-sm font-medium">Total Amount Paid</p>
                    <p className="text-2xl font-bold">₱{selectedBalanceData?.Amount?.toLocaleString() || '0'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Remaining Balance Card */}
            <div className="relative bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Banknote className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <p className="text-indigo-100 text-sm font-medium">Remaining Balance</p>
                    <p className="text-2xl font-bold">₱{selectedBalanceData?.["Remaining Balance"]?.toLocaleString() || '0'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Months Paid Card */}
            <div className="relative bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl p-6 text-white overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <p className="text-cyan-100 text-sm font-medium">Months Paid</p>
                    <p className="text-2xl font-bold">{selectedBalanceData?.["MONTHS PAID"] || '0'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms Card */}
            <div className="relative bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <p className="text-purple-100 text-sm font-medium">Term</p>
                    <p className="text-2xl font-bold">{selectedBalanceData?.Terms || '0'} mo</p>
                  </div>
                </div>
              </div>
            </div>

                        {/* Penalty Card */}
            <div className="relative bg-gradient-to-br from-red-600 to-red-800 rounded-2xl p-6 text-white overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-5 bg-white/20 rounded-xl">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <p className="text-red-100 text-sm font-medium">Penalty</p>
                    <p className="text-2xl font-bold">₱{selectedBalanceData?.penalty?.toLocaleString() || '0'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Two Column Layout for Actions and Details */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left Column - Actions */}
            <div className="xl:col-span-2 space-y-6">
              {/* Property Details Card */}
              {selectedBalanceData && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Property Information</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-600 font-medium mb-1">Project</p>
                      <p className="font-semibold text-gray-900">{selectedBalanceData.Project}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-600 font-medium mb-1">Block</p>
                      <p className="font-semibold text-gray-900">{selectedBalanceData.Block}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-600 font-medium mb-1">Lot</p>
                      <p className="font-semibold text-gray-900">{selectedBalanceData.Lot}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-600 font-medium mb-1">Total Contract</p>
                      <p className="font-semibold text-gray-900">₱{selectedBalanceData?.TCP?.toLocaleString() || '0'}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-600 font-medium mb-1">Months Paid</p>
                      <p className="font-semibold text-gray-900">{selectedBalanceData?.['Months Paid'] || '0'}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-600 font-medium mb-1">Monthly Amortization</p>
                      <p className="font-semibold text-gray-900">₱{selectedBalanceData?.['Monthly Amortization']?.toLocaleString() || '0'}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-600 font-medium mb-1">SQM</p>
                      <p className="font-semibold text-gray-900">{selectedBalanceData?.['sqm']?.toLocaleString() || '0'}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-600 font-medium mb-1">Price Per SQM</p>
                      <p className="font-semibold text-gray-900">₱{selectedBalanceData?.['pricepersqm']?.toLocaleString() || '0'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Actions */}
              <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <CreditCard className="h-5 w-5 text-white" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900">Payment Center</h2>
                    </div>
                    <button
                      onClick={() => setIsViewPaymentModalOpen(true)}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View History
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-6">Upload your payment receipt for quick verification and processing.</p>
                  <button
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    <FileUp className="h-5 w-5 mr-2" />
                    Upload Payment Receipt
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Single Combined Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
              {/* Support Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <Ticket className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Support Center</h2>
                </div>
              </div>
              
              <div className="p-6">
                {/* Create Ticket Section */}
                <div className="mb-8">
                  <p className="text-gray-600 mb-4">Need help? Our support team is here to assist you.</p>
                  <button
                    onClick={() => setIsTicketModalOpen(true)}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl w-full justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Support Ticket
                  </button>
                </div>
                
                {/* Divider */}
                <div className="border-t border-gray-200 mb-6"></div>
                
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">Recent Tickets</h3>
                    {clientTickets.length > 1 && (
                      <button
                        onClick={() => setIsViewAllTicketsModalOpen(true)}
                        className="text-xs text-green-600 hover:text-green-700 font-medium hover:underline"
                      >
                        Show all ({clientTickets.length})
                      </button>
                    )}
                  </div>
                  
                  {isLoadingTickets ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                    </div>
                  ) : clientTickets.length > 0 ? (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 text-sm">{clientTickets[0].Subject}</h4>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                          ${clientTickets[0].Status === "new" ? "bg-blue-100 text-blue-700" : 
                            clientTickets[0].Status === "in_progress" ? "bg-yellow-100 text-yellow-700" : 
                            clientTickets[0].Status === "resolved" ? "bg-green-100 text-green-700" : 
                            clientTickets[0].Status === "closed" ? "bg-gray-100 text-gray-700" : 
                            "bg-gray-100 text-gray-700"}`}
                        >
                          {clientTickets[0].Status === "new" ? 'New' : 
                           clientTickets[0].Status === "in_progress" ? 'In Progress' : 
                           clientTickets[0].Status === "resolved" ? 'Resolved' : 
                           clientTickets[0].Status === "closed" ? 'Closed' : 
                           clientTickets[0].Status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{clientTickets[0].Description}</p>
                      {clientTickets[0].Response && (
                        <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                          <p className="text-xs text-green-700">
                            <span className="font-medium">Response:</span> {clientTickets[0].Response}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2v-3a2 2 0 114 0v-3a2 2 0 002-2V7a2 2 0 00-2-2H5z" />
                      </svg>
                      <p className="text-sm text-gray-500">No tickets yet</p>
                      <p className="text-xs text-gray-400 mt-1">Create your first support ticket above</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-blue-200 text-center">
            <p className="text-sm text-gray-500">&copy; 2025 Omni Portal - Your trusted property partner</p>
          </div>
        </div>
      </main>
        
        {/* Mobile navigation */}
        {menuOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden">
            <div className="h-full w-80 bg-white shadow-xl flex flex-col">
              <div className="flex justify-between items-center p-6 border-b border-blue-100">
                <h3 className="text-xl font-bold text-gray-900">Navigation</h3>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    strokeWidth={1.5} 
                    stroke="currentColor" 
                    className="w-6 h-6"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              
              <nav className="flex-1 p-6 space-y-3">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7" />
                      </svg>
                    </div>
                    <span className="font-medium text-blue-900">Dashboard</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsChangePasswordModalOpen(true)}
                  className="flex w-full items-center space-x-3 p-4 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Key className="h-5 w-5" />
                  <span>Change Password</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center space-x-3 p-4 text-red-600 rounded-xl hover:bg-red-50 transition-colors mt-8"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign Out</span>
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* View All Tickets Modal */}
        {isViewAllTicketsModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              {/* Modal Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <Ticket className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">All Support Tickets</h2>
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm font-medium">
                      {clientTickets.length} tickets
                    </span>
                  </div>
                  <button
                    onClick={() => setIsViewAllTicketsModalOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                {isLoadingTickets ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                  </div>
                ) : clientTickets.length > 0 ? (
                  <div className="space-y-4">
                    {clientTickets.map((ticket, index) => (
                      <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-lg mb-1">{ticket.Subject}</h4>
                            <p className="text-sm text-gray-500">
                              Created: {ticket.CreatedAt ? new Date(ticket.CreatedAt).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ml-4
                            ${ticket.Status === "new" ? "bg-blue-100 text-blue-700" : 
                              ticket.Status === "in_progress" ? "bg-yellow-100 text-yellow-700" : 
                              ticket.Status === "resolved" ? "bg-green-100 text-green-700" : 
                              ticket.Status === "closed" ? "bg-gray-100 text-gray-700" : 
                              "bg-gray-100 text-gray-700"}`}
                          >
                            {ticket.Status === "new" ? 'New' : 
                            ticket.Status === "in_progress" ? 'In Progress' : 
                            ticket.Status === "resolved" ? 'Resolved' : 
                            ticket.Status === "closed" ? 'Closed' : 
                            ticket.Status}
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <h5 className="font-medium text-gray-700 mb-1">Description:</h5>
                            <p className="text-gray-600 text-sm leading-relaxed">{ticket.Description}</p>
                          </div>
                          
                          {ticket.Response && (
                            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                              <h5 className="font-medium text-green-800 mb-2">Support Response:</h5>
                              <p className="text-green-700 text-sm leading-relaxed">{ticket.Response}</p>
                            </div>
                          )}
                          
                          {ticket.Priority && (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">Priority:</span>
                              <span className={`px-2 py-1 rounded text-xs font-medium
                                ${ticket.Priority === 'high' ? 'bg-red-100 text-red-700' :
                                  ticket.Priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-700'}`}
                              >
                                {ticket.Priority}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2v-3a2 2 0 114 0v-3a2 2 0 002-2V7a2 2 0 00-2-2H5z" />
                    </svg>
                    <p className="text-gray-500">No support tickets found</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {clientTickets.length} {clientTickets.length === 1 ? 'ticket' : 'tickets'} total
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setIsViewAllTicketsModalOpen(false)}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setIsViewAllTicketsModalOpen(false);
                      setIsTicketModalOpen(true);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all"
                  >
                    Create New Ticket
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        
        
        {/* Modals */}
        <PaymentReceiptModal
          isOpen={isPaymentModalOpen}
          closeModal={() => setIsPaymentModalOpen(false)}
          clientName={client?.Name || ''}
          selectedBlock={selectedBalanceData?.Block}
          selectedLot={selectedBalanceData?.Lot}
          balanceRecords={balanceRecords}
        />

        <ViewPaymentModal
          isOpen={isViewPaymentModalOpen}
          onClose={() => setIsViewPaymentModalOpen(false)}
          payments={payments}
          isLoading={isLoadingPayments}
          clientName={client?.Name || ''}
        />

        <TicketSubmissionModal
          isOpen={isTicketModalOpen}
          closeModal={() => setIsTicketModalOpen(false)}
          clientName={client?.Name || ''}
          refreshTickets={fetchClientTicketsForComponent}
        />

        <ChangePasswordModal
          isOpen={isChangePasswordModalOpen}
          closeModal={() => setIsChangePasswordModalOpen(false)}
          userId={userId}
          onSuccess={() => {
            toast.success('Password changed successfully');
            setIsChangePasswordModalOpen(false);
          }}
        />
      </div>
    </PageTransition>
  );
};

export default ClientDashboardPage;
