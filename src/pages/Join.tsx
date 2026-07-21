import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CenteredMessage, ErrorText, Spinner, inputCls, primaryBtnCls } from '../components/ui'
import { Coins, DoorIcon } from '../components/icons'
import { getRoomPreview, joinRoom } from '../lib/api'
import type { RoomPreview } from '../lib/api'
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
      <CenteredMessage
        icon={<DoorIcon size={40} />}
        title="Room not found"
        action={
          <Link to="/" className="font-semibold text-brand">
            Go home
          </Link>
        }
      >
        This invite link or code doesn't match any room. Double-check it with
        whoever sent it to you.
      </CenteredMessage>
    )
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4">
      <div className="pt-16 pb-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/15 text-brand ring-1 ring-brand/25">
          <DoorIcon size={34} />
        </div>
        <p className="mt-4 text-sm font-medium uppercase tracking-wide text-muted">
          You're invited to
        </p>
        <h1 className="mt-1 text-2xl font-extrabold">{preview.name}</h1>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-muted">
          {preview.member_count}{' '}
          {preview.member_count === 1 ? 'member' : 'members'} · start with{' '}
          <Coins amount={preview.starting_balance} size={14} />
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
