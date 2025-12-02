import { useEffect } from "react";
import { toast } from "sonner";
import { AlertTriangle, Wallet } from "lucide-react";

interface TransactionStatusAlertsProps {
  transactionSubmitted: boolean;
  transactionFailed: boolean;
}

export function TransactionStatusAlerts({
  transactionSubmitted,
  transactionFailed,
}: TransactionStatusAlertsProps) {
  useEffect(() => {
    if (transactionSubmitted) {
      toast.success("Transaction Submitted", {
        description: "Please open your Miden wallet to create the transaction and complete your domain registration.",
        icon: <Wallet className="h-5 w-5" />,
        duration: 5000,
        style: {
          background: "var(--success-bg)",
          borderColor: "var(--success-border)",
          color: "var(--success-text)",
        },
        classNames: {
          title: "font-bold",
          description: "font-semibold",
        },
      });
    }
  }, [transactionSubmitted]);

  useEffect(() => {
    if (transactionFailed) {
      toast.error("Transaction Failed", {
        description: "Transaction could not be created. Please contact the project telegram/discord for assistance.",
        icon: <AlertTriangle className="h-5 w-5" />,
        duration: 5000,
        style: {
          background: "hsl(var(--destructive-bg))",
          borderColor: "hsl(var(--destructive-border))",
          color: "hsl(var(--destructive-text))",
        },
        classNames: {
          title: "font-bold",
          description: "font-semibold",
        },
      });
    }
  }, [transactionFailed]);

  return null;
}
