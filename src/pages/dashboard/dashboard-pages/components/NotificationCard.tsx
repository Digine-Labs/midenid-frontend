import { useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toggleTelegramNotifications } from '@/api/dashboard';

interface NotificationCardProps {
  telegramEnabled: boolean;
  onStatusChange: (enabled: boolean) => void;
}

export function NotificationCard({ telegramEnabled, onStatusChange }: NotificationCardProps) {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setIsToggling(true);
    const result = await toggleTelegramNotifications(checked);

    if (result.success && result.data) {
      onStatusChange(result.data.enabled);
    }

    setIsToggling(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="telegram-toggle" className="text-base">
              Telegram Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive error alerts via Telegram
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isToggling && <Loader2 className="h-4 w-4 animate-spin" />}
            <Switch
              id="telegram-toggle"
              checked={telegramEnabled}
              onCheckedChange={handleToggle}
              disabled={isToggling}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
