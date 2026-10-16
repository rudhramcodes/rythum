# Phase 1: booking API and notification foundation

Implemented: Express 5 in plain JavaScript, MongoDB persistence, request validation, origin checks, rate limits, idempotent submissions, and an independent SMTP worker. The existing booking form now submits to the API and displays its saved reference. No email app is opened by submission.

**This is the first Phase 1 milestone, not the completed operations system.** Admin authentication/MFA/inbox, customer sessions/portal, conversations, attachments, events/calendar, document management and operational settings are still pending. There are deliberately no public inquiry-list or inquiry-detail endpoints. A reference is not an access credential. Do not launch this as the complete booking system before staff have a secure way to handle saved inquiries.

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

Only reference/acknowledgement text is emailed; customer event details are stored in MongoDB. Team alerts also contain a reference only. Replies currently go to the configured Reply-To mailbox; they are **not imported** into a website conversation. Customer acknowledgements do not verify ownership of the submitted email address. No website return-access link is sent until the portal's authentication flow exists.

Failed/uncertain jobs currently remain inspectable in the database by authorized operators. Admin display/manual retry is pending; do not reset uncertain jobs until delivery is checked with the provider. No private API or shared admin password has been added as a workaround.

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
