# SmartRide AI

AI-powered ride-hailing platform with dynamic pricing, real-time tracking, and multi-city support across India.

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion, Recharts
- **Backend**: Express 5, Node.js, Drizzle ORM
- **Database**: PostgreSQL (Neon)
- **Build**: Vite 7, esbuild

## Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and SESSION_SECRET

# Push schema to database
npm run db:push

# Start development server
npm run dev
```

Open [http://localhost:5000](http://localhost:5000)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (hot reload) |
| `npm run build` | Production build |
| `npm start` | Run production server |
| `npm run check` | TypeScript type check |
| `npm run db:push` | Push schema to database |
| `npm test` | Run unit tests |

## Features

- Multi-city ride booking (7 Indian cities)
- AI-powered fare prediction with surge pricing
- Real-time ride tracking with GPS simulation
- Ride scheduling for future trips
- Driver earnings dashboard with analytics
- Trip receipts with downloadable invoices
- Role-based dashboards (Passenger / Driver / Admin)
- In-ride chat with AI assistant
- Ratings, payments, and notification system
- Smart route calculation using Haversine formula

## Project Structure

```
client/          -> React frontend (pages, components, hooks)
server/          -> Express backend (routes, storage, db)
shared/          -> Shared types, schemas, city data
script/          -> Build scripts
```

## Deployment

Configured for Render. See `render.yaml` for service definition.

## License

MIT
