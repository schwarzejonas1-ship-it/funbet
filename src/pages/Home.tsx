import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { inputCls, primaryBtnCls } from '../components/ui'
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
      <div className="pt-14 pb-8 text-center">
        <div className="text-6xl">🎲</div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">FunBet</h1>
        <p className="mt-1 text-slate-500">
          Friendly bets with play money. No stakes, all bragging rights.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Link to="/create" className={`${primaryBtnCls} text-center`}>
          Create a Room
        </Link>
        {joining ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="text-sm font-medium text-slate-600">
              Paste an invite link or room code
            </label>
            <input
              className={`${inputCls} mt-2`}
              placeholder="e.g. abc123de"
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
          </div>
        ) : (
          <button
            onClick={() => setJoining(true)}
            className="w-full rounded-xl border border-slate-300 bg-white py-3 text-base font-semibold text-slate-700 shadow-sm transition active:scale-[0.98]"
          >
            Join a Room
          </button>
        )}
      </div>

      {rooms.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Your rooms
          </h2>
          <div className="flex flex-col gap-2">
            {rooms.map((r) => (
              <Link
                key={r.id}
                to={`/room/${r.id}`}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition active:scale-[0.99]"
              >
                <span className="font-semibold">{r.name}</span>
                <span className="text-slate-400">›</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
