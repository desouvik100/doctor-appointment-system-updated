// backend/routes/googleRoutes.js
const express = require('express');
const { google } = require('googleapis');
const router = express.Router();

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

// Get OAuth2 client
function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5005/api/google/callback'
  );
}

// Check if value is placeholder
const isPlaceholder = (val) => !val || val.includes('your_') || val === '';

// Get authorization URL for Google OAuth
router.get('/auth-url', (req, res) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (isPlaceholder(clientId) || isPlaceholder(clientSecret)) {
      return res.json({
        success: false,
        configured: false,
        message: 'Google OAuth not configured',
        instructions: {
          title: '🔧 Google Meet Setup Instructions',
          steps: [
            {
              step: 1,
              title: 'Create Google Cloud Project',
              details: [
                'Go to https://console.cloud.google.com/',
                'Click "Select a project" → "New Project"',
                'Name it "HealthSync" and create'
              ]
            },
            {
              step: 2,
              title: 'Enable Google Calendar API',
              details: [
                'In your project, go to "APIs & Services" → "Library"',
                'Search for "Google Calendar API"',
                'Click on it and press "Enable"'
              ]
            },
            {
              step: 3,
              title: 'Configure OAuth Consent Screen',
              details: [
                'Go to "APIs & Services" → "OAuth consent screen"',
                'Select "External" user type',
                'Fill in App name: "HealthSync"',
                'Add your email as support email',
                'Add scopes: ../auth/calendar and ../auth/calendar.events',
                'Add your email as test user'
              ]
            },
            {
              step: 4,
              title: 'Create OAuth Credentials',
              details: [
                'Go to "APIs & Services" → "Credentials"',
                'Click "Create Credentials" → "OAuth 2.0 Client ID"',
                'Application type: "Web application"',
                'Name: "HealthSync Backend"',
                'Add Authorized redirect URI: http://localhost:5005/api/google/callback',
                'Click "Create"'
              ]
            },
            {
              step: 5,
              title: 'Update .env File',
              details: [
                'Copy the Client ID and Client Secret',
                'Open backend/.env file',
                'Update these values:',
                '  GOOGLE_CLIENT_ID=your_client_id_here',
                '  GOOGLE_CLIENT_SECRET=your_client_secret_here'
              ]
            },
            {
              step: 6,
              title: 'Get Refresh Token',
              details: [
                'Restart the backend server',
                'Visit this URL again: /api/google/auth-url',
                'Click the authorization URL',
                'Sign in with the Google account that will host meetings',
                'Copy the refresh token and add to .env:',
                '  GOOGLE_REFRESH_TOKEN=your_refresh_token'
              ]
            }
          ],
          note: '⚠️ The Google account you authorize with will be the meeting organizer/admin. Use the clinic or doctor account for best results.'
        }
      });
    }

    const oauth2Client = getOAuth2Client();

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    });

    res.json({
      success: true,
      configured: true,
      authUrl,
      message: '✅ Google OAuth is configured! Click the authUrl to authorize.',
      instructions: [
        '1. Click the authUrl link below',
        '2. Sign in with the Google account that will host meetings (clinic/doctor account)',
        '3. Grant calendar permissions',
        '4. Copy the refresh token from the success page',
        '5. Add it to backend/.env as GOOGLE_REFRESH_TOKEN',
        '6. Restart the backend server'
      ],
      note: '⚠️ The account you sign in with will be the meeting organizer/admin for all consultations.'
    });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// OAuth callback handler
