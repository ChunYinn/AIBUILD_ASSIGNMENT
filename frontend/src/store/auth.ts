import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@/types'
import { api } from '@/lib/api'
import { toast } from '@/hooks/use-toast'

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isInitialized: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  register: (username: string, password: string) => Promise<boolean>
  initializeAuth: () => Promise<void>
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitialized: false,

      login: async (username: string, password: string) => {
        try {
          const response = await api.post('/auth/login', { username, password })
          const { user, token } = response.data
          
          // Save token for future API calls
          localStorage.setItem('auth_token', token.accessToken)
          
          set({ user, token: token.accessToken, isAuthenticated: true })
          
          toast({
            title: "Welcome back!",
            description: `Successfully logged in as ${user.username}`,
            variant: "success",
          })
          
          return true
        } catch (error: any) {
          console.error('Login failed:', error)
          
          toast({
            title: "Login failed",
            description: error.response?.data?.detail || "Invalid username or password",
            variant: "destructive",
          })
          
          return false
        }
      },

      logout: () => {
        localStorage.removeItem('auth_token')
        set({ user: null, token: null, isAuthenticated: false })
        
        toast({
          title: "Logged out",
          description: "Successfully logged out",
          variant: "default",
        })
      },

      register: async (username: string, password: string) => {
        try {
          const response = await api.post('/auth/register', { username, password })
          const user = response.data
          
          toast({
            title: "Account created!",
            description: `Welcome ${user.username}! Logging you in...`,
            variant: "success",
          })
          
          // Auto-login after successful registration
          return await get().login(username, password)
        } catch (error: any) {
          console.error('Registration failed:', error)
          
          toast({
            title: "Registration failed",
            description: error.response?.data?.detail || "Failed to create account",
            variant: "destructive",
          })
          
          return false
        }
      },

      initializeAuth: async () => {
        const token = localStorage.getItem('auth_token')
        
        if (!token) {
          set({ isAuthenticated: false, user: null, token: null, isInitialized: true })
          return
        }
        
        try {
          // Validate token by making a request to a protected endpoint
          const response = await api.get('/auth/me')
          const user = response.data
          
          set({ user, token, isAuthenticated: true, isInitialized: true })
        } catch (error) {
          // Token is invalid or expired
          localStorage.removeItem('auth_token')
          set({ user: null, token: null, isAuthenticated: false, isInitialized: true })
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
)