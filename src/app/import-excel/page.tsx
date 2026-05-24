'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileSpreadsheet, Download, ArrowLeft, CheckCircle, AlertCircle, Eye, Loader2, Sheet, Database } from 'lucide-react'
import Link from 'next/link'

// Dynamic import xlsx only when needed
let XLSX: any = null
async function getXLSX() {
  if (!XLSX) {
    XLSX = await import('xlsx')
  }
  return XLSX
}

interface SheetInfo {
  name: string
  rowCount: number
  headers: string[]
  preview: string[][]
  detectedType: string
}

interface ParsedExcel {
  sheets: SheetInfo[]
  fileName: string
}

// Detect what type of data a sheet contains
function detectSheetType(headers: string[]): string {
  const h = headers.map(h => h.toLowerCase())
  const hStr = h.join(' ')

  if (hStr.includes('exercise') && hStr.includes('sets') && hStr.includes('reps')) return 'Exercise Details'
  if (hStr.includes('client') && hStr.includes('age') && hStr.includes('weight')) return 'Client Overview'
  if (hStr.includes('nutrition') || hStr.includes('calories') || hStr.includes('protein')) return 'Nutrition Plans'
  if (hStr.includes('schedule') || hStr.includes('monday') || hStr.includes('tuesday')) return 'Weekly Schedule'
  if (hStr.includes('completed') || hStr.includes('duration') || hStr.includes('rating')) return 'Completed Workouts'
  if (hStr.includes('completion') || hStr.includes('performance')) return 'Completion Summary'
  if (hStr.includes('workout') && hStr.includes('program')) return 'Workout Plans'

  return 'Unknown'
}

// Parse Excel file and extract all sheets
async function parseExcelFile(file: File): Promise<ParsedExcel> {
  const xlsx = await getXLSX()
  const buffer = await file.arrayBuffer()
  const workbook = xlsx.read(buffer, { type: 'array' })

  const sheets: SheetInfo[] = []

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const json = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as any[][]

    if (json.length < 2) continue

    // Find header row (first row with multiple non-empty cells)
    let headerIdx = 0
    for (let i = 0; i < Math.min(json.length, 5); i++) {
      const row = json[i]
      if (!row) continue
      const nonEmpty = row.filter(c => c !== undefined && c !== null && String(c).trim())
      if (nonEmpty.length >= 3) {
        headerIdx = i
        break
      }
    }

    const headers = (json[headerIdx] || []).map(h => String(h || ''))
    const dataRows = json.slice(headerIdx + 1).filter(row => row && row.some(c => c !== undefined && c !== null && String(c).trim()))

    const detectedType = detectSheetType(headers)

    sheets.push({
      name: sheetName,
      rowCount: dataRows.length,
      headers,
      preview: dataRows.slice(0, 5).map(row => row.map(c => String(c || ''))),
      detectedType,
    })
  }

  return { sheets, fileName: file.name }
}

