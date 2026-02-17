// 类型定义

// API Response wrapper for CloudBase
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Record type for key-value objects
export type StringDictionary = Record<string, string | number | boolean>

export interface User {
  id?: string
  _id?: string
  _openid?: string
  nickname: string
  nickName?: string // CloudBase field name
  avatarUrl: string
  garage?: Bike[]
  bikes?: Bike[] // CloudBase field name
  bio?: string
  favorites?: string[] // Route IDs
  isPremium?: boolean
  createdAt?: string | Date
  updatedAt?: string | Date
}

export interface Bike {
  id: string
  brand: string
  model: string
  year: number
}

export interface Route {
  _id: string
  id?: string // Alternative ID field
  title: string
  description: string
  difficultyLevel: number
  terrainTags: string[]
  distanceKm: number
  elevationGainM: number
  estimatedTimeMin: number
  gpxFileUrl?: string
  gpxData?: string // 存储原始 GPX 数据
  geometry: {
    type?: string
    coordinates: number[][]
  }
  startPoint: {
    lat: number
    lon: number
  }
  endPoint?: {
    lat: number
    lon: number
  }
  downloadCount: number
  uploaderId?: string
  uploader?: {
    id: string
    nickname: string
    avatarUrl: string
  }
  photos?: string[]
  isOfficial?: boolean
  status?: string
  createdAt?: string | Date
  updatedAt?: string | Date
  elevationData?: number[] // 高程数据用于图表
}

export interface Review {
  _id: string
  routeId: string
  userId: string
  userName: string
  userAvatar: string
  rating: number
  comment: string
  photos?: string[]
  createdAt: string
}

export interface GPXTrackPoint {
  lat: number
  lon: number
  ele?: number
  time?: string
}

export interface GPXData {
  name?: string
  points: GPXTrackPoint[]
  distance: number
  elevationGain: number
  elevationLoss: number
  estimatedTime: number
}
