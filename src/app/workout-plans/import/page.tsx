'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useState, useCallback, useMemo } from 'react'
import { useDropzone } from 'react-dropzone'
import { workoutPlansApi } from '@/lib/api'
import { parseApiError } from '@/lib/api/errors'
import type { ApiError } from '@/lib/api/errors'
import { ErrorModal } from '@/components/ui/ErrorModal'
import { Upload, CheckCircle, AlertCircle, ArrowLeft, FileSpreadsheet, Download, FileWarning, Eye, X, CloudDownload, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'

/* ── Types ────────────────────────────────────────────────────────────────── */
interface ImportResult {
  imported: number
  plan_ids: string[]
  warnings: string[]
  total_rows?: number
  processed_rows?: number
  skipped_rows?: number
}

/* ── Client-side CSV preview parser ───────────────────────────────────────── */
interface PreviewRow {
  client_name: string
  week_start: string
  day: string
  exercise: string
  sets: string
  reps: string
  rest_seconds: string
  notes: string
  _valid: boolean
  _errors: string[]
}

const REQUIRED_COLS = ['client_name', 'day', 'exercise']
const ALL_COLS = ['client_name', 'week_start', 'day', 'exercise', 'sets', 'reps', 'rest_seconds', 'notes']

const COLUMN_ALIASES: Record<string, string[]> = {
  client_name:   ['client_name', 'client', 'name', 'athlete', 'client name'],
  week_start:    ['week_start', 'week', 'date', 'start_date', 'week start'],
  day:           ['day', 'weekday', 'day_of_week', 'day of week'],
  exercise:      ['exercise', 'exercise_name', 'movement', 'lift', 'exercise name'],
  sets:          ['sets', 'set', 'num_sets', 'num sets'],
  reps:          ['reps', 'repetitions', 'rep_range', 'rep range'],
  rest_seconds:  ['rest', 'rest_seconds', 'rest_time', 'rest (sec)', 'recovery', 'rest (seconds)'],
  notes:         ['notes', 'instructions', 'note', 'coaching_notes', 'coaching notes', 'comments'],
}

const VALID_DAYS = new Set(['monday','mon','tuesday','tue','tues','wednesday','wed','thursday','thu','thurs','friday','fri','saturday','sat','sunday','sun'])

function detectColumns(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {}
  headers.forEach((raw, idx) => {
    const norm = raw.trim().toLowerCase().replace(/[\s\-]+/g, '_')
    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (aliases.includes(norm) || aliases.includes(raw.trim().toLowerCase())) {
        map[field] = idx
        break
      }
    }
  })
  return map
}

function parseCsvText(text: string): string[][] {
  // Simple CSV parser — handles quoted fields and escaped quotes ("")
  const lines: string[][] = []
  const rows = text.split(/\r?\n/)
  for (const row of rows) {
    if (!row.trim()) continue
    const cells: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < row.length; i++) {
      const ch = row[i]
      if (ch === '"') {
        if (inQuotes && row[i + 1] === '"') {
          // Escaped quote — treat "" as a single literal quote
          current += '"'
          i++ // skip the second quote
        } else {
          inQuotes = !inQuotes
        }
        continue
      }
      if (ch === ',' && !inQuotes) { cells.push(current.trim()); current = ''; continue }
      current += ch
    }
    cells.push(current.trim())
    lines.push(cells)
  }
  return lines
}

