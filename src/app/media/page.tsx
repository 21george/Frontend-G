'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useClients } from '@/lib/hooks'
import { useState, useMemo } from 'react'
import api from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import {
  Image as ImageIcon, Video, Upload, Search, Filter, ChevronRight,
  Download, Trash2, Eye, Calendar, HardDrive
} from 'lucide-react'
import { motion } from 'framer-motion'

const FILE_TYPE_CONFIG: Record<string, { label: string; icon: typeof ImageIcon; gradient: string }> = {
  image: { label: 'Image', icon: ImageIcon, gradient: 'from-blue-500 to-cyan-500' },
  video: { label: 'Video', icon: Video, gradient: 'from-purple-500 to-pink-500' },
}

export default function MediaPage() {
  const [selectedClient, setSelectedClient] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video'>('all')
  const [search, setSearch] = useState('')
  const { data: clientsData } = useClients()
  const clients = clientsData?.data ?? []

  const { data: media, isLoading } = useQuery({
    queryKey: ['media', selectedClient],
    queryFn: () => api.get(`/coach/media/${selectedClient}`).then(r => r.data.data),
    enabled: !!selectedClient,
  })

  // Calculate stats
  const stats = useMemo(() => {
    const all = media ?? []
    const images = all.filter((m: any) => m.type === 'image')
    const videos = all.filter((m: any) => m.type === 'video')
    const totalSize = all.reduce((sum: number, m: any) => sum + (m.size || 0), 0)
    return {
      total: all.length,
      images: images.length,
      videos: videos.length,
      storage: totalSize,
    }
  }, [media])

  // Filter media
  const filtered = useMemo(() => {
    let list = media ?? []
    if (typeFilter !== 'all') list = list.filter((m: any) => m.type === typeFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((m: any) => m.filename?.toLowerCase().includes(q))
    }
    return list
  }, [media, typeFilter, search])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown'
    const date = new Date(dateString)
    const now = Date.now()
    const diff = now - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── PAGE HEADER ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-neutral-400 mb-3 uppercase tracking-tighter">
              <span>Dashboard</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-cyan-950 dark:text-[#b3d2ef]">Client Media</span>
            </nav>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              Client Media
            </h1>
            <p className="text-slate-500 dark:text-neutral-400 mt-2 max-w-lg text-sm">
              View and manage photos and videos uploaded by your clients for progress tracking.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-950 hover:bg-cyan-900 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-cyan-950/25">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Upload Media</span>
            <span className="sm:hidden">Upload</span>
          </button>
        </div>

        {/* ── CLIENT SELECTOR ── */}
        {!selectedClient ? (
          <div className="bg-white dark:bg-[#171717] rounded-xl border border-slate-200/80 dark:border-white/[0.08] p-8 lg:p-12">
            <div className="max-w-md mx-auto text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/20">
                <ImageIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Select a Client
              </h3>
              <p className="text-slate-500 dark:text-neutral-400 mb-6">
                Choose a client from the dropdown below to view their media uploads
              </p>
              <div className="relative max-w-xs mx-auto">
                <select
                  value={selectedClient}
                  onChange={e => setSelectedClient(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-sm text-slate-700 dark:text-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-950/20 dark:focus:ring-cyan-400/20 appearance-none cursor-pointer"
                >
                  <option value="">Select a client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* ── BENTO STATS GRID ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
                className="bg-white dark:bg-[#171717] rounded-xl p-4 lg:p-5 border border-slate-200/80 dark:border-white/[0.08] flex flex-col justify-between shadow-sm"
              >
                <span className="text-slate-500 dark:text-neutral-400 text-[10px] lg:text-xs font-semibold uppercase tracking-wider">Total Media</span>
                <div className="mt-3 lg:mt-4 flex items-baseline gap-2">
                  <span className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">{stats.total}</span>
                  <span className="text-slate-500 dark:text-neutral-500 text-xs">files</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-white dark:bg-[#171717] rounded-xl p-4 lg:p-5 border border-slate-200/80 dark:border-white/[0.08] flex flex-col justify-between shadow-sm"
              >
                <span className="text-slate-500 dark:text-neutral-400 text-[10px] lg:text-xs font-semibold uppercase tracking-wider">Images</span>
                <div className="mt-3 lg:mt-4 flex items-baseline gap-2">
                  <span className="text-2xl lg:text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.images}</span>
                  <ImageIcon className="w-4 h-4 text-blue-500" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-[#171717] rounded-xl p-4 lg:p-5 border border-slate-200/80 dark:border-white/[0.08] flex flex-col justify-between shadow-sm"
              >
                <span className="text-slate-500 dark:text-neutral-400 text-[10px] lg:text-xs font-semibold uppercase tracking-wider">Videos</span>
                <div className="mt-3 lg:mt-4 flex items-baseline gap-2">
                  <span className="text-2xl lg:text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.videos}</span>
                  <Video className="w-4 h-4 text-purple-500" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white dark:bg-[#171717] rounded-xl p-4 lg:p-5 border border-slate-200/80 dark:border-white/[0.08] flex flex-col justify-between shadow-sm"
              >
                <span className="text-slate-500 dark:text-neutral-400 text-[10px] lg:text-xs font-semibold uppercase tracking-wider">Storage Used</span>
                <div className="mt-3 lg:mt-4 flex items-baseline gap-2">
                  <span className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">{formatFileSize(stats.storage)}</span>
                  <HardDrive className="w-4 h-4 text-slate-400" />
                </div>
              </motion.div>
            </div>

            {/* ── FILTERS ── */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <Filter size={14} className="text-slate-400" />
                {(['all', 'image', 'video'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-colors flex items-center gap-1.5 ${
                      typeFilter === type
                        ? 'bg-cyan-950 text-white border-cyan-950'
                        : 'border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.08]'
                    }`}
                  >
                    {type === 'image' && <ImageIcon size={12} />}
                    {type === 'video' && <Video size={12} />}
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full sm:w-64 pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-[12px] font-medium text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-950/20 dark:focus:ring-cyan-400/20"
                />
              </div>
            </div>

            {/* ── MEDIA GRID ── */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-sm text-slate-500 dark:text-slate-400">Loading media...</div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white dark:bg-[#171717] rounded-xl border border-slate-200/80 dark:border-white/[0.08] p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No media found</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {media && media.length === 0
                    ? "This client hasn't uploaded any media yet"
                    : 'Try adjusting your filters'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filtered.map((m: any, index: number) => {
                  const typeConf = FILE_TYPE_CONFIG[m.type] ?? FILE_TYPE_CONFIG.image
                  const TypeIcon = typeConf.icon

                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] hover:shadow-lg transition-all"
                    >
                      {m.type === 'video' ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${typeConf.gradient} flex items-center justify-center shadow-lg`}>
                            <TypeIcon size={20} className="text-white" />
                          </div>
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Video</span>
                        </div>
                      ) : m.url ? (
                        <img
                          src={m.url}
                          alt={m.filename || 'Media upload'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${typeConf.gradient} flex items-center justify-center shadow-lg`}>
                            <TypeIcon size={20} className="text-white" />
                          </div>
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Image</span>
                        </div>
                      )}

                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                        <div className="flex items-center justify-between gap-2">
                          <a
                            href={m.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 px-2 py-1.5 bg-white/90 dark:bg-white text-slate-900 text-xs font-medium rounded-lg text-center hover:bg-white transition-colors flex items-center justify-center gap-1"
                          >
                            <Eye size={12} />
                            View
                          </a>
                          <button className="p-1.5 bg-white/90 dark:bg-white text-slate-900 rounded-lg hover:bg-white transition-colors">
                            <Download size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Type badge */}
                      <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-[10px] font-medium text-white uppercase tracking-tight">
                        {typeConf.label}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}

            {/* ── CLIENT INFO CARD ── */}
            <div className="bg-gradient-to-br from-cyan-950/10 to-blue-950/10 dark:from-[#05254e] dark:to-[#00193b] rounded-xl p-6 border border-cyan-950/20 dark:border-[#b3d2ef]/30">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    {clients.find(c => c.id === selectedClient)?.name}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-neutral-300 leading-relaxed">
                    {stats.total} media files uploaded. {stats.images} images and {stats.videos} videos.
                    Total storage: {formatFileSize(stats.storage)}.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
