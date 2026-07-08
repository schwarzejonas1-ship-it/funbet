import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BetCard, ErrorText, PageShell, Spinner, primaryBtnCls } from '../components/ui'
import { useRoomData } from '../hooks/useRoomData'
import { useNotifications } from '../hooks/useNotifications'
import { useUserId } from '../lib/auth'
import { coins, inviteUrl } from '../lib/format'
import { addStoredRoom, removeStoredRoom } from '../lib/rooms-storage'

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>()
  const [searchParams] = useSearchParams()
  const userId = useUserId()
  const navigate = useNavigate()
  const { room, members, bets, loading, notFound, error } = useRoomData(roomId)
  const { unreadCount } = useNotifications(roomId, userId)
  const [copied, setCopied] = useState(false)

  const me = members.find((m) => m.user_id === userId)
  const showInviteBanner = searchParams.get('invite') === '1'

  useEffect(() => {
    if (room) addStoredRoom({ id: room.id, code: room.code, name: room.name })
  }, [room])

  if (loading) return <Spinner />

  if (notFound || !room) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
        <span className="text-4xl">🚪</span>
        <h1 className="text-lg font-bold">Room unavailable</h1>
        <p className="text-sm text-slate-600">
          This room doesn't exist or you're not a member on this device. Ask for
          an invite link to join.
        </p>
        <button
          onClick={() => {
            if (roomId) removeStoredRoom(roomId)
            navigate('/')
          }}
          className="mt-2 font-semibold text-indigo-600"
        >
          Back to home
        </button>
      </div>
    )
  }

  const shareInvite = async () => {
    const url = inviteUrl(room.code)
    if (navigator.share) {
      try {
        await navigator.share({ title: `Join "${room.name}" on FunBet`, url })
        return
      } catch {
        // user cancelled the share sheet; fall through to copy
      }
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const openBets = bets.filter((b) => b.status === 'open')
  const resolvedBets = bets.filter((b) => b.status !== 'open')
  const topMembers = members.slice(0, 3)
  const medals = ['🥇', '🥈', '🥉']

  return (
    <PageShell
      title={room.name}
      back="/"
      right={
        <div className="flex items-center gap-2">
          {me && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-sm font-bold text-amber-800">
              🪙 {coins(me.balance)}
            </span>
          )}
          <Link
            to={`/room/${room.id}/notifications`}
            aria-label="Notifications"
            className="relative rounded-lg p-1 text-xl leading-none"
          >
            🔔
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </div>
      }
    >
      <ErrorText message={error} />

      <div
        className={`rounded-2xl border p-4 shadow-sm ${
          showInviteBanner
            ? 'border-indigo-200 bg-indigo-50'
            : 'border-slate-200 bg-white'
        }`}
      >
        {showInviteBanner && (
          <p className="mb-2 text-sm font-semibold text-indigo-800">
            🎉 Room created! Now invite your friends:
          </p>
        )}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Invite link
            </p>
            <p className="truncate text-sm font-mono text-slate-700">
              {inviteUrl(room.code)}
            </p>
          </div>
          <button
            onClick={shareInvite}
            className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition active:scale-95"
          >
            {copied ? 'Copied ✓' : 'Share'}
          </button>
        </div>
      </div>

      <Link
        to={`/room/${room.id}/new-bet`}
        className={`${primaryBtnCls} mt-4 block text-center`}
      >
        ➕ New Bet
      </Link>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Open bets
        </h2>
        {openBets.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            No open bets yet. Start one! 👆
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {openBets.map((b) => (
              <BetCard key={b.id} bet={b} to={`/room/${room.id}/bet/${b.id}`} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Leaderboard
          </h2>
          <Link
            to={`/room/${room.id}/leaderboard`}
            className="text-sm font-semibold text-indigo-600"
          >
            View all ›
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {topMembers.map((m, i) => (
            <div
              key={m.id}
              className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-b-0"
            >
              <span className="font-medium">
                {medals[i]} {m.display_name}
                {m.user_id === userId && (
                  <span className="ml-1 text-xs text-slate-400">(you)</span>
                )}
              </span>
              <span className="font-bold text-amber-700">🪙 {coins(m.balance)}</span>
            </div>
          ))}
        </div>
      </section>

      {resolvedBets.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Resolved bets
          </h2>
          <div className="flex flex-col gap-3">
            {resolvedBets.map((b) => (
              <BetCard key={b.id} bet={b} to={`/room/${room.id}/bet/${b.id}`} />
            ))}
          </div>
        </section>
      )}
    </PageShell>
  )
}
