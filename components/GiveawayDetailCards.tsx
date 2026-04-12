'use client';

import React from 'react';
import { formatSydneyDate } from '@/lib/timezone';

const RICH_HTML =
  'text-gray-700 text-sm sm:text-base leading-relaxed [&_a]:text-indigo-600 [&_a]:underline [&_p]:mb-3 last:[&_p]:mb-0 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-semibold [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2';

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
      className="relative w-[4.35rem] rounded-2xl overflow-hidden shadow-xl border border-violet-200/90 bg-white ring-2 ring-white/80"
      aria-hidden
    >
      <div className="h-7 bg-gradient-to-r from-[#7c6ee8] to-[#6356E5] flex items-center justify-center gap-2 px-2">
        <span className="h-2 w-2 rounded-full bg-white/90 shadow-sm ring-1 ring-white/40" />
        <span className="h-2 w-2 rounded-full bg-white/90 shadow-sm ring-1 ring-white/40" />
      </div>
      <div className="py-3 flex items-center justify-center bg-gradient-to-b from-white to-violet-50/40">
        <span className="text-[1.65rem] font-black text-gray-800 tabular-nums leading-none tracking-tight">
          {dayLabel}
        </span>
      </div>
    </div>
  );
}

function GiveawayDetailIcon({ kind }: { kind: 'trophy' | 'clock' | 'calendar' | 'clipboard' }) {
  const cls = 'w-8 h-8 text-violet-600';
  switch (kind) {
    case 'trophy':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0"
          />
        </svg>
      );
    case 'clock':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      );
    case 'calendar':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5"
          />
        </svg>
      );
    case 'clipboard':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"
          />
        </svg>
      );
  }
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
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
      <h2 className="text-center text-transparent bg-clip-text bg-gradient-to-b from-[#9186FF] to-[#6356E5] text-2xl sm:text-3xl font-extrabold mb-8">
        Giveaway Details
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white border border-violet-100 p-5 shadow-sm">
          <div className="mb-2" aria-hidden>
            <GiveawayDetailIcon kind="trophy" />
          </div>
          <h3 className="font-bold text-violet-800 text-sm mb-2">First Prize</h3>
          {firstPrizeHtml?.trim() ? (
            <div className={`text-sm ${RICH_HTML}`} dangerouslySetInnerHTML={{ __html: firstPrizeHtml }} />
          ) : (
            <p className="text-sm text-gray-500">Prize details coming soon.</p>
          )}
        </div>
        <div className="rounded-2xl bg-white border border-violet-100 p-5 shadow-sm">
          <div className="mb-2" aria-hidden>
            <GiveawayDetailIcon kind="clock" />
          </div>
          <h3 className="font-bold text-violet-800 text-sm mb-2">Entries Close</h3>
          {entriesCloseAt ? (
            <p className="text-sm text-gray-700">{formatSydneyDate(entriesCloseAt)} AEST</p>
          ) : (
            <p className="text-sm text-gray-500">TBA</p>
          )}
        </div>
        <div className="relative rounded-3xl bg-white border border-violet-100 p-6 sm:p-7 pt-8 shadow-lg overflow-visible">
          {drawEventAt ? (
            <div className="absolute -top-5 right-3 sm:right-5 z-10 pointer-events-none" aria-hidden>
              <GiveawayCalendarDayBadge dayLabel={getSydneyCalendarDay(drawEventAt)} />
            </div>
          ) : null}
          <h3 className="font-bold text-violet-800 text-sm mb-3 pr-16 sm:pr-20">Draw Date</h3>
          {drawEventAt ? (
            <>
              <p className="text-sm sm:text-base font-bold text-gray-900 leading-snug">
                {formatDrawDateCardLine(drawEventAt)}
              </p>
              {showStreamFacebook ? (
                <p className="text-sm font-bold text-gray-900 mt-3 leading-snug">Streaming live on Facebook</p>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-gray-500">TBA</p>
          )}
        </div>
        <div className="rounded-2xl bg-white border border-violet-100 p-5 shadow-sm">
          <div className="mb-2" aria-hidden>
            <GiveawayDetailIcon kind="clipboard" />
          </div>
          <h3 className="font-bold text-violet-800 text-sm mb-2">Permit Number</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            {PERMIT_NUMBERS.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
