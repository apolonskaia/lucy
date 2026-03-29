# Lucy

Lucy will help you look for a job and keep your sanity here: [Open Lucy](https://apolonskaia.github.io/lucy/#journal)

Currently, Lucy has the following functionality:
- Journal tab: create daily tasks, monthly goals, and calculate daily, weekly, and monthly progress
- Job Search tab: job search stats, job application tracker table, CV upload, and embedded Gemini CV-to-job-description suggestions
- Learning Hub tab: two tracked lists, Online Courses and Papers
- Export all logged data to XLSX 

*All the data is currently saved in your browser's local storage
*AI CV suggestions only work for me as I am running the backend from my local terminal. Planning to use Google Cloud Run in near future


Stay tuned









## To run the web app locally:


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
- The frontend proxies `/api/*` requests to `http://localhost:8787` in development
