# CloudBase Database Security Rules

This file contains the security rules for CloudBase database collections.

## Overview

CloudBase database security rules define who can read and write data in your database collections. Rules are evaluated on every database operation.

## Collection Rules

### Routes Collection

```json
{
  "read": true,
  "write": false
}
```

**Read:** Public access - anyone can view routes
**Write:** Disabled - routes can only be created through cloud functions

**Fields:**
- `_id`: Auto-generated document ID
- `title`: Route title (string)
- `description`: Route description (string)
- `difficultyLevel`: 1-5 (number)
- `terrainTags`: Array of terrain types (array)
- `distanceKm`: Distance in kilometers (number)
- `elevationGainM`: Elevation gain in meters (number)
- `estimatedTimeMin`: Estimated time in minutes (number)
- `geometry`: GeoJSON coordinates (object)
- `startPoint`: Starting coordinates (object)
- `endPoint`: Ending coordinates (object)
- `uploaderId`: ID of the user who uploaded (string)
- `downloadCount`: Number of downloads (number)
- `status`: 'active' or 'deleted' (string)
- `createdAt`: Creation timestamp (date)
- `updatedAt`: Last update timestamp (date)

### Reviews Collection

```json
{
  "read": true,
  "write": "auth.uid != null"
}
```

**Read:** Public access
**Write:** Authenticated users only

**Fields:**
- `_id`: Auto-generated document ID
- `routeId`: ID of the route being reviewed (string)
- `userId`: ID of the user writing the review (string)
- `userName`: User's display name (string)
- `userAvatar`: User's avatar URL (string)
- `rating`: Rating 1-5 (number)
- `comment`: Review text (string)
- `photos`: Array of photo URLs (array)
- `createdAt`: Creation timestamp (date)

### Users Collection

```json
{
  "read": "auth.uid != null",
  "write": "auth.uid != null"
}
```

**Read:** Authenticated users only
**Write:** Authenticated users only

**Additional Rule:** Users can only read/write their own data

```json
{
  "read": "auth.uid != null && doc._openid == auth.openid",
  "write": "auth.uid != null && doc._openid == auth.openid"
}
```

**Fields:**
- `_id`: Auto-generated document ID
- `_openid`: User's OpenID from WeChat (string, auto-populated)
- `nickname`: Display name (string)
- `avatarUrl`: Avatar URL (string)
- `bio`: User biography (string)
- `garage`: Array of bikes (array)
- `favorites`: Array of favorited route IDs (array)
- `isPremium`: Premium membership status (boolean)
- `createdAt`: Account creation timestamp (date)
- `updatedAt`: Last update timestamp (date)

## Implementing Security Rules

### Via CloudBase Console

1. Go to [CloudBase Console](https://console.cloud.tencent.com/tcb)
2. Select your environment
3. Navigate to Database > Security Rules
4. For each collection, click "Add Rule" and paste the JSON rule

### Via CloudBase CLI

Save rules to `database-rules.json`:

```json
{
  "routes": {
    "read": true,
    "write": false
  },
  "reviews": {
    "read": true,
    "write": "auth.uid != null"
  },
  "users": {
    "read": "auth.uid != null && doc._openid == auth.openid",
    "write": "auth.uid != null && doc._openid == auth.openid"
  }
}
```

Deploy using:

```bash
cloudbase database:updateRules --file database-rules.json
```

## Testing Security Rules

### Test Read Access

```javascript
// Try to read routes (should succeed)
const db = cloudbase.database();
db.collection('routes').get().then(res => {
  console.log('Routes read test:', res);
});

// Try to read users without auth (should fail)
db.collection('users').get().then(res => {
  console.log('Users read test (should fail):', res);
});
```

### Test Write Access

```javascript
// Try to create a review without auth (should fail)
db.collection('reviews').add({
  data: {
    routeId: 'test',
    rating: 5,
    comment: 'Test'
  }
}).then(res => {
  console.log('Review write test (should fail):', res);
});
```

## Best Practices

1. **Principle of Least Privilege:** Only grant minimum required permissions
2. **Validation:** Always validate data in cloud functions, don't rely solely on security rules
3. **Testing:** Test security rules thoroughly before production
4. **Monitoring:** Enable CloudBase logging to monitor database access
5. **Review:** Regularly review and update security rules

## Common Security Patterns

### Public Read, Authenticated Write

```json
{
  "read": true,
  "write": "auth.uid != null"
}
```

### Owner-Only Access

```json
{
  "read": "doc.userId == auth.uid",
  "write": "doc.userId == auth.uid"
}
```

### Admin-Only Access

```json
{
  "read": "auth.uid != null && doc.isAdmin == true",
  "write": "auth.uid != null && doc.isAdmin == true"
}
```

### Conditional Access Based on Document State

```json
{
  "read": true,
  "write": "doc.status == 'draft' && doc.authorId == auth.uid"
}
```

## Troubleshooting

### Permission Denied Errors

1. Check that security rules are deployed
2. Verify user authentication state
3. Check rule syntax for typos
4. Review field names match the document structure

### Performance Issues

1. Keep security rules simple
2. Avoid complex nested conditions
3. Use indexes for frequently queried fields
4. Monitor database performance in CloudBase Console

## Additional Resources

- [CloudBase Database Documentation](https://docs.cloudbase.net/database/introduce)
- [Security Rules Reference](https://docs.cloudbase.net/database/security-rules)
- [CloudBase CLI Documentation](https://docs.cloudbase.net/cli/introduce)
