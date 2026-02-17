# ADV Moto Hub - MVP (最小可行性产品) 规格说明书

## 1. 产品概述
MVP 的核心目标是**建立内容库**和**验证社区需求**。只要用户开始上传高质量的 GPX 路线，平台就有了核心价值。

## 2. 功能详情 (Feature Specs)

### 2.1 用户系统 (User System)
*   **注册/登录**：支持手机号/邮箱注册，微信/Google 第三方登录 (这是为了降低门槛)。
*   **个人中心 (My Garage)**：
    *   显示用户车型（例如：BMW R1250GS, KTM 790）。车型数据将用于后续的装备匹配功能。
    *   显示“我的路线”和“收藏的路线”。

### 2.2 路线核心 (Route Core)
*   **上传 GPX**：
    *   用户拖拽上传 .gpx 文件。
    *   系统自动提取元数据：总里程、海拔升降、预估时间。
*   **路线详情页 (Route Card)**：
    *   **难度评级**：1-5级 (1=铺装路, 5=硬派越野)。
    *   **路况标签**：#碎石 #涉水 #泥泞 #单行道。
    *   **可视化地图**：在地图上展示轨迹，支持缩放。
    *   **互动区**：评论、上传沿途照片。

### 2.3 探索发现 (Explore/Search)
*   **地图模式搜索**：用户拖动地图，查看可视区域内的路线起点。
*   **筛选器**：按“难度”、“车型推荐”（大排量ADV vs 轻型越野）、“距离”筛选。

## 3. 页面结构 (Sitemap)

- **首页 (Home)**
    - Hero Section: 震撼的 ADV 图片 + 搜索框 ("去哪里探险？")
    - 热门路线推荐 (Featured Routes)
    - 最新加入的骑行大佬 (Community Spotlight)
- **探索页 (Explore/Map)**
    - 全屏地图交互
    - 侧边栏显示路线列表
- **路线详情页 (Route Detail)**
    - 地图预览 + 高程图
    - 数据统计 (里程/时间)
    - 评论区
    - "下载 GPX" 按钮
- **上传页 (Upload)**
    - 简单的拖拽上传区域
    - 表单填写 (标题, 描述, 难度)
- **个人中心 (Profile)**

## 4. 简要数据模型 (Data Entities)

*   `User`: id, username, garage (list of bikes), is_premium
*   `Route`:
    *   id, uploader_id
    *   title, description
    *   difficulty_level (1-5)
    *   terrain_tags (enum: gravel, sand, etc.)
    *   gpx_file_url
    *   geometry (GeoJSON representation for map display)
    *   stats (distance_km, elevation_gain_m)
*   `Review`: route_id, user_id, rating, comment, photos

## 5. 待确认问题
*   MVP阶段是否需要做“离线地图”？(建议：MVP阶段仅支持下载GPX文件到手机本地App如Gaia使用，暂不做Web端离线地图，技术成本过高)。
