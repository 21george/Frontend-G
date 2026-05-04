'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ClientAvatarProps {
  /** Client name – used as alt text and for the initials fallback */
  name?: string | null
  /** URL of the profile photo; if absent, initials are shown */
  profile_photo_url?: string | null
  /** Pre-computed initials to display when there is no photo */
  initials?: string
  /** Size class string, e.g. "h-11 w-11" (default "h-11 w-11") */
  size?: string
}

export function ClientAvatar({ name, profile_photo_url, initials, size = 'h-11 w-11' }: ClientAvatarProps) {
  const [imgError, setImgError] = useState(false)

  if (profile_photo_url && !imgError) {
    return (
      <div className={`relative ${size} shrink-0 rounded-full overflow-hidden`}>
        <Image
          src={profile_photo_url}
          alt={name ?? 'Client'}
          fill
          className="object-cover"
          unoptimized
          onError={() => setImgError(true)}
        />
      </div>
    )
  }

  return (
    <div
      className={`flex ${size} items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white dark:bg-brand-500`}
      aria-label={name ?? 'Client'}
    >
      {initials ?? name?.[0]?.toUpperCase() ?? '?'}
    </div>
  )
}