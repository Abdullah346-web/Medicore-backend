# AI Clinic Management Backend

Express + MongoDB backend for AI Clinic Management.

## Setup

1. Copy `.env.example` to `.env`
2. Fill MongoDB and JWT values
3. Add at least one AI key (`OPENAI_API_KEY` or `GEMINI_API_KEY`) for real AI output
4. Install and run:

```bash
npm install
npm run dev
```

## AI Configuration

- `AI_PROVIDER=openai` forces OpenAI
- `AI_PROVIDER=gemini` forces Gemini
- If `AI_PROVIDER` is empty, backend auto-selects available key:
  - OpenAI first if `OPENAI_API_KEY` exists
  - otherwise Gemini if `GEMINI_API_KEY` exists
- If no AI key is configured, endpoints return safe fallback responses

## Main API Prefixes

- `/api/auth`
- `/api/patients`
- `/api/appointments`
- `/api/prescriptions`
- `/api/diagnosis`
- `/api/analytics`
- `/api/subscription`

## Demo Staff Credentials

- Receptionist: `recept@clinic.com` / `recept12345`
- Doctor: `doctor@clinic.com` / `doctor12345`
