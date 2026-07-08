import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ErrorText, PageShell, PoolBar, Spinner } from '../components/ui'
import { useBetData } from '../hooks/useBetData'
import { useUserId } from '../lib/auth'
import { placeStake, resolveBet } from '../lib/api'
import { coins, estimatePayout, payoutMultiple, timeAgo } from '../lib/format'

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
        <p className="text-sm text-slate-600">This bet doesn't exist.</p>
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

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-bold leading-snug">{bet.question}</h2>
          {open ? (
            <span className="shrink-0 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
              Open
            </span>
          ) : (
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                bet.outcome ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}
            >
              {bet.outcome ? 'YES' : 'NO'}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-500">
          by {nameOf(bet.creator_id)} · {timeAgo(bet.created_at)}
        </p>

        {!open && (
          <div
            className={`mt-3 rounded-xl px-3 py-2 text-sm font-semibold ${
              bet.outcome ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
            }`}
          >
            Resolved {bet.outcome ? 'YES ✅' : 'NO ❌'}
            {wasRefunded && ' — pool was one-sided, all stakes refunded'}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3 text-center">
          <div className="rounded-xl bg-emerald-50 p-3">
            <p className="text-xs font-semibold uppercase text-emerald-600">Yes</p>
            <p className="text-lg font-extrabold text-emerald-700">
              {payoutMultiple(bet.yes_pool, total) ?? 'no stakes'}
            </p>
            <p className="text-xs text-emerald-600">🪙 {coins(bet.yes_pool)}</p>
          </div>
          <div className="rounded-xl bg-rose-50 p-3">
            <p className="text-xs font-semibold uppercase text-rose-500">No</p>
            <p className="text-lg font-extrabold text-rose-600">
              {payoutMultiple(bet.no_pool, total) ?? 'no stakes'}
            </p>
            <p className="text-xs text-rose-500">🪙 {coins(bet.no_pool)}</p>
          </div>
        </div>
        <div className="mt-3">
          <PoolBar yes={bet.yes_pool} no={bet.no_pool} />
        </div>
        <p className="mt-2 text-center text-xs text-slate-500">
          Total pot: 🪙 {coins(total)}
        </p>
      </div>

      {myStake && (
        <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm">
          <span className="font-semibold text-indigo-900">
            You staked 🪙 {coins(myStake.amount)} on {myStake.side ? 'YES' : 'NO'}.
          </span>{' '}
          {!open && myStake.payout !== null && (
            <span
              className={
                myStake.payout > 0
                  ? 'font-bold text-emerald-700'
                  : 'font-bold text-rose-600'
              }
            >
              {myStake.payout > 0
                ? `You got back 🪙 ${coins(myStake.payout)}!`
                : 'Better luck next time.'}
            </span>
          )}
        </div>
      )}

      {open && me && !myStake && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="font-bold">Place your stake</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Your balance: 🪙 {coins(me.balance)} · one stake per bet
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              onClick={() => setSide(true)}
              className={`rounded-xl border-2 py-3 font-bold transition ${
                side === true
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              YES
            </button>
            <button
              onClick={() => setSide(false)}
              className={`rounded-xl border-2 py-3 font-bold transition ${
                side === false
                  ? 'border-rose-500 bg-rose-500 text-white'
                  : 'border-rose-200 bg-rose-50 text-rose-600'
              }`}
            >
              NO
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <input
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
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
                className="shrink-0 rounded-xl bg-slate-100 px-3 text-sm font-semibold text-slate-600 disabled:opacity-40"
              >
                {chip.label}
              </button>
            ))}
          </div>
          {estimate !== null && (
            <p className="mt-2 text-sm text-slate-600">
              If {side ? 'YES' : 'NO'} wins, you'd get back about{' '}
              <span className="font-bold">🪙 {coins(estimate)}</span>
            </p>
          )}
          <button
            onClick={submitStake}
            disabled={side === null || amt < 1 || amt > me.balance || busy}
            className="mt-3 w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? 'Placing…' : 'Place Stake'}
          </button>
        </div>
      )}

      {stakes.length > 0 && (
        <section className="mt-4">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Stakes ({stakes.length})
          </h3>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            {stakes.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between border-b border-slate-100 px-4 py-3 text-sm last:border-b-0"
              >
                <span className="font-medium">
                  {nameOf(s.user_id)}
                  {s.user_id === userId && (
                    <span className="ml-1 text-xs text-slate-400">(you)</span>
                  )}
                </span>
                <span className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      s.side ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'
                    }`}
                  >
                    {s.side ? 'YES' : 'NO'}
                  </span>
                  <span className="font-semibold">🪙 {coins(s.amount)}</span>
                  {!open && s.payout !== null && (
                    <span
                      className={`text-xs font-bold ${
                        s.payout > 0 ? 'text-emerald-600' : 'text-rose-500'
                      }`}
                    >
                      {s.payout > 0 ? `+${coins(s.payout)}` : '0'}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {open && isCreator && (
        <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="font-bold text-amber-900">Resolve this bet</h3>
          <p className="mt-0.5 text-xs text-amber-700">
            You created this bet, so you settle it once the outcome is known.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              onClick={() => submitResolve(true)}
              disabled={busy}
              className="rounded-xl bg-emerald-600 py-3 font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
            >
              Resolve YES
            </button>
            <button
              onClick={() => submitResolve(false)}
              disabled={busy}
              className="rounded-xl bg-rose-600 py-3 font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
            >
              Resolve NO
            </button>
          </div>
        </section>
      )}

      <ErrorText message={actionError} />
    </PageShell>
  )
}
