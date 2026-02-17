/**
 * Supabase Service Integration
 *
 * Provides data access via Supabase for:
 * - Routes (CRUD)
 * - Reviews (CRUD)
 * - User profiles
 * - Anonymous authentication
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Route, Review, User } from '../types'

// Environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

let supabase: SupabaseClient | null = null

export function isSupabaseConfigured(): boolean {
  return !!SUPABASE_URL && !!SUPABASE_ANON_KEY &&
    SUPABASE_URL !== 'your-project-url' &&
    SUPABASE_ANON_KEY !== 'your-anon-key'
}

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }
  return supabase
}

// ============================================
// Authentication
// ============================================

export async function signInAnonymouslySupabase(): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const client = getSupabaseClient()
    const { data, error } = await client.auth.signInAnonymously()
    if (error) throw error
    return { success: true, userId: data.user?.id }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function getSupabaseSession(): Promise<{ userId: string | null }> {
  try {
    const client = getSupabaseClient()
    const { data } = await client.auth.getSession()
    return { userId: data.session?.user?.id ?? null }
  } catch {
    return { userId: null }
  }
}

export async function signOutSupabase(): Promise<void> {
  try {
    const client = getSupabaseClient()
    await client.auth.signOut()
  } catch (error) {
    console.error('Supabase sign out failed:', error)
  }
}

// ============================================
// Route Services
// ============================================

export interface RouteFilters {
  difficultyLevel?: number
  terrainTags?: string[]
  minDistance?: number
  maxDistance?: number
  page?: number
  pageSize?: number
}

export async function getRoutesFromSupabase(filters: RouteFilters = {}): Promise<{ data: Route[]; total: number; error?: string }> {
  try {
    const client = getSupabaseClient()
    const { page = 1, pageSize = 20, difficultyLevel, terrainTags, minDistance, maxDistance } = filters

    let query = client
      .from('routes')
      .select('*', { count: 'exact' })
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (difficultyLevel) {
      query = query.eq('difficulty_level', difficultyLevel)
    }
    if (terrainTags && terrainTags.length > 0) {
      query = query.overlaps('terrain_tags', terrainTags)
    }
    if (minDistance !== undefined) {
      query = query.gte('distance_km', minDistance)
    }
    if (maxDistance !== undefined) {
      query = query.lte('distance_km', maxDistance)
    }

    const { data, count, error } = await query
    if (error) throw error

    return {
      data: (data || []).map(normalizeRouteFromDB),
      total: count || 0
    }
  } catch (error: unknown) {
    return { data: [], total: 0, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function getRouteFromSupabase(routeId: string): Promise<{ data: Route | null; error?: string }> {
  try {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('routes')
      .select('*')
      .eq('id', routeId)
      .single()

    if (error) throw error
    return { data: data ? normalizeRouteFromDB(data) : null }
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function createRouteInSupabase(params: {
  title: string
  description: string
  difficultyLevel: number
  terrainTags: string[]
  geometry: { type: string; coordinates: number[][] }
  startPoint: { lat: number; lon: number }
  endPoint?: { lat: number; lon: number }
  distanceKm: number
  elevationGainM: number
  estimatedTimeMin: number
  elevationData?: number[]
  gpxData?: string
  uploaderId?: string
}): Promise<{ data: Route | null; error?: string }> {
  try {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('routes')
      .insert({
        title: params.title,
        description: params.description,
        difficulty_level: params.difficultyLevel,
        terrain_tags: params.terrainTags,
        geometry: params.geometry,
        start_point: params.startPoint,
        end_point: params.endPoint,
        distance_km: params.distanceKm,
        elevation_gain_m: params.elevationGainM,
        estimated_time_min: params.estimatedTimeMin,
        elevation_data: params.elevationData,
        gpx_data: params.gpxData,
        uploader_id: params.uploaderId,
        download_count: 0,
        status: 'active'
      })
      .select()
      .single()

    if (error) throw error
    return { data: data ? normalizeRouteFromDB(data) : null }
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function incrementDownloadCount(routeId: string): Promise<void> {
  try {
    const client = getSupabaseClient()
    await client.rpc('increment_download_count', { route_id: routeId })
  } catch (error) {
    console.error('Failed to increment download count:', error)
  }
}

// ============================================
// Review Services
// ============================================

export async function getReviewsFromSupabase(
  routeId: string,
  page = 1,
  pageSize = 20
): Promise<{ data: Review[]; total: number; error?: string }> {
  try {
    const client = getSupabaseClient()
    const { data, count, error } = await client
      .from('reviews')
      .select('*', { count: 'exact' })
      .eq('route_id', routeId)
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (error) throw error
    return {
      data: (data || []).map(normalizeReviewFromDB),
      total: count || 0
    }
  } catch (error: unknown) {
    return { data: [], total: 0, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function createReviewInSupabase(params: {
  routeId: string
  userId: string
  userName: string
  userAvatar: string
  rating: number
  comment: string
  photos?: string[]
}): Promise<{ data: Review | null; error?: string }> {
  try {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('reviews')
      .insert({
        route_id: params.routeId,
        user_id: params.userId,
        user_name: params.userName,
        user_avatar: params.userAvatar,
        rating: params.rating,
        comment: params.comment,
        photos: params.photos || []
      })
      .select()
      .single()

    if (error) throw error
    return { data: data ? normalizeReviewFromDB(data) : null }
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : String(error) }
  }
}

// ============================================
// User Services
// ============================================

export async function getUserFromSupabase(userId: string): Promise<{ data: User | null; error?: string }> {
  try {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return { data: data ? normalizeUserFromDB(data) : null }
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function upsertUserInSupabase(params: {
  id: string
  nickname?: string
  avatarUrl?: string
  bio?: string
  bikes?: Array<{ brand: string; model: string; year: number }>
}): Promise<{ data: User | null; error?: string }> {
  try {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('users')
      .upsert({
        id: params.id,
        nickname: params.nickname || '骑士',
        avatar_url: params.avatarUrl || '',
        bio: params.bio || '',
        bikes: params.bikes || [],
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single()

    if (error) throw error
    return { data: data ? normalizeUserFromDB(data) : null }
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function toggleFavoriteInSupabase(
  userId: string,
  routeId: string
): Promise<{ isFavorite: boolean; error?: string }> {
  try {
    const client = getSupabaseClient()

    // Get current favorites
    const { data: userData, error: fetchError } = await client
      .from('users')
      .select('favorites')
      .eq('id', userId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError

    const currentFavorites: string[] = userData?.favorites || []
    const index = currentFavorites.indexOf(routeId)
    const newFavorites = index >= 0
      ? currentFavorites.filter(id => id !== routeId)
      : [...currentFavorites, routeId]

    const { error: updateError } = await client
      .from('users')
      .upsert({ id: userId, favorites: newFavorites, updated_at: new Date().toISOString() }, { onConflict: 'id' })

    if (updateError) throw updateError
    return { isFavorite: index < 0 }
  } catch (error: unknown) {
    return { isFavorite: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function getFavoritesFromSupabase(userId: string): Promise<{ data: string[]; error?: string }> {
  try {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('users')
      .select('favorites')
      .eq('id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return { data: data?.favorites || [] }
  } catch (error: unknown) {
    return { data: [], error: error instanceof Error ? error.message : String(error) }
  }
}

// ============================================
// AI Route Recommendations (via Supabase Edge Function)
// ============================================

export interface AIRouteQuery {
  query: string
  routes: Pick<Route, '_id' | 'title' | 'description' | 'difficultyLevel' | 'terrainTags' | 'distanceKm' | 'elevationGainM'>[]
}

export interface AIRouteRecommendation {
  routeIds: string[]
  reasoning: string
  message: string
}

export async function getAIRouteRecommendations(
  params: AIRouteQuery
): Promise<{ data: AIRouteRecommendation | null; error?: string }> {
  try {
    const client = getSupabaseClient()
    const { data, error } = await client.functions.invoke('ai-route-recommend', {
      body: params
    })

    if (error) throw error
    return { data: data as AIRouteRecommendation }
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : String(error) }
  }
}

// ============================================
// Data Normalization
// ============================================

function normalizeRouteFromDB(row: Record<string, unknown>): Route {
  return {
    _id: String(row.id || ''),
    id: String(row.id || ''),
    title: String(row.title || ''),
    description: String(row.description || ''),
    difficultyLevel: Number(row.difficulty_level) || 1,
    terrainTags: (row.terrain_tags as string[]) || [],
    distanceKm: Number(row.distance_km) || 0,
    elevationGainM: Number(row.elevation_gain_m) || 0,
    estimatedTimeMin: Number(row.estimated_time_min) || 0,
    geometry: (row.geometry as Route['geometry']) || { coordinates: [] },
    startPoint: (row.start_point as Route['startPoint']) || { lat: 0, lon: 0 },
    endPoint: row.end_point as Route['endPoint'],
    downloadCount: Number(row.download_count) || 0,
    uploaderId: String(row.uploader_id || ''),
    uploader: (row.uploader as Route['uploader']) || { id: '', nickname: '骑士', avatarUrl: '' },
    photos: (row.photos as string[]) || [],
    elevationData: (row.elevation_data as number[]) || [],
    gpxData: row.gpx_data as string | undefined,
    isOfficial: Boolean(row.is_official),
    status: String(row.status || 'active'),
    createdAt: String(row.created_at || new Date().toISOString()),
    updatedAt: row.updated_at ? String(row.updated_at) : undefined
  }
}

function normalizeReviewFromDB(row: Record<string, unknown>): Review {
  return {
    _id: String(row.id || ''),
    routeId: String(row.route_id || ''),
    userId: String(row.user_id || ''),
    userName: String(row.user_name || ''),
    userAvatar: String(row.user_avatar || ''),
    rating: Number(row.rating) || 0,
    comment: String(row.comment || ''),
    photos: (row.photos as string[]) || [],
    createdAt: String(row.created_at || new Date().toISOString())
  }
}

function normalizeUserFromDB(row: Record<string, unknown>): User {
  return {
    id: String(row.id || ''),
    _id: String(row.id || ''),
    nickname: String(row.nickname || '骑士'),
    nickName: String(row.nickname || '骑士'),
    avatarUrl: String(row.avatar_url || ''),
    bio: String(row.bio || ''),
    garage: (row.bikes as User['garage']) || [],
    bikes: (row.bikes as User['bikes']) || [],
    favorites: (row.favorites as string[]) || [],
    isPremium: Boolean(row.is_premium),
    createdAt: String(row.created_at || new Date().toISOString()),
    updatedAt: row.updated_at ? String(row.updated_at) : undefined
  }
}
