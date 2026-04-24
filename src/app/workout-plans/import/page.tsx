'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { workoutPlansApi } from '@/lib/api'
import { Upload, CheckCircle, AlertCircle, ArrowLeft, FileSpreadsheet, Download } from 'lucide-react'
import Link from 'next/link'

export default function ImportPage() {
  const [result, setResult] = useState<{ imported: number; plan_ids: string[]; warnings: string[]; total_rows?: number; processed_rows?: number; skipped_rows?: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const onDrop = useCallback((files: File[]) => { if (files[0]) setFile(files[0]) }, [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'] }, maxFiles: 1
  })

  const handleImport = async () => {
    if (!file) return
    setLoading(true); setError('')
    try {
      const res = await workoutPlansApi.import(file)
      setResult(res.data)
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Import failed')
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

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <Link href="/workout-plans" className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6">
          <ArrowLeft className="w-3 h-3" /> Back
        </Link>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">Import Workout Plans</h1>
        <p className="text-[var(--text-secondary)] text-sm mb-6">Upload an Excel or CSV file. Clients are matched by name automatically.</p>

        {result ? (
          <div className="card p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">{result.imported} plan(s) imported!</h2>

            {/* Import statistics */}
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-3">
                <p className="text-[var(--text-secondary)]">Total Rows</p>
                <p className="text-lg font-semibold text-[var(--text-primary)]">{result.total_rows ?? '-'}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
                <p className="text-green-600 dark:text-green-400">Processed</p>
                <p className="text-lg font-semibold text-green-700 dark:text-green-300">{result.processed_rows ?? result.imported}</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-3">
                <p className="text-yellow-600 dark:text-yellow-400">Skipped</p>
                <p className="text-lg font-semibold text-yellow-700 dark:text-yellow-300">{result.skipped_rows ?? 0}</p>
              </div>
            </div>

            {result.plan_ids.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {result.plan_ids.map((id) => (
                  <Link key={id} href={`/workout-plans/${id}`} className="text-sm text-cyan-600 hover:text-cyan-700 underline">
                    View Plan
                  </Link>
                ))}
              </div>
            )}
            {result.warnings.length > 0 && (
              <div className="mt-4 text-left bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">Warnings:</p>
                {result.warnings.map((w, i) => <p key={i} className="text-sm text-yellow-700 dark:text-yellow-400">{w}</p>)}
              </div>
            )}
            <div className="flex gap-3 mt-6 justify-center">
              <Link href="/workout-plans" className="btn-primary inline-block">View All Plans</Link>
              <button onClick={() => { setResult(null); setFile(null) }} className="btn-secondary">Import More</button>
            </div>
          </div>
        ) : (
          <div className="card p-6 space-y-6">
            <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/20' : 'border-slate-300 dark:border-white/20 hover:border-slate-400 dark:hover:border-white/30'}`}>
              <input {...getInputProps()} />
              <FileSpreadsheet className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
              {file ? (
                <><p className="font-medium text-[var(--text-primary)]">{file.name}</p><p className="text-sm text-[var(--text-secondary)]">{(file.size/1024).toFixed(1)} KB</p></>
              ) : (
                <><p className="font-medium text-[var(--text-primary)]">Drop your Excel or CSV file here</p>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">or click to browse · .xlsx, .xls, .csv</p></>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl p-4 text-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-[var(--text-primary)]">Required columns:</p>
                <button onClick={downloadTemplate} className="flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-700">
                  <Download className="w-3 h-3" /> Download template
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[var(--text-secondary)]">
                {['client_name', 'week_start', 'day', 'exercise', 'sets', 'reps', 'rest_seconds', 'notes'].map(c => (
                  <code key={c} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded px-2 py-0.5 text-xs">{c}</code>
                ))}
              </div>
            </div>

            {error && <div className="text-red-600 text-sm bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
            <button onClick={handleImport} disabled={!file || loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" />
              {loading ? 'Importing…' : 'Import Plans'}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
