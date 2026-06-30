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
6. In the app, move through the MVP by tapping the Start/Request/Review/Match/Booked/Live/Summary step labels or the bottom Previous/Next buttons. The main screen area scrolls vertically on smaller Android displays.

### Option B: Android emulator
1. Install Android Studio and create an Android virtual device.
2. Start the emulator.
3. From this project directory:

```bash
npm install
npm run android
```

Expo will open the app on the running emulator.

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
