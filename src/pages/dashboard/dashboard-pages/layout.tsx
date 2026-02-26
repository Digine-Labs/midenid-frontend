import { Outlet } from 'react-router';
import { DashboardAuthProvider } from '@/contexts/DashboardAuthContext';
import { ThemeProvider } from '@/components/ThemeProvider';

export default function DashboardLayout() {
  return (
    <ThemeProvider>
      <DashboardAuthProvider>
        <div className="min-h-screen bg-background">
          <Outlet />
        </div>
      </DashboardAuthProvider>
    </ThemeProvider>
  );
}
