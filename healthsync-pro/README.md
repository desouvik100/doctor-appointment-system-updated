# HealthSync Mobile App

Modern healthcare mobile application built with React Native for Android.

## Design System

### Colors
- **Primary**: Vibrant teal (#00D4AA) - Health & trust
- **Secondary**: Deep purple (#6C5CE7) - Premium feel
- **Accent**: Coral (#FF6B6B) - CTAs & highlights
- **Background**: Dark theme (#0A0E17) - Modern startup aesthetic

### Features
- Glassmorphism cards with gradient borders
- Floating bottom navigation
- Smooth gradient buttons
- Dark mode optimized
- Modern typography (Inter font family)

## Screens

1. **Login** - Modern auth with social login options
2. **Home** - Dashboard with health metrics, upcoming appointments
3. **Appointments** - View, manage, and book appointments
4. **Doctors** - Search and filter doctors by specialty
5. **Profile** - User settings and preferences
6. **Booking** - Date/time selection flow

## Getting Started

```bash
# Install dependencies
cd mobile
npm install

# Start Metro bundler
npm start

# Run on Android
npm run android
```

## Tech Stack

- React Native 0.73
- React Navigation 6
- React Native Reanimated
- React Native Linear Gradient
- React Native Vector Icons

## Project Structure

```
mobile/
├── src/
│   ├── components/
│   │   └── common/        # Reusable UI components
│   ├── navigation/        # Navigation configuration
│   ├── screens/           # App screens
│   │   ├── auth/
│   │   ├── home/
│   │   ├── appointments/
│   │   ├── doctors/
│   │   ├── profile/
│   │   └── booking/
│   └── theme/             # Design tokens
├── App.js
└── index.js
```
