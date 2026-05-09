# Beauté Frontend — ap4ds-a3-frontend

React 18 + Vite 6 + TypeScript SPA for the Beauté cosmetics shopping platform.
Built for **RMIT COSC3801 / COSC3015 — Advanced Programming for Data Science, Assignment 3 Milestone 2**.

| Student | ID |
|---|---|
| Lam Dao Duc | s4019052 |
| Bach Luong Chi | s4029308 |
| Ngoc Duong Bao | s3425449 |

---

## Prerequisites

| Tool | Minimum version |
|---|---|
| Node.js | 18 |
| npm | 9+ |

> The backend API must be running on `http://localhost:5000` before you start the frontend.  
> See `../backend/README.md` for backend setup.

---

## Project layout

```
frontend/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── src/
│   ├── main.tsx
│   ├── api/
│   │   └── client.ts          # Typed fetch wrapper for the Flask API
│   ├── app/
│   │   ├── App.tsx             # Root component with global state
│   │   └── components/
│   │       ├── Header.tsx      # Search bar
│   │       ├── FilterSidebar.tsx  # Task 4 — filter panel
│   │       ├── ProductGrid.tsx    # Responsive product grid
│   │       ├── ProductCard.tsx    # Single product card
│   │       ├── ProductDetail.tsx  # Task 2 & 3 — overlay with review form + similar products
│   │       ├── figma/
│   │       │   └── ImageWithFallback.tsx
│   │       └── ui/             # 48 Radix-based ShadCN components
│   └── styles/
│       ├── index.css
│       ├── theme.css
│       ├── tailwind.css
│       └── globals.css
└── .gitignore
```

---

## Setup (first time)

### 1. Clone

```bash
git clone <repo-url>
cd frontend
```

### 2. Install dependencies

```bash
npm install
```

This installs ~170 packages including React 18, Vite, Tailwind CSS 4, all Radix UI primitives, and `react-slick`.

### 3. Start the dev server

```bash
npm run dev
```

The app opens at **http://localhost:5173**.  
It proxies all `/api/*` requests to the Flask backend at `http://localhost:5000`.

> Make sure the backend is already running before launching the frontend.

---

## Available scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |

---

## Features

| Task | Description |
|------|-------------|
| **Task 1 — Search** | Type in the header search bar to filter products by keyword |
| **Task 2 — Review + AI label** | Open any product → fill in the review form → get "Buy" / "Not Buy" prediction |
| **Task 3 — Recommendations** | Similar products carousel shown in the product detail panel |
| **Task 4 — Filter sidebar** | Filter by brand, category, and price range |

---

## API connection

All API calls go through `src/api/client.ts`.  
The base URL is hard-coded to `http://localhost:5000/api` for local development.

If the backend runs on a different port, update the `BASE` constant in `src/api/client.ts`:

```ts
const BASE = "http://localhost:5000/api";  // change port here if needed
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Blank page / no products | Check that the Flask backend is running on port 5000 |
| `npm install` fails | Ensure Node.js ≥ 18: `node --version` |
| CORS errors in browser console | Start Flask backend first; confirm `flask-cors` is installed in backend |
| Port 5173 already in use | Vite will automatically try the next available port |
| Images not loading | Products use external URLs; no action needed (fallback placeholder renders instead) |
