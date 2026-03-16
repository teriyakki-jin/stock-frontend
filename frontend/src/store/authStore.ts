import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  accessToken: string | null
  accountId: number | null
  isAuthenticated: boolean
  setTokens: (accessToken: string) => void
  setAccountId: (id: number) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      accountId: null,
      isAuthenticated: false,
      setTokens: (accessToken) =>
        set({ accessToken, isAuthenticated: true }),
      setAccountId: (id) => set({ accountId: id }),
      logout: () =>
        set({ accessToken: null, accountId: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        accountId: state.accountId,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
