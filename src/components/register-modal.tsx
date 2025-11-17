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
import { Zap } from "lucide-react";
import {
  MIDEN_FAUCET_CONTRACT_ADDRESS,
  MIDEN_ID_CONTRACT_ADDRESS,
} from "@/shared/constants";
import { AccountId } from "@demox-labs/miden-sdk";
import { useNavigate } from "react-router";
import { bech32ToAccountId } from "@/lib/midenClient";
import { registerName } from "@/lib/registerName";
import { TransactionStatusAlerts } from "@/pages/register/components/transaction-status-alerts";
import { TermsModal } from "@/pages/register/components/terms-modal";
import { PRICING_TIERS, calculateDomainPrice, TOKEN_SYMBOL, type PricingTier as PricingTierBase } from "@/shared/pricing";


interface RegisterModalProps {
  domain: string;
  trigger: ReactNode;
}

interface PricingTier extends PricingTierBase {
  price: number;
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
  const [termsOpen, setTermsOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);
  const navigate = useNavigate();

  // Calculate pricing tiers based on domain length
  const pricingTiers: PricingTier[] = useMemo(
    () => {
      const domainLength = domain.length;
      return PRICING_TIERS.map(tier => ({
        ...tier,
        price: calculateDomainPrice(domainLength, tier.years, tier.displayYears),
      }));
    },
    [domain]
  );

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

  const handlePurchase = async (tier: PricingTier) => {
    if (connected && accountId && requestTransaction) {
      // Reset previous states
      setTransactionSubmitted(false);
      setTransactionFailed(false);
      setIsPurchasing(true);
      setSelectedTier(tier);

      try {
        const buyAmount = BigInt(tier.price * 1000000);

        const result = await registerName({
          senderAccountId: accountId,
          destinationAccountId: destinationAccountId,
          faucetId: faucetId,
          amount: buyAmount,
          domain: domain,
          requestTransaction: requestTransaction,
        });
        // Reset terms and show wallet prompt
        setTransactionSubmitted(true);

        if (result.txId && result.noteId) {
          navigate('/register/receipt', {
            state: {
              domain,
              years: tier.years,
              price: buyAmount,
              noteId: result.noteId,
              accountId: accountId
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

          {/* Bottom Section - Purchase Options */}
          <div className="space-y-4 pb-2">
            {!connected ? (
              <div className="flex justify-center">
                <WalletMultiButton />
              </div>
            ) : (
              <div className="space-y-3 px-4">
                {/* Best Value - 5 Years */}
                <div className="relative">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-md z-10">
                    <Zap className="w-3 h-3" />
                    BEST VALUE - Save 40%
                  </div>
                  <Button
                    onClick={() => handlePurchase(pricingTiers[2])}
                    disabled={isPurchasing || walletHasDomain}
                    className="w-full px-8 py-8 text-lg bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-primary shadow-lg"
                    size="lg"
                  >
                    {isPurchasing && selectedTier?.years === 5 ? (
                      "Processing..."
                    ) : walletHasDomain ? (
                      "Wallet Already Has a Domain"
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold">Claim 5 Years</span>
                        <span className="opacity-90">•</span>
                        <span className="text-xl">{pricingTiers[2]?.price} {TOKEN_SYMBOL}</span>
                      </div>
                    )}
                  </Button>
                </div>

                {/* 3 Years Button and 1 Year Link on Same Line */}
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => handlePurchase(pricingTiers[1])}
                    disabled={isPurchasing || walletHasDomain}
                    className="flex-1 px-4 py-6 bg-secondary text-accent-foreground hover:bg-accent/90"
                    size="sm"
                  >
                    {isPurchasing && selectedTier?.years === 3 ? (
                      "Processing..."
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-semibold">3 Years</span>
                        <span className="text-sm opacity-80">{pricingTiers[1]?.price} {TOKEN_SYMBOL}</span>
                      </div>
                    )}
                  </Button>
                    or
                  {/* 1 Year Text Link */}
                  <button
                    onClick={() => handlePurchase(pricingTiers[0])}
                    disabled={isPurchasing || walletHasDomain}
                    className="text-sm text-muted-foreground hover:text-primary underline disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isPurchasing && selectedTier?.years === 1
                      ? "Processing..."
                      : `1 year (${pricingTiers[0]?.price} ${TOKEN_SYMBOL})`}
                  </button>
                </div>
              </div>
            )}

            {/* Terms and Conditions Text */}
            <p className="text-xs text-center text-muted-foreground px-4">
              By purchasing, you accept our{" "}
              <span
                className="underline cursor-pointer hover:text-primary"
                onClick={() => setTermsOpen(true)}
              >
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
      <TermsModal open={termsOpen} onOpenChange={setTermsOpen} />
    </Modal>
  );
}