export default function ExcelImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [parsed, setParsed] = useState<ParsedExcel | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedSheet, setSelectedSheet] = useState<number | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null)

  const onDrop = useCallback(async (files: File[]) => {
    const f = files[0]
    if (!f) return

    setFile(f)
    setError('')
    setParsed(null)
    setSelectedSheet(null)
    setImportResult(null)
    setLoading(true)

    try {
      const result = await parseExcelFile(f)
      setParsed(result)
    } catch (err) {
      console.error('Failed to parse Excel:', err)
      setError('Failed to parse Excel file. Make sure it\'s a valid .xlsx or .xls file.')
    } finally {
      setLoading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  const handleImportSheet = async (sheetIndex: number) => {
    if (!file || !parsed) return
    setImporting(true)
    setImportResult(null)

    // Simulate import - in production this would call the API
    await new Promise(resolve => setTimeout(resolve, 1500))

    const sheet = parsed.sheets[sheetIndex]
    setImportResult({
      success: true,
      message: `Successfully processed ${sheet.name} (${sheet.rowCount} rows)`,
    })
    setImporting(false)
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-6">
        <Link href="/workout-plans" className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6">
          <ArrowLeft className="w-3 h-3" /> Back to Workout Plans
        </Link>

        <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">Import from Excel</h1>
        <p className="text-[var(--text-secondary)] text-sm mb-6">
          Upload your Excel file to import clients, workout plans, nutrition plans, schedules, and workout logs.
        </p>

        {/* Dropzone */}
        {!parsed && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-600/20'
                : 'border-[var(--border)] dark:border-white/20 hover:border-slate-400 dark:hover:border-white/30'
            }`}
          >
            <input {...getInputProps()} />
            <FileSpreadsheet className="w-12 h-12 text-[var(--text-tertiary)] dark:text-[var(--text-tertiary)] mx-auto mb-4" />
            <p className="font-medium text-[var(--text-primary)]">
              {isDragActive ? 'Drop the Excel file here' : 'Drop your Excel file here'}
            </p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              or click to browse · .xlsx, .xls · max 10 MB
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600 mb-4" />
            <p className="text-[var(--text-secondary)]">Parsing Excel file... This may take a moment.</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Parsed Results */}
        {parsed && !loading && (
          <div className="space-y-6">
            {/* File info */}
            <div className="flex items-center justify-between bg-[var(--bg-subtle)] dark:bg-white/[0.03] p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-green-500" />
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{parsed.fileName}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{parsed.sheets.length} sheets found</p>
                </div>
              </div>
              <button
                onClick={() => { setFile(null); setParsed(null); setSelectedSheet(null); setImportResult(null); }}
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Remove file
              </button>
            </div>

            {/* Import result */}
            {importResult && (
              <div className={`p-4 rounded-lg flex items-center gap-3 ${
                importResult.success
                  ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
              }`}>
                <CheckCircle className={`w-5 h-5 ${importResult.success ? 'text-green-500' : 'text-red-500'}`} />
                <p className={importResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                  {importResult.message}
                </p>
              </div>
            )}

            {/* Sheets grid */}
            <div className="grid gap-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Detected Sheets</h2>

              {parsed.sheets.map((sheet, idx) => (
                <div
                  key={idx}
                  className={`border rounded-lg overflow-hidden transition-colors ${
                    selectedSheet === idx
                      ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-900/10'
                      : 'border-[var(--border)] dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[var(--bg-subtle)] dark:bg-white/[0.05] rounded-lg flex items-center justify-center">
                          <Sheet className="w-5 h-5 text-[var(--text-tertiary)]" />
                        </div>
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">{sheet.name}</p>
                          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                            <span className="px-2 py-0.5 bg-[var(--bg-subtle)] dark:bg-white/[0.05] rounded text-xs">
                              {sheet.detectedType}
                            </span>
                            <span>{sheet.rowCount} rows</span>
                            <span>{sheet.headers.length} columns</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedSheet(selectedSheet === idx ? null : idx)}
                        className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        {selectedSheet === idx ? 'Hide' : 'Preview'}
                      </button>
                    </div>

                    {/* Preview table */}
                    {selectedSheet === idx && (
                      <div className="mt-4 border-t border-[var(--border)] dark:border-white/[0.07] pt-4">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead className="bg-[var(--bg-subtle)] dark:bg-white/[0.05]">
                              <tr>
                                {sheet.headers.map((h, hi) => (
                                  <th key={hi} className="px-2 py-2 text-left font-medium text-[var(--text-secondary)] dark:text-[var(--text-tertiary)] whitespace-nowrap">
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)] dark:divide-white/[0.05]">
                              {sheet.preview.map((row, ri) => (
                                <tr key={ri}>
                                  {row.map((cell, ci) => (
                                    <td key={ci} className="px-2 py-2 text-[var(--text-primary)] dark:text-slate-300 whitespace-nowrap max-w-[200px] truncate">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mt-2">Showing first {sheet.preview.length} of {sheet.rowCount} rows</p>
                      </div>
                    )}

                    {/* Import button */}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {sheet.headers.slice(0, 6).map((h, hi) => (
                          <span key={hi} className="text-[10px] px-1.5 py-0.5 bg-[var(--bg-subtle)] dark:bg-white/[0.05] text-[var(--text-tertiary)] rounded">
                            {h}
                          </span>
                        ))}
                        {sheet.headers.length > 6 && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-[var(--bg-subtle)] dark:bg-white/[0.05] text-[var(--text-tertiary)] rounded">
                            +{sheet.headers.length - 6} more
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleImportSheet(idx)}
                        disabled={importing}
                        className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {importing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <Database className="w-4 h-4" />
                            Import
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
