# HomeServe — Customer Web App (Next.js)

A responsive, light-themed customer-facing frontend for the Home Service Marketplace, built to consume the NestJS backend in this same delivery.

## Stack
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4 (custom brand theme — blue/orange, light surface)
- Zustand for auth + booking-draft state (persisted to localStorage)
- Axios with auth-token interceptor and 401 auto-logout
- lucide-react icons, react-hot-toast notifications, date-fns

## Pages implemented (Customer App MVP)
- **Auth**: phone + OTP login (`/login`)
- **Home**: hero search, trust strip, category grid, popular services, emergency CTA (`/`)
- **Services**: category-filterable listing with sort (`/services`), detail page with worker selection (`/services/[id]`)
- **Search**: live filtering across all services (`/search`)
- **Booking flow**: date/time picker, saved-address selector with "add new address" modal, notes, coupon code, payment method, price summary, sticky confirm bar (`/checkout/[serviceId]`)
- **Bookings**: tabbed list (Upcoming / Completed / Cancelled) (`/bookings`), detail page with status timeline, worker contact, cancel flow, post-completion rating modal (`/bookings/[id]`)
- **Profile**: editable name, saved addresses (add/delete), wallet balance, settings menu, logout (`/profile`)
- **Notifications**: read/unread list (`/notifications`)
- **Support**: ticket creation + my tickets + FAQ accordion (`/support`)

## Setup

```bash
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL to your backend, e.g. http://localhost:3001/api
npm run dev
```

Visit `http://localhost:3000`.

## Connecting to the backend

The app expects the NestJS API conventions already in your backend:
- Responses wrapped as `{ data: ... }` (the API client unwraps both `res.data.data` and `res.data` as a fallback)
- JWT bearer auth via `Authorization` header, token stored in `localStorage`
- Auth endpoints: `POST /auth/send-otp`, `POST /auth/verify-otp`, `GET /auth/me`
- All other endpoints follow the controllers already present in `src/modules/*`

If your backend uses a different response shape or route prefix, update `lib/api.ts` (`BASE_URL` and the per-resource `*Api` objects) — it's the single source of truth for all network calls.

## Design notes
- Light theme throughout: white cards on a soft slate-50 surface, blue (`brand`) primary actions, orange (`accent`) for high-urgency CTAs (emergency service).
- Fully responsive: 2–4 column grids collapse to 2 columns on mobile, sticky bottom action bars on checkout/service-detail for thumb reach, horizontal-scroll category/date pickers on small screens.
- Built with Tailwind v4's CSS-first theme (`@theme` block in `app/globals.css`) — no `tailwind.config.ts` needed.
