import React, { useState, useEffect, useRef } from 'react';
import { File,Loader2, Download, Plus, X } from 'lucide-react';
import { supabase } from '../../../supabase/supabaseClient';

interface Document {
  id: string;
  Name: string;
  Address: string;
  'TIN ID': string;
  Email: string;
  'Contact No': string;
  'Marital Status': string;
  'Document URLs'?: string[]; // Changed to array for multiple documents
  created_at?: string;
}

const DocumentsContent: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'Name' | 'created_at'>('Name');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [downloadingItems, setDownloadingItems] = useState<Set<string>>(new Set());
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleFileUpload = async (file: File, documentId: string) => {
    try {
      setUploadingDocId(documentId);
      
      // Find the document to get the client name
      const document = documents.find(doc => doc.id === documentId);
      if (!document) {
        throw new Error('Document not found');
      }
      
      // Create filename using client name
      const fileExt = file.name.split('.').pop();
      const clientName = document.Name.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${clientName}_${Date.now()}.${fileExt}`;
      
      // Upload file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('Clients Document')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get existing document URLs or initialize empty array
      const existingUrls = document['Document URLs'] || [];
      const updatedUrls = [...existingUrls, fileName];

      // Update the document record with the new filename added to the array
      const { error: updateError } = await supabase
        .from('Documents')
        .update({ 'Document URLs': updatedUrls })
        .eq('id', documentId);

      if (updateError) {
        throw updateError;
      }

      // Update the local state
      setDocuments(prevDocs =>
        prevDocs.map(doc =>
          doc.id === documentId
            ? { ...doc, 'Document URLs': updatedUrls }
            : doc
        )
      );

      alert('Document uploaded successfully!');
    } catch (err) {
      console.error('Upload error:', err);
      alert(`Failed to upload document: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUploadingDocId(null);
      // Clear the file input
      if (fileInputRefs.current[documentId]) {
        fileInputRefs.current[documentId]!.value = '';
      }
    }
  };

  const handleDownloadDocument = async (fileNameOrUrl: string, clientName: string, documentId: string, docIndex: number) => {
    const downloadKey = `${documentId}-${docIndex}`;
    
    try {
      setDownloadingItems(prev => new Set([...prev, downloadKey]));

      console.log('Attempting to download:', fileNameOrUrl);
      
      // Check if it's a full URL or just a filename
      let fileName = fileNameOrUrl;
      if (fileNameOrUrl.includes('supabase') || fileNameOrUrl.includes('http')) {
        // Extract filename from URL
        const urlParts = fileNameOrUrl.split('/');
        fileName = urlParts[urlParts.length - 1];
        console.log('Extracted filename from URL:', fileName);
      }

      console.log('Using filename:', fileName);

      // Download the file from Supabase storage
      const { data, error } = await supabase.storage
        .from('Clients Document')
        .download(fileName);

      if (error) {
        console.error('Download error details:', error);
        
        if (error.message?.includes('not found') || error.message?.includes('404')) {
          throw new Error(`File "${fileName}" not found in storage. Please check if the file was uploaded correctly.`);
        } else if (error.message?.includes('unauthorized') || error.message?.includes('403')) {
          throw new Error('Access denied. Please check your storage bucket permissions.');
        } else {
          throw new Error(`Download failed: ${error.message || JSON.stringify(error)}`);
        }
      }

      if (!data) {
        throw new Error('No file data received from storage');
      }

      console.log('File downloaded successfully, size:', data.size, 'bytes');

      // Create a blob URL and trigger download
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${clientName.replace(/[^a-zA-Z0-9]/g, '_')}_document_${docIndex + 1}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Download error full details:', err);
      
      let errorMessage = 'Unknown error occurred';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      alert(`Failed to download document: ${errorMessage}`);
    } finally {
      setDownloadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(downloadKey);
        return newSet;
      });
    }
  };

  const handleRemoveDocument = async (documentId: string, docIndex: number) => {
    try {
      const document = documents.find(doc => doc.id === documentId);
      if (!document || !document['Document URLs']) return;

      const updatedUrls = document['Document URLs'].filter((_, index) => index !== docIndex);

      // Update the document record
      const { error: updateError } = await supabase
        .from('Documents')
        .update({ 'Document URLs': updatedUrls })
        .eq('id', documentId);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setDocuments(prevDocs =>
        prevDocs.map(doc =>
          doc.id === documentId
            ? { ...doc, 'Document URLs': updatedUrls }
            : doc
        )
      );

      // Optionally delete from storage
      const fileName = document['Document URLs'][docIndex];
      await supabase.storage.from('Clients Document').remove([fileName]);

    } catch (err) {
      console.error('Error removing document:', err);
      alert('Failed to remove document');
    }
  };

  const handleUploadClick = (documentId: string) => {
    const input = fileInputRefs.current[documentId];
    if (input) {
      input.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, documentId: string) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type (only PDFs)
      if (file.type !== 'application/pdf') {
        alert('Please select a PDF file only.');
        return;
      }
      
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        alert('File size must be less than 10MB.');
        return;
      }
      
      handleFileUpload(file, documentId);
    }
  };

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('Documents')
          .select('*')
          .order(sortBy, { ascending: true });

        if (error) throw error;
        
        // Convert old single URL format to array format for backward compatibility
        const processedData = data?.map(doc => ({
          ...doc,
          'Document URLs': doc['Document URL'] 
            ? [doc['Document URL']] 
            : (doc['Document URLs'] || [])
        })) || [];
        
        setDocuments(processedData);
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError('Failed to load documents. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [sortBy]);

  // Filter documents based on search query
  const filteredDocuments = documents.filter(doc =>
    doc.Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.Address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.Email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc['TIN ID']?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc['Contact No']?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc['Marital Status']?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="p-0">
      {/* Single Unified Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden" style={{ height: 'calc(100vh - 4rem)' }}>
        {/* Hero Header Section */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 relative overflow-hidden flex-shrink-0">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full transform translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full transform -translate-x-12 translate-y-12"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">
                  Documents
                </h1>
                <p className="text-slate-300 mb-4">
                  Manage and organize all your project documents in one place
                </p>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <File className="w-5 h-5 text-blue-300" />
                    </div>
                    <div>
                      <span className="font-bold text-xl text-white">{documents.length}</span>
                      <span className="ml-2 text-slate-300 text-sm">Total Documents</span>
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
                      <span className="font-bold text-xl text-white">{filteredDocuments.length}</span>
                      <span className="ml-2 text-slate-300 text-sm">Showing</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Search and Filters */}
              <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
                {/* Search Bar */}
                <div className="w-full lg:w-64">
                  <label className="block text-sm font-medium text-slate-100 mb-2">
                    Search Documents
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-10 pl-4 pr-10 text-sm bg-blue-700/50 border border-blue-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200 placeholder-blue-200/70 text-white"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      {searchQuery ? (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="text-blue-200 hover:text-white focus:outline-none"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                          </svg>
                        </button>
                      ) : (
                        <svg className="w-4 h-4 text-blue-200/70 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <circle cx="11" cy="11" r="8"></circle>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sort Filter */}
                <div className="w-full lg:w-48">
                  <label className="block text-sm font-medium text-slate-100 mb-2">
                    Sort By
                  </label>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'Name' | 'created_at')}
                      className="w-full h-10 pl-4 pr-8 text-sm bg-blue-700/50 border border-blue-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent cursor-pointer appearance-none transition-all duration-200 text-white"
                    >
                      <option value="Name">Document Name</option>
                      <option value="created_at">Upload Date</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-4 h-4 text-blue-200/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section - The scrollable table area */}
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-gradient-to-r from-slate-50 to-slate-100">
              <tr className="border-b border-slate-200">
                <th scope="col" className="py-4 pl-6 pr-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">
                  Name
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">
                  Address
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">
                  TIN ID
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">
                  Email
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">
                  Contact No
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">
                  Marital Status
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">
                  Uploaded
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">
                  Documents
                </th>
                <th scope="col" className="relative py-4 pl-3 pr-6 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-2" />
                      <p className="text-slate-600">Loading documents...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="text-red-600">{error}</div>
                  </td>
                </tr>
              ) : filteredDocuments.length > 0 ? (
                filteredDocuments.map((doc) => (
                  <tr 
                    key={doc.id} 
                    className="group hover:bg-slate-50/80 cursor-pointer transition-all duration-200 border-b border-slate-50 last:border-b-0"
                  >
                    <td className="whitespace-nowrap py-5 pl-6 pr-3 text-sm font-bold text-slate-900">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full shadow-sm"></div>
                        <span>{doc.Name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-700 max-w-xs">
                      <div className="truncate" title={doc.Address}>
                        {doc.Address || 'N/A'}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-5 text-sm font-semibold text-slate-800">
                      {doc['TIN ID'] || 'N/A'}
                    </td>
                    <td className="px-6 py-5 text-sm">
                      <div className="text-blue-600 hover:text-blue-800 transition-colors">
                        {doc.Email || 'N/A'}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-700">
                      {doc['Contact No'] || 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-5 text-sm">
                      <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r shadow-sm ${
                        doc['Marital Status'] === 'Married' 
                          ? 'from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-200/60' 
                          : doc['Marital Status'] === 'Single'
                          ? 'from-blue-50 to-blue-100 text-blue-700 border border-blue-200/60'
                          : 'from-slate-50 to-slate-100 text-slate-600 border border-slate-200/60'
                      }`}>
                        {doc['Marital Status'] || 'N/A'}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-500">
                      {formatDate(doc.created_at || '')}
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-2">
                        {doc['Document URLs'] && doc['Document URLs'].length > 0 ? (
                          doc['Document URLs'].map((docUrl, index) => {
                            const downloadKey = `${doc.id}-${index}`;
                            const isDownloading = downloadingItems.has(downloadKey);
                            
                            return (
                              <div key={index} className="flex items-center gap-2">
                                <button
                                  onClick={() => handleDownloadDocument(docUrl, doc.Name, doc.id, index)}
                                  disabled={isDownloading}
                                  className="inline-flex items-center px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 rounded-lg border border-blue-200 hover:border-blue-300 transition-all duration-200 text-xs font-semibold shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isDownloading ? (
                                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                  ) : (
                                    <Download className="w-3 h-3 mr-1.5" />
                                  )}
                                  {isDownloading ? 'Downloading...' : `PDF ${index + 1}`}
                                </button>
                                <button
                                  onClick={() => handleRemoveDocument(doc.id, index)}
                                  className="inline-flex items-center justify-center w-7 h-7 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                                  title="Remove document"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })
                        ) : (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs text-slate-400 bg-slate-50 border border-slate-200 italic">
                            No documents
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="relative whitespace-nowrap py-5 pl-3 pr-6 text-center">
                      <input
                        type="file"
                        ref={(el) => (fileInputRefs.current[doc.id] = el)}
                        onChange={(e) => handleFileChange(e, doc.id)}
                        accept=".pdf"
                        className="hidden"
                      />
                      <button 
                        onClick={() => handleUploadClick(doc.id)}
                        disabled={uploadingDocId === doc.id}
                        className="inline-flex items-center px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 rounded-lg border border-blue-200 hover:border-blue-300 transition-all duration-200 text-xs font-semibold shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed group-hover:shadow-md"
                        title="Upload new document"
                      >
                        {uploadingDocId === doc.id ? (
                          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4 mr-1.5" />
                        )}
                        Upload
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">
                        <File className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 mb-1">No documents found</h3>
                      <p className="text-slate-500 max-w-md">
                        {searchQuery
                          ? 'No documents match your search criteria.'
                          : 'No documents available. Get started by adding a new document.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DocumentsContent;