import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useLocalStorage } from './useLocalStorage'

const stringList = (raw: unknown) =>
  Array.isArray(raw) && raw.every((v) => typeof v === 'string') ? (raw as string[]) : undefined

describe('useLocalStorage', () => {
  it('round-trips JSON values', () => {
    const { result } = renderHook(() => useLocalStorage('k', 1))
    act(() => result.current[1](2))
    expect(result.current[0]).toBe(2)
    expect(localStorage.getItem('k')).toBe('2')
  })

  it('falls back when stored data has the wrong shape', () => {
    localStorage.setItem('k', '"123"')
    const { result } = renderHook(() => useLocalStorage<string[]>('k', [], stringList))
    expect(result.current[0]).toEqual([])
  })

  it('falls back on invalid JSON', () => {
    localStorage.setItem('k', '{oops')
    const { result } = renderHook(() => useLocalStorage('k', 'default'))
    expect(result.current[0]).toBe('default')
  })
})
