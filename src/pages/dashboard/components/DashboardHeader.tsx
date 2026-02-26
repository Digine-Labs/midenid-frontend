import { LogOut, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useDashboardAuth } from '@/contexts/DashboardAuthContext';

interface DashboardHeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function DashboardHeader({ onRefresh, isRefreshing }: DashboardHeaderProps) {
  const { logout } = useDashboardAuth();

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">
          M<span className="text-primary">id</span>en Dashboard
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
