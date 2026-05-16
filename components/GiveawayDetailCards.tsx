'use client';

import React from 'react';
import { formatSydneyDate } from '@/lib/timezone';

const RICH_HTML =
  'text-[#4b5563] text-[14px] sm:text-[14.5px] leading-relaxed [&_a]:text-[#6356E5] [&_a]:underline [&_p]:mb-2 last:[&_p]:mb-0 [&_strong]:text-[#0f1222] [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5';

const PERMIT_NUMBERS = ['TP 22/02110', 'TP 22/02408'] as const;

const SYDNEY_TZ = 'Australia/Sydney';

function getSydneyCalendarDay(d: Date): string {
  return new Intl.DateTimeFormat('en-AU', { timeZone: SYDNEY_TZ, day: 'numeric' }).format(d);
}

function formatDrawDateCardLine(d: Date): string {
  const datePart = new Intl.DateTimeFormat('en-AU', {
    timeZone: SYDNEY_TZ,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
  const timePart = new Intl.DateTimeFormat('en-AU', {
    timeZone: SYDNEY_TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
  return `${datePart} • ${timePart} AEDT`;
}

function GiveawayCalendarDayBadge({ dayLabel }: { dayLabel: string }) {
  return (
    <div
      className="relative w-[4.35rem] rounded-2xl overflow-hidden shadow-xl border border-[#E0DAFF] bg-white ring-2 ring-white/80"
      aria-hidden
    >
      <div className="h-7 bg-gradient-to-r from-[#7867EC] to-[#6356E5] flex items-center justify-center gap-2 px-2">
        <span className="h-2 w-2 rounded-full bg-white/90 shadow-sm ring-1 ring-white/40" />
        <span className="h-2 w-2 rounded-full bg-white/90 shadow-sm ring-1 ring-white/40" />
      </div>
      <div className="py-3 flex items-center justify-center bg-gradient-to-b from-white to-[#F4F1FB]">
        <span className="text-[1.65rem] font-black text-[#0f1222] tabular-nums leading-none tracking-tight">
          {dayLabel}
        </span>
      </div>
    </div>
  );
}

function GiveawayDetailIcon({ kind }: { kind: 'trophy' | 'clock' | 'calendar' | 'clipboard' }) {
  const cls = 'w-5 h-5 text-[#6356E5]';
  switch (kind) {
    case 'trophy':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 4h3v2a3 3 0 0 1-3 3M7 4H4v2a3 3 0 0 0 3 3" />
        </svg>
      );
    case 'clock':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      );
    case 'calendar':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5" />
        </svg>
      );
    case 'clipboard':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h4M8 4h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
        </svg>
      );
  }
}

function IconBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#F0EDFB] ring-1 ring-[#E0DAFF]">
      {children}
    </div>
  );
}

export type GiveawayDetailCardsProps = {
  firstPrizeHtml?: string | null;
  entriesCloseAt: Date | null;
  drawEventAt: Date | null;
  showStreamFacebook?: boolean;
};

export default function GiveawayDetailCards({
  firstPrizeHtml,
  entriesCloseAt,
  drawEventAt,
  showStreamFacebook,
}: GiveawayDetailCardsProps) {
  return (
    <section className="relative overflow-hidden py-14 sm:py-20">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: [
            'radial-gradient(680px 460px at 12% 8%, rgba(139,123,255,.10), transparent 62%)',
            'radial-gradient(640px 420px at 88% 12%, rgba(255,226,176,.10), transparent 60%)',
            'linear-gradient(180deg, #FFFFFF 0%, #FBFAFF 100%)',
          ].join(', '),
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(rgba(99,86,229,1) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#E0DAFF] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6356E5]">
            <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[#6356E5]" />
            Bonus Draw info
          </span>
          <h2 className="mt-3 text-[28px] sm:text-[36px] md:text-[44px] font-extrabold tracking-tight leading-[1.1] text-[#0f1222]">
            How it <span className="uc-gold-gradient">works</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <div className="rounded-2xl bg-white border border-[#E7E9F2] p-5 sm:p-6 shadow-[0_8px_24px_-16px_rgba(99,86,229,0.25)]">
            <div className="mb-3">
              <IconBadge>
                <GiveawayDetailIcon kind="trophy" />
              </IconBadge>
            </div>
            <h3 className="font-extrabold tracking-[0.14em] uppercase text-[11px] text-[#6356E5] mb-2">
              First Prize
            </h3>
            {firstPrizeHtml?.trim() ? (
              <div
                className={RICH_HTML}
                dangerouslySetInnerHTML={{ __html: firstPrizeHtml }}
              />
            ) : (
              <p className="text-sm text-[#667085]">Prize details coming soon.</p>
            )}
          </div>

          <div className="rounded-2xl bg-white border border-[#E7E9F2] p-5 sm:p-6 shadow-[0_8px_24px_-16px_rgba(99,86,229,0.25)]">
            <div className="mb-3">
              <IconBadge>
                <GiveawayDetailIcon kind="clock" />
              </IconBadge>
            </div>
            <h3 className="font-extrabold tracking-[0.14em] uppercase text-[11px] text-[#6356E5] mb-2">
              Entries Close
            </h3>
            {entriesCloseAt ? (
              <p className="text-[14px] text-[#0f1222] font-medium leading-snug">
                {formatSydneyDate(entriesCloseAt)} <span className="text-[#667085] font-normal">AEST</span>
              </p>
            ) : (
              <p className="text-sm text-[#667085]">TBA</p>
            )}
          </div>

          <div className="relative rounded-2xl bg-white border border-[#E7E9F2] p-5 sm:p-6 pt-7 shadow-[0_10px_30px_-16px_rgba(99,86,229,0.32)] overflow-visible">
            {drawEventAt ? (
              <div
                className="absolute -top-5 right-3 sm:right-5 z-10 pointer-events-none"
                aria-hidden
              >
                <GiveawayCalendarDayBadge dayLabel={getSydneyCalendarDay(drawEventAt)} />
              </div>
            ) : null}
            <div className="mb-3">
              <IconBadge>
                <GiveawayDetailIcon kind="calendar" />
              </IconBadge>
            </div>
            <h3 className="font-extrabold tracking-[0.14em] uppercase text-[11px] text-[#6356E5] mb-2 pr-16 sm:pr-20">
              Draw Date
            </h3>
            {drawEventAt ? (
              <>
                <p className="text-[14px] sm:text-[15px] font-bold text-[#0f1222] leading-snug">
                  {formatDrawDateCardLine(drawEventAt)}
                </p>
                {showStreamFacebook ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#1877F2]">
                    <span aria-hidden className="inline-block w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse" />
                    Streaming live on Facebook
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-[#667085]">TBA</p>
            )}
          </div>

          <div className="rounded-2xl bg-white border border-[#E7E9F2] p-5 sm:p-6 shadow-[0_8px_24px_-16px_rgba(99,86,229,0.25)]">
            <div className="mb-3">
              <IconBadge>
                <GiveawayDetailIcon kind="clipboard" />
              </IconBadge>
            </div>
            <h3 className="font-extrabold tracking-[0.14em] uppercase text-[11px] text-[#6356E5] mb-2">
              Permit Number
            </h3>
            <ul className="text-[14px] text-[#0f1222] space-y-1 font-mono tabular-nums">
              {PERMIT_NUMBERS.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
