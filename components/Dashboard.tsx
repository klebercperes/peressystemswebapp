import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { Ticket, Asset, TicketStatus } from '../types';
import { User } from '../services/auth';

interface DashboardProps {
  clients: any[];
  tickets: Ticket[];
  assets: Asset[];
  onAddTicket?: (ticket: Omit<Ticket, 'id' | 'createdDate'>) => void;
  onUpdateTicket?: (ticket: Ticket) => void;
  onDeleteTicket?: (ticketId: string) => void;
  currentUser?: User | null;
  onNavigate?: (view: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  clients,
  tickets,
  assets,
  currentUser,
  onNavigate,
}) => {
  const userRole = currentUser?.role;
  const roleString = userRole ? String(userRole).toLowerCase().trim() : '';
  const isCustomer = roleString === 'customer';
  const clientId = currentUser?.client_id;

  // Debug logging
  console.log('🔍 [Dashboard] User check:', {
    hasUser: !!currentUser,
    userRole,
    roleString,
    isCustomer,
    clientId,
    willShowNewDashboard: isCustomer,
    timestamp: new Date().toISOString()
  });
  
  // Force a visible alert if customer but showing old dashboard (for debugging)
  if (isCustomer && process.env.NODE_ENV === 'development') {
    console.warn('⚠️ CUSTOMER DETECTED - Should show new dashboard!');
  }

  // Filter data for customers
  const customerTickets = useMemo(() => {
    if (!isCustomer || !clientId) return tickets;
    return tickets.filter(t => t.clientId === clientId);
  }, [tickets, isCustomer, clientId]);

  const customerAssets = useMemo(() => {
    if (!isCustomer || !clientId) return assets;
    return assets.filter(a => a.clientId === clientId);
  }, [assets, isCustomer, clientId]);

  // For team members, use all tickets/assets; for customers, use filtered data
  const displayTickets = isCustomer ? customerTickets : tickets;
  const displayAssets = isCustomer ? customerAssets : assets;

  // Calculate metrics - use displayTickets/displayAssets which are already filtered for customers
  const openTickets = useMemo(() => 
    displayTickets.filter(t => t.status === TicketStatus.Open).length,
    [displayTickets]
  );

  const totalTickets = displayTickets.length;
  const totalAssets = displayAssets.length;

  // Calculate average response time
  const avgResponseTime = useMemo(() => {
    const now = new Date();
    const responseTimes = displayTickets
      .filter(t => t.status !== TicketStatus.Open)
      .map(t => {
        const created = new Date(t.createdDate);
        const resolved = t.resolvedDate ? new Date(t.resolvedDate) : now;
        return (resolved.getTime() - created.getTime()) / (1000 * 60); // minutes
      });
    
    if (responseTimes.length === 0) return 0;
    const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    return Math.round(avg);
  }, [displayTickets]);

  const formatResponseTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hrs`;
  };

  // Calculate SLA adherence (mock - 99.5% for now)
  const slaAdherence = 99.5;

  // Ticket status distribution for doughnut chart
  const ticketStatusData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    displayTickets.forEach(ticket => {
      const status = ticket.status === TicketStatus.InProgress ? 'In Progress' : ticket.status;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return [
      { name: 'Open', value: statusCounts['Open'] || 0, color: '#EF4444' },
      { name: 'In Progress', value: statusCounts['In Progress'] || 0, color: '#F59E0B' },
      { name: 'Resolved', value: (statusCounts['Completed'] || 0) + (statusCounts['Closed'] || 0), color: '#10B981' },
      { name: 'Waiting for Customer', value: statusCounts['Paused'] || 0, color: '#6366F1' },
    ].filter(item => item.value > 0);
  }, [displayTickets]);

  // Asset activity trend (mock data for last 30 days)
  const assetActivityData = useMemo(() => {
    const days = 30;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        health: Math.floor(Math.random() * 20) + 80, // 80-100
      });
    }
    return data;
  }, []);

  // Recent tickets (top 7 most recently created/updated)
  const recentTickets = useMemo(() => {
    return [...displayTickets]
      .sort((a, b) => {
        const dateA = new Date(b.resolvedDate || b.createdDate).getTime();
        const dateB = new Date(a.resolvedDate || a.createdDate).getTime();
        return dateA - dateB;
      })
      .slice(0, 7);
  }, [displayTickets]);

  const getStatusColor = (status: TicketStatus) => {
    const colors: Record<TicketStatus, string> = {
      [TicketStatus.Open]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      [TicketStatus.InProgress]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      [TicketStatus.Paused]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      [TicketStatus.Completed]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      [TicketStatus.Canceled]: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      [TicketStatus.Closed]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Show new dashboard for all users (customers see filtered data, team members see all data)
  console.log('🔍 [Dashboard] Rendering check - isCustomer:', isCustomer, 'roleString:', roleString);

  // New customer dashboard using Tailwind CSS
  return (
    <div className="w-full p-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Dashboard</h1>

      {/* SECTION 1: Top KPI Cards (3-Column Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card 1: Open Tickets */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Open Tickets</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{openTickets}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {openTickets}/{totalTickets} Total Tickets
              </p>
            </div>
            <div className="text-red-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-red-500 h-2 rounded-full" 
              style={{ width: `${totalTickets > 0 ? (openTickets / totalTickets) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Card 2: Total Assets */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Assets</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalAssets}</p>
            </div>
            <div className="text-blue-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
          </div>
          <div className="h-16 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={assetActivityData.slice(-7)}>
                <Line 
                  type="monotone" 
                  dataKey="health" 
                  stroke="#007BFF" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 3: Avg. Response Time */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Avg. Response Time</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatResponseTime(avgResponseTime)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                SLA Adherence: {slaAdherence}%
              </p>
            </div>
            <div className="text-blue-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex justify-center mt-2">
            <div className="relative w-16 h-16">
              <svg className="transform -rotate-90 w-16 h-16">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={`${(slaAdherence / 100) * 175.9} 175.9`}
                  className="text-green-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{slaAdherence}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Main Content Area (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        {/* Left Panel: Ticket Status Distribution (60%) */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ticket Status Distribution</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ticketStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {ticketStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Panel: Quick Actions & System Health (40%) */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="space-y-4">
            <button
              onClick={() => onNavigate?.('tickets')}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              + New Support Ticket
            </button>
            <button
              onClick={() => onNavigate?.('assets')}
              className="w-full flex items-center justify-center px-4 py-3 border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 font-medium rounded-md transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              Manage My Assets
            </button>
            <button
              onClick={() => window.open('https://wa.me/61481943940', '_blank')}
              className="w-full flex items-center justify-center px-4 py-3 border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 font-medium rounded-md transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Contact Support (Live Chat)
            </button>
          </div>

          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900 rounded-md">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                All Systems Operational
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Recent Ticket Activity Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Ticket Activity</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ticket ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Update</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Priority</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {recentTickets.length > 0 ? (
                recentTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                      {ticket.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {ticket.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(ticket.resolvedDate || ticket.createdDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      N/A
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No tickets found
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
