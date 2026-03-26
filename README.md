# Lucy

Vibecoding a productivity+wlb web app for myself.


Currently, it has functionality to create daily tasks, monthly goals, and calculate daily, weekly, and monthly progress (Journal tab). 

Also, the Job Search tab now includes:
- a job application tracker table
- CV upload and text extraction for PDF, DOCX, TXT, and Markdown
- AI CV-to-job-description suggestions via a local Express API

Stay tuned.







**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create `.env.local` or `.env` with:
   - `GEMINI_API_KEY`
   - optional `GEMINI_MODEL`
   - optional `API_PORT`
3. Run the API server in one terminal:
   `npm run dev:api`
4. Run the frontend in another terminal:
   `npm run dev`

Notes:
- The frontend proxies `/api/*` requests to `http://localhost:8787` in development.
- GitHub Pages can host the frontend, but the AI analysis backend must be deployed separately because Pages cannot run Express or server-side AI calls.
