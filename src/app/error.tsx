'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060d10]">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
        <p className="text-white/60 mb-4">An unexpected error occurred. Please try again.</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-[#a3e635] text-[#0a1114] rounded-lg font-bold transition-opacity hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
