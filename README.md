# RDM Fleet Tracker | Redmond Campus

Real-time aircraft fleet tracking dashboard for Hillsboro Aero Academy (HAA) Redmond Campus. Tracks aircraft across **Madras**, **Sky Service**, and **HAA Campus**.

## Features

- **Minimalist Real-Time Board**: Clean, high-density white table showing Type, Tail, and Status.
- **Single-Line per Aircraft**: Optimized spacing allowing the entire fleet to fit on one screen.
- **Auto Model Detection**: Input only the tail number; model type (`152`, `172`, `PA34`, `PA44`, `R22`, `R44`) is automatically recognized using the 101-aircraft HAA registry.
- **Edit Mode**: Password-protected (`haahaa`) inline status dropdown, ramp reassignment, and aircraft management.
- **100% English**: Standardized for flight school operations.

---

## Deployment to Vercel

### 1. Import Repository
1. Push this repository to your GitHub account (`elcapt-developer/rdm-fleet-tracker`).
2. Go to [Vercel](https://vercel.com) and click **Add New Project**.
3. Import `rdm-fleet-tracker`.
4. Framework preset will automatically detect **Vite**. Click **Deploy**.

### 2. Connect Vercel Storage (Persistent Fleet Database)
To persist fleet changes across all devices:
1. In your Vercel Project Dashboard, navigate to the **Storage** tab.
2. Click **Create Database** and select **KV** (or **Upstash Redis** from Marketplace).
3. Connect the database to this project. Vercel will automatically inject the `KV_REST_API_URL` and `KV_REST_API_TOKEN` environment variables.
4. Redeploy your project. The app will automatically switch from in-memory fallback to persistent Vercel KV/Redis storage!

---

## Local Development

```bash
# Install dependencies
npm install

# Run backend and Vite frontend together
npm run dev

# Access local app
# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
```

---

© Mingyun 'John' Kim. All rights reserved.
