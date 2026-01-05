import { useState, useEffect, useRef } from 'react'
import { checkDomainAvailability } from '@/api'
import { useToast } from '@/hooks/useToast'
import { ToastCause } from '@/types/toast'

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
  const abortControllerRef = useRef<AbortController | null>(null)
  const slowWarningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Reset state when domain is empty
    if (!domain) {
      setStatus('idle')
      setAvailable(null)
      setError(null)
      warningShownRef.current = false
      return
    }

    // Abort any in-flight request
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()

    // Reset for new check
    setStatus('loading')
    setAvailable(null)
    setError(null)
    warningShownRef.current = false

    // Clear any existing timer
    if (slowWarningTimerRef.current) {
      clearTimeout(slowWarningTimerRef.current)
    }

    // Start slow loading warning timer
    slowWarningTimerRef.current = setTimeout(() => {
      if (!warningShownRef.current) {
        showToast(ToastCause.DOMAIN_CHECK_SLOW)
        warningShownRef.current = true
      }
    }, 10000)

    const checkDomain = async () => {
      try {
        const result = await checkDomainAvailability(domain)

        // Check if request was aborted
        if (abortControllerRef.current?.signal.aborted) return

        // Clear the slow warning timer on completion
        if (slowWarningTimerRef.current) {
          clearTimeout(slowWarningTimerRef.current)
          slowWarningTimerRef.current = null
        }

        if (result.success && result.data) {
          setAvailable(result.data.available)
          setStatus('success')
          setError(null)
        } else {
          setAvailable(null)
          setStatus('error')
          setError(result.error || 'Failed to check domain availability')
          showToast(ToastCause.DOMAIN_CHECK_FAILED)
        }
      } catch (err) {
        if (abortControllerRef.current?.signal.aborted) return

        // Clear the slow warning timer on error
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
      if (slowWarningTimerRef.current) {
        clearTimeout(slowWarningTimerRef.current)
        slowWarningTimerRef.current = null
      }
      abortControllerRef.current?.abort()
    }
  }, [domain, showToast])

  return {
    available,
    loading: status === 'loading',
    error,
  }
}
