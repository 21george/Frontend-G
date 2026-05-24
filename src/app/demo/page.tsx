'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { ServerManagementTable } from '@/components/ui/server-management-table'

export default function DemoPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Component Demo</h1>
        <ServerManagementTable />
      </div>
    </DashboardLayout>
  )
}
