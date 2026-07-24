# Traveler web UI parity plan

## Baseline and evidence

- Repository inspected on 2026-07-24:
  - `main` at `9cdf177` is the current production mobile baseline.
  - `peter-dev` at `ea6e5fe` is 22 commits ahead and contains the current Traveler PWA plus the latest mobile cancellation/resume safeguards.
- Deployed target: `https://rendezvous-traveler.webpeter.com` (hosted version v4). It returned HTTP 200 and its live bundle matches the current PWA capability set: account access, request creation, server quote, request list/status, refresh, and pre-live cancellation.
- Current web checks are green: web typecheck, 12 web tests, mobile typecheck, and 5 build-identity tests.
- API evidence:
  - Current backend `main` exposes auth, quote/create/list/get/cancel request, session status/messages/location/end, and a LiveKit token endpoint.
  - Current Guide `main` publishes booking state, messages, GPS, and LiveKit camera/audio after the guide starts the session.
  - Traveler web currently wires only auth, quote/create/list/get request, and cancellation.

The mobile flow is the UX/state reference. The existing dark LivelyWalk web shell, palette, responsive layout, icon/wordmark assets, PWA behavior, and production URL remain the web visual and operational baseline.

## Gap classification

- **A — implement now:** the deployed API and current browser dependencies already support the behavior.
- **B — existing API, not wired in Traveler web:** endpoint/data exists; add the web adapter, state handling, and UI before exposing the action.
- **C — new backend or media capability:** keep out of functional UI until the capability is implemented and verified end to end.

## Capability inventory

| Flow | Mobile reference | Current web | Gap and classification |
| --- | --- | --- | --- |
| Auth/account | Register/login, token restoration, expiry handling; demo shortcut on mobile | Register/login, `/auth/me` restore in session storage, server logout, expiry handling | Core parity exists. Add clearer reconnect/session-expired recovery **A**. Profile editing, password reset, saved preferences, and cross-device session management are **C**. Do not add inert account controls. |
| Request creation | Origin/destination search, schedule, duration, language and interests, review step | Same core fields in one panel, stable Mapbox selection, future-time validation | Preserve current working form. Align language/interest choices with the mobile set and add a separate review/confirm presentation without weakening quote binding **A**. |
| Location/map/quote | Mapbox place selection; route review; server quote; live guide GPS map | Place selection and server quote; no route or live map | Show origin/destination markers and quote facts with the current browser Mapbox token **A**. Session location and progress are available but unwired **B**. A routed street polyline/turn data needs a routing capability **C**; until then label the display as endpoints/live position, not a calculated route. |
| Booking lifecycle | Resumes newest pending/accepted/live request; matching, confirmed, ready/live, completed | Polls the full request list every 6 seconds and renders compact status cards | Add selected booking detail, resume newest active booking, and a request/session-derived lifecycle model **B**. Keep history cards. Remove the current implication that `accepted` means the guide has started; only request `live` plus session `live` is live. |
| Ready/live state | Accepted booking waits for guide; controls unlock only after guide starts; ended session opens summary | `accepted` card says the session is ready, but web does not read session status | Wire request detail plus `/sessions/:id/status` and distinguish pending, accepted/session-ready, live, ended, cancelled, declined, and reconnecting **B**. No join/live CTA before verified live state. |
| Guide updates | Guide acceptance, start/end, messages, GPS location and progress update in near real time | Guide name and request status only | Poll the active request/session while visible; present guide name, latest system/guide update, GPS freshness, coordinates, progress, and stale-update warning **B**. |
| Messaging/session controls | Shared message feed; quick message/stop/route-change events; traveler can end | No session panel or controls | Message list, typed message, bounded quick instructions, and confirmed end action use existing endpoints **B**. Show success only after server acknowledgement. Generic quick instructions are messages, not structured route commands. Actual traveler push-to-talk/audio publishing is **C** under the current subscribe-only media grant. |
| Cancellation/end states | Cancel pending/accepted with race protection; end live; show completed summary | Cancel pending/accepted; terminal cards; no end action or truthful summary | Preserve current cancellation. Add stale-response/single-flight protection equivalent to mobile **A/B**. Wire session end and a backend-derived completion view **B**. Ratings, receipts, stops, recordings, refunds and payment totals beyond the stored estimate are **C**. |
| Error/reconnect | API online/reconnecting state, 401 reset, single-flight polling, stale-state guards, retry | Global error/retry, 401 expiry, focus/visibility refresh; polling can overlap and lacks per-booking stale-state protection | Add single-flight active refresh, monotonic state application, last-success time, visible reconnect banner, retry, and non-destructive stale data retention **A**. Never downgrade live/completed/cancelled from a late response. |
| Brand/layout/navigation | Seven-stage mobile progress flow and light mobile theme | Responsive dark dashboard/PWA with LivelyWalk image assets, cyan/violet/navy palette, account header, request/history columns | Preserve the deployed web identity and responsive shell. Add a clear `Plan → Match → Ready → Live → Complete` booking rail inside active-booking detail **A**. Do not copy mobile Previous/Next controls or mocked content into the web dashboard. |

