import { useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Badge,
  Card,
  ErrorText,
  PageShell,
  PoolBar,
  Spinner,
  optionColor,
} from '../components/ui'
import { Coins, WhatsAppIcon } from '../components/icons'
import { useBetData } from '../hooks/useBetData'
import { useUserId } from '../lib/auth'
import { placeStake, resolveBet } from '../lib/api'
import type { BetOption } from '../lib/api'
import {
  betShareText,
  coins,
  estimatePayout,
  payoutMultiple,
  timeAgo,
  whatsappShareUrl,
} from '../lib/format'
import { getStoredRooms } from '../lib/rooms-storage'

function Dot({ index }: { index: number }) {
  return (
    <span
      className="h-3 w-3 shrink-0 rounded-full"
      style={{ backgroundColor: optionColor(index) }}
    />
  )
}

export default function BetDetail() {
  const { roomId, betId } = useParams<{ roomId: string; betId: string }>()
  const userId = useUserId()
  const { bet, options, stakes, members, loading, notFound, error, refresh } =
    useBetData(roomId, betId)

  const [chosen, setChosen] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  if (loading) return <Spinner />
  if (notFound || !bet) {
    return (
      <PageShell title="Bet not found" back={`/room/${roomId}`}>
        <p className="text-sm text-muted">This bet doesn't exist.</p>
      </PageShell>
    )
  }

  const sorted = [...options].sort((a, b) => a.position - b.position)
  const total = sorted.reduce((s, o) => s + o.pool, 0)
  const open = bet.status === 'open'
  const isCreator = bet.creator_id === userId
  const me = members.find((m) => m.user_id === userId)
  const myStake = stakes.find((s) => s.user_id === userId)
  const optionIndex = (id: string) => sorted.findIndex((o) => o.id === id)
  const optionById = (id: string | null) => sorted.find((o) => o.id === id) ?? null
  const winner = optionById(bet.winning_option_id)
  const wasRefunded =
    !open && total > 0 && !!winner && (winner.pool === 0 || winner.pool === total)

  const storedRoom = getStoredRooms().find((r) => r.id === roomId)
  const nameOf = (uid: string) =>
    members.find((m) => m.user_id === uid)?.display_name ?? 'Someone'

  const amt = parseInt(amount, 10) || 0
  const chosenOption = optionById(chosen)
  const estimate =
    chosenOption && amt > 0 ? estimatePayout(amt, chosenOption.pool, total) : null

  const submitStake = async () => {
    if (!betId || !chosen || amt < 1 || busy) return
    setBusy(true)
    setActionError(null)
    try {
      await placeStake(betId, chosen, amt)
      setAmount('')
      setChosen(null)
      await refresh()
    } catch (err) {
      setActionError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const submitResolve = async (option: BetOption) => {
    if (!betId || busy) return
    if (
      !window.confirm(
        `Declare "${option.label}" the winner of "${bet.question}"? This can't be undone.`,
      )
    )
      return
    setBusy(true)
    setActionError(null)
    try {
      await resolveBet(betId, option.id)
      await refresh()
    } catch (err) {
      setActionError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageShell title="Bet" back={`/room/${roomId}`}>
      <ErrorText message={error} />

      <Card className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-bold leading-snug">{bet.question}</h2>
          {open ? <Badge tone="brand">Open</Badge> : <Badge tone="neutral">Resolved</Badge>}
        </div>
        <p className="mt-1 text-xs text-faint">
          by {nameOf(bet.creator_id)} · {timeAgo(bet.created_at)}
        </p>

        {!open && winner && (
          <div className="mt-3 rounded-xl bg-yes-soft px-3 py-2 text-sm font-semibold text-yes">
            🏆 Winner: {winner.label}
            {wasRefunded && ' — pool was one-sided, all stakes refunded'}
          </div>
        )}

        <div className="mt-4">
          <PoolBar pools={sorted.map((o) => o.pool)} />
        </div>

        {/* Option odds table */}
        <div className="mt-3 flex flex-col gap-2">
          {sorted.map((o, i) => {
            const isWinner = !open && o.id === bet.winning_option_id
            return (
              <div
                key={o.id}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                  isWinner ? 'bg-yes-soft ring-1 ring-yes/40' : 'bg-surface-2'
                }`}
              >
                <Dot index={i} />
                <span className="min-w-0 flex-1 truncate font-medium">{o.label}</span>
                <span className="tabular text-xs text-muted">
                  <Coins amount={o.pool} size={12} />
                </span>
                <span className="tabular w-14 text-right font-bold">
                  {payoutMultiple(o.pool, total) ?? '—'}
                </span>
              </div>
            )
          })}
        </div>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
          Total pot: <Coins amount={total} size={13} />
        </p>
      </Card>

      {/* Share into the group chat */}
      {open && storedRoom && (
        <a
          href={whatsappShareUrl(betShareText(storedRoom.name, bet.question, storedRoom.code))}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-whatsapp py-3 text-base font-semibold text-ink transition active:scale-[0.98]"
        >
          <WhatsAppIcon size={20} />
          Tell the group on WhatsApp
        </a>
      )}

      {myStake && (
        <Card className="mt-4 border-brand/30 bg-brand/10 p-4 text-sm">
          <span className="font-semibold text-content">
            You staked <Coins amount={myStake.amount} size={13} /> on{' '}
            {optionById(myStake.option_id)?.label ?? '—'}.
          </span>{' '}
          {!open && myStake.payout !== null && (
            <span className={myStake.payout > 0 ? 'font-bold text-yes' : 'font-bold text-no'}>
              {myStake.payout > 0
                ? `You got back ${coins(myStake.payout)} coins!`
                : 'Better luck next time.'}
            </span>
          )}
        </Card>
      )}

      {/* Place a stake — pick one option */}
      {open && me && !myStake && (
        <Card className="mt-4 p-4">
          <h3 className="font-bold">Place your stake</h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
            Your balance: <Coins amount={me.balance} size={12} /> · one stake per bet
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {sorted.map((o, i) => (
              <button
                key={o.id}
                onClick={() => setChosen(o.id)}
                className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left font-semibold transition ${
                  chosen === o.id
                    ? 'border-brand bg-brand/15 text-content'
                    : 'border-line bg-surface-2 text-muted'
                }`}
              >
                <Dot index={i} />
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                <span className="tabular text-xs">{payoutMultiple(o.pool, total) ?? '—'}</span>
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              className="tabular min-w-0 flex-1 rounded-xl border border-line bg-surface-2 px-4 py-3 text-base text-content outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
              type="number"
              inputMode="numeric"
              min={1}
              max={me.balance}
              placeholder="Coins"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {[
              { label: '100', value: 100 },
              { label: 'Half', value: Math.floor(me.balance / 2) },
              { label: 'All in', value: me.balance },
            ].map((chip) => (
              <button
                key={chip.label}
                onClick={() => setAmount(String(chip.value))}
                disabled={chip.value < 1 || chip.value > me.balance}
                className="shrink-0 rounded-xl bg-surface-2 px-3 text-sm font-semibold text-muted transition hover:text-content disabled:opacity-40"
              >
                {chip.label}
              </button>
            ))}
          </div>
          {estimate !== null && chosenOption && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
              If {chosenOption.label} wins, you'd get back about{' '}
              <span className="font-bold text-content">
                <Coins amount={estimate} size={13} />
              </span>
            </p>
          )}
          <button
            onClick={submitStake}
            disabled={!chosen || amt < 1 || amt > me.balance || busy}
            className="mt-3 w-full rounded-xl bg-brand-strong py-3 font-semibold text-white transition active:scale-[0.98] hover:bg-brand disabled:opacity-40"
          >
            {busy ? 'Placing…' : 'Place Stake'}
          </button>
        </Card>
      )}

      {/* Stakes list */}
      {stakes.length > 0 && (
        <section className="mt-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Stakes ({stakes.length})
          </h3>
          <Card>
            {stakes.map((s) => {
              const opt = optionById(s.option_id)
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between border-b border-line/60 px-4 py-3 text-sm last:border-b-0"
                >
                  <span className="min-w-0 font-medium">
                    {nameOf(s.user_id)}
                    {s.user_id === userId && (
                      <span className="ml-1 text-xs text-faint">(you)</span>
                    )}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-xs text-muted">
                      {opt && <Dot index={optionIndex(opt.id)} />}
                      <span className="max-w-24 truncate">{opt?.label ?? '—'}</span>
                    </span>
                    <span className="font-semibold">
                      <Coins amount={s.amount} size={13} />
                    </span>
                    {!open && s.payout !== null && (
                      <span
                        className={`tabular text-xs font-bold ${
                          s.payout > 0 ? 'text-yes' : 'text-no'
                        }`}
                      >
                        {s.payout > 0 ? `+${coins(s.payout)}` : '0'}
                      </span>
                    )}
                  </span>
                </div>
              )
            })}
          </Card>
        </section>
      )}

      {/* Creator resolves by picking the winning option */}
      {open && isCreator && (
        <Card className="mt-4 border-gold/30 bg-gold/10 p-4">
          <h3 className="font-bold text-gold">Declare the winner</h3>
          <p className="mt-0.5 text-xs text-gold/80">
            You created this bet, so you settle it once the outcome is known.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {sorted.map((o, i) => (
              <button
                key={o.id}
                onClick={() => submitResolve(o)}
                disabled={busy}
                className="flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-left font-semibold text-content transition active:scale-[0.98] hover:border-gold/60 disabled:opacity-50"
              >
                <Dot index={i} />
                <span className="min-w-0 flex-1 truncate">{o.label} wins</span>
                <span className="text-xs text-muted">Resolve →</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      <ErrorText message={actionError} />
    </PageShell>
  )
}
