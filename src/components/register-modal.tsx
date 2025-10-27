"use client";

import {
  Modal,
  ModalBody,
  ModalContent,
  useModal,
} from "@/components/ui/shadcn-io/animated-modal";
import { type ReactNode, useState } from "react";
import { cloneElement, isValidElement, useMemo } from "react";
import { GradientText } from "@/components/ui/shadcn-io/gradient-text";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { useWallet, WalletMultiButton } from "@demox-labs/miden-wallet-adapter";
import { useWalletAccount } from "@/contexts/WalletAccountContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CircleHelp } from "lucide-react";
import {
  MIDEN_FAUCET_CONTRACT_ADDRESS,
  MIDEN_ID_CONTRACT_ADDRESS,
} from "@/shared/constants";
import { AccountId } from "@demox-labs/miden-sdk";
import { useNavigate } from "react-router";
import { bech32ToAccountId, hasRegisteredDomain } from "@/lib/midenClient";
import { registerName } from "@/lib/registerName";
import { TransactionStatusAlerts } from "@/pages/register/components/transaction-status-alerts";


interface RegisterModalProps {
  domain: string;
  trigger: ReactNode;
}

function RegisterModalTrigger({ children }: { children: ReactNode }) {
  const { setOpen } = useModal();

  // Clone the trigger element and add onClick handler
  if (isValidElement(children)) {
    return cloneElement(children as React.ReactElement<any>, {
      onClick: () => setOpen(true),
    });
  }

  return <div onClick={() => setOpen(true)}>{children}</div>;
}

export function RegisterModal({ domain, trigger }: RegisterModalProps) {
  const { resolvedTheme } = useTheme();
  const { connected, accountId: rawAccountId, requestTransaction } = useWallet();
  const { hasRegisteredDomain: walletHasDomain } = useWalletAccount();
  const [transactionSubmitted, setTransactionSubmitted] = useState(false);
  const [transactionFailed, setTransactionFailed] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const navigate = useNavigate()

  const faucetId = useMemo(
    () => AccountId.fromHex(MIDEN_FAUCET_CONTRACT_ADDRESS as string),
    []
  );

  const destinationAccountId = useMemo(
    () => AccountId.fromHex(MIDEN_ID_CONTRACT_ADDRESS as string),
    []
  );

  const accountId = useMemo(() => {
    if (rawAccountId != null) {
      return bech32ToAccountId(rawAccountId);
    } else return undefined;
  }, [rawAccountId]);

  // Fun title options
  const funTitles = useMemo(
    () => [
      "Something new is cooking!",
      "A newcomer is about to join!",
      "Fresh arrival incoming!",
      "New identity unlocking...",
      "The adventure begins here!",
      "Welcome to the neighborhood!",
      "Your digital home awaits!",
      "Ready to make history?",
      "Claim your spot in the verse!",
      "One step closer to greatness!",
    ],
    []
  );

  const randomTitle = useMemo(
    () => funTitles[Math.floor(Math.random() * funTitles.length)],
    [funTitles]
  );

  // Gradient colors based on theme
  const gradientDark =
    "linear-gradient(90deg, #0FE046 0%, #5FFF7F 25%, #7FFFA0 50%, #5FFF7F 75%, #0FE046 100%)";
  const gradientLight =
    "linear-gradient(90deg, #0FE046 0%, #11B83D 25%, #08CB00 50%, #11B83D 75%, #0FE046 100%)";

  const handlePurchase = async () => {
    if (connected && accountId && requestTransaction) {
      // Reset previous states
      setTransactionSubmitted(false);
      setTransactionFailed(false);
      setIsPurchasing(true);

      try {
        const buyAmount = BigInt(1000000);

        const result = await registerName({
          senderAccountId: accountId,
          destinationAccountId: destinationAccountId,
          faucetId: faucetId,
          amount: buyAmount, // pricing-card.tsx provides MIDEN amount
          domain: domain,
          requestTransaction: requestTransaction,
        });
        // Reset terms and show wallet prompt
        setTransactionSubmitted(true);

        if (result.txId && result.noteId && await hasRegisteredDomain(accountId)) {
          navigate('/register/receipt', {
            state: {
              domain,
              years: 1,
              price: buyAmount,
              noteId: result.noteId
            }
          })
        }

      } catch (error) {
        console.error("Registration failed:", error);
        setTransactionFailed(true);
      } finally {
        setIsPurchasing(false);
      }
    }
  };

  // Price in MIDEN tokens
  const price = 1;

  return (
    <Modal>
      <RegisterModalTrigger>{trigger}</RegisterModalTrigger>
      <ModalBody>
        <ModalContent className="flex flex-col justify-between">
          {/* Top Section - Fun Title */}
          <div className="text-center pt-6">
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-800 dark:text-neutral-200">
              {randomTitle}
            </h2>
          </div>

          {/* Middle Section - Domain Display */}
          <div className="flex-1 flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Your new identity:
              </p>
              <div className="text-4xl md:text-5xl font-bold">
                <GradientText
                  text={`${domain}.miden`}
                  gradient={resolvedTheme === "dark" ? gradientDark : gradientLight}
                />
              </div>
            </div>
          </div>

          {/* Bottom Section - Purchase */}
          <div className="space-y-4 pb-2">
            {/* Wallet Connection or Purchase Button with Tooltip */}
            <div className="flex justify-center items-center gap-2">
              {!connected ? (
                <WalletMultiButton />
              ) : (
                <>
                  <Button
                    onClick={handlePurchase}
                    disabled={isPurchasing || walletHasDomain}
                    className="w-full max-w-xs px-8 py-6 text-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2"
                    size="lg"
                  >
                    {isPurchasing ? "Processing..." : walletHasDomain ? (
                      "Wallet Already Has a Domain"
                    ) : (
                      <>
                        <span>Claim</span>
                        <span className="opacity-90">•</span>
                        <span className="font-bold">{price} MIDEN</span>
                      </>
                    )}
                  </Button>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <CircleHelp className="h-5 w-5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-sm">
                          This registration is for <strong>testnet only</strong>. Your domain will be available during the testing phase.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}
            </div>

            {/* Terms and Conditions Text */}
            <p className="text-xs text-center text-muted-foreground px-4">
              By purchasing, you accept our{" "}
              <span className="underline cursor-pointer hover:text-primary">
                Terms and Conditions
              </span>
            </p>
          </div>
        </ModalContent>
      </ModalBody>
      <TransactionStatusAlerts
        transactionSubmitted={transactionSubmitted}
        transactionFailed={transactionFailed}
      />
    </Modal>
  );
}
