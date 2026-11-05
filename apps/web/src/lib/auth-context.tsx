/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { api, init, type UserRow, type AuthResult } from '@open-polityra/api-client'

interface AuthState {
  user: Omit<UserRow, 'password_hash' | 'created_at' | 'updated_at'> & Partial<Pick<UserRow, 'created_at' | 'updated_at'>> | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<AuthResult>
  register: (email: string, password: string, name?: string, role?: string) => Promise<{ user: AuthState['user'] extends infer U | null ? U : never }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const Context = createContext<AuthContextValue | null>(null)

const TOKEN_KEY = 'polityra_token'
const USER_KEY = 'polityra_user'

function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}

function getUser(): Omit<UserRow, 'password_hash'> | null {
  try { const raw = localStorage.getItem(USER_KEY); return raw ? JSON.parse(raw) : null } catch { return null }
}

function persist(token: string, user: Pick<UserRow, 'id' | 'email' | 'name' | 'role' | 'is_active'>): void {
  const safeUser = { ...user } as Partial<UserRow> & { password_hash?: unknown }
  delete safeUser.password_hash
  try { localStorage.setItem(TOKEN_KEY, token); localStorage.setItem(USER_KEY, JSON.stringify(safeUser)) } catch {}
}

function clear(): void {
  try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY) } catch {}
  init({ token: undefined })
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, token: null, isAuthenticated: false, isLoading: true })

  const handleUnauthorized = useCallback(() => {
    clear()
    setState({ user: null, token: null, isAuthenticated: false, isLoading: false })
  }, [])

  useEffect(() => {
    init({ onUnauthorized: handleUnauthorized })
    const token = getToken()
    const user = getUser()
    if (token && user) {
      init({ token })
      setState({ user, token, isAuthenticated: true, isLoading: false })
    } else {
      setState(s => ({ ...s, isLoading: false }))
    }
  }, [handleUnauthorized])

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const result = await api.auth.login({ email, password })
    persist(result.token, result.user)
    init({ token: result.token })
    setState({ user: result.user, token: result.token, isAuthenticated: true, isLoading: false })
    return result
  }, [])

  const register = useCallback(async (email: string, password: string, name?: string, role?: string): Promise<{ user: Omit<UserRow, 'password_hash'> }> => {
    const result = await api.auth.register({ email, password, name, role: role as any })
    // Auto-login after registration
    const authResult = await api.auth.login({ email, password })
    persist(authResult.token, authResult.user)
    init({ token: authResult.token })
    setState({ user: authResult.user, token: authResult.token, isAuthenticated: true, isLoading: false })
    return { user: result.user }
  }, [])

  const logout = useCallback(async () => {
    try { await api.auth.logout() } catch {}
    clear()
    setState({ user: null, token: null, isAuthenticated: false, isLoading: false })
  }, [])

  const refreshUser = useCallback(async () => {
    const token = getToken()
    if (!token) { clear(); setState(s => ({ ...s, user: null, token: null, isAuthenticated: false })); return }
    try {
      const current = getUser()
      if (current) {
        const result = await api.users.byId(current.id)
        const user = result.user
        persist(token, user)
        setState({ user, token, isAuthenticated: true, isLoading: false })
      } else { clear(); setState(s => ({ ...s, user: null, token: null, isAuthenticated: false })) }
    } catch { clear(); setState(s => ({ ...s, user: null, token: null, isAuthenticated: false })) }
  }, [])

  return (
    <Context.Provider value={{ ...state, login, register, logout, refreshUser }}>
      {children}
    </Context.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
