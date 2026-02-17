import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBreakpoint, breakpoints } from './useBreakpoint'

function setWindowWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  window.dispatchEvent(new Event('resize'))
}

describe('useBreakpoint', () => {
  beforeEach(() => {
    setWindowWidth(1280) // default desktop
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns desktop breakpoint for wide screen', () => {
    setWindowWidth(1280)
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current.breakpoint).toBe('desktop')
    expect(result.current.isDesktop).toBe(true)
    expect(result.current.isMobile).toBe(false)
    expect(result.current.isTablet).toBe(false)
  })

  it('returns mobile breakpoint for narrow screen', () => {
    setWindowWidth(375)
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current.breakpoint).toBe('mobile')
    expect(result.current.isMobile).toBe(true)
    expect(result.current.isDesktop).toBe(false)
  })

  it('returns tablet breakpoint for medium screen', () => {
    setWindowWidth(900)
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current.breakpoint).toBe('tablet')
    expect(result.current.isTablet).toBe(true)
  })

  it('updates breakpoint on window resize', () => {
    setWindowWidth(1280)
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current.isDesktop).toBe(true)

    act(() => {
      setWindowWidth(375)
    })

    expect(result.current.isMobile).toBe(true)
  })

  it('reports screen width correctly', () => {
    setWindowWidth(1440)
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current.screenWidth).toBe(1440)
  })

  it('uses tablet boundary at exactly tablet breakpoint', () => {
    setWindowWidth(breakpoints.tablet)
    const { result } = renderHook(() => useBreakpoint())
    // width >= tablet but < desktop → tablet
    expect(result.current.breakpoint).toBe('tablet')
  })

  it('uses desktop boundary at exactly desktop breakpoint', () => {
    setWindowWidth(breakpoints.desktop)
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current.breakpoint).toBe('desktop')
  })

  it('cleans up event listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => useBreakpoint())
    unmount()
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function))
  })
})

describe('breakpoints constants', () => {
  it('has correct values', () => {
    expect(breakpoints.mobile).toBe(0)
    expect(breakpoints.tablet).toBe(768)
    expect(breakpoints.desktop).toBe(1024)
  })
})
