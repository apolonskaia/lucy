# Lucy

Vibecoding a productivity+wlb web app for myself.
Data saved locally currently, will move to a DB soon. 

The Job Search page now includes:
- a job application tracker/logger
- CV upload and text extraction for PDF, DOCX, TXT, and Markdown
- AI CV-to-job-description suggestions via a local Express API

The Learning Hub page now includes:
- two tracked lists: Online Courses and Papers

Stay tuned







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