function buildPreview(text: string): { rows: PreviewRow[]; columnMap: Record<string, number>; missingColumns: string[] } {
  const parsed = parseCsvText(text)
  if (parsed.length < 2) return { rows: [], columnMap: {}, missingColumns: ALL_COLS }

  const headers = parsed[0]
  const columnMap = detectColumns(headers)
  const missingColumns = REQUIRED_COLS.filter(c => !(c in columnMap))

  const rows: PreviewRow[] = []
  for (let i = 1; i < parsed.length && i <= 50; i++) { // Preview max 50 rows
    const cells = parsed[i]
    if (!cells.some(c => c.trim())) continue

    const data: Record<string, string> = {}
    for (const [field, idx] of Object.entries(columnMap)) {
      data[field] = (cells[idx] ?? '').trim()
    }

    const errors: string[] = []
    if (!data.client_name) errors.push('Missing client name')
    if (!data.day) errors.push('Missing day')
    if (!data.exercise) errors.push('Missing exercise')
    if (data.day && !VALID_DAYS.has(data.day.toLowerCase())) errors.push(`Invalid day "${data.day}"`)
    if (data.week_start && isNaN(Date.parse(data.week_start)) && !/^\d{4}-\d{2}-\d{2}$/.test(data.week_start)) {
      // Allow numeric Excel dates — they'll be parsed server-side
      if (!/^\d+(\.\d+)?$/.test(data.week_start)) errors.push(`Invalid date "${data.week_start}"`)
    }

    rows.push({
      client_name: data.client_name || '',
      week_start: data.week_start || '',
      day: data.day || '',
      exercise: data.exercise || '',
      sets: data.sets || '',
      reps: data.reps || '',
      rest_seconds: data.rest_seconds || '',
      notes: data.notes || '',
      _valid: errors.length === 0,
      _errors: errors,
    })
  }

  return { rows, columnMap, missingColumns }
}

