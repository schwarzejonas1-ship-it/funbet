import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ErrorText, PageShell, primaryBtnCls } from '../components/ui'
import { createBet } from '../lib/api'

export default function NewBet() {
  const { roomId } = useParams<{ roomId: string }>()
  const [question, setQuestion] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomId || !question.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      const bet = await createBet(roomId, question.trim())
      navigate(`/room/${roomId}/bet/${bet.id}`, { replace: true })
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <PageShell title="New Bet" back={`/room/${roomId}`}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="text-sm font-medium text-slate-600">
          A yes/no question your friends can bet on
        </label>
        <textarea
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          rows={3}
          placeholder='e.g. "Marcus beats David at Catan tonight"'
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={200}
          autoFocus
        />
        <p className="-mt-1 text-right text-xs text-slate-400">
          {question.length}/200
        </p>
        <button type="submit" disabled={!question.trim() || busy} className={primaryBtnCls}>
          {busy ? 'Creating…' : 'Create Bet'}
        </button>
        <ErrorText message={error} />
        <p className="text-xs text-slate-500">
          Everyone in the room gets notified. You'll be the one to resolve it
          once the outcome is known.
        </p>
      </form>
    </PageShell>
  )
}
