# ADV Moto Hub

ADV摩托车骑行路线分享社区。骑士们可以上传GPX路线文件、浏览探索路线地图、评分点评，并体验AI智能路线推荐。

**Live Demo:** https://adv-moto-hub.vercel.app

## 技术栈

| 层次 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript 5.9 + Vite 7 |
| UI 组件库 | Ant Design Mobile 5.x（移动优先） |
| 地图渲染 | MapLibre GL JS 5.x + OpenStreetMap |
| 后端数据库 | Supabase（PostgreSQL + Auth） |
| AI 推荐 | Claude claude-haiku-4-5（via Supabase Edge Function） |
| 路由 | React Router DOM 7.x |
| 测试 | Vitest + @testing-library/react |
| 部署 | Vercel |

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/ava-agent/adv-agent.git
cd adv-agent/adv-moto-web
npm install
```

### 2. 配置 Supabase（可选，不配置则使用本地演示数据）

**创建 Supabase 项目：**

1. 访问 [app.supabase.com](https://app.supabase.com) 创建新项目
2. 在 SQL Editor 中运行 `../supabase/migrations/001_initial_schema.sql`
3. 在项目设置 → API 中获取 `URL` 和 `anon key`

**配置环境变量：**

```bash
cp .env.example .env.local
# 编辑 .env.local，填入你的 Supabase URL 和 anon key
```

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. 启动开发服务器

```bash
npm run dev
# 访问 http://localhost:3000
```

## AI 路线推荐功能

点击页面右下角 🤖 按钮打开AI助手，用自然语言描述你想要的路线：

- "我想找一条适合新手的入门路线"
- "有碎石路和涉水路段的挑战路线"
- "川藏方向的高海拔越野线"

AI助手由 **Claude claude-haiku-4-5** 提供支持，会从现有路线中智能推荐最匹配的路线。

### 配置 AI 功能

AI 推荐需要在 Supabase Edge Function 中配置 Anthropic API Key：

```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录
supabase login

# 设置 API Key（在 Anthropic Console 获取）
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

# 部署 Edge Function
supabase functions deploy ai-route-recommend --project-ref your-project-ref
```

**注意：** 未配置 API Key 时，AI 助手会自动降级为关键词匹配推荐模式，核心功能不受影响。

## 部署到 Vercel

### 方式一：通过 GitHub 自动部署

1. Fork 本仓库到你的 GitHub 账号
2. 在 [vercel.com](https://vercel.com) 导入该仓库
3. 配置以下环境变量：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. 设置根目录为 `adv-moto-web`
5. 构建命令：`npm run build`，输出目录：`dist`

### 方式二：手动部署（当前使用方式）

```bash
cd adv-moto-web

# 构建
npm run build

# 部署（需要 Vercel CLI）
VERCEL_TOKEN=xxx VERCEL_ORG_ID=yyy VERCEL_PROJECT_ID=zzz \
  vercel deploy --yes --prod
```

## 数据库 Schema

完整 SQL 见 `supabase/migrations/001_initial_schema.sql`。

### 主要表结构

```
routes        路线数据（几何、难度、地形标签等）
reviews       用户评价（评分、评论）
users         用户资料（昵称、车库、收藏）
```

### RLS 安全策略

- **routes**: 所有人可读 active 路线；认证用户可创建；仅作者可修改
- **reviews**: 所有人可读；认证用户可创建
- **users**: 所有人可读；仅本人可修改自己的资料

## 开发命令

```bash
npm run dev          # 启动开发服务器（http://localhost:3000）
npm run build        # 生产构建（TypeScript 编译 + Vite 打包）
npm run lint         # ESLint 代码检查
npm run test         # 运行单元测试
npm run test:coverage # 测试覆盖率报告
npm run preview      # 预览生产构建
```

## 项目结构

```
adv-moto-hub/
├── adv-moto-web/                 # 前端 React 应用
│   ├── src/
│   │   ├── pages/               # 页面组件（Home, Explore, Upload, Profile, RouteDetail）
│   │   ├── components/          # 复用组件（RouteMap, ElevationChart, AIAssistant...）
│   │   ├── services/            # 服务层
│   │   │   ├── supabaseService.ts  # Supabase 数据访问层
│   │   │   ├── dataService.ts      # 统一数据服务（Supabase + 本地缓存）
│   │   │   └── gpxParser.ts        # GPX 文件解析
│   │   ├── hooks/               # 自定义 Hooks（useAuth, useBreakpoint）
│   │   └── types/               # TypeScript 类型定义
│   ├── .env.example             # 环境变量模板
│   └── vercel.json              # Vercel SPA 路由配置
└── supabase/
    ├── migrations/
    │   └── 001_initial_schema.sql  # 数据库 Schema
    └── functions/
        └── ai-route-recommend/     # AI 推荐 Edge Function
            └── index.ts
```

## 功能特性

- **路线浏览** — 首页展示精选路线，Explore 页支持难度/地形筛选
- **地图渲染** — MapLibre GL + OpenStreetMap，无需 API Key，合规免费
- **GPX 上传** — 解析 GPX 轨迹文件，自动计算距离/海拔/时间
- **AI 推荐** — Claude claude-haiku-4-5 驱动，自然语言智能路线推荐，支持流式输出
- **收藏系统** — 登录后可收藏路线，云端同步
- **评分评论** — 5星评分 + 文字评论
- **离线支持** — 本地缓存 + 离线队列，断网后恢复自动同步
- **响应式** — 移动端（底部导航）、平板、桌面（顶部导航）全适配
