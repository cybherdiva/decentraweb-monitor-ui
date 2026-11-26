# DecentraWeb Monitor UI

React + Vite + Tailwind CSS app for monitoring DecentraWeb domains and performing one-time unlimited DWEB token approvals.

## Features

- Wallet connection (MetaMask / injected wallets) via ethers v5
- DWEB Allowance Shortcut: check and set unlimited approval to the Root Registrar Controller
- Placeholder watched-names table (ready for real `@decentraweb/core` expiry reads)
- Works on Ethereum and Polygon

## Local development

```bash
npm install
npm run dev
```

Open the URL printed by Vite (usually http://localhost:5173).

## Deploy

Ready for Cloudflare Pages. Connect this repo and set the build command to `npm run build` and the output directory to `dist`.
