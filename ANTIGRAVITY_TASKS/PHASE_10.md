# Phase 10: Summit release
1. `README.md`: what it is (independent demo), setup (`pnpm i`, `.env.local` vars), run, test.
2. `DEMO_SCRIPT.md`: the 4 walkthroughs with exact phrases, plus 20 sample questions per product.
3. `KNOWN_LIMITATIONS.md` (Umbra fully simulated, Titan mock without a key, no wallet) and `TROUBLESHOOTING.md` (mic permission, model download, Groq rate limits, Portal 429).
4. Re-record the videos: `pnpm --filter @companion/web exec playwright test -c playwright.video.config.ts`. Update the grep to match the new test names.
5. Run the final regression checklist (from `IMPLEMENTATION_ROADMAP.md` "Summit-ready means") and record the results in `PROJECT_STATUS.md`.
