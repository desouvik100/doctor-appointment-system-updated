# HealthSync Patient App - Premium Design System

## 🎨 Design Philosophy

**HealthSync is not a medical app. It's a lifestyle app that happens to be healthcare.**

The experience should feel like Swiggy/Zomato/Airbnb—smooth, fast, delightful—but with medical credibility.

---

## 📐 VISUAL IDENTITY

### Color Palette

#### Primary Colors
```
Primary Blue: #0066FF (Trust, Medical, Action)
Primary Green: #10B981 (Health, Growth, Wellness)
Primary Purple: #8B5CF6 (Premium, Innovation)
```

#### Neutral Colors
```
Background: #FFFFFF (Clean, Premium)
Surface: #F9FAFB (Subtle Depth)
Border: #E5E7EB (Soft Separation)
Text Primary: #111827 (Dark, Readable)
Text Secondary: #6B7280 (Soft, Supportive)
Text Tertiary: #9CA3AF (Disabled, Hint)
```

#### Semantic Colors
```
Success: #10B981 (Appointments Confirmed)
Warning: #F59E0B (Pending, Attention)
Error: #EF4444 (Cancellation, Issues)
Info: #3B82F6 (Information, Tips)
```

#### Gradients (Subtle, Not Excessive)
```
Premium Gradient: #0066FF → #8B5CF6 (For hero sections only)
Health Gradient: #10B981 → #06B6D4 (For wellness features)
```

### Typography

#### Font Family
```
Primary: Inter (Modern, Clean, Startup-like)
Fallback: -apple-system, BlinkMacSystemFont, Segoe UI
```

#### Type Scale
```
Display: 32px, 700, Line-height 1.2 (Hero titles)
Heading 1: 28px, 700, Line-height 1.3 (Screen titles)
Heading 2: 24px, 600, Line-height 1.3 (Section headers)
Heading 3: 20px, 600, Line-height 1.4 (Card titles)
Body Large: 16px, 500, Line-height 1.5 (Primary text)
Body Regular: 14px, 400, Line-height 1.5 (Secondary text)
Body Small: 12px, 400, Line-height 1.4 (Tertiary text)
Label: 12px, 600, Line-height 1.4 (Buttons, chips)
Caption: 11px, 400, Line-height 1.3 (Hints, timestamps)
```

### Spacing System

```
xs: 4px
sm: 8px
md: 12px
lg: 16px
xl: 24px
2xl: 32px
3xl: 48px
4xl: 64px
```

### Border Radius

```
sm: 4px (Subtle, inputs)
md: 8px (Cards, buttons)
lg: 12px (Large cards, modals)
xl: 16px (Hero sections)
full: 9999px (Pills, avatars)
```

### Shadows

```
sm: 0 1px 2px rgba(0,0,0,0.05)
md: 0 4px 6px rgba(0,0,0,0.07)
lg: 0 10px 15px rgba(0,0,0,0.1)
xl: 0 20px 25px rgba(0,0,0,0.1)
```

---

## 🧩 COMPONENT LIBRARY

### 1. Buttons

#### Primary Button
```
Background: #0066FF
Text: White, 16px, 600
Padding: 12px 24px
Border Radius: 8px
Shadow: md
States:
  - Default: Full opacity
  - Hover: Opacity 0.9
  - Active: Scale 0.98
  - Disabled: Opacity 0.5, Cursor not-allowed
Transition: 200ms ease-out
```

#### Secondary Button
```
Background: #F9FAFB
Text: #111827, 16px, 600
Border: 1px #E5E7EB
Padding: 12px 24px
Border Radius: 8px
States: Same as primary
```

#### Ghost Button
```
Background: Transparent
Text: #0066FF, 16px, 600
Border: None
Padding: 12px 24px
States: Hover adds background #F0F4FF
```

#### Icon Button
```
Size: 40px × 40px
Icon: 24px
Border Radius: 8px
Background: #F9FAFB
Hover: Background #E5E7EB
```

### 2. Cards

#### Doctor Card
```
Layout:
  - Image: 80px × 80px, rounded-lg
  - Name: Heading 3, #111827
  - Specialty: Body Small, #6B7280
  - Rating: ⭐ 4.8 (12 reviews)
  - Next Slot: "Available Today, 2:30 PM"
  - Fee: "₹500/consultation"
  - CTA: "Book Now" (Primary Button)

Padding: 16px
Border Radius: 12px
Background: #FFFFFF
Border: 1px #E5E7EB
Shadow: md
Hover: Shadow lg, Scale 1.02
Transition: 200ms ease-out
```

