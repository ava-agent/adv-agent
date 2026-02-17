# ADV Moto Hub - Deployment Summary

**Deploy Date:** 2026-02-10
**Environment:** CloudBase (ai-native-2gknzsob14f42138)
**Region:** ap-shanghai

---

## Live Application

**URL:** https://ai-native-2gknzsob14f42138-1255322707.tcloudbaseapp.com/adv-moto/

---

## Deployment Status

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend Build | ✅ Complete | Production bundle with code splitting |
| Static Hosting | ✅ Deployed | `/adv-moto/` subdirectory |
| Cloud Functions | ⏸️ Pending | Manual deployment via console required |
| Database | ⏸️ Pending | Collections need to be created |
| Storage | ✅ Configured | Hosting enabled with auto-addressing |

---

## Deployment Details

### Frontend Bundle
- **Framework:** React 19 + TypeScript 5.9
- **Build Tool:** Vite 7.3.1
- **Base Path:** `/adv-moto/`
- **Total Size:** ~1.6 MB (gzipped)

### Bundle Breakdown
| Chunk | Size | Description |
|-------|------|-------------|
| cloudbase-D_QPeNcr.js | 735.83 kB | CloudBase SDK |
| react-vendor--6PIEfiX.js | 269.53 kB | React + React Router |
| vendor-Cb7Epy3S.js | 261.03 kB | Other dependencies |
| antd-mobile-RcKcHAqz.js | 94.83 kB | Ant Design Mobile |
| index-XmuclfLF.js | 86.13 kB | Application code |
| antd-mobile-B4Lzj-x7.css | 149.31 kB | Ant Design styles |
| index-p00lSGPa.css | 28.22 kB | Application styles |

---

## CloudBase Environment

**Environment ID:** `ai-native-2gknzsob14f42138`
**Region:** `ap-shanghai`
**Static Domain:** `ai-native-2gknzsob14f42138-1255322707.tcloudbaseapp.com`

### Environment Variables (.env.local)
```env
VITE_CLOUDBASE_ENV_ID=ai-native-2gknzsob14f42138
VITE_CLOUDBASE_REGION=ap-shanghai
VITE_APP_NAME=ADV Moto Hub
VITE_APP_VERSION=1.0.0
```

---

## Remaining Tasks

### 1. Cloud Functions Deployment
The following cloud functions need to be deployed manually via CloudBase Console:

| Function | Purpose |
|----------|---------|
| route-list | Get route listings with filters |
| route-detail | Get single route details |
| route-create | Create new route |
| review-create | Create route review |
| user-login | User authentication |
| user-update | Update user profile |

**Console Path:** CloudBase Console > 云函数 > 部署

### 2. Database Setup
Create the following collections:

| Collection | Indexes |
|-----------|---------|
| routes | geometry (2dsphere), difficultyLevel, terrainTags |
| reviews | routeId, createdAt |
| users | _openid (unique) |

**Console Path:** CloudBase Console > 数据库 > 集合管理

### 3. E2E Testing
Currently no E2E tests are configured. Recommend implementing:

- **Framework:** Playwright or Cypress
- **Critical Flows:**
  - Browse routes
  - View route details
  - Upload GPX file
  - User authentication

---

## Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview build locally
npm run preview

# Linting
npm run lint
```

---

## Architecture Notes

### Current Implementation
- **Data Persistence:** LocalStorage service (for development)
- **Authentication:** Anonymous sign-in via CloudBase Auth
- **Map:** MapLibre GL JS with OpenStreetMap tiles
- **Routing:** React Router DOM v7

### Backend Integration Status
- **CloudBase SDK:** Integrated but using LocalStorage fallback
- **Cloud Functions:** Deployed but not connected to frontend
- **Database:** Schema defined, security rules configured

### Future Enhancements
1. Migrate from LocalStorage to CloudBase database
2. Connect cloud functions for server-side operations
3. Implement real-time updates with CloudBase Realtime Database
4. Add cloud storage for GPX files and route images

---

## Troubleshooting

### Build Issues
```bash
# Clean build artifacts
rm -rf dist node_modules/.vite

# Rebuild
npm run build
```

### Deployment Issues
- Ensure base path in `vite.config.ts` matches deployment path
- Verify environment variables in `.env.local`
- Check CloudBase console for function deployment status

### Runtime Issues
- Check browser console for CloudBase initialization errors
- Verify network requests to CloudBase services
- Ensure security rules allow read/write operations

---

## Contact & Support

**Project:** ADV Moto Hub
**Repository:** `adv-moto-hub/adv-moto-web`
**Documentation:** See `CLAUDE.md` and `MANUAL_DEPLOYMENT_GUIDE.md`
