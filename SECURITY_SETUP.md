# 🔐 HealthSync Security Setup Guide

## ⚠️ CRITICAL: Environment Variables Setup

**NEVER commit real API keys, passwords, or secrets to Git!**

### 1. Backend Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in your actual values:

```bash
# Required for production deployment
MONGODB_URI=your_actual_mongodb_connection_string
JWT_SECRET=your_strong_jwt_secret_minimum_32_characters
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
EMAIL_USER=your_email_address
EMAIL_PASS=your_email_app_password
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
```

### 2. Frontend Environment Variables

Copy `frontend/.env.example` to `frontend/.env`:

```bash
REACT_APP_API_URL=http://localhost:5005
REACT_APP_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

### 3. Production Deployment

For production platforms (Render, Vercel, etc.), set these as environment variables in your platform's dashboard:

#### Render.com Backend Environment Variables:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your_production_jwt_secret_minimum_32_characters
NODE_ENV=production
RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_KEY_SECRET=your_live_key_secret
EMAIL_USER=your_production_email
EMAIL_PASS=your_production_email_app_password
CORS_ORIGIN=https://healthsyncpro.in
FRONTEND_URL=https://healthsyncpro.in
BACKEND_URL=https://your-backend-url.onrender.com
```

#### Vercel Frontend Environment Variables:
```
REACT_APP_API_URL=https://your-backend-url.onrender.com
REACT_APP_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

### 4. Security Best Practices

#### Strong Password Policy:
- Minimum 12 characters
- Must include uppercase, lowercase, numbers, special characters
- No common passwords or dictionary words
- Regular password rotation for admin accounts

#### JWT Security:
- Use strong, random JWT secrets (minimum 32 characters)
- Set appropriate expiration times (1-4 hours for access tokens)
- Implement refresh token rotation
- Store tokens securely (httpOnly cookies for web)

#### API Security:
- Rate limiting on all endpoints
- Input validation and sanitization
- CORS properly configured
- HTTPS everywhere in production
- Security headers (helmet.js)

#### Database Security:
- Use connection pooling
- Implement proper indexing
- Regular backups
- Monitor for unusual activity
- Encrypt sensitive data at rest

### 5. Compliance Requirements

#### HIPAA Compliance:
- Encrypt all medical data
- Implement audit trails
- Access controls and user permissions
- Data retention policies
- Business Associate Agreements (BAAs)

#### Data Protection:
- User consent management
- Right to data deletion
- Data export capabilities
- Cross-border data transfer compliance

### 6. Monitoring & Alerting

#### Security Monitoring:
- Failed login attempts
- Unusual API usage patterns
- Database access monitoring
- File upload monitoring
- Payment transaction monitoring

#### Performance Monitoring:
- API response times
- Database query performance
- Memory and CPU usage
- Error rates and types

### 7. Incident Response Plan

#### Security Incident Response:
1. Immediate containment
2. Impact assessment
3. User notification (if required)
4. System recovery
5. Post-incident review

#### Data Breach Response:
1. Stop the breach
2. Assess the damage
3. Notify authorities (within 72 hours for GDPR)
4. Notify affected users
5. Document and learn

### 8. Regular Security Tasks

#### Weekly:
- Review access logs
- Check for failed login attempts
- Monitor API usage patterns
- Review error logs

#### Monthly:
- Update dependencies
- Review user permissions
- Backup verification
- Security patch updates

#### Quarterly:
- Security audit
- Penetration testing
- Compliance review
- Disaster recovery testing

### 9. Emergency Contacts

```
Security Team: security@healthsyncpro.in
Technical Lead: tech@healthsyncpro.in
Compliance Officer: compliance@healthsyncpro.in
Legal Team: legal@healthsyncpro.in
```

### 10. Security Checklist

- [ ] All secrets moved to environment variables
- [ ] Strong password policies implemented
- [ ] Rate limiting configured
- [ ] Input validation comprehensive
- [ ] HTTPS enforced everywhere
- [ ] Security headers configured
- [ ] Database properly secured
- [ ] Audit logging implemented
- [ ] Backup strategy in place
- [ ] Incident response plan documented
- [ ] Team trained on security procedures
- [ ] Regular security reviews scheduled

## 🚨 If You Suspect a Security Issue

1. **DO NOT** discuss it publicly
2. **DO NOT** commit any fixes to public repositories
3. **IMMEDIATELY** contact the security team
4. **DOCUMENT** everything you observed
5. **PRESERVE** logs and evidence

Contact: security@healthsyncpro.in