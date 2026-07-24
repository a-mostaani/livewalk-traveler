# LiveWalk Traveler MVP

Android-ready clickable MVP for the traveler side of LiveWalk, a marketplace where remote travelers book local guides to physically walk a route while streaming live video.

## What is included
- Polished React Native / Expo traveler prototype.
- Android-friendly navigation: tap the top step labels or use the persistent Previous/Next bar at the bottom to move through all seven screens.
- Vertically scrollable screens with safe-area padding so controls stay reachable on smaller Android phones.
- Complete traveler-side click-through flow:
  1. Onboarding / value proposition
  2. Home request entry
  3. Route and request review
  4. Matching and guide selection / pending state
  5. Confirmed booking detail
  6. Live walk session
  7. Session summary and rating
- Mocked route preview, mocked guide matching, mocked captions, mocked GPS progress, mocked payment estimate, mocked live video placeholder.
- Concise app flow in [`FLOW.md`](./FLOW.md).

## Run on Android

### Option A: Physical Android device with Expo Go
1. Install Node.js 20+.
2. Install Expo Go on the Android phone from Google Play.
3. From this project directory, install dependencies:

```bash
npm install
```

4. Start Expo:

```bash
npm start
```

5. Scan the QR code with Expo Go.
6. The Start/Request/Review/Match/Booked/Live/Summary strip is a read-only booking-progress indicator. Use the persistent Previous/Next buttons and the screen CTAs to move through the MVP. The main screen area scrolls vertically on smaller Android displays.

### Option B: Android emulator
1. Install Android Studio and create an Android virtual device.
2. Start the emulator.
3. From this project directory:

```bash
npm install
npm run android
```

Expo will open the app on the running emulator.


## Native/dev build readiness

Pre-LW-10 prepares the Traveler app to receive native LiveKit video/audio. This app now includes `expo-dev-client` and an `eas.json` with development/internal Android APK profiles.

For local native development after native media modules are added:

```bash
npm install
npx eas build --profile development --platform android
npx expo start --dev-client
```

For the current demo APKs, keep using the published installable Android builds from the LiveWalk APK download page. This gate should not change current Traveler demo behavior.

## Runtime configuration

Copy `.env.example` to `.env` for local development, or set the same variables in the EAS build environment selected by the profile (`development`, `preview`, or `production`). `app.config.js` reads `MAPBOX_TOKEN_MOBILE` during EAS configuration and writes it to `extra.mapboxTokenMobile`, which the Android and iOS runtime selects. Use the real restricted public Mapbox token in EAS only; never commit it or substitute a fallback token. `LIVEKIT_WS_URL` is a public WebSocket endpoint and is copied into `extra.livekitWsUrl`; it identifies the LiveKit server but does not authorize a room connection. Keep LiveKit API credentials and all signing material out of this app.

## Useful development commands

```bash
npm start          # Start Expo dev server
npm run android    # Start on Android device/emulator
npm run web        # Optional browser preview for fast UI checks
npm run typecheck  # TypeScript verification
npm run export:web # Static web export check
```

## What is mocked
- User authentication and traveler profile
- Places/autocomplete and geocoding
- Route distance/time calculation
- Guide availability and accept/decline workflow
- Live video stream
- Voice, chat, and real-time control commands
- Captions and translation
- GPS updates and map rendering
- Payments, refunds, receipts, and disputes
- Notifications and calendar reminders

## Next backend integrations needed
1. **Accounts and profiles**: traveler login, preferences, saved languages, payment method.
2. **Places and routing**: Google Maps/Mapbox search, geocoding, route previews, estimated walk duration.
3. **Marketplace dispatch**: create traveler request, notify nearby guides, accept/decline, booking status updates.
4. **Scheduling**: availability, time zones, reminders, cancellation policy.
5. **Live session stack**: WebRTC or managed live video SDK, audio controls, in-session chat, command channel.
6. **Realtime location**: guide GPS stream, route progress, stop/detour events.
7. **Captions/translation**: live speech-to-text and translation pipeline.
8. **Payments**: authorization, capture, guide payout, service fee, receipt, refund/dispute state.
9. **Trust and safety**: guide verification, session reporting, moderation, emergency stop.
10. **Analytics**: request funnel, guide response time, live session quality, booking completion.

## Project structure

```text
App.tsx                         Main app state and screen navigation
src/components/Primitives.tsx    Shared UI building blocks
src/components/TravelVisuals.tsx Mock map/video/progress visuals
src/data/mock.ts                 Mock request, guides, captions, estimates
src/screens/*                    Traveler flow screens
FLOW.md                          Product flow summary
README.md                        Setup, run, mocked scope, next integrations
```


## Shared API contract

Runtime API contract types live in `src/types/index.ts`. `src/api.ts` imports and re-exports those types so request/session/user shapes are declared in one place per app. The current shared contract is copied between Traveler and Guide deliberately; if the contract grows further, promote it into a generated or packaged shared contract before adding new request/session fields.

## Shared backend integration

This build points at the published demo backend:

```text
https://rendezvous-livewalk-api.webpeter.com
```

Functional vertical slice now included:
1. Traveler creates a walk request with route, time, language, and interests.
2. Guide APK sees the pending request from the shared backend.
3. Guide accepts or declines it.
4. Traveler APK polls and updates to confirmed when accepted.
5. Both sides enter a shared live session state.
6. Both sides can post/read basic session messages.

For a clean demo, use the protected backend demo seed/reset flow; do not expose destructive reset publicly in the app.

## Traveler web application

The production web client lives under `web/` and uses the same LiveWalk marketplace API as the Traveler and Guide mobile apps.

```bash
npm run web:typecheck
npm run web:test
MAPBOX_TOKEN_WEB=... npm run web:build
```

Publish the complete generated `dist-web/` directory as one static artifact. Do not publish the repository root or upload `index.html` separately; every `/assets/*` reference in the generated HTML must ship in the same version.

The Mapbox public browser token is injected only at build time from `MAPBOX_TOKEN_WEB` into Vite's public map-key input; production builds fail if it is missing, and no real token belongs in tracked source. Browser authentication uses `sessionStorage`, validates restoration through `/api/auth/me`, calls `/api/auth/logout` on sign-out, and clears the local token on sign-out or an unauthorized response. Quotes must come from `/api/requests/estimate` and remain tied to the exact request draft before `/api/requests` can submit it.
