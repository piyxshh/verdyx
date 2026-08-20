# Verdyx Frontend

This directory will contain the Next.js frontend application.

## Setup (to be initialized)

```bash
npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
```

Then install additional dependencies:
```bash
npx shadcn@latest init
npm install recharts @supabase/supabase-js @supabase/ssr
```

## Structure (planned)

```
app/
├── layout.tsx                  # Root layout
├── page.tsx                    # Landing page
├── (auth)/
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   └── callback/route.ts
├── dashboard/
│   ├── layout.tsx              # Dashboard shell
│   ├── page.tsx                # History overview
│   ├── new-scenario/page.tsx   # Input form
│   └── [scenarioId]/page.tsx   # Results view
components/
├── ui/                         # shadcn/ui
├── scenario-form.tsx
├── prediction-result.tsx
├── agent-report-card.tsx
├── verdict-display.tsx
├── risk-gauge.tsx
├── feature-importance-chart.tsx
└── history-table.tsx
lib/
├── supabase/
├── api.ts
└── types.ts
```
