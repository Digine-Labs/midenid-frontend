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
  REGISTER_NOTE_SCRIPT,
  MIDEN_NAME_CONTRACT_CODE,
} from "@/shared";
import {
  AccountId,
  Felt,
  FungibleAsset,
  Note,
  NoteAssets,
  NoteExecutionHint,
  NoteInputs,
  NoteMetadata,
  NoteRecipient,
  NoteTag,
  NoteType,
  MidenArrays,
  OutputNote,
  TransactionRequestBuilder,
} from "@demox-labs/miden-sdk";
import { useNavigate } from "react-router";
import { useToast } from "@/hooks/useToast";
import { ToastCause } from "@/types/toast";
import { TermsModal } from "@/components/TermsModal";
import { AnimatePresence, motion } from "framer-motion";
import { RegistrationStep } from "./register-modal/RegistrationStep";
import { ProcessingStep } from "./register-modal/ProcessingStep";
import { ConfirmedStep } from "./register-modal/ConfirmedStep";
import { encodeDomain } from "@/utils/encode";
import { bech32ToAccountId, accountIdToBech32, instantiateClient, generateRandomSerialNumber } from "@/lib/midenClient";
import { createDomainMetadata, getBlockNumber } from "@/api/metadata";
import { getDomainPrice } from "@/shared/pricing";
import {
  CustomTransaction,
  TransactionType,
} from "@demox-labs/miden-wallet-adapter-base";

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
  const { connected, requestTransaction, address } = useWallet();
  //const { accountId, bech32, addPendingTransaction, confirmedDomains } = useWalletAccount();
  const showToast = useToast();
  const [currentStep, setCurrentStep] = useState<ModalStep>("registration");
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
          setRegistrationSuccessful(false);
        }

        // Reset all states when modal closes
        setCurrentStep("registration");
        setTransactionFailure(null);
        setIsPurchasing(false);
      }, 280);

      return () => clearTimeout(timer);
    }
  }, [open, registrationSuccessful, confirmationTimeoutId]);

  // Reset when domain changes
  useEffect(() => {
    setCurrentStep("registration");
    setTransactionFailure(null);
    setIsPurchasing(false);
  }, [domain]);

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
    if (connected && accountId && requestTransaction && address) {
      setTransactionFailure(null);
      setIsPurchasing(true);
      setCurrentStep("processing");
      try {
        // Initialize the Miden client to compile note script
        const client = await instantiateClient({ accountsToImport: [] });

        // Build the note script
        const builder = client.createScriptBuilder();
        const registerComponentLib = builder.buildLibrary("miden_name::naming", MIDEN_NAME_CONTRACT_CODE);
        builder.linkDynamicLibrary(registerComponentLib);
        const script = builder.compileNoteScript(REGISTER_NOTE_SCRIPT);

        // Calculate price and create assets
        const domainPrice = getDomainPrice(domain.length);
        const buyAmount = BigInt(domainPrice * 1000000);
        const assets = new FungibleAsset(faucetId, buyAmount);
        const noteAssets = new NoteAssets([assets]);

        // Create note metadata
        const noteTag = NoteTag.fromAccountId(destinationAccountId);
        const noteMetadata = new NoteMetadata(
          accountId,
          NoteType.Public,
          noteTag,
          NoteExecutionHint.always(),
          new Felt(BigInt(0))
        );

        // Build note inputs: [faucet_suffix, faucet_prefix, 0, 0, domain_felt1, domain_felt2, domain_felt3, domain_length]
        const domainWord = encodeDomain(domain);
        const domainFelts = domainWord.toFelts();
        const noteInputs = new NoteInputs(
          new MidenArrays.FeltArray([
            new Felt(faucetId.suffix().asInt()),
            new Felt(faucetId.prefix().asInt()),
            new Felt(BigInt(0)),
            new Felt(BigInt(0)),
            domainFelts[0],
            domainFelts[1],
            domainFelts[2],
            domainFelts[3],
          ])
        );

        // Create note recipient with random serial number
        const serialNumber = generateRandomSerialNumber();
        const noteRecipient = new NoteRecipient(serialNumber, script, noteInputs);

        // Create the full Note
        const note = new Note(noteAssets, noteMetadata, noteRecipient);

        // Get the note ID for MidenScan link
        const createdNoteId = note.id().toString();
        console.log("note_id:", createdNoteId);

        // Build TransactionRequest locally with the output note
        const noteArray = new MidenArrays.OutputNoteArray([OutputNote.full(note)]);
        const transactionRequest = new TransactionRequestBuilder()
          .withOwnOutputNotes(noteArray)
          .build();

        // Create CustomTransaction for the wallet
        const tx = new CustomTransaction(
          address, // from (bech32)
          accountIdToBech32(destinationAccountId), // to (bech32)
          transactionRequest,
          [],
          [],
        );

        // Request wallet to sign and submit
        const txId = await requestTransaction({
          type: TransactionType.Custom,
          payload: tx,
        });

        console.log("tx_id:", txId);

        // After wallet confirms, save domain metadata to backend
        const blockNumberResult = await getBlockNumber();
        const blockNumber = blockNumberResult.success && blockNumberResult.data ? blockNumberResult.data : 0;

        const metadataResult = await createDomainMetadata({
          domain: domain,
          account_id: accountId.toString(),
          bech32: address,
          created_block: blockNumber,
          updated_block: blockNumber,
        });

        if (!metadataResult.success) {
          console.warn("Failed to save domain metadata:", metadataResult.error);
          // Don't fail the whole flow - tx is already submitted
        }

        // Use note ID for MidenScan link
        setNoteId(createdNoteId);
        setCurrentStep("confirmed");
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
