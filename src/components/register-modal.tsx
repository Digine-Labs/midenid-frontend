"use client";

import {
  Modal,
  ModalBody,
  ModalContent,
  useModal,
} from "@/components/ui/shadcn-io/animated-modal";
import { type ReactNode, useState, useEffect } from "react";
import { cloneElement, isValidElement, useMemo } from "react";
import { useWallet } from "@demox-labs/miden-wallet-adapter";
import { useWalletAccount } from "@/contexts/WalletAccountContext";
import {
  MIDEN_FAUCET_CONTRACT_ADDRESS,
  MIDEN_ID_CONTRACT_ADDRESS,
} from "@/shared/constants";
import { AccountId, Felt } from "@demox-labs/miden-sdk";
import { useNavigate } from "react-router";
import { TransactionStatusAlerts } from "@/components/transaction-status-alerts";
import { TermsModal } from "@/components/terms-modal";
import { type PricingTier as PricingTierBase } from "@/shared/pricing";
import { AnimatePresence, motion } from "framer-motion";
import { RegistrationStep } from "./register-modal/registration-step";
import { ProcessingStep } from "./register-modal/processing-step";
import { ConfirmedStep } from "./register-modal/confirmed-step";
import { hasRegisteredDomain } from "@/lib/midenClient";
import { transactionCreator } from "@/lib/transactionCreator";
import { REGISTER_NOTE_SCRIPT, MIDEN_NAME_CONTRACT_CODE } from "@/shared";
import { encodeDomain } from "@/utils/encode";
import { NoteInputs, MidenArrays } from "@demox-labs/miden-sdk";


interface RegisterModalProps {
  domain: string;
  trigger: ReactNode;
}

interface PricingTier extends PricingTierBase {
  price: number;
}

type ModalStep = "registration" | "processing" | "confirmed";

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

function RegisterModalContent({ domain }: { domain: string }) {
  const { connected, requestTransaction } = useWallet();
  const { hasRegisteredDomain: walletHasDomain, refetch: refetchWalletAccount, accountId } = useWalletAccount();
  const [currentStep, setCurrentStep] = useState<ModalStep>("registration");
  const [transactionSubmitted, setTransactionSubmitted] = useState(false);
  const [transactionFailed, setTransactionFailed] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);
  const navigate = useNavigate();
  const { open, setOpen } = useModal();

  const faucetId = useMemo(
    () => AccountId.fromHex(MIDEN_FAUCET_CONTRACT_ADDRESS as string),
    []
  );

  const destinationAccountId = useMemo(
    () => AccountId.fromHex(MIDEN_ID_CONTRACT_ADDRESS as string),
    []
  );

  // Reset to registration step when modal is closed or domain changes
  useEffect(() => {
    if (!open) {
      // Reset all states when modal closes
      setCurrentStep("registration");
      setTransactionSubmitted(false);
      setTransactionFailed(false);
      setIsPurchasing(false);
      setSelectedTier(null);
    }
  }, [open]);

  // Reset when domain changes
  useEffect(() => {
    setCurrentStep("registration");
    setTransactionSubmitted(false);
    setTransactionFailed(false);
    setIsPurchasing(false);
    setSelectedTier(null);
  }, [domain]);

  const handlePurchase = async (tier: PricingTier) => {
    if (connected && accountId && requestTransaction) {
      // Reset previous states
      setTransactionSubmitted(false);
      setTransactionFailed(false);
      setIsPurchasing(true);
      setSelectedTier(tier);

      try {
        const buyAmount = BigInt(tier.price * 1000000);

        const domainWord = encodeDomain(domain);

        const noteInputs = new NoteInputs(
          new MidenArrays.FeltArray([
            new Felt(faucetId.suffix().asInt()),
            new Felt(faucetId.prefix().asInt()),
            new Felt(BigInt(0)),
            new Felt(BigInt(0)),
            domainWord.toFelts()[0],
            domainWord.toFelts()[1],
            domainWord.toFelts()[2],
            domainWord.toFelts()[3],
            new Felt(BigInt(tier.years)),
            new Felt(BigInt(0)),
            new Felt(BigInt(0)),
            new Felt(BigInt(0)),
          ])
        );

        await transactionCreator({
          senderAccountId: accountId,
          destinationAccountId: destinationAccountId,
          noteScript: REGISTER_NOTE_SCRIPT,
          libraryScript: MIDEN_NAME_CONTRACT_CODE,
          libraryName: "miden_name::naming",
          noteInputs: noteInputs,
          faucetId: faucetId,
          amount: buyAmount,
          requestTransaction: requestTransaction,
        })

        // Transaction approved by wallet, show processing step
        setTransactionSubmitted(true);
        setCurrentStep("processing");

        // Start timer
        const startTime = Date.now();

        // check if domain is registered. If not registered in 150 seconds, show error
        if (await hasRegisteredDomain(domain) || (Date.now() - startTime) >= 15000) {
          setCurrentStep("confirmed");
        } else {
          setTransactionFailed(true);
          setCurrentStep("registration");
          setIsPurchasing(false);
          refetchWalletAccount();
        }

      } catch (error) {
        console.error("Registration failed:", error);
        setTransactionFailed(true);
        setCurrentStep("registration");
      } finally {
        setIsPurchasing(false);
        // Refetch wallet account data to update hasRegisteredDomain
        refetchWalletAccount();
      }
    }
  };

  const handleGoHome = () => {
    setOpen(false);
    navigate('/');
  };

  return (
    <>
      <ModalBody>
        <ModalContent className="flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {currentStep === "registration" && (
              <motion.div
                key="registration"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <RegistrationStep
                  domain={domain}
                  connected={connected}
                  isPurchasing={isPurchasing}
                  walletHasDomain={walletHasDomain}
                  selectedTier={selectedTier}
                  onPurchase={handlePurchase}
                  onTermsClick={() => setTermsOpen(true)}
                />
              </motion.div>
            )}

            {currentStep === "processing" && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <ProcessingStep domain={domain} />
              </motion.div>
            )}

            {currentStep === "confirmed" && (
              <motion.div
                key="confirmed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <ConfirmedStep domain={domain} onGoHome={handleGoHome} />
              </motion.div>
            )}
          </AnimatePresence>
        </ModalContent>
      </ModalBody>
      <TransactionStatusAlerts
        transactionSubmitted={transactionSubmitted}
        transactionFailed={transactionFailed}
      />
      <TermsModal open={termsOpen} onOpenChange={setTermsOpen} />
    </>
  );
}

export function RegisterModal({ domain, trigger }: RegisterModalProps) {
  return (
    <Modal>
      <RegisterModalTrigger>{trigger}</RegisterModalTrigger>
      <RegisterModalContent domain={domain} />
    </Modal>
  );
}
