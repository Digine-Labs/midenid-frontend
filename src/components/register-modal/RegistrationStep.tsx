"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { WalletMultiButton } from "@demox-labs/miden-wallet-adapter";
import { TOKEN_SYMBOL, getDomainPrice } from "@/shared/pricing";
import { useBalance } from "@/hooks/useBalance";
import type { AccountId } from "@demox-labs/miden-sdk";

const FUN_TITLES = [
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
];

interface RegistrationStepProps {
  domain: string;
  buyer: AccountId;
  paymentFaucet: AccountId;
  connected: boolean;
  isPurchasing: boolean;
  onPurchase: () => void;
  onTermsClick: () => void;
}

export function RegistrationStep({
  domain,
  buyer,
  paymentFaucet,
  connected,
  isPurchasing,
  onPurchase,
  onTermsClick,
}: RegistrationStepProps) {
  const balance = useBalance({ accountId: buyer, faucetId: paymentFaucet });

  const domainPrice = getDomainPrice(domain.length);

  const [randomTitle] = useState(
    () => FUN_TITLES[Math.floor(Math.random() * FUN_TITLES.length)]
  );

  return (
    <>
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
          <div className="text-4xl md:text-5xl font-bold text-primary break-all">
            {domain}<span className="whitespace-nowrap">.miden</span>
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
          <div className="space-y-3 px-4 ">

            <div className="relative">
              {renderClaimButton(isPurchasing, balance, domainPrice, onPurchase)}
            </div>
          </div>
        )}

        {/* Terms and Conditions Text */}
        <p className="text-xs text-center text-muted-foreground px-4">
          By purchasing, you accept our{" "}
          <span
            className="underline cursor-pointer hover:text-primary"
            onClick={onTermsClick}
          >
            Terms and Conditions
          </span>
        </p>
      </div>
    </>
  );
}

function renderClaimButton(isPurchasing: boolean, balance: bigint | null, domainPrice: number, onPurchase: () => void) {
  // Loading state - balance not yet fetched
  if (balance === null) {
    return (
      <Button
        disabled={true}
        className="w-full px-8 py-8 text-md xs:text-xl bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-primary shadow-lg"
        size="lg"
      >
        <div className="flex items-center gap-3">
          <span className="text-md xs:text-xl font-bold">Loading balance...</span>
        </div>
      </Button>
    );
  }

  const isBalanceEnough = balance >= BigInt(domainPrice * 1000000);

  if (isBalanceEnough) {
    if (isPurchasing) {
      return (
        <Button
          onClick={onPurchase}
          disabled={true}
          className="w-full px-8 py-8 text-md xs:text-xl bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-primary shadow-lg"
          size="lg"
        >
          Processing...
        </Button>
      );
    } else {
      return (
        <Button
          onClick={onPurchase}
          disabled={false}
          className="w-full px-8 py-8 text-md xs:text-xl bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-primary shadow-lg"
          size="lg"
        >
          <div className="flex items-center gap-3">
            <span className="text-md xs:text-xl font-bold">Claim</span>
            <span className="opacity-90">•</span>
            <span className="text-md xs:text-xl">{domainPrice} {TOKEN_SYMBOL}</span>
          </div>
        </Button>
      );
    }
  } else {
    // Balance not enough
    return (
      <Button
        onClick={onPurchase}
        disabled={true}
        className="w-full px-8 py-8 text-md xs:text-xl bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-primary shadow-lg"
        size="lg"
      >
        <div className="flex items-center gap-3">
          <span className="text-md xs:text-xl font-bold">Insufficient Balance</span>
          <span className="opacity-90">•</span>
          <span className="text-md xs:text-xl">{domainPrice} {TOKEN_SYMBOL}</span>
        </div>
      </Button>
    );
  }
}