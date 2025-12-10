# Authentication & Authorization Flow

## Two-Gate System

The Complete Camping App implements a **two-gate authentication and authorization system**:

### Gate 1: Login Check
**Question:** Does the user have an account?
- **No** → Redirect to Login / Create Account (`Auth` screen)
- **Yes** → Continue to Gate 2

### Gate 2: Subscription Check  
**Question:** Are they Pro or Free?
- **Free** → Apply paywall triggers (limited features)
- **Pro** → Full access to all features

## User Types

### Guest (Not Logged In)
**What they can do:**
- ✅ Browse parks (view map, search, filters)
- ✅ View public content (tips, reviews, community posts, gear guides)
- ✅ Look at the My Trips screen (shows "Log in to start planning" empty state)
- ✅ Open Gear Closet or Packing List screens (shows placeholder empty states)
- ✅ Tap Settings, About, FAQs
- ✅ View weather forecasts

**What they cannot do:**
- ❌ Create a trip
- ❌ Save anything (parks, templates, gear)
- ❌ Customize anything
- ❌ Add gear
- ❌ Favorite a park
- ❌ Use templates
- ❌ Adjust advanced filters
- ❌ View their account page
- ❌ Upload photos
- ❌ Post tips or reviews
- ❌ Comment on community posts

**Trigger:** Any action button redirects to `Auth` screen with `navigation.navigate("Auth")`

### Free Users (Logged In, Not Subscribed)
**What they can do:**
- ✅ Everything guests can do, PLUS:
- ✅ Create **up to 2 trips**
- ✅ Add items to packing lists
- ✅ Save basic preferences
- ✅ Upload profile photo
- ✅ View their account

**Paywall Triggers:**
- Creating a 3rd trip → Navigate to `Paywall`
- Posting tips/reviews in Community → Navigate to `Paywall`
- Using advanced filters (future) → Navigate to `Paywall`
- Saving parks/favorites (future) → Navigate to `Paywall`
- Offline mode (future) → Navigate to `Paywall`

### Pro Users (Subscribed)
**What they can do:**
- ✅ **Everything** - Full, unlimited access to all features
- ✅ Unlimited trips
- ✅ Saved parks and favorites
- ✅ Post tips and reviews
- ✅ Advanced filters
- ✅ Offline mode
- ✅ Priority support

## Implementation

### Auth Helper (`src/utils/authHelper.ts`)

The centralized authentication/authorization helper provides:

```typescript
// Hooks
useIsLoggedIn() → boolean
useIsPro() → boolean
useUserStatus() → { isLoggedIn, isPro, isFree, isGuest }

// Gate Functions
requireLogin(navigation, action?) → boolean
requirePro(navigation, feature?) → boolean

// Hook Versions
useRequireLogin() → { isLoggedIn, isGuest, checkLogin }
useRequirePro() → { isLoggedIn, isPro, isFree, isGuest, checkPro }
```

### Usage Example

```typescript
import { useUserStatus } from "../utils/authHelper";

export default function MyScreen() {
  const { isGuest, isPro } = useUserStatus();
  const navigation = useNavigation();

  const handleCreateTrip = () => {
    // Gate 1: Login required
    if (isGuest) {
      navigation.navigate("Auth");
      return;
    }

    // Gate 2: Pro check (if needed)
    if (!isPro && trips.length >= 2) {
      navigation.navigate("Paywall");
      return;
    }

    // Proceed with action
    createTrip();
  };
}
```

## Screens with Auth Gates

### ✅ My Trips Screen (`MyTripsScreen.tsx`)
- **Login Gate:** Create trip button
- **Pro Gate:** Trip creation limited to 2 for free users
- **Guest Empty State:** "Log in to start planning" message

### ✅ My Gear Closet (`MyGearClosetScreen.tsx`)
- **Login Gate:** Add gear button
- **Guest Empty State:** "Log in to manage your gear" with detailed message

### ✅ Park Detail Modal (`ParkDetailModal.tsx`)
- **Login Gate:** "Add to Trip" buttons (all variants)
- Closes modal and navigates to Auth when guest taps

### ✅ Trip Detail Screen (`TripDetailScreen.tsx`)
- **Login Gate:** Edit Trip button

### ✅ My Campsite / Profile (`MyCampsiteScreen.tsx`)
- **Login Gate:** Edit profile, upload photos
- Already redirects to Auth if no user in `useEffect`

### ✅ Packing List (`PackingListScreen.tsx`)
- **Login Gate:** Add packing items

### ✅ Community Screen (`CommunityScreen.tsx`)
- **Login Gate:** Submit tip/review (checks guest first)
- **Pro Gate:** Posting content (free users can browse only)

## Navigation Routes

- **Login/Signup:** `navigation.navigate("Auth")`
- **Paywall:** `navigation.navigate("Paywall")`

## Empty States

Screens show contextual empty states for guests:

- **My Trips:** "Log in to start planning" with "Create an account to plan trips..." message
- **Gear Closet:** "Log in to manage your gear" with "Create an account to track your camping gear..." message
- **Packing Lists:** Shows placeholder (already tied to trips)

## Future Enhancements

Potential additional auth gates:
- [ ] Save parks to favorites → Login required
- [ ] Advanced park filters → Pro required
- [ ] Duplicate trip → Login required
- [ ] Export packing list → Pro required
- [ ] Offline mode → Pro required
- [ ] Photo uploads to Community → Login required
- [ ] Commenting on posts → Login required

## Testing Checklist

- [ ] Guest user cannot create trips (redirects to Auth)
- [ ] Guest user cannot add gear (redirects to Auth)
- [ ] Guest user cannot save parks (redirects to Auth)
- [ ] Free user can create 2 trips
- [ ] Free user's 3rd trip attempt shows Paywall
- [ ] Free user cannot post Community content (shows Paywall)
- [ ] Pro user has unlimited access
- [ ] Empty states display correct messaging for guests
- [ ] All navigation redirects work correctly

---

**Last Updated:** December 9, 2025  
**Version:** 1.1.1 (Build 120)
