# Phase 1: booking API and notification foundation

Implemented: Express 5 in plain JavaScript, MongoDB persistence, request validation, origin checks, rate limits, idempotent submissions, and an independent SMTP worker. The existing booking form now submits to the API and displays its saved reference. No email app is opened by submission.

**Phase 1 is in progress.** A private `/admin` workspace now supports password sign-in, logout, concurrent sessions, password changes, signing out other devices, and a searchable/filterable read-only inquiry inbox. Google sign-in is implemented but requires OAuth credentials. MFA, status editing/notes, customer portal/conversations, files, calendar and document management remain pending. Inquiry list/detail APIs require the approved admin session; references alone grant no access.

## Admin setup and manual checks

Local owner: `notyourshastri@gmail.com`. The initial account has been created in the local development database. Its password is not stored in source or an environment file; Better Auth stores a hash in MongoDB. Sessions use HttpOnly, SameSite=Lax cookies, secure in production, with a 12-hour lifetime that renews while active. Multiple devices can stay signed in. Public signup and account/email changes are not exposed.

1. Restart the backend after `.env` changes, then open `http://localhost:5173/admin`.
2. Sign in with the approved email and the password supplied separately.
3. Search/filter the inbox and open a saved inquiry. Verify its brief/contact/date details.
4. In Security, change the password or sign out other devices. Changing the password signs out other sessions.
5. Sign out, then refresh `/admin`; private inquiry data should no longer be accessible.

Only code/API tests were run. No browser, real Google sign-in, booking submission or live-email checks were performed for this milestone.

For a fresh database, generate a long random `AUTH_SECRET`, configure `ADMIN_EMAIL` and `AUTH_BASE_URL`, then run `npm run admin:create` with `ADMIN_BOOTSTRAP_PASSWORD` supplied securely in the process environment. Do not commit passwords, pass them in shell command arguments/history, or leave the bootstrap variable in `.env`. The command refuses to overwrite an existing account. An existing admin can change their password in the Security screen.

Google setup:
- Create a Web application OAuth client in Google Cloud and configure its consent screen/test users as appropriate.
- Add the exact redirect URI `http://localhost:4000/api/auth/callback/google` for development.
- Add `https://api.rythumshastri.com/api/auth/callback/google` when the production API is deployed.
- Put `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` only in backend secrets; restart the API. The Google button appears once configured.
- `AUTH_BASE_URL` is the backend origin (`http://localhost:4000` locally, `https://api.rythumshastri.com` in production). Google sign-in uses the pre-created owner account; other Google accounts cannot access the inbox.
- Keep frontend/backend on the same site in production (`www.rythumshastri.com` and `api.rythumshastri.com`). Unrelated Vercel/Render default domains can be affected by browser third-party-cookie restrictions; use a same-site staging domain or same-origin proxy.

Implementation reference: [Better Auth Express integration](https://better-auth.com/docs/integrations/express), [standalone MongoDB adapter](https://better-auth.com/docs/adapters/mongo), [Google configuration](https://better-auth.com/docs/authentication/google).

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
