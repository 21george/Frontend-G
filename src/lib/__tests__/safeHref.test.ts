import { describe, it, expect } from 'vitest';
import { safeHref, isSafeHref } from '../safeHref';

describe('safeHref', () => {
  describe('rejects XSS vectors', () => {
    it.each([
      'javascript:alert(1)',
      'JavaScript:alert(1)', // case insensitive
      'JAVASCRIPT:alert(1)',
      '  javascript:alert(1)', // leading whitespace
      'data:text/html,<script>alert(1)</script>',
      'vbscript:msgbox(1)',
      'file:///etc/passwd',
      'blob:http://evil.com/abc',
      'ftp://evil.com/file',
      // protocol-relative
      '//evil.com/path',
      '/\\evil.com',
      '\\\\evil.com',
    ])('rejects %s', (url) => {
      expect(safeHref(url)).toBeNull();
      expect(isSafeHref(url)).toBe(false);
    });
  });

  describe('accepts legitimate URLs', () => {
    it.each([
      ['https://example.com', 'https://example.com/'],
      ['http://example.com/path?x=1', 'http://example.com/path?x=1'],
      ['mailto:hi@example.com', 'mailto:hi@example.com'],
      ['tel:+15551234567', 'tel:+15551234567'],
      ['/dashboard', '/dashboard'],
      ['/clients/abc-123', '/clients/abc-123'],
      ['#section', '#section'],
    ])('accepts %s', (input, expected) => {
      const out = safeHref(input);
      expect(out).toBe(expected);
      expect(isSafeHref(input)).toBe(true);
    });
  });

  describe('rejects junk input', () => {
    it.each([
      '',
      '   ',
      null,
      undefined,
      123,
      {},
      [],
      true,
    ])('rejects %p', (input) => {
      expect(safeHref(input as unknown)).toBeNull();
    });
  });

  describe('rejects disguised protocol-relative URLs', () => {
    it('rejects /: (empty protocol-like)', () => {
      // Single slash + colon at position 1 means "protocol:path" form.
      expect(safeHref('/:foo')).toBeNull();
    });

    it('rejects URL with leading whitespace and protocol', () => {
      // "  javascript:alert(1)" — trim() leaves "javascript:..." which
      // is rejected as not-http(s).
      expect(safeHref('   javascript:alert(1)')).toBeNull();
    });
  });
});
