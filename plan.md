# Site Plan: Crime Statistics (AU)

## Overview
- **Name:** Crime Statistics (AU)
- **Repo name:** au-crime
- **Tagline:** Explore, compare, and understand crime across every Australian state and territory — standardised into one interactive dashboard.

## Target Audience
Australian residents, journalists, researchers, policy analysts, and community advocates who want to compare crime rates across states and LGAs using a single consistent interface. Currently, every state reports crime differently — different time periods, terminology, geographic units, and file formats. This site eliminates that friction.

## Value Proposition
Australia has no single place to compare crime data across all states in a standardised way. Each state publishes data in different formats with different offence categories. This site normalises everything to ANZSOC (Australian and New Zealand Standard Offence Classification) categories, computes per-capita rates using ABS population data, and lets users explore trends, compare regions, and spot anomalies — all without downloading a single spreadsheet.

## Data Sources
| Source | URL | What it provides | Update frequency | Auth required? |
|--------|-----|-------------------|-----------------|----------------|
| ABS Recorded Crime – Victims | abs.gov.au/statistics/people/crime-and-justice/recorded-crime-victims | National standardised victim counts by offence type, state/territory level | Annual (Aug) | No |
| ABS Recorded Crime – Offenders | abs.gov.au/statistics/people/crime-and-justice/recorded-crime-offenders | National standardised offender counts by offence type, state/territory level | Annual (Mar) | No |
| NSW BOCSAR | bocsar.nsw.gov.au/statistics-dashboards/open-datasets | LGA/suburb level, 62 offence types, 1995–present | Quarterly | No |
| QLD Police (CKAN) | data.qld.gov.au/organization/police | Police division level, monthly, Jul 2001–present | Monthly | No |
| SA Crime Stats (CKAN) | data.sa.gov.au/data/dataset/crime-statistics | Suburb level, Jul 2010–present | Quarterly | No |
| VIC Crime Statistics Agency | crimestatistics.vic.gov.au | LGA/suburb level, annual | Annual | No |
| ABS ERP by LGA | abs.gov.au | Estimated resident population by LGA for per-capita rates | Annual | No |

## Key Features
1. **National Overview Dashboard** — State-by-state crime rate comparison with per-capita normalisation
2. **Offence Category Explorer** — Drill into ANZSOC categories (assault, robbery, burglary, etc.) and compare across states
3. **Trend Analysis** — Time series showing how each offence type has changed over 10+ years
4. **State Deep-Dive** — Click any state to see its full breakdown by category, year, and sub-region
5. **LGA/Region Leaderboard** — Rank LGAs by crime rate (per capita) within each state
6. **Choropleth Map** — Leaflet map of Australia coloured by crime rate at state and LGA level
7. **Cross-Reference Matrix** — Heatmap of offence types × states showing concentration patterns
8. **Anomaly Insights** — Auto-detected statistical outliers (year-over-year spikes, unusual distributions)

## Target Audience (detailed)
Primary: Australian residents comparing safety across regions — people considering a move, parents choosing a suburb, renters evaluating areas. They use desktop or tablet, moderate tech skill, want fast answers without downloading Excel files.

Secondary: Journalists and researchers writing stories about crime trends. They need accurate, citable data with clear methodology. Desktop users, high tech literacy, want to export or screenshot charts.

Tertiary: Policy analysts and local government staff benchmarking their LGA against peers. Desktop, high literacy, want per-capita rates and trend data.

## Style Direction
**Tone:** Professional/civic — trustworthy, data-dense but not intimidating
**Colour palette:** Navy blue (#1e3a5f) as primary with warm grey backgrounds and teal accents. Clean, authoritative, like an official government data portal but more usable. Red/amber/green for severity indicators.
**UI density:** Balanced — data-dense tables with enough whitespace to breathe
**Dark/light theme:** Light — civic/general audience tool
**Reference sites for tone:** ABS website (authoritative data feel), fuelaustralia.org (clean utility)

## Technical Architecture
- **Stack:** Vanilla TypeScript + Vite
- **Data strategy:** Pipeline (GitHub Actions fetches and normalises data from multiple state APIs)
- **Key libraries:** Leaflet for choropleth map, hand-rolled SVG for charts

## Layout
- Fixed header (48px) with site title, nav tabs for views, info button
- Main content area fills remaining viewport
- Tab-based navigation between views: Overview | By State | By Category | Trends | Map | Matrix | Leaderboard | Insights
- Responsive: tabs become a dropdown on mobile, panels stack vertically

## Pages/Views
1. **Overview** — National summary cards (total offences, rates per 100k, YoY change) + state comparison bar chart
2. **By State** — Select a state, see full category breakdown + trend sparklines + LGA table (where available)
3. **By Category** — Select an offence category, compare rates across all states
4. **Trends** — Multi-line time series chart, selectable states and categories
5. **Map** — Leaflet choropleth at state level (LGA level for states with data)
6. **Matrix** — Heatmap: rows = states, columns = offence categories, cell intensity = rate per 100k
7. **Leaderboard** — Rank states (and LGAs where available) by per-capita crime rate, with filters by category
8. **Insights** — Auto-generated anomaly cards highlighting outliers, spikes, and unusual patterns

## Visualization Strategy
1. **Horizontal bar chart (Overview)** — States ranked by total crime rate per 100k, colour-coded by severity. Instant visual comparison. WHY: The first question everyone asks is "which state has the most crime?"
2. **Stacked bar chart (By Category)** — Offence categories stacked per state showing composition. WHY: Reveals that states with similar totals may have very different crime profiles.
3. **Multi-line time series (Trends)** — Selectable states/categories over 10+ years. WHY: Crime rates change — showing the trend prevents misleading snapshot comparisons.
4. **Choropleth map (Map)** — Australia coloured by crime rate. WHY: Geographic patterns (urban vs rural, coastal vs inland) are invisible in tables.
5. **Heatmap matrix (Matrix)** — States × categories, cell colour intensity = rate. WHY: Instantly reveals which states are outliers in which categories — impossible to see in a table.
6. **Leaderboard table (Leaderboard)** — Sortable, filterable ranking with per-capita rates, median comparison, and colour-coded performance bands. WHY: Answers "how does my area compare?"
7. **Anomaly cards (Insights)** — Statistical outliers surfaced as colour-coded cards. WHY: Most users won't notice a 40% spike in robbery in one state — the insights view does it for them.
8. **State detail panel (By State)** — Category donut + trend sparklines + LGA sub-table. WHY: Deep-dive for users who want to understand one state's crime profile in full.
