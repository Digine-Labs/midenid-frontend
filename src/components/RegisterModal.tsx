"use client";

import {
  Modal,
  ModalBody,
  ModalContent,
  useModal,
} from "@/components/ui/shadcn-io/animated-modal";
import { type ReactNode, useState } from "react";
import { cloneElement, isValidElement } from "react";
import { TermsModal } from "@/components/TermsModal";
import { AnimatePresence, motion } from "framer-motion";
import { RegistrationStep } from "./register-modal/RegistrationStep";
import { ProcessingStep } from "./register-modal/ProcessingStep";
import { ConfirmedStep } from "./register-modal/ConfirmedStep";
import { useRegistration } from "@/hooks/useRegistration";

interface RegisterModalProps {
  domain: string;
  trigger: ReactNode;
}

function RegisterModalTrigger({ children }: { children: ReactNode }) {
  const { setOpen } = useModal();

  if (isValidElement(children)) {
    return cloneElement(children as React.ReactElement<any>, {
      onClick: () => setOpen(true),
    });
  }

  return <div onClick={() => setOpen(true)}>{children}</div>;
}

function RegisterModalContent({ domain }: { domain: string }) {
  const { open, setOpen } = useModal();
  const [termsOpen, setTermsOpen] = useState(false);

  const {
    currentStep,
    isPurchasing,
    selectedTier,
    connected,
    handlePurchase,
  } = useRegistration({ domain, open, setOpen });

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
                <ConfirmedStep domain={domain} />
              </motion.div>
            )}
          </AnimatePresence>
        </ModalContent>
      </ModalBody>
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
