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
import {
  MIDEN_FAUCET_CONTRACT_ADDRESS,
  MIDEN_ID_CONTRACT_ADDRESS,
} from "@/shared/constants";
import { AccountId, Felt } from "@demox-labs/miden-sdk";
import { useNavigate } from "react-router";
import { useToast } from "@/hooks/useToast";
import { ToastCause } from "@/types/toast";
import { TermsModal } from "@/components/TermsModal";
import { AnimatePresence, motion } from "framer-motion";
import { RegistrationStep } from "./register-modal/RegistrationStep";
import { ProcessingStep } from "./register-modal/ProcessingStep";
import { ConfirmedStep } from "./register-modal/ConfirmedStep";
import { transactionCreator } from "@/lib/transactionCreator";
import { REGISTER_NOTE_SCRIPT, MIDEN_NAME_CONTRACT_CODE } from "@/shared";
import { encodeDomain } from "@/utils/encode";
import { NoteInputs, MidenArrays } from "@demox-labs/miden-sdk";
import { useDomainRegistration } from "@/contexts/DomainRegistrationContext";
import { getDomainPrice } from "@/shared/pricing";
import { bech32ToAccountId, instantiateClient } from "@/lib/midenClient";

// Transaction failure reason type
export const TransactionFailureReason = {
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  TRANSACTION_ERROR: 'TRANSACTION_ERROR',
} as const;

export type TransactionFailureReason = typeof TransactionFailureReason[keyof typeof TransactionFailureReason];

// Transaction failure state with unique ID
export interface TransactionFailure {
  reason: TransactionFailureReason;
  id: number;
}

interface RegisterModalProps {
  domain: string;
  trigger: ReactNode;
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

function RegisterModalContent({
  domain,
}: {
  domain: string;
}) {
  const domainPrice = getDomainPrice(domain.length);
  // MESS
  const { connected, requestTransaction, address } = useWallet();
  //const { accountId, bech32, addPendingTransaction, confirmedDomains } = useWalletAccount();
  const { onRegistrationComplete } = useDomainRegistration();
  const showToast = useToast();
  const [currentStep, setCurrentStep] = useState<ModalStep>("registration");
  const [transactionSubmitted, setTransactionSubmitted] = useState(false);
  const [transactionFailure, setTransactionFailure] = useState<TransactionFailure | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [termsOpen, setTermsOpen] = useState(false);
  const navigate = useNavigate();
  const { open, setOpen } = useModal();

  const faucetId = useMemo(
    () => AccountId.fromHex(MIDEN_FAUCET_CONTRACT_ADDRESS as string),
    []
  );
  const accountId = useMemo(
    () => address ? bech32ToAccountId(address) : null,
    [address]
  );
  

  const destinationAccountId = useMemo(
    () => AccountId.fromHex(MIDEN_ID_CONTRACT_ADDRESS as string),
    []
  );

  // Track if registration was successful
  const [registrationSuccessful, setRegistrationSuccessful] = useState(false);

  // Track timeout ID for cleanup
  const [confirmationTimeoutId, setConfirmationTimeoutId] = useState<number | null>(null);

  // Watch for domain confirmation from background monitor


  // Reset to registration step when modal is closed or domain changes
  useEffect(() => {
    if (!open) {
      // Clear confirmation timeout if modal closes
      if (confirmationTimeoutId) {
        clearTimeout(confirmationTimeoutId);
        setConfirmationTimeoutId(null);
      }

      // Wait for modal close animation to complete (300ms) before clearing states
      const timer = setTimeout(() => {
        // If registration was successful, clear the home page input
        if (registrationSuccessful) {
          onRegistrationComplete();
          setRegistrationSuccessful(false);
        }

        // Reset all states when modal closes
        setCurrentStep("registration");
        setTransactionSubmitted(false);
        setTransactionFailure(null);
        setIsPurchasing(false);
      }, 280);

      return () => clearTimeout(timer);
    }
  }, [open, registrationSuccessful, onRegistrationComplete, confirmationTimeoutId]);

  // Reset when domain changes
  useEffect(() => {
    setCurrentStep("registration");
    setTransactionSubmitted(false);
    setTransactionFailure(null);
    setIsPurchasing(false);
  }, [domain]);

  // Show toast when transaction is submitted
  useEffect(() => {
    if (transactionSubmitted) {
      showToast(ToastCause.TRANSACTION_SUBMITTED);
    }
  }, [transactionSubmitted, showToast]);

  // Show toast when transaction fails
  useEffect(() => {
    if (transactionFailure) {
      const causeMap = {
        [TransactionFailureReason.INSUFFICIENT_BALANCE]: ToastCause.INSUFFICIENT_BALANCE,
        [TransactionFailureReason.TRANSACTION_ERROR]: ToastCause.TRANSACTION_ERROR,
      };
      showToast(causeMap[transactionFailure.reason]);
    }
  }, [transactionFailure, showToast]);

  if (!accountId) return null;
  const handlePurchase = async () => {
    if (connected && accountId && requestTransaction) {
      setTransactionSubmitted(false);
      setTransactionFailure(null);
      setIsPurchasing(true);
      setCurrentStep("processing");
      try {
        const client = await instantiateClient({ accountsToImport: []});

        // Import accounts (lazy init if needed)
        await client.importAccountById(accountId);
        await client.importAccountById(destinationAccountId);

        //const client = await clientSingleton.getClient();

        const buyAmount = BigInt(domainPrice * 1000000);

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
          ])
        );

        
        const { noteId } = await transactionCreator({
          client,
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

        console.log("note_id:", noteId)
        setNoteId(noteId);
        setCurrentStep("confirmed");
        // Transaction approved by wallet, show processing step
        setTransactionSubmitted(true);


        // Set timeout for registration confirmation (80 seconds)
        // The actual confirmation is handled by useEffect watching confirmedDomains
        const maxWaitTime = 80000;
        const timeoutId = window.setTimeout(() => {
          setTransactionFailure({
            reason: TransactionFailureReason.TRANSACTION_ERROR,
            id: Date.now()
          });
          setCurrentStep("registration");
          setConfirmationTimeoutId(null);
        }, maxWaitTime);

        setConfirmationTimeoutId(timeoutId);

      } catch (error) {
        console.error("Transaction error:", error);
        setTransactionFailure({
          reason: TransactionFailureReason.TRANSACTION_ERROR,
          id: Date.now()
        });
        setCurrentStep("registration");
      } finally {
        setIsPurchasing(false);
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
                  buyer={accountId}
                  paymentFaucet={faucetId}
                  connected={connected}
                  isPurchasing={isPurchasing}
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
                <ConfirmedStep noteId={noteId} onGoHome={handleGoHome} />
              </motion.div>
            )}
          </AnimatePresence>
        </ModalContent>
      </ModalBody>
      <TermsModal open={termsOpen} onOpenChange={setTermsOpen} />
    </>
  );
}

export function RegisterModal({
  domain,
  trigger,
}: RegisterModalProps) {
  return (
    <Modal>
      <RegisterModalTrigger>{trigger}</RegisterModalTrigger>
      <RegisterModalContent
        domain={domain}
      />
    </Modal>
  );
}
