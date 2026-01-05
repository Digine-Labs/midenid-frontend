"use client";

import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface ConfirmedStepProps {
  domain: string;
  noteId: string | null;
  onGoHome: () => void;
}

export function ConfirmedStep({ domain, noteId }: ConfirmedStepProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-12">
      {/* Success Icon with Animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 15
        }}
      >
        <CheckCircle2 className="h-20 w-20 text-green-500" />
      </motion.div>

      {/* Title */}
      <div className="text-center space-y-3">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl md:text-3xl font-bold text-neutral-800 dark:text-neutral-200"
        >
          Transaction Sent!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground text-sm md:text-base"
        >
          Your domain will be registered once the transaction note is consumed
        </motion.p>
      </div>

      {/* Transaction Status Link */}
      {noteId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <a
            href={`https://testnet.midenscan.com/note/${noteId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            View transaction status on MidenScan →
          </a>
        </motion.div>
      )}
    </div>
  );
}
