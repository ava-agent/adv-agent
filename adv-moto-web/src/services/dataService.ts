/**
 * Data Service
 *
 * Provides a unified data access layer with priority:
 * 1. Supabase (primary backend)
 * 2. LocalStorage cache (offline fallback)
 * 3. Seed data (first run)
 */

import type { User, Route, Review } from '../types'
import { showToast } from '../utils/storage'
import {
  isSupabaseConfigured,
  getSupabaseClient,
  signInAnonymouslySupabase,
  getSupabaseSession,
  getRoutesFromSupabase,
  getRouteFromSupabase,
  createRouteInSupabase,
  getReviewsFromSupabase,
  createReviewInSupabase,
  getUserFromSupabase,
  upsertUserInSupabase,
  toggleFavoriteInSupabase,
  getFavoritesFromSupabase,
  incrementDownloadCount
} from './supabaseService'

const STORAGE_KEYS = {
  USER: 'adv_moto_user',
  USER_ID: 'adv_moto_user_id',
  ROUTES_CACHE: 'adv_moto_routes_cache',
  ROUTES_CACHE_TIME: 'adv_moto_routes_cache_time',
  OFFLINE_QUEUE: 'adv_moto_offline_queue',
  FAVORITES: 'adv_moto_favorites',
}

function showError(message: string): void {
  showToast(message, 'error')
}

function showInfo(message: string): void {
  showToast(message, 'info')
}

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000

export class DataService {
  private static initialized = false
  private static isOnline = true
  private static currentUserId: string | null = null

  // ============================================
  // Initialization
  // ============================================

