import React, { useEffect, useState } from 'react';
import { supabase } from '../../../supabase/supabaseClient';
import { X } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

interface Client {
  id: number;
  Name: string;
  Email?: string | null;
  auth_id?: string | null;
  is_active?: boolean;
}

interface CreateAccountModalProps {
  isOpen: boolean;
  closeModal: () => void;
  clientName: string;
  clientId: number;
}

const CreateAccountModal: React.FC<CreateAccountModalProps> = ({ isOpen, closeModal, clientName, clientId }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [clientHasAccount, setClientHasAccount] = useState(false);

  useEffect(() => {
    // Check if client already has an account when modal opens
    const checkClientAccount = async () => {
      try {
        const { data, error } = await supabase
          .from('Clients')
          .select('auth_id')
          .eq('id', clientId)
          .single();
        
        if (error) throw error;
        
        if (data && data.auth_id) {
          setClientHasAccount(true);
          setError("This client already has an account. Please use a different client.");
        } else {
          setClientHasAccount(false);
          setError(null);
        }
      } catch (err) {
        console.error("Error checking client account:", err);
      }
    };

    if (isOpen) {
      checkClientAccount();
    }
  }, [isOpen, clientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // First update the client with the email
      const { error: emailUpdateError } = await supabase
        .from('Clients')
        .update({ Email: email })
        .eq('id', clientId);

      if (emailUpdateError) throw emailUpdateError;

      // Then create auth user with email confirmation
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://omniportal2025.github.io/Omniportal/login',
          data: {
            is_client: true,
            client_name: clientName,
            client_email: email,
            client_password: password
          }
        }
      });

      if (authError) {
        // If auth creation fails, remove the email from the client
        await supabase
          .from('Clients')
          .update({ Email: null })
          .eq('id', clientId);
        throw authError;
      }

      // Get the auth_id from the created user
      const auth_id = data?.user?.id;
      
      if (!auth_id) {
        // If no auth_id, remove the email from the client
        await supabase
          .from('Clients')
          .update({ Email: null })
          .eq('id', clientId);
        throw new Error('Failed to get auth_id');
      }

      console.log("User created:", data.user);
      
      // Update client with auth_id
      const { error: updateError } = await supabase
        .from('Clients')
        .update({ auth_id: auth_id })
        .eq('id', clientId);

      if (updateError) {
        // If update fails, we should delete the auth user to maintain consistency
        await supabase.auth.admin.deleteUser(auth_id);
        throw updateError;
      }

      // Check if email confirmation is required
      if (data.user?.identities?.[0]?.identity_data?.email_confirmed_at === null) {
        console.log("Email confirmation required. Check your email inbox.");
        setSuccess(true);
        alert("Account created! Please check your email to confirm your account. The email contains login credentials.");
      } else {
        console.log("Email already confirmed or confirmation bypassed");
      }

      setSuccess(true);
      setTimeout(() => {
        closeModal();
        setSuccess(false);
        setEmail('');
        setPassword('');
      }, 3000);
    } catch (err: any) {
      console.error("Account creation error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={closeModal}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal content */}
        <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-semibold leading-6 text-gray-900 mb-2">
                  Create Account
                </h3>
                <p className="text-sm text-gray-500">
                  Setting up an account for <span className="font-medium text-gray-900">{clientName}</span>
                </p>
              </div>
              <button
                onClick={closeModal}
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <span className="sr-only">Close</span>
                <X className="h-6 w-6" />
              </button>
            </div>
  
            {success ? (
              <div className="mt-6">
                <div className="rounded-lg bg-green-50 p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <p className="mt-4 text-lg font-semibold text-green-800">Account created successfully!</p>
                  <p className="mt-2 text-sm text-green-700">An email has been sent with login credentials and instructions.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                    Email address
                  </label>
                  <div className="relative mt-2 rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                        <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-md border-0 py-2.5 pl-11 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 hover:ring-gray-400 transition-all duration-200 sm:text-sm"
                      placeholder="Enter client's email address"
                      required
                    />
                  </div>
                </div>
  
                {/* Password field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                    Password
                  </label>
                  <div className="relative mt-2 rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-md border-0 py-2.5 pl-11 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 hover:ring-gray-400 transition-all duration-200 sm:text-sm"
                      placeholder="Enter a secure password"
                      required
                      minLength={6}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500 flex items-center">
                    <svg className="mr-1.5 h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                    </svg>
                    Password must be at least 6 characters
                  </p>
                  <p className="mt-2 text-sm text-gray-500 flex items-center">
                    <svg className="mr-1.5 h-4 w-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                    </svg>
                    These credentials will be sent to the client's email
                  </p>
                </div>
  
                {/* Error messages */}
                {error && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
  
                {clientHasAccount && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">This client already has an account. Please use a different client.</p>
                      </div>
                    </div>
                  </div>
                )}
  
                {/* Submit button */}
                <div>
                  <button
                    type="submit"
                    disabled={loading || clientHasAccount}
                    className={`w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      clientHasAccount 
                        ? 'text-gray-500 bg-gray-50 cursor-not-allowed' 
                        : 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    }`}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating account...
                      </>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        {clientHasAccount ? (
                          <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 2a4 4 0 100 8 4 4 0 000-8zM5.293 9.707a1 1 0 011.414 0L10 13l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a7 7 0 100 14 7 7 0 000-14zm-9 7a9 9 0 1118 0 9 9 0 01-18 0zm10-4a1 1 0 00-2 0v3H6a1 1 0 100 2h3v3a1 1 0 102 0v-3h3a1 1 0 100-2h-3V6z" clipRule="evenodd" />
                          </svg>
                        )}
                        {clientHasAccount ? 'Account Exists' : 'Create Account'}
                      </span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  };

const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [accountStatus, setAccountStatus] = useState<'all' | 'with_account' | 'without_account'>('all');
  const [livingWaterOwners, setLivingWaterOwners] = useState<string[]>([]);
  const [havahillsBuyers, setHavahillsBuyers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [sortBy, setSortBy] = useState<'firstName' | 'lastName'>('firstName');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  
  const itemsPerPage = 15;
  const projects = ['Living Water Subdivision', 'Havahills Estate'];

  useEffect(() => {
    fetchClients();
    fetchLivingWaterOwners();
    fetchHavahillsBuyers();
  }, []);

  useEffect(() => {
    console.log('Sort by changed to:', sortBy);
    fetchClients();
  }, [sortBy]);

  const fetchLivingWaterOwners = async () => {
    try {
      const { data, error } = await supabase
        .from('Living Water Subdivision')
        .select('Owner');

      if (error) throw error;

      const owners = data?.map(item => item.Owner) || [];
      console.log('Living Water Owners:', owners);
      setLivingWaterOwners(owners);
    } catch (error) {
      console.error('Error fetching Living Water owners:', error);
    }
  };

  const fetchHavahillsBuyers = async () => {
    try {
      const { data, error } = await supabase
        .from('Havahills Estate')
        .select('"Buyers Name"');

      if (error) throw error;

      const buyers = data?.map(item => item['Buyers Name']) || [];
      console.log('Havahills Buyers:', buyers);
      setHavahillsBuyers(buyers);
    } catch (error) {
      console.error('Error fetching Havahills buyers:', error);
    }
  };

  useEffect(() => {
    let filtered = [...clients];

    // Apply project filter
    if (selectedProject !== 'all') {
      console.log('Selected Project:', selectedProject);
      console.log('Current Clients:', clients);
      console.log('Living Water Owners:', livingWaterOwners);
      console.log('Havahills Buyers:', havahillsBuyers);
      
      filtered = filtered.filter(client => {
        if (selectedProject === 'Living Water Subdivision') {
          const isMatch = livingWaterOwners.some(owner => 
            owner?.toLowerCase() === client.Name?.toLowerCase()
          );
          console.log(`Checking ${client.Name} against Living Water:`, isMatch);
          return isMatch;
        } else if (selectedProject === 'Havahills Estate') {
          const isMatch = havahillsBuyers.some(buyer => 
            buyer?.toLowerCase() === client.Name?.toLowerCase()
          );
          console.log(`Checking ${client.Name} against Havahills:`, isMatch);
          return isMatch;
        }
        return true;
      });
      
      console.log('Filtered Clients:', filtered);
    }

    // Apply account status filter
    if (accountStatus !== 'all') {
      filtered = filtered.filter(client => {
        if (accountStatus === 'with_account') {
          return !!client.auth_id;
        } else {
          return !client.auth_id;
        }
      });
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(client =>
        client.Name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredClients(filtered);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setCurrentPage(1); // Reset to first page when filters change
  }, [clients, searchQuery, selectedProject, livingWaterOwners, havahillsBuyers, accountStatus]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      console.log('Fetching clients with sort by:', sortBy);
      
      // Always fetch by Name since we don't have separate firstName/lastName columns
      const { data, error } = await supabase
        .from('Clients')
        .select('id, Name, Email, auth_id, is_active')
        .order('Name', { ascending: true });

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      console.log('Fetched clients data:', data);
      
      // Sort the data client-side based on first or last name
      let sortedData = [...(data || [])];
      console.log('Applying client-side sorting for:', sortBy);
      sortedData.sort((a, b) => {
        // Make sure Name exists and is a string
        const nameA = typeof a.Name === 'string' ? a.Name : '';
        const nameB = typeof b.Name === 'string' ? b.Name : '';
        
        const nameParts_a = nameA.split(' ');
        const nameParts_b = nameB.split(' ');
        
        console.log('Comparing names:', nameA, nameB);
        
        if (sortBy === 'firstName') {
          // Compare first parts of names
          const firstName_a = nameParts_a.length > 0 ? nameParts_a[0] : '';
          const firstName_b = nameParts_b.length > 0 ? nameParts_b[0] : '';
          console.log('First names:', firstName_a, firstName_b);
          return firstName_a.localeCompare(firstName_b);
        } else if (sortBy === 'lastName') {
          // Compare last parts of names
          const lastName_a = nameParts_a.length > 1 ? nameParts_a[nameParts_a.length - 1] : '';
          const lastName_b = nameParts_b.length > 1 ? nameParts_b[nameParts_b.length - 1] : '';
          console.log('Last names:', lastName_a, lastName_b);
          return lastName_a.localeCompare(lastName_b);
        }
        return 0;
      });
      console.log('Sorted data:', sortedData.map(c => c.Name));
      
      setClients(sortedData);
      setFilteredClients(sortedData);
      setTotalPages(Math.ceil((sortedData?.length || 0) / itemsPerPage));
    } catch (error) {
      console.error('Error fetching clients:', error);
      setError('Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  // Get current page's clients
  const getCurrentPageClients = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredClients.slice(startIndex, startIndex + itemsPerPage);
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handleDelete = async (client: Client) => {
    setClientToDelete(client);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;
  
    try {
      // Create a new Supabase client with service role key
      const supabaseAdmin = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false
          }
        }
      );

      // Only try to delete auth user if auth_id exists
      if (clientToDelete.auth_id) {
        try {
          // First, verify the service role key is working
          const { data: _testData, error: testError } = await supabaseAdmin
            .from('Clients')
            .select('*')
            .limit(1);
      
          if (testError) {
            console.error('Service role key test failed:', testError);
            throw new Error('Service role key verification failed. Check your .env file.');
          }
      
          // Then delete the auth user
          const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
            clientToDelete.auth_id
          );
          
          if (authError && authError.status !== 404) { // Only throw if it's not a "not found" error
            console.error('Auth deletion error:', authError);
            throw new Error(`Auth deletion failed: ${authError.message}`);
          }
        } catch (error: any) {
          // If it's a 404 error (user not found in auth), we can continue
          if (error.message.includes('User not found') || error.message.includes('404')) {
            console.log('Auth user not found, continuing with client record cleanup');
          } else {
            throw error; // Re-throw other errors
          }
        }
      }

      // Update the client record to clear auth_id and Email
      const { error: updateError } = await supabaseAdmin
        .from('Clients')
        .update({ 
          auth_id: null, 
          Email: null,
        })
        .eq('id', clientToDelete.id);

      if (updateError) {
        console.error('Failed to update client record:', updateError);
        throw new Error('Failed to update client record');
      }
  
      // Update local state
      setClients(prevClients =>
        prevClients.map(c =>
          c.id === clientToDelete.id
            ? { ...c, auth_id: null, Email: null }
            : c
        )
      );
  
      setShowDeleteConfirm(false);
      setClientToDelete(null);
      alert('Client account removed successfully');
    } catch (error: any) {
      console.error('Error:', error);
      alert(`Failed to remove account: ${error.message}`);
    }
  };

  if (error) {
    return <div className="text-red-600 p-4">{error}</div>;
  }

  return (
    <div className="p-0">
      {/* Single Unified Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden h-[calc(100vh-4.5rem)]">
        {/* Hero Header Section */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-5 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full transform translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full transform -translate-x-12 translate-y-12"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">
                  Clients Dashboard
                </h1>
                <p className="text-slate-300 mb-4">
                  Manage and track all your clients in one place
                </p>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <div>
                      <span className="font-bold text-xl text-white">{getCurrentPageClients().length}</span>
                      <span className="ml-2 text-slate-300 text-sm">Total Clients</span>
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
                      <span className="font-bold text-xl text-white">{filteredClients.filter(client => client.auth_id).length}</span>
                      <span className="ml-2 text-slate-300 text-sm">With Accounts</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Search and Filters - Integrated into Header */}
              <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
                {/* Search Bar */}
                <div className="w-full lg:w-64">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Search Clients
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search clients..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-10 pl-4 pr-10 text-sm bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 placeholder-slate-400 text-white"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      {searchQuery ? (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="text-slate-400 hover:text-slate-300 focus:outline-none"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                          </svg>
                        </button>
                      ) : (
                        <svg className="w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <circle cx="11" cy="11" r="8"></circle>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                      )}
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
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'firstName' | 'lastName')}
                      className="w-full h-10 pl-4 pr-8 text-sm bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent cursor-pointer appearance-none transition-all duration-200 text-white"
                    >
                      <option value="firstName">Sort by First Name</option>
                      <option value="lastName">Sort by Last Name</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
                      <option value="all">All Projects</option>
                      {projects.map((project) => (
                        <option key={project} value={project}>
                          {project}
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

                {/* Account Status Filter */}
                <div className="w-full lg:w-48">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Account Status
                  </label>
                  <div className="relative">
                    <select
                      value={accountStatus}
                      onChange={(e) => setAccountStatus(e.target.value as 'all' | 'with_account' | 'without_account')}
                      className="w-full h-10 pl-4 pr-8 text-sm bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent cursor-pointer appearance-none transition-all duration-200 text-white"
                    >
                      <option value="all">All Accounts</option>
                      <option value="with_account">With Account</option>
                      <option value="without_account">Without Account</option>
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

        {/* Content Section */}
        <div className="flex-1 flex flex-col">
          {loading ? (
            <div className="flex-1 flex justify-center items-center bg-slate-50">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-blue-500 shadow-sm"></div>
                <p className="mt-4 text-lg text-slate-600 font-medium">Loading clients...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Table Container - Now seamlessly integrated */}
              <div className="flex-1 overflow-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-800 sticky top-0 z-10">
                    <tr>
                      <th scope="col" className="py-4 pl-6 pr-3 text-left text-sm font-semibold uppercase tracking-wider text-white">
                        Client Information
                      </th>
                      <th scope="col" className="relative py-4 pl-3 pr-6 text-right text-sm font-semibold uppercase tracking-wider text-white">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {getCurrentPageClients().map((client) => (
                      <tr key={client.id} className="hover:bg-slate-50 transition-colors duration-200">
                        <td className="whitespace-nowrap py-4 pl-6 pr-3">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                <span className="text-sm font-medium text-white">
                                  {client.Name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-slate-900">{client.Name}</div>
                              <div className="flex items-center mt-1">
                                {client.auth_id ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                    <svg className="h-3 w-3 text-emerald-500" fill="currentColor" viewBox="0 0 8 8">
                                      <circle cx="4" cy="4" r="3" />
                                    </svg>
                                    Account Active
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                    <svg className="h-3 w-3 text-amber-500" fill="currentColor" viewBox="0 0 8 8">
                                      <circle cx="4" cy="4" r="3" />
                                    </svg>
                                    No Account
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-right">
                          <div className="flex justify-end gap-3">
                            <button 
                              onClick={() => {
                                setSelectedClient(client);
                                setIsModalOpen(true);
                              }}
                              disabled={!!client.auth_id}
                              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                client.auth_id 
                                  ? 'text-slate-500 bg-slate-100 cursor-not-allowed' 
                                  : 'text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                              }`}
                              title={client.auth_id ? 'Client already has an account' : 'Create account for this client'}
                            >
                              {client.auth_id ? (
                                <span className="flex items-center gap-2">
                                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  Account Exists
                                </span>
                              ) : (
                                <span className="flex items-center gap-2">
                                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                  </svg>
                                  Create Account
                                </span>
                              )}
                            </button>
                            {client.auth_id && (
                              <button
                                onClick={() => handleDelete(client)}
                                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                                title="Delete client account"
                              >
                                <span className="flex items-center gap-2">
                                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V7z" clipRule="evenodd" />
                                  </svg>
                                  Delete
                                </span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {!loading && filteredClients.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-64 bg-white text-center px-6">
                    <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                      <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No clients found</h3>
                    <p className="text-slate-500 max-w-sm">
                      {searchQuery ? 'Try adjusting your search term or filters to find what you\'re looking for.' : 'No clients are available at the moment. Check back later or contact support.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Pagination Footer - Fixed at bottom */}
              <div className="bg-white border-t border-slate-200 px-6 py-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      Previous
                    </button>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="relative ml-3 inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-slate-700">
                        Showing <span className="font-semibold text-slate-900">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredClients.length)}</span> to{' '}
                        <span className="font-semibold text-slate-900">{Math.min(currentPage * itemsPerPage, filteredClients.length)}</span> of{' '}
                        <span className="font-semibold text-slate-900">{filteredClients.length}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex items-center space-x-2" aria-label="Pagination">
                        <button
                          onClick={handlePreviousPage}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center rounded-lg p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:z-20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Previous</span>
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.958 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <div className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg">
                          Page <span className="font-semibold text-slate-900 mx-1">{currentPage}</span> of <span className="font-semibold text-slate-900 ml-1">{totalPages}</span>
                        </div>
                        <button
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center rounded-lg p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:z-20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Next</span>
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.04l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedClient && (
        <CreateAccountModal
          isOpen={isModalOpen}
          closeModal={() => {
            setIsModalOpen(false);
            setSelectedClient(null);
          }}
          clientName={selectedClient.Name}
          clientId={selectedClient.id}
        />
      )}
      
      {showDeleteConfirm && clientToDelete && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
          {/* Modal Header */}
          <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-50 mb-4">
              <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete Account</h3>
            <p className="text-gray-600">
              Are you sure you want to delete <span className="font-medium text-gray-900">{clientToDelete.Name}'s</span> account? This action cannot be undone.
            </p>
          </div>
          
          {/* Modal Actions */}
          <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row-reverse gap-3">
            <button
              type="button"
              onClick={confirmDelete}
              className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Account
            </button>
            <button
              type="button"
              onClick={() => {
                setShowDeleteConfirm(false);
                setClientToDelete(null);
              }}
              className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default ClientsPage;
