# Quranexa AI

**Ask. Read. Understand.**

Quranexa AI is a Quranic and Islamic knowledge platform for reading the Quran, exploring authentic Islamic sources, and asking grounded questions with AI assistance.

## Stack

- Next.js 15
- React 19
- TypeScript
- Server-side Groq API integration
- Responsive premium Islamic knowledge UI

## Local development

```bash
npm install
npm run dev
```

Create `.env.local` from `.env.example` and add your private server-side keys. Never commit real secrets.

## Environment variables

```env
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-120b
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Product principles

- Keep Quranic source text central.
- Clearly distinguish source text, translation, tafsir, and AI explanation.
- Never present uncertain AI output as revelation or authoritative fatwa.
- Prefer source citations and explicit uncertainty.
- Arabic and Urdu typography receive dedicated font stacks.
- Guest AI chats are limited to 10 messages; signing in is required for saved history.

© 2026 Quranexa AI
