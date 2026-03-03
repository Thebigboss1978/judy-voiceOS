<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1JauLKdMTa823iO8fNsvQEsx8g3kzKCDT

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies: `npm install`
2. Set your Gemini API key in `.env.local` using either `VITE_GEMINI_API_KEY` (preferred) or `GEMINI_API_KEY`
3. Run the app: `npm run dev`
4. Open: `http://localhost:3000`

## Work locally first (recommended before any deploy)

Use this checklist to make sure you are seeing the **latest agreed design** locally:

1. Stop any running dev servers in old terminals.
2. In this repo folder, run:
   - `git pull`
   - `npm install`
   - `npm run dev -- --host 0.0.0.0 --port 3000`
3. Open only: `http://localhost:3000`
4. Hard refresh in browser:
   - Mac: `Cmd + Shift + R`
   - Windows/Linux: `Ctrl + F5`
5. If you still see old UI, clear site data for `localhost:3000` and reopen the page.

### Quick local verification

The current agreed minimal interface should show only:
- six reactive sticks
- one reactive dot
- dark full-screen background

If you still see chat panels / side logs / old orbit UI, you are likely opening an old server instance or cached build.

## Deploy (Vercel)

1. Import this repository in Vercel
2. Add an environment variable in Vercel project settings:
   - `VITE_GEMINI_API_KEY` (preferred)
3. Deploy

The production domain should look like:
- `https://judy-voice-os.vercel.app`

### Troubleshooting `404: DEPLOYMENT_NOT_FOUND`

That error is usually caused by an old/invalid preview URL rather than an app code problem.

- Open the latest deployment from the Vercel dashboard and use that new URL.
- If needed, trigger a fresh deployment (for example: push a commit or click **Redeploy**).
- Use the stable production domain (`https://judy-voice-os.vercel.app`) instead of old preview links.
