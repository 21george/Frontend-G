'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { useCheckins, useClients, useCreateCheckin, useUpdateCheckin, useDeleteCheckin } from '@/lib/hooks'
import { useState, useMemo } from 'react'
import { Plus, Search } from 'lucide-react'
import { format } from 'date-fns'
import type { CheckinMeeting } from '@/types'
import { motion } from 'framer-motion'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  MiniCalendar, EventTypeFilter, TodaysSchedule,
  MonthView,
  EventDetailModal, CreateEventModal, RescheduleModal,
} from '@/components/checkins'
import { BRAND } from '@/lib/constants'

const ACCENT = BRAND.DEFAULT
const ACCENT_HOVER = BRAND.dark

export default function SchedulePage() {
  const { data: checkins } = useCheckins()
  const { data: clientsData } = useClients()
  const createCheckin = useCreateCheckin()
  const updateCheckin = useUpdateCheckin()
  const deleteCheckin = useDeleteCheckin()
  const clients = clientsData?.data ?? []
  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients])

  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selected, setSelected] = useState<CheckinMeeting | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(['video', 'call', 'chat']))

  const [formLoading, setFormLoading] = useState(false)
  const [rescheduling, setRescheduling] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)

  const filteredEvents = useMemo(() => {
    let list = checkins ?? []
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(c => {
        const client = clientMap.get(c.client_id)
        return (
          client?.name?.toLowerCase().includes(q) ||
          c.type?.toLowerCase().includes(q) ||
          c.notes?.toLowerCase().includes(q)
        )
      })
    }
    if (selectedTypes.size > 0 && selectedTypes.size < 3) {
      list = list.filter(c => selectedTypes.has(c.type))
    }
    return list
  }, [checkins, searchQuery, clientMap, selectedTypes])

  const handleToggleType = (type: string) => {
    const newTypes = new Set(selectedTypes)
    if (newTypes.has(type)) {
      if (newTypes.size > 1) newTypes.delete(type)
    } else {
      newTypes.add(type)
    }
    setSelectedTypes(newTypes)
  }

  const handleCreate = async (data: {
    client_id: string
    scheduled_at: string
    type: 'video' | 'call' | 'chat'
    meeting_link: string
    notes: string
  }) => {
    setFormLoading(true)
    try {
      await createCheckin.mutateAsync({
        client_id: data.client_id,
        scheduled_at: data.scheduled_at,
        type: data.type,
        meeting_link: data.meeting_link,
        notes: data.notes,
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleReschedule = async (id: string, scheduled_at: string) => {
    setRescheduling(true)
    try {
      await updateCheckin.mutateAsync({ id, scheduled_at })
      setSelected(null)
    } finally {
      setRescheduling(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col min-h-screen bg-[#FDFBF7] dark:bg-[#121212]">

        {/* ═══════════ HEADER ═══════════ */}
        <header className="relative px-6 sm:px-10 pt-8 pb-6 bg-[#FDFBF7] dark:bg-[#121212]">
          <div />

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div className="space-y-1">
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f4f3f2] dark:text-[#f0eeec]"
              >
                {format(selectedDate, 'EEEE')}
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="text-4xl sm:text-5xl font-serif font-medium text-[#1A1A1A] dark:text-[#f0efee] tracking-tight leading-none"
              >
                {format(selectedDate, 'MMMM')}{' '}
                <span className="italic text-[#C65D3B]">{format(selectedDate, 'yyyy')}</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.12 }}
                className="text-sm text-[#fcfcfc] dark:text-[#A89B8C] pt-1"
              >
                {format(selectedDate, 'd MMMM yyyy')} &mdash; {filteredEvents.length} scheduled
              </motion.p>
            </div>
          </div>
        </header>

        {/* ═══════════ MAIN ═══════════ */}
        <div className="flex flex-1 overflow-hidden px-6 sm:px-10 pb-8">
          <div className="flex-1 flex flex-col gap-8 overflow-auto">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-shrink-0">
                <MiniCalendar
                  selectedDate={selectedDate}
                  onSelectDate={(date) => { setSelectedDate(date); setSelected(null) }}
                  checkins={checkins ?? []}
                />
              </div>

              <div className="flex-1">
                <EventTypeFilter
                  selectedTypes={selectedTypes}
                  onToggleType={handleToggleType}
                  checkins={checkins ?? []}
                />
              </div>

              <div className="flex-shrink-0">
                <TodaysSchedule
                  checkins={checkins ?? []}
                  clientMap={clientMap}
                  onSelectEvent={setSelected}
                />
              </div>
            </div>

            <div className="flex-1">
              <MonthView
                selectedDate={selectedDate}
                onSelectDate={(date) => { setSelectedDate(date); setSelected(null) }}
                checkins={checkins ?? []}
                clientMap={clientMap}
                filteredEvents={filteredEvents}
              />
            </div>
          </div>
        </div>

        <EventDetailModal
          selected={selected}
          clientMap={clientMap}
          onClose={() => setSelected(null)}
          onReschedule={() => {
            if (selected?.scheduled_at) {
              setShowRescheduleModal(true)
            }
          }}
          onCancel={() => setShowCancelConfirm(true)}
          isDeleting={deleteCheckin.isPending}
        />

        <CreateEventModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          selectedDate={selectedDate}
          clients={clients}
          onSubmit={handleCreate}
          isLoading={formLoading}
        />

        <RescheduleModal
          isOpen={showRescheduleModal}
          onClose={() => setShowRescheduleModal(false)}
          selected={selected}
          onUpdate={handleReschedule}
          isLoading={rescheduling}
        />

        <ConfirmDialog
          open={showCancelConfirm}
          onClose={() => setShowCancelConfirm(false)}
          onConfirm={() => {
            if (!selected?.id) return
            deleteCheckin.mutate(selected.id, {
              onSuccess: () => {
                setShowCancelConfirm(false)
                setSelected(null)
              },
              onError: () => {
                setShowCancelConfirm(false)
              },
            })
          }}
          title="Cancel check-in?"
          message="Are you sure you want to cancel this check-in? This action cannot be undone."
          confirmLabel="Yes, cancel it"
          variant="danger"
          loading={deleteCheckin.isPending}
        />
      </div>
    </DashboardLayout>
  )
}
