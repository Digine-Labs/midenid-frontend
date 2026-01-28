import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { ErrorLog } from '@/types/api';

interface RecentErrorsTableProps {
  errors: ErrorLog[];
}

export function RecentErrorsTable({ errors }: RecentErrorsTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadgeVariant = (statusCode: number) => {
    if (statusCode >= 500) return 'destructive';
    if (statusCode >= 400) return 'secondary';
    return 'default';
  };

  const truncateText = (text: string | null, maxLength: number = 50) => {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength)}...`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Recent Errors
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Path</TableHead>
              <TableHead>Error</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {errors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No errors recorded
                </TableCell>
              </TableRow>
            ) : (
              errors.map((error) => (
                <TableRow key={error.id}>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(error.status_code)}>
                      {error.status_code}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                      {error.method}
                    </code>
                  </TableCell>
                  <TableCell className="font-mono text-sm" title={error.path}>
                    {truncateText(error.path, 30)}
                  </TableCell>
                  <TableCell
                    className="text-sm text-muted-foreground max-w-xs"
                    title={error.error_message || undefined}
                  >
                    {truncateText(error.error_message, 40)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(error.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
