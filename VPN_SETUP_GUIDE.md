# VPN Setup Guide - Fix MongoDB Atlas Connection

Your Reliance ISP is blocking MongoDB Atlas DNS. Use a VPN to bypass this restriction.

## Recommended: Windscribe VPN (Free & Fast)

### Step 1: Download Windscribe
- Go to: https://windscribe.com/download
- Download for Windows
- Install it

### Step 2: Connect to VPN
1. Open Windscribe
2. Click **Connect** (or select a server location like US, UK, or India)
3. Wait for connection (usually 5-10 seconds)
4. You should see "Connected" status

### Step 3: Restart Backend Server
```cmd
# Stop current backend (Ctrl+C in the terminal)
# Then restart:
cd d:\Startup-Project\doctor-appointment-system\backend
npm start
```

### Step 4: Verify MongoDB Connection
You should see in the logs:
```
✅ MongoDB connected successfully
```

---

## Alternative VPNs (All Free)

1. **ProtonVPN** - https://protonvpn.com/download
   - Free tier: 3 server locations
   - Very reliable

2. **NordVPN** - https://nordvpn.com/download
   - Free trial available
   - Excellent speed

3. **Hotspot Shield** - https://www.hotspotshield.com/download
   - Free tier available
   - Fast connection

---

## Why This Works

- Reliance ISP blocks MongoDB Atlas SRV DNS records
- VPN routes your traffic through a different server
- MongoDB Atlas becomes accessible
- Your backend can connect and sync data

---

## After VPN Connection

Once connected to VPN:
1. Restart backend server
2. MongoDB will connect
3. Mobile app will work with full database functionality
4. You can test all features

---

## Keep VPN Running

- Keep Windscribe (or your chosen VPN) running while developing
- You can minimize it to system tray
- It won't affect your internet speed significantly

---

**Questions?** Let me know once you've connected to VPN and restarted the backend!
