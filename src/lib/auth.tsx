import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase } from './supabase'

async function ensureUserId(): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession()
  if (sessionData.session) return sessionData.session.user.id
  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) throw error
  if (!data.user) throw new Error('Anonymous sign-in returned no user')
  return data.user.id
}

const AuthContext = createContext<string | null>(null)

export function useUserId(): string {
  const uid = useContext(AuthContext)
  if (!uid) throw new Error('useUserId must be used inside AuthProvider')
  return uid
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ensureUserId()
      .then(setUserId)
      .catch((e: Error) => setError(e.message))
  }, [])

  if (error) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
        <span className="text-4xl">😵</span>
        <h1 className="text-lg font-bold">Couldn't connect</h1>
        <p className="text-sm text-slate-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <span className="animate-bounce text-4xl">🎲</span>
      </div>
    )
  }

  return <AuthContext.Provider value={userId}>{children}</AuthContext.Provider>
}
