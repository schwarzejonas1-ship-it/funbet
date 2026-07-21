import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { Bet } from '../lib/api'
import { payoutMultiple, timeAgo } from '../lib/format'
import {
  BellIcon,
  ChevronLeftIcon,
  Coins,
  DiceIcon,
} from './icons'

export const inputCls =
  'w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-base text-content placeholder:text-faint outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30'

export const primaryBtnCls =
  'w-full rounded-xl bg-brand-strong py-3 text-base font-semibold text-white shadow-lg shadow-brand-strong/20 transition active:scale-[0.98] hover:bg-brand disabled:opacity-40 disabled:shadow-none'

export const secondaryBtnCls =
  'w-full rounded-xl border border-line bg-surface-2 py-3 text-base font-semibold text-content transition active:scale-[0.98] hover:border-brand/60 disabled:opacity-40'

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-2xl border border-line bg-surface shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export function SectionHeading({
  children,
  action,
}: {
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
        {children}
      </h2>
      {action}
    </div>
  )
}

export function Badge({
  children,
  tone = 'brand',
}: {
  children: ReactNode
  tone?: 'brand' | 'yes' | 'no' | 'neutral'
}) {
  const tones = {
    brand: 'bg-brand/15 text-brand',
    yes: 'bg-yes/15 text-yes',
    no: 'bg-no/15 text-no',
    neutral: 'bg-surface-2 text-muted',
  }
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  )
}

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
    <div className="mx-auto min-h-dvh max-w-md pb-16">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-line/70 bg-ink/80 px-4 py-3 backdrop-blur-md">
        {back && (
          <Link
            to={back}
            aria-label="Back"
            className="-ml-1 rounded-lg p-1 text-muted transition active:bg-surface-2 hover:text-content"
          >
            <ChevronLeftIcon size={24} />
          </Link>
        )}
        <h1 className="min-w-0 flex-1 truncate text-lg font-bold">{title}</h1>
        {right}
      </header>
      <main className="px-4 pt-4">{children}</main>
    </div>
  )
}

export function BalancePill({ amount }: { amount: number }) {
  return (
    <span className="rounded-full bg-gold/15 px-2.5 py-1 text-sm font-bold text-gold">
      <Coins amount={amount} size={14} />
    </span>
  )
}

export function NotificationBell({ to, count }: { to: string; count: number }) {
  return (
    <Link
      to={to}
      aria-label="Notifications"
      className="relative rounded-lg p-1 text-muted transition hover:text-content"
    >
      <BellIcon size={22} />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-no px-1 text-[10px] font-bold text-ink">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}

export function Spinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center text-brand">
      <DiceIcon size={40} className="animate-bounce" />
    </div>
  )
}

export function ErrorText({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p className="mt-3 rounded-xl border border-no/30 bg-no-soft px-3 py-2 text-sm font-medium text-no">
      {message}
    </p>
  )
}

/** Centered full-screen message with an icon and an action link. */
export function CenteredMessage({
  icon,
  title,
  children,
  action,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
  action: ReactNode
}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="text-brand">{icon}</span>
      <h1 className="text-lg font-bold">{title}</h1>
      <p className="text-sm text-muted">{children}</p>
      <div className="mt-2">{action}</div>
    </div>
  )
}

export function PoolBar({ yes, no }: { yes: number; no: number }) {
  const total = yes + no
  if (total === 0) {
    return <div className="h-2.5 rounded-full bg-surface-2" />
  }
  const yesPct = (yes / total) * 100
  return (
    <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-2">
      <div className="bg-yes transition-all duration-500" style={{ width: `${yesPct}%` }} />
      <div className="bg-no transition-all duration-500" style={{ width: `${100 - yesPct}%` }} />
    </div>
  )
}

export function BetCard({ bet, to }: { bet: Bet; to: string }) {
  const total = bet.yes_pool + bet.no_pool
  const open = bet.status === 'open'
  return (
    <Link
      to={to}
      className="block rounded-2xl border border-line bg-surface p-4 shadow-sm transition active:scale-[0.99] hover:border-brand/50"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold leading-snug text-content">{bet.question}</p>
        {open ? (
          <Badge tone="brand">Open</Badge>
        ) : (
          <Badge tone={bet.outcome ? 'yes' : 'no'}>{bet.outcome ? 'YES' : 'NO'}</Badge>
        )}
      </div>
      <div className="mt-3">
        <PoolBar yes={bet.yes_pool} no={bet.no_pool} />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted">
        <span className="tabular">
          Yes {payoutMultiple(bet.yes_pool, total) ?? '—'} · No{' '}
          {payoutMultiple(bet.no_pool, total) ?? '—'}
        </span>
        <span className="flex items-center gap-1.5">
          <Coins amount={total} size={13} /> · {timeAgo(bet.created_at)}
        </span>
      </div>
    </Link>
  )
}
