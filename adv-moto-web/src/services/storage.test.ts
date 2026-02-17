import { describe, it, expect, beforeEach } from 'vitest'
import { LocalStorage } from './storage'
import type { User, Route, Review } from '../types'

const MOCK_USER: User = {
  id: 'u1',
  nickname: 'TestUser',
  avatarUrl: 'https://example.com/avatar.png',
  garage: [],
  isPremium: false,
  createdAt: '2024-01-01'
}

const MOCK_ROUTE: Route = {
  _id: 'test-route-1',
  title: 'Test Route',
  description: 'A test route',
  difficultyLevel: 2,
  terrainTags: ['碎石'],
  distanceKm: 50,
  elevationGainM: 300,
  estimatedTimeMin: 90,
  geometry: { coordinates: [[116.0, 40.0], [116.1, 40.1]] },
  startPoint: { lat: 40.0, lon: 116.0 },
  endPoint: { lat: 40.1, lon: 116.1 },
  downloadCount: 0,
  uploader: { id: 'u1', nickname: 'TestUser', avatarUrl: '' },
  createdAt: '2024-01-01'
}

const MOCK_REVIEW: Review = {
  _id: 'rev-1',
  routeId: 'test-route-1',
  userId: 'u1',
  userName: 'TestUser',
  userAvatar: '',
  rating: 5,
  comment: 'Great route!',
  createdAt: '2024-01-01'
}

describe('LocalStorage - User', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when no user stored', () => {
    expect(LocalStorage.getCurrentUser()).toBeNull()
  })

  it('stores and retrieves a user', () => {
    LocalStorage.setCurrentUser(MOCK_USER)
    const retrieved = LocalStorage.getCurrentUser()
    expect(retrieved).toEqual(MOCK_USER)
  })

  it('removes user when null is set', () => {
    LocalStorage.setCurrentUser(MOCK_USER)
    LocalStorage.setCurrentUser(null)
    expect(LocalStorage.getCurrentUser()).toBeNull()
  })
})

describe('LocalStorage - Routes', () => {
  beforeEach(() => {
    localStorage.clear()
    // Re-initialize with fresh seeded data
    LocalStorage.initialize()
  })

  it('returns seeded routes when no custom routes stored', () => {
    // After clear + initialize, seeded data should be there
    const routes = LocalStorage.getRoutes()
    expect(routes.length).toBeGreaterThan(0)
    expect(routes[0]._id).toBeDefined()
  })

  it('saves a new route and retrieves it', () => {
    LocalStorage.saveRoute(MOCK_ROUTE)
    const retrieved = LocalStorage.getRoute('test-route-1')
    expect(retrieved).not.toBeNull()
    expect(retrieved?.title).toBe('Test Route')
  })

  it('updates an existing route', () => {
    LocalStorage.saveRoute(MOCK_ROUTE)
    const updated = { ...MOCK_ROUTE, title: 'Updated Title' }
    LocalStorage.saveRoute(updated)
    const retrieved = LocalStorage.getRoute('test-route-1')
    expect(retrieved?.title).toBe('Updated Title')
  })

  it('returns null for non-existent route', () => {
    expect(LocalStorage.getRoute('non-existent')).toBeNull()
  })

  it('deletes a route', () => {
    LocalStorage.saveRoute(MOCK_ROUTE)
    LocalStorage.deleteRoute('test-route-1')
    expect(LocalStorage.getRoute('test-route-1')).toBeNull()
  })

  it('prepends new routes to the list', () => {
    const routes = LocalStorage.getRoutes()
    const existingCount = routes.length
    LocalStorage.saveRoute(MOCK_ROUTE)
    const updated = LocalStorage.getRoutes()
    expect(updated.length).toBe(existingCount + 1)
    expect(updated[0]._id).toBe('test-route-1')
  })
})

describe('LocalStorage - Reviews', () => {
  beforeEach(() => {
    localStorage.clear()
    LocalStorage.initialize()
  })

  it('returns reviews for a specific route', () => {
    const reviews = LocalStorage.getReviews('1')
    expect(reviews.length).toBeGreaterThan(0)
    reviews.forEach(r => expect(r.routeId).toBe('1'))
  })

  it('returns empty array for route with no reviews', () => {
    expect(LocalStorage.getReviews('no-reviews-route')).toEqual([])
  })

  it('adds a review and retrieves it', () => {
    LocalStorage.saveRoute(MOCK_ROUTE)
    LocalStorage.addReview(MOCK_REVIEW)
    const reviews = LocalStorage.getReviews('test-route-1')
    expect(reviews).toHaveLength(1)
    expect(reviews[0].comment).toBe('Great route!')
  })
})

describe('LocalStorage - Favorites', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns empty array initially', () => {
    expect(LocalStorage.getFavorites()).toEqual([])
  })

  it('toggleFavorite adds a route', () => {
    const result = LocalStorage.toggleFavorite('route-1')
    expect(result).toBe(true)
    expect(LocalStorage.getFavorites()).toContain('route-1')
  })

  it('toggleFavorite removes a favorited route', () => {
    LocalStorage.toggleFavorite('route-1')
    const result = LocalStorage.toggleFavorite('route-1')
    expect(result).toBe(false)
    expect(LocalStorage.getFavorites()).not.toContain('route-1')
  })

  it('isFavorite returns correct boolean', () => {
    expect(LocalStorage.isFavorite('route-1')).toBe(false)
    LocalStorage.toggleFavorite('route-1')
    expect(LocalStorage.isFavorite('route-1')).toBe(true)
  })
})

describe('LocalStorage - My Routes', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns empty array initially', () => {
    expect(LocalStorage.getMyRoutes()).toEqual([])
  })

  it('adds a route ID to my routes', () => {
    LocalStorage.addMyRoute('r1')
    expect(LocalStorage.getMyRoutes()).toContain('r1')
  })

  it('does not add duplicate route IDs', () => {
    LocalStorage.addMyRoute('r1')
    LocalStorage.addMyRoute('r1')
    expect(LocalStorage.getMyRoutes().filter(r => r === 'r1')).toHaveLength(1)
  })
})

describe('LocalStorage - generateId', () => {
  it('generates a non-empty string', () => {
    const id = LocalStorage.generateId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 10 }, () => LocalStorage.generateId()))
    expect(ids.size).toBe(10)
  })
})

describe('LocalStorage - initialize', () => {
  it('seeds routes and reviews on first call', () => {
    localStorage.clear()
    LocalStorage.initialize()
    expect(LocalStorage.getRoutes().length).toBeGreaterThan(0)
    expect(LocalStorage.getReviews('1').length).toBeGreaterThan(0)
  })

  it('does not overwrite existing routes on second call', () => {
    localStorage.clear()
    LocalStorage.initialize()
    LocalStorage.saveRoute(MOCK_ROUTE)
    const countBefore = LocalStorage.getRoutes().length
    LocalStorage.initialize()
    expect(LocalStorage.getRoutes().length).toBe(countBefore)
  })
})
