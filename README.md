# CoachPro — Coach Dashboard (Next.js)

The web dashboard for coaches. Built with Next.js 14 (App Router), React Query, Zustand, and Tailwind CSS.

---

## Tech Stack

| Layer         | Technology                          |
| ------------- | ----------------------------------- |
| Framework     | Next.js 14 (App Router)             |
| Styling       | Tailwind CSS                        |
| State         | Zustand (auth, theme, UI)           |
| Data fetching | TanStack React Query v5             |
| HTTP client   | Axios with auto-refresh interceptor |
| Forms         | React Hook Form + Zod               |
| Payments      | Stripe.js (embedded checkout)       |
| Charts        | Recharts                            |
| Errors        | Sentry                              |
| Tests         | Vitest + Playwright (E2E)           |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_API_URL and Stripe publishable key

# 3. Start development server (port 3000)
npm run dev
```

The dashboard runs at `http://localhost:3000`.  
It expects the PHP backend at `http://localhost:8000` (set via `NEXT_PUBLIC_API_URL`).

---

## Environment Variables

| Variable                                    | Description                                            |
| ------------------------------------------- | ------------------------------------------------------ |
| `NEXT_PUBLIC_API_URL`                       | Backend API base URL (e.g. `http://localhost:8000/v1`) |
| `NEXT_PUBLIC_APP_NAME`                      | App display name                                       |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`        | Stripe publishable key (`pk_test_...`)                 |
| `NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY`      | Stripe Price ID — Pro monthly                          |
| `NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL`       | Stripe Price ID — Pro annual                           |
| `NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_MONTHLY` | Stripe Price ID — Business monthly                     |
| `NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_ANNUAL`  | Stripe Price ID — Business annual                      |
| `NEXT_PUBLIC_SENTRY_DSN`                    | Sentry DSN (optional, leave blank to disable)          |

---

## Project Structure

```
frontend/
├── src/
│   ├── app/                       # Next.js App Router pages
│   │   ├── auth/login/            # Login page
│   │   ├── dashboard/             # Main dashboard
│   │   ├── clients/               # Client management
│   │   ├── workout-plans/         # Workout plan builder
│   │   ├── nutrition-plans/       # Nutrition plan manager
│   │   ├── checkins/              # Check-in scheduling
│   │   ├── messages/              # Coach–client messaging
│   │   ├── coaching-sessions/     # 1:1 session management
│   │   ├── live-training/         # Live group training sessions
│   │   ├── analytics/             # Client analytics & reports
│   │   ├── media/                 # Media library
│   │   ├── notifications/         # Notification center
│   │   ├── billing/               # Subscription & invoices
│   │   ├── settings/              # Profile, integrations, notifications
│   │   └── providers.tsx          # QueryClient + Redux + theme providers
│   ├── components/                # Shared UI components
│   ├── hooks/                     # React Query data hooks (per domain)
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts          # Axios instance (auth interceptors, 401 refresh)
│   │   │   ├── index.ts           # Barrel export
│   │   │   └── services/          # Domain API functions (clients, workouts, etc.)
│   │   ├── env.ts                 # Resolves NEXT_PUBLIC_API_URL
│   │   ├── validateUrl.ts         # Safe redirect helper (SSRF prevention)
│   │   └── useSocketChat.ts       # Polling-based real-time chat
│   ├── middleware.ts               # Edge middleware: JWT cookie guard → /auth/login
│   ├── store/
│   │   ├── auth.ts                # Zustand: coach session + token refresh
│   │   ├── subscription.ts        # Zustand: subscription state
│   │   ├── theme.ts               # Zustand: dark / light mode
│   │   └── ui.ts                  # Redux: UI side-effects
│   └── types/                     # TypeScript type definitions
├── e2e/                           # Playwright end-to-end tests
├── .env.local.example
├── next.config.js
├── tailwind.config.ts
└── vitest.config.ts
```

---

## Auth Flow

1. Coach logs in at `/auth/login` → backend sets `access_token` + `refresh_token` httpOnly cookies and returns tokens in response body.
2. Axios request interceptor attaches `Authorization: Bearer <token>` from Zustand store on every request.
3. On 401, the interceptor calls `POST /auth/refresh` (cookie-based), updates Zustand state, and retries the original request.
4. Edge middleware (`middleware.ts`) validates JWT expiry on every navigation — expired/missing cookies redirect to `/auth/login`.

---

## Running Tests

```bash
# Unit & integration tests
npm run test

# E2E tests (requires dev server running)
npm run test:e2e
```

---

## Building for Production

```bash
npm run build
npm run start
```

Deploy to Vercel — set the environment variables in the Vercel project settings.
