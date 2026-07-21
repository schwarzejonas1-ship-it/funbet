import { supabase } from './supabase'
import type { Tables } from './database.types'

export type Room = Tables<'rooms'>
export type Member = Tables<'room_members'>
export type Bet = Tables<'bets'>
export type BetOption = Tables<'bet_options'>
export type Stake = Tables<'stakes'>
export type Notification = Tables<'notifications'>

export interface RoomPreview {
  id: string
  name: string
  starting_balance: number
  member_count: number
  already_member: boolean
}

function fail(message: string): never {
  throw new Error(message)
}

// ---- RPCs (all coin movement happens server-side, atomically) ----

export async function createRoom(
  name: string,
  startingBalance: number,
  displayName: string,
): Promise<Room> {
  const { data, error } = await supabase.rpc('create_room', {
    p_name: name,
    p_starting_balance: startingBalance,
    p_display_name: displayName,
  })
  if (error) fail(error.message)
  return data as unknown as Room
}

export async function getRoomPreview(code: string): Promise<RoomPreview> {
  const { data, error } = await supabase.rpc('get_room_preview', { p_code: code })
  if (error) fail(error.message)
  return data as unknown as RoomPreview
}

export async function joinRoom(
  code: string,
  displayName: string,
): Promise<{ room_id: string; room_name: string; member_id: string }> {
  const { data, error } = await supabase.rpc('join_room', {
    p_code: code,
    p_display_name: displayName,
  })
  if (error) fail(error.message)
  return data as unknown as { room_id: string; room_name: string; member_id: string }
}

export async function createBet(
  roomId: string,
  question: string,
  options: string[],
): Promise<Bet> {
  const { data, error } = await supabase.rpc('create_bet', {
    p_room_id: roomId,
    p_question: question,
    p_options: options,
  })
  if (error) fail(error.message)
  return data as unknown as Bet
}

export async function placeStake(
  betId: string,
  optionId: string,
  amount: number,
): Promise<Stake> {
  const { data, error } = await supabase.rpc('place_stake', {
    p_bet_id: betId,
    p_option_id: optionId,
    p_amount: amount,
  })
  if (error) fail(error.message)
  return data as unknown as Stake
}

export async function resolveBet(
  betId: string,
  winningOptionId: string,
): Promise<Bet> {
  const { data, error } = await supabase.rpc('resolve_bet', {
    p_bet_id: betId,
    p_winning_option_id: winningOptionId,
  })
  if (error) fail(error.message)
  return data as unknown as Bet
}

// ---- Reads (RLS scopes everything to rooms the user is a member of) ----

export async function fetchRoom(roomId: string): Promise<Room | null> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .maybeSingle()
  if (error) fail(error.message)
  return data
}

export async function fetchMembers(roomId: string): Promise<Member[]> {
  const { data, error } = await supabase
    .from('room_members')
    .select('*')
    .eq('room_id', roomId)
    .order('balance', { ascending: false })
    .order('joined_at', { ascending: true })
  if (error) fail(error.message)
  return data
}

export async function fetchBets(roomId: string): Promise<Bet[]> {
  const { data, error } = await supabase
    .from('bets')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
  if (error) fail(error.message)
  return data
}

export async function fetchBet(betId: string): Promise<Bet | null> {
  const { data, error } = await supabase
    .from('bets')
    .select('*')
    .eq('id', betId)
    .maybeSingle()
  if (error) fail(error.message)
  return data
}

export async function fetchStakes(betId: string): Promise<Stake[]> {
  const { data, error } = await supabase
    .from('stakes')
    .select('*')
    .eq('bet_id', betId)
    .order('created_at', { ascending: true })
  if (error) fail(error.message)
  return data
}

export async function fetchOptions(betId: string): Promise<BetOption[]> {
  const { data, error } = await supabase
    .from('bet_options')
    .select('*')
    .eq('bet_id', betId)
    .order('position', { ascending: true })
  if (error) fail(error.message)
  return data
}

/** All options for a set of bets, grouped by bet_id (for the room feed). */
export async function fetchOptionsForBets(
  betIds: string[],
): Promise<Record<string, BetOption[]>> {
  if (betIds.length === 0) return {}
  const { data, error } = await supabase
    .from('bet_options')
    .select('*')
    .in('bet_id', betIds)
    .order('position', { ascending: true })
  if (error) fail(error.message)
  const grouped: Record<string, BetOption[]> = {}
  for (const opt of data) {
    ;(grouped[opt.bet_id] ??= []).push(opt)
  }
  return grouped
}

export async function fetchNotifications(roomId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) fail(error.message)
  return data
}

export async function markAllNotificationsRead(roomId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('room_id', roomId)
    .eq('read', false)
  if (error) fail(error.message)
}
