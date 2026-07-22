# Crime Statistics (AU)

**Explore, compare, and understand crime across every Australian state and territory — standardised into one interactive dashboard.**

🔗 **Live:** [https://au-crime.benrichardson.dev](https://au-crime.benrichardson.dev)

## What is this?

Australia has no single place to compare crime data across all states in a standardised way. Each of the eight states and territories publishes statistics in different formats, with different offence categories, geographic units, and time periods. This site normalises everything to a consistent schema based on the Australian and New Zealand Standard Offence Classification (ANZSOC), joins in Estimated Resident Population data from the ABS, and presents it through a dense, interactive dashboard.

Eight distinct views let users explore the same data from different angles: a national overview, state deep-dives, per-category comparisons, multi-year trends, a choropleth map, a cross-reference heatmap, sortable leaderboards, and an automatic anomaly-detection module that surfaces year-on-year spikes and statistical outliers without the user needing to look for them.

The site is designed for journalists, researchers, policy analysts, and Australian residents who want to answer questions like "how does my state compare?", "is assault really rising?", or "which LGA has the highest burglary rate per capita?" — without downloading a single spreadsheet.

## Who is this for?

- **Australian residents** comparing safety across regions — people considering a move, parents evaluating suburbs, renters researching areas
- **Journalists** writing about crime trends, needing accurate rates and clear comparisons
- **Researchers and policy analysts** benchmarking states and LGAs using per-capita rates
- **Local government staff** comparing their area against peers and the national median

## Data Sources

| Source | What it provides | Update frequency |
|--------|-------------------|-----------------|
| ABS Recorded Crime – Victims (Cat. 4510.0) | National standardised victim counts by offence type across all 8 states/territories | Annual |
| NSW BOCSAR | LGA-level breakdown for New South Wales (62 offence types, 130+ LGAs) | Quarterly |
| QLD Police Service (data.qld.gov.au) | Police division monthly counts from 2001 | Monthly |
| SA Police (data.sa.gov.au) | Suburb-level crime counts from 2010 | Quarterly |
| ABS ERP by State | Estimated Resident Population for per-capita rate calculation | Annual |

## Features

- **National Overview** — Summary cards, state comparison bar chart, and offence-category breakdown
- **By State** — Select any state to see its full category profile, 10-year trend, and LGA breakdown (NSW)
- **By Category** — Compare all eight states for a single offence type with median-line reference
- **Trends** — Multi-state, multi-category time series chart with interactive state toggles
- **Map** — Leaflet choropleth showing per-capita crime rates geographically
- **Matrix** — Heatmap cross-referencing states against offence categories at a glance
- **Leaderboard** — Sortable ranking of states and NSW LGAs with median comparison
- **Insights** — Auto-detected anomalies: YoY spikes, >2× median outliers, decade trends
- **Glossary** — Inline info tooltips on every jargon term, plus a comprehensive About modal

## Tech Stack

- **Runtime:** Vanilla TypeScript (no framework)
- **Build:** Vite 6
- **Testing:** Vitest (56 tests)
- **Hosting:** GitHub Pages (static, no backend)
- **Data:** Embedded JSON derived from ABS/state sources, updated by a GitHub Actions data pipeline
- **Maps:** Leaflet + CartoDB basemap tiles
- **Charts:** Hand-rolled SVG (no chart library)

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test

# Production build
npm run build

# Preview production build
npm run preview
```

## How it works

Initial data is embedded in `src/data.ts` with rates derived from publicly available ABS Recorded Crime statistics across 2014–2024. A weekly GitHub Actions workflow (`pipeline/collect.mjs` + `pipeline/aggregate.mjs`) fetches fresh CSV/Excel data from QLD's CKAN API, SA's CKAN API, and NSW BOCSAR's open-datasets endpoint, normalises it into the ANZSOC category schema, and commits the updated JSON to `public/data/`. The site loads the data at startup with no backend dependency.

## license

[GNU Affero General Public License v3.0 or later](./LICENSE), with an attribution
requirement added under section 7(b) — see
[ADDITIONAL-TERMS.md](./ADDITIONAL-TERMS.md).

In short: you may run, modify, redistribute and even sell this, but if you
distribute it — or run a modified version where other people can reach it — you
have to publish your source under the same licence and keep the attribution. A
separate commercial licence without those obligations is available on request:
<hi@ben.gy>.

Third-party components keep their own licences — see
[THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md).
