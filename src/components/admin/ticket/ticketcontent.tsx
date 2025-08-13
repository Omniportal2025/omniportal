import { useState, useEffect } from 'react';
import { supabase } from '../../../supabase/supabaseClient';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { 
  X, 
  FileText, 
  Paperclip, 
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
          <div className="overflow-hidden bg-white rounded-xl shadow-sm border border-slate-200/60">
            <table className="min-w-full">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                  <th scope="col" className="py-4 pl-6 pr-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">
                    Ticket ID
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">
                    Client Name
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">
                    Subject
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">
                    Priority
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-r border-slate-200/50">
                    Assigned To
                  </th>
                  <th scope="col" className="relative py-4 pl-3 pr-6 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map((ticket) => (
                  <tr 
                    key={ticket.id} 
                    className="group hover:bg-slate-50/80 cursor-pointer transition-all duration-200 border-b border-slate-50 last:border-b-0"
                    onClick={() => openTicketModal(ticket)}
                  >
                    <td className="whitespace-nowrap py-5 pl-6 pr-3 text-sm font-bold text-slate-900">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full shadow-sm"></div>
                        <span>#{ticket.id}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-5 text-sm font-semibold text-slate-800">
                      {ticket.Name}
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600 max-w-xs">
                      <div className="truncate" title={ticket.Subject}>
                        {ticket.Subject}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-5 text-sm">
                      <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r shadow-sm ${
                        ticket.Status === 'Resolved' ? 'from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-200/60' :
                        ticket.Status === 'In Progress' || ticket.Status === 'in_progress' ? 'from-amber-50 to-amber-100 text-amber-700 border border-amber-200/60' :
                        'from-blue-50 to-blue-100 text-blue-700 border border-blue-200/60'
                      }`}>
                        {ticket.Status.replace('_', ' ').toUpperCase()}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-5 text-sm">
                      <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border border-purple-200/60 shadow-sm">
                        {ticket.Priority.toUpperCase()}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-700">
                      {ticket.Assigned || (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs text-slate-400 bg-slate-50 border border-slate-200 italic">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="relative whitespace-nowrap py-5 pl-3 pr-6 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openTicketModal(ticket);
                        }}
                        className="inline-flex items-center px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 rounded-lg border border-blue-200 hover:border-blue-300 transition-all duration-200 text-xs font-semibold shadow-sm hover:shadow-md group-hover:shadow-md"
                      >
                        <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
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
      <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
  {/* Header */}
  <div className="bg-white border-b border-gray-200 px-6 py-4">
    <Dialog.Title
      as="h3"
      className="flex justify-between items-center"
    >
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
          <FileText className="h-4 w-4 text-gray-600" />
        </div>
        <div>
          <div className="text-lg font-semibold text-gray-900">
            Ticket #{selectedTicket.id}
          </div>
          <div className="text-sm text-gray-500">
            {selectedTicket.Subject}
          </div>
        </div>
      </div>
      <button
        type="button"
        className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
        onClick={closeTicketModal}
      >
        <X className="h-5 w-5" />
      </button>
    </Dialog.Title>
  </div>
  
  <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
    {/* Ticket Information */}
    <div className="space-y-4">
      <h4 className="text-base font-medium text-gray-900">Ticket Details</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-gray-500 font-medium mb-1">Client</div>
          <div className="text-gray-900">{selectedTicket.Name}</div>
        </div>
        
        <div>
          <div className="text-gray-500 font-medium mb-1">Status</div>
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
            selectedTicket.Status === 'new' ? 'bg-blue-50 text-blue-700' :
            selectedTicket.Status === 'in_progress' ? 'bg-amber-50 text-amber-700' :
            selectedTicket.Status === 'resolved' ? 'bg-green-50 text-green-700' :
            selectedTicket.Status === 'closed' ? 'bg-gray-50 text-gray-700' :
            'bg-gray-50 text-gray-700'
          }`}>
            {selectedTicket.Status.replace('_', ' ')}
          </span>
        </div>
        
        <div>
          <div className="text-gray-500 font-medium mb-1">Priority</div>
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
            selectedTicket.Priority === 'low' ? 'bg-green-50 text-green-700' :
            selectedTicket.Priority === 'medium' ? 'bg-blue-50 text-blue-700' :
            selectedTicket.Priority === 'high' ? 'bg-orange-50 text-orange-700' :
            selectedTicket.Priority === 'urgent' ? 'bg-red-50 text-red-700' :
            'bg-gray-50 text-gray-700'
          }`}>
            {selectedTicket.Priority}
          </span>
        </div>
        
        <div>
          <div className="text-gray-500 font-medium mb-1">Assigned To</div>
          <div className="text-gray-900">{selectedTicket.Assigned || 'Unassigned'}</div>
        </div>

        {selectedTicket.Category && (
          <div>
            <div className="text-gray-500 font-medium mb-1">Category</div>
            <div className="text-gray-900">{selectedTicket.Category}</div>
          </div>
        )}
        
        <div>
          <div className="text-gray-500 font-medium mb-1">Created</div>
          <div className="text-gray-900">
            {selectedTicket.created_at 
              ? new Date(selectedTicket.created_at).toLocaleString() 
              : 'Unknown'}
          </div>
        </div>
      </div>
    </div>

    {/* Description */}
    <div className="space-y-3">
      <h4 className="text-base font-medium text-gray-900">Description</h4>
      <div className="bg-gray-50 rounded-md p-4">
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedTicket.Description}</p>
      </div>
    </div>

    {/* Current Response */}
    {selectedTicket.Response && (
      <div className="space-y-3">
        <h4 className="text-base font-medium text-gray-900">Current Response</h4>
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedTicket.Response}</p>
        </div>
      </div>
    )}

    {/* Add Response */}
    <div className="space-y-3">
      <h4 className="text-base font-medium text-gray-900">Add Response</h4>
      <div className="space-y-3">
        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Enter your response here..."
          className="w-full min-h-[100px] p-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Save Response
          </button>
        </div>
      </div>
    </div>
    
    {/* Attachment */}
    {selectedTicket.Attachment && (
      <div className="space-y-3">
        <h4 className="text-base font-medium text-gray-900">Attachment</h4>
        <a 
          href={selectedTicket.Attachment} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          <Paperclip className="h-4 w-4 mr-2 text-gray-500" />
          View Attachment
        </a>
      </div>
    )}

    {/* Update Ticket */}
    <div className="border-t border-gray-200 pt-6">
      <h4 className="text-base font-medium text-gray-900 mb-4">Update Ticket</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="update-status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="update-status"
            value={selectedTicket.Status}
            onChange={(e) => updateTicketStatus(selectedTicket.id, e.target.value)}
            className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="update-priority" className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            id="update-priority"
            value={selectedTicket.Priority}
            onChange={(e) => updateTicketPriority(selectedTicket.id, e.target.value)}
            className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="update-assignee" className="block text-sm font-medium text-gray-700 mb-1">
            Assign To
          </label>
          <input
            type="text"
            id="update-assignee"
            defaultValue={selectedTicket.Assigned || ''}
            placeholder="Enter name"
            className="block w-full rounded-md border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
