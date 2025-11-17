"use client";

import { useNavigate, useLocation } from 'react-router'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { AccountId } from '@demox-labs/miden-sdk'
import { motion, AnimatePresence } from 'framer-motion'
import { BackgroundGradient } from '@/components/ui/shadcn-io/background-gradient'

interface LocationState {
    domain: string
    years: number
    price: string
    noteId: string
    accountId: AccountId
}

export default function Receipt() {
    const navigate = useNavigate()
    const location = useLocation()
    const state = location.state as LocationState | null
    const [isConfirmed, setIsConfirmed] = useState(false)

    useEffect(() => {
        // Redirect to home if required state is missing
        if (!state || !state.domain || !state.years || !state.price || !state.accountId) {
            navigate('/', { replace: true })
        }
    }, [state, navigate])

    useEffect(() => {
        // Show confirmation after 5 seconds
        const timer = setTimeout(() => {
            setIsConfirmed(true)
        }, 5000)

        return () => clearTimeout(timer)
    }, [])

    if (!state || !state.domain || !state.years || !state.price || !state.accountId) {
        return null
    }

    const { domain } = state

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-background">
            <div className="w-full max-w-md md:max-w-lg">
                <AnimatePresence mode="wait">
                    {!isConfirmed ? (
                        <motion.div
                            key="sending"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                        >
                            <BackgroundGradient
                                containerClassName="w-full rounded-3xl"
                                className="w-full rounded-3xl"
                            >
                                <div className="bg-white dark:bg-neutral-950 rounded-3xl p-8 md:p-12">
                                    {/* Sending Animation */}
                                    <div className="flex flex-col items-center justify-center space-y-8">
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
                                                Sending to Blockchain
                                            </h2>
                                            <p className="text-muted-foreground text-sm md:text-base">
                                                Your transaction is being processed...
                                            </p>
                                        </div>

                                        {/* Domain Display */}
                                        <div className="text-center">
                                            <p className="text-sm text-muted-foreground mb-2">
                                                Registering:
                                            </p>
                                            <div className="text-3xl md:text-4xl font-bold text-primary">
                                                {domain}.miden
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
                                </div>
                            </BackgroundGradient>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="confirmed"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <BackgroundGradient
                                containerClassName="w-full rounded-3xl"
                                className="w-full rounded-3xl"
                            >
                                <div className="bg-white dark:bg-neutral-950 rounded-3xl p-8 md:p-12">
                                    {/* Confirmed State */}
                                    <div className="flex flex-col items-center justify-center space-y-8">
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

                                        {/* Action Button */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.5 }}
                                            className="w-full pt-4"
                                        >
                                            <Button
                                                className="w-full px-8 py-6 text-lg"
                                                onClick={() => navigate('/')}
                                            >
                                                Go to Home Page
                                            </Button>
                                        </motion.div>
                                    </div>
                                </div>
                            </BackgroundGradient>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}