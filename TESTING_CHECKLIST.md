# CloudBase Deployment Testing Checklist

This document provides a comprehensive testing checklist for the ADV Moto Hub application deployed on CloudBase.

## Pre-Deployment Checks

### Environment Configuration
- [ ] CloudBase environment created
- [ ] Environment ID configured in `.env.local`
- [ ] Region selected (closest to target users)
- [ ] All environment variables set correctly

### Dependencies
- [ ] CloudBase CLI installed
- [ ] Node.js 18+ installed
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Cloud functions dependencies installed

## Cloud Function Testing

### route-list Function
- [ ] Test fetching all routes
- [ ] Test with difficulty filter
- [ ] Test with terrain tags filter
- [ ] Test with distance range filter
- [ ] Test with geographic bounds filter
- [ ] Test pagination (page, pageSize)
- [ ] Verify error handling for invalid inputs

### route-detail Function
- [ ] Test fetching single route by ID
- [ ] Verify uploader information is included
- [ ] Test with non-existent route ID
- [ ] Verify error handling

### route-create Function
- [ ] Test GPX file upload
- [ ] Test route creation with all required fields
- [ ] Verify GPX parsing (distance, elevation, coordinates)
- [ ] Test with invalid GPX file
- [ ] Verify GeoJSON format
- [ ] Verify calculated statistics

### review-create Function
- [ ] Test review creation
- [ ] Verify rating (1-5) validation
- [ ] Test with empty comment
- [ ] Test with photos
- [ ] Verify user information is attached

### user-login Function
- [ ] Test new user registration
- [ ] Test existing user login
- [ ] Verify OpenID handling
- [ ] Test with WeChat auth context

### user-update Function
- [ ] Test profile update (nickname, avatar)
- [ ] Test bike information update
- [ ] Test bio update
- [ ] Verify user can only update own profile

## Database Testing

### Collections
- [ ] `routes` collection exists
- [ ] `reviews` collection exists
- [ ] `users` collection exists

### Indexes
- [ ] `routes.difficultyLevel` index created
- [ ] `routes.createdAt` index created
- [ ] `routes.startPoint` (lat, lon) index created
- [ ] `reviews.routeId` index created
- [ ] `reviews.createdAt` index created
- [ ] `users._openid` unique index created

### Security Rules
- [ ] Public read access on `routes` collection
- [ ] Write disabled on `routes` collection
- [ ] Authenticated write on `reviews` collection
- [ ] Owner-only access on `users` collection
- [ ] Test permission denied for unauthorized access

## Frontend Testing

### Authentication Flow
- [ ] Anonymous login works
- [ ] User state persists across page refreshes
- [ ] Logout functionality works
- [ ] User profile displays correctly

### Route Discovery
- [ ] Home page loads with featured routes
- [ ] Explore page displays all routes
- [ ] Search functionality works
- [ ] Filters (difficulty, terrain) work correctly
- [ ] Route cards are clickable
- [ ] Pagination works for large datasets

### Route Details
- [ ] Route detail page loads correctly
- [ ] GPX file download works
- [ ] Map/preview displays correctly
- [ ] Route statistics display accurately
- [ ] Reviews display correctly
- [ ] Favorite toggle works
- [ ] Uploader info displays

### Route Upload
- [ ] GPX file upload works
- [ ] File parsing succeeds for valid GPX
- [ ] Form validation works
- [ ] Difficulty selection works
- [ ] Terrain tags selection works
- [ ] Upload progress indicator works
- [ ] Success message displays
- [ ] User is redirected to new route

### Profile Page
- [ ] User profile displays correctly
- [ ] Garage (bikes) displays
- [ ] Favorites count updates
- [ ] Premium status displays correctly
- [ ] Settings menu works
- [ ] Clear data functionality works

## Storage Testing

### File Upload
- [ ] GPX files upload to `gpx-files/` path
- [ ] Images upload to `route-images/` path
- [ ] File size limits enforced
- [ ] File type validation works
- [ ] Upload error handling works

