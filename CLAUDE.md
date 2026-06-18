# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## JobsiteX — React Native App

Dual-role trucking platform (Expo/React Native). Customers book truck jobs; drivers accept and fulfil them.

**Backend repo**: `C:\Users\ruhul\Desktop\STA Projects\jobsitex_backend` (NestJS + Prisma + PostgreSQL + Redis + Socket.IO)

## Development Commands

```bash
npx expo start            # Start Expo dev server (Expo Go or dev client)
npx expo run:android      # Build and run on Android
npx expo run:ios          # Build and run on iOS
```

No test runner or linter is configured — TypeScript (`tsc`) is the only static check available.

## Tech Stack

- **Framework**: Expo ~54 / React Native 0.81.5 / React 19
- **Navigation**: React Navigation — single flat `AuthStackParamList` covering all screens
- **Styling**: NativeWind 4 (TailwindCSS) — brand colors: `primary` `#4CAF50`, `secondary` `#FF9800`, `tertiary` `#FFD64F`
- **HTTP**: Axios — `IPA_BASE` = `https://api.jobsitex.co/api/v1`
- **Sockets**: socket.io-client 4 — `SOCKET_URL` = `https://api.jobsitex.co` (root only)
- **Maps**: react-native-maps + expo-location + Google Maps
- **Storage**: AsyncStorage (key inventory below)
- **Payments**: Stripe Connect (driver payout)
- **Push**: expo-notifications (FCM/Expo tokens)

## Navigation Architecture

All screens share a single `AuthStackParamList` (`src/Navigation/type.ts`). `App.tsx` switches between three stacks:

```
AppNavigation
├── AuthStack         — unauthenticated (SplashScreen → SignIn/SignUp → OTP …)
├── OnboardingStack   — first-launch (RoleSelect → OnBoardingFrist)
└── MainAppStack      — authenticated; initial route based on user.role
    ├── DRIVER → DriverMainTabs (bottom tabs)
    └── USER   → UserMainTabs  (bottom tabs)
```

Context provider wrapping order: `AuthProvider > UserProvider > BookingProvider > NavigationContainer`

## Role Architecture

- **USER (CUSTOMER)** — creates jobs, tracks drivers live, pays on delivery
- **DRIVER** — receives job offers, advances status, streams GPS, earns via Stripe

## Auth Flow

1. Signup → OTP verify (6-digit, 10-min expiry) → tokens stored in AsyncStorage
2. Google mobile OAuth: `POST /auth/google/mobile` with `{ idToken, role? }`
3. All authenticated requests: `Authorization: Bearer <vToken>`
4. On 401 response, call `signOut()` from `useAuth()`
5. Access token expires in **7 days**; refresh token in **30 days**

## AsyncStorage Key Inventory

| Key | Contents |
|---|---|
| `vToken` | JWT access token |
| `vRefreshToken` | Refresh token |
| `vUser` | Serialized user object (`SafeUser`) |
| `vDriver` | Cached driver profile (`SafeDriver`) |
| `@user_data` | Full user profile from `/user/profile` |
| `@user_profile_image` | Profile image URL |
| `isFirstLaunch` | `'false'` once set; `null` on first launch |
| `onboardingCompleted` | `'true'` / `'false'` |

## Job Status Machine

```
PENDING → BROADCAST → BOOKED → ON_WAY → ARRIVED → LOADED → IN_TRANSIT → DELIVERED
                                                                            ↕
                                                                       CANCELLED
```

- Status advances via `PATCH /jobs/:id/status` (REST, driver only)
- Cancel allowed only from `PENDING` or `BROADCAST` (customer only)
- Valid transitions: `BOOKED→ON_WAY`, `ON_WAY→ARRIVED`, `ARRIVED→LOADED`, `LOADED→IN_TRANSIT`, `IN_TRANSIT→DELIVERED`

## Socket Architecture

Connection: `io(SOCKET_URL, { auth: { token: rawJWT } })` — **no "Bearer" prefix**.  
Server auto-joins each user to room `user:{userId}`.

### Client → Server (driver only)

| Event | Payload | Purpose |
|---|---|---|
| `driver:subscribe-jobs` | `{ radius?: number }` | Join `driver:available` room |
| `driver:unsubscribe-jobs` | — | Leave `driver:available` room |
| `driver:location` | `{ lat, lng, heading?, speed? }` | GPS every 3-5 s (active job only) |

### Server → Client

| Event | Room | Payload |
|---|---|---|
| `job:new` | `driver:available` | `{ jobId, truckType, pickupAddress, dropoffAddress, distanceKm, estimatedFare }` |
| `job:direct-offer` | `user:{driverId}` | `{ jobId, pickupAddress, dropoffAddress, estimatedFare, timeoutSeconds }` |
| `job:status-update` | `user:{customerId}` | `{ jobId, status }` |
| `driver:location` | `user:{customerId}` | `{ jobId, lat, lng, heading?, speed?, ts }` |
| `notification` | `user:{userId}` | `{ id, type, title, message, data?, createdAt }` |

### Key rules

