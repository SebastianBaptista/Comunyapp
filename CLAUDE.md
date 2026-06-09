# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Express proxy + Vite middleware) at http://localhost:3000
npm run build    # Build frontend (vite) + bundle server (esbuild → dist/server.cjs)
npm run start    # Run production build
npm run lint     # TypeScript type check (no emit)
```

No test suite exists. Type check with `npm run lint` to validate.

The **Python FastAPI backend** (separate repo `Comunyapp Backend/backend`) must also be running at `http://localhost:8000` for the app to work:
```bash
# from Comunyapp Backend/backend
uvicorn main:app --reload --port 8000
```

## Environment Variables

### Frontend (`.env` — copy from `.env.example`)
- `VITE_API_URL` — URL of the Python backend exposed to the browser (e.g. `http://localhost:8000` for local dev, Railway URL for prod). When absent, `API_BASE` defaults to `""` and requests are proxied through the Express server.
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — used by the legacy Express routes (mostly unused now)
- `GEMINI_API_KEY` — Google Gemini AI key
- `APP_URL` — hosting URL (injected automatically in production)

### Python backend (its own `.env`)
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — Supabase credentials for all FastAPI routes

## Architecture

This repo is the **frontend SPA + a thin Node.js reverse proxy**. The actual API logic lives in the separate Python FastAPI backend repo.

### Dev server (`server.ts`)
`server.ts` runs Express with Vite attached as middleware (HMR included). All `/api/*` requests are reverse-proxied server-side to the Python backend at `PYTHON_BACKEND_URL` (defaults to `http://localhost:8000`). The old Express `routes/` folder is **legacy and unused** — do not add routes there.

### Production
- **Self-hosted**: Express serves the `dist/` static build and proxies `/api/*` to the Python backend.
- **Vercel**: `vercel.json` routes `/api/*` to `api/index.ts` (re-exports the Express app) and everything else to `index.html`.

### Python backend (separate repo)
FastAPI app with all active API logic:
- `/api/auth` — register, login, avatar upload, profile update, `/api/auth/me`
- `/api/posts/` — cursor-paginated feed, reactions, comments, tags, pin/edit/delete
- `/api/courses/` — course list + detail + chapter management
- `/api/tags/` — tag list and creation
- `/api/invitations/` — invite link generation and redemption
- `/api/payments/` — payment registration, receipt upload, approve/reject, subscription status

Uses a single Supabase client with the **service role key** (admin privileges). Auth is validated server-side by calling `supabase.auth.get_user(token)` on each protected request.

### Frontend (`src/`)

React 19 SPA with `react-router-dom`, feature-based folder structure:

```
src/
  context/AuthContext.tsx        — global auth state (user, token, updateUser, login, logout)
  lib/
    api.ts                       — apiFetch(), useApiFetch() hook, API_BASE constant
    permissions.ts               — isAdmin(), needsActiveSubscription(), hasActiveSubscription()
  routes/index.tsx               — authRoutes + appRoutes arrays (react-router-dom Route definitions)
  features/
    auth/
      Login.tsx                  — login form
      Register.tsx               — 3-step payment-registration wizard (plan → payment → receipt upload)
      InviteRegister.tsx         — register via invitation link (auto-login after register)
      AccountStatus.tsx          — subscription gating screen for inactive/pending/expired accounts
    landing/                     — pre-auth landing page
    muro/                        — social feed (PostFeed, PostCard, CommentSection, CreatePost)
    classroom/                   — courses list + detail (CourseCard, CourseDetail, CreateCourseSheet)
    profile/                     — user profile page with sub-components
    admin/                       — admin dashboard (InvitationsPanel, PaymentsPanel, tabs)
  shared/layout/Layout.tsx       — nav shell (sidebar desktop + bottom nav mobile)
  types.ts                       — shared TypeScript interfaces
```

### Auth & routing flow

`App.tsx` contains three render branches:

1. **Not authenticated** (`!isAuthenticated`) → renders auth routes (landing / login / register / invite)
2. **Authenticated but subscription not active** (`needsActiveSubscription(role) && !hasActiveSubscription(subscription_status)`) → renders `<AccountStatus />` (gating screen)
3. **Authenticated + active** → renders `<Layout>` with app routes (muro, classroom, profile, admin)

JWT token stored in `localStorage` under `edu_token`, user object under `edu_user`. Both are read synchronously at mount via `useState` lazy initializers in `AuthProvider`.

`isAuthenticated` is derived from `!!user` (not from token). Always ensure `login(user, token)` is called together — never call `updateUser()` as a substitute for `login()`.

### Subscription & payments

Users have a `subscription_status` field on their `profiles` row: `inactive | active | expired`.

A Postgres trigger (`sync_subscription_status`) on the `payments` table automatically recalculates and writes `profiles.subscription_status` whenever a payment row is inserted or updated.

Payment statuses: `pending` (awaiting admin review) → `success` (approved, sets `expires_at`) or `failed` (rejected).

Roles that require an active subscription: `miembro`. Roles exempt from gating: `admin`, `superadmin`.

### Profile page

Profile data (level, stats, achievements, ranking, activity) lives in `src/features/profile/data/profileMock.ts` as static mock data — **not yet connected to Supabase**. Only name, avatar, and bio come from the real user object via `AuthContext`.

### Data patterns

- `API_BASE` is `import.meta.env.VITE_API_URL ?? ""`. When set, the browser calls the Python backend directly (cross-origin). When empty, requests go through the Express proxy (same-origin).
- **Always use trailing slashes** on collection endpoints: `/api/posts/`, `/api/tags/`, `/api/courses/`, `/api/payments/`, `/api/invitations/`. The FastAPI routes are defined with a trailing slash — omitting it causes a 307 redirect, and the browser strips the `Authorization` header on cross-origin redirects.
- Use `useApiFetch()` hook (not bare `apiFetch`) for authenticated requests — it injects the token automatically.
- Posts use cursor-based pagination (cursor = `created_at` of last item).
- `posts_view` is a Supabase SQL view that joins posts with profiles — query it directly instead of joining in code.
- Supabase auth uses the **admin API** server-side so email confirmation is bypassed on register.
