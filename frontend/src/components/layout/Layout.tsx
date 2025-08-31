import { Sidebar } from './Sidebar'
import { useAuthStore } from '@/store/auth'
import { useLocation } from 'react-router-dom'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
  const { isAuthenticated, isInitialized } = useAuthStore()
  const location = useLocation()

  // Pages that should not show the sidebar even when authenticated
  const noSidebarPages = ['/login', '/register']
  const shouldShowSidebar = isAuthenticated && isInitialized && !noSidebarPages.includes(location.pathname)

  if (!shouldShowSidebar) {
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