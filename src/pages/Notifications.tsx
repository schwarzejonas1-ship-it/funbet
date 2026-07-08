import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageShell } from '../components/ui'
import { useNotifications } from '../hooks/useNotifications'
import { useUserId } from '../lib/auth'
import { markAllNotificationsRead } from '../lib/api'
import { timeAgo } from '../lib/format'

export default function Notifications() {
  const { roomId } = useParams<{ roomId: string }>()
  const userId = useUserId()
  const { notifications, refresh } = useNotifications(roomId, userId)

  useEffect(() => {
    if (!roomId) return
    // small delay so the unread state is visible for a beat before clearing
    const t = setTimeout(() => {
      void markAllNotificationsRead(roomId).then(refresh)
    }, 1500)
    return () => clearTimeout(t)
  }, [roomId, refresh])

  return (
    <PageShell title="Notifications" back={`/room/${roomId}`}>
      {notifications.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          Nothing yet. You'll see new bets and results here. 🔔
        </p>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {notifications.map((n) => {
            const inner = (
              <div className="flex items-start gap-3 px-4 py-3">
                <span className="mt-0.5 text-lg">
                  {n.type === 'bet_created' ? '🆕' : '🏁'}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm leading-snug ${
                      n.read ? 'text-slate-600' : 'font-semibold text-slate-900'
                    }`}
                  >
                    {n.message}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {timeAgo(n.created_at)}
                  </p>
                </div>
                {!n.read && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                )}
              </div>
            )
            return n.bet_id ? (
              <Link
                key={n.id}
                to={`/room/${roomId}/bet/${n.bet_id}`}
                className="block border-b border-slate-100 last:border-b-0 active:bg-slate-50"
              >
                {inner}
              </Link>
            ) : (
              <div key={n.id} className="border-b border-slate-100 last:border-b-0">
                {inner}
              </div>
            )
          })}
        </div>
      )}
    </PageShell>
  )
}
