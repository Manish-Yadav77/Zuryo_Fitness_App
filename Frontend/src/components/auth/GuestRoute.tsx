import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { roleHome } from '@/config/nav'

/** For /login and /signup: if you are already logged in, go to your dashboard instead. */
export function GuestRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <FullPageSpinner label="Checking your session..." />
  if (user) return <Navigate to={roleHome[user.role]} replace />

  return <Outlet />
}