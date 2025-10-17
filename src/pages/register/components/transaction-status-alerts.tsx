import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Wallet } from "lucide-react";

interface TransactionStatusAlertsProps {
  transactionSubmitted: boolean;
  transactionFailed: boolean;
}

export function TransactionStatusAlerts({
  transactionSubmitted,
  transactionFailed,
}: TransactionStatusAlertsProps) {
  return (
    <>
      {transactionSubmitted && (
        <Alert className="border-green-600 bg-green-400">
          <Wallet className="h-5 w-5" color="green" />
          <AlertTitle className="text-green-900 font-bold">
            Transaction Submitted
          </AlertTitle>
          <AlertDescription className="text-green-800 font-semibold">
            Please open your Miden wallet to create the transaction and
            complete your domain registration.
          </AlertDescription>
        </Alert>
      )}
      {transactionFailed && (
        <Alert className="border-red-600 bg-red-300">
          <AlertTriangle className="h-5 w-5" color="red" />
          <AlertTitle className="text-red-900 font-bold">
            Transaction Failed
          </AlertTitle>
          <AlertDescription className="text-red-800 font-semibold">
            Transaction could not be created. Please contact the project
            owners for assistance.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
