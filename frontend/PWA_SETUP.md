# HealthSync PWA Setup Guide

## What's Been Configured

### 1. Service Worker (`public/service-worker.js`)
- Caches static assets for offline access
- Network-first strategy for API calls with cache fallback
- Offline page when no network available
- Push notification support
- Background sync for offline bookings

### 2. Web App Manifest (`public/manifest.json`)
- App name, description, and theme colors
- Icon definitions for all required sizes
- Shortcuts for quick actions (Book Appointment, My Appointments)
- Standalone display mode for app-like experience

### 3. PWA Install Banner (`src/components/PWAInstallBanner.js`)
- Shows install prompt on supported browsers
- iOS-specific instructions for Add to Home Screen
- Offline status indicator

### 4. Offline Booking Support (`src/utils/offlineBooking.js`)
- IndexedDB storage for offline bookings
- Auto-sync when back online
- Background sync via service worker

## Generate PWA Icons

1. Open `frontend/public/icons/generate-icons.html` in your browser
2. Click "Download All Icons"
3. Move downloaded icons to `frontend/public/icons/`

Or use the SVG source at `frontend/public/icons/icon.svg` with an online converter.

## Required Icon Files

Place these in `frontend/public/icons/`:
- icon-16x16.png
- icon-32x32.png
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-167x167.png
- icon-180x180.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png
- badge-72x72.png (for notifications)

## Build & Deploy

### Development
```bash
cd frontend
npm start
```

### Production Build
```bash
cd frontend
npm run build
```

### Android App (Capacitor)
```bash
cd frontend
npm run build
npx cap sync android
npx cap open android
```

## Testing PWA

1. Build the app: `npm run build`
2. Serve with a static server: `npx serve -s build`
3. Open in Chrome and check DevTools > Application > Service Workers
4. Test offline mode in DevTools > Network > Offline

## Lighthouse PWA Audit

Run Lighthouse in Chrome DevTools to verify PWA compliance:
1. Open DevTools (F12)
2. Go to Lighthouse tab
3. Select "Progressive Web App" category
4. Click "Analyze page load"

## Backend CORS Configuration

The backend is configured to accept requests from:
- localhost (development)
- Capacitor mobile apps
- Production domains

## Troubleshooting

### Service Worker Not Registering
- Ensure you're serving over HTTPS (or localhost)
- Check browser console for errors
- Clear browser cache and reload

### Icons Not Showing
- Verify icon files exist in `public/icons/`
- Check manifest.json paths are correct
- Clear browser cache

### Offline Mode Not Working
- Ensure service worker is registered
- Check IndexedDB in DevTools > Application
- Verify API routes are in CACHEABLE_API_ROUTES

### Install Prompt Not Showing
- PWA must be served over HTTPS
- Must have valid manifest.json
- Must have registered service worker
- User must not have dismissed prompt recently
