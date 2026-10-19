import { api } from './client'
import type { AuthResponse, LoginInput, SignupInput, User } from '@/types/auth'

export const authApi = {
  async login(input: LoginInput): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', input)
    return data
  },
  async register(input: SignupInput): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', input)
    return data
  },
  async me(): Promise<User> {
    const { data } = await api.get<{ user: User }>('/auth/me')
    return data.user
  },
}