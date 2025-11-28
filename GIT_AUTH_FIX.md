# 🔐 Fix Git Authentication Error

## ❌ Error
```
remote: Invalid username or token. Password authentication is not supported for Git operations.
fatal: Authentication failed
```

## ✅ Solution Options

### Option 1: Use GitHub Desktop (Easiest)
1. Download GitHub Desktop: https://desktop.github.com/
2. Sign in with your GitHub account
3. Clone or add your repository
4. Commit and push through the GUI

### Option 2: Create Personal Access Token (PAT)

#### Step 1: Create Token
1. Go to GitHub: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name: "Doctor Appointment System"
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
5. Click "Generate token"
6. **COPY THE TOKEN** (you won't see it again!)

#### Step 2: Update Git Credentials
```bash
# Remove old credentials
git config --global --unset credential.helper

# Set new credential helper
git config --global credential.helper manager-core

# Try pushing again (it will ask for credentials)
git push origin main
```

When prompted:
- **Username**: `desouvik100`
- **Password**: Paste your Personal Access Token (not your GitHub password)

### Option 3: Use SSH (Most Secure)

#### Step 1: Generate SSH Key
```bash
ssh-keygen -t ed25519 -C "desouvik0000@gmail.com"
# Press Enter for default location
# Press Enter twice for no passphrase
```

#### Step 2: Copy SSH Key
```bash
# Windows
type %USERPROFILE%\.ssh\id_ed25519.pub
```

#### Step 3: Add to GitHub
1. Go to: https://github.com/settings/keys
2. Click "New SSH key"
3. Paste the key
4. Click "Add SSH key"

#### Step 4: Change Remote URL
```bash
git remote set-url origin git@github.com:desouvik100/doctor-appointment-system-updated.git
git push origin main
```

### Option 4: Quick Fix - Use GitHub CLI

```bash
# Install GitHub CLI
winget install --id GitHub.cli

# Authenticate
gh auth login

# Push
git push origin main
```

## 🚀 After Authentication is Fixed

```bash
# Stage changes
git add .

# Commit
git commit -m "feat: implement password reset with OTP email verification"

# Push
git push origin main
```

## 💡 Recommended Approach

**For Windows users, I recommend GitHub Desktop** - it's the easiest and handles authentication automatically.

Download: https://desktop.github.com/

---

**Need help?** Let me know which option you'd like to use!
