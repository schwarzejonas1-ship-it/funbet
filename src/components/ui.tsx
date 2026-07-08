import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { Bet } from '../lib/api'
import { coins, payoutMultiple, timeAgo } from '../lib/format'

export const inputCls =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'

export const primaryBtnCls =
  'w-full rounded-xl bg-indigo-600 py-3 text-base font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-50'

export function PageShell({
  title,
  back,
  right,
  children,
}: {
  title: ReactNode
  back?: string
  right?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="mx-auto min-h-dvh max-w-md pb-12">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
        {back && (
          <Link
            to={back}
            aria-label="Back"
            className="-ml-1 rounded-lg p-1 text-xl leading-none text-slate-500 active:bg-slate-100"
          >
            ←
          </Link>
        )}
        <h1 className="min-w-0 flex-1 truncate text-lg font-bold">{title}</h1>
        {right}
      </header>
      <main className="px-4 pt-4">{children}</main>
    </div>
  )
}

export function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <span className="animate-bounce text-3xl">🎲</span>
    </div>
  )
}

export function ErrorText({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
      {message}
    </p>
  )
}

export function PoolBar({ yes, no }: { yes: number; no: number }) {
  const total = yes + no
  if (total === 0) {
    return <div className="h-2.5 rounded-full bg-slate-200" />
  }
  const yesPct = (yes / total) * 100
  return (
    <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-200">
      <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${yesPct}%` }} />
      <div className="bg-rose-400 transition-all duration-500" style={{ width: `${100 - yesPct}%` }} />
    </div>
  )
}

export function BetCard({ bet, to }: { bet: Bet; to: string }) {
  const total = bet.yes_pool + bet.no_pool
  const open = bet.status === 'open'
  return (
    <Link
      to={to}
      className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold leading-snug">{bet.question}</p>
        {open ? (
          <span className="shrink-0 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
            Open
          </span>
        ) : (
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              bet.outcome
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-rose-100 text-rose-700'
            }`}
          >
            {bet.outcome ? 'YES' : 'NO'}
          </span>
        )}
      </div>
      <div className="mt-3">
        <PoolBar yes={bet.yes_pool} no={bet.no_pool} />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        <span>
          Yes {payoutMultiple(bet.yes_pool, total) ?? '—'} · No{' '}
          {payoutMultiple(bet.no_pool, total) ?? '—'}
        </span>
        <span>
          🪙 {coins(total)} · {timeAgo(bet.created_at)}
        </span>
      </div>
    </Link>
  )
}
