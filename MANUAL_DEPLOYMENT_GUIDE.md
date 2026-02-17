# ADV Moto Hub - 完整部署指南

## 📋 部署前准备

### 1. CloudBase 环境配置

1. 访问 [CloudBase 控制台](https://console.cloud.tencent.com/tcb)
2. 创建新环境或使用现有环境
3. 记录环境 ID（格式：`xxx-xxxxx`）

### 2. 安装必要工具

```bash
# 安装 CloudBase CLI
npm install -g @cloudbase/cli

# 验证安装
cloudbase -v
```

### 3. 配置本地环境

```bash
cd adv-moto-hub/adv-moto-web
cp .env.example .env.local
```

编辑 `.env.local`，填入你的 CloudBase 环境 ID：

```env
VITE_CLOUDBASE_ENV_ID=你的环境ID
VITE_CLOUDBASE_REGION=ap-shanghai
```

---

## 🚀 第一步：部署云函数

### 方法一：通过 CloudBase 控制台部署（推荐）

1. 访问 [CloudBase 控制台](https://console.cloud.tencent.com/tcb)
2. 选择你的环境
3. 点击左侧菜单「云函数」
4. 逐个部署云函数：

#### route-list 函数

1. 点击「新建云函数」
2. 函数名称：`route-list`
3. 运行环境：`Node.js 16.13`
4. 内存：256MB
5. 超时时间：60秒
6. 创建后，将 `cloudfunctions/route-list/index.js` 内容复制到在线编辑器
7. 点击「保存并安装依赖」

#### route-detail 函数

1. 函数名称：`route-detail`
2. 运行环境：`Node.js 16.13`
3. 内存：256MB
4. 超时时间：60秒

#### route-create 函数

1. 函数名称：`route-create`
2. 运行环境：`Node.js 16.13`
3. 内存：512MB（需要更多内存处理 GPX）
4. 超时时间：120秒

#### review-create 函数

1. 函数名称：`review-create`
2. 运行环境：`Node.js 16.13`
3. 内存：256MB
4. 超时时间：60秒

#### user-login 函数

1. 函数名称：`user-login`
2. 运行环境：`Node.js 16.13`
3. 内存：256MB
4. 超时时间：60秒

#### user-update 函数

1. 函数名称：`user-update`
2. 运行环境：`Node.js 16.13`
3. 内存：256MB
4. 超时时间：60秒

### 方法二：使用 CLI 部署（需要配置）

```bash
# 部署单个函数
cd cloudfunctions/route-list
npm install
cloudbase functions:deploy route-list

# 重复以上步骤部署其他函数
```

---

## 🗄️ 第二步：设置数据库

### 1. 创建数据库集合

在 CloudBase 控制台 > 数据库 > 集合管理中创建：

1. **routes** 集合 - 路线数据
2. **reviews** 集合 - 评价数据
3. **users** 集合 - 用户数据

### 2. 配置索引

在 CloudBase 控制台 > 数据库 > 索引管理中添加：

#### routes 集合索引：

| 索引名称 | 字段 | 排序 |
|---------|------|------|
| idx_difficulty | difficultyLevel | 1 (升序) |
| idx_createdAt | createdAt | -1 (降序) |
| idx_startPoint | startPoint.lat, startPoint.lon | 1, 1 (升序) |

#### reviews 集合索引：

| 索引名称 | 字段 | 排序 |
|---------|------|------|
| idx_routeId | routeId | 1 (升序) |
| idx_createdAt | createdAt | -1 (降序) |

#### users 集合索引：

| 索引名称 | 字段 | 排序 |
|---------|------|------|
| idx_openid | _openid | 1 (升序) |

### 3. 配置安全规则

在 CloudBase 控制台 > 数据库 > 安全规则中配置：

```json
// routes 集合
{
  "read": true,
  "write": false
}

// reviews 集合
{
  "read": true,
  "write": "auth.uid != null"
}

// users 集合
{
  "read": "doc._openid == auth.openid",
  "write": "doc._openid == auth.openid"
}
```

---

## 📁 第三步：配置云存储

### 1. 配置存储规则

在 CloudBase 控制台 > 云存储 > 规则配置中添加：

```json
[
  {
    "path": "/gpx-files/*",
    "permission": "public",
    "operations": ["read"]
  },
  {
    "path": "/gpx-files/*",
    "permission": "authenticated",
    "operations": ["write", "delete"]
  },
  {
    "path": "/route-images/*",
    "permission": "public",
    "operations": ["read"]
  },
  {
    "path": "/route-images/*",
    "permission": "authenticated",
    "operations": ["write", "delete"]
  }
]
```

---

## 🌐 第四步：部署前端

### 1. 构建前端项目

```bash
cd adv-moto-hub/adv-moto-web

# 安装依赖（如果还没安装）
npm install

# 构建生产版本
npm run build
```

### 2. 上传到 CloudBase 静态网站托管

**方法一：通过 CloudBase 控制台（推荐）**

1. 访问 [CloudBase 控制台](https://console.cloud.tencent.com/tcb)
2. 选择你的环境
3. 点击左侧菜单「静态网站托管」
4. 点击「上传文件」或「上传文件夹」
5. 选择 `adv-moto-web/dist` 目录下的所有文件
6. 上传完成

**方法二：使用 CLI 部署**

```bash
# 在项目根目录
cd adv-moto-hub

# 部署到静态托管
cloudbase hosting deploy adv-moto-web/dist
```

### 3. 配置域名（可选）

1. 在静态网站托管页面，点击「域名设置」
2. 添加你的自定义域名
3. 按照提示配置 DNS 解析

---

## ✅ 第五步：验证部署

### 1. 测试云函数

在 CloudBase 控制台 > 云函数中，点击每个函数的「云端测试」：

#### 测试 route-list

```json
{}
```

预期返回：
```json
{
  "success": true,
  "data": {
    "list": [],
    "total": 0
  }
}
```

#### 测试 route-detail

```json
{
  "routeId": "test-id"
}
```

预期返回（如果不存在）：
```json
{
  "success": false,
  "error": "路线不存在"
}
```

### 2. 测试前端

1. 访问你的静态网站托管 URL
2. 测试基本功能：
   - [ ] 页面能正常加载
   - [ ] 能看到路线列表
   - [ ] 能查看路线详情
   - [ ] 能上传 GPX 文件
   - [ ] 能添加收藏

### 3. 测试云存储

1. 尝试上传一个 GPX 文件
2. 检查文件是否出现在云存储中

---

## 🔧 常见问题解决

### 问题 1：云函数调用失败

**症状**：前端调用云函数时返回错误

**解决方案**：
1. 检查环境 ID 是否正确配置
2. 检查云函数是否已部署
3. 查看云函数日志排查错误

### 问题 2：数据库权限错误

**症状**：数据库操作返回 "Permission denied"

**解决方案**：
1. 检查数据库安全规则配置
2. 确认用户已登录
3. 检查字段名称是否正确

### 问题 3：文件上传失败

**症状**：上传 GPX 文件时返回错误

**解决方案**：
1. 检查云存储规则配置
2. 确认用户已登录
3. 检查文件大小是否超限

### 问题 4：CORS 错误

**症状**：浏览器控制台出现 CORS 错误

**解决方案**：
1. 在云函数中添加 CORS 响应头
2. 配置云托管允许跨域访问

---

## 📊 监控和维护

### 1. 查看云函数日志

在 CloudBase 控制台 > 云函数 > 日志中查看函数调用记录和错误信息。

### 2. 监控数据库性能

在 CloudBase 控制台 > 数据库 > 性能分析中查看慢查询。

### 3. 监控存储使用量

在 CloudBase 控制台 > 云存储中查看存储使用情况。

---

## 🔄 持续集成/持续部署（可选）

### 自动化部署脚本

创建 `deploy.sh`：

```bash
#!/bin/bash

# 1. 构建前端
cd adv-moto-web
npm run build

# 2. 部署前端（需要配置好 CLI）
cd ..
cloudbase hosting deploy adv-moto-web/dist

echo "部署完成！"
```

---

## 📝 部署后检查清单

- [ ] 所有云函数部署成功
- [ ] 数据库集合创建完成
- [ ] 数据库索引配置完成
- [ ] 数据库安全规则配置完成
- [ ] 云存储规则配置完成
- [ ] 前端构建成功
- [ ] 前端部署完成
- [ ] 基本功能测试通过
- [ ] 域名配置完成（可选）

---

## 🎯 下一步

部署完成后，你可以：

1. 添加更多路线数据
2. 优化云函数性能
3. 添加更多功能（如社交、排行榜等）
4. 配置自定义域名
5. 添加数据分析和监控

---

## 💡 提示

- 开发环境可以使用 LocalStorage 模式（不配置 CloudBase）
- 生产环境必须配置 CloudBase
- 定期备份数据库数据
- 监控云函数执行时间和内存使用
- 关注 CloudBase 免费额度限制

---

## 📞 获取帮助

如果遇到问题：

1. 查看 [CloudBase 文档](https://docs.cloudbase.net/)
2. 查看项目 CLAUDE.md 文件
3. 检查云函数日志
4. 查看 GitHub Issues
