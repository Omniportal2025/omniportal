import { useState, useEffect } from 'react';
import { supabase } from '../../../supabase/supabaseClient';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { 
  X, 
  User, 
  Clock, 
  Tag, 
  Folder, 
  FileText, 
  Paperclip, 
  CheckCircle, 
  AlertCircle, 
  RefreshCcw, 
  MessageCircle 
} from 'lucide-react';


// Define Ticket interface based on your Supabase table structure
interface Ticket {
  id: number;
  Name: string;
  Subject: string;
  Description: string;
  Status: string;
  Priority: string;
  Assigned: string | null;
  Resolution: string | null;
  Attachment: string | null;
  Category: string | null;
  Response: string | null;
  created_at?: string;
  updated_at?: string;
}

function TicketPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  // Fetch tickets from Supabase
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        
        // Check if supabase client is properly initialized
        if (!supabase) {
          throw new Error('Supabase client is not initialized');
        }
        
        console.log('Fetching tickets with filter:', statusFilter);
        
        let query = supabase.from('Tickets').select('*');
        
        // Apply status filter if not 'all'
        if (statusFilter !== 'all') {
          query = query.eq('Status', statusFilter);
        }
        
        // Order by id (descending)
        query = query.order('id', { ascending: false });
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Supabase query error:', error);
          throw error;
        }
        
        console.log('Tickets fetched successfully:', data);
        setTickets(data || []);
      } catch (err: any) {
        console.error('Error fetching tickets:', err);
        // Provide more detailed error message
        if (err.message === 'Failed to fetch') {
          setError('Network error: Could not connect to Supabase. Please check your internet connection and Supabase configuration.');
        } else {
          setError(`${err.message || 'Unknown error'}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [statusFilter]);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredTickets(tickets);
    } else {
      const filtered = tickets.filter(ticket => 
        ticket.Status.toLowerCase() === statusFilter.toLowerCase()
      );
      setFilteredTickets(filtered);
    }
  }, [statusFilter, tickets]);

  // Function to update ticket status
  const [response, setResponse] = useState<string>('');

  const updateTicketStatus = async (ticketId: number, status: string) => {
    try {
      const { error } = await supabase
        .from('Tickets')
        .update({ Status: status })
        .eq('id', ticketId);

      if (error) throw error;

      // Update local state
      setTickets(tickets.map(ticket => 
        ticket.id === ticketId ? { ...ticket, Status: status } : ticket
      ));
      
      // Update selected ticket if it's the one being modified
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, Status: status });
      }
    } catch (err: any) {
      console.error('Error updating ticket status:', err);
      alert(`Failed to update ticket status: ${err.message}`);
    }
  };

  // Function to assign ticket
  const assignTicket = async (ticketId: number, assignee: string) => {
    try {
      const { error } = await supabase
        .from('Tickets')
        .update({ Assigned: assignee })
        .eq('id', ticketId);

      if (error) throw error;

      // Update local state
      setTickets(tickets.map(ticket => 
        ticket.id === ticketId ? { ...ticket, Assigned: assignee } : ticket
      ));
      
      // Update selected ticket if it's the one being modified
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, Assigned: assignee });
      }
    } catch (err: any) {
      console.error('Error assigning ticket:', err);
      alert(`Failed to assign ticket: ${err.message}`);
    }
  };

  // Function to update ticket priority
  const updateTicketPriority = async (ticketId: number, newPriority: string) => {
    try {
      const { error } = await supabase
        .from('Tickets')
        .update({ Priority: newPriority })
        .eq('id', ticketId);

      if (error) throw error;

      // Update local state
      setTickets(tickets.map(ticket => 
        ticket.id === ticketId ? { ...ticket, Priority: newPriority } : ticket
      ));
      
      // Update selected ticket if it's the one being modified
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, Priority: newPriority });
      }
    } catch (err: any) {
      console.error('Error updating ticket priority:', err);
      alert(`Failed to update ticket priority: ${err.message}`);
    }
  };

  // Function to open ticket detail modal
  const openTicketModal = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setResponse(ticket.Response || '');
    setIsTicketModalOpen(true);
  };

  // Function to close ticket detail modal
  const closeTicketModal = () => {
    setIsTicketModalOpen(false);
    setSelectedTicket(null);
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'in progress':
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get priority badge color
  const getPriorityBadgeColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Single Unified Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden h-[calc(100vh-4rem)] max-w-full">
        
        {/* Hero Header Section */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full transform translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full transform -translate-x-12 translate-y-12"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">
                  Support Tickets Dashboard
                </h1>
                <p className="text-slate-300 text-lg">
                  Manage and track all client support requests in one place
                </p>
              </div>
              
              {/* Filter Controls */}
              <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <label htmlFor="status-filter" className="text-sm font-medium text-white whitespace-nowrap">
                  Filter by status:
                </label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-md border-0 bg-white/20 backdrop-blur-sm text-white py-2 pl-3 pr-10 text-sm focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-800"
                >
                  <option value="all" className="text-gray-900">All Tickets</option>
                  <option value="new" className="text-gray-900">New</option>
                  <option value="in_progress" className="text-gray-900">In Progress</option>
                  <option value="resolved" className="text-gray-900">Resolved</option>
                  <option value="closed" className="text-gray-900">Closed</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 1rem)' }}>
            {loading ? (
              <div className="flex justify-center items-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-red-500">
                <div className="bg-red-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Tickets</h3>
                  <p>{error}</p>
                </div>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-12 text-center">
                <div className="bg-slate-50 rounded-lg p-8">
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">No tickets found</h3>
                  <p className="text-slate-500">Try adjusting your filter or check back later.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="sticky top-0 bg-gradient-to-r from-slate-700 to-slate-800 z-0 shadow-md">
                    <tr>
                      <th scope="col" className="py-4 pl-6 pr-3 text-left text-sm font-semibold text-white">
                        Ticket ID
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-white">
                        Client Name
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-white">
                        Subject
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-white">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-white">
                        Priority
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-white">
                        Assigned To
                      </th>
                      <th scope="col" className="relative py-4 pl-3 pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredTickets.map((ticket, index) => (
                      <tr 
                        key={ticket.id} 
                        className={`hover:bg-slate-50 cursor-pointer transition-colors duration-150 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-slate-25'
                        }`}
                        onClick={() => openTicketModal(ticket)}
                      >
                        <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-semibold text-slate-900">
                          #{ticket.id}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700 font-medium">
                          {ticket.Name}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                          {ticket.Subject}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeColor(ticket.Status)}`}>
                            {ticket.Status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPriorityBadgeColor(ticket.Priority)}`}>
                            {ticket.Priority.toUpperCase()}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                          {ticket.Assigned || (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openTicketModal(ticket);
                            }}
                            className="text-blue-600 hover:text-blue-800 font-semibold hover:bg-blue-50 px-3 py-1 rounded-md transition-colors duration-150"
                          >
                            View
                            <span className="sr-only">, ticket #{ticket.id}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <Transition appear show={isTicketModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeTicketModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" />
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
                <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all border-0">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-b border-slate-200">
                    <Dialog.Title
                      as="h3"
                      className="text-xl font-semibold text-slate-900 flex justify-between items-center"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="h-5 w-5 text-blue-600" aria-hidden="true" />
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-slate-900">
                            Ticket #{selectedTicket.id}
                          </div>
                          <div className="text-sm text-slate-600 mt-0.5">
                            {selectedTicket.Subject}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={closeTicketModal}
                      >
                        <span className="sr-only">Close</span>
                        <X className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </Dialog.Title>
                  </div>
                  
                  <div className="p-6 space-y-8 max-h-[80vh] overflow-y-auto">
                    {/* Ticket Information Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Client */}
                      <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="h-4 w-4 text-blue-500" aria-hidden="true" />
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Client</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">{selectedTicket.Name}</p>
                      </div>
                      
                      {/* Status */}
                      <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <RefreshCcw className="h-4 w-4 text-blue-500" aria-hidden="true" />
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Status</span>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          selectedTicket.Status === 'new' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          selectedTicket.Status === 'in_progress' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          selectedTicket.Status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          selectedTicket.Status === 'closed' ? 'bg-slate-50 text-slate-700 border border-slate-200' :
                          'bg-slate-50 text-slate-700 border border-slate-200'
                        }`}>
                          {selectedTicket.Status === 'new' && <AlertCircle className="h-3 w-3 mr-1.5" aria-hidden="true" />}
                          {selectedTicket.Status === 'in_progress' && <RefreshCcw className="h-3 w-3 mr-1.5" aria-hidden="true" />}
                          {selectedTicket.Status === 'resolved' && <CheckCircle className="h-3 w-3 mr-1.5" aria-hidden="true" />}
                          {selectedTicket.Status === 'closed' && <X className="h-3 w-3 mr-1.5" aria-hidden="true" />}
                          {selectedTicket.Status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      {/* Priority */}
                      <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-blue-500" aria-hidden="true" />
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Priority</span>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          selectedTicket.Priority === 'low' ? 'bg-green-50 text-green-700 border border-green-200' :
                          selectedTicket.Priority === 'medium' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          selectedTicket.Priority === 'high' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                          selectedTicket.Priority === 'urgent' ? 'bg-red-50 text-red-700 border border-red-200' :
                          'bg-slate-50 text-slate-700 border border-slate-200'
                        }`}>
                          {selectedTicket.Priority}
                        </span>
                      </div>
                      
                      {/* Assigned To */}
                      <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="h-4 w-4 text-blue-500" aria-hidden="true" />
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Assigned To</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">{selectedTicket.Assigned || 'Unassigned'}</p>
                      </div>

                      {/* Category */}
                      {selectedTicket.Category && (
                        <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <Folder className="h-4 w-4 text-blue-500" aria-hidden="true" />
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Category</span>
                          </div>
                          <p className="text-sm font-semibold text-slate-900">{selectedTicket.Category}</p>
                        </div>
                      )}
                      
                      {/* Created Date */}
                      <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Clock className="h-4 w-4 text-blue-500" aria-hidden="true" />
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Created</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">
                          {selectedTicket.created_at 
                            ? new Date(selectedTicket.created_at).toLocaleString() 
                            : 'Unknown'}
                        </p>
                      </div>
                    </div>

                    {/* Description Section */}
                    <div className="bg-slate-50 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-slate-900 flex items-center mb-4">
                        <MessageCircle className="h-5 w-5 text-blue-500 mr-3" aria-hidden="true" />
                        Description
                      </h4>
                      <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedTicket.Description}</p>
                      </div>
                    </div>

                    {/* Response Section */}
                    <div className="bg-slate-50 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-slate-900 flex items-center mb-4">
                        <MessageCircle className="h-5 w-5 text-blue-500 mr-3" aria-hidden="true" />
                        Add Response
                      </h4>
                      <div className="space-y-4">
                        <textarea
                          value={response}
                          onChange={(e) => setResponse(e.target.value)}
                          placeholder="Enter your response here..."
                          className="w-full min-h-[120px] p-4 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                        <div className="flex justify-end">
                          <button
                            onClick={async () => {
                              if (!response.trim()) {
                                alert('Please enter a response');
                                return;
                              }
                              try {
                                const { error } = await supabase
                                  .from('Tickets')
                                  .update({ Response: response })
                                  .eq('id', selectedTicket.id);
                                
                                if (error) throw error;
                                
                                // Update local state
                                setTickets(tickets.map(t => 
                                  t.id === selectedTicket.id 
                                    ? { ...t, Response: response }
                                    : t
                                ));
                                setSelectedTicket({ ...selectedTicket, Response: response });
                                alert('Response saved successfully!');
                              } catch (error) {
                                console.error('Error saving response:', error);
                                alert('Failed to save response');
                              }
                            }}
                            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                          >
                            Save Response
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Current Response */}
                    {selectedTicket.Response && (
                      <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                        <h4 className="text-lg font-semibold text-slate-900 flex items-center mb-4">
                          <MessageCircle className="h-5 w-5 text-green-600 mr-3" aria-hidden="true" />
                          Current Response
                        </h4>
                        <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
                          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedTicket.Response}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Attachment */}
                    {selectedTicket.Attachment && (
                      <div className="bg-slate-50 rounded-xl p-6">
                        <h4 className="text-lg font-semibold text-slate-900 flex items-center mb-4">
                          <Paperclip className="h-5 w-5 text-blue-500 mr-3" aria-hidden="true" />
                          Attachment
                        </h4>
                        <a 
                          href={selectedTicket.Attachment} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-3 bg-white border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                        >
                          <Paperclip className="h-4 w-4 mr-2 text-blue-500" aria-hidden="true" />
                          View Attachment
                        </a>
                      </div>
                    )}

                    {/* Update Ticket Section */}
                    <div className="bg-slate-50 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-slate-900 flex items-center mb-6">
                        <Tag className="h-5 w-5 text-blue-500 mr-3" aria-hidden="true" />
                        Update Ticket
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                          <label htmlFor="update-status" className="block text-sm font-medium text-slate-700 mb-2">
                            Status
                          </label>
                          <select
                            id="update-status"
                            value={selectedTicket.Status}
                            onChange={(e) => updateTicketStatus(selectedTicket.id, e.target.value)}
                            className="block w-full rounded-lg border-slate-300 bg-white py-2.5 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                          >
                            <option value="new">New</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>
                        
                        <div>
                          <label htmlFor="update-priority" className="block text-sm font-medium text-slate-700 mb-2">
                            Priority
                          </label>
                          <select
                            id="update-priority"
                            value={selectedTicket.Priority}
                            onChange={(e) => updateTicketPriority(selectedTicket.id, e.target.value)}
                            className="block w-full rounded-lg border-slate-300 bg-white py-2.5 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>
                        
                        <div>
                          <label htmlFor="update-assignee" className="block text-sm font-medium text-slate-700 mb-2">
                            Assign To
                          </label>
                          <input
                            type="text"
                            id="update-assignee"
                            defaultValue={selectedTicket.Assigned || ''}
                            placeholder="Enter name"
                            className="block w-full rounded-lg border-slate-300 bg-white py-2.5 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                            onBlur={(e) => {
                              if (e.target.value !== selectedTicket.Assigned) {
                                assignTicket(selectedTicket.id, e.target.value);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                assignTicket(selectedTicket.id, e.currentTarget.value);
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      )}
    </div>
  );
};

export default TicketPage;
