# Quran - Exa — Work Handoff

## Goal
Finish and verify the production Quran - Exa application on Vercel from `AuronixCommerce/Quran-exa`.

## Implemented architecture
- Next.js 16 native Vercel build.
- Product branding is **Quran - Exa**.
- Firebase email/password + Google authentication replaces ChatGPT Sites login.
- Main user RTDB stores preferences, bookmarks, reading history, profile state and compressed profile photo data.
- Guest chats are stored in browser `localStorage`.
- Signed-in chats target the dedicated chat RTDB and are keyed by authenticated UID.
- Guest chats are merged into the signed-in chat collection when a user authenticates, without overwriting matching chat IDs.
- AI uses Groq server-side, retries invalid completions, validates citations against retrieved source IDs, and never displays raw provider errors.
- New chats get a short AI-generated title from the first question.
- Chat follows new replies automatically while respecting manual scroll-up.
- Quran reader supports full-Surah sequential recitation, ayah-by-ayah playback, play/pause/previous/next, active-ayah underline and auto-scroll.
- Selected page text gets a custom **Ask Quran - Exa** floating action.
- Bundled translations remain unchanged; extra verified translation editions are available through the backend Quran Foundation Content API integration when credentials are configured.
- A premium emerald/glass visual layer is loaded from `app/premium.css`.

## Required verification
1. Run `npm install` so the Firebase client dependency is present.
2. Run `npm run build` and resolve any strict TypeScript/Next errors.
3. Verify email/password signup, login, password reset, Google popup auth and logout.
4. Verify no user-facing error contains `Firebase`; all auth failures must use `Quran - Exa Auth` wording.
5. Verify guest chat local persistence, 10-message quota, New Chat behavior and signed-in chat sync.
6. Verify signed-in AI calls send the Firebase ID token and do not consume guest quota.
7. Verify bookmarks, reading history, preferences and profile photo persist in the main RTDB.
8. Verify profile images over 6 MB are compressed in-browser and that stored Data URLs remain small enough for RTDB.
9. Verify full-Surah and individual ayah audio on mobile and desktop.
10. Verify active ayah underlining and auto-scroll while recitation advances.
11. Verify selected Quran/translation text exposes the floating Ask Quran - Exa action.
12. Configure Quran Foundation API credentials and verify multiple English/Urdu translation editions with translator attribution.
13. Check responsive UI, dark mode, Urdu RTL and Arabic RTL.

## Important Firebase chat-database note
The supplied main auth project is `quranexaauthpfp`, while the supplied chat RTDB URL appears to belong to project `quranexachats`. A Firebase Auth ID token from one Firebase project normally does not authenticate against another project's RTDB security rules. Do **not** solve this by opening the chat database publicly.

For secure production chat sync, use one of these approaches:
- Preferred: create/use the chat RTDB as a database instance under the same Firebase project that provides authentication; or
- Provide the full Firebase web/server configuration for the `quranexachats` project and implement a secure server bridge / trusted token strategy.

Until the project relationship is confirmed, test the dedicated RTDB under authenticated rules before calling chat sync production-ready.

## Data integrity
Quran/Hadith/Tafsir data must never be fabricated. Keep original scripture separate from AI explanation, preserve translator/source attribution, and fail closed when a verified source is unavailable.

## Environment
Use `.env.example` as the canonical deployment-variable list. Server-only keys must never be exposed with `NEXT_PUBLIC_`.
