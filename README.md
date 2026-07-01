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
│   │   ├── clients/[id]/          # Client detail (workouts, nutrition, analytics, messages, body, plan)
│   │   ├── clients/               # Client list & management
│   │   ├── workout-plans/         # Workout plan builder + assignment
│   │   ├── import-excel/          # Bulk XLSX/CSV workout import
│   │   ├── nutrition-plans/       # Nutrition plan manager
│   │   ├── checkins/              # Check-in scheduling
│   │   ├── messages/              # Coach–client messaging
│   │   ├── coaching-sessions/     # 1-on-1 video session management
│   │   ├── live-training/         # Live group training sessions
│   │   ├── analytics/             # Platform-wide analytics & reports
│   │   ├── media/                 # Media library
│   │   ├── notifications/         # Notification centre
│   │   ├── billing/               # Subscription, invoices & payment methods
│   │   ├── subscription/          # Subscription onboarding flow
│   │   ├── settings/              # Profile, integrations, notification prefs
│   │   ├── api/                   # Next.js route handlers (server-side helpers)
│   │   └── providers.tsx          # QueryClient + theme providers
│   ├── components/
│   │   ├── auth/                  # Login form, protected-route guard
│   │   ├── billing/               # Plan cards, payment method UI
│   │   ├── charts/                # Recharts wrappers (progress, analytics)
│   │   ├── clients/               # Client list, edit modal, block/delete dialogs
│   │   ├── coaching/              # Coaching session cards, LiveKit video call
│   │   ├── dashboard/             # Stats overview, upcoming events widget
│   │   ├── layout/                # Sidebar, topbar, mobile nav
│   │   ├── messages/              # Chat thread, message bubble, media upload
│   │   ├── notifications/         # Notification bell, dropdown, list
│   │   ├── subscription/          # Trial reminder banner, upgrade prompt
│   │   ├── ui/                    # Headless primitives (Button, Modal, Badge…)
│   │   ├── weather/               # Weather card widget
│   │   ├── workout-plans/         # Plan builder, exercise drag-and-drop
│   │   └── Background/            # Animated page background
│   ├── hooks/                     # TanStack Query data hooks (one file per domain)
│   │   ├── useClients.ts          # CRUD + block/unblock/photo/analytics/measurements
│   │   ├── useWorkoutPlans.ts     # Plan CRUD, import, assignment
│   │   ├── useWorkoutAnalysis.ts  # AI analysis generation + approve/reject/assign
│   │   ├── useNutritionPlans.ts   # Nutrition plan CRUD + assignment
│   │   ├── useCheckins.ts         # Check-in scheduling
│   │   ├── useMessages.ts         # Message threads + polling
│   │   ├── useCoachingSessions.ts # 1-on-1 session CRUD + LiveKit tokens
│   │   ├── useLiveTraining.ts     # Live training sessions
│   │   ├── useAnalytics.ts        # Coach + client analytics
│   │   ├── useInvoices.ts         # Invoice listing + download
│   │   ├── useSubscription.ts     # Subscription status + checkout
│   │   ├── useSettings.ts         # Profile, notification, integration settings
│   │   ├── useNotifications.ts    # In-app notifications
│   │   ├── useMedia.ts            # Media upload/listing
│   │   ├── useTrialReminder.ts    # 14-day free trial countdown banner
│   │   ├── useNearbyGyms.ts       # Geolocation gym search
│   │   ├── useWeather.ts          # OpenWeather widget
│   │   └── useToastMutation.ts    # Generic toast-on-mutation helper
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts          # Axios instance — auth interceptors, 401 auto-refresh
│   │   │   ├── index.ts           # Barrel export
│   │   │   └── services/          # Domain API functions (one file per domain)
│   │   ├── env.ts                 # Resolves NEXT_PUBLIC_API_URL
│   │   ├── validateUrl.ts         # Safe redirect helper (SSRF prevention)
│   │   └── useSocketChat.ts       # Polling-based real-time chat hook
│   ├── middleware.ts               # Edge: JWT cookie guard → redirects to /auth/login
│   ├── store/
│   │   ├── auth.ts                # Zustand: coach session, token refresh, logout callbacks
│   │   ├── subscription.ts        # Zustand: subscription tier + status
│   │   ├── theme.ts               # Zustand: dark / light mode
│   │   └── ui.ts                  # Zustand: UI side-effects
│   └── types/                     # TypeScript type definitions
├── e2e/                           # Playwright end-to-end tests
├── .env.local.example
├── next.config.js
├── tailwind.config.ts
└── vitest.config.ts
```

---

## Auth Flow

1. Coach logs in at `/auth/login` → backend sets `access_token` + `refresh_token` httpOnly cookies and returns tokens in the response body.
2. Axios request interceptor attaches `Authorization: Bearer <token>` from Zustand store on every request.
3. On 401, the interceptor calls `POST /auth/refresh` (cookie-based), updates the Zustand store, and retries the original request.
4. Edge middleware (`middleware.ts`) validates JWT expiry on every navigation — expired or missing cookies redirect to `/auth/login`.
5. `auth.ts` exposes `onLogout(callback)` so other modules can register cleanup functions. Each callback is wrapped in try-catch so one failing callback never blocks the others from running.

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
