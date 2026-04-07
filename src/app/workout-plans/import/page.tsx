'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import api from '@/lib/api'
import { Upload, CheckCircle, AlertCircle, ArrowLeft, FileSpreadsheet } from 'lucide-react'
import Link from 'next/link'

export default function ImportPage() {
  const [result, setResult] = useState<{ imported: number; warnings: string[] } | null>(null)
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
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await api.post('/workout-plans/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult(res.data.data)
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <Link href="/workout-plans" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-3 h-3" /> Back
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Import Workout Plans</h1>
        <p className="text-gray-500 text-sm mb-6">Upload an Excel or CSV file. Clients are matched by name automatically.</p>

        {result ? (
          <div className="card p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900">{result.imported} plan(s) imported!</h2>
            {result.warnings.length > 0 && (
              <div className="mt-4 text-left bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm font-medium text-yellow-800 mb-2">Warnings:</p>
                {result.warnings.map((w, i) => <p key={i} className="text-sm text-yellow-700">{w}</p>)}
              </div>
            )}
            <Link href="/workout-plans" className="btn-primary mt-6 inline-block">View Plans</Link>
          </div>
        ) : (
          <div className="card p-6 space-y-6">
            <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-brand bg-brand-light' : 'border-gray-300 hover:border-gray-400'}`}>
              <input {...getInputProps()} />
              <FileSpreadsheet className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              {file ? (
                <><p className="font-medium text-gray-900">{file.name}</p><p className="text-sm text-gray-500">{(file.size/1024).toFixed(1)} KB</p></>
              ) : (
                <><p className="font-medium text-gray-700">Drop your Excel or CSV file here</p>
                  <p className="text-sm text-gray-400 mt-1">or click to browse · .xlsx, .xls, .csv</p></>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl p-4 text-sm">
              <p className="font-medium text-gray-900 mb-2">Required columns:</p>
              <div className="grid grid-cols-2 gap-1 text-gray-600">
                {['client_name', 'week_start', 'day', 'exercise', 'sets', 'reps'].map(c => (
                  <code key={c} className="bg-white border border-gray-200 rounded px-2 py-0.5 text-xs">{c}</code>
                ))}
              </div>
            </div>

            {error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
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