router.get('/callback', async (req, res) => {
  try {
    const { code, error } = req.query;

    if (error) {
      return res.status(400).send(`
        <html>
          <head><title>Authorization Failed</title></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; text-align: center; background: #fef2f2;">
            <div style="max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h1 style="color: #dc2626;">❌ Authorization Failed</h1>
              <p style="color: #6b7280;">Error: ${error}</p>
              <a href="/api/google/auth-url" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">Try Again</a>
            </div>
          </body>
        </html>
      `);
    }

    if (!code) {
      return res.status(400).send(`
        <html>
          <head><title>No Code Received</title></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; text-align: center; background: #fef2f2;">
            <div style="max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h1 style="color: #dc2626;">❌ No Authorization Code</h1>
              <p style="color: #6b7280;">No authorization code was received from Google.</p>
              <a href="/api/google/auth-url" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">Try Again</a>
            </div>
          </body>
        </html>
      `);
    }

    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ GOOGLE OAUTH TOKENS RECEIVED');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('REFRESH TOKEN (add this to your .env file):');
    console.log(tokens.refresh_token);
    console.log('═══════════════════════════════════════════════════════════');

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Authorization Successful - HealthSync</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 40px 20px; }
            .container { max-width: 700px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { font-size: 28px; margin-bottom: 10px; }
            .content { padding: 30px; }
            .token-section { margin: 20px 0; }
            .token-label { font-weight: 600; color: #374151; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
            .token-box { background: #1f2937; color: #10b981; padding: 20px; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 12px; word-break: break-all; position: relative; }
            .copy-btn { position: absolute; top: 10px; right: 10px; background: #374151; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px; }
            .copy-btn:hover { background: #4b5563; }
            .steps { background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .steps h3 { color: #166534; margin-bottom: 15px; }
            .step { display: flex; gap: 12px; margin: 12px 0; align-items: flex-start; }
            .step-num { background: #10b981; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; flex-shrink: 0; }
            .step-text { color: #374151; line-height: 1.5; }
            code { background: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; }
            .warning { background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; margin: 20px 0; }
            .warning-title { color: #92400e; font-weight: 600; margin-bottom: 5px; }
            .warning-text { color: #78350f; font-size: 14px; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Google Authorization Successful!</h1>
              <p>Google Meet integration is almost ready</p>
            </div>
            
            <div class="content">
              <div class="token-section">
                <div class="token-label">🔑 Your Refresh Token:</div>
                <div class="token-box" id="tokenBox">
                  ${tokens.refresh_token || 'No refresh token received - you may have already authorized this app. Try revoking access at https://myaccount.google.com/permissions and try again.'}
                  <button class="copy-btn" onclick="copyToken()">Copy</button>
                </div>
              </div>

              <div class="steps">
                <h3>📋 Complete Setup - Follow These Steps:</h3>
                <div class="step">
                  <div class="step-num">1</div>
                  <div class="step-text">Open <code>backend/.env</code> file in your code editor</div>
                </div>
                <div class="step">
                  <div class="step-num">2</div>
                  <div class="step-text">Find the line: <code>GOOGLE_REFRESH_TOKEN=your_google_refresh_token_here</code></div>
                </div>
                <div class="step">
                  <div class="step-num">3</div>
                  <div class="step-text">Replace it with: <code>GOOGLE_REFRESH_TOKEN=${tokens.refresh_token || 'YOUR_TOKEN'}</code></div>
                </div>
                <div class="step">
                  <div class="step-num">4</div>
                  <div class="step-text">Save the file and <strong>restart the backend server</strong></div>
                </div>
                <div class="step">
                  <div class="step-num">5</div>
                  <div class="step-text">Google Meet links will now be auto-generated for online appointments! 🎉</div>
                </div>
              </div>

              <div class="warning">
                <div class="warning-title">⚠️ Important Notes:</div>
                <div class="warning-text">
                  • The Google account you just authorized will be the <strong>meeting organizer/admin</strong> for all consultations<br>
                  • Calendar events will be created in this account's Google Calendar<br>
                  • Both doctor and patient will receive email invitations with the Meet link<br>
                  • Keep this refresh token secure - don't share it publicly
                </div>
              </div>
            </div>

            <div class="footer">
              <p>🏥 HealthSync Pro - Healthcare Management Platform</p>
              <p style="margin-top: 5px;">The refresh token has also been logged to your server console.</p>
            </div>
          </div>

          <script>
            function copyToken() {
              const token = '${tokens.refresh_token || ''}';
              if (token) {
                navigator.clipboard.writeText(token).then(() => {
                  document.querySelector('.copy-btn').textContent = 'Copied!';
                  setTimeout(() => {
                    document.querySelector('.copy-btn').textContent = 'Copy';
                  }, 2000);
                });
              }
            }
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).send(`
      <html>
        <head><title>Authorization Error</title></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; text-align: center; background: #fef2f2;">
          <div style="max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h1 style="color: #dc2626;">❌ Authorization Error</h1>
            <p style="color: #6b7280; margin: 20px 0;">${error.message}</p>
            <p style="color: #9ca3af; font-size: 14px;">This might happen if the authorization code expired. Please try again.</p>
            <a href="/api/google/auth-url" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">Try Again</a>
          </div>
        </body>
      </html>
    `);
  }
});

// Check Google configuration status
router.get('/status', (req, res) => {
  const { getGoogleStatus } = require('../services/googleMeetService');
  const status = getGoogleStatus();

  res.json({
    success: true,
    ...status,
    message: status.fullyConfigured
      ? '✅ Google Meet is fully configured and ready!'
      : '⚠️ Google Meet needs configuration',
    setupUrl: status.fullyConfigured ? null : '/api/google/auth-url'
  });
});

// Test Google Meet link generation
router.post('/test-meet', async (req, res) => {
  try {
    const { generateGoogleMeetLink, isGoogleMeetConfigured } = require('../services/googleMeetService');

    if (!isGoogleMeetConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'Google Meet not configured',
        setupUrl: '/api/google/auth-url',
        message: 'Please complete Google OAuth setup first'
      });
    }

    const testAppointment = {
      _id: 'test-' + Date.now(),
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      time: '10:00',
      userId: { 
        name: req.body.patientName || 'Test Patient', 
        email: req.body.patientEmail || 'patient@example.com' 
      },
      doctorId: { 
        name: req.body.doctorName || 'Test Doctor', 
        email: req.body.doctorEmail || 'doctor@example.com' 
      },
      clinicId: {
        name: req.body.clinicName || 'Test Clinic'
      },
      reason: 'Test consultation - Google Meet integration test'
    };

    console.log('🧪 Testing Google Meet generation...');
    const result = await generateGoogleMeetLink(testAppointment);

    if (result.success) {
      res.json({
        success: true,
        message: '✅ Google Meet link generated successfully!',
        meetLink: result.meetLink,
        eventId: result.eventId,
        provider: result.provider,
        note: 'Check your Google Calendar - a test event should appear'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        setupUrl: result.setupUrl
      });
    }
  } catch (error) {
    console.error('Test meet error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
