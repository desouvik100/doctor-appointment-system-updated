# Email OTP Setup Guide

This guide will help you set up real email OTP verification for HealthSync Pro.

## Gmail Setup (Recommended)

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings: https://myaccount.google.com/
2. Click on "Security" in the left sidebar
3. Under "Signing in to Google", click on "2-Step Verification"
4. Follow the prompts to enable 2-factor authentication

### Step 2: Generate App Password
1. After enabling 2-factor authentication, go back to Security settings
2. Under "Signing in to Google", click on "App passwords"
3. Select "Mail" as the app and "Other" as the device
4. Enter "HealthSync Pro" as the device name
5. Click "Generate"
6. Copy the 16-character app password (it will look like: `abcd efgh ijkl mnop`)

### Step 3: Configure Environment Variables
1. Copy `backend/.env.example` to `backend/.env`
2. Update the email configuration:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=abcd efgh ijkl mnop
   ```
   (Replace with your actual email and the app password from Step 2)

## Testing the Setup

### Option 1: Use Your Own Email
1. Set `EMAIL_USER` to your Gmail address
2. Set `EMAIL_PASS` to your app password
3. Register with your own email address to test

### Option 2: Use Test Email (for development)
If you want to use `test1234@gmail.com` as mentioned:
1. You would need access to that Gmail account
2. Follow the same steps above for that account
3. Or create your own test Gmail account

## Environment Variables

Add these to your `backend/.env` file:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
```

## Security Notes

- **Never commit your .env file to version control**
- The app password is different from your regular Gmail password
- App passwords are more secure than using your regular password
- You can revoke app passwords anytime from your Google Account settings

## Troubleshooting

### "Invalid credentials" error
- Make sure you're using an app password, not your regular password
- Verify 2-factor authentication is enabled
- Check that the email address is correct

### "Connection refused" error
- Check your internet connection
- Verify Gmail SMTP settings are correct
- Some networks block SMTP ports - try a different network

### OTP not received
- Check spam/junk folder
- Verify the email address is correct
- Wait a few minutes - sometimes there's a delay

## Production Considerations

For production deployment:
1. Use environment variables or secure secret management
2. Consider using a dedicated email service (SendGrid, AWS SES, etc.)
3. Implement rate limiting for OTP requests
4. Add email templates with your branding
5. Set up proper error monitoring

## Alternative Email Services

You can also use other email services by updating the transporter configuration in `backend/services/emailService.js`:

### Outlook/Hotmail
```javascript
const transporter = nodemailer.createTransporter({
  service: 'hotmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

### Custom SMTP
```javascript
const transporter = nodemailer.createTransporter({
  host: 'your-smtp-server.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```