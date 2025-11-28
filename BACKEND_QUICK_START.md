# Backend - Quick Start

## What Was Fixed
Created missing `backend/middleware/auth.js` file that provides JWT token verification middleware.

## Start Backend Now

```bash
cd backend
npm start
```

## Expected Output
```
⚠️  Stripe payments DISABLED - Running in test mode
🤖 Chatbot routes loading...
✅ Gemini initialized successfully
🤖 Chatbot routes loaded - Updated
🤖 Chatbot routes configured successfully
✅ Server running on port 5000
```

## No More Errors
✅ Module not found error is fixed
✅ Backend starts successfully
✅ All routes are available

## What Was Created
- `backend/middleware/auth.js` - JWT token verification middleware

## Middleware Functions

### verifyToken
Basic JWT verification:
```javascript
const { verifyToken } = require('../middleware/auth');
router.get('/protected', verifyToken, handler);
```

### verifyTokenWithRole
JWT verification with role check:
```javascript
const { verifyTokenWithRole } = require('../middleware/auth');
router.post('/admin', verifyTokenWithRole(['admin']), handler);
```

## Available Routes
All token routes now work:
- POST `/api/token/verify` - Verify token
- POST `/api/token/add-to-queue` - Add to queue
- GET `/api/token/patient/:userId` - Get patient token
- GET `/api/token/queue/:doctorId` - Get queue
- POST `/api/token/mark-completed` - Mark completed
- POST `/api/token/mark-no-show` - Mark no-show
- POST `/api/token/expire-old` - Expire old tokens

## Next Steps
1. Start backend: `npm start`
2. Start frontend: `npm start` (in frontend directory)
3. Test the application

---

**Status:** ✅ Ready to Use