  static async initialize(): Promise<void> {
    if (this.initialized) return

    if (isSupabaseConfigured()) {
      try {
        // Check for existing session first
        const { userId } = await getSupabaseSession()
        if (userId) {
          this.currentUserId = userId
        } else {
          // Sign in anonymously for new visitors
          const result = await signInAnonymouslySupabase()
          if (result.success && result.userId) {
            this.currentUserId = result.userId
            // Ensure user record exists
            await upsertUserInSupabase({ id: result.userId })
          }
        }
        console.log('Supabase initialized, user:', this.currentUserId)
      } catch (error) {
        console.warn('Supabase initialization failed, using local storage:', error)
        showInfo('离线模式：使用本地存储')
      }
    } else {
      console.info('Supabase not configured, using local storage')
    }

    await this.processOfflineQueue()
    this.initialized = true

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

  static async getCurrentUser(): Promise<User | null> {
    try {
      if (isSupabaseConfigured() && this.currentUserId) {
        const result = await getUserFromSupabase(this.currentUserId)
        if (result.data) {
          this.cacheUser(result.data)
          return result.data
        }
      }
      return this.getCachedUser()
    } catch (error) {
      console.error('Failed to get current user:', error)
      return this.getCachedUser()
    }
  }

  static async updateUserProfile(params: {
    nickName?: string
    avatarUrl?: string
    bio?: string
    bikes?: Array<{ brand: string; model: string; year: number }>
  }): Promise<{ success: boolean; error?: string }> {
    try {
      if (isSupabaseConfigured() && this.isOnline && this.currentUserId) {
        const result = await upsertUserInSupabase({
          id: this.currentUserId,
          nickname: params.nickName,
          avatarUrl: params.avatarUrl,
          bio: params.bio,
          bikes: params.bikes
        })
        if (result.data) {
          this.cacheUser(result.data)
          return { success: true }
        }
        return { success: false, error: result.error }
      }

      this.queueOfflineAction({ type: 'updateUser', params, timestamp: Date.now() })
      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  // ============================================
  // Route Methods
  // ============================================

  static async getRoutes(params?: {
    difficultyLevel?: number
    terrainTags?: string[]
    minDistance?: number
    maxDistance?: number
    page?: number
    pageSize?: number
  }): Promise<Route[]> {
    try {
      // Return valid cache if no filters and cache is fresh
      const cachedRoutes = this.getCachedRoutes()
      const cacheTime = localStorage.getItem(STORAGE_KEYS.ROUTES_CACHE_TIME)
      const isCacheValid = cacheTime && (Date.now() - parseInt(cacheTime)) < CACHE_DURATION

      if (isCacheValid && !params && cachedRoutes.length > 0) {
        return cachedRoutes
      }

      if (isSupabaseConfigured() && this.isOnline) {
        const result = await getRoutesFromSupabase(params || {})
        if (!result.error && result.data.length > 0) {
          this.cacheRoutes(result.data)
          return result.data
        }
      }

      return cachedRoutes.length > 0 ? cachedRoutes : this.getInitialRoutes()
    } catch (error) {
      console.error('Failed to get routes:', error)
      showError('获取路线列表失败')
      const cached = this.getCachedRoutes()
      return cached.length > 0 ? cached : this.getInitialRoutes()
    }
  }

  static async getRoute(routeId: string): Promise<Route | null> {
    try {
      if (isSupabaseConfigured() && this.isOnline) {
        const result = await getRouteFromSupabase(routeId)
        if (result.data) return result.data
      }

      const cached = this.getCachedRoutes()
      return cached.find(r => r._id === routeId || r.id === routeId) || null
    } catch (error) {
      console.error('Failed to get route:', error)
      showError('获取路线详情失败')
      return null
    }
  }

  static async createRoute(params: {
    title: string
    description: string
    difficultyLevel: number
    terrainTags: string[]
    gpxFile: File
  }): Promise<{ success: boolean; route?: Route; error?: string }> {
    try {
      const { GPXParser } = await import('./gpxParser')
      const gpxContent = await this.readFileAsText(params.gpxFile)
      const gpxData = GPXParser.parse(gpxContent)
      const coordinates = GPXParser.toGeoJSONCoordinates(gpxData)
      const elevationData = GPXParser.getElevationData(gpxData)

      if (isSupabaseConfigured() && this.isOnline) {
        const result = await createRouteInSupabase({
          title: params.title,
          description: params.description,
          difficultyLevel: params.difficultyLevel,
          terrainTags: params.terrainTags,
          geometry: { type: 'LineString', coordinates },
          startPoint: { lat: coordinates[0][1], lon: coordinates[0][0] },
          endPoint: { lat: coordinates[coordinates.length - 1][1], lon: coordinates[coordinates.length - 1][0] },
          distanceKm: Math.round(gpxData.distance * 10) / 10,
          elevationGainM: gpxData.elevationGain,
          estimatedTimeMin: gpxData.estimatedTime,
          elevationData,
          gpxData: gpxContent,
          uploaderId: this.currentUserId || undefined
        })

        if (result.data) {
          localStorage.removeItem(STORAGE_KEYS.ROUTES_CACHE)
          return { success: true, route: result.data }
        }
        return { success: false, error: result.error }
      }

      // Offline: save locally and queue sync
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

      const cached = this.getCachedRoutes()
      this.cacheRoutes([localRoute, ...cached])
      this.queueOfflineAction({ type: 'createRoute', params: { ...params, gpxData: gpxContent }, timestamp: Date.now() })

      showInfo('路线已保存到本地，联网后将自动同步')
      return { success: true, route: localRoute }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  static deleteRoute(routeId: string): void {
    const filtered = this.getCachedRoutes().filter(r => r._id !== routeId)
    this.cacheRoutes(filtered)
  }

  static async recordDownload(routeId: string): Promise<void> {
    if (isSupabaseConfigured() && this.isOnline) {
      await incrementDownloadCount(routeId)
    }
  }

  // ============================================
  // Review Methods
  // ============================================

  static async getReviews(routeId: string): Promise<Review[]> {
    try {
      if (isSupabaseConfigured() && this.isOnline) {
        const result = await getReviewsFromSupabase(routeId)
        if (!result.error) return result.data
      }
      return []
    } catch (error) {
      console.error('Failed to get reviews:', error)
      return []
    }
  }

  static async addReview(review: Omit<Review, '_id' | 'createdAt'>): Promise<{ success: boolean; error?: string }> {
    try {
      if (isSupabaseConfigured() && this.isOnline) {
        const result = await createReviewInSupabase({
          routeId: review.routeId,
          userId: review.userId || this.currentUserId || 'anonymous',
          userName: review.userName,
          userAvatar: review.userAvatar,
          rating: review.rating,
          comment: review.comment,
          photos: review.photos
        })
        if (result.data) return { success: true }
        return { success: false, error: result.error }
      }

      this.queueOfflineAction({ type: 'createReview', params: review, timestamp: Date.now() })
      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  // ============================================
  // Favorite Methods
  // ============================================

  static async getFavorites(): Promise<string[]> {
    try {
      if (isSupabaseConfigured() && this.isOnline && this.currentUserId) {
        const result = await getFavoritesFromSupabase(this.currentUserId)
        if (!result.error) {
          localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(result.data))
          return result.data
        }
      }
      const data = localStorage.getItem(STORAGE_KEYS.FAVORITES)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Failed to get favorites:', error)
      return []
    }
  }

  static async toggleFavorite(routeId: string): Promise<boolean> {
    try {
      if (isSupabaseConfigured() && this.isOnline && this.currentUserId) {
        const result = await toggleFavoriteInSupabase(this.currentUserId, routeId)
        if (!result.error) {
          // Sync local cache
          const favorites = await this.getFavorites()
          localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites))
          return result.isFavorite
        }
      }

      // Local-only toggle
      const favorites = await this.getFavorites()
      const index = favorites.indexOf(routeId)
      const updated = index >= 0
        ? favorites.filter(id => id !== routeId)
        : [...favorites, routeId]
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated))
      return index < 0
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
      showError(error instanceof Error ? error.message : '收藏操作失败')
      return false
    }
  }

  static async isFavorite(routeId: string): Promise<boolean> {
    const favorites = await this.getFavorites()
    return favorites.includes(routeId)
  }

  // ============================================
  // AI Assistant
  // ============================================

  /**
   * Get AI route recommendations using streaming Claude API via Supabase Edge Function.
   * Falls back to simple keyword matching if AI is unavailable.
   */
  static async getAIRecommendations(
    query: string,
    onChunk?: (text: string) => void
  ): Promise<{ routeIds: string[]; message: string }> {
    const routes = await this.getRoutes()
    const routeSummaries = routes.slice(0, 20).map(r => ({
      _id: r._id,
      title: r.title,
      description: r.description,
      difficultyLevel: r.difficultyLevel,
      terrainTags: r.terrainTags,
      distanceKm: r.distanceKm,
      elevationGainM: r.elevationGainM
    }))

    if (isSupabaseConfigured() && this.isOnline) {
      try {
        const client = getSupabaseClient()

        if (onChunk) {
          // Streaming mode
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-route-recommend`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
              },
              body: JSON.stringify({ query, routes: routeSummaries, stream: true })
            }
          )

          if (response.ok && response.body) {
            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let fullText = ''

            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              const chunk = decoder.decode(value, { stream: true })
              fullText += chunk
              onChunk(chunk)
            }

            // Extract route IDs from the response
            const routeIds = this.extractRouteIdsFromText(fullText, routes)
            return { routeIds, message: fullText }
          }
        } else {
          const { data, error } = await client.functions.invoke('ai-route-recommend', {
            body: { query, routes: routeSummaries }
          })
          if (!error && data) {
            return { routeIds: data.routeIds || [], message: data.message || '' }
          }
        }
      } catch (error) {
        console.warn('AI recommendation failed, using keyword match:', error)
      }
    }

    // Fallback: simple keyword matching
    return this.keywordMatchRoutes(query, routes)
  }

  private static extractRouteIdsFromText(text: string, routes: Route[]): string[] {
    return routes
      .filter(r => text.includes(r.title) || text.includes(r._id))
      .map(r => r._id)
      .slice(0, 3)
  }

  private static keywordMatchRoutes(query: string, routes: Route[]): { routeIds: string[]; message: string } {
    const q = query.toLowerCase()
    const difficultyMap: Record<string, number> = {
      '简单': 1, '入门': 1, '初学者': 1, '新手': 1,
      '中级': 2, '中等': 2,
      '困难': 3, '有经验': 3,
      '高难': 4, '挑战': 4,
      '极限': 5, '专业': 5
    }

    let matched = [...routes]

    for (const [keyword, level] of Object.entries(difficultyMap)) {
      if (q.includes(keyword)) {
        matched = matched.filter(r => r.difficultyLevel === level)
        break
      }
    }

    const terrainKeywords = ['碎石', '涉水', '泥泞', '沙地', '高海拔', '草原', '山路', '海边']
    for (const terrain of terrainKeywords) {
      if (q.includes(terrain)) {
        const withTerrain = matched.filter(r => r.terrainTags.some(t => t.includes(terrain)))
        if (withTerrain.length > 0) matched = withTerrain
      }
    }

    const top3 = matched.slice(0, 3)
    const names = top3.map(r => `《${r.title}》`).join('、')
    const message = top3.length > 0
      ? `根据您的描述"${query}"，我为您推荐以下路线：${names}。这些路线与您的偏好最为匹配。`
      : `暂时没有找到完全匹配"${query}"的路线，建议您浏览全部路线寻找灵感。`

    return { routeIds: top3.map(r => r._id), message }
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
    if (!this.isOnline || !isSupabaseConfigured()) return

    const queue = this.getOfflineQueue()
    if (queue.length === 0) return

    console.log(`Processing ${queue.length} offline actions`)
    localStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE)
  }

  // ============================================
  // Helpers
  // ============================================

  private static async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  static clearCache(): void {
    localStorage.removeItem(STORAGE_KEYS.USER)
    localStorage.removeItem(STORAGE_KEYS.ROUTES_CACHE)
    localStorage.removeItem(STORAGE_KEYS.ROUTES_CACHE_TIME)
  }

  // ============================================
  // Seed Data (shown when no backend configured)
  // ============================================

  private static getInitialRoutes(): Route[] {
    return [
      {
        _id: '1', title: '北京延庆穿越线',
        description: '经典ADV穿越路线，途经多个风景优美的山谷和河流。沿途有碎石路、涉水路段和少量泥泞路面，适合有一定越野经验的骑士。',
        difficultyLevel: 3, terrainTags: ['碎石', '涉水', '泥泞'],
        distanceKm: 120, elevationGainM: 800, estimatedTimeMin: 180,
        geometry: { coordinates: [[116.2, 40.5], [116.22, 40.52], [116.25, 40.55], [116.28, 40.58], [116.3, 40.6], [116.32, 40.58], [116.35, 40.56], [116.38, 40.54], [116.4, 40.52]] },
        startPoint: { lat: 40.5, lon: 116.2 }, endPoint: { lat: 40.52, lon: 116.4 },
        downloadCount: 256, uploader: { id: 'user1', nickname: '大漠孤烟', avatarUrl: '' },
        createdAt: '2024-01-15', elevationData: [500, 550, 600, 680, 720, 650, 580, 520, 500]
      },
      {
        _id: '2', title: '川藏南线精华段',
        description: '最美景观大道，高原骑行终极体验。沿途经过雪山、草原、湖泊，海拔变化大，需要适应高海拔环境。',
        difficultyLevel: 4, terrainTags: ['高海拔', '碎石', '泥泞'],
        distanceKm: 380, elevationGainM: 2500, estimatedTimeMin: 480,
        geometry: { coordinates: [[102.5, 30.5], [102.8, 30.6], [103.2, 30.8], [103.5, 31.0], [103.8, 31.2], [104.0, 31.4]] },
        startPoint: { lat: 30.5, lon: 102.5 }, endPoint: { lat: 31.4, lon: 104.0 },
        downloadCount: 1024, uploader: { id: 'user2', nickname: '藏地骑士', avatarUrl: '' },
        createdAt: '2024-01-10', elevationData: [3000, 3200, 3500, 3800, 4200, 4500, 4300, 4000, 3800]
      },
      {
        _id: '3', title: '乌兰布统草原线',
        description: '草原与沙漠的完美结合，轻度越野首选。夏季绿草如茵，秋季金黄一片，是摄影爱好者的天堂。',
        difficultyLevel: 2, terrainTags: ['沙地'],
        distanceKm: 85, elevationGainM: 200, estimatedTimeMin: 120,
        geometry: { coordinates: [[117.0, 42.5], [117.1, 42.52], [117.15, 42.55], [117.2, 42.58], [117.25, 42.6]] },
        startPoint: { lat: 42.5, lon: 117.0 }, endPoint: { lat: 42.6, lon: 117.25 },
        downloadCount: 512, uploader: { id: 'user3', nickname: '草原游侠', avatarUrl: '' },
        createdAt: '2024-01-08', elevationData: [1200, 1220, 1250, 1280, 1300, 1280, 1260, 1240, 1220]
      },
      {
        _id: '4', title: '门头沟山路',
        description: '蜿蜒山路体验，适合周末骑行。沿途风景优美，路况良好，是新手进阶的理想选择。',
        difficultyLevel: 2, terrainTags: ['碎石'],
        distanceKm: 60, elevationGainM: 400, estimatedTimeMin: 90,
        geometry: { coordinates: [[115.9, 39.9], [116.0, 39.92], [116.05, 39.95], [116.1, 39.98], [116.12, 40.0]] },
        startPoint: { lat: 39.9, lon: 115.9 }, endPoint: { lat: 40.0, lon: 116.12 },
        downloadCount: 384, uploader: { id: 'user4', nickname: '山野骑士', avatarUrl: '' },
        createdAt: '2024-01-05', elevationData: [100, 120, 150, 180, 200, 180, 150, 130, 110]
      },
      {
        _id: '5', title: '海南环岛东线',
        description: '热带海岛骑行体验，椰林树影、碧海蓝天。全程沿海公路，风景绝美，适合冬季骑行。',
        difficultyLevel: 1, terrainTags: ['沙地'],
        distanceKm: 280, elevationGainM: 300, estimatedTimeMin: 300,
        geometry: { coordinates: [[110.2, 20.0], [110.5, 19.8], [110.8, 19.6], [111.0, 19.5], [111.2, 19.4]] },
        startPoint: { lat: 20.0, lon: 110.2 }, endPoint: { lat: 19.4, lon: 111.2 },
        downloadCount: 768, uploader: { id: 'user5', nickname: '海岛骑士', avatarUrl: '' },
        createdAt: '2024-01-01', elevationData: [10, 15, 20, 25, 30, 25, 20, 15, 12]
      },
      {
        _id: '6', title: '云南丙察察线',
        description: '极致越野体验，原始森林穿越。路线偏僻，需要携带足够补给，建议结伴同行。',
        difficultyLevel: 5, terrainTags: ['碎石', '泥泞', '涉水'],
        distanceKm: 200, elevationGainM: 1800, estimatedTimeMin: 360,
        geometry: { coordinates: [[98.5, 28.0], [98.6, 28.1], [98.7, 28.15], [98.8, 28.2], [98.85, 28.25]] },
        startPoint: { lat: 28.0, lon: 98.5 }, endPoint: { lat: 28.25, lon: 98.85 },
        downloadCount: 128, uploader: { id: 'user6', nickname: '极限探险', avatarUrl: '' },
        createdAt: '2023-12-28', elevationData: [1500, 1800, 2200, 2600, 3000, 2800, 2400, 2000, 1700]
      }
    ]
  }
}
