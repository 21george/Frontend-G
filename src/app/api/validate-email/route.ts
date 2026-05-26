import { NextRequest, NextResponse } from 'next/server'
import emailValidator from 'node-email-verifier'

// Node.js runtime required for DNS MX record lookups
export const runtime = 'nodejs'

const FORMAT_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/

export async function POST(req: NextRequest) {
  let email = ''
  try {
    const body = await req.json()
    email = (body?.email ?? '').toString().trim()
  } catch {
    return NextResponse.json({ valid: false }, { status: 400 })
  }

  if (!email) return NextResponse.json({ valid: false })

  // Fast format check — return immediately if obviously invalid
  const formatOk = FORMAT_RE.test(email)
  if (!formatOk) return NextResponse.json({ valid: false, reason: 'invalid_format' })

  try {
    // Does format check + DNS MX record lookup with 5s timeout
    const valid = await emailValidator(email, { checkMx: true, timeout: 5000 })
    return NextResponse.json({ valid })
  } catch {
    // DNS timeout or network error — do not fall back to format-only; require MX
    return NextResponse.json({ valid: false, reason: 'dns_lookup_failed' })
  }
}
