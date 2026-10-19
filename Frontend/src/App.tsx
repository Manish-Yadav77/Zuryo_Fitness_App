import { AuthProvider } from '@/context/AuthProvider'
import { AppRoutes } from '@/routes/AppRoutes'

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}