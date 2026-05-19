# BizYip (PitchRival) — Claude Code Project Bible

## What This App Is
Competitive social platform for founders/builders. Daily battles, weekly duels, live 1v1 matches, ELO ranking, cofounder matching, ideas feed.

## Stack
- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase (auth + database)
- Vercel deployment

## Critical Rules — Never Break These
- ALWAYS use `username` — NEVER use `display_name`
- `profiles.elo` is the ONLY ELO source — never read ELO from anywhere else
- Auth methods: Google OAuth + email/password only
- Admin UUID: a4dc1d84-fc05-4018-b3ce-7c60f3a4244c
- `onboarding_complete` controls dashboard access
- Starting ELO = 500 (Builder rank)
- Trainee rank is a punishment tier, NOT the starting tier

## Database — Main Tables
- profiles
- daily_battle
- daily_submissions
- weekly_duel
- duel_submissions
- matches
- match_submissions
- ideas
- idea_comments
- elo_history
- cofounder_requests

## Auth Architecture
- Supabase Google OAuth + email/password
- UserContext in contexts/UserContext.tsx
- UserProvider in root app/layout.tsx
- Server-side auth in app/(app)/layout.tsx
- Middleware handles route protection

## Current Known Issues
- Auth state unreliable client-side after Google OAuth redirects
- Navbar randomly shows logged-out state
- Username randomly missing on render
- Fix: use server-side rendering for auth in layout.tsx, pass user/profile as props to TopNav

## App Structure
- Public routes: login, signup, forgot-password, reset-password, auth/callback, leaderboard, profile/[username]
- Protected routes: app/(app)/ — dashboard, compete, connect, create, profile, settings, admin
- API routes: app/api/

## Coding Rules
- Production-grade code only — no temporary patches or hacky fixes
- Always find root cause before fixing
- Use correct Next.js App Router patterns
- Use correct Supabase SSR patterns with createClient from @/utils/supabase/server for server components
- Keep business logic simple and maintainable
- Multiple AIs have touched this codebase — always check for conflicting patterns before editing
