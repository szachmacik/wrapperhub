# WrapperHub

> **AI tools aggregator platform** — like Genspark, but yours. Deploy AI wrappers with margin in minutes.

## What is WrapperHub?

WrapperHub lets you aggregate popular AI tools (chat, image generation, document analysis, code assistance) under your own brand, with a margin built in. Clients use the tools without knowing the underlying costs — you set the margin, they just use it.

**Key features:**
- **Client panel** — clean Genspark-style interface, clients just use AI tools
- **Admin panel** — manage wrappers, set margins, view usage & revenue
- **Margin system** — set multiplier per wrapper (e.g. 2x cost = 100% margin)
- **Plans & billing** — Free/Pro/Business tiers with Stripe integration
- **Usage tracking** — full logs with cost, margin, tokens per user
- **Self-hostable** — run locally with one Docker command

---

## Quick Start (Cloud / Manus)

The app is deployed at your Manus space. Sign in and you're ready to go.

1. Sign in → you become admin automatically (first user)
2. Go to **Admin Panel** → **API Keys** → add your OpenAI key
3. Go to **Admin Panel** → **Wrappers** → activate/configure tools
4. Share the URL with clients — they sign in and use the tools

---

## Self-Hosted Installation (Docker)

### One-command install

```bash
curl -fsSL https://raw.githubusercontent.com/your-repo/wrapperhub/main/install.sh | bash
```

### Manual Docker Compose

```bash
# 1. Clone the repo
git clone https://github.com/your-repo/wrapperhub.git
cd wrapperhub

# 2. Configure environment
cp .env.template .env
# Edit .env with your API keys

# 3. Start everything
docker compose up -d

# 4. Open http://localhost:3000
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | MySQL connection string |
| `JWT_SECRET` | Yes | Session signing secret |
| `OPENAI_API_KEY` | Yes | OpenAI API key for AI tools |
| `STRIPE_SECRET_KEY` | No | Stripe for paid plans |
| `VITE_APP_ID` | No | Manus OAuth app ID |

---

## Architecture

```
WrapperHub
├── client/          React 19 + Tailwind 4 + shadcn/ui
├── server/          Express + tRPC
│   ├── wrapperRouter.ts    AI proxy + usage tracking
│   ├── plansRouter.ts      Plans, users, admin stats
│   └── stripeRouter.ts     Billing & webhooks
├── drizzle/         MySQL schema & migrations
├── docker-compose.yml
└── Dockerfile
```

### Margin System

Each wrapper has a `marginMultiplier` (default: 2.0 = 100% margin):

```
Client pays: base_cost × margin_multiplier
Your profit: base_cost × (margin_multiplier - 1)
```

Example: OpenAI costs $0.01/request → you charge $0.02 → $0.01 profit per request.

---

## Adding New Wrappers

1. Go to **Admin Panel** → **Wrappers** → **Add Wrapper**
2. Fill in: name, category, provider, model ID, margin
3. Activate → clients see it immediately in their dashboard

Supported categories: `chat`, `image`, `document`, `code`, `audio`, `video`, `search`, `custom`

---

## Tech Stack

- **Frontend:** React 19, Tailwind CSS 4, shadcn/ui, Wouter
- **Backend:** Node.js, Express, tRPC 11
- **Database:** MySQL / TiDB (via Drizzle ORM)
- **Auth:** Manus OAuth
- **Payments:** Stripe
- **AI:** Manus Built-in LLM + Image Generation APIs

---

## License

MIT