#### Appointment Card
```
Layout:
  - Doctor image: 48px × 48px
  - Doctor name + specialty
  - Date/Time: "Tomorrow, 2:30 PM"
  - Status badge: "Confirmed" (green)
  - Actions: "Join", "Reschedule", "View Details"

Padding: 16px
Border Radius: 12px
Background: Linear gradient #F0F4FF → #FFFFFF
Border: 1px #E5E7EB
Shadow: sm
```

#### Quick Action Card
```
Icon: 32px, #0066FF
Title: 14px, 600, #111827
Subtitle: 12px, 400, #6B7280
Padding: 16px
Border Radius: 12px
Background: #FFFFFF
Border: 1px #E5E7EB
Tap Target: 56px minimum
```

#### Specialty Chip
```
Padding: 8px 16px
Border Radius: full
Background: #F9FAFB
Text: 14px, 500, #111827
Border: 1px #E5E7EB
Active: Background #0066FF, Text white
Transition: 200ms ease-out
```

### 3. Input Fields

#### Text Input
```
Height: 48px
Padding: 12px 16px
Border Radius: 8px
Border: 1px #E5E7EB
Font: Body Regular
Background: #FFFFFF
Focus: Border #0066FF, Shadow md
Placeholder: #9CA3AF
```

#### Search Bar
```
Height: 48px
Padding: 12px 16px
Border Radius: 8px
Background: #F9FAFB
Icon: Search, 20px, #6B7280
Placeholder: "Search doctors, symptoms…"
Focus: Background #FFFFFF, Border #0066FF
```

### 4. Tabs

#### Segmented Tabs
```
Layout: Horizontal, equal width
Height: 40px
Padding: 4px (gap between tabs)
Background: #F9FAFB
Border Radius: 8px
Tab:
  - Padding: 8px 16px
  - Text: 14px, 500
  - Color: #6B7280
  - Active: Background #FFFFFF, Text #0066FF, Shadow sm
  - Transition: 200ms ease-out
```

### 5. Bottom Navigation

```
Height: 64px (including safe area)
Background: #FFFFFF
Border Top: 1px #E5E7EB
Shadow: lg (upward)
Items: 4 (Home, Doctors, Appointments, Profile)
Icon: 24px
Label: 12px, 500
Active: Icon #0066FF, Label #0066FF
Inactive: Icon #9CA3AF, Label #9CA3AF
Transition: 200ms ease-out
Tap Target: 56px minimum
```

### 6. Loading States

#### Skeleton Loader
```
Background: #F9FAFB
Animation: Shimmer effect (left to right)
Duration: 1.5s
Border Radius: Match component
```

#### Progress Indicator
```
Height: 4px
Background: #E5E7EB
Progress: #0066FF
Border Radius: full
Animation: Smooth, no bounce
```

### 7. Badges

#### Status Badge
```
Padding: 4px 12px
Border Radius: full
Font: 11px, 600
Background: Semantic color (green for confirmed)
Text: White
```

---

## 📱 SCREEN DESIGNS

### HOME SCREEN

#### Layout Structure
```
┌─────────────────────────────────┐
│ Greeting + Profile + Notification
├─────────────────────────────────┤
│ Search Bar                       │
├─────────────────────────────────┤
│ Quick Actions (4 cards)          │
├─────────────────────────────────┤
│ Specialty Browse (Horizontal)    │
├─────────────────────────────────┤
│ Upcoming Appointment (if exists) │
├─────────────────────────────────┤
│ Top Doctors Near You             │
├─────────────────────────────────┤
│ Recommended For You              │
├─────────────────────────────────┤
│ Available Today                  │
└─────────────────────────────────┘
```

#### Top Section
```
Greeting: "Good Evening, Souvik 👋"
Font: Heading 2, #111827
Spacing: 16px from top

Profile Avatar: 40px, rounded-full
Notification Icon: 24px, #6B7280
Tap Target: 48px

Spacing: 16px horizontal padding
```

#### Search Bar
```
Height: 48px
Placeholder: "Search doctors, symptoms, clinics…"
Icon: Search, 20px
Padding: 16px horizontal
Margin: 16px top, 16px bottom
Border Radius: 8px
Background: #F9FAFB
Focus: Background #FFFFFF, Border #0066FF
```

#### Quick Actions
```
Grid: 2 columns
Gap: 12px
Cards:
  1. Book Appointment (Icon: Calendar)
  2. Video Consultation (Icon: Video)
  3. Emergency Help (Icon: Alert)
  4. Lab Tests (Icon: Beaker)

Each card:
  - Icon: 32px, #0066FF
  - Title: 14px, 600
  - Padding: 16px
  - Border Radius: 12px
  - Tap Target: 56px minimum
```

