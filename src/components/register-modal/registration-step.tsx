"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { WalletMultiButton } from "@demox-labs/miden-wallet-adapter";
// import { Zap } from "lucide-react";
import { PRICING_TIERS, calculateDomainPrice, TOKEN_SYMBOL, type PricingTier as PricingTierBase } from "@/shared/pricing";

interface PricingTier extends PricingTierBase {
  price: number;
}

interface RegistrationStepProps {
  domain: string;
  connected: boolean;
  isPurchasing: boolean;
  walletHasDomain: boolean;
  selectedTier: PricingTier | null;
  onPurchase: (tier: PricingTier) => void;
  onTermsClick: () => void;
}

export function RegistrationStep({
  domain,
  connected,
  isPurchasing,
  walletHasDomain,
  selectedTier,
  onPurchase,
  onTermsClick
}: RegistrationStepProps) {
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
            {/* Best Value - 5 Years */}

            {/* THIS IS BUTTON FOR 5 YEARS TEMPORARILY DISABLED AND MADE IT 1 YEAR ONLY */}

            <div className="relative">
              {/* {!walletHasDomain &&
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-0.5 rounded-full text-xs font-bold items-center gap-1 shadow-md z-10 flex" style={{ width: "190px" }}>
                  <Zap className="w-3 h-3" />
                  BEST VALUE - Save 40%
                </div>} */}
              <Button
                onClick={() => onPurchase(pricingTiers[0])}
                disabled={isPurchasing || walletHasDomain}
                className="w-full px-8 py-8 text-md xs:text-xl bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-primary shadow-lg"
                size="lg"
              >
                {isPurchasing && selectedTier?.years === 5 ? (
                  "Processing..."
                ) : walletHasDomain ? (
                  "Wallet Already Has a Domain"
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-md xs:text-xl font-bold">Claim 1 Year</span>
                    <span className="opacity-90">•</span>
                    <span className="text-md xs:text-xl">{pricingTiers[0]?.price} {TOKEN_SYMBOL}</span>
                  </div>
                )}
              </Button>
            </div>

            {/* BUTTONS FOR 1 AND 3 YEARS TEMPORARILY DISABLED */}

            {/* 3 Years Button and 1 Year Link on Same Line */}
            {/* {!walletHasDomain &&
              <div className="flex flex-col xs:flex-row items-center gap-3">
                <Button
                  onClick={() => onPurchase(pricingTiers[1])}
                  disabled={isPurchasing || walletHasDomain}
                  className="w-full xs:flex-1 px-4 py-6 bg-secondary text-accent-foreground hover:bg-accent/90"
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
                or */}
            {/* 1 Year Text Link */}
            {/* <button
                  onClick={() => onPurchase(pricingTiers[0])}
                  disabled={isPurchasing || walletHasDomain}
                  className="text-sm text-muted-foreground hover:text-primary underline disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isPurchasing && selectedTier?.years === 1
                    ? "Processing..."
                    : `1 year (${pricingTiers[0]?.price} ${TOKEN_SYMBOL})`}
                </button>
              </div>} */}
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
