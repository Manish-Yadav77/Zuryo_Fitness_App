import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import axios from 'axios'
import { authApi } from '@/api/auth.api'
import { AUTH_LOGOUT_EVENT } from '@/api/client'
import { tokenStorage } from '@/lib/storage'
import { AuthContext } from './auth-context'
import type { AuthContextValue } from './auth-context'
import type { LoginInput, SignupInput, User } from '@/types/auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  // If a token is saved we must verify it before deciding "logged in or not".
  const [isLoading, setIsLoading] = useState<boolean>(() => tokenStorage.get() !== null)

  // 1) On first load: restore the session from the saved token.
  useEffect(() => {
    if (tokenStorage.get() === null) return
    let cancelled = false

    authApi
      .me()
      .then((u) => {
        if (!cancelled) setUser(u)
      })
      .catch((err: unknown) => {
        // Only throw the token away if the server says it is invalid.
        // A network error (server asleep) must not log the user out.
        if (axios.isAxiosError(err) && err.response?.status === 401) tokenStorage.clear()
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // 2) If any API call gets a 401 later, the axios client fires this event.
  useEffect(() => {
    const onForcedLogout = () => {
      tokenStorage.clear()
      setUser(null)
    }
    window.addEventListener(AUTH_LOGOUT_EVENT, onForcedLogout)
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, onForcedLogout)
  }, [])

  const login = useCallback(async (input: LoginInput) => {
    const { token, user: loggedIn } = await authApi.login(input)
    tokenStorage.set(token)
    setUser(loggedIn)
    return loggedIn
  }, [])

  const signup = useCallback(async (input: SignupInput) => {
    const { token, user: created } = await authApi.register(input)
    tokenStorage.set(token)
    setUser(created)
    return created
  }, [])

  const logout = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, isAuthenticated: user !== null, login, signup, logout }),
    [user, isLoading, login, signup, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}