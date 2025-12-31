import { useCallback } from "react";
import { toast } from "sonner";
import { AlertTriangle, Wallet, CheckCircle } from "lucide-react";
import { ToastCause } from "@/types/toast";

type ToastType = 'success' | 'error' | 'warning';

interface ToastConfig {
  type: ToastType;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const getToastStyle = (type: ToastType) => {
  if (type === 'success') {
    return {
      background: "var(--success-bg)",
      borderColor: "hsl(var(--success-border))",
      color: "var(--success-text)",
    };
  } else if (type === 'error') {
    return {
      background: "hsl(var(--destructive-bg))",
      borderColor: "hsl(var(--destructive-border))",
      color: "hsl(var(--destructive-text))",
    };
  } else if (type === 'warning') {
    return {
      background: "var(--warning-bg)",
      borderColor: "hsl(var(--warning-border))",
      color: "var(--warning-text)",
    };
  }
  return {};
};

const toastConfig: Record<ToastCause, ToastConfig> = {
  [ToastCause.TRANSACTION_SUBMITTED]: {
    type: 'success',
    title: 'Transaction Submitted',
    description: 'Please open your Miden wallet to create the transaction and complete your domain registration.',
    icon: <Wallet className="h-5 w-5" />,
  },
  [ToastCause.INSUFFICIENT_BALANCE]: {
    type: 'error',
    title: 'Insufficient Balance',
    description: 'You do not have enough tokens to complete this registration. Please acquire more tokens from the MIDEN faucet.',
    icon: <AlertTriangle className="h-5 w-5" />,
  },
  [ToastCause.TRANSACTION_ERROR]: {
    type: 'error',
    title: 'Transaction Failed',
    description: 'The transaction could not be completed. Please try again or contact support if the issue persists.',
    icon: <AlertTriangle className="h-5 w-5" />,
  },
  [ToastCause.WALLET_NOT_CONNECTED]: {
    type: 'error',
    title: 'Wallet Not Connected',
    description: 'Please connect your wallet first',
    icon: <AlertTriangle className="h-5 w-5" />,
  },
  [ToastCause.DOMAIN_REQUIRED]: {
    type: 'error',
    title: 'Domain Required',
    description: 'Domain name is required',
    icon: <AlertTriangle className="h-5 w-5" />,
  },
  [ToastCause.DOMAIN_CHECK_SLOW]: {
    type: 'warning',
    title: 'Network Delay',
    description: 'Delays may occur due to testnet slowness. Please wait...',
    icon: <AlertTriangle className="h-5 w-5" />,
  },
  [ToastCause.PROFILE_CREATED]: {
    type: 'success',
    title: 'Success',
    description: 'Profile created successfully!',
    icon: <CheckCircle className="h-5 w-5" />,
  },
  [ToastCause.PROFILE_UPDATED]: {
    type: 'success',
    title: 'Success',
    description: 'Profile updated successfully!',
    icon: <CheckCircle className="h-5 w-5" />,
  },
  [ToastCause.PROFILE_CREATE_FAILED]: {
    type: 'error',
    title: 'Creation Failed',
    description: 'Failed to create profile. Please try again.',
    icon: <AlertTriangle className="h-5 w-5" />,
  },
  [ToastCause.PROFILE_UPDATE_FAILED]: {
    type: 'error',
    title: 'Update Failed',
    description: 'Failed to update profile. Please try again.',
    icon: <AlertTriangle className="h-5 w-5" />,
  },
  [ToastCause.PROFILE_SUBMIT_FAILED]: {
    type: 'error',
    title: 'Submit Failed',
    description: 'Failed to submit profile. Please try again.',
    icon: <AlertTriangle className="h-5 w-5" />,
  },
};

export function useToast() {
  return useCallback((cause: ToastCause) => {
    const config = toastConfig[cause];
    const style = getToastStyle(config.type);

    const toastOptions = {
      description: config.description,
      icon: config.icon,
      duration: 5000,
      style,
      classNames: {
        title: "font-bold",
        description: "font-semibold",
      },
    };

    if (config.type === 'success') {
      toast.success(config.title, toastOptions);
    } else if (config.type === 'error') {
      toast.error(config.title, toastOptions);
    } else if (config.type === 'warning') {
      toast.warning(config.title, toastOptions);
    }
  }, []);
}
