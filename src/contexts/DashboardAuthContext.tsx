import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { dashboardLogin, dashboardLogout, getDashboardData } from '@/api/dashboard';

interface DashboardAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const DashboardAuthContext = createContext<DashboardAuthContextType | undefined>(undefined);

export function DashboardAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      const result = await getDashboardData(10);
      setIsAuthenticated(result.success);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Redirect based on auth status
  useEffect(() => {
    if (isLoading) return;

    const isLoginPage = location.pathname === '/dashboard/login';

    if (isAuthenticated && isLoginPage) {
      navigate('/dashboard', { replace: true });
    } else if (!isAuthenticated && !isLoginPage) {
      navigate('/dashboard/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, location.pathname, navigate]);

  const login = useCallback(async (username: string, password: string) => {
    const result = await dashboardLogin(username, password);
    if (result.success) {
      setIsAuthenticated(true);
      return { success: true };
    }
    return { success: false, error: result.error };
  }, []);

  const logout = useCallback(async () => {
    await dashboardLogout();
    setIsAuthenticated(false);
    navigate('/dashboard/login', { replace: true });
  }, [navigate]);

  return (
    <DashboardAuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </DashboardAuthContext.Provider>
  );
}

export function useDashboardAuth() {
  const context = useContext(DashboardAuthContext);
  if (context === undefined) {
    throw new Error('useDashboardAuth must be used within a DashboardAuthProvider');
  }
  return context;
}