- Accept/reject → REST (`POST /jobs/:id/accept`), not socket
- Status changes → REST (`PATCH /jobs/:id/status`), not socket
- Cancel → REST (`DELETE /jobs/:id/cancel`), not socket
- Location forwarded only during: `BOOKED | ON_WAY | ARRIVED | LOADED | IN_TRANSIT`
- DB location writes throttled to max once per 5 s server-side
- Do not add socket events without verifying against `.claude/JobsiteX.postman_collection.json`

## Backend Data Models (Key Facts)

### User roles (enum `Role`)
`CUSTOMER` | `DRIVER` | `ADMIN`

### Driver approval flow
Driver signs up → profile incomplete → uploads CDL, Insurance, DOT Number, Truck Photo → admin approves (`driverStatus = APPROVED`, `isProfileComplete = true`) → driver can toggle availability and accept jobs. Until approved, driver cannot accept jobs.

### Payment
- Platform fee: **15%** of job fare
- Driver receives `amount - platformFee` to their `currentBalance`
- Payment is initiated after job reaches `DELIVERED` status
- Minimum withdrawal: $10, requires Stripe Express onboarding

### Fare calculation
`total = (baseFare × capacityMultiplier) + (distanceKm × distanceRatePerKm) + (estimatedHours × timeRatePerHour)`  
Distance comes from Google Maps API with Haversine fallback.

### Notification types
`JOB_BROADCAST` | `JOB_ACCEPTED` | `JOB_STATUS_UPDATE` | `DRIVER_APPROVED` | `DRIVER_REJECTED` | `PAYMENT_RECEIVED` | `DOCUMENT_APPROVED` | `DOCUMENT_REJECTED` | `WITHDRAWAL_PROCESSED`

## Key API Endpoints

See `.claude/JobsiteX.postman_collection.json` for full reference.

```
POST   /auth/signup
POST   /auth/login
POST   /auth/verify-otp
POST   /auth/forgot-password
POST   /auth/reset-password
POST   /auth/refresh
POST   /auth/google/mobile

GET    /user/profile
PATCH  /user/profile                    # multipart/form-data, includes avatar
POST   /user/change-password            # { currentPassword, newPassword }
POST   /user/fcm-token                  # { fcmToken }
GET    /user/notifications?page=&limit=
PATCH  /user/notifications/:id/read
PATCH  /user/notifications/read-all

GET    /driver/profile
POST   /driver/profile/complete         # multipart, truck info + documents
PATCH  /driver/availability             # { isAvailable: bool }
PATCH  /driver/location                 # { latitude, longitude }
GET    /driver/earnings
POST   /driver/stripe/onboarding-link

GET    /fare/truck-types
GET    /fare/estimate?truckTypeId&pickupLat&pickupLng&dropoffLat&dropoffLng

POST   /jobs                            # create job
GET    /jobs/home
GET    /jobs/nearby-drivers?truckTypeId&lat&lng&radiusKm
GET    /jobs/my-jobs?status=            # customer jobs
GET    /jobs/driver-jobs?status=        # driver jobs
GET    /jobs/:id
POST   /jobs/:id/accept                 # driver accepts
PATCH  /jobs/:id/status                 # driver advances status
DELETE /jobs/:id/cancel                 # customer cancels
POST   /jobs/:id/review                 # { rating: 1-5, comment? }

POST   /payment/job/:jobId/intent       # create Stripe PaymentIntent

POST   /withdrawals/request             # { amount } — min $10
GET    /withdrawals/history
```

## Environment Variables

Defined in `.env`, typed in `env.d.ts`, imported from `@env` via `react-native-dotenv`.

| Variable | Purpose |
|---|---|
| `IPA_BASE` | REST base URL (includes `/api/v1`) |
| `SOCKET_URL` | Socket.IO base URL (root only) |
| `GOOGLE_MAPS_API_KEY` | react-native-maps |
| `STATUS_DRIVER` | Path for driver online/offline toggle |
| `LOCATION_UPDATE` | Path for background location REST update |
| `AVAILABLE_JOBS` | Path for nearby jobs list |
| `DRIVER_DETAILS` | Path for driver profile fetch |
| `ACCEPT_JOBS` | Path prefix for job acceptance |
| `ACTIVE_JOBS_USER` | Path for customer active/completed jobs |

## Common Patterns

### Authenticated Axios call
```ts
const token = await AsyncStorage.getItem('vToken')
const res = await axios.get(`${IPA_BASE}/jobs/${jobId}`, {
  headers: { Authorization: `Bearer ${token}` },
  timeout: 10000,
})
```

### Listening to socket events (with cleanup)
```ts
useEffect(() => {
  const handler = (data: JobStatusUpdateData) => { ... }
  socketService.onJobStatusUpdate(handler)
  return () => socketService.offJobStatusUpdate(handler)
}, [])
```

### Driver location streaming
```ts
driverSocketService.sendLocation({ lat: coords.latitude, lng: coords.longitude })
```

## Coding Conventions

- Functional components with hooks only
- NativeWind `className` for all styles — use `StyleSheet` only when animation requires it
- Brand color `primary` = `#4CAF50`; use `bg-primary` / `text-primary` etc.
- Error response shape: `{ success: false, message: string }`
- Success response shape: `{ success: true, data: T, message?: string }`
- TypeScript strict mode is on

## Sensitive Files

- `.env` — never commit
- `UnknowFile/.txt` — contains Stripe live keys, Google Play credentials, MongoDB creds
