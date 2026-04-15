'use client'

import Link from 'next/link'
import { Mail, Phone, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Client } from '@/types'

interface ClientCardProps {
  client: Client
  href?: string
}

export function ClientCard({ client, href }: ClientCardProps) {
  const link = href ?? `/clients/${client.id}`

  return (
    <Link
      href={link}
      className="bg-white dark:bg-[#171717] border border-slate-200/80 dark:border-white/[0.07] p-3 hover:border-slate-300 dark:hover:border-white/20 transition-colors block"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2.5">
        {client.profile_photo_url ? (
          <img
            src={client.profile_photo_url}
            alt={client.name}
            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-800 to-cyan-950 flex items-center justify-center text-[12px] font-semibold text-white flex-shrink-0">
            {client.name[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-semibold text-slate-900 dark:text-white truncate">{client.name}</div>
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[10px] mt-0.5">
            <Mail size={10} className="text-slate-400 dark:text-slate-500" />
            <span className="truncate">{client.email || 'No email'}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 py-1.5 border-t border-b border-slate-100 dark:border-white/[0.06] mb-2">
        <div className={`flex items-center gap-1 text-[11px] ${client.active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {client.active ? 'Active' : 'Inactive'}
        </div>
        {client.phone && (
          <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
            <Phone size={11} />
            {client.phone}
          </div>
        )}
      </div>

      {/* Language */}
      <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-600 mb-1.5">
        <span className="uppercase">{client.language}</span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] text-slate-400 dark:text-slate-600 flex items-center gap-1">
          <Calendar size={10} />
          {formatDate(client.created_at, 'MMM yyyy')}
        </span>
      </div>
    </Link>
  )
}
