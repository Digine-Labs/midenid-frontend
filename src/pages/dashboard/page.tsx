import { useState, useEffect, useCallback } from 'react';
import { Globe, Users } from 'lucide-react';
import { getDashboardData } from '@/api/dashboard';
import { useDashboardAuth } from '@/contexts/DashboardAuthContext';
import type { DashboardData, DashboardLimit } from '@/types/api';
import {
  DashboardHeader,
  StatsCard,
  BlockchainStatusCard,
  RecentDomainsTable,
  RecentErrorsTable,
  DashboardSkeleton,
  NotificationCard,
  ResetStoreCard,
} from './components';

const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds

export default function Dashboard() {
  const { isLoading: authLoading } = useDashboardAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [limit, setLimit] = useState<DashboardLimit>(10);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    }

    const result = await getDashboardData(limit);

    if (result.success && result.data) {
      setData(result.data);
      setError(null);
    } else {
      setError(result.error || 'Failed to load dashboard data');
    }

    setIsLoading(false);
    setIsRefreshing(false);
  }, [limit]);

  // Initial fetch and limit changes
  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [authLoading, fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (authLoading || isLoading) return;

    const interval = setInterval(() => {
      fetchData(false);
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [authLoading, isLoading, fetchData]);

  const handleRefresh = () => {
    fetchData(true);
  };

  const handleLimitChange = (newLimit: DashboardLimit) => {
    setLimit(newLimit);
  };

  const handleTelegramStatusChange = (enabled: boolean) => {
    if (data) {
      setData({
        ...data,
        notifications: { ...data.notifications, telegram_enabled: enabled },
      });
    }
  };

  const handleResetComplete = () => {
    // Refresh data after reset to get updated timestamp
    fetchData(true);
  };

  if (authLoading || isLoading) {
    return (
      <div>
        <DashboardHeader onRefresh={handleRefresh} isRefreshing={isRefreshing} />
        <main className="container mx-auto px-4 py-6">
          <DashboardSkeleton />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <DashboardHeader onRefresh={handleRefresh} isRefreshing={isRefreshing} />
        <main className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <p className="text-destructive mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="text-primary underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      <DashboardHeader onRefresh={handleRefresh} isRefreshing={isRefreshing} />
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <StatsCard
            title="Total Domains"
            value={data.stats.total_domains.toLocaleString()}
            description="Registered domain names"
            icon={<Globe className="h-4 w-4 text-muted-foreground" />}
          />
          <StatsCard
            title="Total Profiles"
            value={data.stats.total_profiles.toLocaleString()}
            description="User profiles created"
            icon={<Users className="h-4 w-4 text-muted-foreground" />}
          />
        </div>

        {/* Blockchain status and admin actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <BlockchainStatusCard blockchain={data.blockchain} />
          <NotificationCard
            telegramEnabled={data.notifications.telegram_enabled}
            onStatusChange={handleTelegramStatusChange}
          />
          <ResetStoreCard
            lastReset={data.stats.last_store_reset}
            onResetComplete={handleResetComplete}
          />
        </div>

        {/* Recent errors and domains - side by side on larger screens */}
        <div className="grid gap-4 lg:grid-cols-2">
          <RecentErrorsTable errors={data.recent_errors} />
          <RecentDomainsTable
            domains={data.recent_domains}
            limit={limit}
            onLimitChange={handleLimitChange}
          />
        </div>
      </main>
    </div>
  );
}
