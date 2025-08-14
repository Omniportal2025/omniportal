import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import PageTransition from '../../../components/PageTransition';
import { supabase, supabaseAdmin } from '../../../supabase/supabaseClient';

interface AgentData {
  id: number;
  fullname: string;
  email: string;
  phone: string;
  dpurl: string | null;
  status: 'active' | 'inactive';
  commission_rate?: number;
  total_sales?: number;
  created_at: string;
  assigned_projects?: string[];
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  tempPassword: string;
}

const AgentContent: FC = () => {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    tempPassword: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Profile picture state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, []);

  // Helper function to construct full URL from filename (like documents)
  const getImageUrl = (dpurl: string | null): string | null => {
    if (!dpurl) return null;
    
    // If it's already a complete URL, return as is (for backward compatibility)
    if (dpurl.includes('http')) {
      return dpurl;
    }
    
    // Construct the full URL from filename (same pattern as documents)
    const supabaseUrl = 'https://krrumlttvcgcnislqoxc.supabase.co';
    return `${supabaseUrl}/storage/v1/object/public/agentdp/${dpurl}`;
  };

  // Clean up preview URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const fetchAgents = async () => {
    try {
      console.log('Fetching agents...');
      setLoading(true);
      const { data, error } = await supabase
        .from('Agents')
        .select('id, fullname, email, phone, dpurl, status, created_at')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Agents fetched successfully:', data);
      setAgents(data || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
      setAgents([]);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const handleCreateAgent = () => {
    setIsModalOpen(true);
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('Image file must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    
    const newPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(newPreviewUrl);
    
    // Clear any previous errors
    if (error) setError('');
  };

  // Handle file upload to Supabase Storage - Following document upload pattern
  const uploadProfilePicture = async (_userId: string, fullName: string): Promise<string | null> => {
    if (!selectedFile) return null;

    try {
      setUploadingImage(true);
      
      // Get file extension
      const fileExt = selectedFile.name.split('.').pop();
      
      // Clean the full name for filename (same as document logic)
      const cleanedName = fullName.replace(/[^a-zA-Z0-9]/g, '_');
      
      // Create filename with format: "FirstName_LastName_timestamp.ext"
      const fileName = `${cleanedName}_${Date.now()}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('agentdp')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      console.log('Profile picture uploaded successfully:', fileName);
      
      // Return just the filename (like documents), not the full URL
      return fileName;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Remove selected image
  const removeImage = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle form submission
  const handleCreateAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError('');
    setSuccess('');

    try {
      // Validate form data
      if (!formData.fullName || !formData.email || !formData.phone || !formData.tempPassword) {
        throw new Error('Please fill in all required fields');
      }

      if (formData.tempPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Step 1: Create authentication user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: formData.email,
        password: formData.tempPassword,
        email_confirm: true
      });

      if (authError) throw authError;

      let profilePictureUrl = null;

      // Step 2: Upload profile picture if selected
      if (selectedFile) {
        try {
          profilePictureUrl = await uploadProfilePicture(authData.user.id, formData.fullName);
        } catch (uploadError) {
          console.error('Profile picture upload failed:', uploadError);
          // Continue with account creation even if image upload fails
          // You might want to show a warning instead of failing completely
        }
      }

      // Step 3: Create agent record in the agents table
      const { data: _agentData, error: agentError } = await supabase
        .from('Agents')
        .insert([
          {
            authid: authData.user.id,
            fullname: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            dpurl: profilePictureUrl, // This will be just the filename now
            status: 'active',
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (agentError) {
        // If agent creation fails, clean up auth user and uploaded image
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        
        if (profilePictureUrl && selectedFile) {
          // Remove the uploaded file using just the filename
          await supabase.storage.from('agentdp').remove([profilePictureUrl]);
        }
        
        throw agentError;
      }

      // Mock success for now - remove this when implementing real functionality
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      // Success
      setSuccess('Agent account created successfully!');
      
      // Reset form
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        tempPassword: ''
      });

      // Reset image state
      removeImage();

      // Close modal after a short delay
      setTimeout(() => {
        handleCloseModal();
        // Refresh the agents list
        fetchAgents();
      }, 2000);

    } catch (err: any) {
      console.error('Error creating agent:', err);
      setError(err.message || 'Failed to create agent account');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      tempPassword: ''
    });
    setError('');
    setSuccess('');
    setIsCreating(false);
    setShowPassword(false);
    setIsModalOpen(false);
    
    // Clean up image state
    removeImage();
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Agent Management</h1>
            <p className="text-gray-600">Manage and monitor sales agents</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg flex flex-col h-[calc(100vh-16rem)]">
            <div className="flex justify-center items-center h-full bg-gray-50">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent shadow-sm"></div>
                <p className="mt-4 text-sm font-medium text-gray-500">Loading agents...</p>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">Agent Management</h1>
              <p className="text-slate-300 mb-4">Manage and monitor your sales agents</p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div>
                    <span className="font-bold text-xl text-white">{agents.length}</span>
                    <span className="ml-2 text-slate-300 text-sm">Total Agents</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Create Agent Button */}
            <div className="flex items-center">
              <button 
                onClick={handleCreateAgent}
                className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {agents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Agents Found</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first agent account.</p>
              <button
                onClick={handleCreateAgent}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
              >
                Create First Agent
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Agents Grid */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Agent Cards</h2>
                <div className="flex flex-wrap justify-start gap-6 max-w-7xl">
                  {agents.map((agent) => (
                    <div key={agent.id} className="bg-white rounded-xl shadow-md hover:shadow-lg border border-gray-200 overflow-hidden transition-all duration-200 hover:-translate-y-1 w-full max-w-xs flex-shrink-0">
                      {/* Agent Card Header */}
                      <div className="p-6 text-center relative">
                        
                        {/* Profile Picture */}
                        <div className="relative inline-block mb-4">
                          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-gray-100 shadow-md bg-gray-50 relative">
                            {(() => {
                              const imageUrl = getImageUrl(agent.dpurl);
                              return imageUrl ? (
                                <img 
                                  src={imageUrl}
                                  alt={`${agent.fullname}'s profile`}
                                  className="w-full h-full object-cover rounded-full"
                                  crossOrigin="anonymous"
                                  loading="lazy"
                                  onLoad={(e) => {
                                    // Hide fallback when image loads successfully
                                    console.log('Image loaded successfully:', imageUrl);
                                    const target = e.target as HTMLImageElement;
                                    const parent = target.parentElement;
                                    if (parent) {
                                      const fallback = parent.querySelector('.fallback-avatar') as HTMLElement;
                                      if (fallback) fallback.style.display = 'none';
                                    }
                                  }}
                                  onError={(e) => {
                                    // Show fallback when image fails to load
                                    console.log('Image failed to load. Original dpurl:', agent.dpurl);
                                    console.log('Constructed URL:', imageUrl);
                                    
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                      const fallback = parent.querySelector('.fallback-avatar') as HTMLElement;
                                      if (fallback) {
                                        fallback.style.display = 'flex';
                                        fallback.classList.remove('hidden');
                                      }
                                    }
                                  }}
                                />
                              ) : null;
                            })()}
                            {/* Default Avatar - Always present as fallback */}
                            <div className={`fallback-avatar absolute inset-0 w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center ${agent.dpurl ? '' : 'flex'}`}>
                              <span className="text-white font-bold text-xl">
                                {agent.fullname.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </span>
                            </div>
                          </div>
                          
                          {/* Status Indicator - Fixed positioning */}
                          <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-3 border-white shadow-sm ${
                            agent.status === 'active' 
                              ? 'bg-green-600' 
                              : 'bg-gray-400'
                              }`}>
                            <div className="w-full h-full rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          </div>
                        </div>

                        {/* Agent Info */}
                        <div className="space-y-2">
                          <h3 className="font-semibold text-lg text-gray-900 truncate" title={agent.fullname}>
                            {agent.fullname}
                          </h3>
                          <p className="text-sm text-gray-600 truncate" title={agent.email}>
                            {agent.email}
                          </p>
                          <div className="flex items-center justify-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              agent.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                agent.status === 'active' ? 'bg-green-400' : 'bg-gray-400'
                              }`}></div>
                              {agent.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Agent Card Footer */}
                      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>Joined</span>
                          <span>{new Date(agent.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Agents Table */}
              <div>
                <h2 className="text-xl font-semibold text-slate-800 mb-4">Agent Details Table</h2>
                <div className="flex-1 overflow-auto bg-white rounded-xl shadow-sm border border-slate-200/60">
                  <table className="w-full">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">
                          Agent
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">
                          Join Date
                        </th>
                        <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {agents.map((agent) => (
                        <tr key={agent.id} className="group hover:bg-slate-50/80 transition-all duration-200 border-b border-slate-50 last:border-b-0">
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <div className="relative flex-shrink-0 h-10 w-10">
                                {(() => {
                                  const imageUrl = getImageUrl(agent.dpurl);
                                  return imageUrl ? (
                                    <img 
                                      src={imageUrl}
                                      alt={`${agent.fullname}'s profile`}
                                      className="h-10 w-10 rounded-full object-cover shadow-sm"
                                      crossOrigin="anonymous"
                                      loading="lazy"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent) {
                                          const fallback = parent.querySelector('.table-fallback-avatar') as HTMLElement;
                                          if (fallback) {
                                            fallback.style.display = 'flex';
                                            fallback.classList.remove('hidden');
                                          }
                                        }
                                      }}
                                    />
                                  ) : null;
                                })()}
                                <div className={`table-fallback-avatar absolute inset-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-sm ${agent.dpurl ? 'hidden' : 'flex'}`}>
                                  <span className="text-white font-medium text-sm">
                                    {agent.fullname.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-slate-800">
                                  {agent.fullname}
                                </div>
                                <div className="text-xs text-slate-500">
                                  ID: {agent.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-600">
                            {agent.email}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border shadow-sm ${
                              agent.status === 'active'
                                ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-200/60'
                                : 'bg-gradient-to-r from-slate-50 to-slate-100 text-slate-600 border-slate-200/60'
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                agent.status === 'active' ? 'bg-green-400' : 'bg-slate-400'
                              }`}></div>
                              {agent.status === 'active' ? 'Active' : 'Inactive'}
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-slate-700">
                            {new Date(agent.created_at).toLocaleDateString('en-PH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-center">
                            <div className="flex justify-center items-center space-x-2">
                              <button className="inline-flex items-center px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 rounded-lg border border-blue-200 hover:border-blue-300 transition-all duration-200 text-xs font-semibold shadow-sm hover:shadow-md">
                                <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                <span>Edit</span>
                              </button>
                              <button className="inline-flex items-center px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 rounded-lg border border-red-200 hover:border-red-300 transition-all duration-200 text-xs font-semibold shadow-sm hover:shadow-md">
                                <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Agent Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all scale-100 opacity-100 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Create Agent Account</h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-6">
              <p className="text-gray-600 mb-6">
                Create a new agent account to manage sales and commissions.
              </p>
              
              {/* Agent Creation Form */}
              <form onSubmit={handleCreateAgentSubmit} className="space-y-4">
                {/* Profile Picture Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Picture
                  </label>
                  
                  {/* Image Preview or Upload Area */}
                  <div className="flex flex-col items-center">
                    {previewUrl ? (
                      <div className="relative mb-4">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                          <img 
                            src={previewUrl} 
                            alt="Profile preview" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors duration-200"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div
                        onDragOver={handleDragOver}
                        className="w-full border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-lg p-6 text-center cursor-pointer transition-colors duration-200"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-gray-400">
                            PNG, JPG, WebP up to 5MB
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    
                    {!previewUrl && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Choose File
                      </button>
                    )}
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="Enter agent's full name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="agent@example.com"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="+63 912 345 6789"
                  />
                </div>

                {/* Temporary Password */}
                <div>
                  <label htmlFor="tempPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Temporary Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="tempPassword"
                      name="tempPassword"
                      value={formData.tempPassword}
                      onChange={handleInputChange}
                      required
                      minLength={6}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      placeholder="Minimum 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M9.878 9.878l4.242 4.242m0 0l1.414-1.414M9.878 9.878L8.464 8.464m5.656 5.656l1.414-1.414m-1.414 1.414L8.464 8.464" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Agent will be able to change this password after first login
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex">
                      <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="ml-2 text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {success && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex">
                      <svg className="w-5 h-5 text-green-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="ml-2 text-sm text-green-700">{success}</p>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 sticky bottom-0 bg-white rounded-b-2xl">
              <button
                onClick={handleCloseModal}
                disabled={isCreating || uploadingImage}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAgentSubmit}
                disabled={isCreating || uploadingImage}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 flex items-center"
              >
                {isCreating || uploadingImage ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {uploadingImage ? 'Uploading...' : 'Creating...'}
                  </>
                ) : (
                  'Create Agent'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
};

export default AgentContent;