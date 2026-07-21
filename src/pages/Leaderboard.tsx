import { useParams } from 'react-router-dom'
import { Card, PageShell, Spinner } from '../components/ui'
import { Coins } from '../components/icons'
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
      <Card>
        {members.map((m, i) => {
          const profit = m.balance - room.starting_balance
          return (
            <div
              key={m.id}
              className={`flex items-center gap-3 border-b border-line/60 px-4 py-3 last:border-b-0 ${
                m.user_id === userId ? 'bg-brand/10' : ''
              }`}
            >
              <span className="w-8 text-center text-lg">
                {medals[i] ?? <span className="tabular text-sm text-faint">#{i + 1}</span>}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">
                {m.display_name}
                {m.user_id === userId && (
                  <span className="ml-1 text-xs text-faint">(you)</span>
                )}
              </span>
              <span className="text-right">
                <span className="block font-bold text-gold">
                  <Coins amount={m.balance} size={15} />
                </span>
                <span
                  className={`tabular block text-xs font-semibold ${
                    profit > 0
                      ? 'text-yes'
                      : profit < 0
                        ? 'text-no'
                        : 'text-faint'
                  }`}
                >
                  {profit > 0 ? '+' : ''}
                  {coins(profit)}
                </span>
              </span>
            </div>
          )
        })}
      </Card>
      <p className="mt-3 text-center text-xs text-faint">
        Ranked by current balance · coins staked on open bets aren't counted
        until the bet resolves
      </p>
    </PageShell>
  )
}
