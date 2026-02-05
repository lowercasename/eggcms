// src/admin/App.tsx
import { useState, useEffect, createContext, useContext } from 'react'
import { Switch, Route, Redirect } from 'wouter'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Collection from './pages/Collection'
import Singleton from './pages/Singleton'
import Media from './pages/Media'
import { api } from './lib/api'
import type { Schema } from './types'
import { Loader2 } from 'lucide-react'

// Context for sharing schemas across the app
interface SchemasContextValue {
  schemas: Schema[]
}

const SchemasContext = createContext<SchemasContextValue>({ schemas: [] })

export function useSchemas() {
  return useContext(SchemasContext)
}

function AppRoutes() {
  const { user, loading: authLoading } = useAuth()
  const [schemas, setSchemas] = useState<Schema[]>([])
  const [schemasLoading, setSchemasLoading] = useState(true)

  useEffect(() => {
    if (user) {
      api.getSchemas()
        .then((res) => setSchemas(res.data as Schema[]))
        .catch(console.error)
        .finally(() => setSchemasLoading(false))
    } else if (!authLoading) {
      setSchemasLoading(false)
    }
  }, [user, authLoading])

  if (authLoading || (user && schemasLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
        <div className="flex items-center gap-2 text-[#9C9C91]">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    )
  }

  const firstCollection = schemas.find(s => s.type === 'collection')?.name || ''

  return (
    <SchemasContext.Provider value={{ schemas }}>
      <Switch>
        <Route path="/login" component={Login} />

        {/* Protected routes wrapped in Layout */}
        <Route>
          {user ? (
            <Layout schemas={schemas}>
              <Switch>
                <Route path="/" component={() => (
                  <Redirect to={firstCollection ? `/collections/${firstCollection}` : '/media'} />
                )} />
                <Route path="/collections/:schema/:id?" component={Collection} />
                <Route path="/singletons/:schema" component={Singleton} />
                <Route path="/media" component={Media} />
                <Route component={() => <Redirect to="/" />} />
              </Switch>
            </Layout>
          ) : (
            <Redirect to="/login" />
          )}
        </Route>
      </Switch>
    </SchemasContext.Provider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
