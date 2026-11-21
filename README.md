# CivicResolve: AI-Powered Citizen Grievance Management & Resolution

CivicResolve is a full-stack, accessible, security-hardened citizen grievance management platform that automates complaint intake, AI department routing, priority & SLA assignment, duplicate detection, bilingual citizen updates, and municipal SLA analytics.

## Key Capabilities
- **AI Auto-Triage Engine (`server/ai-triage-engine.ts`):** Routes grievances across 6 municipal departments (`Water Supply`, `Roads & Potholes`, `Sanitation & Waste`, `Streetlights & Power`, `Drainage & Flooding`, `Public Health & Safety`), computes urgency scores (0–100), assigns SLA deadlines (`6h`–`72h`), classifies citizen sentiment, and flags duplicate ward complaints via Jaccard similarity.
- **Resolution Queue & SLA Command Center:** Filterable officer board with one-click escalation, resolution tracking, audit trails, and live SLA compliance analytics.
- **Citizen Ticket Tracker & Bilingual AI Copilot:** Real-time grievance timeline lookup, post-resolution star rating, and English/Hindi citizen response drafting.
- **Cloud Run & Vercel Ready:** Multi-stage non-root Alpine `Dockerfile` (port `8080`, `/api/health` healthcheck) plus `vercel.json` security headers.

## Quick Start
```bash
npm install
npm run lint
npm test
npm run build
npm start
```
