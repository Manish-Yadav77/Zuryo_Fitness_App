import { LayoutDashboard } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Role } from '@/types/auth'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
}

export const roleHome: Record<Role, string> = {
  customer: '/customer',
  trainer: '/trainer',
  admin: '/admin',
}

// Each phase adds its pages to the right role here. Phase 0 only has dashboards.
export const navByRole: Record<Role, NavItem[]> = {
  customer: [{ label: 'Dashboard', to: '/customer', icon: LayoutDashboard }],
  trainer: [{ label: 'Dashboard', to: '/trainer', icon: LayoutDashboard }],
  admin: [{ label: 'Dashboard', to: '/admin', icon: LayoutDashboard }],
}

export const roleLabel: Record<Role, string> = {
  customer: 'Customer',
  trainer: 'Trainer',
  admin: 'Admin',
}
