# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal trainer management app with bank payments, discount coupons, and automatic reminders. Built for a single trainer to manage students, classes, payments, and bookings.

## Tech Stack

- **Framework**: Next.js 14 (App Router) with TypeScript
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Styling**: Tailwind CSS
- **Forms**: react-hook-form with Zod validation
- **Email**: Resend
- **SMS/WhatsApp**: Twilio
- **File Upload**: react-dropzone + Supabase Storage

## Commands

```bash
npm run dev        # Development server (port 3000)
npm run dev:3001   # Development on alternate port
npm run build      # Production build
npm run lint       # ESLint
```

## Architecture

### Route Groups

- `/(auth)` - Login page (public, redirects if authenticated)
- `/(dashboard)` - Protected trainer dashboard (requires auth)
- `/public` - Public pages for students (booking, payment upload)
- `/api` - API routes including cron jobs

### Key Patterns

**Server Actions** (`app/actions/`): All database mutations use Next.js Server Actions with `'use server'` directive. Each action file exports typed CRUD operations that call Supabase and handle `revalidatePath`/`redirect`.

**Supabase Clients** (`app/lib/supabase/`):
- `server.ts` exports `createClient()` (uses cookies, for authenticated routes) and `createServiceClient()` (uses service role key, for cron/API routes)
- `client.ts` exports browser client for client components

**Component Pattern**: Form components are client-side (`'use client'`) and call server actions directly. They receive optional entity prop for edit mode vs create mode.

**Middleware**: Protects `/dashboard/*` routes, redirects unauthenticated users to `/login`, and redirects authenticated users away from `/login`.

### Database Schema

Main tables in `supabase/schema.sql`:
- `students` - Student records
- `class_plans` - Pricing plans with CBU/IBAN
- `classes` - Scheduled classes with capacity
- `bookings` - Student class reservations
- `coupons` + `coupon_plans` - Discount system (percentage/fixed)
- `payment_proofs` - Payment verification (pending/approved/rejected)
- `notifications_log` - Reminder tracking

All tables use RLS. Authenticated users (trainer) have full access; public can view active plans/classes and submit bookings/payments.

### Notifications System

Cron endpoint at `/api/cron/send-reminders` (protected by `CRON_SECRET`):
- Sends 24h and 2h reminders via email, SMS, and WhatsApp
- Queries bookings by `scheduled_at` window and `reminder_*_sent` flags
- Uses service client to bypass RLS

## Environment Setup

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
EMAIL_FROM=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
NEXT_PUBLIC_APP_URL=
CRON_SECRET=
```

See `ENV_SETUP.md` for detailed Supabase configuration including Storage bucket policies.
