/**
 * Data Service
 *
 * Provides a unified data access layer with:
 * - Primary: CloudBase cloud functions and database
 * - Fallback: LocalStorage for offline support
 * - Automatic synchronization when online
 */

import type { User, Route, Review } from '../types'
import { showToast } from '../utils/storage'
import {
  initCloudBase,
  getLoginState,
  getRoutesFromCloud,
  getRouteDetailFromCloud,
  createRouteOnCloud,
  createReviewOnCloud,
  getReviewsFromCloud,
  getCurrentUser,
  updateUserProfile,
  toggleFavorite as toggleFavoriteCloud,
  getFavoriteRoutes,
  uploadGPXFile,
  isCloudBaseConfigured,
  signInAnonymously
} from './cloudBase'

const STORAGE_KEYS = {
  USER: 'adv_moto_user',
  ROUTES_CACHE: 'adv_moto_routes_cache',
  ROUTES_CACHE_TIME: 'adv_moto_routes_cache_time',
  OFFLINE_QUEUE: 'adv_moto_offline_queue',
  FAVORITES: 'adv_moto_favorites',
}

/**
 * Show error toast notification
 */
function showError(message: string): void {
  showToast(message, 'error')
}

/**
 * Show info toast notification
 */
function showInfo(message: string): void {
  showToast(message, 'info')
}

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000

/**
 * Data Service Class
 */
export class DataService {
  private static initialized = false
  private static isOnline = true

