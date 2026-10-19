export type Role = 'customer' | 'trainer' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  createdAt: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface LoginInput {
  email: string
  password: string
}

export interface SignupInput {
  name: string
  email: string
  password: string
}