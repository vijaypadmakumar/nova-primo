# Nova Primo

A web app for lorry booking agents in India. The agent records each load from a
party (shipper), fixes a truck, and follows the trip to payment. Shippers and
drivers will only ever need a link.

This first part covers sign-in, the office, masters (parties, truck owners,
drivers, vehicles) and loads with a load board. Screens are in English and Hindi.

## Run it on your computer

You need Node.js 22 and PostgreSQL 15 or newer.

```bash
cp .env.example .env        # then set DATABASE_URL and AUTH_SECRET
npm install
npm run db:migrate          # creates the tables
npm run dev                 # open http://localhost:3000
```

With `OTP_DEV_MODE=true` no SMS is sent: the sign-in code is shown on screen.

## Checks

```bash
npm run lint
npm run typecheck
npm test                    # unit tests
npm run test:e2e            # browser tests, desktop and phone sizes
```

## How it is built

- Next.js (App Router) with server actions, TypeScript and Tailwind CSS
- PostgreSQL through Drizzle ORM; migrations live in `drizzle/`
  (`npm run db:generate` after changing `src/db/schema.ts`)
- Sign-in by mobile number and one-time code; sessions in the database
- English and Hindi text in `messages/`, chosen per person and kept in a cookie
- Every query is scoped to the signed-in agent's office

## Design rules

The users are busy office staff, many of them used to Tally. So the app keeps:

- large type, high contrast, a light background and one accent colour
- labels above every field and plain words ("Party", "Masters", "Create", "Display")
- Tally-style keys: **Alt+C** to create, **Ctrl+A** to save, **Esc** to go back
- dates as 13-Oct-2026 and money as ₹1,25,000
