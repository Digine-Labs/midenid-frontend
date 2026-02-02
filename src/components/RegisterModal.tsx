import {
  Modal,
  ModalBody,
  ModalContent,
  useModal,
} from "@/components/ui/shadcn-io/animated-modal";
import { type ReactNode, useState, useEffect } from "react";
import { cloneElement, isValidElement } from "react";
import { useWallet } from "@demox-labs/miden-wallet-adapter";
import {
  MIDEN_FAUCET_CONTRACT_ADDRESS,
  MIDEN_ID_CONTRACT_ADDRESS,
} from "@/shared/constants";
import { AccountId, Felt } from "@miden-sdk/miden-sdk";
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
import { NoteInputs, MidenArrays } from "@miden-sdk/miden-sdk";
import { getDomainPrice } from "@/shared/pricing";
import { bech32ToAccountId, instantiateClient } from "@/lib/midenClient";
import { executeStep } from "@/utils/errorHandler";
import { ErrorCodes } from "@/types/errors";

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
  const { connected, requestTransaction, address } = useWallet();
  const { open } = useModal();
  const showToast = useToast();
  const [currentStep, setCurrentStep] = useState<ModalStep>("registration");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [termsOpen, setTermsOpen] = useState(false);

  const faucetId = AccountId.fromHex(MIDEN_FAUCET_CONTRACT_ADDRESS as string)

  const accountId = address ? bech32ToAccountId(address) : null

  const destinationAccountId = AccountId.fromHex(MIDEN_ID_CONTRACT_ADDRESS as string)

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      setCurrentStep("registration");
    }
  }, [open]);

  // Reset when domain changes
  useEffect(() => {
    setCurrentStep("registration");
    setIsPurchasing(false);
  }, [domain]);

  if (!accountId) return null;
  const handlePurchase = async () => {
    if (connected && accountId && requestTransaction) {
      setIsPurchasing(true);
      setCurrentStep("processing");
      try {
        const client = await executeStep(
          ErrorCodes.CLIENT_INIT_FAILED,
          'Client initialization',
          () => instantiateClient({ accountsToImport: [] })
        );

        const buyAmount = await executeStep(
          ErrorCodes.AMOUNT_CALCULATION_FAILED,
          'Buy amount calculation',
          () => BigInt(domainPrice * 1000000)
        );

        const domainWord = await executeStep(
          ErrorCodes.DOMAIN_ENCODING_FAILED,
          'Domain encoding',
          () => encodeDomain(domain)
        );

        console.log("buyAmount:", buyAmount.toString());

        const noteInputs = await executeStep(
          ErrorCodes.NOTE_INPUTS_CREATION_FAILED,
          'Note inputs creation',
          () => new NoteInputs(
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
          )
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
      } catch (error) {
        console.error("Transaction error:", error);
        showToast(ToastCause.TRANSACTION_ERROR)
        setCurrentStep("registration");
      } finally {
        setIsPurchasing(false);
      }
    }
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
                <ConfirmedStep noteId={noteId} />
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