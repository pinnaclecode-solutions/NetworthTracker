# Net Worth Tracker — Product Requirements Document

---

## 1. Overview

A warm, friendly personal finance web application that allows multiple users to track their net worth over time. Users manually enter asset and liability values at any point in time (ad hoc snapshots), building a historical picture of their financial health. The app is designed to feel approachable and motivating — not cold or intimidating like traditional banking software.

---

## 2. User Authentication & Accounts

- Authentication is handled exclusively via **Google OAuth** — no username/password or email registration.
- The login page shows a single **"Sign in with Google"** button.
- On first sign-in, a user account is automatically created using the user's Google name, email, and profile picture.
- Users must be able to **log out**.
- Each user's data is **private and isolated** — no user can see another's data.
- No password management, forgot-password flow, or email verification needed — Google handles all of that.

---

## 3. Asset & Liability Categories

### 3.1 Custom Categories
- Users can create **any number of custom asset categories** (e.g., "Cash", "Retirement Accounts", "Real Estate", "Side Business").
- Users can create **any number of custom liability categories** (e.g., "Mortgage", "Student Loans", "Credit Cards").
- Each category has:
  - A **name** (user-defined, required)
  - A **type**: Asset or Liability
  - An optional **icon or color** for visual identification
- Users can **rename** categories at any time.
- There is **no option to delete a category** — categories are permanent once created.

### 3.2 Line Items Within Categories
- Within each category, users can add **individual accounts or items** (e.g., within "Cash": "Chase Checking", "Emergency Fund Savings").
- Each line item has:
  - A **name** (required)
  - A **current value** (manually entered, numeric)
  - An optional **note** field

---

## 4. Snapshots (Ad Hoc Net Worth Logging)

- Users can **save a snapshot** of their net worth at any time.
- A snapshot captures the **current value of every category and line item** at that moment, along with a **timestamp**.
- Snapshots are **immutable once saved** — users cannot edit a past snapshot (to preserve historical integrity), but can delete one.
- Before saving, users should be shown a **summary preview** of the snapshot (total assets, total liabilities, net worth).
- Users can optionally add a **label or note** to a snapshot (e.g., "End of Q1 2025", "After bonus").
- Users can **view a list of all past snapshots** and click into any one to see the full breakdown at that point in time.

---

## 5. Dashboard

The dashboard is the home screen after login. It should be warm, clear, and data-forward. It must display all of the following:

### 5.1 Headline Number
- A large, prominent display of the user's **current net worth** (total assets minus total liabilities), based on the most recent snapshot.
- Display the **change since last snapshot** (absolute value and percentage, with positive/negative color coding — green for growth, warm red for decline).

### 5.2 Net Worth Over Time Chart
- A **line chart** showing net worth across all snapshots chronologically.
- X-axis: date of each snapshot.
- Y-axis: net worth value.
- Hovering over a data point shows the exact value and snapshot date/label.
- The chart should cover the full history of the user's snapshots.
- Optional time-range filters: Last 3 months, Last 6 months, Last year, All time.

### 5.3 Assets vs. Liabilities Breakdown
- A **visual comparison** (e.g., side-by-side bar, stacked bar, or donut chart) showing total assets vs. total liabilities.
- Display the numeric totals for each.

### 5.4 Category-Level Detail
- Below the charts, show a **breakdown by category** — each category listed with its current total value.
- Assets and liabilities shown in separate sections.
- Each category can be expanded to show individual line items and their values.
- Categories are sortable (by name or by value).

---

## 6. Data Entry Flow

- Users access a dedicated **"Update Values"** screen (or modal) to enter values before taking a snapshot.
- When opening the data entry screen, **all categories and line items from the most recent snapshot are pre-populated** as a starting point — the user does not start from a blank slate.
- The user is free to:
  - Fill in values for **all** pre-populated categories and line items
  - Fill in only **some** of them (leaving others blank or at zero)
  - **Add new categories or line items** inline that weren't in the previous snapshot
- A running **live total** is shown at the top as the user edits (total assets, total liabilities, net worth).
- Once satisfied, the user clicks **"Save Snapshot"** to lock in the values.
- For a brand new user with no prior snapshot, the screen starts empty and they build their categories from scratch.

---

## 7. Navigation & Pages

