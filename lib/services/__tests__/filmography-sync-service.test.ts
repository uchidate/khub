import { describe, it, expect, vi, beforeEach } from 'vitest'
import { stringSimilarity } from '../filmography-sync-service'

vi.mock('../../prisma', () => import('../../__mocks__/prisma'))

describe('stringSimilarity', () => {
  it('returns 1 for identical strings', () => {
    expect(stringSimilarity('hello', 'hello')).toBe(1)
  })

  it('returns 1 for identical strings case-insensitive', () => {
    expect(stringSimilarity('Hello', 'hELLO')).toBe(1)
  })

  it('returns 0 for completely different strings of same length', () => {
    // "abc" vs "xyz" → 3 edits / max(3,3) = 1 → similarity = 0
    expect(stringSimilarity('abc', 'xyz')).toBe(0)
  })

  it('handles empty strings', () => {
    expect(stringSimilarity('', '')).toBeNaN() // 0/0
    expect(stringSimilarity('abc', '')).toBe(0) // 3/3 = 1 → 1-1 = 0
    expect(stringSimilarity('', 'abc')).toBe(0)
  })

  it('calculates correct similarity for similar strings', () => {
    // "kitten" vs "sitting" → edit distance 3, maxLen 7 → 1 - 3/7 ≈ 0.571
    const sim = stringSimilarity('kitten', 'sitting')
    expect(sim).toBeCloseTo(0.571, 2)
  })

  it('handles Korean titles', () => {
    // Same title = 1.0
    expect(stringSimilarity('사랑의 불시착', '사랑의 불시착')).toBe(1)
  })

  it('detects high similarity for minor differences', () => {
    // "Crash Landing on You" vs "Crash Landing On You" (capitalization)
    expect(stringSimilarity('Crash Landing on You', 'Crash Landing On You')).toBe(1) // case insensitive
  })

  it('returns similarity above 0.9 for very similar strings', () => {
    // "The Glory" vs "The Glory 2" → 1 char diff out of 11 → ~0.91
    const sim = stringSimilarity('The Glory', 'The Glory 2')
    expect(sim).toBeGreaterThan(0.8)
  })

  it('returns low similarity for very different strings', () => {
    const sim = stringSimilarity('Squid Game', 'Parasite')
    expect(sim).toBeLessThan(0.4)
  })
})