### File Access
- [ ] Public can read GPX files
- [ ] Public can read images
- [ ] Authenticated users can upload files
- [ ] Temp file URLs work correctly

## Integration Testing

### End-to-End User Flows

**New User Registration:**
1. [ ] User visits the site
2. [ ] Anonymous login is triggered
3. [ ] User can browse routes
4. [ ] User can view route details
5. [ ] User can add favorites

**Route Upload Flow:**
1. [ ] User navigates to upload page
2. [ ] User selects GPX file
3. [ ] File is parsed successfully
4. [ ] User fills in route information
5. [ ] Route is created successfully
6. [ ] User is redirected to route details
7. [ ] New route appears in explore page

**Review Submission Flow:**
1. [ ] User views route details
2. [ ] User clicks "Add Review"
3. [ ] User submits rating and comment
4. [ ] Review appears in reviews list
5. [ ] Review count updates

### Cross-Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers

### Device Testing
- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)
- [ ] Large mobile (414x896)

## Performance Testing

### Load Time
- [ ] Initial page load < 3 seconds
- [ ] Route list loads < 2 seconds
- [ ] Route detail loads < 2 seconds
- [ ] GPX upload completes in reasonable time

### Database Queries
- [ ] Route list query < 500ms
- [ ] Route detail query < 200ms
- [ ] Filter queries use indexes
- [ ] No N+1 query problems

### Cloud Functions
- [ ] Cold start < 2 seconds
- [ ] Warm start < 500ms
- [ ] Memory usage within limits
- [ ] No function timeouts

## Error Handling

### Frontend Errors
- [ ] Network errors display user-friendly messages
- [ ] Form validation messages are clear
- [ ] Loading states display correctly
- [ ] Error states display correctly

### Backend Errors
- [ ] Cloud function errors are logged
- [ ] Error responses have proper format
- [ ] No sensitive data in error messages
- [ ] Rate limiting works where appropriate

## Security Testing

### Authentication
- [ ] Protected routes require authentication
- [ ] Users cannot modify others' data
- [ ] Session management works correctly

### Input Validation
- [ ] All user inputs are validated
- [ ] XSS protection is enabled
- [ ] SQL injection protection (parameterized queries)
- [ ] File upload validation (type, size)

### Data Access
- [ ] Security rules enforce restrictions
- [ ] API rate limiting is configured
- [ ] CORS is properly configured

## Accessibility Testing

### Keyboard Navigation
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible
- [ ] Tab order is logical

### Screen Reader
- [ ] Images have alt text
- [ ] Form labels are associated
- [ ] Heading hierarchy is correct

### Visual
- [ ] Color contrast meets WCAG standards
- [ ] Text is resizable
- [ ] No seizure-inducing content

## Post-Deployment Monitoring

### Monitoring Setup
- [ ] CloudBase monitoring enabled
- [ ] Error tracking configured
- [ ] Performance monitoring enabled
- [ ] User analytics configured

### Health Checks
- [ ] Database connection works
- [ ] Cloud functions respond
- [ ] Storage uploads work
- [ ] Frontend loads correctly

## Rollback Plan

### Backup Strategy
- [ ] Database backups scheduled
- [ ] Cloud function versions tracked
- [ ] Frontend deployment artifacts saved

### Rollback Procedure
1. Document current deployment version
2. Identify last stable version
3. Revert cloud functions if needed
4. Restore database if needed
5. Redeploy frontend if needed

## Sign-off

- [ ] All tests passed
- [ ] No critical issues found
- [ ] Performance meets requirements
- [ ] Security requirements met
- [ ] Documentation updated
- [ ] Stakeholder approval received

---

## Test Execution Log

| Date | Tester | Environment | Results | Notes |
|------|--------|-------------|---------|-------|
| ____ | ______ | ___________ | ______ | _____ |
| ____ | ______ | ___________ | ______ | _____ |

## Issue Tracker

| ID | Description | Severity | Status | Assigned To |
|----|-------------|----------|--------|-------------|
| 1 | Example issue | Medium | Open | Developer |
| 2 | Example issue | High | Closed | Developer |
