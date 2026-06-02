import { useState, useEffect, useRef } from 'react'
import { useToast } from '@/hooks/useToast'
import { ToastCause } from '@/types/toast'
import { useMidenClient } from '@/contexts/MidenClientContext'

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
  const generationRef = useRef(0)
  const slowWarningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { checkDomainAvailable, isReady, error: clientError } = useMidenClient()

  useEffect(() => {
    if (!domain) {
      setStatus('idle')
      setAvailable(null)
      setError(null)
      warningShownRef.current = false
      return
    }

    if (clientError) {
      setStatus('error')
      setAvailable(null)
      setError(clientError.message)
      return
    }

    if (!isReady) {
      setStatus('loading')
      setAvailable(null)
      setError(null)
      return
    }

    const generation = ++generationRef.current

    setStatus('loading')
    setAvailable(null)
    setError(null)
    warningShownRef.current = false

    if (slowWarningTimerRef.current) {
      clearTimeout(slowWarningTimerRef.current)
    }

    slowWarningTimerRef.current = setTimeout(() => {
      if (!warningShownRef.current && generationRef.current === generation) {
        showToast(ToastCause.DOMAIN_CHECK_SLOW)
        warningShownRef.current = true
      }
    }, 10000)

    const checkDomain = async () => {
      try {
        const result = await checkDomainAvailable(domain)

        if (generationRef.current !== generation) return

        if (slowWarningTimerRef.current) {
          clearTimeout(slowWarningTimerRef.current)
          slowWarningTimerRef.current = null
        }

        setAvailable(result)
        setStatus('success')
        setError(null)
      } catch (err) {
        if (generationRef.current !== generation) return

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
    }
  }, [domain, isReady, clientError, checkDomainAvailable, showToast])

  return {
    available,
    loading: status === 'loading',
    error,
  }
}
