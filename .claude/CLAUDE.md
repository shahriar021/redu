# JobsiteX — React Native App

Dual-role trucking platform (Expo/React Native). Customers book truck jobs; drivers accept and fulfil them.

## Tech Stack
- **Framework**: Expo ~54 / React Native 0.81.5 / React 19
- **Navigation**: React Navigation (native-stack + bottom-tabs)
- **Styling**: NativeWind 4 (TailwindCSS for RN)
- **HTTP**: Axios — base `IPA_BASE` = `https://api.jobsitex.co/api/v1`
- **Sockets**: socket.io-client 4 — base `SOCKET_URL` = `https://api.jobsitex.co` (root, no `/api/v1`)
- **Maps**: react-native-maps + expo-location + Google Maps
- **Storage**: AsyncStorage — JWT stored as `vToken`
- **Payments**: Stripe Connect (driver payout flow)
- **Push**: expo-notifications (FCM tokens)

## Project Layout
```
src/
  Auth/           – AuthContext, UserContext, BookingContext, auth screens
  Components/     – Shared UI (JobCard, Google auth, CountryPicker, Toast)
  constants/      – App-wide constants & image references
  home/
    Users/        – Customer screens + user socket service
      services/socket.service.ts         ← customer socket (DO NOT add events here without checking Postman)
      screens/UserHome/UserFindingDrivers.tsx
      screens/UserHome/UserLiveTracking.tsx
    Drivers/      – Driver screens + driver socket service
      services/driverSocket.service.ts   ← driver socket
      screens/DriverJobs/HeadingToPickup.tsx
      screens/DriverJobs/JobAssigned.tsx
      TabNavigation/DriverHome.tsx
  Navigation/type.ts  – RN navigation param-list types
  Utils/          – Hooks (useJobs, useLocation, useRouteDirection, etc.)
.claude/
  CLAUDE.md                              ← this file
  JobsiteX.postman_collection.json       ← full API + socket reference
```

## Role Architecture
- **CUSTOMER** — creates jobs, tracks drivers live, pays on delivery
- **DRIVER** — receives job offers, advances status, streams GPS, gets paid via Stripe

## Auth Flow
1. Signup → OTP verify → tokens stored in AsyncStorage as `vToken` / `refreshToken`
2. Google mobile OAuth: `POST /auth/google/mobile` with `{ idToken, role }`
3. All authenticated requests: `Authorization: Bearer <vToken>`

## Job Status Machine
```
PENDING → BROADCAST → BOOKED → ON_WAY → ARRIVED → LOADED → IN_TRANSIT → DELIVERED
                                                                            ↕
                                                                       CANCELLED
```
Status is advanced by the driver via `PATCH /jobs/:id/status` (REST, not socket).

## Socket Architecture
Connection: `io(SOCKET_URL, { auth: { token: rawJWT } })` — **no "Bearer" prefix**.
The server auto-places each authenticated user in room `user:{userId}`.

### Client → Server (driver only)
| Event | Payload | Purpose |
|---|---|---|
| `driver:subscribe-jobs` | `{ radius: number }` | Join `driver:available` room |
| `driver:unsubscribe-jobs` | — | Leave `driver:available` room |
| `driver:location` | `{ lat, lng, heading?, speed? }` | Stream GPS every 3-5 s on active job |

### Server → Client
| Event | Room | Payload |
|---|---|---|
| `job:new` | `driver:available` | Broadcast job offer |
| `job:direct-offer` | `user:{driverId}` | Direct job offer |
| `job:status-update` | `user:{customerId}` | `{ jobId, status }` |
| `driver:location` | `user:{customerId}` | `{ jobId, lat, lng, heading?, speed?, ts }` |
| `notification` | `user:{userId}` | `{ id, type, title, message, data, createdAt }` |

### Key rules
- Accept/reject job → REST (`POST /jobs/:id/accept`), not socket
- Status changes → REST (`PATCH /jobs/:id/status`), not socket
- Cancel job → REST (`DELETE /jobs/:id/cancel`), not socket
- `driver:location` only forwarded while job is in BOOKED/ON_WAY/ARRIVED/LOADED/IN_TRANSIT

## Key API Endpoints
See `.claude/JobsiteX.postman_collection.json` for full reference. Common ones:

```
POST   /auth/signup
POST   /auth/login
POST   /auth/verify-otp
POST   /auth/google/mobile

GET    /user/profile
PATCH  /user/profile                  # multipart/form-data, includes avatar

GET    /driver/profile
POST   /driver/profile/complete       # multipart, includes CDL + docs
PATCH  /driver/availability           # { isAvailable: bool }
POST   /driver/stripe/onboarding-link

GET    /fare/truck-types
GET    /fare/estimate?truckTypeId&pickupLat&pickupLng&dropoffLat&dropoffLng

POST   /jobs                          # create job
GET    /jobs/home
GET    /jobs/nearby-drivers?truckTypeId&lat&lng&radiusKm
GET    /jobs/my-jobs?status=          # customer jobs
GET    /jobs/driver-jobs?status=      # driver jobs
GET    /jobs/:id
POST   /jobs/:id/accept               # driver accepts
PATCH  /jobs/:id/status               # driver advances status
DELETE /jobs/:id/cancel               # customer cancels
POST   /jobs/:id/review               # customer rates driver

POST   /payment/job/:jobId/intent     # create Stripe PaymentIntent

POST   /withdrawals/request
GET    /withdrawals/history
```

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

## Environment Variables
Defined in `.env`, typed in `env.d.ts`, imported from `@env` via `react-native-dotenv`.
- `IPA_BASE` — REST base URL (includes `/api/v1`)
- `SOCKET_URL` — Socket.IO base URL (root only, no path)
- `GOOGLE_MAPS_API_KEY` — for react-native-maps

## Sensitive Files
- `.env` — never commit to public repos
- `UnknowFile/.txt` — contains Stripe live keys, Google Play credentials, MongoDB creds

## Coding Conventions
- Functional components with hooks only
- NativeWind `className` for all styles — no StyleSheet unless animation requires it
- AsyncStorage key for token: `vToken`; user ID: `userId`
- Error responses shape: `{ success: false, message: string }`
- Success response shape: `{ success: true, data: T, message?: string }`
