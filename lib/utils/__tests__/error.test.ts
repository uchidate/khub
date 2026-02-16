import { describe, it, expect } from 'vitest'
import { getErrorMessage } from '../error'

describe('getErrorMessage', () => {
  it('extracts message from Error instance', () => {
    expect(getErrorMessage(new Error('something broke'))).toBe('something broke')
  })

  it('extracts message from TypeError', () => {
    expect(getErrorMessage(new TypeError('bad type'))).toBe('bad type')
  })

  it('returns string errors as-is', () => {
    expect(getErrorMessage('plain string error')).toBe('plain string error')
  })

  it('returns "Unknown error" for null', () => {
    expect(getErrorMessage(null)).toBe('Unknown error')
  })

  it('returns "Unknown error" for undefined', () => {
    expect(getErrorMessage(undefined)).toBe('Unknown error')
  })

  it('returns "Unknown error" for plain objects', () => {
    expect(getErrorMessage({ code: 'ERR_NETWORK' })).toBe('Unknown error')
  })

  it('returns "Unknown error" for numbers', () => {
    expect(getErrorMessage(42)).toBe('Unknown error')
  })
})
