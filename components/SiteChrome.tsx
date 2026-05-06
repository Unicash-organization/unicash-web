'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PromoBanner from '@/components/PromoBanner';
import ScrollToTop from '@/components/ScrollToTop';
import MobileBottomNav, { useBottomNavVisible } from '@/components/MobileBottomNav';

/* Routes where the global UNICASH chrome (PromoBanner, Header, Footer, ScrollToTop)
   should be hidden so the page can render its own focused layout (checkout, etc.). */
const HIDE_CHROME_PREFIXES = ['/checkout'];

function shouldHideChrome(pathname: string | null): boolean {
  if (!pathname) return false;
  return HIDE_CHROME_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideChrome = shouldHideChrome(pathname);
  const bottomNavVisible = useBottomNavVisible();

  // /checkout etc. — bare main, no chrome at all (focused flow)
  if (hideChrome) {
    return <main className="overflow-x-hidden">{children}</main>;
  }

  return (
    <>
      <PromoBanner />
      <Header />
      {/* When mobile bottom nav is visible, reserve bottom space so content doesn't
          render under the fixed nav. The 80px = nav h-16 (64px) + safe-area room. */}
      <main className={`overflow-x-hidden ${bottomNavVisible ? 'pb-20 sm:pb-0' : ''}`}>
        {children}
      </main>
      <Footer />
      <ScrollToTop />
      <MobileBottomNav />
    </>
  );
}
