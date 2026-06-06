'use client';

import Link from 'next/link';

/**
 * Free-account dashboard — focused loop: Scan → Earn → Redeem.
 * Shown when the signed-in user is on the Free plan (user.state === 'free').
 * No Bonus Draws, Point Boosters or membership status here — those live behind
 * the soft upgrade card. Points are shown with their ≈ A$ value (1,000 Points = A$1).
 */
export default function FreeDashboard({
  firstName,
  totalPoints,
}: {
  firstName?: string;
  totalPoints: number;
}) {
  const aud = (totalPoints / 1000).toLocaleString('en-AU', {
    style: 'currency',
    currency: 'AUD',
  });

  return (
    <div className="mx-auto max-w-md px-4 py-6 sm:max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-[22px] font-extrabold tracking-tight text-[#0F1222]">
          {firstName ? `Hi, ${firstName}` : 'Welcome'}
        </h1>
        <span className="rounded-full border border-[#E7E9F2] px-3 py-1 text-[12px] font-semibold text-[#667085]">
          Free plan
        </span>
      </div>

      {/* Points balance */}
      <div className="rounded-2xl bg-gradient-to-br from-[#6356E5] to-[#8B7BFF] p-5 text-white shadow-[0_18px_44px_-22px_rgba(99,86,229,0.6)]">
        <p className="text-[12px] font-medium text-[#E0DAFF]">Available Points</p>
        <p className="mt-1 text-[34px] font-extrabold leading-none tracking-tight tabular-nums">
          {totalPoints.toLocaleString()}
        </p>
        <p className="mt-1.5 text-[12.5px] text-[#E0DAFF]">
          ≈ {aud} in gift cards · Points never expire
        </p>
      </div>

      {/* Primary action */}
      <Link
        href="/dashboard/receipts"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6356E5] px-4 py-3.5 text-[15px] font-semibold text-white transition hover:bg-[#5648D8]"
      >
        <ScanIcon /> Scan receipt
      </Link>
      <p className="mt-1.5 text-center text-[11.5px] text-[#9AA0B4]">
        Earn Points on eligible grocery, retail &amp; fuel receipts
      </p>

      {/* Scan → Earn → Redeem strip */}
      <div className="mt-5 grid grid-cols-3 gap-2.5">
        {[
          { icon: <ScanIcon />, label: 'Scan' },
          { icon: <CoinIcon />, label: 'Earn' },
          { icon: <GiftIcon />, label: 'Redeem' },
        ].map((s) => (
          <div
            key={s.label}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-[#E7E9F2] bg-white py-3 text-[#6356E5]"
          >
            {s.icon}
            <span className="text-[11.5px] font-medium text-[#667085]">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Redeem gift cards */}
      <div className="mt-6 flex items-baseline justify-between">
        <h2 className="text-[16px] font-extrabold tracking-tight text-[#0F1222]">
          Redeem gift cards
        </h2>
        <Link href="/rewards/gift-cards" className="text-[13px] font-semibold text-[#6356E5]">
          View all
        </Link>
      </div>
      <Link
        href="/rewards/gift-cards"
        className="mt-2.5 flex items-center justify-between rounded-2xl border border-[#E7E9F2] bg-white p-4 transition hover:border-[#C9C2F5]"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4F1FB] text-[#6356E5]">
            <GiftIcon />
          </span>
          <div>
            <p className="text-[14px] font-semibold text-[#0F1222]">Turn Points into gift cards</p>
            <p className="text-[12px] text-[#667085]">Coles, Woolworths, BP &amp; more</p>
          </div>
        </div>
        <ChevronIcon />
      </Link>

      {/* Upgrade teaser (soft) */}
      <div className="mt-6 rounded-2xl border border-[#E7E9F2] bg-[#FBFAFF] p-4">
        <div className="flex items-center gap-2">
          <LockIcon />
          <span className="text-[14px] font-semibold text-[#0F1222]">Unlock more with Membership</span>
        </div>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#667085]">
          Bonus Draws, up to 3× faster Points, a higher monthly cap, boosted Fuel Rewards &amp; Point Boosters.
        </p>
        <Link
          href="/dashboard/membership"
          className="mt-3 block w-full rounded-xl border border-[#6356E5] py-2.5 text-center text-[13.5px] font-semibold text-[#6356E5] transition hover:bg-[#F4F1FB]"
        >
          View membership plans
        </Link>
      </div>

      <div className="mt-5 flex items-center justify-center gap-5 text-[12.5px] font-semibold text-[#667085]">
        <Link href="/dashboard/purchases" className="hover:text-[#6356E5]">Points history</Link>
        <span className="text-[#E7E9F2]">·</span>
        <Link href="/dashboard/redemptions" className="hover:text-[#6356E5]">Redemptions</Link>
      </div>
    </div>
  );
}

function ScanIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function CoinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9.5 9.5h3.5a1.5 1.5 0 0 1 0 3H9.5h4" />
    </svg>
  );
}
function GiftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7M12 8C12 5 9 4 8 5.5S9 8 12 8Zm0 0c0-3 3-4 4-2.5S15 8 12 8Z" />
    </svg>
  );
}
function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#9AA0B4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#667085" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
