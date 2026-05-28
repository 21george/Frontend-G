'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  MapPin, Dumbbell, X, Loader2, RefreshCw, Navigation,
  Search, SlidersHorizontal, Building2, Trees,
  Bookmark, Star, Phone, Clock, ArrowUpRight,
  LocateFixed, Filter,
} from 'lucide-react'
import { useNearbyGyms, Gym, GymType } from '@/hooks/useNearbyGyms'
import { motion, AnimatePresence } from 'framer-motion'

function formatDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`
}

/* ── Filter State ─────────────────────────────────────────────── */

type FilterType = 'all' | 'gym' | 'fitness_centre' | 'outdoor'
type SortBy = 'distance' | 'name'

/* ── Gym Images (placeholder art direction) ─────────────────── */

const GYM_IMAGES = [
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1574680096141-1cddd32e04ca?w=400&h=300&fit=crop',
]

function gymImage(index: number): string {
  return GYM_IMAGES[index % GYM_IMAGES.length]
}

/* ── Category Icons & Labels ─────────────────────────────────── */

const categoryIcons: Record<GymType, React.ReactNode> = {
  'gym':            <Dumbbell  className="w-3 h-3" />,
  'fitness_centre': <Building2 className="w-3 h-3" />,
  'outdoor':        <Trees     className="w-3 h-3" />,
}

const categoryLabel: Record<GymType, string> = {
  'gym':            'Gym',
  'fitness_centre': 'Fitness Centre',
  'outdoor':        'Outdoor',
}

const categoryColor: Record<GymType, string> = {
  'gym':            'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  'fitness_centre': 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300',
  'outdoor':        'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
}

/* ── Map Component ────────────────────────────────────────────── */

function GymMap({
  gyms,
  userLocation,
  hoveredGymId,
  onHoverGym,
}: {
  gyms: Gym[]
  userLocation: { lat: number; lon: number } | null
  hoveredGymId: string | null
  onHoverGym: (id: string | null) => void
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = mapRef.current
    if (!el) return
    const obs = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect
      setMapSize({ width: cr.width, height: cr.height })
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  if (!userLocation) {
    return (
      <div className="absolute inset-0 bg-[#F5F7F6] dark:bg-white/[0.04] flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-10 h-10 mx-auto mb-3 text-[#2A96AD]/40" />
          <p className="text-sm text-[#6B7B75] dark:text-[#A1A1AA]">Enable location to see studios nearby</p>
        </div>
      </div>
    )
  }

  const allPoints = [
    { lat: userLocation.lat, lon: userLocation.lon },
    ...gyms.map((g) => g.location),
  ]

  const minLat = Math.min(...allPoints.map((p) => p.lat))
  const maxLat = Math.max(...allPoints.map((p) => p.lat))
  const minLon = Math.min(...allPoints.map((p) => p.lon))
  const maxLon = Math.max(...allPoints.map((p) => p.lon))

  const latRange = Math.max(maxLat - minLat, 0.005)
  const lonRange = Math.max(maxLon - minLon, 0.005)

  const padding = 0.25
  const adjMinLat = minLat - latRange * padding
  const adjMaxLat = maxLat + latRange * padding
  const adjMinLon = minLon - lonRange * padding
  const adjMaxLon = maxLon + lonRange * padding

  const adjLatRange = adjMaxLat - adjMinLat
  const adjLonRange = adjMaxLon - adjMinLon

  const project = (lat: number, lon: number) => ({
    x: ((lon - adjMinLon) / adjLonRange) * mapSize.width,
    y: ((adjMaxLat - lat) / adjLatRange) * mapSize.height,
  })

  const center = project(userLocation.lat, userLocation.lon)

  return (
    <div ref={mapRef} className="absolute inset-0 bg-[#E8EDEA] overflow-hidden">
      {/* Abstract map grid */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.08]">
        <defs>
          <pattern id="mapGrid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#1A3C34" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#mapGrid)" />
      </svg>

      {/* Decorative park/water shapes */}
      <div className="absolute top-[15%] left-[20%] w-32 h-24 bg-[#2A96AD]/[0.06] rounded-[40%_60%_50%_50%] blur-xl" />
      <div className="absolute bottom-[25%] right-[15%] w-40 h-32 bg-[#2A96AD]/[0.04] rounded-[50%_40%_60%_50%] blur-xl" />
      <div className="absolute top-[60%] left-[55%] w-24 h-20 bg-[#D4A574]/[0.05] rounded-[45%_55%_40%_60%] blur-xl" />

      {/* Roads (decorative lines) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.12]">
        <line x1="10%" y1="30%" x2="90%" y2="45%" stroke="#1A3C34" strokeWidth="1.5" />
        <line x1="25%" y1="80%" x2="70%" y2="20%" stroke="#1A3C34" strokeWidth="1" />
        <line x1="40%" y1="10%" x2="55%" y2="90%" stroke="#1A3C34" strokeWidth="0.8" />
        <line x1="5%" y1="60%" x2="85%" y2="70%" stroke="#1A3C34" strokeWidth="1.2" />
      </svg>

      {/* Street names (decorative) */}
      <span className="absolute top-[28%] left-[42%] text-[9px] text-[#1A3C34]/20 font-medium tracking-wide rotate-[-8deg]">
        Oak St
      </span>
      <span className="absolute top-[52%] left-[28%] text-[9px] text-[#1A3C34]/20 font-medium tracking-wide rotate-[12deg]">
        Fitness Ave
      </span>
      <span className="absolute top-[68%] right-[22%] text-[9px] text-[#1A3C34]/20 font-medium tracking-wide rotate-[-4deg]">
        Wellness Blvd
      </span>

      {/* Gym markers */}
      <AnimatePresence>
        {gyms.map((gym, i) => {
          const pos = project(gym.location.lat, gym.location.lon)
          const isHovered = hoveredGymId === gym.id
          return (
            <motion.div
              key={gym.id}
              initial={{ scale: 0, opacity: 0, y: 10 }}
              animate={{
                scale: isHovered ? 1.3 : 1,
                opacity: 1,
                y: 0,
                zIndex: isHovered ? 50 : 10 + i,
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 300, damping: 20 }}
              className="absolute cursor-pointer"
              style={{ left: pos.x - 18, top: pos.y - 40 }}
              onMouseEnter={() => onHoverGym(gym.id)}
              onMouseLeave={() => onHoverGym(null)}
            >
              {/* Pin shape */}
              <div className="relative flex flex-col items-center">
                <div
                  className={`
                    w-9 h-9 rounded-full flex items-center justify-center shadow-lg
                    transition-all duration-300
                    ${isHovered
                      ? 'bg-[#2A96AD] shadow-[#2A96AD]/30 scale-110'
                      : 'bg-[#1A3C34] shadow-black/20'}
                  `}
                >
                  <Dumbbell className="w-4 h-4 text-white" />
                </div>
                {/* Pin tail */}
                <div
                  className={`
                    w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px]
                    border-l-transparent border-r-transparent
                    transition-colors duration-300
                    ${isHovered ? 'border-t-[#2A96AD]' : 'border-t-[#1A3C34]'}
                  `}
                />

                {/* Tooltip */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.9 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full mb-2 whitespace-nowrap bg-white shadow-xl rounded-lg px-3 py-2 z-50"
                    >
                      <p className="text-xs font-semibold text-[#1A3C34]">{gym.name}</p>
                      <p className="text-[10px] text-[#6B7B75] dark:text-[#A1A1AA]">{formatDistance(gym.distance)}</p>
                      <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-white rotate-45" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* User location marker */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.4, type: 'spring' }}
        className="absolute"
        style={{ left: center.x - 10, top: center.y - 10 }}
      >
        <div className="relative">
          <div className="w-5 h-5 bg-[#2A96AD] rounded-full ring-[3px] ring-[#2A96AD]/30 animate-pulse" />
          <div className="absolute -inset-2 bg-[#2A96AD]/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
        </div>
      </motion.div>
    </div>
  )
}

/* ── Gym Card ─────────────────────────────────────────────────── */

function GymCard({
  gym,
  index,
  isHovered,
  isSaved,
  onToggleSave,
  onHover,
}: {
  gym: Gym
  index: number
  isHovered: boolean
  isSaved: boolean
  onToggleSave: () => void
  onHover: () => void
}) {
  const img = gymImage(index)
  const [imgError, setImgError] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: 'easeOut' }}
      onMouseEnter={onHover}
      className={`
        group relative bg-white dark:bg-[#1A1A1A] rounded-xl overflow-hidden border transition-all duration-300 cursor-pointer
        ${isHovered
          ? 'border-[#2A96AD]/40 shadow-lg shadow-[#2A96AD]/10 -translate-y-1'
          : 'border-[#E2E8E4] dark:border-white/[0.06] shadow-sm hover:shadow-md'}
      `}
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        {imgError ? (
          <div className="w-full h-full flex items-center justify-center bg-[#E8EDEA] dark:bg-[#1E1E1E]">
            <Dumbbell className="w-10 h-10 text-[#6B7B75] dark:text-[#A1A1AA]" />
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={gym.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-md text-[11px] font-semibold text-[#1A3C34] flex items-center gap-1">
            <Star className="w-3 h-3 text-[#D4A574] fill-[#D4A574]" />
            4.{(index % 5) + 5}
          </span>
          {gym.distance < 500 && (
            <span className="px-2 py-1 bg-[#2A96AD]/90 backdrop-blur-sm rounded-md text-[10px] font-medium text-white">
              Nearby
            </span>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSave() }}
          className={`
            absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center
            transition-all duration-200 backdrop-blur-sm
            ${isSaved
              ? 'bg-[#E85D4E] text-white shadow-lg'
              : 'bg-white/80 text-[#6B7B75] dark:text-[#A1A1AA] hover:bg-white hover:text-[#E85D4E]'}
          `}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>

        {/* Price tag (bottom-left overlay) */}
        <div className="absolute bottom-3 left-3">
          <p className="text-lg font-bold text-white tracking-tight">
            {formatDistance(gym.distance)}
          </p>
          <p className="text-[10px] text-white/70 font-medium">from your location</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-[#1A3C34] dark:text-[#FAFAFA] truncate group-hover:text-[#2A96AD] transition-colors">
              {gym.name}
            </h3>
            <p className="text-xs text-[#6B7B75] dark:text-[#A1A1AA] mt-0.5 truncate">
              {gym.address || 'Fitness studio'}
            </p>
            {/* Type badge */}
            <span className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${categoryColor[gym.type]}`}>
              {categoryIcons[gym.type]}
              {categoryLabel[gym.type]}
            </span>
          </div>
        </div>

        {/* Specs row */}
        <div className="flex items-center gap-3 mt-3 text-[11px] text-[#6B7B75] dark:text-[#A1A1AA]">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Open now
          </span>
          <span className="flex items-center gap-1">
            <Phone className="w-3 h-3" />
            Call
          </span>
        </div>

        {/* CTA */}
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${gym.location.lat},${gym.location.lon}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-1.5 w-full py-2.5 bg-[#F5F7F6] dark:bg-white/[0.08] hover:bg-[#2A96AD] text-[#1A3C34] dark:text-[#D4E8E4] hover:text-white rounded-lg text-xs font-semibold transition-all duration-200 group/direction"
        >
          <Navigation className="w-3.5 h-3.5" />
          Get Directions
          <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover/direction:opacity-100 group-hover/direction:translate-x-0 transition-all" />
        </a>
      </div>
    </motion.div>
  )
}

