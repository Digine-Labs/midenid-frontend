import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useWallet, WalletMultiButton } from "@demox-labs/miden-wallet-adapter";
import { TOKEN_SYMBOL, getDomainPrice } from "@/shared/pricing";
import type { AccountId } from "@demox-labs/miden-sdk";
import { MIDEN_FAUCET_ID_BECH32 } from "@/shared";

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

type BalanceStatus = "idle" | "loading" | "loaded" | "error";

export function RegistrationStep({
  domain,
  connected,
  isPurchasing,
  onPurchase,
  onTermsClick,
}: RegistrationStepProps) {
  const { requestAssets } = useWallet()
  const [balance, setBalance] = useState<string | null>(null);
  const [balanceStatus, setBalanceStatus] = useState<BalanceStatus>("idle");

  const domainPrice = getDomainPrice(domain.length);

  const [randomTitle] = useState(
    () => FUN_TITLES[Math.floor(Math.random() * FUN_TITLES.length)]
  );

  const handleCheckBalance = async () => {
    try {
      if (!requestAssets) return

      setBalanceStatus("loading");

      const assets = await requestAssets();

      const midenAsset = assets.find((asset) => asset.faucetId === MIDEN_FAUCET_ID_BECH32)

      // örnek: assets içinden balance çıkar
      const fetchedBalance = midenAsset?.amount; // bigint varsayalım

      if (!fetchedBalance) {
        console.error("Balance is undefined")
        setBalanceStatus("error")
        return
      }

      setBalance(fetchedBalance);
      setBalanceStatus("loaded");
    } catch (e) {
      console.error(e);
      setBalanceStatus("error");
    }
  };

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
                handleCheckBalance
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
  onCheckBalance: () => void
) {
  // Balance Check
  if (balanceStatus === "idle") {
    console.log(balance)
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
    console.log(balance)
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

    console.log(balance)

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