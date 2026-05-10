import { useState } from 'react'
import { authClient } from './auth-client.ts'

type Mode = 'login' | 'signup'

export default function App() {
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (mode === 'login') {
      const { error } = await authClient.signIn.email({ email, password })
      if (error) setError(error.message ?? 'Login failed')
    } else {
      const { error } = await authClient.signUp.email({ email, password, name })
      if (error) setError(error.message ?? 'Signup failed')
    }

    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 300 }}>
        <h2 style={{ margin: 0 }}>{mode === 'login' ? 'Login' : 'Sign up'}</h2>

        {mode === 'signup' && (
          <input
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        {error && <p style={{ color: 'red', margin: 0 }}>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Sign up'}
        </button>

        <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null) }}>
          {mode === 'login' ? 'No account? Sign up' : 'Have an account? Login'}
        </button>
      </form>
    </div>
  )
}
