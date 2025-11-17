"use client";

import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface ConfirmedStepProps {
  domain: string;
  onGoHome: () => void;
}

export function ConfirmedStep({ domain }: ConfirmedStepProps) {
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
          Transaction Confirmed!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground text-sm md:text-base"
        >
          Your domain has been successfully registered
        </motion.p>
      </div>

      {/* Domain Display */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center"
      >
        <p className="text-sm text-muted-foreground mb-2">
          Your new identity:
        </p>
        <div className="text-3xl md:text-4xl font-bold text-primary">
          {domain}.miden
        </div>
      </motion.div>
    </div>
  );
}
