# 🚀 Quick Deploy Commands

## Deploy Password Reset Feature

```bash
# 1. Stage all changes
git add .

# 2. Commit with descriptive message
git commit -m "feat: implement password reset with OTP email verification

- Add OTP email sending to forgot-password endpoint
- Update reset-password to verify OTP before resetting
- Add two-step modal UI for password reset flow
- Add react-hot-toast dependency for notifications
- Email service fully integrated and tested"

# 3. Push to GitHub (triggers Vercel auto-deploy)
git push origin main
```

## After Deployment

### Test the Feature:
1. Visit your production URL
2. Click "Forgot Password?" on login page
3. Enter email: desouvik0000@gmail.com
4. Check email for 6-digit OTP code
5. Enter OTP and new password
6. Login with new password

### Monitor Deployment:
- Check Vercel dashboard for build status
- Review deployment logs if needed
- Verify no build errors

## Troubleshooting

### If build fails:
```bash
# Check package.json has react-hot-toast
cat frontend/package.json | grep react-hot-toast

# Should show: "react-hot-toast": "^2.4.1"
```

### If emails don't arrive:
1. Check spam/junk folder
2. Verify backend .env has correct EMAIL_USER and EMAIL_PASS
3. Check backend logs for email errors
4. Test locally: `node test-password-reset-email.js`

## Quick Status Check

```bash
# Check if backend is running
curl http://localhost:5005/api/health

# Test password reset endpoint
curl -X POST http://localhost:5005/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"desouvik0000@gmail.com"}'
```

---

**Ready to deploy!** 🚀
