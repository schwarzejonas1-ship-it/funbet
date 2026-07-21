import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  BalancePill,
  BetCard,
  Card,
  CenteredMessage,
  ErrorText,
  NotificationBell,
  PageShell,
  SectionHeading,
  Spinner,
  primaryBtnCls,
} from '../components/ui'
import {
  CheckIcon,
  ChevronRightIcon,
  Coins,
  CopyIcon,
  DoorIcon,
  PlusIcon,
  ShareIcon,
  WhatsAppIcon,
} from '../components/icons'
import { useRoomData } from '../hooks/useRoomData'
import { useNotifications } from '../hooks/useNotifications'
import { useUserId } from '../lib/auth'
import { displayCode, inviteUrl, roomInviteText, whatsappShareUrl } from '../lib/format'
import { addStoredRoom, removeStoredRoom } from '../lib/rooms-storage'

const medals = ['🥇', '🥈', '🥉']

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>()
  const [searchParams] = useSearchParams()
  const userId = useUserId()
  const navigate = useNavigate()
  const { room, members, bets, loading, notFound, error } = useRoomData(roomId)
  const { unreadCount } = useNotifications(roomId, userId)
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  const me = members.find((m) => m.user_id === userId)
  const showInviteBanner = searchParams.get('invite') === '1'

  useEffect(() => {
    if (room) addStoredRoom({ id: room.id, code: room.code, name: room.name })
  }, [room])

  if (loading) return <Spinner />

  if (notFound || !room) {
    return (
      <CenteredMessage
        icon={<DoorIcon size={40} />}
        title="Room unavailable"
        action={
          <button
            onClick={() => {
              if (roomId) removeStoredRoom(roomId)
              navigate('/')
            }}
            className="font-semibold text-brand"
          >
            Back to home
          </button>
        }
      >
        This room doesn't exist or you're not a member on this device. Ask for an
        invite code to join.
      </CenteredMessage>
    )
  }

  const copy = async (what: 'code' | 'link', value: string) => {
    await navigator.clipboard.writeText(value)
    setCopied(what)
    setTimeout(() => setCopied(null), 2000)
  }

  const shareLink = async () => {
    const url = inviteUrl(room.code)
    if (navigator.share) {
      try {
        await navigator.share({ title: `Join "${room.name}" on FunBet`, url })
        return
      } catch {
        // share sheet cancelled — fall through to copy
      }
    }
    await copy('link', url)
  }

  const openBets = bets.filter((b) => b.status === 'open')
  const resolvedBets = bets.filter((b) => b.status !== 'open')
  const topMembers = members.slice(0, 3)

  return (
    <PageShell
      title={room.name}
      back="/"
      right={
        <div className="flex items-center gap-2">
          {me && <BalancePill amount={me.balance} />}
          <NotificationBell to={`/room/${room.id}/notifications`} count={unreadCount} />
        </div>
      }
    >
      <ErrorText message={error} />

      {/* Invite card — lead with the big shareable code */}
      <Card className={showInviteBanner ? 'ring-1 ring-brand/40' : ''}>
        <div className="p-4">
          {showInviteBanner && (
            <p className="mb-3 text-sm font-semibold text-brand">
              🎉 Room created! Share the code so friends can join:
            </p>
          )}
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Room code
          </p>
          <div className="mt-1.5 flex items-center gap-3">
            <span className="tabular text-3xl font-extrabold tracking-[0.2em] text-content">
              {displayCode(room.code)}
            </span>
            <button
              onClick={() => copy('code', displayCode(room.code))}
              aria-label="Copy code"
              className="ml-auto flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-sm font-semibold text-muted transition hover:text-content"
            >
              {copied === 'code' ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
              {copied === 'code' ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <a
              href={whatsappShareUrl(roomInviteText(room.name, room.code))}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-whatsapp py-2.5 text-sm font-semibold text-ink transition active:scale-[0.98]"
            >
              <WhatsAppIcon size={18} />
              WhatsApp
            </a>
            <button
              onClick={shareLink}
              className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface-2 py-2.5 text-sm font-semibold text-content transition active:scale-[0.98] hover:border-brand/60"
            >
              {copied === 'link' ? <CheckIcon size={18} /> : <ShareIcon size={18} />}
              {copied === 'link' ? 'Copied' : 'Share link'}
            </button>
          </div>
        </div>
      </Card>

      <Link
        to={`/room/${room.id}/new-bet`}
        className={`${primaryBtnCls} mt-4 flex items-center justify-center gap-2`}
      >
        <PlusIcon size={20} /> New Bet
      </Link>

      <section className="mt-6">
        <SectionHeading>Open bets</SectionHeading>
        {openBets.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
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
        <SectionHeading
          action={
            <Link
              to={`/room/${room.id}/leaderboard`}
              className="flex items-center text-sm font-semibold text-brand"
            >
              View all <ChevronRightIcon size={16} />
            </Link>
          }
        >
          Leaderboard
        </SectionHeading>
        <Card>
          {topMembers.map((m, i) => (
            <div
              key={m.id}
              className="flex items-center justify-between border-b border-line/60 px-4 py-3 last:border-b-0"
            >
              <span className="font-medium">
                <span className="mr-1">{medals[i]}</span>
                {m.display_name}
                {m.user_id === userId && (
                  <span className="ml-1 text-xs text-faint">(you)</span>
                )}
              </span>
              <span className="font-bold text-gold">
                <Coins amount={m.balance} size={15} />
              </span>
            </div>
          ))}
        </Card>
      </section>

      {resolvedBets.length > 0 && (
        <section className="mt-6">
          <SectionHeading>Resolved bets</SectionHeading>
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
