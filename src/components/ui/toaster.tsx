// src/components/ui/toaster.tsx
'use client'

import { Toaster as HotToaster } from 'react-hot-toast'

export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: '8px',
          background: '#1e293b',
          color: '#f8fafc',
          fontSize: '13px',
          padding: '12px 16px',
        },
        success: {
          iconTheme: { primary: '#22c55e', secondary: '#fff' },
        },
        error: {
          duration: 5000,
          iconTheme: { primary: '#ef4444', secondary: '#fff' },
        },
      }}
    />
  )
}
