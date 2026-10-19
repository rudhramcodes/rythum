# Phase 1: booking API and notification foundation

Implemented: Express 5 in plain JavaScript, MongoDB persistence, request validation, origin checks, rate limits, idempotent submissions, and an independent SMTP worker. The existing booking form now submits to the API and displays its saved reference. No email app is opened by submission.

**Phase 1 is in progress.** A private `/admin` workspace now supports password sign-in, logout, concurrent sessions, password changes, signing out other devices, and a searchable/filterable inquiry inbox. Google sign-in was removed by the owner. Status updates, private notes, follow-up dates and change history are implemented. Customer magic-link access and conversations are implemented. MFA, files, calendar and document management remain pending. Inquiry list/detail APIs require the approved admin session; references alone grant no access.

## Admin setup and manual checks

Local owner: `notyourshastri@gmail.com`. The initial account has been created in the local development database. Its password is not stored in source or an environment file; Better Auth stores a hash in MongoDB. Sessions use HttpOnly, SameSite=Lax cookies, secure in production, with a 12-hour lifetime that renews while active. Multiple devices can stay signed in. Public signup and account/email changes are not exposed.

1. Restart the backend after `.env` changes, then open `http://localhost:5173/admin`.
2. Sign in with the approved email and the password supplied separately.
3. Search/filter the inbox and open a saved inquiry. Verify its brief/contact/date details.
4. In Security, change the password or sign out other devices. Changing the password signs out other sessions.
5. Sign out, then refresh `/admin`; private inquiry data should no longer be accessible.

Only isolated code/API tests were run. No browser, real Google sign-in, booking submission or live-email checks were performed for this milestone.

For a fresh database, generate a long random `AUTH_SECRET`, configure `ADMIN_EMAIL` and `AUTH_BASE_URL`, then run `npm run admin:create` with `ADMIN_BOOTSTRAP_PASSWORD` supplied securely in the process environment. Do not commit passwords, pass them in shell command arguments/history, or leave the bootstrap variable in `.env`. The command refuses to overwrite an existing account. An existing admin can change their password in the Security screen.

