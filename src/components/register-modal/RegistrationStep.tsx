"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { WalletMultiButton } from "@demox-labs/miden-wallet-adapter";
import { PRICING_TIERS, calculateDomainPrice, TOKEN_SYMBOL, type PricingTier as PricingTierBase } from "@/shared/pricing";
import { useWalletAccount } from "@/contexts/WalletAccountContext";

interface PricingTier extends PricingTierBase {
  price: number;
}

interface RegistrationStepProps {
  domain: string;
  connected: boolean;
  isPurchasing: boolean;
  selectedTier: PricingTier | null;
  onPurchase: (tier: PricingTier) => void;
  onTermsClick: () => void;
}

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

function getRandomTitle(): string {
  return FUN_TITLES[Math.floor(Math.random() * FUN_TITLES.length)];
}

export function RegistrationStep({
  domain,
  connected,
  isPurchasing,
  selectedTier,
  onPurchase,
  onTermsClick
}: RegistrationStepProps) {
  const { balance } = useWalletAccount();

  // Generate random title once on mount, not on every render
  const [randomTitle] = useState(getRandomTitle);

  const pricingTiers: PricingTier[] = useMemo(() => {
    const domainLength = domain.length;
    return PRICING_TIERS.map(tier => ({
      ...tier,
      price: calculateDomainPrice(domainLength, tier.years, tier.displayYears),
    }));
  }, [domain]);

  const hasInsufficientBalance = useMemo(() => {
    if (balance === null) return false;
    const requiredAmount = BigInt(pricingTiers[0]?.price * 1000000);
    return balance < requiredAmount;
  }, [balance, pricingTiers]);

  return (
    <>
      <div className="text-center pt-6">
        <h2 className="text-2xl md:text-3xl font-bold text-neutral-800 dark:text-neutral-200">
          {randomTitle}
        </h2>
      </div>

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

      <div className="space-y-4 pb-2">
        {!connected ? (
          <div className="flex justify-center">
            <WalletMultiButton />
          </div>
        ) : (
          <div className="space-y-3 px-4">
            <div className="relative">
              <Button
                onClick={() => onPurchase(pricingTiers[0])}
                disabled={isPurchasing || hasInsufficientBalance}
                className="w-full px-8 py-8 text-md xs:text-xl bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-primary shadow-lg"
                size="lg"
              >
                {isPurchasing && selectedTier?.years === 1 ? (
                  "Processing..."
                ) : hasInsufficientBalance ? (
                  <div className="flex items-center gap-3">
                    <span className="text-md xs:text-xl font-bold">Insufficient Balance</span>
                    <span className="opacity-90">•</span>
                    <span className="text-md xs:text-xl">{pricingTiers[0]?.price} {TOKEN_SYMBOL}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-md xs:text-xl font-bold">Claim</span>
                    <span className="opacity-90">•</span>
                    <span className="text-md xs:text-xl">{pricingTiers[0]?.price} {TOKEN_SYMBOL}</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        )}

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
