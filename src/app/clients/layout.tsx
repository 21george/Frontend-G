'use client'

import { AuthLayout } from '@/components/layout/AuthLayout'
import { User, Upload } from 'lucide-react'
import { useState } from 'react'
import { CreateClientModal } from './CreateClientModal'
import { ImportClientsModal } from './ImportClientsModal'
import { useQueryClient } from '@tanstack/react-query'

export default function Layout({ children }: { children: React.ReactNode }) {
  const [showCreate, setShowCreate] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const queryClient = useQueryClient()

  const quickActions = [
    {
      label: 'Add Client',
      icon: User,
      color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50',
      onClick: () => setShowCreate(true),
    },
    {
      label: 'Import Clients',
      icon: Upload,
      color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50',
      onClick: () => setShowImport(true),
    },
  ]

  return (
    <AuthLayout showHeader={true} quickActions={quickActions}>
      {children}

      <CreateClientModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['clients'] })
          queryClient.invalidateQueries({ queryKey: ['all-clients'] })
        }}
      />

      <ImportClientsModal
        open={showImport}
        onClose={() => setShowImport(false)}
      />
    </AuthLayout>
  )
}
