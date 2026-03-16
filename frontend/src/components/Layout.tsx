import { ReactNode } from 'react'
import Navbar from './Navbar'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="scanline min-h-screen bg-terminal-bg">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6 animate-fade-in">
        {children}
      </main>
    </div>
  )
}
