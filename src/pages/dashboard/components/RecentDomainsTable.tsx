import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DomainRegistration, DashboardLimit } from '@/types/api';

interface RecentDomainsTableProps {
  domains: DomainRegistration[];
  limit: DashboardLimit;
  onLimitChange: (limit: DashboardLimit) => void;
}

export function RecentDomainsTable({ domains, limit, onLimitChange }: RecentDomainsTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const truncateAccountId = (accountId: string) => {
    if (accountId.length <= 16) return accountId;
    return `${accountId.slice(0, 10)}...${accountId.slice(-6)}`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Domain Registrations</CardTitle>
        <Select
          value={String(limit)}
          onValueChange={(value) => onLimitChange(Number(value) as DashboardLimit)}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Domain</TableHead>
              <TableHead>Account ID</TableHead>
              <TableHead>Block</TableHead>
              <TableHead>Registered</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {domains.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No domains registered yet
                </TableCell>
              </TableRow>
            ) : (
              domains.map((domain) => (
                <TableRow key={`${domain.domain}-${domain.created_block}`}>
                  <TableCell className="font-medium">
                    {domain.domain}<span className="text-muted-foreground">.miden</span>
                  </TableCell>
                  <TableCell className="font-mono text-sm" title={domain.account_id}>
                    {truncateAccountId(domain.account_id)}
                  </TableCell>
                  <TableCell>{domain.created_block.toLocaleString()}</TableCell>
                  <TableCell>{formatDate(domain.created_at)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
