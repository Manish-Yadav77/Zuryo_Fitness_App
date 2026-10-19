import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { roleHome } from '@/config/nav'
import type { Role } from '@/types/auth'

/**
 * Blocks pages for logged-out users. Pass `roles` to also restrict by role.
 * Example: <ProtectedRoute roles={['admin']} />
 */
export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <FullPageSpinner label="Checking your session..." />
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to={roleHome[user.role]} replace />

  return <Outlet />
}