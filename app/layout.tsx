import type { Metadata, Viewport } from 'next'
import './globals.css'
import SiteChrome from '@/components/SiteChrome'
import ToastProvider from '@/components/ToastProvider'
import { AuthProvider } from '@/contexts/AuthContext'

export const metadata: Metadata = {
  title: 'UNICASH — Premium Australian Membership rewards',
  description: 'Earn Points from eligible receipts, top up with Point Boosters, and access member-only Bonus Draws. A premium Australian Membership rewards platform.',
}

/**
 * Viewport — 2026-05-18 iOS Safari auto-zoom fix layer 2.
 *
 * `maximumScale: 1` defangs iOS Safari's auto-zoom on input focus across
 * any form field the globals.css rule might miss (e.g. shadow-DOM widgets,
 * Stripe Elements). We deliberately leave `userScalable` undefined so iOS
 * still honours accessibility pinch-zoom (Apple ignores `user-scalable=no`
 * on iOS 10+ regardless, but we don't want to set the wrong signal either).
 *
 * `width=device-width, initial-scale=1` is the Next.js default — restated
 * here so future devs see the full viewport contract in one place.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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
