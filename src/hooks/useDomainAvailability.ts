import { useState, useEffect, useRef } from 'react'
import { useToast } from '@/hooks/useToast'
import { ToastCause } from '@/types/toast'
import { encodeDomain } from '@/utils/encode'
import { MIDEN_ID_CONTRACT_ADDRESS } from '@/shared/constants'
import {
  AccountId,
  AccountStorageRequirements,
  Endpoint,
  RpcClient,
  SlotAndKeys,
} from '@miden-sdk/miden-sdk'

const DOMAIN_TO_OWNER_SLOT = 'naming::domain_to_owner'

type Status = 'idle' | 'loading' | 'success' | 'error'

interface UseDomainAvailabilityResult {
  available: boolean | null
  loading: boolean
  error: string | null
}

export function useDomainAvailability(domain: string): UseDomainAvailabilityResult {
  const [status, setStatus] = useState<Status>('idle')
  const [available, setAvailable] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const showToast = useToast()
  const warningShownRef = useRef(false)
  const abortedRef = useRef(false)
  const slowWarningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!domain) {
      setStatus('idle')
      setAvailable(null)
      setError(null)
      warningShownRef.current = false
      return
    }

    abortedRef.current = false
    setStatus('loading')
    setAvailable(null)
    setError(null)
    warningShownRef.current = false

    if (slowWarningTimerRef.current) {
      clearTimeout(slowWarningTimerRef.current)
    }

    slowWarningTimerRef.current = setTimeout(() => {
      if (!warningShownRef.current) {
        showToast(ToastCause.DOMAIN_CHECK_SLOW)
        warningShownRef.current = true
      }
    }, 10000)

    const checkDomain = async () => {
      try {
        const encodedDomain = encodeDomain(domain)
        const contractId = AccountId.fromHex(MIDEN_ID_CONTRACT_ADDRESS as string)

        const requirements = AccountStorageRequirements.fromSlotAndKeysArray([
          new SlotAndKeys(DOMAIN_TO_OWNER_SLOT, [encodedDomain]),
        ])

        console.log(requirements)

        const rpc = new RpcClient(Endpoint.testnet())
        const proof = await rpc.getAccountProof(contractId, requirements)

        console.log(proof)

        if (abortedRef.current) return

        if (slowWarningTimerRef.current) {
          clearTimeout(slowWarningTimerRef.current)
          slowWarningTimerRef.current = null
        }
        console.log("adasdas", encodedDomain)

        const domainHex = encodedDomain.toHex()


        const entries = proof.getStorageMapEntries("naming::domain_to_owner")

        console.log("111", entries)


        const ownerEntry = entries?.find(e => e.key().toHex() === domainHex)
        const ownerWord = ownerEntry?.value()

        console.log(encodedDomain)
        console.log(ownerWord)

        // Domain is available when owner entry is absent or all-zero (unregistered)
        const isAvailable = !ownerWord || ownerWord.toFelts().every(f => f.asInt() === 0n)

        setAvailable(isAvailable)
        setStatus('success')
        setError(null)
      } catch (err) {
        if (abortedRef.current) return

        if (slowWarningTimerRef.current) {
          clearTimeout(slowWarningTimerRef.current)
          slowWarningTimerRef.current = null
        }

        setAvailable(null)
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
        showToast(ToastCause.DOMAIN_CHECK_FAILED)
      }
    }

    checkDomain()

    return () => {
      abortedRef.current = true
      if (slowWarningTimerRef.current) {
        clearTimeout(slowWarningTimerRef.current)
        slowWarningTimerRef.current = null
      }
    }
  }, [domain, showToast])

  return {
    available,
    loading: status === 'loading',
    error,
  }
}
