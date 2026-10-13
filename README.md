# Nova Primo

A web app for lorry booking agents in India. The agent records each load from a
party (shipper), fixes a truck, and follows the trip to payment. Shippers and
drivers will only ever need a link.

Right now it is built as a **demo sandbox** to show agents what switching would
give them. "Try the demo" on the sign-in screen opens a fresh office full of
sample parties, trucks and loads in every stage. In it an agent can:

- book a load and see it on the load board
- fix a truck (new, or one already carrying another party's goods)
- see the WhatsApp message the driver would get, in the driver's language
- open the driver's phone view and tap through loading, travel, unloading and papers
- see each trip's margin, and money to collect from parties and pay to owners
- see the connections between parties and drivers
- start the demo again at any time

Nothing is sent from the demo: no SMS, no WhatsApp, no real links. Screens are
in English and Hindi; the driver's page also has Kannada, Tamil and Punjabi.

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
