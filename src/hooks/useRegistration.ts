import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useWallet } from "@demox-labs/miden-wallet-adapter";
import { useWalletAccount } from "@/contexts/WalletAccountContext";
import { useDomainRegistration } from "@/contexts/DomainRegistrationContext";
import { useToast } from "@/hooks/useToast";
import { ToastCause } from "@/types/toast";
import { AccountId, Felt, NoteInputs, MidenArrays } from "@demox-labs/miden-sdk";
import { getMidenClient } from "@/lib/MidenClientSingleton";
import { transactionCreator } from "@/lib/transactionCreator";
import { REGISTER_NOTE_SCRIPT, MIDEN_NAME_CONTRACT_CODE } from "@/shared";
import { encodeDomain } from "@/utils/encode";
import {
  MIDEN_FAUCET_CONTRACT_ADDRESS,
  MIDEN_ID_CONTRACT_ADDRESS,
} from "@/shared/constants";
import type { PricingTier as PricingTierBase } from "@/shared/pricing";

export const TransactionFailureReason = {
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  TRANSACTION_ERROR: 'TRANSACTION_ERROR',
} as const;

export type TransactionFailureReason = typeof TransactionFailureReason[keyof typeof TransactionFailureReason];

export interface TransactionFailure {
  reason: TransactionFailureReason;
  id: number;
}

interface PricingTier extends PricingTierBase {
  price: number;
}

export type ModalStep = "registration" | "processing" | "confirmed";

interface UseRegistrationOptions {
  domain: string;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CONFIRMATION_TIMEOUT_MS = 80000;
const MODAL_CLOSE_ANIMATION_MS = 280;

export function useRegistration({ domain, open, setOpen }: UseRegistrationOptions) {
  const { connected, requestTransaction } = useWallet();
  const { accountId, bech32, addPendingTransaction, confirmedDomains } = useWalletAccount();
  const { onRegistrationComplete } = useDomainRegistration();
  const showToast = useToast();

  const [currentStep, setCurrentStep] = useState<ModalStep>("registration");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);
  const [transactionFailure, setTransactionFailure] = useState<TransactionFailure | null>(null);

  // Use refs to track state without triggering re-renders
  const registrationSuccessfulRef = useRef(false);
  const confirmationTimeoutRef = useRef<number | null>(null);

  const faucetId = useMemo(
    () => AccountId.fromHex(MIDEN_FAUCET_CONTRACT_ADDRESS as string),
    []
  );

  const destinationAccountId = useMemo(
    () => AccountId.fromHex(MIDEN_ID_CONTRACT_ADDRESS as string),
    []
  );

  // Clear timeout helper
  const clearConfirmationTimeout = useCallback(() => {
    if (confirmationTimeoutRef.current) {
      clearTimeout(confirmationTimeoutRef.current);
      confirmationTimeoutRef.current = null;
    }
  }, []);

  // Reset all state
  const resetState = useCallback(() => {
    setCurrentStep("registration");
    setIsPurchasing(false);
    setSelectedTier(null);
    setTransactionFailure(null);
  }, []);

  // Watch for domain confirmation
  useEffect(() => {
    if (currentStep === "processing" && confirmedDomains.get(domain) === true) {
      clearConfirmationTimeout();
      setCurrentStep("confirmed");
      registrationSuccessfulRef.current = true;
    }
  }, [confirmedDomains, domain, currentStep, clearConfirmationTimeout]);

  // Handle modal close
  useEffect(() => {
    if (!open) {
      clearConfirmationTimeout();

      const timer = setTimeout(() => {
        if (registrationSuccessfulRef.current) {
          onRegistrationComplete();
          registrationSuccessfulRef.current = false;
        }
        resetState();
      }, MODAL_CLOSE_ANIMATION_MS);

      return () => clearTimeout(timer);
    }
  }, [open, onRegistrationComplete, clearConfirmationTimeout, resetState]);

  // Reset when domain changes
  useEffect(() => {
    resetState();
  }, [domain, resetState]);

  // Show toast on transaction failure
  useEffect(() => {
    if (transactionFailure) {
      const causeMap = {
        [TransactionFailureReason.INSUFFICIENT_BALANCE]: ToastCause.INSUFFICIENT_BALANCE,
        [TransactionFailureReason.TRANSACTION_ERROR]: ToastCause.TRANSACTION_ERROR,
      };
      showToast(causeMap[transactionFailure.reason]);
    }
  }, [transactionFailure, showToast]);

  const handlePurchase = useCallback(async (tier: PricingTier) => {
    if (!connected || !accountId || !requestTransaction) return;

    setTransactionFailure(null);
    setIsPurchasing(true);
    setSelectedTier(tier);

    try {
      const clientSingleton = getMidenClient();
      await clientSingleton.importAccount(accountId);
      await clientSingleton.importAccount(destinationAccountId);

      const client = await clientSingleton.getClient();
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
        ])
      );

      const { noteId, blockNumber } = await transactionCreator({
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
      });

      showToast(ToastCause.TRANSACTION_SUBMITTED);
      setCurrentStep("processing");

      addPendingTransaction({
        domain: domain,
        noteId: noteId,
        accountId: accountId.toString(),
        bech32: bech32!,
        blockNumber: blockNumber || 0,
      });

      // Set confirmation timeout
      confirmationTimeoutRef.current = window.setTimeout(() => {
        setTransactionFailure({
          reason: TransactionFailureReason.TRANSACTION_ERROR,
          id: Date.now()
        });
        setCurrentStep("registration");
        confirmationTimeoutRef.current = null;
      }, CONFIRMATION_TIMEOUT_MS);

    } catch (error) {
      setTransactionFailure({
        reason: TransactionFailureReason.TRANSACTION_ERROR,
        id: Date.now()
      });
      setCurrentStep("registration");
    } finally {
      setIsPurchasing(false);
    }
  }, [
    connected,
    accountId,
    requestTransaction,
    destinationAccountId,
    faucetId,
    domain,
    bech32,
    addPendingTransaction,
    showToast
  ]);

  const handleGoHome = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  return {
    currentStep,
    isPurchasing,
    selectedTier,
    connected,
    handlePurchase,
    handleGoHome,
  };
}
