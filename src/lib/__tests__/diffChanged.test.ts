import { describe, it, expect } from 'vitest';
import { diffChanged, stripUndefined } from '../diffChanged';

describe('diffChanged', () => {
  describe('basic', () => {
    it('returns empty array when nothing changed', () => {
      expect(diffChanged({ name: 'Alice', age: 30 }, { name: 'Alice', age: 30 })).toEqual([]);
    });

    it('returns only the changed field', () => {
      expect(diffChanged({ name: 'Alice', age: 31 }, { name: 'Alice', age: 30 })).toEqual(['age']);
    });

    it('returns [] when original is null', () => {
      expect(diffChanged({ name: 'Alice' }, null)).toEqual([]);
    });

    it('respects fields allowlist', () => {
      expect(
        diffChanged({ name: 'Bob', age: 31 }, { name: 'Alice', age: 30 }, { fields: ['name'] }),
      ).toEqual(['name']);
    });
  });

  describe('normalizeEmpty (default true)', () => {
    it('treats null and "" as equal', () => {
      expect(diffChanged({ notes: null }, { notes: '' })).toEqual([]);
      expect(diffChanged({ notes: '' }, { notes: null })).toEqual([]);
    });

    it('treats undefined and "" as equal', () => {
      expect(diffChanged({ notes: undefined }, { notes: '' })).toEqual([]);
    });

    it('does not flag null → "x" as a no-op', () => {
      expect(diffChanged({ notes: 'x' }, { notes: null })).toEqual(['notes']);
    });
  });

  describe('numeric comparison (regression: String() cast bug)', () => {
    it('100 == "100"', () => {
      expect(diffChanged({ age: 100 }, { age: '100' })).toEqual([]);
    });

    it('1.0 == 1', () => {
      expect(diffChanged({ age: 1.0 }, { age: 1 })).toEqual([]);
    });

    it('"1e2" == 100', () => {
      expect(diffChanged({ age: '1e2' }, { age: 100 })).toEqual([]);
    });

    it('"100foo" !== 100 (was a false-positive bug)', () => {
      expect(diffChanged({ age: '100foo' }, { age: 100 })).toEqual(['age']);
    });

    it('"1abc" !== 1', () => {
      expect(diffChanged({ age: '1abc' }, { age: 1 })).toEqual(['age']);
    });
  });

  describe('boolean strictness', () => {
    it('true !== "1"', () => {
      expect(diffChanged({ active: true }, { active: '1' })).toEqual(['active']);
    });

    it('true !== 1', () => {
      expect(diffChanged({ active: true }, { active: 1 })).toEqual(['active']);
    });
  });

  describe('order-independent sub-documents', () => {
    it('{a:1,b:2} === {b:2,a:1}', () => {
      expect(
        diffChanged({ social: { tw: 'a', ig: 'b' } }, { social: { ig: 'b', tw: 'a' } }),
      ).toEqual([]);
    });
  });
});

describe('stripUndefined', () => {
  it('removes undefined keys', () => {
    expect(stripUndefined({ a: 1, b: undefined, c: 'x' })).toEqual({ a: 1, c: 'x' });
  });
  it('keeps null and ""', () => {
    expect(stripUndefined({ a: null, b: '', c: undefined })).toEqual({ a: null, b: '' });
  });
});