#### Specialty Browse
```
Title: "Browse by Specialty"
Font: Heading 3, #111827
Margin: 24px top, 12px bottom

Horizontal scroll:
  - Chips with icons
  - Padding: 8px 16px
  - Border Radius: full
  - Active: #0066FF background
  - Inactive: #F9FAFB background
  - Scroll indicator: Subtle dots
```

#### Upcoming Appointment
```
If appointment exists:
  - Pin near top (after search)
  - Card with gradient background
  - Doctor image: 48px
  - Doctor name + specialty
  - Date/Time: "Tomorrow, 2:30 PM"
  - Status: "Confirmed" (green badge)
  - Actions: "Join", "Reschedule", "View Details"
  - Padding: 16px
  - Border Radius: 12px
  - Shadow: md
```

#### Section Headers
```
Font: Heading 3, #111827
Margin: 24px top, 12px bottom
Padding: 0 16px
Optional "See All" link: 14px, #0066FF
```

#### Doctor Cards (Horizontal Scroll)
```
Layout:
  - Image: 80px × 80px, rounded-lg
  - Name: Heading 3
  - Specialty: Body Small
  - Rating: ⭐ 4.8
  - Next Slot: "Available Today, 2:30 PM"
  - Fee: "₹500"
  - CTA: "Book Now"

Width: 160px (for horizontal scroll)
Padding: 12px
Border Radius: 12px
Shadow: md
Scroll: Smooth, with momentum
```

---

### DOCTOR LISTING SCREEN

#### Layout
```
┌─────────────────────────────────┐
│ Search + Filter + Sort           │
├─────────────────────────────────┤
│ Specialty Chips (Horizontal)     │
├─────────────────────────────────┤
│ Doctor Cards (Vertical List)     │
└─────────────────────────────────┘
```

#### Search & Filter
```
Search Bar: Same as home
Filter Button: Icon + "Filter"
Sort Button: Icon + "Sort"
Active Filters: Show as chips below search
```

#### Doctor Card (List View)
```
Layout:
  - Image: 64px × 64px, rounded-lg
  - Name: Heading 3, #111827
  - Specialty: Body Small, #6B7280
  - Experience: "8 years experience"
  - Rating: ⭐ 4.8 (120 reviews)
  - Next Slot: "Available Today, 2:30 PM"
  - Fee: "₹500/consultation"
  - CTA: "Book Now" (Primary Button)

Padding: 16px
Border Radius: 12px
Border: 1px #E5E7EB
Shadow: sm
Margin: 12px 16px
Tap Target: Full card
```

---

### DOCTOR PROFILE SCREEN

#### Layout
```
┌─────────────────────────────────┐
│ Hero Section (Image + Name)      │
├─────────────────────────────────┤
│ Quick Info (Rating, Experience) │
├─────────────────────────────────┤
│ Qualifications                   │
├─────────────────────────────────┤
│ Expertise                        │
├─────────────────────────────────┤
│ Languages                        │
├─────────────────────────────────┤
│ Clinic Details                   │
├─────────────────────────────────┤
│ Consultation Fees                │
├─────────────────────────────────┤
│ Patient Reviews                  │
├─────────────────────────────────┤
│ Available Slots                  │
├─────────────────────────────────┤
│ [Sticky] Book Appointment        │
└─────────────────────────────────┘
```

#### Hero Section
```
Image: Full width, 240px height
Gradient overlay: Bottom (transparent → black)
Name: Display, white, positioned at bottom
Specialty: Body Large, white
Rating: ⭐ 4.8 (120 reviews)
Back button: Top left, white icon
```

#### Quick Info Cards
```
Grid: 3 columns
Cards:
  1. Rating: "4.8" + "120 reviews"
  2. Experience: "8 years"
  3. Consultation: "₹500"

Each card:
  - Background: #F9FAFB
  - Padding: 12px
  - Border Radius: 8px
  - Text: 14px, 600
```

#### Sections
```
Title: Heading 3, #111827
Content: Body Regular, #6B7280
Padding: 16px
Border: None (clean separation with spacing)
```

#### Reviews Section
```
Title: "Patient Reviews"
Rating: ⭐ 4.8 (120 reviews)
Review Cards:
  - Patient name: 14px, 600
  - Rating: ⭐ 4.8
  - Review text: 14px, 400
  - Date: 12px, #9CA3AF
  - Padding: 12px
  - Border Radius: 8px
  - Background: #F9FAFB
```

