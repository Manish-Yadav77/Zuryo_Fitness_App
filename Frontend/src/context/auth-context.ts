import { createContext } from 'react'
import type { LoginInput, SignupInput, User } from '@/types/auth'

export interface AuthContextValue {
  user: User | null
  /** true while we check a saved token on first page load */
  isLoading: boolean
  isAuthenticated: boolean
  login: (input: LoginInput) => Promise<User>
  signup: (input: SignupInput) => Promise<User>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)