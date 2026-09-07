// src/admin/pages/Login.tsx
import { useState } from 'react'
import { useLocation } from 'wouter'
import { Egg } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { errorMessage } from '../lib/errors'
import { Card, Alert, Input, Label, Button } from '../components/ui'

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
      setError(errorMessage(err, 'Sign in failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-page p-6">
      <div className="w-full max-w-[420px]">
        <div className="flex justify-center items-center gap-3 mb-7">
          <div className="w-10 h-10 rounded-button bg-action flex items-center justify-center" aria-hidden>
            <Egg className="w-6 h-6 text-white" />
          </div>
          <span className="text-[24px] font-bold text-ink">EggCMS</span>
        </div>

        <Card className="p-7">
          <h1 className="m-0 mb-1 text-[19px] font-bold text-ink">Sign in</h1>
          <p className="m-0 mb-6 text-[15px] text-ink-2">Use the email and password you were given.</p>

          {error && (
            <Alert variant="error" className="mb-5">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="login-email">Email</Label>
              <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="login-password">Password</Label>
              <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
            </div>
            <Button type="submit" loading={loading} fullWidth>
              Sign in
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
