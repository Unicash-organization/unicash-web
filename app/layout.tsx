import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { AuthProvider } from '@/contexts/AuthContext'

export const metadata: Metadata = {
  title: 'UniCash - Fair rewards. Real winners.',
  description: 'Australia\'s first verified rewards platform built on transparency and fairness.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body className="min-h-screen bg-gray-50 overflow-x-hidden">
        <AuthProvider>
          <Header />
          <main className="overflow-x-hidden">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}

