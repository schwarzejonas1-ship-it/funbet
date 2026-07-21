import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { inputCls, primaryBtnCls, secondaryBtnCls } from '../components/ui'
import { ChevronRightIcon, DiceIcon } from '../components/icons'
import { getStoredRooms } from '../lib/rooms-storage'

/** Accepts a bare room code or a full invite URL and extracts the code. */
function parseCode(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const seg = trimmed.includes('/')
    ? trimmed.split('/').filter(Boolean).pop()
    : trimmed
  return seg ? seg.toLowerCase() : null
}

export default function Home() {
  const [rooms] = useState(getStoredRooms)
  const [joining, setJoining] = useState(false)
  const [codeInput, setCodeInput] = useState('')
  const navigate = useNavigate()

  const goJoin = () => {
    const code = parseCode(codeInput)
    if (code) navigate(`/join/${code}`)
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 pb-12">
      <div className="pt-16 pb-8 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-brand/15 text-brand ring-1 ring-brand/25">
          <DiceIcon size={44} />
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">FunBet</h1>
        <p className="mt-1 text-muted">
          Friendly bets with play money. No stakes, all bragging rights.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Link to="/create" className={`${primaryBtnCls} text-center`}>
          Create a Room
        </Link>
        {joining ? (
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <label className="text-sm font-medium text-muted">
              Enter room code
            </label>
            <input
              className={`${inputCls} mt-2 text-center text-lg font-bold uppercase tracking-[0.3em] tabular`}
              placeholder="ABC123DE"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && goJoin()}
              autoFocus
            />
            <button
              onClick={goJoin}
              disabled={!parseCode(codeInput)}
              className={`${primaryBtnCls} mt-3`}
            >
              Continue
            </button>
            <p className="mt-2 text-center text-xs text-faint">
              You can paste a full invite link too.
            </p>
          </div>
        ) : (
          <button onClick={() => setJoining(true)} className={secondaryBtnCls}>
            Join a Room
          </button>
        )}
      </div>

      {rooms.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Your rooms
          </h2>
          <div className="flex flex-col gap-2">
            {rooms.map((r) => (
              <Link
                key={r.id}
                to={`/room/${r.id}`}
                className="flex items-center justify-between rounded-2xl border border-line bg-surface p-4 shadow-sm transition active:scale-[0.99] hover:border-brand/50"
              >
                <span className="font-semibold">{r.name}</span>
                <ChevronRightIcon size={20} className="text-faint" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
