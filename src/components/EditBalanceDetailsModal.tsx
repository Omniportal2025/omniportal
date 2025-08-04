import React, { useState, useEffect } from 'react';

export interface EditBalanceDetailsData {
  id: number;
  Name: string;
  Block: string;
  Lot: string;
  Project: string;
  Terms: string;
  TCP: number | null;
  Amount: number | null;
  "Remaining Balance": number | null;
  "Monthly Amortization": number | null;
  "Months Paid": string;
  "MONTHS PAID": string;
  "Due Date": string | null;
  "sqm"?: number | null;
  "pricepersqm"?: number | null;
}

interface EditBalanceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EditBalanceDetailsData) => void;
  data: EditBalanceDetailsData;
}

const PROJECTS = ['Living Water Subdivision', 'Havahills Estate'];

const EditBalanceDetailsModal: React.FC<EditBalanceDetailsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  data
}) => {
  const [formData, setFormData] = useState<EditBalanceDetailsData>({
    id: 0,
    Name: '',
    Block: '',
    Lot: '',
    Project: '',
    Terms: '',
    TCP: null,
    Amount: null,
    "Remaining Balance": null,
    "Monthly Amortization": null,
    "Months Paid": '',
    "MONTHS PAID": '',
    "Due Date": null,
    "sqm": null,
    "pricepersqm": null
  });

  useEffect(() => {
    if (data) {
      setFormData({
        ...data,
        "Due Date": data["Due Date"] || ''
      });
    }
  }, [data]);

  const handleInputChange = (field: keyof EditBalanceDetailsData, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNumberChange = (field: keyof EditBalanceDetailsData, value: string) => {
    const numValue = value === '' ? null : parseFloat(value.replace(/,/g, ''));
    handleInputChange(field, isNaN(numValue as number) ? null : numValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const formatNumberForInput = (value: number | null | undefined): string => {
    return value === null || value === undefined ? '' : value.toString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="bg-[#0A0D50] text-white p-1.5 rounded-lg">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </span>
                Edit Balance Details
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none bg-white hover:bg-gray-50 rounded-lg p-1.5 transition-colors duration-150"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={formData.Name}
                    onChange={(e) => handleInputChange('Name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                    placeholder="Enter client name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project
                  </label>
                  <select
                    value={formData.Project}
                    onChange={(e) => handleInputChange('Project', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 cursor-pointer"
                    required
                  >
                    <option value="">Select project</option>
                    {PROJECTS.map((project) => (
                      <option key={project} value={project}>
                        {project}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Block
                  </label>
                  <input
                    type="text"
                    value={formData.Block}
                    onChange={(e) => handleInputChange('Block', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                    placeholder="Enter block number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lot
                  </label>
                  <input
                    type="text"
                    value={formData.Lot}
                    onChange={(e) => handleInputChange('Lot', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                    placeholder="Enter lot number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SQM
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formatNumberForInput(formData.sqm)}
                    onChange={(e) => handleNumberChange('sqm', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Per SQM
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formatNumberForInput(formData["pricepersqm"])}
                    onChange={(e) => handleNumberChange('pricepersqm', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">
                Financial Information
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Contract Price (TCP)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formatNumberForInput(formData.TCP)}
                    onChange={(e) => handleNumberChange('TCP', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount Paid
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formatNumberForInput(formData.Amount)}
                    onChange={(e) => handleNumberChange('Amount', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remaining Balance
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formatNumberForInput(formData["Remaining Balance"])}
                    onChange={(e) => handleNumberChange('Remaining Balance', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Amortization
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formatNumberForInput(formData["Monthly Amortization"])}
                    onChange={(e) => handleNumberChange('Monthly Amortization', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">
                Payment Information
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Terms (Total Months)
                  </label>
                  <input
                    type="text"
                    value={formData.Terms}
                    onChange={(e) => handleInputChange('Terms', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                    placeholder="e.g., 36"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Months Paid (Display)
                  </label>
                  <input
                    type="text"
                    value={formData["Months Paid"]}
                    onChange={(e) => handleInputChange('Months Paid', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                    placeholder="e.g., 12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    MONTHS PAID (Counter)
                  </label>
                  <input
                    type="text"
                    value={formData["MONTHS PAID"]}
                    onChange={(e) => handleInputChange('MONTHS PAID', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                    placeholder="e.g., 12"
                  />
                </div>
              </div>

              <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <select
              value={formData["Due Date"] || ''}
              onChange={(e) => handleInputChange('Due Date', e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
            >
              <option value="">Select Due Date</option>
              <option value="15th">15th</option>
              <option value="30th">30th</option>
            </select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-[#0A0D50] hover:bg-[#0A0D50]/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBalanceDetailsModal;