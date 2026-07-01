'use client'

import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  open: boolean
  onClose: () => void
  calLink?: string
}

export function ScheduleModal({ open, onClose, calLink = 'dean-n89nvg/30min' }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-white dark:bg-[#1A1A1A] overflow-hidden rounded-2xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Circular close button — reference: bg rgb(242,242,242), border-radius 90px */}
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={onClose}
                aria-label="Close"
                className="flex items-center justify-center w-10 h-10 rounded-full transition-transform hover:scale-105 active:scale-95"
                style={{ backgroundColor: 'rgb(242, 242, 242)' }}
              >
                <X size={18} className="text-black dark:text-black" />
              </button>
            </div>

            {/* Cal.com inline embed */}
            <div className="w-full h-full overflow-auto scrollbar-hide" style={{ maxHeight: '80vh' }}>
              <iframe
                className="cal-embed"
                name="cal-embed"
                title="Book a call"
                allow="payment"
                src={`https://app.cal.com/${calLink}/embed?layout=month_view&theme=auto&embedType=inline&ui.color-scheme=light`}
                style={{ height: '570px', width: '100%', border: 'none' }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
