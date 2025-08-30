import { Sidebar } from './Sidebar'
import { useAuthStore } from '@/store/auth'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
  const { isAuthenticated, isInitialized } = useAuthStore()

  // Don't show sidebar until auth state is initialized and user is authenticated
  if (!isInitialized || !isAuthenticated) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-64">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}