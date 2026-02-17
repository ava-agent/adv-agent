# CloudBase Deployment Guide

This guide provides step-by-step instructions for deploying ADV Moto Hub to CloudBase.

## Prerequisites

1. **Tencent Cloud Account** - Sign up at https://cloud.tencent.com
2. **CloudBase Environment** - Create a CloudBase environment
3. **Node.js 18+** - For building the frontend

## Step 1: Create CloudBase Environment

1. Go to [CloudBase Console](https://console.cloud.tencent.com/tcb)
2. Click "New Environment" and select:
   - **Environment Name**: adv-moto-hub
   - **Region**: Shanghai (ap-shanghai) or nearest to your users
   - **Plan**: Pay-as-you-go or Free tier for testing
3. Copy your **Environment ID** for later use

## Step 2: Install CloudBase CLI

```bash
npm install -g @cloudbase/cli
```

## Step 3: Configure Environment Variables

Create `.env.local` in the `adv-moto-web` directory:

```bash
cd adv-moto-hub/adv-moto-web
cp .env.example .env.local
```

Edit `.env.local` and replace with your CloudBase Environment ID:

```env
VITE_CLOUDBASE_ENV_ID=your-actual-env-id
VITE_CLOUDBASE_REGION=ap-shanghai
```

## Step 4: Deploy Cloud Functions

From the project root:

```bash
cd adv-moto-hub

# Login to CloudBase
cloudbase login

# Deploy all cloud functions
cloudbase functions:deploy

# Or deploy specific function
cloudbase functions:deploy route-list
cloudbase functions:deploy route-detail
cloudbase functions:deploy route-create
cloudbase functions:deploy review-create
cloudbase functions:deploy user-login
cloudbase functions:deploy user-update
```

## Step 5: Configure Database Security Rules

After deploying cloud functions, configure database security rules:

1. Go to CloudBase Console > Database > Security Rules
2. Add the following rules:

```json
{
  "read": true,
  "write": "auth.uid != null"
}
```

For collections that need public read access (like routes):

```json
{
  "read": true,
  "write": "auth.uid != null"
}
```

## Step 6: Create Database Indexes

Create indexes for better query performance:

**Routes Collection:**
- `difficultyLevel` (ascending)
- `createdAt` (descending)
- `startPoint.lat` (ascending)
- `startPoint.lon` (ascending)

**Reviews Collection:**
- `routeId` (ascending)
- `createdAt` (descending)

**Users Collection:**
- `_openid` (ascending, unique)

## Step 7: Build and Deploy Frontend

```bash
cd adv-moto-web

# Install dependencies
npm install

# Build for production
npm run build

# Deploy to CloudBase Hosting
cd ..
cloudbase hosting deploy adv-moto-web/dist
```

## Step 8: Configure Custom Domain (Optional)

1. Go to CloudBase Console > Hosting > Settings
2. Add your custom domain
3. Configure DNS records as instructed

## Step 9: Configure Storage Rules

1. Go to CloudBase Console > Storage > Rules
2. Add rules for GPX files and images:

```json
[
  {
    "action": "allow",
    "auth": "anonymous",
    "path": "/gpx-files/*",
    "methods": ["GET"]
  },
  {
    "action": "allow",
    "auth": "authenticated",
    "path": "/gpx-files/*",
    "methods": ["POST", "PUT", "DELETE"]
  },
  {
    "action": "allow",
    "auth": "anonymous",
    "path": "/route-images/*",
    "methods": ["GET"]
  },
  {
    "action": "allow",
    "auth": "authenticated",
    "path": "/route-images/*",
    "methods": ["POST", "PUT", "DELETE"]
  }
]
```

## Step 10: Test the Deployment

1. Visit your hosting URL
2. Test core functionality:
   - User authentication
   - Route listing
   - Route upload
   - GPX file download
   - Favorites

## Troubleshooting

### Cloud Function Not Responding

Check logs in CloudBase Console > Cloud Functions > Logs

### CORS Errors

Add CORS configuration in cloud functions:

```javascript
exports.main = async (event, context) => {
  // Add CORS headers
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: JSON.stringify(responseData)
  }
}
```

### Environment Variables Not Loading

1. Check that `.env.local` is in the correct directory
2. Verify variable names match `import.meta.env.VITE_*` pattern
3. Rebuild the frontend after changes

### Database Query Errors

1. Verify collection names match (case-sensitive)
2. Check security rules allow the operation
3. Ensure indexes exist for queried fields

## CloudBase CLI Commands Reference

```bash
# Login
cloudbase login

# List environments
cloudbase env:list

# Deploy functions
cloudbase functions:deploy

# Deploy hosting
cloudbase hosting deploy <path>

# View logs
cloudbase functions:log <function-name>

# View database
cloudbase database:shell
```

## Cost Optimization

1. **Free Tier Limits:**
   - 5 GB database storage
   - 5 GB storage
   - 50K cloud function calls/month
   - 5 GB hosting traffic

2. **Cost Reduction Tips:**
   - Use database indexes to reduce query time
   - Cache frequently accessed data
   - Compress GPX files before upload
   - Enable CDN for static assets

## Security Best Practices

1. **Authentication**: Always verify user identity in cloud functions
2. **Input Validation**: Validate all user inputs
3. **Rate Limiting**: Implement rate limiting for API calls
4. **Data Encryption**: Use HTTPS for all communications
5. **Access Control**: Configure proper security rules for database collections

## Monitoring and Analytics

1. Enable CloudBase monitoring
2. Set up alerts for errors and performance issues
3. Use CloudBase Analytics for user behavior insights

## Next Steps

1. Set up CI/CD pipeline
2. Configure custom domain
3. Enable CDN for static assets
4. Set up backup strategy
5. Implement A/B testing for new features