  /**
   * Initialize the data service
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return

    // Check if CloudBase is configured
    if (isCloudBaseConfigured()) {
      try {
        initCloudBase()

        // Try to sign in anonymously if not logged in
        const isLoggedIn = await getLoginState()
        if (!isLoggedIn) {
          await signInAnonymously()
        }

        console.log('CloudBase initialized successfully')
      } catch (error) {
        console.warn('CloudBase initialization failed, using local storage:', error)
        showInfo('离线模式：使用本地存储')
      }
    } else {
      console.warn('CloudBase not configured, using local storage only')
    }

    // Process offline queue
    await this.processOfflineQueue()

    this.initialized = true

    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true
        this.processOfflineQueue()
      })
      window.addEventListener('offline', () => {
        this.isOnline = false
      })
      this.isOnline = navigator.onLine
    }
  }

  // ============================================
  // User Methods
  // ============================================

  /**
   * Get current user
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      if (isCloudBaseConfigured()) {
        const result = await getCurrentUser()
        if (result.success && result.data) {
          // Normalize user data
          const user = this.normalizeUser(result.data)
          this.cacheUser(user)
          return user
        }
      }

      // Fallback to local storage
      return this.getCachedUser()
    } catch (error) {
      console.error('Failed to get current user:', error)
      return this.getCachedUser()
    }  }

  /**
   * Update user profile
   */
  static async updateUserProfile(params: {
    nickName?: string
    avatarUrl?: string
    bio?: string
    bikes?: Array<{ brand: string; model: string; year: number }>
  }): Promise<{ success: boolean; error?: string }> {
    try {
      if (isCloudBaseConfigured() && this.isOnline) {
        const result = await updateUserProfile(params)
        if (result.success) {
          // Clear user cache to force refresh
          localStorage.removeItem(STORAGE_KEYS.USER)
          return { success: true }
        }
        return { success: false, error: result.error }
      }

      // Offline: queue the update
      this.queueOfflineAction({
        type: 'updateUser',
        params,
        timestamp: Date.now()
      })

      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  // ============================================
  // Route Methods
  // ============================================

  /**
   * Get routes with optional filters
   */
  static async getRoutes(params?: {
    difficultyLevel?: number
    terrainTags?: string[]
    minDistance?: number
    maxDistance?: number
    bounds?: {
      sw: { lat: number; lon: number }
      ne: { lat: number; lon: number }
    }
    page?: number
    pageSize?: number
  }): Promise<Route[]> {
    try {
      // Check cache first
      const cachedRoutes = this.getCachedRoutes()
      const cacheTime = localStorage.getItem(STORAGE_KEYS.ROUTES_CACHE_TIME)
      const isCacheValid = cacheTime && (Date.now() - parseInt(cacheTime)) < CACHE_DURATION

      // If cache is valid and no filters, return cached data
      if (isCacheValid && !params && cachedRoutes.length > 0) {
        return cachedRoutes
      }

      // Try to fetch from cloud
      if (isCloudBaseConfigured() && this.isOnline) {
        const result = await getRoutesFromCloud(params || {})
        if (result.success && result.data) {
          const routes = result.data.list.map(r => this.normalizeRoute(r))
          this.cacheRoutes(routes)
          return routes
        }
      }

      // Fallback to cached data
      return cachedRoutes.length > 0 ? cachedRoutes : this.getInitialRoutes()
    } catch (error) {
      console.error('Failed to get routes:', error)
      showError('获取路线列表失败')
      const cachedRoutes = this.getCachedRoutes()
      return cachedRoutes.length > 0 ? cachedRoutes : this.getInitialRoutes()
    }
  }

  /**
   * Get single route by ID
   */
  static async getRoute(routeId: string): Promise<Route | null> {
    try {
      // Check cloud first
      if (isCloudBaseConfigured() && this.isOnline) {
        const result = await getRouteDetailFromCloud(routeId)
        if (result.success && result.data) {
          return this.normalizeRoute(result.data)
        }
      }

      // Fallback to cache
      const cachedRoutes = this.getCachedRoutes()
      return cachedRoutes.find(r => r._id === routeId) || null
    } catch (error) {
      console.error('Failed to get route:', error)
      showError('获取路线详情失败')
      return null
    }
  }

  /**
   * Create new route
   */
  static async createRoute(params: {
    title: string
    description: string
    difficultyLevel: number
    terrainTags: string[]
    gpxFile: File
  }): Promise<{ success: boolean; route?: Route; error?: string }> {
    try {
      if (isCloudBaseConfigured() && this.isOnline) {
        // Upload GPX file first
        const uploadResult = await uploadGPXFile(params.gpxFile)
        if (!uploadResult.success || !uploadResult.data) {
          return { success: false, error: 'Failed to upload GPX file' }
        }

        // Create route with file ID
        const result = await createRouteOnCloud({
          title: params.title,
          description: params.description,
          difficultyLevel: params.difficultyLevel,
          terrainTags: params.terrainTags,
          fileID: uploadResult.data.fileID
        })

        if (result.success && result.data) {
          // Clear cache to force refresh
          localStorage.removeItem(STORAGE_KEYS.ROUTES_CACHE)
          return { success: true, route: this.normalizeRoute(result.data) }
        }

        return { success: false, error: result.error }
      }

      // Offline: save locally with parsed GPX data
      const gpxContent = await this.readFileAsText(params.gpxFile)
      const { GPXParser } = await import('./gpxParser')
      const gpxData = GPXParser.parse(gpxContent)
      const coordinates = GPXParser.toGeoJSONCoordinates(gpxData)
      const elevationData = GPXParser.getElevationData(gpxData)

      const localRoute: Route = {
        _id: `local_${Date.now()}`,
        title: params.title,
        description: params.description,
        difficultyLevel: params.difficultyLevel,
        terrainTags: params.terrainTags,
        distanceKm: Math.round(gpxData.distance * 10) / 10,
        elevationGainM: gpxData.elevationGain,
        estimatedTimeMin: gpxData.estimatedTime,
        gpxData: gpxContent,
        geometry: { type: 'LineString', coordinates },
        startPoint: { lat: coordinates[0][1], lon: coordinates[0][0] },
        endPoint: { lat: coordinates[coordinates.length - 1][1], lon: coordinates[coordinates.length - 1][0] },
        downloadCount: 0,
        uploader: { id: 'local', nickname: '本地用户', avatarUrl: '' },
        createdAt: new Date().toISOString(),
        elevationData,
      }

      // Add to cache
      const cached = this.getCachedRoutes()
      this.cacheRoutes([localRoute, ...cached])

      // Queue for later sync
      this.queueOfflineAction({
        type: 'createRoute',
        params: { ...params, gpxData: gpxContent },
        timestamp: Date.now()
      })

      showInfo('路线已保存到本地，联网后将自动同步')
      return { success: true, route: localRoute }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  /**
   * Delete route (local cache only for now)
   */
  static deleteRoute(routeId: string): void {
    const cachedRoutes = this.getCachedRoutes().filter(r => r._id !== routeId)
    this.cacheRoutes(cachedRoutes)
  }

  // ============================================
  // Review Methods
  // ============================================

  /**
   * Get reviews for a route
   */
  static async getReviews(routeId: string): Promise<Review[]> {
    try {
      if (isCloudBaseConfigured() && this.isOnline) {
        const result = await getReviewsFromCloud(routeId)
        if (result.success && result.data) {
          return result.data.list.map(r => this.normalizeReview(r))
        }
      }

      // Fallback: no reviews available offline
      return []
    } catch (error) {
      console.error('Failed to get reviews:', error)
      showError('获取评论失败')
      return []
    }
  }

  /**
   * Add review
   */
  static async addReview(review: Omit<Review, '_id' | 'createdAt'>): Promise<{ success: boolean; error?: string }> {
    try {
      if (isCloudBaseConfigured() && this.isOnline) {
        const result = await createReviewOnCloud({
          routeId: review.routeId,
          rating: review.rating,
          content: review.comment,
          photos: review.photos
        })

        if (result.success) {
          return { success: true }
        }

        return { success: false, error: result.error }
      }

      // Offline: save locally and queue for sync
      this.queueOfflineAction({
        type: 'createReview',
        params: review,
        timestamp: Date.now()
      })

      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  // ============================================
  // Favorite Methods
  // ============================================

  /**
   * Get favorite routes
   */
  static async getFavorites(): Promise<string[]> {
    try {
      if (isCloudBaseConfigured() && this.isOnline) {
        const result = await getFavoriteRoutes()
        if (result.success && result.data) {
          const ids = result.data.map(r => r._id)
          localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(ids))
          return ids
        }
      }

      // Fallback to local storage
      const data = localStorage.getItem(STORAGE_KEYS.FAVORITES)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Failed to get favorites:', error)
      return []
    }
  }

  /**
   * Toggle favorite status
   */
  static async toggleFavorite(routeId: string): Promise<boolean> {
    try {
      if (isCloudBaseConfigured() && this.isOnline) {
        const result = await toggleFavoriteCloud(routeId)
        if (result.success) {
          // Update local cache
          const favorites = await this.getFavorites()
          const index = favorites.indexOf(routeId)
          if (result.data?.isFavorite && index === -1) {
            favorites.push(routeId)
          } else if (!result.data?.isFavorite && index > -1) {
            favorites.splice(index, 1)
          }
          localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites))
          return result.data?.isFavorite || false
        }
      }

      // Fallback to local storage
      const favorites = await this.getFavorites()
      const index = favorites.indexOf(routeId)
      if (index >= 0) {
        favorites.splice(index, 1)
        localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites))
        return false
      } else {
        favorites.push(routeId)
        localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites))
        return true
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
      showError(error instanceof Error ? error.message : '收藏操作失败')
      return false
    }
  }

