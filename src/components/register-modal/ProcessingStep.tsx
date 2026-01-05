"use client";

import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface ProcessingStepProps {
  domain: string;
}

export function ProcessingStep({ domain }: ProcessingStepProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-12">
      {/* Animated Loader */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <Loader2 className="h-20 w-20 text-primary" />
      </motion.div>

      {/* Title */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl md:text-3xl font-bold text-neutral-800 dark:text-neutral-200">
          Announcing to Miden
        </h2>
        <p className="text-muted-foreground text-sm md:text-base">
          Please confirm the transaction in your wallet popup
        </p>
      </div>

      {/* Domain Display */}
      <div className="text-center">
        <div className="text-3xl md:text-4xl font-bold text-primary break-all">
          {domain}<span className="whitespace-nowrap">.miden</span>
        </div>
      </div>

      {/* Animated Dots */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-3 h-3 bg-primary rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </div>
    </div>
  );
}
