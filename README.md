# Invoice → Peppol (frontend)

React + Vite + Tailwind UI for converting PDF invoices into Peppol (Horizon) e-invoice XML.

Flow: upload PDF → `POST /extract` → review and correct the extracted data → `POST /generate` → XML download.
The backend lives in the separate `invoice-backend` repo.

## Setup

```sh
npm install
cp .env.example .env   # point VITE_API_BASE at the backend
npm run dev
```

`VITE_API_BASE` is read at build time, so set it in the hosting provider's project settings as well.

## Structure

- `src/InvoiceReview.jsx` — screen container: state, upload and generate handlers
- `src/components/` — UI pieces (header, source panel, review panel, line table, totals)
- `src/lib/api.js` — backend client, incl. cold-start retry and `/health` polling
- `src/lib/reconcile.js` — client-side totals check that mirrors the backend
- `src/i18n/` — English (default) and Latvian strings; add a language by adding a file and an entry in `context.js`
