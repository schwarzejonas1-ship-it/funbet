import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchBets, fetchMembers, fetchOptionsForBets, fetchRoom } from '../lib/api'
import type { Bet, BetOption, Member, Room } from '../lib/api'

/**
 * Room, members (sorted by balance), bets and each bet's options, kept live via
 * a room-scoped realtime channel. Any change triggers a refetch — simple and
 * always consistent.
 */
export function useRoomData(roomId: string | undefined) {
  const [room, setRoom] = useState<Room | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [bets, setBets] = useState<Bet[]>([])
  const [optionsByBet, setOptionsByBet] = useState<Record<string, BetOption[]>>({})
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!roomId) return
    try {
      const r = await fetchRoom(roomId)
      if (!r) {
        setNotFound(true)
        setLoading(false)
        return
      }
      const [m, b] = await Promise.all([fetchMembers(roomId), fetchBets(roomId)])
      const opts = await fetchOptionsForBets(b.map((bet) => bet.id))
      setRoom(r)
      setMembers(m)
      setBets(b)
      setOptionsByBet(opts)
      setNotFound(false)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [roomId])

  useEffect(() => {
    setLoading(true)
    void refresh()
    if (!roomId) return
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bets', filter: `room_id=eq.${roomId}` },
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
  }, [roomId, refresh])

  return { room, members, bets, optionsByBet, loading, notFound, error, refresh }
}
