import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ErrorText, PageShell, inputCls, optionColor, primaryBtnCls } from '../components/ui'
import { PlusIcon } from '../components/icons'
import { createBet } from '../lib/api'

type Mode = 'yesno' | 'multi'
const MAX_OPTIONS = 8

export default function NewBet() {
  const { roomId } = useParams<{ roomId: string }>()
  const [question, setQuestion] = useState('')
  const [mode, setMode] = useState<Mode>('yesno')
  const [options, setOptions] = useState<string[]>(['', ''])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const cleaned = options.map((o) => o.trim()).filter(Boolean)
  const distinct = new Set(cleaned.map((o) => o.toLowerCase())).size === cleaned.length
  const optionsValid = mode === 'yesno' || (cleaned.length >= 2 && distinct)
  const valid = question.trim() && optionsValid

  const setOption = (i: number, value: string) =>
    setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)))
  const addOption = () =>
    setOptions((prev) => (prev.length >= MAX_OPTIONS ? prev : [...prev, '']))
  const removeOption = (i: number) =>
    setOptions((prev) => (prev.length <= 2 ? prev : prev.filter((_, idx) => idx !== i)))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomId || !valid || busy) return
    setBusy(true)
    setError(null)
    try {
      const finalOptions = mode === 'yesno' ? ['Yes', 'No'] : cleaned
      const bet = await createBet(roomId, question.trim(), finalOptions)
      navigate(`/room/${roomId}/bet/${bet.id}`, { replace: true })
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  const tabCls = (active: boolean) =>
    `flex-1 rounded-lg py-2 text-sm font-semibold transition ${
      active ? 'bg-brand-strong text-white' : 'text-muted hover:text-content'
    }`

  return (
    <PageShell title="New Bet" back={`/room/${roomId}`}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium text-muted">
            What's the question?
          </label>
          <textarea
            className={`${inputCls} mt-1 resize-none`}
            rows={2}
            placeholder='e.g. "Who scores the first goal?"'
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={200}
            autoFocus
          />
        </div>

        <div>
          <label className="text-sm font-medium text-muted">Answer options</label>
          <div className="mt-1 flex gap-1 rounded-xl border border-line bg-surface p-1">
            <button type="button" onClick={() => setMode('yesno')} className={tabCls(mode === 'yesno')}>
              Yes / No
            </button>
            <button type="button" onClick={() => setMode('multi')} className={tabCls(mode === 'multi')}>
              Multiple options
            </button>
          </div>

          {mode === 'yesno' ? (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl border-2 border-yes/40 bg-yes-soft py-3 text-center font-bold text-yes">
                Yes
              </div>
              <div className="rounded-xl border-2 border-no/40 bg-no-soft py-3 text-center font-bold text-no">
                No
              </div>
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: optionColor(i) }}
                  />
                  <input
                    className={inputCls}
                    placeholder={`Option ${i + 1}${i === 0 ? ' (e.g. Marcus)' : ''}`}
                    value={opt}
                    onChange={(e) => setOption(i, e.target.value)}
                    maxLength={60}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      aria-label="Remove option"
                      className="shrink-0 rounded-lg px-2 py-2 text-faint transition hover:text-no"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {options.length < MAX_OPTIONS && (
                <button
                  type="button"
                  onClick={addOption}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-line py-2.5 text-sm font-semibold text-muted transition hover:border-brand/60 hover:text-content"
                >
                  <PlusIcon size={16} /> Add option
                </button>
              )}
            </div>
          )}
        </div>

        <button type="submit" disabled={!valid || busy} className={primaryBtnCls}>
          {busy ? 'Creating…' : 'Create Bet'}
        </button>
        <ErrorText message={error} />
        <p className="text-xs text-muted">
          Everyone in the room gets notified. You'll be the one to resolve it once
          the outcome is known.
        </p>
      </form>
    </PageShell>
  )
}
