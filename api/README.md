# Fuyou API - Vercel Serverless Functions

This directory contains the converted API endpoints from the Express backend to Vercel serverless functions.

## 🏗️ Architecture

The API functions are organized following Vercel's file-based routing:

```
api/
├── _utils/           # Shared utilities
│   ├── auth.js       # Authentication helpers
│   ├── response.js   # Response helpers
│   ├── supabase.js   # Supabase client
│   └── validation.js # Validation helpers
├── _services/        # Business logic services
│   └── shiftService.js # Shift management service
├── health.js         # Health check endpoint
├── demo/
│   ├── login.js      # Demo authentication
│   └── user.js       # Demo user info
├── shifts/
│   ├── index.js      # CRUD operations
│   ├── [id].js       # Get single shift
│   ├── [id]/confirm.js # Confirm shift
│   ├── stats.js      # Shift statistics
│   ├── projection.js # Earnings projection
│   └── bulk.js       # Bulk operations
└── job-sources/
    ├── index.js      # CRUD operations
    ├── [id].js       # Get single job source
    └── categories.js # Available categories
```

## 🔌 API Endpoints

### Health Check
- **GET** `/api/health` - Service health status

### Demo Authentication
- **POST** `/api/demo/login` - Demo login (no real auth)
- **GET** `/api/demo/user` - Get demo user info

### Shifts Management
- **GET** `/api/shifts` - Get shifts with filters
- **POST** `/api/shifts` - Create new shift
- **PUT** `/api/shifts?id={shiftId}` - Update shift
- **DELETE** `/api/shifts?id={shiftId}` - Delete shift
- **GET** `/api/shifts/{id}` - Get single shift
- **POST** `/api/shifts/{id}/confirm` - Confirm shift
- **GET** `/api/shifts/stats` - Get shift statistics
- **GET** `/api/shifts/projection` - Get earnings projection
- **POST** `/api/shifts/bulk` - Create multiple shifts

### Job Sources Management
- **GET** `/api/job-sources` - Get job sources
- **POST** `/api/job-sources` - Create job source
- **PUT** `/api/job-sources?id={jobSourceId}` - Update job source
- **DELETE** `/api/job-sources?id={jobSourceId}` - Delete job source (soft delete)
- **GET** `/api/job-sources/{id}` - Get single job source
- **GET** `/api/job-sources/categories` - Get available categories

## 🔐 Authentication

The API supports both demo authentication and Supabase authentication:

### Demo Authentication
```javascript
// Login
POST /api/demo/login
{
  "email": "user@example.com",
  "fullName": "ユーザー名",
  "isStudent": true
}

// Use returned token in Authorization header
Authorization: Bearer {demoToken}
```

### Supabase Authentication
```javascript
// Use Supabase JWT token in Authorization header
Authorization: Bearer {supabaseJWT}
```

## 📝 Request/Response Format

### Standard Response Format
```javascript
{
  "success": true,
  "data": {...},
  "meta": {
    "total": 10,
    "savedCount": 5,
    "skippedCount": 0
  }
}
```

### Error Response Format
```javascript
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {...}
  }
}
```

## 🚀 Deployment

### Environment Variables
Required environment variables in Vercel:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

### Deploy to Vercel
```bash
# Install dependencies
npm install

# Deploy to Vercel
vercel --prod

# Or for preview deployment
vercel
```

## 🔧 Development

### Local Development
```bash
# Install Vercel CLI
npm install -g vercel

# Install dependencies
npm install

# Start local development server
vercel dev
```

### CORS Handling
All endpoints include proper CORS headers for cross-origin requests. The `handleCors` utility automatically handles OPTIONS preflight requests.

### Error Handling
- Authentication errors: 401 status code
- Validation errors: 400 status code
- Not found errors: 404 status code
- Conflict errors: 409 status code (e.g., time conflicts)
- Server errors: 500 status code

## 📊 Key Features

### Demo Mode
- No database required for testing
- JWT tokens encoded in Base64
- Works with any UUID format
- Automatic user data extraction

### Time Conflict Detection
- Prevents overlapping shifts
- Handles overnight shifts
- Excludes current shift when updating

### Bulk Operations
- Create multiple shifts at once
- Conflict handling with detailed reporting
- Success/failure breakdown

### Earnings Projection
- Real-time calculations
- Risk level assessment
- Fuyou limit tracking (1.5M yen for students)

## 🛠️ Migration from Express

### Key Changes
1. **File-based routing** instead of Express Router
2. **Handler functions** instead of middleware chains
3. **Manual CORS handling** instead of cors middleware
4. **Explicit method checking** in each handler
5. **Simplified error handling** with utility functions

### Preserved Features
- Same authentication flow (demo + Supabase)
- Same response format
- Same business logic
- Same validation schemas
- Same database queries

This conversion maintains full API compatibility with the original Express backend while leveraging Vercel's serverless infrastructure for better scalability and performance.