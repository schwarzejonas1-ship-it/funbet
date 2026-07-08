export interface StoredRoom {
  id: string
  code: string
  name: string
}

const KEY = 'funbet.rooms'

export function getStoredRooms(): StoredRoom[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as StoredRoom[]) : []
  } catch {
    return []
  }
}

export function addStoredRoom(room: StoredRoom): void {
  const rooms = getStoredRooms().filter((r) => r.id !== room.id)
  rooms.unshift(room)
  localStorage.setItem(KEY, JSON.stringify(rooms))
}

export function removeStoredRoom(roomId: string): void {
  localStorage.setItem(
    KEY,
    JSON.stringify(getStoredRooms().filter((r) => r.id !== roomId)),
  )
}
