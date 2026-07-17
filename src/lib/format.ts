export function coins(n: number): string {
  return n.toLocaleString('en-US')
}

/** "Yes pays 1.8x" — total pool divided by that side's pool. */
export function payoutMultiple(sidePool: number, totalPool: number): string | null {
  if (sidePool <= 0 || totalPool <= 0) return null
  const x = totalPool / sidePool
  return `${x >= 10 ? x.toFixed(1) : x.toFixed(2)}x`
}

/** Share of the pool staked on a side, as a percentage (50 when empty). */
export function poolShare(sidePool: number, totalPool: number): number {
  if (totalPool <= 0) return 50
  return Math.round((sidePool / totalPool) * 100)
}

/** Estimated payout if `amount` is added to `sidePool` and that side wins. */
export function estimatePayout(
  amount: number,
  sidePool: number,
  totalPool: number,
): number {
  if (amount <= 0) return 0
  return Math.floor((amount * (totalPool + amount)) / (sidePool + amount))
}

export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function inviteUrl(code: string): string {
  // BASE_URL is '/' locally and '/funbet/' on GitHub Pages; it always ends with '/'
  return `${window.location.origin}${import.meta.env.BASE_URL}join/${code}`
}
