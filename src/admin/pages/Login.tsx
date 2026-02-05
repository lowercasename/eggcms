import { useState } from 'react'
import { useLocation } from 'wouter'
import { useAuth } from '../context/AuthContext'
import { Card, Heading, Alert, Input, Label, Button } from '../components/ui'
import { Layers } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const [, navigate] = useLocation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E5644E] flex items-center justify-center shadow-sm">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#1A1A18]">EggCMS</span>
          </div>
        </div>

        <Card className="p-8">
          <h2 className="text-lg font-semibold text-[#1A1A18] mb-1">Welcome back</h2>
          <p className="text-sm text-[#9C9C91] mb-6">Sign in to your account to continue</p>

          {error && <Alert variant="error" className="mb-4">{error}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Sign in
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-[#9C9C91] mt-6">
          Lightweight, schema-driven content management
        </p>
      </div>
    </div>
  )
}
