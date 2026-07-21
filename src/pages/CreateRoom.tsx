import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ErrorText, PageShell, inputCls, primaryBtnCls } from '../components/ui'
import { createRoom } from '../lib/api'
import { addStoredRoom } from '../lib/rooms-storage'

export default function CreateRoom() {
  const [name, setName] = useState('')
  const [displayName, setDisplayName] = useState(
    () => localStorage.getItem('funbet.lastName') ?? '',
  )
  const [startingBalance, setStartingBalance] = useState('1000')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const balance = parseInt(startingBalance, 10) || 0
  const valid = name.trim() && displayName.trim() && balance >= 1

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid || busy) return
    setBusy(true)
    setError(null)
    try {
      const room = await createRoom(name.trim(), balance, displayName.trim())
      localStorage.setItem('funbet.lastName', displayName.trim())
      addStoredRoom({ id: room.id, code: room.code, name: room.name })
      navigate(`/room/${room.id}?invite=1`)
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <PageShell title="Create a Room" back="/">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium text-muted">Room name</label>
          <input
            className={`${inputCls} mt-1`}
            placeholder="e.g. Board Game Night"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            autoFocus
          />
        </div>
        <div>
          <label className="text-sm font-medium text-muted">Your name</label>
          <input
            className={`${inputCls} mt-1`}
            placeholder="e.g. Jonas"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={40}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-muted">
            Starting coins per member
          </label>
          <input
            className={`${inputCls} mt-1`}
            type="number"
            inputMode="numeric"
            min={1}
            value={startingBalance}
            onChange={(e) => setStartingBalance(e.target.value)}
          />
          <p className="mt-1 text-xs text-faint">
            Everyone who joins starts with this balance.
          </p>
        </div>
        <button type="submit" disabled={!valid || busy} className={primaryBtnCls}>
          {busy ? 'Creating…' : 'Create Room 🎉'}
        </button>
        <ErrorText message={error} />
      </form>
    </PageShell>
  )
}
