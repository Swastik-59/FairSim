import { useState, useCallback } from 'react'
import { AxiosError } from 'axios'

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApiCall<T>() {
  const [state, setState] = useState<ApiState<T>>({ data: null, loading: false, error: null })

  const call = useCallback(async (fn: () => Promise<T>) => {
    setState({ data: null, loading: true, error: null })
    try {
      const data = await fn()
      setState({ data, loading: false, error: null })
      return data
    } catch (e) {
      const error =
        e instanceof AxiosError
          ? (e.response?.data?.message as string | undefined) || (e.response?.data?.detail as string | undefined) || e.message
          : 'Something went wrong'
      setState({ data: null, loading: false, error })
      return null
    }
  }, [])

  return { ...state, call }
}
