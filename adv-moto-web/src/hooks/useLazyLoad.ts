/**
 * useLazyLoad Hook
 *
 * Provides lazy loading for images and components
 */

import { useState, useEffect, useRef } from 'react'

interface LazyLoadOptions {
  /** Root margin in pixels to trigger loading */
  rootMargin?: string
  /** Threshold value (0-1) */
  threshold?: number
  /** Enable for lazy loading once loaded */
  triggerOnce?: boolean
}

interface LazyLoadResult {
  /** Element ref */
  ref: React.RefObject<HTMLElement | null>
  /** Whether element is visible */
  isVisible: boolean
  /** Whether element has loaded at least once */
  hasLoadedOnce: boolean
}

/**
 * Hook for lazy loading elements with IntersectionObserver
 */
export function useLazyLoad(options: LazyLoadOptions = {}): LazyLoadResult {
  const [isVisible, setIsVisible] = useState(false)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const elementRef = useRef<HTMLElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const {
    rootMargin = '0px',
    threshold = 0.1,
    triggerOnce = true,
  } = options

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Create IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isIntersecting = entry.isIntersecting
          setIsVisible(isIntersecting)

          // If triggerOnce is enabled, only load once
          if (triggerOnce && isIntersecting && !hasLoadedOnce) {
            setHasLoadedOnce(true)
          }
        })
      },
      {
        threshold,
        rootMargin,
      }
    )

    observerRef.current = observer

    // Start observing
    observer.observe(element)

    return () => {
      if (observerRef.current) {
        observerRef.current.unobserve(element)
        observerRef.current.disconnect()
      }
    }
  }, [rootMargin, threshold, triggerOnce, hasLoadedOnce])

  return {
    ref: elementRef,
    isVisible,
    hasLoadedOnce,
  }
}

/**
 * Hook for lazy loading images
 */
export function useLazyImage(src: string, options: LazyLoadOptions = {}) {
  const { ref, isVisible, hasLoadedOnce } = useLazyLoad(options)

  const [imageSrc, setImageSrc] = useState<string>(() => {
    // Return placeholder when not visible yet
    if (!isVisible) return ''

    // Use low quality placeholder
    return `${src}?w=10&h=10&blur=20&q=10`
  })

  useEffect(() => {
    if (isVisible && !hasLoadedOnce) {
      // Preload image
      const img = new Image()
      img.onload = () => {
        setImageSrc(src)
      }
      img.src = src
    }
  }, [isVisible, hasLoadedOnce, src])

  return {
    /** Current image source (placeholder or actual) */
    imageSrc,
    /** Element ref */
    ref,
    /** Whether visible */
    isVisible,
  }
}
