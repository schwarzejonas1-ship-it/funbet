import type { SVGProps } from 'react'
import { coins as fmtCoins } from '../lib/format'

/**
 * Cohesive inline-SVG icon set. All use `currentColor` and a shared 1.75 stroke
 * so they theme automatically and sit consistently next to text.
 */
type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Svg({ size = 20, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export function DiceIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="8.5" cy="8.5" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="8.5" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="15.5" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="15.5" r="1.15" fill="currentColor" stroke="none" />
    </Svg>
  )
}

export function CoinIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <ellipse cx="12" cy="6.5" rx="7" ry="3" />
      <path d="M5 6.5v5c0 1.66 3.13 3 7 3s7-1.34 7-3v-5" />
      <path d="M5 11.5v5c0 1.66 3.13 3 7 3s7-1.34 7-3v-5" />
    </Svg>
  )
}

export function TrophyIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M17 5h2.5a2.5 2.5 0 0 1-2.5 3.5M7 5H4.5A2.5 2.5 0 0 0 7 8.5" />
      <path d="M12 13v3M9 20h6M10 20v-1.5a2 2 0 0 1 4 0V20" />
    </Svg>
  )
}

export function BellIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
      <path d="M10.5 19a1.5 1.5 0 0 0 3 0" />
    </Svg>
  )
}

export function PlusIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  )
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M15 6l-6 6 6 6" />
    </Svg>
  )
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 6l6 6-6 6" />
    </Svg>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 12.5l5 5 11-11" />
    </Svg>
  )
}

export function CopyIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M15 9V6.5A2.5 2.5 0 0 0 12.5 4h-6A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15H9" />
    </Svg>
  )
}

export function ShareIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" />
    </Svg>
  )
}

export function DoorIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 3H6v18h8M14 3l4 2v14l-4 2M14 3v18" />
      <path d="M11 12h.01" />
    </Svg>
  )
}

/** WhatsApp brand glyph (filled). Keep viewBox 0 0 24 24, uses currentColor. */
export function WhatsAppIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.38a9.86 9.86 0 0 0 4.73 1.2h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.8c2.16 0 4.18.84 5.71 2.37a8.03 8.03 0 0 1 2.37 5.72c0 4.46-3.63 8.09-8.09 8.09-1.5 0-2.96-.4-4.24-1.16l-.3-.18-3.14.82.84-3.06-.2-.31a8.02 8.02 0 0 1-1.24-4.29c0-4.46 3.63-8.09 8.09-8.09Zm-2.76 4.3c-.14 0-.36.05-.55.26-.19.21-.72.7-.72 1.71 0 1.01.74 1.99.84 2.12.1.14 1.44 2.29 3.58 3.12 1.78.7 2.14.56 2.53.53.39-.04 1.25-.51 1.43-1 .18-.49.18-.91.12-1-.05-.09-.19-.14-.4-.25-.21-.11-1.25-.62-1.44-.69-.19-.07-.33-.1-.47.1-.14.21-.54.69-.66.83-.12.14-.24.16-.45.05-.21-.11-.89-.33-1.7-1.05-.63-.56-1.05-1.25-1.17-1.46-.12-.21-.01-.32.09-.43.09-.1.21-.24.32-.37.11-.13.14-.22.21-.36.07-.14.04-.27-.02-.38-.06-.11-.46-1.14-.66-1.56-.16-.35-.33-.35-.47-.36l-.4-.01Z" />
    </svg>
  )
}

/** Coin amount, e.g. a chip glyph + formatted number. */
export function Coins({
  amount,
  className = '',
  size = 15,
}: {
  amount: number
  className?: string
  size?: number
}) {
  return (
    <span className={`inline-flex items-center gap-1 tabular ${className}`}>
      <CoinIcon size={size} className="text-gold" />
      {fmtCoins(amount)}
    </span>
  )
}
