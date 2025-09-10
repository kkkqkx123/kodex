import { useCallback, useEffect, useState } from 'react'
import { verifyApiKey } from '../services/claude'
import { getAnthropicApiKey } from '../utils/config'

export type VerificationStatus =
  | 'loading'
  | 'valid'
  | 'invalid'
  | 'missing'
  | 'error'

export type ApiKeyVerificationResult = {
  status: VerificationStatus
  reverify: () => Promise<void>
  error: Error | null
}

/**
 * Check if the API key is a default/demo key
 * Default keys typically start with "sk-ant-" and are used for demos or testing
 */
function isDefaultApiKey(apiKey: string | null): boolean {
  if (!apiKey) return false
  // Check if it's a default/demo key pattern
  return apiKey.startsWith('sk-ant-') && apiKey.length <= 20
}

export function useApiKeyVerification(): ApiKeyVerificationResult {
  const [status, setStatus] = useState<VerificationStatus>(() => {
    const apiKey = getAnthropicApiKey()
    return apiKey ? 'loading' : 'missing'
  })
  const [error, setError] = useState<Error | null>(null)

  const verify = useCallback(async (): Promise<void> => {
    // Reset error state on each verification attempt
    setError(null)
    
    // If it's a default API key, consider it valid without verification
    const apiKey = getAnthropicApiKey()
    if (isDefaultApiKey(apiKey)) {
      setStatus('valid')
      return
    }

    // If no API key is provided, mark as missing
    if (!apiKey) {
      setStatus('missing')
      return
    }

    try {
      setStatus('loading')
      const isValid = await verifyApiKey(apiKey)
      setStatus(isValid ? 'valid' : 'invalid')
    } catch (err) {
      // This happens when there's an error response from the API but it's not an invalid API key error
      // In this case, we still mark the API key as invalid - but we also log the error so we can
      // display it to the user to be more helpful
      setError(err as Error)
      setStatus('error')
    }
  }, [])

  // Verify the API key on initial load
  useEffect(() => {
    verify()
  }, [verify])

  // Provide a reverify function that can be called to recheck the API key
  const reverify = useCallback(async (): Promise<void> => {
    await verify()
  }, [verify])

  return {
    status,
    reverify,
    error,
  }
}
