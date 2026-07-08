import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ErrorText, Spinner, inputCls, primaryBtnCls } from '../components/ui'
import { getRoomPreview, joinRoom } from '../lib/api'
import type { RoomPreview } from '../lib/api'
import { coins } from '../lib/format'
import { addStoredRoom } from '../lib/rooms-storage'

export default function Join() {
  const { code } = useParams<{ code: string }>()
  const [preview, setPreview] = useState<RoomPreview | null>(null)
  const [displayName, setDisplayName] = useState(
    () => localStorage.getItem('funbet.lastName') ?? '',
  )
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!code) return
    getRoomPreview(code)
      .then((p) => {
        setPreview(p)
        if (p.already_member) {
          addStoredRoom({ id: p.id, code: code.toLowerCase(), name: p.name })
          navigate(`/room/${p.id}`, { replace: true })
        }
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [code, navigate])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code || !displayName.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await joinRoom(code, displayName.trim())
      localStorage.setItem('funbet.lastName', displayName.trim())
      addStoredRoom({ id: res.room_id, code: code.toLowerCase(), name: res.room_name })
      navigate(`/room/${res.room_id}`)
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  if (loading) return <Spinner />

  if (!preview) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
        <span className="text-4xl">🤔</span>
        <h1 className="text-lg font-bold">Room not found</h1>
        <p className="text-sm text-slate-600">
          This invite link doesn't match any room. Double-check it with whoever
          sent it to you.
        </p>
        <Link to="/" className="mt-2 font-semibold text-indigo-600">
          Go home
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4">
      <div className="pt-14 pb-6 text-center">
        <div className="text-5xl">🎟️</div>
        <p className="mt-4 text-sm font-medium uppercase tracking-wide text-slate-500">
          You're invited to
        </p>
        <h1 className="mt-1 text-2xl font-extrabold">{preview.name}</h1>
        <p className="mt-2 text-sm text-slate-500">
          {preview.member_count}{' '}
          {preview.member_count === 1 ? 'member' : 'members'} · start with 🪙{' '}
          {coins(preview.starting_balance)}
        </p>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          className={inputCls}
          placeholder="Your name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={40}
          autoFocus
        />
        <button
          type="submit"
          disabled={!displayName.trim() || busy}
          className={primaryBtnCls}
        >
          {busy ? 'Joining…' : 'Join Room'}
        </button>
        <ErrorText message={error} />
      </form>
    </div>
  )
}
