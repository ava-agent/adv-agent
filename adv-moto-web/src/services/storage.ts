// 本地存储服务

import type { User, Route, Review } from '../types'

const STORAGE_KEYS = {
  USER: 'adv_moto_user',
  ROUTES: 'adv_moto_routes',
  REVIEWS: 'adv_moto_reviews',
  FAVORITES: 'adv_moto_favorites',
  MY_ROUTES: 'adv_moto_my_routes',
}

export class LocalStorage {
  // 获取当前用户
  static getCurrentUser(): User | null {
    const data = localStorage.getItem(STORAGE_KEYS.USER)
    return data ? JSON.parse(data) : null
  }

  // 设置当前用户
  static setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER)
    }
  }

  // 获取所有路线
  static getRoutes(): Route[] {
    const data = localStorage.getItem(STORAGE_KEYS.ROUTES)
    return data ? JSON.parse(data) : this.getInitialRoutes()
  }

  // 保存路线
  static saveRoute(route: Route): void {
    const routes = this.getRoutes()
    const index = routes.findIndex(r => r._id === route._id)
    if (index >= 0) {
      routes[index] = route
    } else {
      routes.unshift(route)
    }
    localStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(routes))
  }

  // 获取单个路线
  static getRoute(id: string): Route | null {
    const routes = this.getRoutes()
    return routes.find(r => r._id === id) || null
  }

  // 删除路线
  static deleteRoute(id: string): void {
    const routes = this.getRoutes().filter(r => r._id !== id)
    localStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(routes))
  }

  // 获取路线评价
  static getReviews(routeId: string): Review[] {
    const data = localStorage.getItem(STORAGE_KEYS.REVIEWS)
    const allReviews: Review[] = data ? JSON.parse(data) : []
    return allReviews.filter(r => r.routeId === routeId)
  }

  // 添加评价
  static addReview(review: Review): void {
    const data = localStorage.getItem(STORAGE_KEYS.REVIEWS)
    const allReviews: Review[] = data ? JSON.parse(data) : []
    allReviews.unshift(review)
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(allReviews))
  }

  // 获取收藏列表
  static getFavorites(): string[] {
    const data = localStorage.getItem(STORAGE_KEYS.FAVORITES)
    return data ? JSON.parse(data) : []
  }

  // 切换收藏状态
  static toggleFavorite(routeId: string): boolean {
    const favorites = this.getFavorites()
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
  }

  // 检查是否已收藏
  static isFavorite(routeId: string): boolean {
    return this.getFavorites().includes(routeId)
  }

  // 获取我的路线
  static getMyRoutes(): string[] {
    const data = localStorage.getItem(STORAGE_KEYS.MY_ROUTES)
    return data ? JSON.parse(data) : []
  }

  // 添加到我的路线
  static addMyRoute(routeId: string): void {
    const myRoutes = this.getMyRoutes()
    if (!myRoutes.includes(routeId)) {
      myRoutes.unshift(routeId)
      localStorage.setItem(STORAGE_KEYS.MY_ROUTES, JSON.stringify(myRoutes))
    }
  }

  // 生成唯一ID
  static generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 初始化示例数据
  private static getInitialRoutes(): Route[] {
    return [
      {
        _id: '1',
        title: '北京延庆穿越线',
        description: '这是一条经典的ADV穿越路线，途经多个风景优美的山谷和河流。沿途有碎石路、涉水路段和少量泥泞路面，适合有一定越野经验的骑士。',
        difficultyLevel: 3,
        terrainTags: ['碎石', '涉水', '泥泞'],
        distanceKm: 120,
        elevationGainM: 800,
        estimatedTimeMin: 180,
        geometry: {
          coordinates: [
            [116.2, 40.5],
            [116.22, 40.52],
            [116.25, 40.55],
            [116.28, 40.58],
            [116.3, 40.6],
            [116.32, 40.58],
            [116.35, 40.56],
            [116.38, 40.54],
            [116.4, 40.52]
          ]
        },
        startPoint: { lat: 40.5, lon: 116.2 },
        endPoint: { lat: 40.52, lon: 116.4 },
        downloadCount: 256,
        uploader: {
          id: 'user1',
          nickname: '大漠孤烟',
          avatarUrl: ''
        },
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
          coordinates: [
            [102.5, 30.5],
            [102.8, 30.6],
            [103.2, 30.8],
            [103.5, 31.0],
            [103.8, 31.2],
            [104.0, 31.4]
          ]
        },
        startPoint: { lat: 30.5, lon: 102.5 },
        endPoint: { lat: 31.4, lon: 104.0 },
        downloadCount: 1024,
        uploader: {
          id: 'user2',
          nickname: '藏地骑士',
          avatarUrl: ''
        },
        createdAt: '2024-01-10',
        elevationData: [3000, 3200, 3500, 3800, 4200, 4500, 4300, 4000, 3800]
      },
      {
        _id: '3',
        title: '乌兰布统草原线',
        description: '草原与沙漠的完美结合，轻度越野首选。夏季绿草如茵，秋季金黄一片，是摄影爱好者的天堂。',
        difficultyLevel: 2,
        terrainTags: ['沙地', '草原'],
        distanceKm: 85,
        elevationGainM: 200,
        estimatedTimeMin: 120,
        geometry: {
          coordinates: [
            [117.0, 42.5],
            [117.1, 42.52],
            [117.15, 42.55],
            [117.2, 42.58],
            [117.25, 42.6]
          ]
        },
        startPoint: { lat: 42.5, lon: 117.0 },
        endPoint: { lat: 42.6, lon: 117.25 },
        downloadCount: 512,
        uploader: {
          id: 'user3',
          nickname: '草原游侠',
          avatarUrl: ''
        },
        createdAt: '2024-01-08',
        elevationData: [1200, 1220, 1250, 1280, 1300, 1280, 1260, 1240, 1220]
      },
      {
        _id: '4',
        title: '门头沟山路',
        description: '蜿蜒山路体验，适合周末骑行。沿途风景优美，路况良好，是新手进阶的理想选择。',
        difficultyLevel: 2,
        terrainTags: ['铺装'],
        distanceKm: 60,
        elevationGainM: 400,
        estimatedTimeMin: 90,
        geometry: {
          coordinates: [
            [115.9, 39.9],
            [116.0, 39.92],
            [116.05, 39.95],
            [116.1, 39.98],
            [116.12, 40.0]
          ]
        },
        startPoint: { lat: 39.9, lon: 115.9 },
        endPoint: { lat: 40.0, lon: 116.12 },
        downloadCount: 384,
        uploader: {
          id: 'user4',
          nickname: '山野骑士',
          avatarUrl: ''
        },
        createdAt: '2024-01-05',
        elevationData: [100, 120, 150, 180, 200, 180, 150, 130, 110]
      },
      {
        _id: '5',
        title: '海南环岛东线',
        description: '热带海岛骑行体验，椰林树影、碧海蓝天。全程沿海公路，风景绝美，适合冬季骑行。',
        difficultyLevel: 1,
        terrainTags: ['铺装', '海景'],
        distanceKm: 280,
        elevationGainM: 300,
        estimatedTimeMin: 300,
        geometry: {
          coordinates: [
            [110.2, 20.0],
            [110.5, 19.8],
            [110.8, 19.6],
            [111.0, 19.5],
            [111.2, 19.4]
          ]
        },
        startPoint: { lat: 20.0, lon: 110.2 },
        endPoint: { lat: 19.4, lon: 111.2 },
        downloadCount: 768,
        uploader: {
          id: 'user5',
          nickname: '海岛骑士',
          avatarUrl: ''
        },
        createdAt: '2024-01-01',
        elevationData: [10, 15, 20, 25, 30, 25, 20, 15, 12]
      },
      {
        _id: '6',
        title: '云南丙察察线',
        description: '极致越野体验，原始森林穿越。路线偏僻，需要携带足够补给，建议结伴同行。',
        difficultyLevel: 5,
        terrainTags: ['碎石', '泥泞', '涉水', '单行道'],
        distanceKm: 200,
        elevationGainM: 1800,
        estimatedTimeMin: 360,
        geometry: {
          coordinates: [
            [98.5, 28.0],
            [98.6, 28.1],
            [98.7, 28.15],
            [98.8, 28.2],
            [98.85, 28.25]
          ]
        },
        startPoint: { lat: 28.0, lon: 98.5 },
        endPoint: { lat: 28.25, lon: 98.85 },
        downloadCount: 128,
        uploader: {
          id: 'user6',
          nickname: '极限探险',
          avatarUrl: ''
        },
        createdAt: '2023-12-28',
        elevationData: [1500, 1800, 2200, 2600, 3000, 2800, 2400, 2000, 1700]
      }
    ]
  }

  // 初始化存储（如果为空）
  static initialize(): void {
    if (!localStorage.getItem(STORAGE_KEYS.ROUTES)) {
      localStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(this.getInitialRoutes()))
    }
    if (!localStorage.getItem(STORAGE_KEYS.REVIEWS)) {
      const initialReviews: Review[] = [
        {
          _id: 'r1',
          routeId: '1',
          userId: 'user2',
          userName: '骑士小王',
          userAvatar: '',
          rating: 5,
          comment: '非常棒的路线，风景绝美！碎石路段很有挑战性。',
          createdAt: '2024-01-15'
        },
        {
          _id: 'r2',
          routeId: '1',
          userId: 'user3',
          userName: 'ADV爱好者',
          userAvatar: '',
          rating: 4,
          comment: '难度适中，适合周末骑行。涉水路段要注意安全。',
          createdAt: '2024-01-10'
        },
        {
          _id: 'r3',
          routeId: '3',
          userId: 'user1',
          userName: '草原行者',
          userAvatar: '',
          rating: 5,
          comment: '秋季去简直太美了，金黄色的草原一望无际！',
          createdAt: '2024-01-08'
        }
      ]
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(initialReviews))
    }
  }
}

// 初始化存储
LocalStorage.initialize()