Implementation reference: [Better Auth Express integration](https://better-auth.com/docs/integrations/express), [standalone MongoDB adapter](https://better-auth.com/docs/adapters/mongo).

Targeted code tests: `node --test test/admin.test.js` from `backend/`. They use a disposable MongoDB and synthetic users, never the real owner's password or existing inquiry data.

## Run locally

Node 22.13+ is required. Commands below run from `backend/`:

```sh
npm ci
cp .env.example .env
# Fill MONGODB_URI, MONGODB_DB and WEB_ORIGINS in .env locally.
npm run dev
```

Use your normal local MongoDB on port 27017, a standalone MongoDB on the VPS, or MongoDB Atlas. Replica sets and multi-document transactions are not required. Start your installed MongoDB service before the API; the example URI is `mongodb://127.0.0.1:27017`.

Use a separate database and restricted application user for development, staging and production. On deployment, set the production `MONGODB_URI` and `MONGODB_DB` through the host's secret store; no application code change is needed. Production still needs authentication, network restrictions and backups. Use a fresh production database rather than dropping an existing database as part of startup. Tests use an isolated temporary database, never a client database.

In another terminal run `npm run dev` from the repository root. Vite forwards `/api` to port 4000; the default allowed frontend origin is `http://localhost:5173`. If Vite uses another port, add its exact origin to `WEB_ORIGINS`.

Email is off by default. Inquiries and their notification intent still save together; the worker creates delivery jobs when enabled. To send, configure the dedicated SMTP credentials, verified From/Reply-To addresses and approved `TEAM_EMAILS`, then set `SMTP_ENABLED=true` and run separately:

```sh
npm run worker
```

Staff recipients are captured when the inquiry is created. Adding recipients later does not retroactively notify them. Pending customer notifications will send when the worker is enabled; inspect test/stale jobs before enabling real SMTP. No real messages are sent by the test suite.

## Vercel + VPS/Render

- Frontend stays in the existing Vercel project.
- API and worker run from this `backend/` directory on the VPS or Render. Run both as supervised processes with automatic restarts.
- Route `api.rythumshastri.com` to that host and terminate HTTPS there. No DNS changes have been made by this implementation.
- On Vercel set `VITE_API_URL=https://api.rythumshastri.com`, then rebuild/redeploy. This is a public API URL, never a secret. The frontend must not be deployed with this form change until the API is reachable.
- On the backend set `NODE_ENV=production`, a separate production MongoDB database, and `WEB_ORIGINS=https://www.rythumshastri.com,https://rythumshastri.com`. Add staging/preview origins explicitly only when needed; no wildcard preview access.
- For VPS/Nginx, bind the API to `127.0.0.1`, keep its port private and set `TRUST_PROXY=loopback` only if Nginx is the sole entry point. Render typically needs `HOST=0.0.0.0` and its assigned `PORT`; configure trusted proxy addresses for the actual host, not a blanket trust flag.
- SMTP uses port 465 (TLS) or 587 (required STARTTLS). Verify host outbound SMTP support and domain authentication before enabling it.
- Keep database/SMTP values in the host's secret store. `.env` files are gitignored; only examples are committed.
- Liveness/readiness: `GET /api/health` returns 200 only while MongoDB responds.

## API contract

`POST /api/inquiries`

Headers: `Content-Type: application/json`, an exact allowed `Origin`, and `Idempotency-Key` containing a client-generated UUID. Keep the same key and details on a retry. A changed body with the same key returns 409. The current form retains the key during retries while mounted; reloading starts a new attempt.

```json
{
  "name": "Your name",
  "email": "organizer@example.com",
  "phone": "",
  "eventType": "Concert / Festival",
  "city": "City, country",
  "date": "",
  "timezone": "Asia/Kolkata",
  "details": "Event brief",
  "website": ""
}
```

`date` is optional; if supplied it must be a real date today or later in the supplied IANA timezone. `website` is a honeypot and must stay empty. Unknown fields are rejected, including client-supplied status/assignment/source.

201 means saved; 200 means the same request was already saved. The response includes only `inquiry.reference`, `status`, `createdAt`, and `replayed`. The status begins as `New`, never `Confirmed`.

Errors: 400 invalid JSON/key, 403 origin denied, 409 conflicting retry key, 413 body too large, 415 unsupported content type, 422 invalid fields, 429 rate limit, 503 storage/unexpected failure. Failures preserve the form values; a lost response can be retried safely with the same key. The server does not claim success if it cannot confirm persistence.

Abuse controls: 10 attempts per IP per 15 minutes, 3 distinct submission attempts per email per UTC hour (retries reuse their slot, even after a failed write), body/field limits, and honeypot. The IP limiter is process-local: use a shared store before horizontal scaling. CORS/origin checks are browser protections, not proof a request is human. Monitor actual abuse before adding a challenge provider.

## Notification behavior

`inquiries`, `notificationJobs`, and `submissionLimits` are the only collections in this milestone. The inquiry and its initial notification recipients are saved in one atomic MongoDB document. The worker converts pending notification intent into uniquely keyed jobs, then clears the pending marker. If it crashes between those steps, the next pass resumes without resetting existing jobs or resending completed ones. Unique indexes protect concurrent submissions and duplicate jobs. Only the bounded initial recipient list lives on the inquiry; conversations and delivery history stay separate.

Worker states: `pending` → `sending` → `sent`, `failed`, or `uncertain`. `sent` means accepted by SMTP, not delivered to an inbox. Definite transient rejections retry with exponential backoff, up to five attempts. A dropped connection after DATA or an interrupted worker lease goes to `uncertain` for review rather than blindly resending. A stable Message-ID helps trace delivery but cannot guarantee exactly-once email delivery.

Email templates use the saved inquiry data. Replies currently go to the configured Reply-To mailbox; they are **not imported** into a website conversation. Customer acknowledgements do not verify ownership of the submitted email address. No website return-access link is sent until the portal's authentication flow exists.

Failed/uncertain jobs currently remain inspectable in the database by authorized operators. Admin job display/manual retry is pending; do not reset uncertain jobs until delivery is checked with the provider.

## Verify

```sh
cd backend
npm test
```

Tests start an isolated temporary standalone MongoDB server (first run downloads a MongoDB binary) and local HTTP listeners. They cover failed writes, durable notification recovery, simultaneous retry races, validation, rate limits, private endpoint absence, notification claim races and SMTP failure classification. SMTP transport is mocked; no client credentials are needed.

From repository root:

```sh
node --test src/components/booking/*.test.mjs
npx eslint backend/src backend/test src/sections/BookingContact.jsx src/components/booking/submitInquiry.js
npm run build
```

Still needed before integration/launch: MongoDB connection and restricted user, chosen VPS/Render access, SMTP sender and credentials, approved staff recipients, authentication provider/admin emails, storage provider, real delivery tests, backups/restore tests and remaining Phase 1 features. Provide invitations or enter credentials locally/in the host secret store; do not paste passwords into chat.

### Admin password recovery

The sign-in screen includes email recovery and a new-password form. Enable the existing SMTP configuration to send reset emails; no notification worker is needed for these messages. Reset links use the first `WEB_ORIGINS` entry, so put the canonical frontend origin first in production. Links expire after 15 minutes, work once, and revoke all sessions after a successful reset. The token is carried in the URL fragment and removed when the form opens. Passwords require at least 12 characters. Unknown addresses receive the same confirmation response.

Manual checks: open `/admin`, check email/password keyboard and autofill on mobile, toggle password visibility, use Forgot password, follow the email link, and sign in with the new password. Confirm a used link cannot reset again. SMTP delivery and browser appearance are not covered by the isolated code tests.

### Inquiry management

Open an inquiry to change status, add an internal note or schedule/clear a follow-up date. Closed requires a reason. Save writes the changes and private history atomically in standalone MongoDB; conflicting edits from another session return 409 and the UI offers reload while preserving the draft note. These changes do not send customer emails or schedule automatic reminders yet. Follow-up dates are calendar dates; old saved dates can remain overdue. Shared-account history identifies the account, not individual team members.

`POST /api/admin/inquiries/:reference` requires an admin session, exact allowed Origin and JSON `{revision,status,followUp,closureReason,note}`. Unknown fields are rejected. Legacy inquiries start at revision zero. History is admin-only and excluded from inbox lists/public receipts. The atomic embedded history has a 1000-entry limit; migrate storage before that volume.

Manual checks: save a status/note/date and reload; close with/without a reason; clear the date; edit the same inquiry in two tabs and verify the second save reports conflict. No browser or live email checks were run.

### Customer portal and conversations

`/portal` uses email magic links, without Google or customer passwords. Booking acknowledgements include a fresh link; the footer and booking confirmation link to the portal. Return visitors enter the original inquiry email. Valid addresses receive the same HTTP response whether or not an inquiry exists. The worker sends access mail only when an inquiry exists, with at most three queued requests per address/hour and an additional per-IP limit.

Start both API and `npm run worker` in `backend/`, with SMTP enabled. Put the canonical frontend origin first in `WEB_ORIGINS`; all email links use it. Tokens are random 256-bit values, stored only as SHA-256 hashes, expire in 15 minutes and are consumed atomically. A fragment carries the token; the page removes it and asks for an explicit confirmation to avoid link-scanner consumption. Sessions are separate from admin, HttpOnly/SameSite=Lax, Secure in production, expire after 24 hours and are revoked on logout. HTTPS frontend/API must share the production site as documented above. If a verification request loses its response, request a fresh link.

Customers see only inquiries matching their verified email and their conversations. Projections exclude private notes, history, follow-up dates, closure reasons, hashes and notification internals. Ownership is checked for every message read/write. Admin replies are explicitly labelled customer-visible, separately from internal notes. Messages have bounded lengths, pagination and idempotent retries. Each saved message includes durable notification intent; the existing worker creates deduplicated generic new-message emails without copying conversation text. Messages remain saved if SMTP fails. Configure `TEAM_EMAILS` for incoming-message notifications.

Customer endpoints: POST `/api/customer/request-link`, `/verify`, `/logout`; GET `/session`, `/inquiries`; GET/POST `/inquiries/:reference/messages`. Admin conversations use GET/POST `/api/admin/inquiries/:reference/messages`. Writes require exact permitted Origin and JSON. No endpoint accepts a reference alone as authentication.

Manual checks (owner only): submit your own test inquiry; open the acknowledgment link and click Open my inquiries; verify only your inquiries appear; exchange messages between portal/admin; refresh to see updates; sign out and request a new link; verify a reused/expired link fails. Browser/live SMTP verification has NOT been performed. Socket.IO now refreshes conversations/inquiry lists automatically. Unread badges, attachments and customer profile changes remain pending. Code tests: `node --test test/customer.test.js test/admin.test.js` (temporary database, mocked SMTP).

### Live chat (Socket.IO)

Portal has an inquiry sidebar, mobile inbox/chat navigation, collapsible event details, message bubbles, timestamps, date grouping, in-memory per-inquiry drafts, pinned composer and a new-message jump. Admin uses the same chat component. Desktop Enter sends / Shift+Enter adds a line; mobile Enter adds a line. A single check means saved/sent, never read. Connection status describes the socket, not whether staff are online.

Message writes continue through the validated, idempotent HTTP API; Socket.IO signals committed changes and the client fetches authorized data. This keeps one persistence/validation path. Saved messages catch up automatically on reconnect. Socket payloads contain only reference + change kind, never message bodies or private notes. Sessions are checked during connection and before each broadcast; revoked/expired sockets are disconnected. Customer sockets are placed only in their verified-email room. There is no client-controlled room-join API.

Restart API and Vite after installing dependencies (`npm install` in root and backend). The Vite `/api` proxy now enables WebSocket upgrades. Browser chat uses WebSocket transport so Origin is always present, including through the development proxy. Production reverse proxy must forward polling and WebSocket upgrades for `/api/customer/realtime/` to the API, including Upgrade/Connection headers and original Origin. `VITE_API_URL` remains the API origin, not a Socket.IO path. Login cookies remain scoped to `/api/customer`; the realtime endpoint sits inside that path. Use the configured frontend origin and credentials, not wildcard CORS. [Socket.IO configuration](https://socket.io/docs/v4/server-options/).

Run a single API process until a shared Socket.IO adapter is configured. SMTP worker still runs separately for emails; it is not required for chat delivery after login. No browser/live tests were run. Manual check: customer and admin in separate sessions; exchange messages, switch inquiries (draft stays), change status, scroll up while messages arrive, disconnect/reconnect networking, and check mobile keyboard/scroll behavior.
