'use client'

import { useEffect } from "react";
import * as Sentry from '@sentry/nextjs'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body className="bg-[#060d10] text-white flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Critical Error</h2>
          <p className="text-white/60 mb-4">An unexpected error occurred.</p>
          <button
            onClick={reset}
            className="px-4 py-2 bg-[#a3e635] text-[#0a1114] rounded-lg font-bold"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
