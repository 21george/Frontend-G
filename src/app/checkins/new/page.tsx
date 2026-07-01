'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewCheckinPage() {
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link href="/checkins" className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-3 h-3" /> Back to Schedule
        </Link>

        <div className="relative bg-white dark:bg-[#1A1A1A] overflow-hidden rounded-2xl shadow-2xl border border-[var(--border)] dark:border-white/[0.08]">
          {/* Cal.com inline embed */}
          <div className="w-full h-full overflow-auto scrollbar-hide">
            <iframe
              className="cal-embed"
              name="cal-embed"
              title="Book a call"
              allow="payment"
              src="https://app.cal.com/dean-n89nvg/30min/embed?layout=month_view&theme=auto&embedType=inline&ui.color-scheme=light"
              style={{ height: '570px', width: '100%', border: 'none' }}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
