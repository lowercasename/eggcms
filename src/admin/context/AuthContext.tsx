// src/admin/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { api } from '../lib/api'

interface AuthContextType {
  user: { email: string } | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ email: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Check if already logged in by calling /auth/me
    api.me()
      .then((result) => {
        if (mounted) setUser(result.data)
      })
      .catch(() => {
        if (mounted) setUser(null)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => { mounted = false }
  }, [])

  const login = async (email: string, password: string) => {
    const result = await api.login(email, password)
    setUser(result.data)
  }

  const logout = async () => {
    try {
      await api.logout()
    } finally {
      setUser(null)  // Clear state regardless of API result
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
