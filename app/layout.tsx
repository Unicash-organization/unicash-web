import type { Metadata } from 'next'
import './globals.css'
import SiteChrome from '@/components/SiteChrome'
import ToastProvider from '@/components/ToastProvider'
import { AuthProvider } from '@/contexts/AuthContext'

export const metadata: Metadata = {
  title: 'UNICASH — Premium Australian Membership rewards',
  description: 'Earn Points from eligible receipts, top up with Point Boosters, and access member-only Bonus Draws. A premium Australian Membership rewards platform.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-AU">
      <body className="min-h-screen bg-white text-[#0f1222]">
        <AuthProvider>
          {/* SiteChrome conditionally renders PromoBanner + Header + Footer + ScrollToTop
              for normal pages, and bare-main for focused flows like /checkout. */}
          <SiteChrome>{children}</SiteChrome>
          {/* Custom v4-branded toast system — replaces SweetAlert2.
              Mounted once at root; subscribes to events from showToast(). */}
          <ToastProvider />
        </AuthProvider>
      </body>
    </html>
  )
}
