import { Blocks, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BlockchainStatus } from '@/types/api';

interface BlockchainStatusCardProps {
  blockchain: BlockchainStatus;
}

export function BlockchainStatusCard({ blockchain }: BlockchainStatusCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Blocks className="h-5 w-5" />
          Blockchain Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Current Block</span>
          <span className="font-mono text-lg font-semibold">
            {blockchain.current_block.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Sync Interval
          </span>
          <span className="text-sm">{blockchain.sync_interval_secs}s</span>
        </div>
      </CardContent>
    </Card>
  );
}
