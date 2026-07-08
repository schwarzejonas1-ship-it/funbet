import { useParams } from 'react-router-dom'
import { PageShell, Spinner } from '../components/ui'
import { useRoomData } from '../hooks/useRoomData'
import { useUserId } from '../lib/auth'
import { coins } from '../lib/format'

const medals = ['🥇', '🥈', '🥉']

export default function Leaderboard() {
  const { roomId } = useParams<{ roomId: string }>()
  const userId = useUserId()
  const { room, members, loading } = useRoomData(roomId)

  if (loading || !room) return <Spinner />

  return (
    <PageShell title="Leaderboard" back={`/room/${roomId}`}>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {members.map((m, i) => {
          const profit = m.balance - room.starting_balance
          return (
            <div
              key={m.id}
              className={`flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 ${
                m.user_id === userId ? 'bg-indigo-50/60' : ''
              }`}
            >
              <span className="w-8 text-center text-lg">
                {medals[i] ?? <span className="text-sm text-slate-400">#{i + 1}</span>}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">
                {m.display_name}
                {m.user_id === userId && (
                  <span className="ml-1 text-xs text-slate-400">(you)</span>
                )}
              </span>
              <span className="text-right">
                <span className="block font-bold text-amber-700">
                  🪙 {coins(m.balance)}
                </span>
                <span
                  className={`block text-xs font-semibold ${
                    profit > 0
                      ? 'text-emerald-600'
                      : profit < 0
                        ? 'text-rose-500'
                        : 'text-slate-400'
                  }`}
                >
                  {profit > 0 ? '+' : ''}
                  {coins(profit)}
                </span>
              </span>
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-center text-xs text-slate-400">
        Ranked by current balance · coins staked on open bets aren't counted
        until the bet resolves
      </p>
    </PageShell>
  )
}