/* ── Filter Sidebar ─────────────────────────────────────────── */

function FilterSidebar({
  activeType,
  onTypeChange,
  sortBy,
  onSortChange,
  maxDistance,
  onDistanceChange,
}: {
  activeType: FilterType
  onTypeChange: (t: FilterType) => void
  sortBy: SortBy
  onSortChange: (s: SortBy) => void
  maxDistance: number
  onDistanceChange: (d: number) => void
}) {
  const types: { id: FilterType; label: string; icon: React.ReactNode }[] = [
    { id: 'all',            label: 'All',            icon: <Filter    className="w-4 h-4" /> },
    { id: 'gym',            label: 'Gyms',           icon: <Dumbbell  className="w-4 h-4" /> },
    { id: 'fitness_centre', label: 'Fitness Ctrs',   icon: <Building2 className="w-4 h-4" /> },
    { id: 'outdoor',        label: 'Outdoor',        icon: <Trees     className="w-4 h-4" /> },
  ]

  return (
    <div className="w-64 shrink-0 bg-[#132E35] border-r border-[#132E35] h-full overflow-y-auto">
      <div className="p-5 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight">Filters</h2>
          <p className="text-[11px] text-white/50 mt-0.5">Refine your search</p>
        </div>

        {/* Studio Type */}
        <div>
          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
            Studio Type
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {types.map((t) => (
              <button
                key={t.id}
                onClick={() => onTypeChange(t.id)}
                className={`
                  flex flex-col items-center gap-1.5 p-3 rounded-xl border text-[11px] font-medium transition-all duration-200
                  ${activeType === t.id
                    ? 'bg-[#2A96AD] border-[#2A96AD] text-white shadow-md'
                    : 'bg-white/[0.08] border-white/[0.10] text-white/70 hover:bg-white/[0.14] hover:border-[#2A96AD]/60 hover:text-white'}
                `}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Distance Range */}
        <div>
          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
            Max Distance
          </h3>
          <div className="space-y-3">
            <input
              type="range"
              min={500}
              max={5000}
              step={500}
              value={maxDistance}
              onChange={(e) => onDistanceChange(Number(e.target.value))}
              className="w-full accent-[#2A96AD]"
            />
            <div className="flex justify-between text-[11px] text-white/50">
              <span>500 m</span>
              <span className="font-semibold text-[#2A96AD]">{maxDistance >= 1000 ? `${(maxDistance / 1000).toFixed(1)} km` : `${maxDistance} m`}</span>
              <span>5 km</span>
            </div>
          </div>
        </div>

        {/* Sort */}
        <div>
          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
            Sort By
          </h3>
          <div className="space-y-1.5">
            {([
              { id: 'distance' as SortBy, label: 'Nearest first' },
              { id: 'name' as SortBy, label: 'Name (A-Z)' },
            ]).map((s) => (
              <button
                key={s.id}
                onClick={() => onSortChange(s.id)}
                className={`
                  w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all
                  ${sortBy === s.id
                    ? 'bg-white/[0.12] text-[#2A96AD]'
                    : 'text-white/70 hover:bg-white/[0.08]'}
                `}
              >
                <div className={`
                  w-4 h-4 rounded-full border flex items-center justify-center
                  ${sortBy === s.id ? 'border-[#2A96AD] bg-[#2A96AD]' : 'border-white/[0.25]'}
                `}>
                  {sortBy === s.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Main Component ───────────────────────────────────────────── */

export function NearbyGymsButton() {
  const [open, setOpen] = useState(false)
  const [hoveredGymId, setHoveredGymId] = useState<string | null>(null)
  const [savedGyms, setSavedGyms] = useState<Set<string>>(new Set())
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortBy>('distance')
  const [maxDistance, setMaxDistance] = useState(3000)
  const [searchQuery, setSearchQuery] = useState('')

  const { gyms: rawGyms, loading, error, reload, userLocation } = useNearbyGyms(maxDistance)

  const toggleSave = useCallback((id: string) => {
    setSavedGyms((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // Filter & sort
  const filteredGyms = rawGyms
    .filter((g) => {
      if (g.distance > maxDistance) return false
      if (filterType !== 'all' && g.type !== filterType) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return g.name.toLowerCase().includes(q) || g.address.toLowerCase().includes(q)
      }
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'distance') return a.distance - b.distance
      return a.name.localeCompare(b.name)
    })

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen(true)}
        title="Find fitness studios nearby"
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EAF4F1] rounded-xl border border-[#2A96AD]/20 text-[#2A96AD] text-xs font-semibold hover:bg-[#2A96AD] hover:text-white transition-all duration-200"
      >
        <MapPin className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline">Studios Nearby</span>
        <span className="sm:hidden">Studios</span>
        {loading && <Loader2 className="w-3 h-3 animate-spin" />}
        {!loading && rawGyms.length > 0 && (
          <span className="ml-0.5 text-[10px] font-bold bg-[#2A96AD] text-white px-1.5 py-0.5 rounded-md min-w-[18px] text-center">
            {rawGyms.length}
          </span>
        )}
      </motion.button>

      {/* Full-screen overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] bg-[#F0F4F2] dark:bg-[#121212] flex flex-col"
          >
            {/* Top Navigation Bar */}
            <header className="shrink-0 h-16 bg-white dark:bg-[#1A1A1A] border-b border-[#E2E8E4] dark:border-white/[0.06] flex items-center px-6 gap-4">
              {/* Logo / Brand */}
              <div className="flex items-center gap-2.5 shrink-0">
                <div className="w-8 h-8 bg-[#1A3C34] rounded-lg flex items-center justify-center">
                  <Dumbbell className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-bold text-[#1A3C34] dark:text-[#FAFAFA] tracking-tight hidden sm:inline">Studios</span>
              </div>

              {/* Search */}
              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7B75] dark:text-[#A1A1AA]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or address..."
                    className="w-full pl-10 pr-4 py-2 bg-[#F5F7F6] dark:bg-white/[0.04] border border-[#E2E8E4] dark:border-white/[0.06] rounded-xl text-sm text-[#1A3C34] dark:text-[#FAFAFA] placeholder:text-[#9BA8A2] dark:placeholder:text-[#71717A] focus:outline-none focus:ring-2 focus:ring-[#2A96AD]/30 focus:border-[#2A96AD]/50 transition-all"
                  />
                </div>
              </div>

              {/* Results count */}
              <div className="hidden md:flex items-center gap-2 text-xs text-[#6B7B75] dark:text-[#A1A1AA]">
                <span className="font-semibold text-[#1A3C34]">{filteredGyms.length}</span>
                <span>studios found</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={reload}
                  className="p-2 text-[#6B7B75] dark:text-[#A1A1AA] hover:text-[#1A3C34] hover:bg-[#F5F7F6] dark:bg-white/[0.04] rounded-lg transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 text-[#6B7B75] dark:text-[#A1A1AA] hover:text-[#1A3C34] hover:bg-[#F5F7F6] dark:bg-white/[0.04] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Filters Sidebar */}
              <FilterSidebar
                activeType={filterType}
                onTypeChange={setFilterType}
                sortBy={sortBy}
                onSortChange={setSortBy}
                maxDistance={maxDistance}
                onDistanceChange={setMaxDistance}
              />

              {/* List Panel */}
              <div className="flex-1 flex flex-col min-w-0 bg-[#F0F4F2] dark:bg-[#121212]">
                {/* List header */}
                <div className="px-5 py-3 flex items-center justify-between border-b border-[#E2E8E4] dark:border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#6B7B75] dark:text-[#A1A1AA]" />
                    <span className="text-xs font-medium text-[#6B7B75] dark:text-[#A1A1AA]">
                      {sortBy === 'distance' ? 'Sorted by distance' : 'Sorted by name'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-[#6B7B75] dark:text-[#A1A1AA]">
                    <LocateFixed className="w-3 h-3" />
                    {userLocation ? 'Using your location' : 'Location unavailable'}
                  </div>
                </div>

                {/* Scrollable list */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  {loading && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <div className="relative">
                        <Loader2 className="w-10 h-10 animate-spin text-[#2A96AD]" />
                        <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-[#2A96AD]/20" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-[#1A3C34]">Discovering studios...</p>
                        <p className="text-xs text-[#6B7B75] dark:text-[#A1A1AA] mt-1">Scanning your area for fitness centres</p>
                      </div>
                    </div>
                  )}

                  {error && !loading && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <div className="w-14 h-14 bg-[#F5F7F6] dark:bg-white/[0.04] rounded-full flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-[#6B7B75] dark:text-[#A1A1AA]/50" />
                      </div>
                      <p className="text-sm text-[#6B7B75] dark:text-[#A1A1AA] text-center max-w-xs">{error}</p>
                      <button
                        onClick={reload}
                        className="mt-2 px-4 py-2 bg-[#1A3C34] text-white text-xs font-medium rounded-lg hover:bg-[#2A4A40] transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  )}

                  {!loading && !error && filteredGyms.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <div className="w-14 h-14 bg-[#F5F7F6] dark:bg-white/[0.04] rounded-full flex items-center justify-center">
                        <Dumbbell className="w-6 h-6 text-[#6B7B75] dark:text-[#A1A1AA]/50" />
                      </div>
                      <p className="text-sm text-[#6B7B75] dark:text-[#A1A1AA] text-center">No studios match your filters</p>
                      <button
                        onClick={() => { setFilterType('all'); setMaxDistance(5000); setSearchQuery('') }}
                        className="mt-2 text-xs text-[#2A96AD] font-medium hover:underline"
                      >
                        Clear all filters
                      </button>
                    </div>
                  )}

                  {!loading && filteredGyms.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">
                      {filteredGyms.map((gym, i) => (
                        <GymCard
                          key={gym.id}
                          gym={gym}
                          index={i}
                          isHovered={hoveredGymId === gym.id}
                          isSaved={savedGyms.has(gym.id)}
                          onToggleSave={() => toggleSave(gym.id)}
                          onHover={() => setHoveredGymId(gym.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Map Panel */}
              <div className="hidden xl:block w-[420px] shrink-0 border-l border-[#E2E8E4] dark:border-white/[0.06] relative bg-[#E8EDEA] dark:bg-[#1E1E1E]">
                <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-[#E2E8E4] dark:border-white/[0.06] px-3 py-2">
                  <p className="text-[11px] font-semibold text-[#1A3C34] dark:text-[#FAFAFA]">Studio Map</p>
                  <p className="text-[10px] text-[#6B7B75] dark:text-[#A1A1AA]">{filteredGyms.length} locations shown</p>
                </div>
                <GymMap
                  gyms={filteredGyms}
                  userLocation={userLocation}
                  hoveredGymId={hoveredGymId}
                  onHoverGym={setHoveredGymId}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
