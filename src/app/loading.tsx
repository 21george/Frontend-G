export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--bg-subtle)] dark:bg-[var(--bg-subtle)]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-brand-600/20 border-t-brand-600 animate-spin rounded-full" />
        <p className="text-sm text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">Loading...</p>
      </div>
    </div>
  )
}
