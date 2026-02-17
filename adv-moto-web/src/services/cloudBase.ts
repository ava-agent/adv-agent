/**
 * CloudBase Service Integration
 *
 * Provides integration with Tencent CloudBase (TCB) services including:
 * - Authentication (Anonymous, WeChat OpenID)
 * - Cloud Functions
 * - Database
 * - Storage (for GPX files and images)
 */

import cloudbase from '@cloudbase/js-sdk';
import type {
  Route,
  Review,
  User,
  ApiResponse
} from '../types';

// Minimal type interfaces for CloudBase SDK instances
interface CloudBaseAuth {
  signInAnonymously: () => Promise<void>;
  weixinAuthProvider: () => { signIn: () => Promise<void> };
  getLoginState: () => Promise<{ uid?: string } | false>;
  signOut: () => Promise<void>;
}

interface CloudBaseCollection {
  get: () => Promise<{ data: unknown[] }>;
  doc: (id: string) => {
    get: () => Promise<{ data: Record<string, unknown> | null }>;
    update: (data: Record<string, unknown>) => Promise<void>;
  };
  where: (query: unknown) => CloudBaseCollection;
}

interface CloudBaseDatabase {
  collection: (name: string) => CloudBaseCollection;
  command: { in: (arr: unknown[]) => unknown };
}

interface CloudBaseFunctions {
  callFunction: (params: { name: string; data: object }) => Promise<{ result: unknown }>;
}

interface CloudBaseApp {
  auth: (options: { persistence: string }) => CloudBaseAuth;
  database: () => CloudBaseDatabase;
  functions: () => CloudBaseFunctions;
  uploadFile: (params: { cloudPath: string; fileContent: File }) => Promise<{ fileID?: string; tempFileURL?: string }>;
  getTempFileURL: (params: { fileList: string[] }) => Promise<{ fileList: Array<{ tempFileURL?: string }> }>;
}

interface CloudFunctionResult {
  success?: boolean;
  data?: unknown;
  error?: string;
}

// CloudBase configuration from environment
const CLOUDBASE_ENV_ID = import.meta.env.VITE_CLOUDBASE_ENV_ID || '';
const CLOUDBASE_REGION = import.meta.env.VITE_CLOUDBASE_REGION || 'ap-shanghai';

// Initialize CloudBase app
let app: CloudBaseApp | null = null;
let auth: CloudBaseAuth | null = null;
let db: CloudBaseDatabase | null = null;
let functions: CloudBaseFunctions | null = null;

/**
 * Initialize CloudBase SDK
 * Should be called once during app initialization
 */
export function initCloudBase(): CloudBaseApp {
  if (app) {
    return app;
  }

  app = cloudbase.init({
    env: CLOUDBASE_ENV_ID,
    region: CLOUDBASE_REGION
  }) as unknown as CloudBaseApp;

  auth = app.auth({
    persistence: 'local'
  });

  db = app.database();
  functions = app.functions();

  return app;
}

/**
 * Get current CloudBase app instance
 */
export function getApp(): CloudBaseApp {
  if (!app) {
    throw new Error('CloudBase not initialized. Call initCloudBase() first.');
  }
  return app;
}

/**
 * Get auth instance
 */
export function getAuth(): CloudBaseAuth {
  if (!auth) {
    throw new Error('CloudBase Auth not initialized.');
  }
  return auth;
}

/**
 * Get database instance
 */
export function getDatabase(): CloudBaseDatabase {
  if (!db) {
    throw new Error('CloudBase Database not initialized.');
  }
  return db;
}

/**
 * Get functions instance
 */
export function getFunctions(): CloudBaseFunctions {
  if (!functions) {
    throw new Error('CloudBase Functions not initialized.');
  }
  return functions;
}

// ============================================
// Authentication
// ============================================

/**
 * Sign in anonymously
 */
