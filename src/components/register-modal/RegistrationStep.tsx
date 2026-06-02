import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { WalletMultiButton } from "@miden-sdk/miden-wallet-adapter";
import { TOKEN_SYMBOL, getDomainPrice } from "@/shared/pricing";
import { MIDEN_FAUCET_ID_BECH32 } from "@/shared";
import { useMidenClient } from "@/contexts/MidenClientContext";

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
  connected: boolean;
  isPurchasing: boolean;
  onPurchase: () => void;
  onTermsClick: () => void;
}

type BalanceStatus = "idle" | "loading" | "loaded" | "error";

export function RegistrationStep({
  domain,
  connected,
  isPurchasing,
  onPurchase,
  onTermsClick,
}: RegistrationStepProps) {
  const { getUserBalance, userAccountId } = useMidenClient();
  const [balance, setBalance] = useState<string | null>(null);
  const [balanceStatus, setBalanceStatus] = useState<BalanceStatus>("idle");

  // Non-private accounts (public/network) have their balance reachable on-chain
  // without a wallet prompt, so we just fetch it silently. Private accounts
  // require `requestAssets()` which opens the wallet, so we gate it behind a button.
  const isAutoFetch = userAccountId ? !userAccountId.isPrivate() : false;

  const domainPrice = getDomainPrice(domain.length);

  const [randomTitle] = useState(
    () => FUN_TITLES[Math.floor(Math.random() * FUN_TITLES.length)]
  );

  const handleCheckBalance = useCallback(async () => {
    try {
      setBalanceStatus("loading");
      const fetchedBalance = await getUserBalance(MIDEN_FAUCET_ID_BECH32 as string);

      if (fetchedBalance === null) {
        setBalanceStatus("error");
        return;
      }

      setBalance(fetchedBalance.toString());
      setBalanceStatus("loaded");
    } catch (e) {
      console.error(e);
      setBalanceStatus("error");
    }
  }, [getUserBalance]);

  // Auto-fetch on first render for public/network accounts. We don't retry
  // automatically on error — the renderClaimButton path shows a Retry button.
  const autoFetchedRef = useRef(false);
  useEffect(() => {
    if (connected && isAutoFetch && !autoFetchedRef.current) {
      autoFetchedRef.current = true;
      handleCheckBalance();
    }
  }, [connected, isAutoFetch, handleCheckBalance]);

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
              {renderClaimButton(
                isPurchasing,
                balance,
                balanceStatus,
                domainPrice,
                onPurchase,
                handleCheckBalance,
                isAutoFetch
              )}
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

function renderClaimButton(
  isPurchasing: boolean,
  balance: string | null,
  balanceStatus: BalanceStatus,
  domainPrice: number,
  onPurchase: () => void,
  onCheckBalance: () => void,
  isAutoFetch: boolean
) {
  // Idle: private wallets need an explicit click (it opens the wallet prompt).
  // Public/network wallets auto-fetch on mount, so we render the loading state
  // immediately to avoid a flash of the manual button.
  if (balanceStatus === "idle") {
    if (isAutoFetch) {
      return (
        <Button disabled className="w-full px-8 py-8 text-xl" size="lg">
          Checking MIDEN balance...
        </Button>
      );
    }
    return (
      <Button
        onClick={onCheckBalance}
        className="w-full px-8 py-8 text-xl"
        size="lg"
      >
        Check MIDEN balance
      </Button>
    );
  }

  // Balance Fetching
  if (balanceStatus === "loading") {
    return (
      <Button disabled className="w-full px-8 py-8 text-xl" size="lg">
        Checking MIDEN balance...
      </Button>
    );
  }

  // Balance error
  if (balanceStatus === "error") {
    return (
      <Button
        onClick={onCheckBalance}
        className="w-full px-8 py-8 text-xl"
        size="lg"
      >
        Retry check MIDEN balance
      </Button>
    );
  }

  // Balance Fetched
  if (balanceStatus === "loaded" && balance !== null) {
    const isBalanceEnough = BigInt(balance) >= BigInt(domainPrice * 1_000_000);

    if (!isBalanceEnough) {
      return (
        <Button disabled className="w-full px-8 py-8 text-xl" size="lg">
          Insufficient Balance • {domainPrice} {TOKEN_SYMBOL}
        </Button>
      );
    }

    return (
      <Button
        onClick={onPurchase}
        disabled={isPurchasing}
        className="w-full px-8 py-8 text-xl"
        size="lg"
      >
        {isPurchasing
          ? "Processing..."
          : `Claim • ${domainPrice} ${TOKEN_SYMBOL}`}
      </Button>
    );
  }

  return null;
}