#### Available Slots
```
Title: "Available Slots"
Date selector: Horizontal scroll
  - Date: "Today", "Tomorrow", "Mon 15"
  - Active: #0066FF background
  - Inactive: #F9FAFB background

Time slots: Grid (3 columns)
  - Time: "2:30 PM"
  - Available: Green badge
  - Booked: Disabled state
  - Tap Target: 56px minimum
```

#### Sticky CTA
```
Position: Bottom, sticky
Height: 64px (including safe area)
Background: #FFFFFF
Border Top: 1px #E5E7EB
Button: "Book Appointment" (Primary, full width)
Padding: 12px 16px
```

---

### APPOINTMENT BOOKING FLOW

#### Step 1: Confirm Doctor
```
Doctor card with all details
CTA: "Continue" (Primary Button)
Progress: "Step 1 of 5"
```

#### Step 2: Consultation Type
```
Options:
  1. Clinic Visit
  2. Video Consultation
  3. Home Visit

Cards with icons:
  - Icon: 32px, #0066FF
  - Title: 16px, 600
  - Description: 14px, #6B7280
  - Padding: 16px
  - Border Radius: 12px
  - Active: Border #0066FF, Background #F0F4FF
  - Tap Target: Full card

Progress: "Step 2 of 5"
```

#### Step 3: Select Date
```
Calendar view:
  - Current month
  - Highlight available dates
  - Disable past dates
  - Show selected date

Alternative: Date picker (horizontal scroll)
  - "Today", "Tomorrow", "Mon 15", etc.
  - Active: #0066FF background

Progress: "Step 3 of 5"
```

#### Step 4: Choose Slot
```
Time slots: Grid (3 columns)
  - Time: "2:30 PM"
  - Available: Green badge
  - Booked: Disabled state
  - Tap Target: 56px minimum

Selected slot: Highlighted with #0066FF

Progress: "Step 4 of 5"
```

#### Step 5: Confirm Booking
```
Summary:
  - Doctor name + image
  - Consultation type
  - Date + Time
  - Fee: "₹500"
  - Total: "₹500"

CTA: "Confirm Booking" (Primary Button)
Secondary: "Edit" (Ghost Button)

Progress: "Step 5 of 5"

Success state:
  - Checkmark animation
  - "Appointment Confirmed!"
  - Appointment details
  - CTA: "View Appointment"
```

---

### APPOINTMENTS SCREEN

#### Layout
```
┌─────────────────────────────────┐
│ Segmented Tabs                   │
│ (Upcoming, Completed, Cancelled) │
├─────────────────────────────────┤
│ Appointment Cards                │
└─────────────────────────────────┘
```

#### Tabs
```
Upcoming (default)
Completed
Cancelled

Active: #0066FF text + underline
Inactive: #6B7280 text
Transition: 200ms ease-out
```

#### Appointment Card
```
Layout:
  - Doctor image: 48px × 48px
  - Doctor name + specialty
  - Date/Time: "Tomorrow, 2:30 PM"
  - Status badge: "Confirmed" (green)
  - Actions: "Rebook", "Chat", "View Prescription"

Padding: 16px
Border Radius: 12px
Background: #FFFFFF
Border: 1px #E5E7EB
Shadow: sm
Margin: 12px 16px

Actions:
  - Rebook: Primary Button
  - Chat: Secondary Button
  - View Prescription: Ghost Button
```

---

### HEALTH PROFILE SCREEN

#### Layout
```
┌─────────────────────────────────┐
│ Health Overview                  │
├─────────────────────────────────┤
│ Health Records                   │
├─────────────────────────────────┤
│ Medicines                        │
├─────────────────────────────────┤
│ Prescriptions                    │
├─────────────────────────────────┤
│ Reminders                        │
├─────────────────────────────────┤
│ Reports                          │
└─────────────────────────────────┘
```

#### Health Overview
```
Cards:
  1. Blood Pressure: "120/80 mmHg"
  2. Weight: "75 kg"
  3. Height: "5'10\""
  4. BMI: "24.5 (Normal)"

Each card:
  - Icon: 32px, #0066FF
  - Title: 12px, #6B7280
  - Value: 20px, 600, #111827
  - Padding: 12px
  - Border Radius: 8px
  - Background: #F9FAFB
```

#### Health Records
```
List of records:
  - Record name: "Blood Test Report"
  - Date: "15 May 2024"
  - Icon: Document
  - Tap: Open/download

Padding: 12px 16px
Border Radius: 8px
Background: #FFFFFF
Border: 1px #E5E7EB
```

---

### PROFILE SCREEN

