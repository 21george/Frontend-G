/**
 * Unit tests for validateDriveUrl
 *
 * Run with: npx tsx src/lib/api/services/__tests__/validateDriveUrl.test.ts
 * (or integrate into vitest/jest once a test runner is configured)
 */
import { validateDriveUrl } from '../workout-plans'

let passed = 0
let failed = 0

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++
  } else {
    failed++
    console.error(`  ✗ FAIL: ${message}`)
  }
}

function assertValid(url: string) {
  const err = validateDriveUrl(url)
  assert(err === null, `Expected "${url}" to be valid, got error: ${err}`)
}

function assertInvalid(url: string, expectedSubstring: string) {
  const err = validateDriveUrl(url)
  assert(err !== null, `Expected "${url}" to be invalid, but it passed validation`)
  if (err) {
    assert(
      err.toLowerCase().includes(expectedSubstring.toLowerCase()),
      `Expected error for "${url}" to contain "${expectedSubstring}", got: "${err}"`
    )
  }
}

// ── Valid URLs ──────────────────────────────────────────────────────────────
console.log('Valid URLs:')
assertValid('https://drive.google.com/file/d/abc123/view')
assertValid('https://docs.google.com/spreadsheets/d/xyz/export')
assertValid('https://drive.googleusercontent.com/export?id=123')

// ── Invalid: not a URL ─────────────────────────────────────────────────────
console.log('Invalid: not a URL:')
assertInvalid('not-a-url', 'valid URL')
assertInvalid('', 'valid URL')
assertInvalid('://missing-scheme', 'valid URL')

// ── Invalid: non-HTTPS ─────────────────────────────────────────────────────
console.log('Invalid: non-HTTPS:')
assertInvalid('http://drive.google.com/file/d/abc', 'HTTPS')
assertInvalid('ftp://drive.google.com/file', 'HTTPS')

// ── Invalid: disallowed hostname ───────────────────────────────────────────
console.log('Invalid: disallowed hostname:')
assertInvalid('https://evil.com/fake-drive', 'Google Drive')
assertInvalid('https://drive.google.com.evil.com/steal', 'Google Drive')
assertInvalid('https://notgoogle.com/drive', 'Google Drive')

// ── Invalid: raw IP addresses (public) ──────────────────────────────────────
console.log('Invalid: raw IP addresses (public):')
assertInvalid('https://8.8.8.8/steal', 'IP address')

// ── Invalid: private IP addresses ──────────────────────────────────────────
console.log('Invalid: private IP addresses:')
assertInvalid('https://127.0.0.1/steal', 'Private')
assertInvalid('https://10.0.0.1/steal', 'Private')
assertInvalid('https://172.16.5.5/steal', 'Private')
assertInvalid('https://172.20.0.1/steal', 'Private')
assertInvalid('https://192.168.1.1/steal', 'Private')
assertInvalid('https://192.168.0.100/steal', 'Private')
assertInvalid('https://169.254.1.1/steal', 'Private')

// ── Summary ────────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)