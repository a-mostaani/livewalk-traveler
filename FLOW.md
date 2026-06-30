# LiveWalk Traveler MVP Flow

## Scope
This MVP covers only the traveler side of LiveWalk. Guide apps, marketplace dispatch, payments, video streaming, route APIs, and backend accounts are represented with mocked data and local state.

## Interaction model
- The top Start/Request/Review/Match/Booked/Live/Summary labels are pressable step tabs.
- A persistent bottom Previous/Next bar lets Android testers move through all seven pages even when a screen's own CTA is below the fold.
- Each page scrolls vertically inside the safe area so lower controls are reachable on smaller phones and above Android system navigation.

## Traveler flow
1. **Onboarding / value proposition**
   - Traveler sees the LiveWalk promise: book a local guide who physically walks a route while streaming live video.
   - The visual direction is premium travel plus utility: map-first, video-first, clean, and practical.

2. **Request entry**
   - Traveler enters starting point, destination, preferred date/time, duration, language, and interests.
   - Interest and language choices are selectable chips.

3. **Route/request review**
   - App shows a mocked route preview, estimated distance, walking time, booked duration, and estimated payment breakdown.
   - Traveler can edit or proceed to guide matching.

4. **Matching / guide selection**
   - App shows mocked matching status and local guide cards.
   - Traveler can request a selected guide or keep the booking in a pending state.

5. **Confirmed booking detail**
   - App shows confirmed or pending status, booking details, route preview, estimated total, and session readiness checklist.
   - Traveler can enter a mock live room.

6. **Live walk session**
   - App presents a video placeholder, live timer, push-to-talk state, message control, stop-here control, change-route control, route/GPS panel, progress rail, and captions/translation panel.
   - Controls are clickable and use mocked local feedback.

7. **Session summary / rating**
   - App shows completed walk stats, price summary, guide rating, and next product needs.
   - Traveler can start another walk.

## Assumptions for this first Android-ready version
- Expo + React Native is the fastest practical path to Android testing with Expo Go or an Android emulator.
- All data is mocked locally so the user can click through the whole traveler journey without a backend.
- Native maps, live video, payments, notifications, accounts, and guide dispatch are intentionally deferred.

## Shared backend booking cycle added
- The traveler request is now posted to the shared LiveWalk Marketplace API at `https://rendezvous-livewalk-api.webpeter.com`.
- After submission, the traveler app polls the request every 2 seconds while the guide app polls pending requests from the same backend.
- When the guide APK accepts the request, the traveler booking updates to confirmed and receives the guide/session IDs.
- Joining the live room starts the shared session and both APKs can post/read basic session messages.

## End-to-end APK test
1. Install/open both rebuilt APKs.
2. In Traveler, tap **Send to guides** from the request/review flow.
3. In Guide, open the dashboard and tap **View live request**.
4. In Guide, tap **Accept**.
5. Traveler should change from waiting to confirmed within roughly 2 seconds.
6. Join/start the live session on either side and send a quick message; the other APK sees it in the shared messages panel.
