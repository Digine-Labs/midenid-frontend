import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router";
import { useWallet } from "@demox-labs/miden-wallet-adapter";
import { Button } from "@/components/ui/button";
import { PricingCard } from "./components/pricing-card";
import { DomainDetailsCard } from "./components/domain-details-card";
import { Faq } from "./components/faq";
import { Breadcrumb } from "./components/breadcrumb";
import { WalletMultiButton } from "@demox-labs/miden-wallet-adapter";
import { registerName } from "@/lib/registerName";
import { bech32ToAccountId } from "@/lib/midenClient";
import { AccountId } from "@demox-labs/miden-sdk";
import { TransactionStatusAlerts } from "./components/transaction-status-alerts";
import { RoughNotation } from "react-rough-notation";
import { useTheme } from "@/components/theme-provider";
import {
  MIDEN_FAUCET_CONTRACT_ADDRESS,
  MIDEN_ID_CONTRACT_ADDRESS,
} from "@/shared/constants";
import { useWalletAccount } from "@/contexts/WalletAccountContext";
import { useNavigate } from "react-router";

export default function Register() {
  const { hasRegisteredDomain: walletHasDomain } = useWalletAccount();
  const [searchParams] = useSearchParams();
  const domain = searchParams.get("domain") || "";
  const [years, setYears] = useState<number | string>(1);
  const [showYearsTooltip, setShowYearsTooltip] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [amount, setAmount] = useState(1);
  const [emptyInputTimer, setEmptyInputTimer] = useState<number | null>(null);
  const [transactionSubmitted, setTransactionSubmitted] = useState(false);
  const [transactionFailed, setTransactionFailed] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate()

  // Get the highlight color based on theme
  const highlightColor = resolvedTheme === 'dark' ? '#11B83D' : '#0FE046';

  // Array of fun pub-themed titles
  const titleOptions = useMemo(() => [
    `Hear ye, hear ye! ${domain}.miden awaits!`,
    `Step right up for ${domain}.miden!`,
    `Gather round! ${domain}.miden needs an owner!`,
    `Calling all patrons! Claim ${domain}.miden!`,
    `Last call for ${domain}.miden!`,
  ], [domain]);

  // Randomly select a title on component mount
  const randomTitle = useMemo(
    () => titleOptions[Math.floor(Math.random() * titleOptions.length)],
    [titleOptions]
  );

  // Calculate dynamic font size based on domain length
  // Subtext is text-base sm:text-lg (16px base, 18px sm+)
  // We ensure title never goes below these sizes
  const titleFontSize = useMemo(() => {
    const baseSize = 32; // md:text-4xl equivalent (32px for md+)
    const minSize = 18; // text-lg equivalent (subtext size)

    // Calculate reduction based on domain length
    // Max domain length is 21, start reducing after 10 characters
    if (domain.length <= 10) {
      return baseSize;
    }

    // Reduce font size progressively for longer domains
    const reduction = Math.min((domain.length - 10) * 1.5, baseSize - minSize);
    return Math.max(baseSize - reduction, minSize);
  }, [domain]);

  const titleClassName = useMemo(() => {
    // Use inline style for precise font size control
    return "font-bold md:tracking-tight";
  }, []);

  // Function to render title with highlighted domain
  const renderTitle = () => {
    // Find the domain.miden pattern in the title
    const domainPattern = `${domain}.miden`;
    const parts = randomTitle.split(domainPattern);

    if (parts.length === 1) {
      // Domain not found in title, return as is
      return randomTitle;
    }

    // Split into before, domain, and after
    return (
      <>
        {parts[0]}
        <RoughNotation
          type="highlight"
          color={highlightColor}
          strokeWidth={2}
          iterations={2}
          show={true}
          padding={[2, 4]}
        >
          {domainPattern}
        </RoughNotation>
        {parts[1]}
      </>
    );
  };
  const {
    connected,
    requestTransaction,
    accountId: rawAccountId,
  } = useWallet();

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

  const handleYearsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Clear any existing empty input timer
    if (emptyInputTimer) {
      clearTimeout(emptyInputTimer);
      setEmptyInputTimer(null);
    }

    // Allow empty input for better user experience
    if (inputValue === "") {
      setYears("");
      setShowYearsTooltip(false);

      // Set timer to reset to 1 after 3 seconds of empty input
      const timer = setTimeout(() => {
        setYears(1);
        setEmptyInputTimer(null);
      }, 3000);

      setEmptyInputTimer(timer);
      return;
    }

    const value = parseInt(inputValue);

    // Handle invalid input (NaN)
    if (isNaN(value)) {
      return;
    }

    if (value > 10) {
      setShowYearsTooltip(true);
      setYears(10); // Cap at 10
    } else if (value < 1) {
      setYears(1); // Minimum 1 year
    } else {
      setYears(value);
      setShowYearsTooltip(false);
    }
  };

  const handleYearsIncrement = () => {
    const currentYears = typeof years === 'string' ? parseInt(years) || 1 : years;
    if (currentYears < 10) {
      setYears(currentYears + 1);
      setShowYearsTooltip(false);
    }
  };

  const handleYearsDecrement = () => {
    const currentYears = typeof years === 'string' ? parseInt(years) || 1 : years;
    if (currentYears > 1) {
      setYears(currentYears - 1);
      setShowYearsTooltip(false);
    }
  };

  // Hide tooltip after 3 seconds
  useEffect(() => {
    if (showYearsTooltip) {
      const timer = setTimeout(() => {
        setShowYearsTooltip(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showYearsTooltip]);

  // Cleanup empty input timer on component unmount
  useEffect(() => {
    return () => {
      if (emptyInputTimer) {
        clearTimeout(emptyInputTimer);
      }
    };
  }, [emptyInputTimer]);

  const handlePurchase = async () => {
    if (connected && accountId && requestTransaction) {
      // Reset previous states
      setTransactionSubmitted(false);
      setTransactionFailed(false);
      setIsPurchasing(true);

      try {
        const buyAmount = BigInt(1000000) * BigInt(amount);

        const result = await registerName({
          senderAccountId: accountId,
          destinationAccountId: destinationAccountId,
          faucetId: faucetId,
          amount: buyAmount, // pricing-card.tsx provides MIDEN amount
          domain: domain,
          requestTransaction: requestTransaction,
        });
        // Reset terms and show wallet prompt
        setTermsAccepted(false);
        setTransactionSubmitted(true);

        if (result.txId) {
          navigate('/register/receipt', {
            state: {
              domain,
              years: typeof years === 'string' ? parseInt(years) || 1 : years,
              price: buyAmount
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
    <div className="pt-14 bg-background min-h-screen px-4">
      <main
        className="flex items-center justify-center sm:px-6 lg:px-8"
        style={{ minHeight: "calc(100vh - 3.5rem)" }}
      >
        <div className="w-full sm:max-w-md md:max-w-2xl lg:max-w-3xl text-center py-5">
          <Breadcrumb currentStep="checkout" />
          <div className="space-y-2 mb-6 ">
            <h1
              className={titleClassName}
              style={{ fontSize: `${titleFontSize}px` }}
            >
              {renderTitle()}
            </h1>
            <p className="text-base sm:text-lg px-2 text-muted-foreground">
              This name is calling your name. Literally. Let's make it official!
            </p>
          </div>



          <div className="w-full space-y-4 ">
            <DomainDetailsCard
              domain={domain}
              years={years}
              showYearsTooltip={showYearsTooltip}
              onYearsChange={handleYearsChange}
              onYearsIncrement={handleYearsIncrement}
              onYearsDecrement={handleYearsDecrement}
            />

            {!connected ? (
              <div className="flex justify-center">
                <WalletMultiButton />
              </div>
            ) : (
              <div className="space-y-4">
                <TransactionStatusAlerts
                  transactionSubmitted={transactionSubmitted}
                  transactionFailed={transactionFailed}
                />
                <PricingCard
                  domain={domain}
                  years={years}
                  termsAccepted={termsAccepted}
                  onTermsChange={setTermsAccepted}
                  onAmountChange={setAmount}
                />
                <div className="flex justify-center gap-4">
                  <Button
                    onClick={handlePurchase}
                    disabled={!termsAccepted || isPurchasing || walletHasDomain}
                    className="px-8 py-2 text-lg bg-primary text-primary-foreground hover:bg-primary/90"
                    size="lg"
                  >
                    {isPurchasing ? "Processing..." : walletHasDomain ? "Wallet Already Has Domain" : "Purchase"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="my-12">
            <Faq />
          </div>
        </div>
      </main>
    </div>
  );
}