/* ── Component ─────────────────────────────────────────────────────────────── */
export default function ImportPage() {
  const [result, setResult] = useState<ImportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [apiError, setApiError] = useState<ApiError | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [importMode, setImportMode] = useState<'file' | 'drive'>('file')
  const [driveUrl, setDriveUrl] = useState('')

  // Preview state
  const [preview, setPreview] = useState<{ rows: PreviewRow[]; columnMap: Record<string, number>; missingColumns: string[] } | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  // Parse file for preview when selected
  const processFile = useCallback(async (f: File) => {
    setFile(f)
    setResult(null)
    setError('')
    // Only preview CSV files (XLSX requires server-side parsing)
    if (f.name.endsWith('.csv')) {
      try {
        const text = await f.text()
        setPreview(buildPreview(text))
        setShowPreview(true)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[Import] Failed to preview CSV:', err)
        }
        setPreview(null)
        setShowPreview(false)
      }
    } else {
      setPreview(null)
      setShowPreview(false)
    }
  }, [])

  const onDrop = useCallback((files: File[]) => { if (files[0]) processFile(files[0]) }, [processFile])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10 MB
  })

  const handleImport = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    setApiError(null)
    try {
      const res = await workoutPlansApi.import(file)
      setResult(res.data)
    } catch (e: unknown) {
      const parsed = parseApiError(e)
      setApiError(parsed)
      setError(parsed.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDriveImport = async () => {
    if (!driveUrl.trim()) return
    setLoading(true)
    setError('')
    setApiError(null)
    try {
      const res = await workoutPlansApi.importFromDrive(driveUrl.trim())
      setResult(res.data)
    } catch (e: unknown) {
      const parsed = parseApiError(e)
      setApiError(parsed)
      setError(parsed.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    const csv = 'client_name,week_start,day,exercise,sets,reps,rest_seconds,notes\nJohn Doe,2025-01-06,monday,Bench Press,4,8-10,90,Focus on form\nJohn Doe,2025-01-06,monday,Incline DB Press,3,12,60,\nJohn Doe,2025-01-06,wednesday,Squat,5,5,120,Heavy\nJane Smith,2025-01-06,monday,Deadlift,3,8,90,\n'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'workout-import-template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const validRows = useMemo(() => preview?.rows.filter(r => r._valid).length ?? 0, [preview])
  const invalidRows = useMemo(() => preview?.rows.filter(r => !r._valid).length ?? 0, [preview])

  return (
    <DashboardLayout>
      <div>
        <Link href="/workout-plans" className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6">
          <ArrowLeft className="w-3 h-3" /> Back
        </Link>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">Import Workout Plans</h1>
        <p className="text-[var(--text-secondary)] text-sm mb-6">Upload an Excel or CSV file. Clients are matched by name automatically.</p>

        {/* ── Error Modal ─────────────────────────────────────────────────── */}
        <ErrorModal
          open={!!apiError}
          onClose={() => setApiError(null)}
          error={apiError}
          onRetry={apiError ? (importMode === 'file' ? handleImport : handleDriveImport) : undefined}
        />

        {result ? (
          /* ── Success State ──────────────────────────────────────────────── */
          <div className="card p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">{result.imported} plan(s) imported!</h2>

            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div className="bg-slate-50 dark:bg-white/5 p-3">
                <p className="text-[var(--text-secondary)]">Total Rows</p>
                <p className="text-lg font-semibold text-[var(--text-primary)]">{result.total_rows ?? '-'}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-950/20 p-3">
                <p className="text-green-600 dark:text-green-400">Processed</p>
                <p className="text-lg font-semibold text-green-700 dark:text-green-300">{result.processed_rows ?? result.imported}</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3">
                <p className="text-yellow-600 dark:text-yellow-400">Skipped</p>
                <p className="text-lg font-semibold text-yellow-700 dark:text-yellow-300">{result.skipped_rows ?? 0}</p>
              </div>
            </div>

            {result.plan_ids.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {result.plan_ids.map((id) => (
                  <Link key={id} href={`/workout-plans/${id}`} className="text-sm text-brand-600 hover:text-brand-700 underline">
                    View Plan
                  </Link>
                ))}
              </div>
            )}
            {result.warnings.length > 0 && (
              <div className="mt-4 text-left bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 p-4">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">Warnings:</p>
                {result.warnings.map((w, i) => <p key={i} className="text-sm text-yellow-700 dark:text-yellow-400">{w}</p>)}
              </div>
            )}
            <div className="flex gap-3 mt-6 justify-center">
              <Link href="/workout-plans" className="btn-primary inline-block">View All Plans</Link>
              <button onClick={() => { setResult(null); setFile(null); setPreview(null); setShowPreview(false) }} className="btn-secondary">Import More</button>
            </div>
          </div>
        ) : (
          /* ── Upload State ────────────────────────────────────────────────── */
          <div className="p-6 space-y-6">
            {/* Mode toggle */}
            <div className="flex gap-1 bg-slate-100 dark:bg-white/[0.06] p-1">
              <button
                onClick={() => { setImportMode('file'); setError(''); setApiError(null); setDriveUrl(''); }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                  importMode === 'file'
                    ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white '
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Upload File
              </button>
              <button
                onClick={() => { setImportMode('drive'); setError(''); setApiError(null); setFile(null); setPreview(null); setShowPreview(false); }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                  importMode === 'drive'
                    ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white '
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <CloudDownload className="w-4 h-4" />
                Google Drive
              </button>
            </div>

            {importMode === 'file' ? (
            <>
            {/* Dropzone */}
            <div {...getRootProps()} className={`border-2 border-dashed h-56 p-12 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-brand-500 bg-brand-50 dark:bg-brand-600/20' : 'border-slate-300 dark:border-white/20 hover:border-slate-400 dark:hover:border-white/30'}`}>
              <input {...getInputProps()} />
              <FileSpreadsheet className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
              {file ? (
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{file.name}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{(file.size/1024).toFixed(1)} KB</p>
                  {preview && (
                    <div className="mt-2 flex items-center justify-center gap-3 text-xs">
                      <span className="text-green-600 dark:text-green-400">{validRows} valid rows</span>
                      {invalidRows > 0 && <span className="text-yellow-600 dark:text-yellow-400">{invalidRows} with issues</span>}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <p className="font-medium text-[var(--text-primary)]">Drop your Excel or CSV file here</p>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">or click to browse · .xlsx, .xls, .csv · max 10 MB</p>
                </>
              )}
            </div>

            {/* Preview toggle (CSV only) */}
            {preview && (
              <div className="border border-slate-200 dark:border-white/10 overflow-hidden">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors text-sm"
                >
                  <span className="flex items-center gap-2 font-medium text-[var(--text-primary)]">
                    <Eye className="w-4 h-4" />
                    Preview ({preview.rows.length} rows)
                  </span>
                  <div className="flex items-center gap-3">
                    {preview.missingColumns.length > 0 && (
                      <span className="text-red-500 text-xs flex items-center gap-1">
                        <FileWarning className="w-3 h-3" />
                        Missing: {preview.missingColumns.join(', ')}
                      </span>
                    )}
                    <span className="text-green-600 text-xs">{validRows} valid</span>
                    {invalidRows > 0 && <span className="text-yellow-600 text-xs">{invalidRows} issues</span>}
                  </div>
                </button>

                {showPreview && (
                  <div className="overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100 dark:bg-white/[0.05] sticky top-0">
                        <tr>
                          {ALL_COLS.map(col => (
                            <th key={col} className={`px-2 py-1.5 text-left font-medium ${
                              REQUIRED_COLS.includes(col) ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'
                            }`}>
                              {col}{REQUIRED_COLS.includes(col) && ' *'}
                            </th>
                          ))}
                          <th className="px-2 py-1.5 text-left font-medium text-slate-400">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.rows.map((row, i) => (
                          <tr key={i} className={row._valid ? '' : 'bg-red-50/50 dark:bg-red-950/20'}>
                            <td className="px-2 py-1 border-t border-slate-100 dark:border-white/5">{row.client_name || '—'}</td>
                            <td className="px-2 py-1 border-t border-slate-100 dark:border-white/5">{row.week_start || '—'}</td>
                            <td className="px-2 py-1 border-t border-slate-100 dark:border-white/5">{row.day || '—'}</td>
                            <td className="px-2 py-1 border-t border-slate-100 dark:border-white/5">{row.exercise || '—'}</td>
                            <td className="px-2 py-1 border-t border-slate-100 dark:border-white/5">{row.sets || '—'}</td>
                            <td className="px-2 py-1 border-t border-slate-100 dark:border-white/5">{row.reps || '—'}</td>
                            <td className="px-2 py-1 border-t border-slate-100 dark:border-white/5">{row.rest_seconds || '—'}</td>
                            <td className="px-2 py-1 border-t border-slate-100 dark:border-white/5 max-w-[120px] truncate">{row.notes || '—'}</td>
                            <td className="px-2 py-1 border-t border-slate-100 dark:border-white/5">
                              {row._valid
                                ? <span className="text-green-600">✓</span>
                                : <span className="text-red-500" title={row._errors.join('; ')}>✗</span>
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Column reference */}
            <div className="bg-slate-50 dark:bg-white/[0.03] p-4 text-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-[var(--text-primary)]">Required columns:</p>
                <button onClick={downloadTemplate} className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700">
                  <Download className="w-3 h-3" /> Download template
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[var(--text-secondary)]">
                {ALL_COLS.map(c => (
                  <code key={c} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2 py-0.5 text-xs">
                    {c}{REQUIRED_COLS.includes(c) ? ' *' : ''}
                  </code>
                ))}
              </div>
            </div>

            {/* Error display */}
            {error && (
              <div className="text-red-600 text-sm bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p>{error}</p>
                  {preview?.missingColumns.length ? (
                    <p className="mt-1 text-xs text-red-500">Missing columns: {preview.missingColumns.join(', ')}</p>
                  ) : null}
                </div>
              </div>
            )}

            {/* Import button */}
            <button
              onClick={handleImport}
              disabled={!file || loading || (preview ? preview.missingColumns.length > 0 : false)}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              {loading ? 'Importing…' : 'Import Plans'}
            </button>
            </>
            ) : (
            /* ── Google Drive Import ──────────────────────────────────────── */
            <div className="space-y-4">
              <div className="border-2 border-dashed p-8 text-center border-slate-300 dark:border-white/20">
                <CloudDownload className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
                <p className="font-medium text-[var(--text-primary)]">Import from Google Drive</p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">Paste a share link to an Excel or CSV file</p>
              </div>

              <div>
                <label className="label">Google Drive Share Link</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="url"
                      value={driveUrl}
                      onChange={e => setDriveUrl(e.target.value)}
                      placeholder="https://drive.google.com/file/d/.../view"
                      className="input pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1.5">
                  Make sure the file is shared as "Anyone with the link can view"
                </p>
              </div>

              {error && importMode === 'drive' && (
                <div className="text-red-600 text-sm bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <button
                onClick={handleDriveImport}
                disabled={!driveUrl.trim() || loading}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CloudDownload className="w-4 h-4" />
                {loading ? 'Importing…' : 'Import from Google Drive'}
              </button>
            </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
