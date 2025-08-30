import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth'
import { LogOut, BarChart3 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!isAuthenticated) return null

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link 
            to="/dashboard" 
            className="flex items-center space-x-2 text-xl font-bold"
          >
            <BarChart3 className="h-6 w-6" />
            <span>Dashboard</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link to="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link to="/upload">
              <Button variant="ghost">Upload Data</Button>
            </Link>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                Welcome, {user?.username}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="flex items-center space-x-1"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}