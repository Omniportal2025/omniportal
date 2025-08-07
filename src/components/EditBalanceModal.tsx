import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { supabase } from '../supabase/supabaseClient';

interface EditBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EditBalanceData) => Promise<void>;
  data: EditBalanceData | null;
}

export interface EditBalanceData {
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
  "Penalty"?: number | null;
  "Payment Type"?: string;
  "Due Date"?: string | null;
  Vat?: string | null;
}

interface PaymentRecord {
  "Name": string;
  "Amount": number;
  "Project": string;
  "Block": string;
  "Lot": string;
  "Payment Type": string;
  "Penalty"?: number;
  "Payment for the Month of": string;
  "Due Date"?: string;
  Vat?: string | null;
}

const EditBalanceModal: React.FC<EditBalanceModalProps> = ({ isOpen, onClose, onSave, data }) => {
  const [formData, setFormData] = React.useState<EditBalanceData | null>(data);
  const [loading, setLoading] = React.useState(false);
  const [currentRemainingBalance, setCurrentRemainingBalance] = React.useState<number | null>(data?.["Remaining Balance"] || 0);
  const [totalAmount, setTotalAmount] = React.useState<number | null>(data?.Amount || 0);
  const [penalty, setPenalty] = React.useState<number | null>(null);
  const [paymentType, setPaymentType] = React.useState<string>('GCASH');
  const [paymentMonth, setPaymentMonth] = React.useState<string>('');
  const [dueDate, setDueDate] = React.useState<string>(data?.["Due Date"] === "15th" || data?.["Due Date"] === "30th" ? data["Due Date"] : "30th");
  const [vat, setVat] = React.useState<string>('Non Vat');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const paymentTypes = [
    'GCASH',
    'SB-HRM',
    'SB-LWS',
    'SB-HHE',
    'CBS-LWS',
    'CBS-HHE'
  ];

  React.useEffect(() => {
    if (data) {
      setFormData({
        ...data,
        "Amount": null,
        "Penalty": null,
        "Payment Type": 'cash',
        Vat: 'Non Vat',
      });
      setCurrentRemainingBalance(data["Remaining Balance"]);
      setTotalAmount(data.Amount);
      setPenalty(null);
      setPaymentType('cash');
      setDueDate(data?.["Due Date"] === "15th" || data?.["Due Date"] === "30th" ? data["Due Date"] : "30th");
      setVat('Non Vat');
    }
  }, [data]);

  if (!formData) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !data) return;

    console.log("Due Date to be saved:", dueDate); // DEBUG
    try {
      setLoading(true);
      // Get the current values
      const currentAmount = data.Amount || 0;
      const currentMonthsPaid = parseInt(data['MONTHS PAID'] || '0');
      const newPaymentAmount = formData['Amount'] ? parseFloat(formData['Amount'].toString()) : 0;
      const currentRemainingBalance = data["Remaining Balance"] || 0;
      
      // Calculate new values
      const newTotalAmount = currentAmount + newPaymentAmount;
      const newRemainingBalance = currentRemainingBalance - newPaymentAmount;
      const newMonthsPaid = currentMonthsPaid + 1; // Increment months paid by 1

      // Update the Balance table with all the data
      const updatedData = {
        ...data, // Keep all existing data
        ...formData, // Override with any changed fields
        'Remaining Balance': newRemainingBalance,
        'Amount': newTotalAmount,
        'MONTHS PAID': newMonthsPaid.toString(),
        'Due Date': dueDate,
        Vat: vat,
      };

      // First update the Balance table
      await onSave(updatedData);

      // Then save basic payment info to Payment Record table
      const paymentRecord: PaymentRecord = {
        "Name": data.Name,
        "Amount": newPaymentAmount,
        "Project": data.Project,
        "Block": data.Block,
        "Lot": data.Lot,
        "Payment Type": paymentType,
        "Payment for the Month of": paymentMonth,
        "Due Date": dueDate,
        Vat: vat,
      };

      // Only add penalty if it has a value
      if (penalty !== null && penalty > 0) {
        paymentRecord["Penalty"] = penalty;
      }

      const { error: paymentError } = await supabase
        .from('Payment Record')
        .insert([paymentRecord]);

      if (paymentError) {
        throw paymentError;
      }

      onClose();
    } catch (error) {
      console.error('Error saving balance:', error);
      alert('Error saving payment: ' + (error as any)?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'Amount') {
      // Allow empty value to clear the field
      if (value === '') {
        setFormData(prev => prev ? {
          ...prev,
          [field]: null
        } : null);
        setCurrentRemainingBalance(formData?.TCP || 0);
        setTotalAmount(data?.Amount || 0);
        return;
      }
      
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) return;
      
      setFormData(prev => prev ? {
        ...prev,
        [field]: numValue
      } : null);

      // Calculate new remaining balance and update total amount
      if (formData?.TCP) {
        const newBalance = formData.TCP - (data?.Amount || 0) - numValue;
        setCurrentRemainingBalance(newBalance);
        setTotalAmount((data?.Amount || 0) + numValue);
      }
    } else if (field === 'Penalty') {
      if (value === '') {
        setPenalty(null);
        return;
      }
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) return;
      setPenalty(numValue);
    } else {
      setFormData(prev => prev ? {
        ...prev,
        [field]: value
      } : null);
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
              <Dialog.Panel className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">
                        Add Payment
                        <span className="text-sm font-normal text-gray-500 ml-2">Record a new payment for this client</span>
                      </h3>
                      <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 focus:outline-none"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
  
                  {/* Form Content */}
                  <div className="px-6 py-6 space-y-6">
                    {/* Client Information */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">
                        Client Information
                      </h4>
                      
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500 font-medium">Project:</span>
                            <span className="text-gray-900 font-semibold">{formData.Project}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 font-medium">Block:</span>
                            <span className="text-gray-900 font-semibold">{formData.Block}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 font-medium">Lot:</span>
                            <span className="text-gray-900 font-semibold">{formData.Lot}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 font-medium">Name:</span>
                            <span className="text-gray-900 font-semibold">{formData.Name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 font-medium">Remaining Balance:</span>
                            <span className="text-gray-900 font-semibold">
                              {new Intl.NumberFormat('en-PH', {
                                style: 'currency',
                                currency: 'PHP',
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              }).format(currentRemainingBalance || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 font-medium">Total Amount:</span>
                            <span className="text-gray-900 font-semibold">
                              {new Intl.NumberFormat('en-PH', {
                                style: 'currency',
                                currency: 'PHP',
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              }).format(totalAmount || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 font-medium">TCP:</span>
                            <span className="text-gray-900 font-semibold">
                              {new Intl.NumberFormat('en-PH', {
                                style: 'currency',
                                currency: 'PHP',
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              }).format(formData['TCP'] || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 font-medium">Months Paid:</span>
                            <span className="text-gray-900 font-semibold">{formData['Months Paid']}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 font-medium">MONTHS PAID:</span>
                            <span className="text-gray-900 font-semibold">{formData['MONTHS PAID'] || ''}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 font-medium">Terms:</span>
                            <span className="text-gray-900 font-semibold">{formData['Terms']}</span>
                          </div>
                        </div>
                      </div>
                    </div>
  
                    {/* Payment Details */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">
                        Payment Details
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Amount
                          </label>
                          <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <span className="text-gray-500 sm:text-sm">₱</span>
                            </div>
                            <input
                              type="number"
                              id="amount"
                              value={formData?.Amount || ''}
                              onChange={(e) => handleInputChange('Amount', e.target.value)}
                              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
  
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Penalty
                          </label>
                          <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <span className="text-gray-500 sm:text-sm">₱</span>
                            </div>
                            <input
                              type="number"
                              id="penalty"
                              value={penalty || ''}
                              onChange={(e) => handleInputChange('Penalty', e.target.value)}
                              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </div>
  
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            VAT
                          </label>
                          <select
                            id="vat"
                            value={vat}
                            onChange={(e) => setVat(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="Non Vat">Non Vat</option>
                            <option value="Vatable">Vatable</option>
                          </select>
                        </div>
  
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Type
                          </label>
                          <select
                            id="paymentType"
                            value={paymentType}
                            onChange={(e) => setPaymentType(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            {paymentTypes.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
  
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment for the Month of
                          </label>
                          <select
                            id="paymentMonth"
                            value={paymentMonth}
                            onChange={(e) => setPaymentMonth(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            required
                          >
                            <option value="">Select Month</option>
                            {months.map((month) => (
                              <option key={month} value={month}>{month}</option>
                            ))}
                          </select>
                        </div>
  
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Due Date
                          </label>
                          <select
                            id="dueDate"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            required
                          >
                            <option value="15th">15th</option>
                            <option value="30th">30th</option>
                          </select>
                        </div>
                      </div>
  
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Months Paid
                          </label>
                          <input
                            type="text"
                            id="monthsPaid"
                            value={formData?.["Months Paid"] || ''}
                            onChange={(e) => handleInputChange("Months Paid", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g. March 22 - February 25"
                          />
                        </div>
  
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            MONTHS PAID
                          </label>
                          <input
                            type="text"
                            id="MONTHSPAID"
                            value={formData?.["MONTHS PAID"] || ''}
                            onChange={(e) => handleInputChange("MONTHS PAID", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g. 37"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
  
                  {/* Footer */}
                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default EditBalanceModal;
