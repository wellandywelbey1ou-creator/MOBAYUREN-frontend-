# MOBAYUREN - Automatic MLBB Topup (Demo Repo)

This repo contains a minimal **frontend** (React + Vite) and **backend** (Node.js + Express) demo
for an automatic top-up flow using FPX (payment) and VIP-Reseller/Digiflazz (supplier).

> This is a demo scaffold. Replace mocked endpoints with real provider APIs and secure your
> server before going to production.

## Contents
- frontend/ : React app (Vite)
- backend/ : Express server (mocked FPX & VIP calls)
- .env.example : environment variables example

## Quick start (local)
1. Backend:
   ```
   cd backend
   npm install
   node server.js
   ```
2. Frontend:
   ```
   cd frontend
   npm install
   npm run dev
   ```
3. Use ngrok to expose backend for FPX webhook testing:
   ```
   ngrok http 4000
   ```

## Next steps to go live
- Register merchant account for FPX / ToyyibPay or a payment gateway supporting FPX.
- Register as reseller with VIP-Reseller / Digiflazz and get API key.
- Implement real payment session creation and webhook verification.
- Use a real database (Postgres / MongoDB) instead of in-memory store.
- Secure server with HTTPS, env vars, and proper error handling.

