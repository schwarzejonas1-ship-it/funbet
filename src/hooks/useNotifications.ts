import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchNotifications } from '../lib/api'
import type { Notification } from '../lib/api'

/** The current user's notifications for a room, kept live. */
export function useNotifications(roomId: string | undefined, userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const refresh = useCallback(async () => {
    if (!roomId) return
    try {
      setNotifications(await fetchNotifications(roomId))
    } catch {
      // non-critical; badge just stays stale until the next event
    }
  }, [roomId])

  useEffect(() => {
    void refresh()
    if (!roomId) return
    const channel = supabase
      .channel(`notifications-${roomId}-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => void refresh(),
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [roomId, userId, refresh])

  const unreadCount = notifications.filter((n) => !n.read).length
  return { notifications, unreadCount, refresh }
}
