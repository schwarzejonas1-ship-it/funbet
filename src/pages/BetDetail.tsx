import { useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Badge,
  Card,
  ErrorText,
  PageShell,
  PoolBar,
  Spinner,
} from '../components/ui'
import { Coins, WhatsAppIcon } from '../components/icons'
import { useBetData } from '../hooks/useBetData'
import { useUserId } from '../lib/auth'
import { placeStake, resolveBet } from '../lib/api'
import {
  betShareText,
  coins,
  estimatePayout,
  payoutMultiple,
  timeAgo,
  whatsappShareUrl,
} from '../lib/format'
import { getStoredRooms } from '../lib/rooms-storage'

export default function BetDetail() {
  const { roomId, betId } = useParams<{ roomId: string; betId: string }>()
  const userId = useUserId()
  const { bet, stakes, members, loading, notFound, error, refresh } = useBetData(
    roomId,
    betId,
  )

  const [side, setSide] = useState<boolean | null>(null)
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

  const total = bet.yes_pool + bet.no_pool
  const open = bet.status === 'open'
  const isCreator = bet.creator_id === userId
  const me = members.find((m) => m.user_id === userId)
  const myStake = stakes.find((s) => s.user_id === userId)
  const wasRefunded =
    !open && total > 0 && (bet.yes_pool === 0 || bet.no_pool === 0)

  const storedRoom = getStoredRooms().find((r) => r.id === roomId)

  const nameOf = (uid: string) =>
    members.find((m) => m.user_id === uid)?.display_name ?? 'Someone'

  const amt = parseInt(amount, 10) || 0
  const sidePool = side === true ? bet.yes_pool : side === false ? bet.no_pool : 0
  const estimate = side !== null && amt > 0 ? estimatePayout(amt, sidePool, total) : null

  const submitStake = async () => {
    if (!betId || side === null || amt < 1 || busy) return
    setBusy(true)
    setActionError(null)
    try {
      await placeStake(betId, side, amt)
      setAmount('')
      setSide(null)
      await refresh()
    } catch (err) {
      setActionError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const submitResolve = async (outcome: boolean) => {
    if (!betId || busy) return
    const label = outcome ? 'YES' : 'NO'
    if (!window.confirm(`Resolve "${bet.question}" as ${label}? This can't be undone.`))
      return
    setBusy(true)
    setActionError(null)
    try {
      await resolveBet(betId, outcome)
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
          {open ? (
            <Badge tone="brand">Open</Badge>
          ) : (
            <Badge tone={bet.outcome ? 'yes' : 'no'}>{bet.outcome ? 'YES' : 'NO'}</Badge>
          )}
        </div>
        <p className="mt-1 text-xs text-faint">
          by {nameOf(bet.creator_id)} · {timeAgo(bet.created_at)}
        </p>

        {!open && (
          <div
            className={`mt-3 rounded-xl px-3 py-2 text-sm font-semibold ${
              bet.outcome ? 'bg-yes-soft text-yes' : 'bg-no-soft text-no'
            }`}
          >
            Resolved {bet.outcome ? 'YES ✅' : 'NO ❌'}
            {wasRefunded && ' — pool was one-sided, all stakes refunded'}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3 text-center">
          <div className="rounded-xl bg-yes-soft p-3">
            <p className="text-xs font-semibold uppercase text-yes">Yes</p>
            <p className="tabular text-lg font-extrabold text-yes">
              {payoutMultiple(bet.yes_pool, total) ?? 'no stakes'}
            </p>
            <p className="text-xs text-yes/80">
              <Coins amount={bet.yes_pool} size={12} />
            </p>
          </div>
          <div className="rounded-xl bg-no-soft p-3">
            <p className="text-xs font-semibold uppercase text-no">No</p>
            <p className="tabular text-lg font-extrabold text-no">
              {payoutMultiple(bet.no_pool, total) ?? 'no stakes'}
            </p>
            <p className="text-xs text-no/80">
              <Coins amount={bet.no_pool} size={12} />
            </p>
          </div>
        </div>
        <div className="mt-3">
          <PoolBar yes={bet.yes_pool} no={bet.no_pool} />
        </div>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
          Total pot: <Coins amount={total} size={13} />
        </p>
      </Card>

      {/* Share the bet into the group chat */}
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
            {myStake.side ? 'YES' : 'NO'}.
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

      {open && me && !myStake && (
        <Card className="mt-4 p-4">
          <h3 className="font-bold">Place your stake</h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
            Your balance: <Coins amount={me.balance} size={12} /> · one stake per bet
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              onClick={() => setSide(true)}
              className={`rounded-xl border-2 py-3 font-bold transition ${
                side === true
                  ? 'border-yes bg-yes text-ink'
                  : 'border-yes/40 bg-yes-soft text-yes'
              }`}
            >
              YES
            </button>
            <button
              onClick={() => setSide(false)}
              className={`rounded-xl border-2 py-3 font-bold transition ${
                side === false
                  ? 'border-no bg-no text-ink'
                  : 'border-no/40 bg-no-soft text-no'
              }`}
            >
              NO
            </button>
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
          {estimate !== null && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
              If {side ? 'YES' : 'NO'} wins, you'd get back about{' '}
              <span className="font-bold text-content">
                <Coins amount={estimate} size={13} />
              </span>
            </p>
          )}
          <button
            onClick={submitStake}
            disabled={side === null || amt < 1 || amt > me.balance || busy}
            className="mt-3 w-full rounded-xl bg-brand-strong py-3 font-semibold text-white transition active:scale-[0.98] hover:bg-brand disabled:opacity-40"
          >
            {busy ? 'Placing…' : 'Place Stake'}
          </button>
        </Card>
      )}

      {stakes.length > 0 && (
        <section className="mt-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Stakes ({stakes.length})
          </h3>
          <Card>
            {stakes.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between border-b border-line/60 px-4 py-3 text-sm last:border-b-0"
              >
                <span className="font-medium">
                  {nameOf(s.user_id)}
                  {s.user_id === userId && (
                    <span className="ml-1 text-xs text-faint">(you)</span>
                  )}
                </span>
                <span className="flex items-center gap-2">
                  <Badge tone={s.side ? 'yes' : 'no'}>{s.side ? 'YES' : 'NO'}</Badge>
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
            ))}
          </Card>
        </section>
      )}

      {open && isCreator && (
        <Card className="mt-4 border-gold/30 bg-gold/10 p-4">
          <h3 className="font-bold text-gold">Resolve this bet</h3>
          <p className="mt-0.5 text-xs text-gold/80">
            You created this bet, so you settle it once the outcome is known.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              onClick={() => submitResolve(true)}
              disabled={busy}
              className="rounded-xl bg-yes py-3 font-bold text-ink transition active:scale-[0.98] disabled:opacity-50"
            >
              Resolve YES
            </button>
            <button
              onClick={() => submitResolve(false)}
              disabled={busy}
              className="rounded-xl bg-no py-3 font-bold text-ink transition active:scale-[0.98] disabled:opacity-50"
            >
              Resolve NO
            </button>
          </div>
        </Card>
      )}

      <ErrorText message={actionError} />
    </PageShell>
  )
}
