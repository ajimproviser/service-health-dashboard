import { useCallback, useEffect, useState } from 'react'

export interface AsyncState<T> {
  data: T | null
  error: Error | null
  loading: boolean
  reload: () => void
}

/**
 * Runs an async loader whenever `deps` change and cancels the previous call with an AbortSignal,
 * so a slow response for an old time range can never overwrite a newer one.
 */
export function useAsync<T>(
  loader: (signal: AbortSignal) => Promise<T>,
  deps: readonly unknown[],
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(true)
  const [reloadToken, setReloadToken] = useState(0)

  const reload = useCallback(() => setReloadToken((token) => token + 1), [])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    loader(controller.signal)
      .then((result) => {
        setData(result)
        setLoading(false)
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return
        setError(caught instanceof Error ? caught : new Error(String(caught)))
        setLoading(false)
      })
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadToken])

  return { data, error, loading, reload }
}
