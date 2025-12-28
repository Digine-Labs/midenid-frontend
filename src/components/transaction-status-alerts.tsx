import { useEffect } from "react";
import { toast } from "sonner";
import { AlertTriangle, Wallet } from "lucide-react";
import { TransactionFailureReason } from "@/components/register-modal";
import type { TransactionFailure } from "@/components/register-modal";

interface TransactionStatusAlertsProps {
  transactionSubmitted: boolean;
  transactionFailure: TransactionFailure | null;
}

export function TransactionStatusAlerts({
  transactionSubmitted,
  transactionFailure,
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
    if (transactionFailure) {
      const messages = {
        [TransactionFailureReason.INSUFFICIENT_BALANCE]: {
          title: "Insufficient Balance",
          description: "You do not have enough tokens to complete this registration. Please acquire more tokens from the MIDEN faucet.",
        },
        [TransactionFailureReason.TRANSACTION_ERROR]: {
          title: "Transaction Failed",
          description: "The transaction could not be completed. Please try again or contact support if the issue persists.",
        },
      };

      const message = messages[transactionFailure.reason];

      toast.error(message.title, {
        description: message.description,
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
  }, [transactionFailure]);

  return null;
}