| Page | Description |
|---|---|
| **Login** | Single page with "Sign in with Google" button |
| **Dashboard** | Main overview with charts and summary |
| **Update Values** | Edit current asset/liability values and save a snapshot |
| **Snapshot History** | List of all past snapshots with the ability to view detail |
| **Manage Categories** | Add new or rename existing asset/liability categories |
| **Account Settings** | View profile info (pulled from Google), delete account |

---

## 8. Visual Design Guidelines

- **Tone**: Warm, friendly, encouraging — like a supportive financial companion, not a bank.
- **Color palette**: Warm neutrals (creams, soft whites) with a friendly primary accent (e.g., warm teal, soft green, or coral). Avoid cold blues and grays.
- **Typography**: Friendly but professional. A rounded or humanist sans-serif for body text; a slightly more expressive display font for headline numbers.
- **Charts**: Use soft, rounded chart styles. Avoid harsh grid lines — use subtle guidelines.
- **Positive framing**: Growth is celebrated with warm greens; declines shown in soft reds (not alarming).
- **Micro-interactions**: Subtle animations on value changes, smooth chart transitions, friendly empty states with helpful prompts (e.g., "Add your first category to get started!").
- **Responsive**: Must work well on both desktop and mobile.

---

## 9. Data & Storage

- All user data stored securely server-side in the Supabase PostgreSQL database.
- Data is stored unencrypted at rest for now to simplify development and debugging. Encryption will be added in a future version.
- No third-party financial integrations — manual entry only.
- Users can **export their data** as a CSV (all snapshots with full category breakdowns).
- Users can **delete their account**, which permanently removes all their data.

---

## 10. Non-Functional Requirements

- **Performance**: Dashboard and charts should load within 2 seconds for users with up to 5 years of monthly snapshots (~60 data points).
- **Security**: HTTPS required. Auth tokens should be stored securely (httpOnly cookies preferred over localStorage for JWTs).
- **Accessibility**: WCAG 2.1 AA compliance target. All inputs labeled, charts have text alternatives, color is not the sole indicator of meaning.
- **Browser support**: Latest 2 versions of Chrome, Firefox, Safari, and Edge.

---

## 11. Tech Stack

All technology choices have been decided with ease of development and deployment as the primary goal.

| Layer | Choice | Notes |
|---|---|---|
| **Frontend** | Next.js (React) | Single codebase for UI and API |
| **Backend** | Next.js API Routes | No separate server — API lives inside the Next.js project |
| **ORM** | Prisma | Type-safe, intuitive database access with schema-first modeling |
| **Database** | PostgreSQL via Supabase | Fully managed, free tier, no server to maintain |
| **Authentication** | NextAuth.js (Google OAuth) | Single "Sign in with Google" button — no passwords, no email flows |
| **Charts** | Recharts | React-native charting library, easy to customize |
| **Deployment** | Vercel | One-click deployment via GitHub integration, free tier, built for Next.js |
| **Language** | TypeScript throughout | End-to-end type safety |

### Key Architecture Notes
- The entire app lives in **one repository** — no separate frontend/backend repos.
- **NextAuth.js** is configured with the Google OAuth provider only. On first sign-in, a user record is auto-created in the database.
- **Prisma** connects to the Supabase PostgreSQL database via a connection string stored as an environment variable.
- **Vercel** deployment is triggered automatically on every push to the main branch.
- CSV export should be generated **server-side** via a Next.js API route.

### Local Development
- Local development runs entirely in **Docker** via a `docker-compose.yml` file.
- The Docker Compose setup should include:
  - A **Next.js app** container (with hot reloading enabled for development)
  - A **Supabase** instance running locally via Supabase's official Docker setup — keeping the local environment identical to production
- Prisma should connect to the local Supabase PostgreSQL instance via a `DATABASE_URL` environment variable defined in a `.env` file.
- A `.env.example` file should be included in the repo documenting all required environment variables.
- `docker compose up` should be all that's needed to start the full local environment.

### Environment Variables Required
- `DATABASE_URL` — Supabase PostgreSQL connection string
- `NEXTAUTH_SECRET` — Secret key for NextAuth session signing
- `NEXTAUTH_URL` — The deployed app URL
- `GOOGLE_CLIENT_ID` — From Google Cloud Console OAuth credentials
- `GOOGLE_CLIENT_SECRET` — From Google Cloud Console OAuth credentials


