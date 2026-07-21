import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchBet, fetchMembers, fetchOptions, fetchStakes } from '../lib/api'
import type { Bet, BetOption, Member, Stake } from '../lib/api'

/** A single bet with its options, stakes and the room's members, kept live. */
export function useBetData(roomId: string | undefined, betId: string | undefined) {
  const [bet, setBet] = useState<Bet | null>(null)
  const [options, setOptions] = useState<BetOption[]>([])
  const [stakes, setStakes] = useState<Stake[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!roomId || !betId) return
    try {
      const [b, o, s, m] = await Promise.all([
        fetchBet(betId),
        fetchOptions(betId),
        fetchStakes(betId),
        fetchMembers(roomId),
      ])
      if (!b) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setBet(b)
      setOptions(o)
      setStakes(s)
      setMembers(m)
      setNotFound(false)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [roomId, betId])

  useEffect(() => {
    setLoading(true)
    void refresh()
    if (!roomId || !betId) return
    const channel = supabase
      .channel(`bet-${betId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bets', filter: `id=eq.${betId}` },
        () => void refresh(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stakes', filter: `bet_id=eq.${betId}` },
        () => void refresh(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bet_options', filter: `bet_id=eq.${betId}` },
        () => void refresh(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_members', filter: `room_id=eq.${roomId}` },
        () => void refresh(),
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [roomId, betId, refresh])

  return { bet, options, stakes, members, loading, notFound, error, refresh }
}