  /**
   * Check if route is favorited
   */
  static async isFavorite(routeId: string): Promise<boolean> {
    const favorites = await this.getFavorites()
    return favorites.includes(routeId)
  }

  // ============================================
  // Cache Methods
  // ============================================

  private static cacheUser(user: User): void {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
  }

  private static getCachedUser(): User | null {
    const data = localStorage.getItem(STORAGE_KEYS.USER)
    return data ? JSON.parse(data) : null
  }

  private static cacheRoutes(routes: Route[]): void {
    localStorage.setItem(STORAGE_KEYS.ROUTES_CACHE, JSON.stringify(routes))
    localStorage.setItem(STORAGE_KEYS.ROUTES_CACHE_TIME, Date.now().toString())
  }

  private static getCachedRoutes(): Route[] {
    const data = localStorage.getItem(STORAGE_KEYS.ROUTES_CACHE)
    return data ? JSON.parse(data) : []
  }

  // ============================================
  // Offline Queue
  // ============================================

  private static queueOfflineAction(action: Record<string, unknown>): void {
    const queue = this.getOfflineQueue()
    queue.push(action)
    localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue))
  }

  private static getOfflineQueue(): Record<string, unknown>[] {
    const data = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE)
    return data ? JSON.parse(data) : []
  }

  private static async processOfflineQueue(): Promise<void> {
    if (!this.isOnline || !isCloudBaseConfigured()) {
      return
    }

    const queue = this.getOfflineQueue()
    if (queue.length === 0) return

    console.log(`Processing ${queue.length} offline actions`)

    for (const action of queue) {
      try {
        switch (action.type) {
          case 'createRoute':
            // Process route creation
            break
          case 'createReview':
            // Process review creation
            break
          case 'updateUser':
            // Process user update
            break
        }
      } catch (error) {
        console.error('Failed to process offline action:', error)
      }
    }

    // Clear processed queue
    localStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE)
  }

  // ============================================
  // Helper Methods
  // ============================================

  private static normalizeUser(user: User): User {
    return {
      id: user._id || user.id || '',
      _id: user._id || user.id || '',
      nickname: user.nickName || user.nickname || 'Guest',
      nickName: user.nickName || user.nickname || 'Guest',
      avatarUrl: user.avatarUrl || '',
      garage: user.garage || user.bikes || [],
      bikes: user.bikes || user.garage || [],
      bio: user.bio || '',
      favorites: user.favorites || [],
      isPremium: user.isPremium || false,
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: user.updatedAt || new Date().toISOString()
    }
  }

  private static normalizeRoute(route: Route): Route {
    return {
      _id: route._id || route.id || '',
      id: route.id || route._id || '',
      title: route.title || 'Unknown Route',
      description: route.description || '',
      difficultyLevel: route.difficultyLevel || 1,
      terrainTags: route.terrainTags || [],
      distanceKm: route.distanceKm || 0,
      elevationGainM: route.elevationGainM || 0,
      estimatedTimeMin: route.estimatedTimeMin || 0,
      gpxFileUrl: route.gpxFileUrl || '',
      geometry: route.geometry || { coordinates: [] },
      startPoint: route.startPoint || { lat: 0, lon: 0 },
      endPoint: route.endPoint,
      downloadCount: route.downloadCount || 0,
      uploaderId: route.uploaderId || '',
      uploader: route.uploader || { id: '', nickname: 'Unknown', avatarUrl: '' },
      photos: route.photos || [],
      isOfficial: route.isOfficial || false,
      status: route.status || 'active',
      createdAt: route.createdAt ? new Date(String(route.createdAt)).toISOString() : new Date().toISOString(),
      updatedAt: route.updatedAt ? new Date(String(route.updatedAt)).toISOString() : undefined
    }
  }

  private static normalizeReview(review: Review): Review {
    return {
      _id: review._id || '',
      routeId: review.routeId || '',
      userId: review.userId || '',
      userName: review.userName || 'Unknown',
      userAvatar: review.userAvatar || '',
      rating: review.rating || 0,
      comment: review.comment || '',
      photos: review.photos || [],
      createdAt: review.createdAt ? new Date(String(review.createdAt)).toISOString() : new Date().toISOString()
    }
  }

  private static async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  private static getInitialRoutes(): Route[] {
    return [
      {
        _id: '1',
        title: '北京延庆穿越线',
        description: '经典ADV穿越路线，途经多个风景优美的山谷和河流。沿途有碎石路、涉水路段和少量泥泞路面，适合有一定越野经验的骑士。',
        difficultyLevel: 3,
        terrainTags: ['碎石', '涉水', '泥泞'],
        distanceKm: 120,
        elevationGainM: 800,
        estimatedTimeMin: 180,
        geometry: {
          coordinates: [[116.2, 40.5], [116.22, 40.52], [116.25, 40.55], [116.28, 40.58], [116.3, 40.6], [116.32, 40.58], [116.35, 40.56], [116.38, 40.54], [116.4, 40.52]]
        },
        startPoint: { lat: 40.5, lon: 116.2 },
        endPoint: { lat: 40.52, lon: 116.4 },
        downloadCount: 256,
        uploader: { id: 'user1', nickname: '大漠孤烟', avatarUrl: '' },
        createdAt: '2024-01-15',
        elevationData: [500, 550, 600, 680, 720, 650, 580, 520, 500]
      },
      {
        _id: '2',
        title: '川藏南线精华段',
        description: '最美景观大道，高原骑行终极体验。沿途经过雪山、草原、湖泊，海拔变化大，需要适应高海拔环境。',
        difficultyLevel: 4,
        terrainTags: ['高海拔', '碎石', '泥泞'],
        distanceKm: 380,
        elevationGainM: 2500,
        estimatedTimeMin: 480,
        geometry: {
          coordinates: [[102.5, 30.5], [102.8, 30.6], [103.2, 30.8], [103.5, 31.0], [103.8, 31.2], [104.0, 31.4]]
        },
        startPoint: { lat: 30.5, lon: 102.5 },
        endPoint: { lat: 31.4, lon: 104.0 },
        downloadCount: 1024,
        uploader: { id: 'user2', nickname: '藏地骑士', avatarUrl: '' },
        createdAt: '2024-01-10',
        elevationData: [3000, 3200, 3500, 3800, 4200, 4500, 4300, 4000, 3800]
      },
      {
        _id: '3',
        title: '乌兰布统草原线',
        description: '草原与沙漠的完美结合，轻度越野首选。夏季绿草如茵，秋季金黄一片，是摄影爱好者的天堂。',
        difficultyLevel: 2,
        terrainTags: ['沙地'],
        distanceKm: 85,
        elevationGainM: 200,
        estimatedTimeMin: 120,
        geometry: {
          coordinates: [[117.0, 42.5], [117.1, 42.52], [117.15, 42.55], [117.2, 42.58], [117.25, 42.6]]
        },
        startPoint: { lat: 42.5, lon: 117.0 },
        endPoint: { lat: 42.6, lon: 117.25 },
        downloadCount: 512,
        uploader: { id: 'user3', nickname: '草原游侠', avatarUrl: '' },
        createdAt: '2024-01-08',
        elevationData: [1200, 1220, 1250, 1280, 1300, 1280, 1260, 1240, 1220]
      },
      {
        _id: '4',
        title: '门头沟山路',
        description: '蜿蜒山路体验，适合周末骑行。沿途风景优美，路况良好，是新手进阶的理想选择。',
        difficultyLevel: 2,
        terrainTags: ['碎石'],
        distanceKm: 60,
        elevationGainM: 400,
        estimatedTimeMin: 90,
        geometry: {
          coordinates: [[115.9, 39.9], [116.0, 39.92], [116.05, 39.95], [116.1, 39.98], [116.12, 40.0]]
        },
        startPoint: { lat: 39.9, lon: 115.9 },
        endPoint: { lat: 40.0, lon: 116.12 },
        downloadCount: 384,
        uploader: { id: 'user4', nickname: '山野骑士', avatarUrl: '' },
        createdAt: '2024-01-05',
        elevationData: [100, 120, 150, 180, 200, 180, 150, 130, 110]
      },
      {
        _id: '5',
        title: '海南环岛东线',
        description: '热带海岛骑行体验，椰林树影、碧海蓝天。全程沿海公路，风景绝美，适合冬季骑行。',
        difficultyLevel: 1,
        terrainTags: ['沙地'],
        distanceKm: 280,
        elevationGainM: 300,
        estimatedTimeMin: 300,
        geometry: {
          coordinates: [[110.2, 20.0], [110.5, 19.8], [110.8, 19.6], [111.0, 19.5], [111.2, 19.4]]
        },
        startPoint: { lat: 20.0, lon: 110.2 },
        endPoint: { lat: 19.4, lon: 111.2 },
        downloadCount: 768,
        uploader: { id: 'user5', nickname: '海岛骑士', avatarUrl: '' },
        createdAt: '2024-01-01',
        elevationData: [10, 15, 20, 25, 30, 25, 20, 15, 12]
      },
      {
        _id: '6',
        title: '云南丙察察线',
        description: '极致越野体验，原始森林穿越。路线偏僻，需要携带足够补给，建议结伴同行。',
        difficultyLevel: 5,
        terrainTags: ['碎石', '泥泞', '涉水'],
        distanceKm: 200,
        elevationGainM: 1800,
        estimatedTimeMin: 360,
        geometry: {
          coordinates: [[98.5, 28.0], [98.6, 28.1], [98.7, 28.15], [98.8, 28.2], [98.85, 28.25]]
        },
        startPoint: { lat: 28.0, lon: 98.5 },
        endPoint: { lat: 28.25, lon: 98.85 },
        downloadCount: 128,
        uploader: { id: 'user6', nickname: '极限探险', avatarUrl: '' },
        createdAt: '2023-12-28',
        elevationData: [1500, 1800, 2200, 2600, 3000, 2800, 2400, 2000, 1700]
      }
    ]
  }

  /**
   * Clear all cached data
   */
  static clearCache(): void {
    localStorage.removeItem(STORAGE_KEYS.USER)
    localStorage.removeItem(STORAGE_KEYS.ROUTES_CACHE)
    localStorage.removeItem(STORAGE_KEYS.ROUTES_CACHE_TIME)
  }
}
