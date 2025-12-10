# Google OAuth Setup Guide for HealthSync

## Prerequisites
- A Google Cloud Console account
- Access to the HealthSync frontend `.env` file

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Name it "HealthSync" (or your preferred name)
5. Click "Create"

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API" or "Google Identity"
3. Click on it and enable it

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type (unless you have a Google Workspace)
3. Fill in the required fields:
   - App name: "HealthSync"
   - User support email: Your email
   - Developer contact email: Your email
4. Click "Save and Continue"
5. On the "Scopes" page, add these scopes:
   - `email`
   - `profile`
   - `openid`
6. Click "Save and Continue"
7. Add test users if in testing mode
8. Click "Save and Continue"

## Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application"
4. Name it "HealthSync Web Client"
5. Add **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   http://localhost:3001
   http://localhost:5173
   ```
   For production, also add:
   ```
   https://yourdomain.com
   https://www.yourdomain.com
   ```
6. Leave "Authorized redirect URIs" empty (we use popup-based OAuth)
7. Click "Create"
8. Copy the **Client ID** (looks like: `xxxxx.apps.googleusercontent.com`)

## Step 5: Configure HealthSync

1. Open `frontend/.env`
2. Set the Google Client ID:
   ```
   REACT_APP_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   ```
3. Restart the frontend development server

## Troubleshooting

### "Google Sign-In failed" Error

1. **Check Client ID**: Ensure `REACT_APP_GOOGLE_CLIENT_ID` is set correctly in `.env`
2. **Check Origins**: Make sure your localhost URL is in "Authorized JavaScript origins"
3. **Clear Cache**: Try clearing browser cache and cookies
4. **Check Console**: Open browser DevTools (F12) and check the Console tab for errors
5. **Popup Blocker**: Ensure popups are allowed for localhost

### "popup_blocked" Error

- Allow popups for the site in your browser settings
- Try a different browser

### "access_denied" Error

- The user cancelled the sign-in
- Or the OAuth consent screen is not properly configured

### "invalid_client" Error

- The Client ID is incorrect
- The authorized origins don't match your current URL

## Testing

1. Start the frontend: `npm start` (in frontend folder)
2. Go to `http://localhost:3001`
3. Click "Sign in with Google"
4. A popup should appear asking for Google account selection
5. After selecting an account, you should be logged in

## Current Configuration

Your current Google Client ID (from `.env`):
```
850851668814-u5ush3p2ue4tt0jginltngstejv1im8c.apps.googleusercontent.com
```

Make sure this Client ID has `http://localhost:3001` in its Authorized JavaScript origins.
