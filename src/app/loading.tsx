export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-[#141414]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-cyan-950/20 border-t-cyan-950 rounded-full animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>
      </div>
    </div>
  )
}
