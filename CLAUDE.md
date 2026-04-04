# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SkillSwap is a MERN stack skill-sharing platform where users can offer and request skills, propose skill swaps, exchange messages in real-time, and leave reviews after completed transactions.

## Development Commands

This is a two-process project — backend and frontend must run in separate terminals.

**Backend** (runs on port 5000):
```bash
cd backend
npm install
npm run dev      # nodemon auto-restart
npm start        # production
```

**Frontend** (runs on port 5173):
```bash
cd client
npm install
npm run dev      # Vite dev server
npm run build    # production build
npm run lint     # ESLint
npm run preview  # preview production build
```

**Database seeding:**
```bash
cd backend
node seedCategories.js
```

There are no automated tests in this project.

## Architecture

### Stack
- **Backend**: Node.js + Express 5, MongoDB + Mongoose, Socket.io 4, JWT auth, Multer (avatar uploads)
- **Frontend**: React 19, Vite, React Router DOM 7, Tailwind CSS 3, Axios, Chart.js, Socket.io-client

### Backend Structure (`backend/`)
- `server.js` — Express app + Socket.io server entry point. All routes, CORS, and middleware registered here.
- `config/socket.js` — `emitNotification(userId, event, data)` helper; all real-time notifications go through this.
- `controllers/` — Business logic. Each controller maps to a route group.
- `models/` — Mongoose schemas: `User`, `Skill`, `Transaction`, `Message`, `Review`, `Category`.
- `middleware/authMiddleware.js` — Verifies JWT Bearer token and attaches `req.user`.
- `middleware/adminMiddleware.js` — Admin role guard.
- `routes/` — Route definitions; thin, just wire controllers.
- `uploads/avatars/` — Multer-stored user avatar files, served statically.

### Frontend Structure (`client/src/`)
- `contexts/AuthContext.jsx` — Global auth state (user, token) persisted to `localStorage`. Provides `login()`, `logout()`, `updateUser()`.
- `contexts/SocketContext.jsx` — Socket.io connection lifecycle. Authenticates with JWT on connect; exposes socket instance.
- `pages/` — One file per route: `Dashboard`, `Profile`, `ExploreSkills`, `ExploreUsers`, `Messages`, `Transactions`, `Home`, `Login`, `Register`.
- `components/` — Reusable UI: `Navbar`, `ProposeSwapModal`, `TransactionItem`, `Reviews`, `CategorySkillInput`, etc.
- `routes/PrivateRoute.jsx` — Redirects unauthenticated users to `/login`.
- `App.jsx` — React Router route tree; wraps everything in `AuthContext` and `SocketContext`.

### Key Data Flow Patterns

**Authentication**: JWT stored in `localStorage` → `AuthContext` reads on mount → Axios calls add `Authorization: Bearer <token>` header → `authMiddleware` validates.

**Real-time notifications**: Any backend action (transaction update, new message, etc.) calls `emitNotification(userId, 'event', data)` from `config/socket.js`. Users auto-join a Socket.io room named after their MongoDB user ID on connect.

**Transactions lifecycle**: `pending` → `accepted` / `rejected` → `proposed-swap` → `completed`. Transaction model tracks both offer/request parties, the skills involved, and status history.

**API base URL**: All frontend Axios calls target `http://localhost:5000/api`. No proxy configured in Vite.

### Environment Variables (backend `/.env`)
```
MONGO_URI=<MongoDB Atlas connection string>
PORT=5000
JWT_SECRET=<secret>
```

### Tailwind Theme
Custom colors defined in `client/tailwind.config.js`:
- `primary`: `#0B2447` (dark navy)
- `secondary`: `#19376D`
- `accent`: `#576CBC`
- `light`: `#A5D7E8`

Custom animations: `fade-in-up`, `float`.