export async function signInAnonymously(): Promise<{ success: boolean; error?: string }> {
  try {
    const authInstance = getAuth();
    await authInstance.signInAnonymously();
    return { success: true };
  } catch (error: unknown) {
    console.error('Anonymous sign-in failed:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Sign in with WeChat (for mini-program)
 */
export async function signInWithWeChat(): Promise<{ success: boolean; error?: string }> {
  try {
    const authInstance = getAuth();
    await authInstance.weixinAuthProvider().signIn();
    return { success: true };
  } catch (error: unknown) {
    console.error('WeChat sign-in failed:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Get current login state
 */
export async function getLoginState(): Promise<boolean> {
  try {
    const authInstance = getAuth();
    const loginState = await authInstance.getLoginState();
    return loginState !== false;
  } catch {
    return false;
  }
}

/**
 * Sign out
 */
export async function signOut(): Promise<void> {
  try {
    const authInstance = getAuth();
    await authInstance.signOut();
  } catch (error) {
    console.error('Sign out failed:', error);
  }
}

// ============================================
// Cloud Functions
// ============================================

/**
 * Call cloud function with error handling
 */
async function callFunction<T>(name: string, data: object): Promise<ApiResponse<T>> {
  try {
    const functionsInstance = getFunctions();
    const result = await functionsInstance.callFunction({
      name,
      data
    });

    const response = result.result as CloudFunctionResult;

    if (response?.success) {
      return {
        success: true,
        data: response.data as T
      };
    } else {
      return {
        success: false,
        error: response?.error || 'Unknown error'
      };
    }
  } catch (error: unknown) {
    console.error(`Cloud function ${name} failed:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
}

// ============================================
// Route Services
// ============================================

/**
 * Get route list with filters and pagination
 */
export interface RouteListParams {
  page?: number;
  pageSize?: number;
  difficultyLevel?: number;
  terrainTags?: string[];
  minDistance?: number;
  maxDistance?: number;
  bounds?: {
    sw: { lat: number; lon: number };
    ne: { lat: number; lon: number };
  };
}

export interface RouteListResponse {
  list: Route[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getRoutesFromCloud(
  params: RouteListParams = {}
): Promise<ApiResponse<RouteListResponse>> {
  return callFunction<RouteListResponse>('route-list', params);
}

/**
 * Get single route details
 */
export async function getRouteDetailFromCloud(
  routeId: string
): Promise<ApiResponse<Route>> {
  return callFunction<Route>('route-detail', { routeId });
}

/**
 * Create new route from GPX file
 */
export interface CreateRouteParams {
  title: string;
  description: string;
  difficultyLevel: number;
  terrainTags: string[];
  fileID: string;
}

export async function createRouteOnCloud(
  params: CreateRouteParams
): Promise<ApiResponse<Route>> {
  return callFunction<Route>('route-create', params);
}

// ============================================
// Review Services
// ============================================

/**
 * Create route review
 */
export interface CreateReviewParams {
  routeId: string;
  rating: number;
  content: string;
  photos?: string[];
}

export async function createReviewOnCloud(
  params: CreateReviewParams
): Promise<ApiResponse<Review>> {
  return callFunction<Review>('review-create', params);
}

/**
 * Get reviews for a route
 */
export async function getReviewsFromCloud(
  routeId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<ApiResponse<{ list: Review[]; total: number }>> {
  return callFunction('review-list', { routeId, page, pageSize });
}

// ============================================
// User Services
// ============================================

/**
 * User login/register
 */
export interface LoginParams {
  nickName?: string;
  avatarUrl?: string;
}

export async function userLogin(params: LoginParams = {}): Promise<ApiResponse<User>> {
  return callFunction<User>('user-login', params);
}

/**
 * Update user profile
 */
export interface UpdateUserParams {
  nickName?: string;
  avatarUrl?: string;
  bio?: string;
  bikes?: Array<{
    brand: string;
    model: string;
    year: number;
  }>;
}

export async function updateUserProfile(params: UpdateUserParams): Promise<ApiResponse<User>> {
  return callFunction<User>('user-update', params);
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<ApiResponse<User>> {
  try {
    const dbInstance = getDatabase();
    const result = await dbInstance.collection('users').get();

    if (result.data && result.data.length > 0) {
      return {
        success: true,
        data: result.data[0] as User
      };
    }

    return {
      success: false,
      error: 'User not found'
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// ============================================
// Storage Services
// ============================================

/**
 * Upload GPX file to cloud storage
 */
export async function uploadGPXFile(
  file: File
): Promise<ApiResponse<{ fileID: string; tempFileURL: string }>> {
  try {
    const appInstance = getApp();
    // For browser environment, we need to use the uploadFile API differently
    // First, we'll call a cloud function to handle the file upload
    // Or use CloudBase storage API with File object
    const result = await appInstance.uploadFile({
      cloudPath: `gpx-files/${Date.now()}-${file.name}`,
      fileContent: file
    });

    if (result.fileID) {
      return {
        success: true,
        data: {
          fileID: result.fileID,
          tempFileURL: result.tempFileURL || ''
        }
      };
    }

    return {
      success: false,
      error: 'Upload failed'
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Upload image to cloud storage
 */
export async function uploadImage(
  file: File
): Promise<ApiResponse<{ fileID: string; tempFileURL: string }>> {
  try {
    const appInstance = getApp();
    const result = await appInstance.uploadFile({
      cloudPath: `route-images/${Date.now()}-${file.name}`,
      fileContent: file
    });

    if (result.fileID) {
      return {
        success: true,
        data: {
          fileID: result.fileID,
          tempFileURL: result.tempFileURL || ''
        }
      };
    }

    return {
      success: false,
      error: 'Upload failed'
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Get temporary file URL
 */
export async function getTempFileURL(
  fileID: string
): Promise<ApiResponse<string>> {
  try {
    const appInstance = getApp();
    const result = await appInstance.getTempFileURL({
      fileList: [fileID]
    });

    if (result.fileList && result.fileList[0]?.tempFileURL) {
      return {
        success: true,
        data: result.fileList[0].tempFileURL
      };
    }

    return {
      success: false,
      error: 'Failed to get temporary URL'
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// ============================================
// Favorite Management
// ============================================

/**
 * Toggle favorite status for a route
 */
export async function toggleFavorite(
  routeId: string
): Promise<ApiResponse<{ isFavorite: boolean }>> {
  try {
    const dbInstance = getDatabase();
    const userId = await getCurrentUserId();

    if (!userId) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    // Get current user
    const userResult = await dbInstance
      .collection('users')
      .doc(userId)
      .get();

    if (!userResult.data) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    const userData = userResult.data as Record<string, unknown>;
    const favorites = (userData.favorites as string[]) || [];
    const index = favorites.indexOf(routeId);
    let isFavorite: boolean;

    if (index > -1) {
      // Remove from favorites
      favorites.splice(index, 1);
      isFavorite = false;
    } else {
      // Add to favorites
      favorites.push(routeId);
      isFavorite = true;
    }

    // Update user
    await dbInstance
      .collection('users')
      .doc(userId)
      .update({
        favorites,
        updatedAt: new Date()
      });

    return {
      success: true,
      data: { isFavorite }
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Get user's favorite routes
 */
export async function getFavoriteRoutes(): Promise<ApiResponse<Route[]>> {
  try {
    const dbInstance = getDatabase();
    const userId = await getCurrentUserId();

    if (!userId) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    const userResult = await dbInstance
      .collection('users')
      .doc(userId)
      .get();

    if (!userResult.data) {
      return {
        success: true,
        data: []
      };
    }

    const userData = userResult.data as Record<string, unknown>;
    const favorites = (userData.favorites as string[]) || [];

    if (favorites.length === 0) {
      return {
        success: true,
        data: []
      };
    }

    // Get route details
    const routesResult = await dbInstance
      .collection('routes')
      .where({
        _id: dbInstance.command.in(favorites)
      })
      .get();

    return {
      success: true,
      data: routesResult.data as Route[]
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get current user ID from auth
 */
async function getCurrentUserId(): Promise<string | null> {
  try {
    const authInstance = getAuth();
    const loginState = await authInstance.getLoginState();

    if (loginState && typeof loginState === 'object') {
      return loginState.uid || null;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Check if CloudBase is properly configured
 */
export function isCloudBaseConfigured(): boolean {
  return !!CLOUDBASE_ENV_ID && CLOUDBASE_ENV_ID !== 'your-env-id-here';
}

/**
 * Export CloudBase instance info for debugging
 */
export function getCloudBaseInfo() {
  return {
    isConfigured: isCloudBaseConfigured(),
    envId: CLOUDBASE_ENV_ID,
    region: CLOUDBASE_REGION,
    isInitialized: !!app
  };
}