#### Layout
```
┌─────────────────────────────────┐
│ Profile Header                   │
├─────────────────────────────────┤
│ Account Settings                 │
├─────────────────────────────────┤
│ Family Members                   │
├─────────────────────────────────┤
│ Payment Methods                  │
├─────────────────────────────────┤
│ Saved Doctors                    │
├─────────────────────────────────┤
│ Reports                          │
├─────────────────────────────────┤
│ Privacy & Support                │
├─────────────────────────────────┤
│ Logout                           │
└─────────────────────────────────┘
```

#### Profile Header
```
Avatar: 80px × 80px, rounded-full
Name: Heading 2, #111827
Email: Body Small, #6B7280
Edit button: Icon button, top right

Padding: 16px
Background: #F9FAFB
Border Radius: 12px
```

#### Settings Items
```
Icon: 24px, #6B7280
Title: 16px, 500, #111827
Subtitle: 12px, #9CA3AF (optional)
Chevron: 24px, #9CA3AF

Padding: 16px
Border: 1px #E5E7EB
Border Radius: 8px
Margin: 8px 16px
Tap Target: 56px minimum
```

---

## ⚡ MICRO INTERACTIONS

### Button Feedback
```
Default: Full opacity
Hover: Opacity 0.9
Active: Scale 0.98, Opacity 0.95
Disabled: Opacity 0.5, Cursor not-allowed
Transition: 200ms ease-out
```

### Card Press
```
Default: Shadow md
Press: Shadow lg, Scale 1.02
Release: Animate back to default
Duration: 200ms
Easing: ease-out
```

### Tab Switch
```
Active tab: Slide underline animation
Duration: 300ms
Easing: ease-out
Content: Fade in (opacity 0 → 1)
```

### Bottom Navigation
```
Active icon: Scale 1.1, Color #0066FF
Inactive icon: Scale 1.0, Color #9CA3AF
Transition: 200ms ease-out
Ripple effect: Subtle, 200ms
```

### Loading States
```
Skeleton: Shimmer animation (left to right)
Duration: 1.5s
Repeat: Infinite
Opacity: 0.6 → 1.0 → 0.6
```

### Pull-to-Refresh
```
Trigger: Pull down 60px
Icon: Rotate animation
Release: Refresh animation
Duration: 300ms
```

---

## 🎯 INTERACTION PATTERNS

### Search
```
Focus: Expand search bar
Placeholder: "Search doctors, symptoms, clinics…"
Results: Appear below with smooth animation
Debounce: 300ms
Clear button: Appears when text entered
```

### Filter
```
Open: Bottom sheet animation (slide up)
Duration: 300ms
Easing: ease-out
Filters: Checkboxes with smooth animation
Apply: Primary button at bottom
Reset: Ghost button
```

### Modals
```
Overlay: Fade in (opacity 0 → 0.5)
Modal: Slide up from bottom
Duration: 300ms
Easing: ease-out
Close: Slide down or tap overlay
```

### Notifications
```
Toast: Slide in from top
Duration: 3s (auto-dismiss)
Action: Optional button
Dismiss: Swipe up or tap
```

---

## 📊 PERFORMANCE PERCEPTION

### Skeleton Loading
```
Show skeleton while loading
Smooth shimmer animation
Feels faster than spinner
Reduces perceived load time
```

### Optimistic UI
```
Instant feedback on actions
Update UI before API response
Rollback on error
Feels responsive
```

### Progressive Loading
```
Load critical content first
Load images progressively
Lazy load bottom sections
Feels smooth and fast
```

### Transitions
```
All transitions: 200-300ms
Easing: ease-out
Smooth, not jarring
Feels premium
```

---

## ✅ IMPLEMENTATION CHECKLIST

- [ ] Create color tokens
- [ ] Create typography scale
- [ ] Create spacing system
- [ ] Create shadow system
- [ ] Create border radius system
- [ ] Build button components
- [ ] Build card components
- [ ] Build input components
- [ ] Build tab components
- [ ] Build bottom navigation
- [ ] Build loading states
- [ ] Implement micro interactions
- [ ] Test on small/mid/large phones
- [ ] Test performance
- [ ] Test accessibility
- [ ] Get design review
- [ ] Implement in React Native

---

## 🚀 NEXT STEPS

1. **Create Design Tokens** (colors, typography, spacing)
2. **Build Component Library** (buttons, cards, inputs, etc.)
3. **Design Screens** (home, doctors, appointments, profile)
4. **Implement Interactions** (micro interactions, transitions)
5. **Test & Iterate** (performance, accessibility, usability)
6. **Launch** (premium, smooth, unique HealthSync experience)

---

**This design system creates a premium, startup-grade healthcare experience that feels like Swiggy/Zomato/Airbnb—smooth, fast, delightful, and uniquely HealthSync.**
