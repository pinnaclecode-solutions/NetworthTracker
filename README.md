# NetWorth Tracker

A warm, friendly personal finance web app for tracking your net worth over time. Built with Next.js, Prisma, Supabase, and NextAuth.

## Features

- 🔐 Google OAuth sign-in (no passwords)
- 📊 Net worth dashboard with charts
- 📸 Immutable financial snapshots
- 🗂 Custom asset & liability categories
- 📈 Historical net worth tracking
- 📥 CSV data export
- 📱 Responsive design

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | Next.js 14 (App Router) |
| Backend | Next.js API Routes |
| ORM | Prisma |
| Database | PostgreSQL (Supabase) |
| Auth | NextAuth.js (Google OAuth) |
| Charts | Recharts |
| Styling | Tailwind CSS |
| Deployment | Vercel |

## Local Development

### Prerequisites

- Docker & Docker Compose
- Google OAuth credentials (see below)

### 1. Clone and configure

```bash
git clone <repo-url>
cd networth-tracker
cp .env.example .env
```

Edit `.env` and fill in:

```env
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
```

### 2. Set up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy the Client ID and Secret into your `.env`

### 3. Start the app

```bash
docker compose up
```

This will:
- Start a PostgreSQL database
- Push the Prisma schema to the database
- Start the Next.js dev server with hot reloading

Open [http://localhost:3000](http://localhost:3000)

## Production Deployment (Vercel + Supabase)

### 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings → Database** and copy the connection string
3. Set it as `DATABASE_URL` in your environment variables

### 2. Run migrations

```bash
DATABASE_URL=<your-supabase-url> npx prisma db push
```

### 3. Deploy to Vercel

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.example`
4. Update `NEXTAUTH_URL` to your Vercel deployment URL
5. Add `https://your-app.vercel.app/api/auth/callback/google` to Google OAuth

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Secret for session signing (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Your app URL (e.g. `http://localhost:3000`) |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |

## Database Commands

```bash
# Push schema changes (no migration history)
npm run db:push

# Create a new migration
npm run db:migrate

# Open Prisma Studio
npm run db:studio
```