## Phased implementation order

### Phase 1 — truthful active booking and live-state foundation

**User-facing scope**

- Keep the existing request form and history.
- Add an active-booking detail panel that automatically resumes the newest pending, accepted, or live request and lets the user select another history item.
- Present exact lifecycle state from both request and session data.
- Show guide identity, schedule, quote, route endpoints, last sync, latest guide/system messages, and live GPS freshness when available.
- Retain working cancellation. Do not add video, microphone, captions, ratings, receipt, or route-change controls.

**Implementation**

- Extend web types/API for request detail including session, session status/messages, location, and terminal states.
- Add a pure lifecycle reducer/presentation model with monotonic state guards.
- Poll only the active booking/session while the page is visible, single-flight; refresh on focus and manual retry.
- Keep the full-list poll coarse for history and retain last good data during reconnects.

**Acceptance criteria**

1. Logging in with an active request opens the correct booking without creating a new one.
2. Pending → accepted/session-ready → live → completed transitions appear without a page reload.
3. `accepted` never displays as live; live UI appears only when request and session state support it.
4. Cancellation remains available only for pending/accepted, is confirmed once, and cannot be undone by a stale poll.
5. Guide messages and GPS data appear with a timestamp/freshness state; missing data has an honest waiting state.
6. Network failure keeps the last valid booking visible, marks it stale/reconnecting, and recovers automatically.
7. 401 clears the browser session and returns to sign-in.
8. Desktop and 320 px mobile layouts remain usable; existing auth/request/history behavior and tests stay green.

### Phase 2 — request/review and working session actions

**User-facing scope**

- Add a review step with selected endpoints, endpoint map, schedule, interests, and the exact current server quote.
- Add a session message composer, server-backed quick instructions, and confirmed end-walk action once live.
- Add a backend-derived completion panel with actual guide, duration timestamps where available, route, and stored estimate.

**Acceptance criteria**

1. Editing any quoted field invalidates the quote and blocks submission until requoted.
2. The map never implies a routed street path unless routing data exists.
3. Messages and quick instructions appear only after server acknowledgement and are visible to the Guide client.
4. End walk requires confirmation, succeeds once, moves both request/session to terminal state, and survives refresh.
5. No mock totals, stops, ratings, captions, receipts, or recordings appear as real data.

### Phase 3 — browser media subscriber, separately gated

The backend has a LiveKit token endpoint and Guide `main` has a publisher, but Traveler web has no media client/config today. Treat this as a separate gated release.

**Entry gate**

- Confirm the production LiveKit WebSocket URL and token endpoint work for an authenticated traveler in a live session.
- Prove browser video/audio subscription, reconnect, track-ended behavior, and cleanup on booking/session changes.

**User-facing scope after the gate passes**

- Guide video viewer, guide audio mute/unmute, connection quality, retry, and a clear fallback to GPS/messages.
- No traveler microphone/push-to-talk control; the current traveler grant is subscribe-only.

**Acceptance criteria**

1. A live Guide camera/audio stream renders in supported desktop and mobile browsers.
2. Leaving, ending, signing out, or switching bookings disconnects the room and releases media resources.
3. Media failure never blocks status, GPS, messages, cancellation, or end-state access.

### Phase 4 — backend/media product expansion

Requires new capability before UI:

- Traveler voice publishing/push-to-talk permissions.
- Structured stop/route-change commands with guide acknowledgement.
- Live captions and translation stream/state.
- Ratings/reviews submission, receipts/payments/refunds, recording access, saved/favorite guides, notifications, and profile/preferences management.
- Real route geometry, rerouting, stop counts, and final distance if these are to be shown as authoritative.

Each item gets its API contract and end-to-end test before a visible control is added.

## Release and regression controls

- Change only `web/` and its tests during parity implementation unless a separately approved API/media phase requires another repository.
- Preserve current LivelyWalk assets and deployed navy/cyan/violet palette; extend existing CSS variables instead of replacing the visual system.
- Preserve the current API base URL, Mapbox build-time secret handling, auth storage/logout behavior, PWA manifest/service-worker strategy, and `rendezvous-traveler` production URL.
- Add reducer/API/component tests for every lifecycle transition, stale response, cancellation race, reconnect, terminal state, and session action.
- Before publishing: run web typecheck/tests/build, mobile typecheck/tests, fetch-verify the generated asset set, then publish the complete static artifact.
- Current hosted v4 is the rollback point. Publish only after Phase 1 acceptance criteria pass; a failed deploy must leave v4 live.

## Recommended first implementation batch

Implement **Phase 1 only** next: active-booking detail/resume, request+session polling, exact lifecycle presentation, guide message/GPS readout, cancellation race protection, and reconnect/stale-state handling. This is the highest-value parity slice because it turns the web app from a request list into a trustworthy companion for an actual booking while staying entirely inside current production behavior and avoiding media promises.
