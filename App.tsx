import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ClientManager } from './components/ClientManager';
import { TicketManager } from './components/TicketManager';
import { AssetManager } from './components/AssetManager';
import { AiAssistant } from './components/AiAssistant';
import { UserManager } from './components/UserManager';
import { MyProfile } from './components/MyProfile';
import BusinessSettings from './components/BusinessSettings';
import { Login } from './components/Login';
import HomePage from './components/HomePage';
import ServicesPage from './pages/ServicesPage';
import ContactPage from './pages/ContactPage';
import WhatsAppChat from './components/WhatsAppChat';
import Header from './components/Header';
import { api } from './services/api';
import { authService, User } from './services/auth';
import { View, Client, Ticket, Asset } from './types';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [clients, setClients] = useState<Client[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'services' | 'contact'>('home');
  const [showPublicPages, setShowPublicPages] = useState<boolean>(false);

  // URL routing: Read initial path from URL and handle browser back/forward
  useEffect(() => {
    // Don't run routing until auth check is complete
    if (checkingAuth) {
      return;
    }

    const handlePathChange = () => {
      const path = window.location.pathname;
      // Handle URL-based navigation
      if (path === '/services' || path.startsWith('/services/')) {
        setCurrentPage('services');
        // Show public pages if not authenticated, or if authenticated user navigated there
        // (authenticated users can view public pages while staying logged in)
        setShowPublicPages(true);
      } else if (path === '/contact') {
        setCurrentPage('contact');
        setShowPublicPages(true);
      } else if (path === '/home') {
        // /home always shows the home page (public page)
        setCurrentPage('home');
        setShowPublicPages(true);
      } else if (path === '/') {
        // Root path: authenticated users see dashboard, unauthenticated see home
        if (!isAuthenticated) {
          setCurrentPage('home');
          setShowPublicPages(true);
        } else {
          // Authenticated users see dashboard at root
          setShowPublicPages(false);
          setCurrentView('dashboard');
          // Don't set currentPage here - we're showing dashboard, not a public page
        }
      } else {
        // Default: if path doesn't match, show home for unauthenticated, dashboard for authenticated
        if (!isAuthenticated) {
          setCurrentPage('home');
          setShowPublicPages(true);
        } else {
          setShowPublicPages(false);
          setCurrentView('dashboard');
        }
      }
    };

    // Initial path check
    handlePathChange();

    // Listen for browser back/forward buttons
    window.addEventListener('popstate', handlePathChange);
    
    return () => {
      window.removeEventListener('popstate', handlePathChange);
    };
  }, [checkingAuth, isAuthenticated]);

  // Update URL when page changes
  const updateURL = (page: 'home' | 'services' | 'contact', serviceId?: string) => {
    let path = '/';
    if (page === 'services') {
      path = '/services';
      if (serviceId) {
        window.location.hash = `service-${serviceId}`;
      }
    } else if (page === 'contact') {
      path = '/contact';
    } else if (page === 'home') {
      path = '/home';
    }
    
    // Update URL without page reload
    window.history.pushState({ page }, '', path);
  };

  const refreshUserData = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        // Only update if the user data actually changed to avoid unnecessary re-renders
        setCurrentUser(prevUser => {
          if (prevUser?.full_name !== user.full_name || 
              prevUser?.username !== user.username ||
              prevUser?.email !== user.email) {
            return { ...user }; // Create new object to force React re-render
          }
          return prevUser; // No change, keep existing
        });
      }
    } catch (err) {
      // Silently ignore errors - don't spam console or break the app
      // Rate limiting or network errors are expected occasionally
    }
  };

  const refreshData = async (showLoading: boolean = true, showErrors: boolean = true, includeUser: boolean = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      if (showErrors) {
        setError(null);
      }
      const [clientsData, ticketsData, assetsData] = await Promise.all([
        api.getClients(),
        api.getTickets(),
        api.getAssets(),
      ]);
      // Force state update by creating new array references
      setClients([...clientsData]);
      setTickets([...ticketsData]);
      setAssets([...assetsData]);
      setLastRefresh(new Date());
      
      // Only refresh user data if explicitly requested (to avoid rate limiting)
      if (includeUser) {
        await refreshUserData();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      console.error('Error refreshing data:', err);
      // Only show error if this is a user-initiated refresh with error display enabled
      if (showErrors) {
        setError(errorMessage);
      }
      // Make sure loading is set to false even on error
      if (showLoading) {
        setLoading(false);
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      // Add timeout to ensure we don't hang forever
      const timeoutId = setTimeout(() => {
        console.warn('Auth check timeout - proceeding anyway');
        setIsAuthenticated(false);
        setLoading(false);
        setCheckingAuth(false);
      }, 5000); // 5 second timeout

      try {
        if (authService.isAuthenticated()) {
          try {
            // Verify token is still valid and get fresh user data
            const user = await authService.getCurrentUser();
            clearTimeout(timeoutId);
            if (user) {
              setIsAuthenticated(true);
              setCurrentUser(user);
              // Don't wait for refreshData - let it load in background
              // Don't include user refresh here to avoid duplicate calls
              refreshData(true, true, false).catch(err => {
                console.error('Error refreshing data:', err);
                setError('Failed to load data. Please refresh the page.');
                setLoading(false);
              });
            } else {
              authService.logout();
              setIsAuthenticated(false);
              setLoading(false);
            }
          } catch (err) {
            clearTimeout(timeoutId);
            // Token invalid, clear auth
            console.log('Auth check failed, clearing token:', err);
            authService.logout();
            setIsAuthenticated(false);
            setLoading(false);
          }
        } else {
          clearTimeout(timeoutId);
          setIsAuthenticated(false);
          setLoading(false); // Set loading to false immediately for unauthenticated users
        }
      } catch (err) {
        clearTimeout(timeoutId);
        console.error('Unexpected error during auth check:', err);
        setIsAuthenticated(false);
        setLoading(false);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  // Auto-refresh data every 2 minutes to pick up admin updates (silent background refresh)
  // Only refresh if we have data loaded (to avoid errors on initial load)
  // Using 2 minutes to avoid rate limiting (AUTH_RATE_LIMIT is typically 5/minute)
  useEffect(() => {
    if (!isAuthenticated || clients.length === 0) return;

    const intervalId = setInterval(() => {
      // Silent background refresh - don't show loading or errors
      // Don't refresh user data on every cycle to avoid rate limiting
      refreshData(false, false, false).catch(() => {
        // Silently ignore errors during background refresh
      });
    }, 120000); // Refresh every 2 minutes to avoid rate limiting

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, clients.length]);

  // Separate interval for user data refresh (every 3 minutes to avoid rate limiting)
  useEffect(() => {
    if (!isAuthenticated) return;

    const userRefreshInterval = setInterval(() => {
      // Refresh user data less frequently to avoid rate limiting
      refreshUserData().catch(() => {
        // Silently ignore errors
      });
    }, 180000); // Refresh user data every 3 minutes

    return () => clearInterval(userRefreshInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleLoginSuccess = async () => {
    // Hide login form and public pages, show dashboard
    setShowLogin(false);
    setShowPublicPages(false);
    setIsAuthenticated(true);
    setCurrentView('dashboard'); // Explicitly set to dashboard
    // Clear URL to show dashboard at root
    window.history.pushState({ view: 'dashboard' }, '', '/');
    
    try {
      // Fetch fresh user data after login (force refresh to get latest is_superuser status)
      const user = await authService.getCurrentUser(true);
      if (user) {
        setCurrentUser(user);
      }
    } catch (err) {
      console.error('Error fetching user after login:', err);
      // If fetch fails, try using cached user as fallback
      const cachedUser = authService.getUser();
      if (cachedUser) {
        setCurrentUser(cachedUser);
      }
    }
    // Don't include user refresh here to avoid duplicate calls
    refreshData(true, true, false);
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setShowLogin(false); // Reset to show landing page instead of login
    setCurrentPage('home'); // Reset to home page
    setClients([]);
    setTickets([]);
    setAssets([]);
    setCurrentUser(null);
    // Scroll to top when logging out
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Client Handlers ---
  const handleAddClient = async (clientData: Omit<Client, 'id' | 'joinDate'>) => {
    try {
      await api.addClient(clientData);
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add client';
      setError(errorMessage);
      console.error('Error adding client:', err);
      throw err;
    }
  };

  const handleUpdateClient = async (clientData: Client) => {
    try {
      await api.updateClient(clientData);
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update client';
      setError(errorMessage);
      console.error('Error updating client:', err);
      throw err;
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      await api.deleteClient(clientId);
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete client';
      setError(errorMessage);
      console.error('Error deleting client:', err);
      throw err;
    }
  };

  // --- Ticket Handlers ---
  const handleAddTicket = async (ticketData: Omit<Ticket, 'id' | 'createdDate'>) => {
    try {
      await api.addTicket(ticketData);
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add ticket';
      setError(errorMessage);
      console.error('Error adding ticket:', err);
      throw err;
    }
  };

  const handleUpdateTicket = async (ticketData: Ticket) => {
    try {
      await api.updateTicket(ticketData);
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update ticket';
      setError(errorMessage);
      console.error('Error updating ticket:', err);
      throw err;
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    try {
      await api.deleteTicket(ticketId);
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete ticket';
      setError(errorMessage);
      console.error('Error deleting ticket:', err);
      throw err;
    }
  };

  // --- Asset Handlers ---
  const handleAddAsset = async (assetData: Omit<Asset, 'id'>) => {
    try {
      await api.addAsset(assetData);
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add asset';
      setError(errorMessage);
      console.error('Error adding asset:', err);
      throw err;
    }
  };

  const handleUpdateAsset = async (assetData: Asset) => {
    try {
      await api.updateAsset(assetData);
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update asset';
      setError(errorMessage);
      console.error('Error updating asset:', err);
      throw err;
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    try {
      await api.deleteAsset(assetId);
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete asset';
      setError(errorMessage);
      console.error('Error deleting asset:', err);
      throw err;
    }
  };


  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            clients={clients} 
            tickets={tickets} 
            assets={assets}
            onAddTicket={handleAddTicket}
            onUpdateTicket={handleUpdateTicket}
            onDeleteTicket={handleDeleteTicket}
            currentUser={user}
            onNavigate={setCurrentView}
          />
        );
      case 'clients':
        // Customers cannot access client management
        if (user?.role === 'customer') {
          return (
            <div className="text-center py-12">
              <div className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">Access Denied</div>
              <p className="text-gray-600 dark:text-gray-400">You don't have permission to access client management.</p>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Please use "My Profile" to manage your own details.</p>
            </div>
          );
        }
        return (
          <ClientManager
            clients={clients}
            onAddClient={handleAddClient}
            onUpdateClient={handleUpdateClient}
            onDeleteClient={handleDeleteClient}
            isAdmin={isAdmin}
          />
        );
      case 'my-profile':
        return (
          <MyProfile
            currentUser={user!}
            onUpdateUser={(updatedUser) => {
              setCurrentUser(updatedUser);
              authService.setUser(updatedUser);
            }}
          />
        );
      case 'tickets':
        return (
            <TicketManager 
                tickets={tickets} 
                clients={clients}
                onAddTicket={handleAddTicket}
                onUpdateTicket={handleUpdateTicket}
                onDeleteTicket={handleDeleteTicket}
            />
        );
      case 'assets':
        return (
            <AssetManager 
                assets={assets} 
                clients={clients} 
                onAddAsset={handleAddAsset}
                onUpdateAsset={handleUpdateAsset}
                onDeleteAsset={handleDeleteAsset}
            />
        );
      case 'ai-assistant':
        return <AiAssistant />;
      case 'users':
        if (!isAdmin) {
          return <div className="text-center text-red-600">Access Denied</div>;
        }
        return <UserManager currentUser={user} />;
      case 'business-settings':
        if (!isAdmin) {
          return <div className="text-center text-red-600">Access Denied</div>;
        }
        return <BusinessSettings />;
      default:
        return <Dashboard clients={clients} tickets={tickets} assets={assets} currentUser={user} />;
    }
  };

  // Use state for current user (refreshed automatically) or fallback to cached
  // IMPORTANT: Always fetch fresh user data to ensure role field is present
  // NOTE: This must be before any early returns to satisfy React hooks rules
  // Use useMemo to stabilize the user reference to avoid unnecessary re-renders
  const user = useMemo(() => {
    return currentUser || authService.getUser();
  }, [currentUser]);
  
  // Debug: Log user object to verify role is present
  // NOTE: This hook must be called before any conditional returns
  useEffect(() => {
    if (user && !user.role && authService.isAuthenticated()) {
      console.warn('[App] ⚠️ User object missing role field - refreshing...', user);
      // Force refresh if role is missing
      authService.fetchCurrentUser(true).then(freshUser => {
        console.log('[App] ✅ Refreshed user with role:', freshUser);
        if (freshUser && freshUser.role) {
          setCurrentUser(freshUser);
        }
      }).catch(err => {
        console.error('[App] ❌ Failed to refresh user:', err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]); // Only depend on role to avoid unnecessary re-runs

  // Show loading state only on initial load (and not if we're checking auth)
  // NOTE: Early return must come AFTER all hooks
  if (checkingAuth) {
    return (
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Removed blocking loading screen - let dashboard show even while data is loading
  // Dashboard components will show empty states or loading indicators themselves
  
  const isAdmin = !!(user?.is_superuser);
  const isCustomer = user?.role === 'customer';
  
  // Debug logging
  if (user) {
    console.log('[App] User check:', {
      hasUser: !!user,
      hasRole: !!user?.role,
      role: user?.role,
      isCustomer: isCustomer,
      isAdmin: isAdmin,
      email: user.email
    });
  }

  const handleHeaderHomeClick = () => {
    // Navigate to home page (public view) but keep user logged in
    setCurrentPage('home');
    setShowPublicPages(true);
    setShowLogin(false);
    updateURL('home');
  };

  const handleHeaderServicesClick = () => {
    setCurrentPage('services');
    setShowPublicPages(true);
    setShowLogin(false);
    updateURL('services');
  };

  const handleHeaderContactClick = () => {
    setCurrentPage('contact');
    setShowPublicPages(true);
    setShowLogin(false);
    updateURL('contact');
  };

  const handleHeaderDashboardClick = () => {
    // Navigate back to dashboard and hide public pages
    setShowPublicPages(false);
    setShowLogin(false);
    setCurrentView('dashboard');
    // Clear URL to show dashboard
    window.history.pushState({ view: 'dashboard' }, '', '/');
  };

  // If showing public pages while authenticated, show them with Header (CHECK THIS FIRST!)
  if (isAuthenticated && showPublicPages) {
    if (currentPage === 'services') {
      const hash = window.location.hash;
      const serviceIdMatch = hash.match(/service-([^/]+)/);
      const serviceId = serviceIdMatch ? serviceIdMatch[1] : undefined;
      
      return (
        <>
          <Header
            isAuthenticated={isAuthenticated}
            currentUser={user}
            onLoginClick={() => {
              setShowPublicPages(false);
              setShowLogin(false);
            }}
            onLogoutClick={handleLogout}
            onHomeClick={handleHeaderHomeClick}
            onServicesClick={handleHeaderServicesClick}
            onContactClick={handleHeaderContactClick}
            onDashboardClick={handleHeaderDashboardClick}
          />
          <ServicesPage
            onLoginClick={() => {
              setShowPublicPages(false);
              setShowLogin(false);
            }}
            onContactClick={handleHeaderContactClick}
            onHomeClick={handleHeaderHomeClick}
            serviceId={serviceId}
            isAuthenticated={isAuthenticated}
            onDashboardClick={handleHeaderDashboardClick}
            onLogoutClick={handleLogout}
            showHeader={false}
          />
          <WhatsAppChat phoneNumber="61481943940" businessName="Peres Systems" useBusinessSettings={true} />
        </>
      );
    }
    
    if (currentPage === 'contact') {
      return (
        <>
          <Header
            isAuthenticated={isAuthenticated}
            currentUser={user}
            onLoginClick={() => {
              setShowPublicPages(false);
              setShowLogin(false);
            }}
            onLogoutClick={handleLogout}
            onHomeClick={handleHeaderHomeClick}
            onServicesClick={handleHeaderServicesClick}
            onContactClick={handleHeaderContactClick}
            onDashboardClick={handleHeaderDashboardClick}
          />
          <ContactPage
            onLoginClick={() => {
              setShowPublicPages(false);
              setShowLogin(false);
            }}
            onServicesClick={handleHeaderServicesClick}
            onHomeClick={handleHeaderHomeClick}
            isAuthenticated={isAuthenticated}
            onDashboardClick={handleHeaderDashboardClick}
            onLogoutClick={handleLogout}
            showHeader={false}
          />
          <WhatsAppChat phoneNumber="61481943940" businessName="Peres Systems" useBusinessSettings={true} />
        </>
      );
    }
    
    return (
      <>
        <Header
          isAuthenticated={isAuthenticated}
          currentUser={user}
          onLoginClick={() => {
            setShowPublicPages(false);
            setShowLogin(false);
          }}
          onLogoutClick={handleLogout}
          onHomeClick={handleHeaderHomeClick}
          onServicesClick={handleHeaderServicesClick}
          onContactClick={handleHeaderContactClick}
          onDashboardClick={handleHeaderDashboardClick}
        />
        <HomePage
          onLoginClick={() => {
            setShowPublicPages(false);
            setShowLogin(false);
          }}
          onServicesClick={(serviceId) => {
            setCurrentPage('services');
            updateURL('services', serviceId);
            if (serviceId) {
              setTimeout(() => {
                window.location.hash = `service-${serviceId}`;
              }, 100);
            }
          }}
          onContactClick={handleHeaderContactClick}
          isAuthenticated={isAuthenticated}
          onDashboardClick={handleHeaderDashboardClick}
          onLogoutClick={handleLogout}
          showHeader={false}
        />
        <WhatsAppChat phoneNumber="61481943940" businessName="Peres Systems" useBusinessSettings={true} />
      </>
    );
  }

  // Show public pages if not authenticated
  if (!isAuthenticated) {
    if (showLogin) {
      return (
        <Login 
          onLoginSuccess={handleLoginSuccess}
          onHomeClick={() => {
            setShowLogin(false);
            setCurrentPage('home');
            updateURL('home');
          }}
          onServicesClick={() => {
            setShowLogin(false);
            setCurrentPage('services');
            updateURL('services');
          }}
          onContactClick={() => {
            setShowLogin(false);
            setCurrentPage('contact');
            updateURL('contact');
          }}
        />
      );
    }
    
    // Show different pages based on currentPage state
    if (currentPage === 'services') {
      // Extract serviceId from hash if present (e.g., #service-abc123)
      const hash = window.location.hash;
      const serviceIdMatch = hash.match(/service-([^/]+)/);
      const serviceId = serviceIdMatch ? serviceIdMatch[1] : undefined;
      
      return (
        <>
          <ServicesPage
            onLoginClick={() => setShowLogin(true)}
            onContactClick={() => {
              setCurrentPage('contact');
              updateURL('contact');
            }}
            onHomeClick={() => {
              setCurrentPage('home');
              updateURL('home');
            }}
            serviceId={serviceId}
          />
          <WhatsAppChat phoneNumber="61481943940" businessName="Peres Systems" useBusinessSettings={true} />
        </>
      );
    }
    
    if (currentPage === 'contact') {
      return (
        <>
          <ContactPage
            onLoginClick={() => setShowLogin(true)}
            onServicesClick={() => {
              setCurrentPage('services');
              updateURL('services');
            }}
            onHomeClick={() => {
              setCurrentPage('home');
              updateURL('home');
            }}
          />
          <WhatsAppChat phoneNumber="61481943940" businessName="Peres Systems" useBusinessSettings={true} />
        </>
      );
    }
    
    return (
      <>
        <HomePage
          onLoginClick={() => setShowLogin(true)}
          onServicesClick={(serviceId) => {
            setCurrentPage('services');
            updateURL('services', serviceId);
            // Set hash for scrolling to specific service
            if (serviceId) {
              setTimeout(() => {
                window.location.hash = `service-${serviceId}`;
              }, 100);
            }
          }}
          onContactClick={() => {
            setCurrentPage('contact');
            updateURL('contact');
          }}
        />
        <WhatsAppChat phoneNumber="61481943940" businessName="Peres Systems" useBusinessSettings={true} />
      </>
    );
  }

  // Show dashboard when authenticated and not showing public pages
  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Header
        isAuthenticated={isAuthenticated}
        currentUser={user}
        onLoginClick={() => setShowLogin(true)}
        onLogoutClick={handleLogout}
        onHomeClick={handleHeaderHomeClick}
        onServicesClick={handleHeaderServicesClick}
        onContactClick={handleHeaderContactClick}
        onDashboardClick={handleHeaderDashboardClick}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          currentView={currentView} 
          onNavigate={(view) => {
            // Prevent customers from accessing clients view
            if (view === 'clients' && isCustomer) {
              setCurrentView('my-profile');
              return;
            }
            setCurrentView(view);
            setShowPublicPages(false); // Return to dashboard when navigating sidebar
          }}
          onLogout={handleLogout}
          isAdmin={isAdmin}
          isCustomer={isCustomer}
        />
        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg dark:bg-red-900 dark:border-red-700 dark:text-red-200">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
            <div className="mt-3 space-x-2">
              <button
                onClick={() => {
                  setError(null);
                  refreshData();
                }}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                Retry
              </button>
              <button
                onClick={() => setError(null)}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;