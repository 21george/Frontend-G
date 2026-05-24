'use client'

import { Plus, Salad } from 'lucide-react'
import Link from 'next/link'
import type { NutritionPlan } from '@/types'
import { NutritionListCard } from '@/components/clients/NutritionListCard'

interface Props {
  clientId: string
  nutrition: NutritionPlan[] | undefined
  expandedPlan: string | null
  setExpandedPlan: (id: string | null) => void
}

export function ClientNutritionTab({ clientId, nutrition, expandedPlan, setExpandedPlan }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">Nutrition Plans</h3>
        <Link href={`/nutrition-plans/new?client=${clientId}`}
          className="flex items-center rounded-s-xl gap-1.5 px-3 py-1.5 text-[12px] font-semibold bg-brand-600 text-white transition-colors">
          <Plus size={13} /> New Plan
        </Link>
      </div>

      {(nutrition ?? []).length === 0 ? (
        <div className="dark:bg-transparent p-12 text-center">
          <Salad className="w-10 h-10 mx-auto mb-3 text-[var(--text-secondary)]" />
          <p className="text-[13px] text-[var(--text-tertiary)]">No nutrition plans yet</p>
        </div>
      ) : (
        (nutrition ?? []).map(plan => (
          <NutritionListCard
            key={plan.id}
            plan={plan}
            expanded={expandedPlan === plan.id}
            onToggle={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
          />
        ))
      )}
    </div>
  )
}
