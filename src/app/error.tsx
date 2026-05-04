'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-page)]">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Something went wrong</h2>
        <p className="text-[var(--text-secondary)] mb-4">An unexpected error occurred. Please try again.</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
