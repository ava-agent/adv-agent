// useBreakpoint Hook - 检测屏幕尺寸
import { useState, useEffect } from 'react'

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
}

export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop')
  const [screenWidth, setScreenWidth] = useState(0)

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      setScreenWidth(width)

      if (width < breakpoints.tablet) {
        setBreakpoint('mobile')
      } else if (width < breakpoints.desktop) {
        setBreakpoint('tablet')
      } else {
        setBreakpoint('desktop')
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return {
    breakpoint,
    screenWidth,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
  }
}
