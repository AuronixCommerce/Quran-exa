# Quranexa AI

Ask. Read. Understand.

## Implemented

- All 114 Surahs and 6,236 ayahs, Arabic text with source English and Urdu translations, Juz/page/hizb/sajdah metadata, paginated reading, search, bookmarks, copy/share, reading history, and ayah-attached questions.
- Six Hadith collections imported in Arabic, English and Urdu from the supplied editions, with collection/book pagination and source-specific grades. Empty source placeholders are excluded; records available in only one language are retained without inventing missing translations.
- Tafsir Ibn Kathir in English and Urdu and Al-Muyassar in Arabic, each covering 6,236 ayahs. Long passages are deduplicated and loaded from immutable static assets.
- Hisnul Muslim: 267 supplied records across 132 categories, plus Quranic duas. Arabic, supplied English meanings, and supplied reading aids are preserved. This edition does not supply Urdu meanings; that absence is disclosed.
- Six traditional educational Kalmas with sourced Arabic and Quranexa-authored meaning translations and romanization. No obligation, special reward, or canonical Hadith status is claimed.
- Quran/Hadith/Tafsir/Dua retrieval with multilingual inverted indexes, bounded asset caching, exact-reference lookup and server-side source resolution.
- English, Urdu and Arabic interfaces with RTL-aware layouts; Urdu controls and category labels are translated. Interface, Quran translation and AI language remain separate preferences. Original source metadata and explicitly selected foreign-language passages are preserved.
- Native Apple font stacks on iOS, readable Naskh/Nastaliq fallbacks elsewhere, selective editorial italics, a CEO message for Muhammad Mohsin Adnan, and a dark emerald login design based on the supplied references.
- Chat history/new/rename/delete/search, regenerate, stop, copy/share, feedback, citation cards and progressive typewriter presentation. Only complete paragraphs with validated citations are displayed.
- Guest conversations stay in memory. A signed HttpOnly secure cookie and atomic D1 quota enforce ten guest generation attempts per visitor identity. Reloads retain the allowance. Clearing site data or using a different browser creates a different guest identity; signed-in accounts have a separate ten-per-minute rate limit. A one-year essential cookie is documented on the localized privacy page.
- Private account storage with server-owned source snapshots, bounded inputs, prepared queries, locale settings, feedback and an explicitly allowlisted admin correction-review interface. A second administrator is required to review a proposal; publishing scripture changes requires a separately validated immutable source release.
- Canonical locale links and split sitemaps for Quran ayahs, Hadith records, duas and public pages.

## Source integrity

Original Quran files are in `data/quran/en` and `data/quran/ur`. Imported Hadith/Tafsir/Hisnul Muslim files are in `data/imports`. `data/import-manifest.json` records URLs and SHA-256 digests; `data/corpus-report.json` records actual coverage and alignment results. `scripts/build-corpus.py` deterministically creates immutable source shards and search assets in `public/corpus`. Structural checks are not independent scholarly certification.

Quran JSON: https://github.com/risan/quran-json — Risan Bagja Pradana, CC-BY-SA 4.0. Quran Encyclopedia Arabic; Tanzil Saheeh International English and Abul A’la Maududi Urdu. Dataset-derived output retains attribution and license. Hafs metadata: Quran-Center/quran-meta (MIT, retained).

Hadith: https://github.com/fawazahmed0/hadith-api/tree/1/editions — supplied record numbers and grades are preserved. Translations are joined only where source record references align. Tafsir: https://github.com/spa5k/tafsir_api — the chosen editions identify Quran.com/QUL origins. Hisnul Muslim: https://github.com/wafaaelmaandy/Hisn-Muslim-Json. Kalma Arabic provenance: https://alqurancompanion.com/guide-the-6-kalimas-of-islam-text-meaning. Quranexa’s Kalma meanings are educational translations, not an independently verified Quran/Hadith translation edition.

## Runtime configuration and remaining integrations

`GROQ_API_KEY` and `GROQ_MODEL` are server-only runtime values, never browser variables. Neither is currently configured. Reading/search work independently. Configure a Groq chat model that follows the requested JSON schema; streaming uses ordinary chat completions with strict application validation because model-specific structured-output streaming support varies. Reference: https://console.groq.com/docs/structured-outputs. No live AI integration test has run without credentials. Citation validation does not guarantee the semantic or scholarly correctness of every explanation; source-grounding evaluations and qualified review remain necessary before making such a reliability claim.

`GUEST_QUOTA_SECRET` is configured privately in the hosting environment. `QURANEXA_ADMIN_IDS` is an explicit comma-separated list of site-scoped authenticated user IDs and is currently empty. No visitor is automatically promoted. No runtime API can mutate the original scripture assets.

Authentication uses platform-owned ChatGPT sign-in/sign-out and account recovery. The login page routes to that real provider and does not collect unused passwords. App-owned email/password or Google sign-in is not configured. Google Drive synchronization is not connected, and the interface says so; signing in currently saves to the Quranexa account, not Drive. Do not claim Google Drive saving until a genuine per-user authorized connection is implemented.

This publication retains owner-only access. Guest and public SEO behavior is implemented for a future public-access configuration; the hosting access gate currently requires the owner to sign in.

## Verification

`node --test tests/quranexa.test.mjs tests/corpus.test.mjs` covers Quran alignment, all Tafsir ayahs, six Hadith collections, full-corpus retrieval, fabricated-reference rejection, incremental JSON parsing, Urdu label completeness, and the ten-message quota under concurrent requests.

Run `npx tsc --noEmit`, then the Sites build helper. The immutable initial Drizzle migration already supplies the tables used here; no runtime schema mutation is performed. No browser QA was requested. Font reference: https://developer.apple.com/fonts/.
