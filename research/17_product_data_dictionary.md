# 17. Product Data Dictionary: Seed Data for the Should-Cost / Make-or-Buy Cockpit

**Generated:** 2026-11-08  
**Status:** machine-usable seed data, not a price list.  
**Source of record:** `research/07_benchmarks_rates_data.md`, `research/05_methodology_estimation.md`, `research/10_product_concept.md`, `research/14_regulatory_estimation_pack.md`, `research/15_sector_analogues.md`.  
**Scope:** five JSON files under `data/product/` plus this dictionary.

---

## 0. TL;DR

| File | What it is | Rows | Primary use |
|---|---|---:|---|
| `data/product/rate_cards.json` | RU in-house fully loaded cost per role × grade, monthly and per productive hour | 14 roles × 4 grades = 56 | In-house cost base |
| `data/product/contractor_rate_cards.json` | RU onshore, KZ, India and Poland hourly bands by role × grade | 224 | External cost base |
| `data/product/work_archetypes.json` | 22 IT work archetypes with role mix, P50 hours per unit, O/M/P, complexity drivers and risk templates | 22 | Bottom-up WBS / effort |
| `data/product/analogue_corpus.json` | Published RU IT case prices plus a pending TMK/EIS contract-registry schema | 49 | Reference-class analogues |
| `data/product/coefficients.json` | Statutory burden, NDFL, productive hours, workplace, overheads, margins, contingency, WACC, inflation policy, COCOMO/size tables | 1 object | Shared coefficients |

The data is deliberately **traceable and editable**. Every money row has a `source`; every derived row has a `derivation` or a `productivity_basis`; every proxy is labeled `Proxy`. No FX conversion is performed anywhere. No net and gross figure is silently mixed.

---

## 1. Source-of-record and trace rules

### 1.1 What the data is allowed to use

The seed data reuses the figures and citations already collected in the project research. It does not introduce a new market number without a URL or an explicit policy tag.

| Data type | Source of record | Example |
|---|---|---|
| RU salary medians | `research/07` §1 | Habr Career H1 2026 backend 251,000 RUB/month net |
| RU grade ratios | `research/07` §1.3 | junior 0.55, middle 1.00, senior 1.50, lead 1.90 |
| RU employer burden | `research/07` §3 | 30% up to 2,979,000 RUB/year, 15.1% above |
| KZ employer burden | `research/07` §4 | 6% + 3.5% + 5% + 3%, worked example 147,550 KZT on 1,000,000 |
| Workplace and overheads | `research/07` §5, `research/10` §2-L4 | office 23,686 RUB/month, hardware 6,250, software 8,333, overhead 1.15 |
| Contractor rates | `research/07` §6 | RU middle 3,700–6,600 RUB/h; KZ 15–60 USD/h; India 24–41; Poland 64–76 |
| Productivity | `research/07` §7, `research/05` §1 | ISBSG 6.5/9.7 h/FP, 1.8 h/FP low-code, 20 h/UCP |
| COCOMO and size coefficients | `research/05` §1 | A=2.94, B=0.91, C=3.67, D=0.28, 152 h/PM |
| Risk and overrun priors | `research/05` §3, §7 | P80 contingency, 1%/month scope creep, 20–53% change |
| WACC | `research/05` §6.4, `research/10` §L5 | US software 9.34%; RU/KZ planning 12–18% |
| RU/KZ regulatory procedure | `research/14` | CPI indexation formula, NMCK ≥3 prices, CV ≤33%, KZ 165 h/month |
| Published case prices | `research/07` §9, `research/15` §4 | 1C ERP 1–300M; MES 62M–1B; CV 0.6–5M; DWH 1.5M–1.11B; KII 55k–50.4M |

### 1.2 Three hard rules

1. **No FX conversion.** RUB, KZT and USD are kept as quoted. If a single-currency view is required, apply a central-bank rate on the estimate date and store `{rate, date, source}`. This follows `research/07` §11.1 and the data set's own currency note.
2. **No silent net/gross mixing.** Salary medians in `rate_cards.json` enter as **net** and are converted to gross with the 2026 progressive NDFL. Contractor rates are billing rates, not salaries. Analogue prices are contract prices, not salaries. The basis is stated in every row.
3. **A proxy is not a fact.** A row marked `Proxy` is a documented estimate built from sourced components plus an explicit policy assumption. It must be replaced by an offer, a vendor quote, or the client's actuals before a bid.

---

## 2. File map and dependency graph

```
coefficients.json
   ├── statutory rates, hours, overheads, WACC, COCOMO, size units
   │
rate_cards.json ─────────────┐
   │ in-house ₽/h             │
   │                          ├──> estimate: effort (h) × rate (₽/h)
contractor_rate_cards.json ──┤
   │ external ₽/h or USD/h    │
   │                          │
work_archetypes.json ────────┘
   │ hours per unit, role mix
   │
analogue_corpus.json
   └── reference-class price / scope vectors, used to sanity-check the bottom-up and parametric estimates
```

The intended calculation order is:

1. Size the work in the archetype's native unit (FP, flow, report, bot, ticket, KII object, workload, etc.).
2. Multiply by `p50_hours_per_unit` (or run the O/M/P through PERT / Monte Carlo).
3. Allocate hours to roles using `default_role_mix_pct`.
4. Multiply hours by the in-house rate (`rate_cards.json`) and the contractor rate (`contractor_rate_cards.json`).
5. Add coordination, transition, risk and contingency from `coefficients.json`.
6. Compare with 3+ analogues from `analogue_corpus.json`, normalized with the scope vector.

Do not sum across different units. Convert everything to hours first.

---

## 3. Common conventions

### 3.1 Currency

| Field | Meaning |
|---|---|
| `currency.code` / `currency` | `RUB`, `KZT` or `USD`, as published |
| `unit` | `RUB/month`, `RUB/hour`, `USD/hour`, `KZT/month`, `hours/FP`, etc. |
| `fx_conversion_applied` | Always `false` in this pack |
| `currency_policy` | Per-file statement of the no-FX rule |

`contractor_rate_cards.json` keeps KZ, India and Poland in **USD/hour** because that is how the sources quote them. KZ payroll burden in `coefficients.json` is in **KZT/month**. These are different ledgers; do not combine them without a sourced FX rate.

### 3.2 Confidence legend

| Label | Use it when | Example |
|---|---|---|
| `High` | Primary source, official statute, or named survey states the value directly; role/grade mapping is the source anchor or a direct statutory step. | Habr backend median; 30% contribution rate; ISBSG low-code PDR |
| `Medium` | Arithmetic from High inputs, a blend of two sourced roles, a grade extrapolation, or a reputable secondary source. | Backend senior from the RUIT grade ratio; KZ 1,000,000 worked example |
| `Low` | Blog aggregation, small/biased sample, or a bucket that mixes roles. | Trillion role-by-grade bands; sysadmin from the DevOps/SRE/admin bucket |
| `Proxy` | No defensible public benchmark. Built from sourced components plus a documented planning assumption. | InfoSec net median; per-seat licences; regional office; RPA hours per bot |

### 3.3 Rounding and periods

- `rate_cards.json`: net is rounded to the nearest 100 RUB; gross, contributions, overhead and workplace lines are computed from that rounded net; outputs are integers. Sums may differ by ±2 RUB from unrounded arithmetic.
- `work_archetypes.json`: P50 is the most-likely value; `pert.expected_hours` and `pert.sigma_hours` are rounded to 2 decimals.
- `analogue_corpus.json`: `price_mid` is the published midpoint when the source gives one; otherwise it is the arithmetic midpoint of the published range and the note says so.
- Periods are stated per row (`2023`, `2025-H2`, `2026`, etc.). A 2023 analogue is not a 2026 price.

---

## 4. `rate_cards.json` — RU in-house fully loaded cost

### 4.1 Purpose

Turns a **net take-home role median** into a **fully loaded monthly cost** and a **RUB per productive hour** rate for the in-house (ТМК++ / ДИАЙПИ) cost base.

### 4.2 Top-level schema

| Field | Type | Meaning |
|---|---|---|
| `meta.schema_version` | string | `1.0` |
| `meta.generated` | string | Generation date |
| `meta.geography` | string | RU; Moscow Class B default |
| `meta.currency` | object | RUB only; no FX |
| `meta.basis_chain` | string | net → gross → employer payroll → overhead → workplace → hour |
| `meta.provenance` | object | Source-of-record, salary/statutory/cost-component URLs, licence note |
| `meta.confidence_legend` | object | High / Medium / Low / Proxy |
| `meta.derivation_policy` | object | NDFL brackets, contribution formula, overhead 1.15, workplace arithmetic, 120 h/month, grade ratios, rounding, regional policy |
| `meta.recalibration` | object | How to replace the base with real offers |
| `roles[]` | array | 14 role objects |

### 4.3 Role object schema

| Field | Type | Meaning |
|---|---|---|
| `role_id` | string | Stable key; used by `work_archetypes.json` |
| `role_ru` | string | Russian label |
| `role_en` | string | English label |
| `anchor_grade` | enum | Grade at which the source median is placed: `middle`, `senior` or `lead` |
| `base_net_month` | number | Source median, RUB/month, **net** |
| `source` | URL | Salary source |
| `source_date` | string | Publication/access date |
| `source_basis` | string | net/gross, self-reported/offered, period |
| `confidence` | enum | Role-level confidence |
| `note` | string | Caveats and alternatives |
| `alternative_sources` | array | Cross-checks (e.g. BA-only 167k) |
| `grades[]` | array | Four grade rows |

### 4.4 Grade row schema

| Field | Meaning |
|---|---|
| `grade` | `junior`, `middle`, `senior`, `lead` |
| `grade_ratio` | RUIT-derived ratio: 0.55 / 1.00 / 1.50 / 1.90 |
| `grade_scale_vs_anchor` | `grade_ratio / anchor_ratio` |
| `net_month` | Rounded net RUB/month |
| `ndfl_month` | Gross minus net |
| `gross_month` | Gross RUB/month after progressive NDFL gross-up |
| `employer_contrib_month` | 30%/15.1% statutory contributions |
| `employer_contrib_effective_pct` | Contributions ÷ gross |
| `employer_payroll_month` | Gross + contributions |
| `employer_payroll_multiplier_vs_gross` | Payroll ÷ gross |
| `overhead_multiplier` | 1.15 |
| `overhead_month` | Payroll × 0.15 |
| `office_month` | 23,686 |
| `hardware_month` | 6,250 |
| `software_month` | 8,333 |
| `workplace_month` | Sum of the three |
| `fully_loaded_month` | Payroll + overhead + workplace |
| `fully_loaded_multiplier_vs_net` | Fully loaded ÷ net |
| `productive_hours_month` | 120 |
| `fully_loaded_hour` | Fully loaded ÷ 120 |
| `confidence` | Row confidence |
| `source`, `source_date`, `provenance_file` | Traceability |
| `derivation` | Human-readable arithmetic chain |

### 4.5 The derivation chain, exactly

For each role and grade:

```
1. raw_net   = base_net_month × (grade_ratio / anchor_ratio)
2. net       = round(raw_net / 100) × 100
3. gross     = solve_gross(net × 12) using progressive NDFL
4. ndfl      = gross - net
5. contrib   = [0.30 × min(gross×12, 2,979,000) + 0.151 × max(0, gross×12 - 2,979,000)] / 12
6. payroll   = gross + contrib
7. overhead  = payroll × 0.15
8. workplace = 23,686 + 6,250 + 8,333 = 38,269
9. fully     = payroll + overhead + workplace
10. hour     = fully / 120
```

**Gross-up is not `net / 0.87` above 2.4M RUB/year.** The solver applies the 2026 brackets: 13% to 2.4M, 15% 2.4–5M, 18% 5–20M, 20% 20–50M, 22% above 50M. This is why a 500k net salary does not gross up to 574.7k.

**Contributions are capped.** The task brief asked for “×1.30 employer insurance”. The exact formula is used instead of a flat 1.30 because above 2,979,000 RUB/year the marginal rate is 15.1%, so a flat 1.30 would overstate senior and architect cost. The effective contribution rate is shown in every row (e.g. 27.83% at a 290,588 RUB gross).

**Overhead 1.15** is a project policy constant from `research/10` §2-L4 (“соцпакет, обучение, управление ≈ 10–18%”), not a market benchmark. It is applied to employer payroll before the workplace lines.

**Workplace lines:**

| Line | Value | Derivation | Confidence |
|---|---:|---|---|
| Office | 23,686 RUB/month | Moscow Class B rent 22,423 + OPEX 6,000 RUB/m²/year at 10 m² = 284,230/12 | High |
| Hardware | 6,250 RUB/month | Planning value inside 4,932–8,265 derived from 177,539–297,539 RUB per 36 months | Medium |
| Software | 8,333 RUB/month | 100,000 RUB/developer/year inside the 50,000–150,000 proxy range | Proxy |

The office line is Moscow. For a non-Moscow employer, replace it with a local lease quote and mark the result `Proxy`; `research/07` §5.1 has no sourced regional office figure.

The three workplace lines are **fixed monthly amounts**, not a percentage of salary. At a junior salary they can push `fully_loaded_multiplier_vs_net` above 2.0; at a senior salary the multiplier falls. Do not apply a single “1.5x net” rule across grades. Look at `fully_loaded_multiplier_vs_net` per row.

### 4.6 Worked example: backend, middle

From `rate_cards.json` (`roles[2].grades[1]`):

```
net             = 251,000 RUB/month
gross           = 290,588 RUB/month   (NDFL 39,588)
contributions   = 80,868 RUB/month    (effective 27.83%)
payroll         = 371,456 RUB/month
overhead 15%    = 55,718 RUB/month
office          = 23,686
hardware        = 6,250
software        = 8,333
workplace       = 38,269
fully loaded    = 465,443 RUB/month
per hour        = 465,443 / 120 = 3,879 RUB/h
```

`research/10` §2-L4 gives ≈460k RUB/month and ≈3,830 RUB/h for a 250k net backend. The difference is the 251k source median and the exact capped contributions; the result is consistent with the Klerk in-house middle band of 3,100–5,600 RUB/h.

### 4.7 Role and grade results (middle row, for orientation)

| Role | Anchor | Junior net | Middle net | Senior net | Lead net | Middle ₽/h | Confidence |
|---|---|---:|---:|---:|---:|---:|---|
| analyst_ba_sa | middle | 137,500 | 250,000 | 375,000 | 475,000 | 3,866 | Medium |
| 1c_developer | middle | 108,400 | 197,000 | 295,500 | 374,300 | 3,148 | High |
| backend | middle | 138,000 | 251,000 | 376,500 | 476,900 | 3,879 | High |
| frontend | middle | 123,800 | 225,000 | 337,500 | 427,500 | 3,541 | High |
| mobile | middle | 162,200 | 295,000 | 442,500 | 560,500 | 4,450 | High |
| qa_manual | middle | 62,200 | 113,100 | 169,600 | 214,900 | 1,938 | Proxy |
| qa_auto | middle | 110,100 | 200,100 | 300,200 | 380,200 | 3,193 | Medium |
| devops_sre | middle | 134,800 | 245,000 | 367,500 | 465,500 | 3,801 | High |
| architect | senior | 184,800 | 336,000 | 504,000 | 638,400 | 4,982 | Medium |
| pm | lead | 95,500 | 173,700 | 260,500 | 330,000 | 2,806 | Medium |
| ux | middle | 63,300 | 115,000 | 172,500 | 218,500 | 1,966 | High |
| infosec | middle | 110,000 | 200,000 | 300,000 | 380,000 | 3,192 | Proxy |
| data_engineer | middle | 140,200 | 255,000 | 382,500 | 484,500 | 3,931 | High |
| sysadmin | senior | 89,800 | 163,300 | 245,000 | 310,300 | 2,657 | Low |

The full 56-row output is in the JSON. The table above is a reading aid, not a second source.

Not every role has a Habr Career H1 2026 median. Habr H1 2026 covers backend, frontend, mobile, architect and 1C; QA, analyst, DevOps, data engineer, BA and PM come from RUIT or thecode.media, UX from Habr H1 2025, infosec from a CNews proxy, and manual QA from a gross-band conversion. Each role row states its own `source`, `source_date` and `source_basis`; do not assume they are all the same cut. This is deliberate: the pack uses the best sourced row in `research/07`, not a fabricated H1 2026 number for a role Habr did not publish.

### 4.8 Important role-specific caveats

| Role | Caveat |
|---|---|
| `analyst_ba_sa` | Blended BA/SA role. The 250k base is the RUIT system/business/data analyst median; a BA-only median is 167k. The blend is a policy choice, so the row is `Medium`, not `High`. |
| `1c_developer` | Habr H1 2026 median. The contractor 1C band is separate (1,500–4,500 RUB/h). |
| `backend` | Java absolute is a proxy equal to the backend median (`research/07` §1.5). |
| `mobile` | iOS/Android aggregate. ISBSG reports mobile as the lowest-productivity platform; the productivity premium is handled in `work_archetypes.json`, not here. |
| `qa_manual` | Proxy. Gross midpoint 130k converted to net 113.1k at 13% NDFL. |
| `qa_auto` | Gross midpoint 230k converted to net 200.1k; matches the RUIT all-QA median. |
| `architect` | Anchor is `senior` because the source median is a senior/lead bucket. Lead is extrapolated at 1.90. |
| `pm` | Technical PM / team lead bucket. A non-technical PM is a different, lower role (about 130k gross vacancy median). |
| `ux` | H1 2025 cut, older than the H1 2026 role medians. |
| `infosec` | Proxy 150–250k net. Replace with 10–20 offers. |
| `sysadmin` | Low confidence: the source row is “DevOps, SRE, admin” 245k net, not a pure sysadmin median. Anchor is `senior` to avoid overstating juniors. |

---

## 5. `contractor_rate_cards.json` — external hourly bands

### 5.1 Purpose

Provides a machine-usable external cost base for RU onshore, KZ/nearshore, India offshore and Poland/EU nearshore, by role and grade, with basis and VAT flags.

### 5.2 Top-level schema

| Field | Meaning |
|---|---|
| `meta.currency_policy` | RUB for RU; USD for KZ/IN/PL as quoted; no FX |
| `meta.role_adjustment_policy` | No role multiplier: public rate cards are published by grade, not by role |
| `meta.vat_policy` | Every row carries `vat_included`, `vat_rate_pct`, `vat_flag` |
| `meta.basis_definitions` | T&M, fixed price, dedicated team |
| `meta.dedicated_team_policy` | Monthly all-in is a different unit; not summed with hourly rows |
| `roles[]` | 14 role ids |
| `grades[]` | junior / middle / senior / lead |
| `regions{}` | Region metadata (label, currency, unit, VAT) |
| `bands[]` | 224 role × grade × region rows |
| `dedicated_team_monthly[]` | RU 1 FTE; KZ 5/10/25+ team and setup |

### 5.3 Band row schema

| Field | Meaning |
|---|---|
| `id` | Stable key, e.g. `rate_ru_backend_middle` |
| `geo` | `RU`, `KZ`, `IN`, `PL` |
| `role_id` | Matches `rate_cards.json` |
| `grade` | junior / middle / senior / lead |
| `currency`, `unit` | RUB/hour or USD/hour |
| `rate_low/mid/high` | Recommended band |
| `open_ended` | `true` when the source says “X and above”; `high` is the last published bound, not a cap |
| `market_grade_band` | The sourced generic grade band with its own source, date and confidence |
| `role_specific_override` | `true` only for 1C |
| `rate_source`, `rate_source_date`, `rate_basis_note` | Traceability |
| `pricing_basis` | `["T&M","fixed_price","dedicated_team"]` |
| `default_basis` | `T&M` |
| `fixed_price_risk_load_pct` | `[15, 30]` from `research/10` §2-L4 |
| `vat_included` | `false` for all rows in this pack |
| `vat_rate_pct` | `20` for RU; `null` for KZ/IN/PL because the local rate is not in the research pack |
| `vat_flag` | `excl_vat` or `excl_vat_local_vat_not_sourced` |
| `confidence` | High / Medium / Low / Proxy |
| `sourced_cross_checks` | Optional: CNews day-rate point estimates for developer and PM |
| `note` | Caveats |

### 5.4 Bands used

| Region | Junior | Middle | Senior | Lead | Source |
|---|---:|---:|---:|---:|---|
| RU | 1,500–3,200 | 3,700–6,600 | 6,700+ | 6,700+ | Klerk; DINS is a lower independent ledger |
| KZ | 15–20 | 25–49 | 35–50 | 45–60 | osn.kz; sigma/Wadline for middle |
| India | 24–31 | 25–49 | 31–41 | 41–49 | Accelerance; Clutch for middle/lead |
| Poland | 31–39 | 45–60 | 64–76 | 76–90 | Accelerance; middle/lead are proxies |

RU senior and lead are open-ended. `high = 6,700` is the last published bound, not a ceiling. The DINS team-lead band (4,500+) is a different, lower survey ledger; do not average it with Klerk’s senior band.

### 5.5 Why there is no role multiplier

A role salary ratio is a **payroll** fact. A billing rate is a **market** fact. Applying the salary ratio of an architect to a middle developer’s rate would silently invent a rate. The pack therefore applies the sourced grade band to every role, and role differentiation comes from assigning the role to a grade:

- architect → senior/lead
- PM → senior/lead
- QA manual → junior/middle
- UX → middle
- sysadmin → middle/senior
- 1C → sourced 1C role band, not a grade ladder

The only role-specific override is 1C: 1,500–4,500 RUB/h (2026). The same band is shown for all four grades because the source publishes a role band, not a grade ladder. Do not read it as a grade ladder. Because the grade mapping is an assumption, all four 1C rows are marked `Medium`, while the underlying 1C role band is sourced `High`.

### 5.6 Basis and VAT

| Basis | Meaning | Risk/price treatment |
|---|---|---|
| T&M | Hourly rate × actual hours | Customer carries scope risk; default |
| Fixed price | Vendor carries scope risk | Add the sourced 15–30% fixed-price risk load; require fixed scope and acceptance criteria |
| Dedicated team | Monthly all-in team price | Use `dedicated_team_monthly`; do not multiply an hourly rate by 160 h without checking scope |

VAT: RU rates are exclusive of 20% VAT (`research/10` §2-L4). KZ, India and Poland rates are quoted USD/hour excl. VAT, but the local VAT/GST rate is **not in the research pack**; `vat_rate_pct` is `null` and must be filled from a sourced local rate. Never silently add VAT.

### 5.7 Dedicated team rows

| Region | Team | Price | Source |
|---|---|---:|---|
| RU | 1 FTE middle | 300,000–500,000 RUB/month | `research/07` §6.3, derived from Klerk 3× rule |
| KZ | 5 people | 20,000–30,000 USD/month | osn.kz |
| KZ | 10 people | 40,000–60,000 USD/month | osn.kz |
| KZ | 25+ people | 100,000+ USD/month | osn.kz |
| KZ setup | one-time | 10,000–50,000 USD | osn.kz |

These are monthly all-in and must not be summed with hourly rows.

---

## 6. `work_archetypes.json` — effort norms

### 6.1 Purpose

Provides 22 planning templates for bottom-up WBS. Each archetype has a native unit, a P50 hours-per-unit value, an O/M/P spread, a default role mix, COCOMO complexity drivers, and risk templates.

### 6.2 Top-level schema

| Field | Meaning |
|---|---|
| `meta.role_mix_policy` | Role mixes are templates, not benchmarks |
| `meta.unit_policy` | Do not sum different units; convert to hours first |
| `meta.three_point_policy` | P50 is most likely, not a statistical median; use PERT/Monte Carlo |
| `meta.recalibration` | How to replace the norms with actuals |
| `meta.default_grade_by_role` | Default grade for costing a role mix (e.g. architect=senior, PM=lead) |
| `role_ids[]` | 14 role ids matching `rate_cards.json` |
| `risk_library{}` | 12 reusable risk templates |
| `archetypes[]` | 22 archetype objects |

### 6.3 Archetype schema

| Field | Meaning |
|---|---|
| `id` | Stable key |
| `name_ru`, `name_en` | Labels |
| `category` | integration / 1c / development / mobile / automation / bi / mes / cv / infrastructure / security / support / erp / data / ai |
| `unit` | Native unit: FP, integration_flow, report, bot, control_point, workload, kii_object, ticket, entity, source_system, endpoint, intent, service, screen |
| `unit_definition` | What one unit includes |
| `p50_hours_per_unit` | Most-likely hours per unit |
| `three_point` | `{optimistic, most_likely, pessimistic}` |
| `pert` | `expected_hours`, `sigma_hours`, formula |
| `productivity_basis` | Method, derivation, source URLs, confidence |
| `default_role_mix_pct` | Role → % of hours; sums to 100 |
| `complexity_drivers` | COCOMO driver, rating, multiplier, effect, source |
| `risk_template_ids`, `risk_templates` | Risk IDs and resolved objects |
| `typical_unit_count` | Low/mid/high planning count; a sizing hint, not a benchmark |
| `secondary_units` | Alternate unit norms where useful |
| `source`, `provenance_file`, `confidence` | Traceability |
| `notes` | Usage caveats |

### 6.4 The 22 archetypes

| # | ID | Unit | P50 h/unit | O / M / P | PERT h | Confidence |
|---:|---|---|---:|---|---:|---|
| 1 | integration_1c_wms | integration_flow | 120 | 70 / 120 / 220 | 128.3 | Proxy |
| 2 | functional_extension_1c | FP | 10 | 6.5 / 10 / 16 | 10.4 | Proxy |
| 3 | new_web_app | FP | 8.7 | 3.2 / 8.7 / 24.2 | 10.4 | Medium |
| 4 | mobile_app | FP | 12 | 6.5 / 12 / 24.2 | 13.1 | Proxy |
| 5 | rpa_bot | bot | 120 | 60 / 120 / 240 | 130.0 | Proxy |
| 6 | bi_report_pack | report | 40 | 16 / 40 / 90 | 44.3 | Proxy |
| 7 | mes_module | FP | 12 | 6.5 / 12 / 24.2 | 13.1 | Proxy |
| 8 | cv_quality_control | control_point | 180 | 80 / 180 / 400 | 200.0 | Proxy |
| 9 | infrastructure_migration | workload | 8 | 4 / 8 / 20 | 9.3 | Proxy |
| 10 | security_kii_compliance | kii_object | 160 | 60 / 160 / 400 | 183.3 | Medium |
| 11 | l2_l3_support | ticket | 3 | 1 / 3 / 10 | 3.8 | Proxy |
| 12 | sap_dev | FP | 16.7 | 8 / 16.7 / 30 | 17.5 | High |
| 13 | data_migration | entity | 24 | 8 / 24 / 60 | 27.3 | Proxy |
| 14 | low_code | FP | 1.8 | 0.9 / 1.8 / 2.4 | 1.75 | High |
| 15 | api_gateway | endpoint | 12 | 4 / 12 / 30 | 13.7 | Proxy |
| 16 | dwh_build | source_system | 80 | 40 / 80 / 180 | 90.0 | Proxy |
| 17 | erp_1c_rollout | FP | 12 | 6.5 / 12 / 24 | 13.1 | Proxy |
| 18 | legacy_modernization | FP | 12 | 6.5 / 12 / 24.2 | 13.1 | Proxy |
| 19 | portal_gis | FP | 9.7 | 6.5 / 9.7 / 13.7 | 9.8 | High |
| 20 | chatbot_assistant | intent | 16 | 6 / 16 / 40 | 18.3 | Proxy |
| 21 | document_management | FP | 8.3 | 3.2 / 8.3 / 13.7 | 8.4 | Medium |
| 22 | observability_monitoring | service | 16 | 6 / 16 / 40 | 18.3 | Proxy |

### 6.5 Which norms are actually sourced

| Norm | Status | Source |
|---|---|---|
| SAP/ABAP 16.7 h/FP | Directly sourced | Lavazza et al. 2018 (ABAP 0.060 FP/h) |
| Low-code 1.8 h/FP median, 2.4 P90 | Directly sourced | ISBSG low-code 2021 |
| Java 8.7 h/FP median, 24.2 P90 | Directly sourced | ISBSG Java 2021 |
| Government 9.7 h/FP median | Directly sourced | ISBSG government |
| Traditional 8.3 h/FP median, 3.2 P10 | Directly sourced | ISBSG traditional/low-code |
| 20 h/UCP; 15–30 range; 28/36 | Directly sourced | Karner, Ribu, Schneider-Winters via `research/05` §1.4 |
| All other hours-per-unit | **Proxy or Medium** | Derived from FP/UCP/price anchors plus explicit factors; see each `productivity_basis.derivation` |

A proxy is not a hidden fact. For example, `rpa_bot` 120 h/bot is derived as 6–10 UCP × 20 h/UCP; the UCP range is a planning assumption. `cv_quality_control` 180 h/point is derived from published 8–16-week pilots with a 3–5-person team, not from an effort study.

`meta.assumption_register` lists every planning factor used to build a proxy norm: the `1.45` mobile premium, the `1.2` MES factor, the `1.2` ERP org-change factor, the `1.35` legacy reverse-engineering factor, the 1C FP norm, the FP/UCP-per-unit ranges and the role mixes. Each entry gives its `value`, `used_in`, `status` and what to `replace_with`. If a factor is not in that register, it is not used in a norm.

### 6.6 Role mixes

Role mixes are **templates**, not benchmarks. They are built from the project’s integration example in `research/10` §2-L3 (analyst 15%, app dev 45%, system programmer 20%, QA 12%, PM 8%) and professional judgement. Every mix sums to 100, and every role id exists in `rate_cards.json`.

Example, `integration_1c_wms`:

```json
{"analyst_ba_sa": 15, "1c_developer": 45, "backend": 20, "qa_auto": 12, "pm": 8}
```

If the client’s actual staffing differs, replace the mix. Do not average two mixes.

To convert a role mix to money, pair each role with a grade. `meta.default_grade_by_role` gives the planning default (architect=senior, PM=lead, sysadmin=senior, others=middle). These are the same anchors used in `rate_cards.json`. If the actual grade mix is known, replace it; a junior QA and a senior QA must not be priced at the same grade.

### 6.7 Complexity drivers

Each driver is a COCOMO II.2000 post-architecture multiplier from `research/05` Table “Post-Architecture effort multipliers, 17 drivers”. Use them only if you are running COCOMO or a multiplicative model. Do **not** apply a COCOMO multiplier on top of an ISBSG PDR that already reflects the same complexity; that would double-count.

Example, integration:

| Driver | Rating | Multiplier | Why |
|---|---|---:|---|
| DATA | High | 1.14 | Multiple master-data objects and field mappings |
| CPLX | High | 1.17 | Bidirectional flows, error handling, idempotency |
| RELY | High | 1.10 | Inventory errors are operationally visible |
| PVOL | High | 1.15 | 1C and WMS release cycles differ |

### 6.8 Risk templates

The `risk_library` contains 12 templates. Each has `probability`, `impact_pct_low/mid/high`, `mechanism`, `mitigation` and `source`. Probabilities and impact ranges are **planning estimates** unless the source is a published statistic (scope creep, schedule compression). The archetype’s `risk_templates` array resolves its `risk_template_ids`.

Use them as a starting register, not as a calibrated loss distribution. For a formal bid, convert probability × impact to EMV and run Monte Carlo.

---

## 7. `analogue_corpus.json` — reference-class prices

### 7.1 Purpose

Stores published RU IT case prices and a pending merge of TMK/EIS contract-registry rows. It is a **price** corpus, not an effort corpus. Only one row has a published effort count.

### 7.2 Top-level schema

| Field | Meaning |
|---|---|
| `meta.currency_policy` | RUB/USD as published; no FX |
| `meta.basis` | Contract price, grant, total investment, list price, service price, project estimate |
| `meta.merge_policy` | Expected file, merge key, required fields, dedupe rule |
| `meta.row_schema` | Field-by-field schema |
| `analogues[]` | 49 published case rows |
| `tmk_eis_schema_stub` | Field/type stub for the sibling procurement-research output |
| `tmk_eis_rows[]` | Empty until the file exists |
| `merge_status` | File presence, checked paths, action |

### 7.3 Analogue row schema

| Field | Meaning |
|---|---|
| `id` | Stable key |
| `corpus_source` | `published_case` or `tmk_eis` |
| `project_type` | erp_1c / erp_1c_license / sap_migration / mes / cv_qc / predictive_maintenance / dwh_bi / kii_security / it_portfolio |
| `title` | Case name |
| `year` | Price year |
| `currency` | RUB or USD |
| `price_low/mid/high` | Published currency; `null` when not disclosed |
| `price_basis` | contract_price / grant_amount / total_investment / total_project_amount / total_project_cost / list_price / service_price / fixed_offer / project_estimate / project_budget / rnd_budget / survey_case_estimate / expert_estimate / it_portfolio / not_disclosed |
| `vat_included` | true / false / null |
| `vat_note` | VAT caveat |
| `effort_hours` | Published effort, if any |
| `normalized_rub_per_hour_low/high` | Only when both price and effort are published |
| `scope_vector` | users, integrations, sites, reports, data_volume, duration_months, includes_hardware, includes_licenses, includes_support, objects, work_centers, cameras |
| `related_amounts` | Grant, stage, portfolio or per-unit amounts |
| `source`, `source_date`, `confidence` | Traceability |
| `normalization` | fx_conversion_applied=false, inflation_adjustment_required, scope_normalized, note |
| `note` | Caveats |

### 7.4 What the 49 rows cover

| Project type | Rows | Examples |
|---|---:|---|
| ERP / 1C / SAP | 12 | 1C ERP 1–300M; complex plant 100–109M with 26,000 h; SAP→1C 9.5M–1B |
| MES | 7 | PhosAgro grant 318.4M; Severstal 1B; Kazan total 226.3M; GAZ 513M; one scope-only case |
| CV / machine vision | 11 | Typical 0.6–5M; Dobroflot 900k/4 points; Severstal quality 2B |
| Predictive maintenance | 4 | Pilot 0.9–4M; typical 5–10M; full 100M–2B |
| DWH / BI | 6 | SMB 1.5–2M; Rosatom 1.11B; VTB24 33M USD |
| KII / security | 8 | Categorization 55k–277.8k; protection from 900k; GosSOPKA 50.4M |
| IT portfolio | 1 | MMK 0.8B digital portfolio, 95 projects over 2020–2024 |

### 7.5 Price is not effort

Normalize before comparing:

1. Convert the price to a common year with a sourced CPI index (not the 8% policy default).
2. If the currency is USD, apply a sourced FX rate and record it.
3. Divide by a sourced hours count or a function-point count. Only `an_1c_erp_complex_plant` has published hours; most rows do not.
4. Use the scope vector: users, integrations, sites, reports, data volume, duration, hardware, licences, support.
5. Do not pool `grant_amount` with `contract_price`, or `total_investment` with `contract_price`.

Examples of what goes wrong without normalization:

- The DWH range is 1.5M RUB for an SMB BI pack to 1.11B RUB for Rosatom. The label is the same; the scope is not.
- The PhosAgro 318.4M is grant co-financing at 20/80; it is not the total project cost.
- The Aeroflot 1B SAP→1C is an enterprise outlier; use it as a ceiling, not a median.

### 7.6 TMK/EIS merge window

The sibling procurement-research task was expected to write:

```
/home/koluchiy/Documents/RadioHack4.0/data/tmk_it_contracts.json
```

At generation time the file was **absent**. `analogue_corpus.json` therefore contains:

- `tmk_eis_schema_stub` with the required fields from `research/07` §8.1 (`registry_number`, `contract_id`, `ikz`, customer/supplier INN, subject, price, price type, dates, OKPD2 62.*, source URL);
- `tmk_eis_rows: []`;
- `merge_status.file_present: false`.

Merge procedure when the file appears:

1. Load both JSON files.
2. Key by `registry_number`; fall back to `contract_id`; fall back to `id`.
3. Keep the published-case row untouched; append new registry rows with `corpus_source: "tmk_eis"` and `provenance_file` pointing to the registry file.
4. Deduplicate by the merge key; contract registries repeat rows across revisions.
5. Add the scope vector. The registry gives price, customer, supplier, subject and dates, but not effort, users, integrations or whether hardware is included.
6. Recompute `analogue_count`.
7. Do not pool registry rows with published cases in one median until both are normalized to the same basis and scope.

A skeleton registry row:

```json
{
  "registry_number": "string",
  "contract_id": "string",
  "ikz": "string",
  "customer": "string",
  "customer_inn": "string",
  "supplier": "string",
  "supplier_inn": "string",
  "subject": "string",
  "price_rub": 0,
  "price_type": "string",
  "currency": "RUB",
  "sign_date": "YYYY-MM-DD",
  "execution_date": "YYYY-MM-DD",
  "okpd2": "62.01",
  "source_url": "string"
}
```

---

## 8. `coefficients.json` — shared coefficients

### 8.1 Purpose

One place for the coefficients that would otherwise be copy-pasted into every estimate: statutory burden, NDFL, productive hours, workplace, overheads, coordination, margins, contingency, WACC, inflation policy, taxes, grade ratios, productivity norms and COCOMO/size tables.

### 8.2 Sections

| Section | Contents |
|---|---|
| `employer_burden_ru` | NDFL brackets, 30%/15.1% contributions, cap 2,979,000, IT preferential 15%/7.6%, injury 0.2–8.5%, worked examples, severance |
| `employer_burden_kz` | 6% ST, 3.5% OPVR, 5% SO cap 7 MW, 3% OSMS, 10% OPV, 2% VOSMS, 10/15% IPN, minimum wage 85,000, MRP 4,325, worked examples |
| `productive_hours` | 120 sellable h/month, 1,320 productive h/year, 152 COCOMO h/PM, 2,080 paid h, utilization 0.65–0.75, leave 0.10–0.15 |
| `workplace` | Office 22,423 + 6,000 RUB/m²/year; 23,686/month at 10 m²; 28,423 at 12 m²; leased 36–52k; co-working 56,228; hardware 4,932–8,265/month; software 50–150k/year; overhead 1.15; full-cost 1.30–1.65 gross / 1.50–1.85 net |
| `coordination_overhead` | 3% selection, $300k/year management, 5–15% transition, 5–30% governance loss, 10–25% default coordination, 190% hidden-cost outlier |
| `vendor_margin` | 35–50% markup, 65–75% scarce, 20–35% gross margin, 18–30% agency, 10–20% pass-through, margin↔markup formulas |
| `contingency_policy` | P80 default, P90 contractual, P80−P50 primary, P80−base legacy, 15–30% flat fallback, 0.5 correlation, lognormal formulas, joint-confidence warning |
| `wacc` | 9.34% US software, 7.83% computer services, 7.00% information services, 8.69% engineering, 6.96% total market, 10–15% emerging, 12–18% RU/KZ, default 12% |
| `inflation` | RU CPI indexation formula, KZ 3-year procedure, 2025 IT salary +10%, 8%/year policy default, null CPI values awaiting a feed |
| `taxes` | RU VAT 20%, KZ/India/Poland VAT/GST null, KZ IPN 10/15% |
| `grade_ratios` | 0.55 / 1.00 / 1.50 / 1.90 |
| `productivity_norms` | ISBSG PDR, FP/PM, UCP, language FP/PM, story-point warning, scope creep |
| `size_units` | IFPUG weights, UCP weights/TCF/ECF, object points, COCOMO II.2000 A/B/C/D, scale factors, 17 EMs, COCOMO 81, LOC/FP, conversion warnings |
| `risk_and_overrun_priors` | Flyvbjerg 27%/200%, McKinsey 45%/66%, cone of uncertainty, schedule compression t⁻⁴ |
| `fx_policy` | No conversion; record rate/date/source |
| `sensitivity_policy` | 10% triangulation threshold, 30% method divergence, 0.50/0.20/0.30 default weights, P50/P75/P80 |

### 8.3 The three coefficients that change the answer most

1. **Net-to-gross basis.** If you import a gross salary into `base_net_month`, you understate gross by 13–22% and then understate employer cost by another 27–30%. `rate_cards.json` explicitly marks the basis; do not mix.
2. **Contribution cap.** A flat 1.30 is wrong for salaries above 2,979,000 RUB/year. Use the capped formula; the effective rate falls from 30% to 15.1% on the excess.
3. **Hours per FP.** The “7–8 FP per person-month” claim is a misreading. ISBSG’s headline is 6.5–9.7 **hours per FP**, which yields 16.5–24.6 FP per 160-hour month. Do not use 7–8 FP/month.

### 8.4 Inflation: why the values are null

`research/14` gives the CPI indexation **formula** and the legal procedure, not the monthly CPI series. The pack does not invent CPI values. `inflation.ru_cpi_indexation.values_by_year` contains `null` and `status: requires_rosstat_feed`; `kz_inflation` likewise requires the stat.gov.kz feed. The only usable planning numbers are:

- 2025 IT salary growth +10% (`research/15`, hh.ru), `Medium`;
- 2026 project rate inflation 8%/year (`research/08` UI assumption), `Proxy` / `policy_assumption`.

Use the 8% default only for scenario mode. For a formal NMCK justification, use the Rosstat series and the `research/14` formula.

---

## 9. How to recalibrate from real offers

### 9.1 In-house rate cards

**Input:** 10–20 offers per role/grade, with city, date, basis (net or gross), and source.

1. If offers are **gross**, convert to net with the 2026 NDFL brackets before entering them. Do not put a gross number into `base_net_month`.
2. Compute the median net for the role at its `anchor_grade`. Replace `base_net_month`.
3. Keep `anchor_grade` and `grade_ratios` unless the client has its own grade ladder.
4. Rerun the chain in §4.5.
5. Update `source`, `source_date`, `confidence` and `note`. If the sample is the client’s own offers, set `confidence: "High"` only if the sample is ≥10 and the basis is known.
6. Recompute `fully_loaded_hour` and compare with the market band (Klerk in-house 1,300–2,700 junior; 3,100–5,600 middle; 5,700+ senior). A large gap is a signal, not an error.

**Worked recalibration.** Suppose the client’s middle backend offer median is **280,000 RUB net/month** instead of 251,000:

```
gross       = 324,706
NDFL        = 44,706
contrib     = 86,020
payroll     = 410,726
overhead    = 61,609
workplace   = 38,269
fully       = 510,604 RUB/month
per hour    = 4,255 RUB/h
```

This stays inside the Klerk middle in-house band (3,100–5,600), which is a sanity check, not a validation.

### 9.2 Contractor rate cards

1. Collect at least **3 vendor quotes** per region/grade. `research/14` notes the NMCK rule of ≥3 prices and CV ≤33%.
2. Replace `market_grade_band` with the quoted low/mid/high. Keep `role_id` and `grade`.
3. Record the quote date, currency and VAT flag.
4. If the quote is in a local currency, record the FX rate and date; do not convert without a sourced rate.
5. If the quote is a fixed price, do not overwrite the T&M band; add a separate fixed-price row and apply the 15–30% risk load.
6. If the quote is a dedicated team, add a `dedicated_team_monthly` row; do not convert it to an hourly rate by dividing by 160 without checking scope.

### 9.3 Work archetypes

1. Select 5–10 completed projects per archetype.
2. For each project, record unit count, actual hours, role mix, and whether the scope matches the archetype definition.
3. Replace `p50_hours_per_unit` with the median actual hours per unit.
4. Replace the O/M/P spread with the project’s P10/P50/P90 or with expert three-point estimates. Keep O ≤ M ≤ P.
5. Recompute `pert.expected_hours` and `sigma_hours`.
6. Report `MMRE`, `MdMRE` and `PRED(25)` from `research/05` §9.4. A model that cannot hit PRED(25) ≥ 50% on the client’s own history is not ready for a bid.
7. If the actual role mix differs by more than 10 percentage points from the template, update the mix. Do not silently average two mixes.

### 9.4 Analogues

1. Add the new contract with its `source`, `source_date`, price, price basis, VAT flag and scope vector.
2. Normalize the price to the estimate year with a sourced CPI index.
3. If the price is USD, apply a sourced FX rate and record it.
4. If effort is published, compute RUB/hour; otherwise leave `normalized_rub_per_hour_*` null and use the scope vector.
5. Recompute the reference-class median and P80. Do not pool grants with contract prices.
6. When `data/tmk_it_contracts.json` appears, follow the merge procedure in §7.6.

### 9.5 Coefficients

Recalibrate annually, or when a statute changes:

- contribution threshold and rates;
- NDFL brackets;
- minimum wage / MRP for KZ;
- VAT/GST rates;
- WACC and country risk premium;
- CPI series;
- vendor margin and coordination bands.

Record the change as a new row or a new version; do not silently edit a sourced row.

---

## 10. What NOT to trust: proxy register

This is the most important section for a bid review. If a number is on this list and it moves the price by more than 10%, it needs two independent sources or client data.

| File / row | Why it is weak | What to do |
|---|---|---|
| `rate_cards.json` → `infosec` | No public net median; 150–250k is a proxy; hh 85.3k gross is a vacancy floor | Collect 10–20 offers or an internal grade card |
| `rate_cards.json` → `qa_manual` | Gross midpoint 130k converted to net; blog band | Use the client’s QA offers |
| `rate_cards.json` → `sysadmin` | Source bucket is DevOps/SRE/admin, not pure sysadmin | Use a sysadmin-specific offer set |
| `rate_cards.json` → `analyst_ba_sa` | BA/SA blend; BA-only is 167k vs SA 250k | Split the role or use the client’s BA/SA grade card |
| `rate_cards.json` → all non-anchor grades | Extrapolated with RUIT ratios 0.55/1.00/1.50/1.90 | Replace with the client’s grade ladder |
| `rate_cards.json` → architect lead | 504k × 1.90/senior ratio = 638k | Check against 3–5 architect offers |
| `rate_cards.json` → overhead 1.15 | Policy constant from a 10–18% band, not a benchmark | Show as an assumption; sensitivity ±5 pp |
| `rate_cards.json` → software 8,333/month | 100k/year inside a 50–150k proxy range | Get three vendor quotes |
| `rate_cards.json` → office 23,686/month | Moscow Class B only; no regional figure | Use a local lease quote outside Moscow |
| `contractor_rate_cards.json` → RU senior/lead | Open-ended “6,700 and above”; DINS is a lower independent ledger | Request a vendor quote; do not average the ledgers |
| `contractor_rate_cards.json` → KZ middle | 25–49 is a KZ/UZ/AZ average, not KZ-only | Prefer a KZ-specific quote; Wadline median 37 is a cross-check |
| `contractor_rate_cards.json` → India middle/lead | Clutch secondary band; no lead band | Request quotes |
| `contractor_rate_cards.json` → Poland middle/lead | Interpolated/extrapolated; no direct source | Request quotes |
| `contractor_rate_cards.json` → 1C outside RU | No published 1C rate; generic band shown for completeness | Request a 1C vendor quote |
| `work_archetypes.json` → all non-ISBSG norms | Derived from FP/UCP/price anchors plus explicit factors | Calibrate on 5–10 completed projects |
| `work_archetypes.json` → role mixes | Planning templates, not benchmarks | Replace with the actual staffing plan |
| `work_archetypes.json` → `rpa_bot` | 6–10 UCP × 20 h/UCP; no public bot benchmark | Use the client’s process-mining data |
| `work_archetypes.json` → `l2_l3_support` | No cross-company hours-per-ticket benchmark | Use the client’s ITSM history |
| `work_archetypes.json` → `infrastructure_migration` | 1–2 FP-equivalent per workload; planning assumption | Use a discovery wave plan |
| `work_archetypes.json` → `cv_quality_control` | Derived from 8–16-week pilots and 3–5-person teams | Use a data-collection plan and a pilot quote |
| `work_archetypes.json` → `mobile_app` | 1.45 mobile premium is an assumption; ISBSG only says mobile is lowest | Use a mobile-specific PDR from the vendor |
| `work_archetypes.json` → `integration_1c_wms` | 10–20 FP/flow is a planning range | Count the actual flows and message types |
| `work_archetypes.json` → `mes_module` | 1.2 MES complexity factor is an assumption | Use MES actuals or a vendor quote |
| `work_archetypes.json` → `erp_1c_rollout` | 1.2 org-change factor is an assumption | Use a rollout actuals set |
| `analogue_corpus.json` → all rows | Price, not effort; grants, totals and list prices are different bases | Normalize with the scope vector; never compare raw |
| `analogue_corpus.json` → PhosAgro 318.4M | Grant co-financing at 20/80; total not asserted | Do not multiply by five without the primary agreement |
| `analogue_corpus.json` → Kazan 226.3M | Total digitalisation investment, not a pure software contract | Use only as a total-investment analogue |
| `analogue_corpus.json` → Severstal 1B | MES 475M + planning 600M, not one MES contract | Split the two systems |
| `analogue_corpus.json` → VTB24 33M USD | 2012–2015, USD, different era and scope | No FX; do not compare to RUB rows |
| `analogue_corpus.json` → Rosatom 1.11B | 2023 starting price; stale for 2026 | Apply a sourced CPI index |
| `analogue_corpus.json` → Aeroflot 1B | Enterprise outlier | Use as a ceiling, not a median |
| `analogue_corpus.json` → KII “tens of millions” | Linguistic range converted to 10–99M | Treat as a survey range, not a point estimate |
| `coefficients.json` → 8%/year inflation | UI policy assumption, not a CPI series | Use Rosstat CPI for a formal estimate |
| `coefficients.json` → WACC 12% | Policy default inside 10–18% | Document the build-up; use the client’s WACC if given |
| `coefficients.json` → coordination 10–25% | Empirical/rule-of-thumb band | Calibrate to the client’s vendor-management cost |
| `coefficients.json` → flat contingency 15–30% | Rule of thumb | Use P80−P50 from a distribution |
| `coefficients.json` → 190% hidden cost | Single 26-project outlier | Use 10–25% coordination, with a tail scenario |
| `coefficients.json` → KZ/India/Poland VAT | Not in the research pack; values are null | Fill from a sourced local rate |
| `coefficients.json` → CPI values | Null by design | Pull from Rosstat / stat.gov.kz |

Also do not trust:

- **T1 and Luxoft rate cards.** Luxoft exited Russia after 2022; T1 is private. `research/07` §6.1 says no defensible public rate exists. Use the market band and request a quote.
- **KZ IT Park special regime.** It exists, but no verified rate card is in the pack. Treat it as a separate legal/tax assessment.
- **Story points × a global hours-per-point.** There is no defensible cross-company conversion. Use the team’s own velocity history.
- **ISBSG raw rows in a shipped product.** The licence is single-user and forbids redistribution. Use aggregate coefficients, as this pack does.
- **A single-point estimate.** Always quote a distribution and a confidence level.

---

## 11. Validation and QA

### 11.1 Required checks

Run from the repository root:

```bash
python3 - <<'PY'
import json, os
base = "data/product"
files = ["rate_cards.json", "contractor_rate_cards.json", "work_archetypes.json",
         "analogue_corpus.json", "coefficients.json"]
data = {}
for f in files:
    with open(os.path.join(base, f), encoding="utf-8") as fh:
        data[f] = json.load(fh)
    print("OK", f)

rc = data["rate_cards.json"]
assert len(rc["roles"]) == 14
assert all(len(r["grades"]) == 4 for r in rc["roles"])
for r in rc["roles"]:
    nets = [g["net_month"] for g in r["grades"]]
    assert nets == sorted(nets), r["role_id"]
    for g in r["grades"]:
        assert g["fully_loaded_month"] > g["employer_payroll_month"] > g["gross_month"] > g["net_month"] > 0
        assert g["fully_loaded_hour"] > 0

cr = data["contractor_rate_cards.json"]
assert len(cr["bands"]) == 224
for r in cr["bands"]:
    assert r["rate_low"] <= r["rate_mid"] <= r["rate_high"], r["id"]
    assert r["vat_included"] is False

wa = data["work_archetypes.json"]
assert wa["archetype_count"] == len(wa["archetypes"]) == 22
for a in wa["archetypes"]:
    assert abs(sum(a["default_role_mix_pct"].values()) - 100) < 1e-9, a["id"]
    tp = a["three_point"]
    assert tp["optimistic"] <= tp["most_likely"] <= tp["pessimistic"], a["id"]
    assert a["p50_hours_per_unit"] == tp["most_likely"]

ac = data["analogue_corpus.json"]
assert ac["analogue_count"] == len(ac["analogues"]) == 49
for r in ac["analogues"]:
    vals = [r["price_low"], r["price_mid"], r["price_high"]]
    if all(v is not None for v in vals):
        assert vals[0] <= vals[1] <= vals[2], r["id"]
    assert r["currency"] in ("RUB", "USD")

print("ALL STRUCTURAL CHECKS PASSED")
PY
```

### 11.2 Checks that cannot be automated

- **Basis check.** Confirm that every salary entering `rate_cards.json` is net, and every contractor rate is a billing rate. A correct number on the wrong basis is a wrong number.
- **Scope check.** For every analogue, confirm users, integrations, sites, data volume, duration and whether hardware/licences/support are included. A price without a scope vector is not an analogue.
- **Unit check.** Confirm that the estimate does not sum FP, flow, report, bot, ticket and object hours without converting to hours first.
- **Date check.** Confirm the year and the source date. A 2023 price is not a 2026 price.
- **Licence check.** Confirm that no ISBSG raw rows or other restricted data are redistributed.
- **Divergence check.** If the bottom-up, parametric and analogue methods differ by more than 30%, show the divergence; do not average it away (`research/10` §2-L2).

### 11.3 File integrity

- All five files are UTF-8, indented JSON, with a trailing newline.
- Every file has a top-level `meta` with `generated`, a currency policy, a provenance block, a `confidence_legend`, and a licence/provenance note.
- Every money row has `source` and `source_date`.
- No trailing commas, comments, NaN or Infinity.

---

## 12. Update cadence and ownership

| Data | Cadence | Trigger |
|---|---|---|
| RU statutory rates and NDFL | Annual, or on law change | FTS / Consultant publication |
| KZ statutory rates | Annual, or on law change | KGD / UPPERSETUP / Tax Code |
| Salary medians | Twice a year | Habr Career H1/H2, RUIT, thecode |
| Contractor rates | Quarterly | Vendor quotes, Klerk/DINS, Wadensi/Wadline |
| Workplace and hardware | Annual | NF Group, arendator, hardware retail |
| WACC | Annual | Damodaran January update |
| CPI | Monthly | Rosstat / stat.gov.kz |
| Analogues | Continuous | New published cases, TMK/EIS registry |
| Archetype norms | After 5–10 completed projects | Client actuals |

Ownership: the estimation-model owner maintains the JSON; the procurement/research owner maintains the analogue corpus; finance validates the statutory and WACC rows.

---

## 13. Role id map (shared across files)

| `role_id` | Russian label | Anchor grade in `rate_cards.json` |
|---|---|---|
| `analyst_ba_sa` | Аналитик (BA/SA) | middle |
| `1c_developer` | 1С-разработчик | middle |
| `backend` | Backend-разработчик | middle |
| `frontend` | Frontend-разработчик | middle |
| `mobile` | Мобильный разработчик | middle |
| `qa_manual` | QA-инженер (manual) | middle |
| `qa_auto` | QA-инженер (automation) | middle |
| `devops_sre` | DevOps / SRE | middle |
| `architect` | Архитектор | senior |
| `pm` | ПМ / тимлид | lead |
| `ux` | UX/UI-дизайнер | middle |
| `infosec` | Специалист по ИБ | middle |
| `data_engineer` | Data engineer | middle |
| `sysadmin` | Системный администратор | senior |

If a new role is added, add it to all three places: `rate_cards.json`, `contractor_rate_cards.json` (`roles[]` and `bands[]`), and `work_archetypes.json` (`role_ids[]` and the relevant role mixes).

---

## 14. Source index for this dictionary

Core sources (full list in `research/07` and `research/05`):

- Habr Career H1 2026: https://habr.com/ru/companies/habr_career/articles/1075936/
- Habr Career H2 2025: https://habr.com/ru/specials/994308/
- Habr Career H1 2025: https://habr.com/ru/specials/936618/
- RUIT Union H2 2025: https://ruitunion.org/posts/2025-10-13-it-specialist-salaries-in-the-second-half-of-2025/
- thecode.media 2025: https://thecode.media/zarplaty-it-specialistov-v-konce-2025/
- Trillion role-by-grade blog: https://www.trillioncredit.ru/blog/zarplaty-v-it/
- CNews info security: https://www.cnews.ru/news/line/2025-12-15_za_pyat_let_predlagaemye
- NDFL: https://www.nalog.gov.ru/rn38/taxation/taxes/ndfl/16453713/
- Contributions: https://www.nalog.gov.ru/rn32/news/seminar/16610341/
- Contribution threshold: https://www.nalog.gov.ru/rn77/news/activities_fts/16577139/
- Office: https://media.kf.expert/lenta_analytics/0/889/NF%20GROUP%20_Office%20market%20report_Moscow_Q3%20_2025.pdf
- Hardware: https://habr.com/ru/articles/827656/
- Productive hours: https://www.klerk.ru/materials/2025-10-06/skolko-stoit-chas-raboty-programmista/
- 1C rate: https://itviar.ru/stati/services-stati/autstaffing/stoimost-autstaffinga-1s-v-2026-godu/
- CNews day rates: https://www.cnews.ru/reviews/zakaznaya_razrabotka_po_2025/articles/v_zakaznoj_razrabotke_stali_platit
- KZ outsourcing: https://osn.kz/blog/it-outsourcing-kazakhstan-2025
- Central Asia rates: https://sigma.software/insights/software-outsourcing-to-central-asia-uzbekistan-kazakhstan-azerbaijan
- Wadline rates: https://ru.wadline.com/rates
- Accelerance rates: https://www.accelerance.com/blog/2026-outsourcing-rate-trends-asia-europe-latam
- ISBSG PDR: https://www.isbsg.org/wp-content/uploads/2022/05/Short-Paper-2021-10-Use-of-Output-Based-KPIs-in-AD-Contracts.pdf
- ISBSG government: https://totalmetrics.com/function-points/Software-Productivity-Government-ISBSG.pdf
- ISBSG low-code: https://www.isbsg.org/wp-content/uploads/2021/08/Short-Paper-2021-06-Productivity-of-Low-Code-projects.pdf
- ISBSG Java vs low-code: https://www.isbsg.org/wp-content/uploads/2022/05/Short-Paper-2021-12-Productivity-Java-Vs-Low-Code-Projects.pdf
- Lavazza et al. 2018: https://doi.org/10.5277/e-inf180102
- COCOMO II.2000: https://www.cs.otago.ac.nz/cosc345/resources/COCOMO-II-2000.pdf
- UCP: https://people.eecs.ku.edu/~saiedian/Teaching/811/Papers/Use-Case-Points/use-case-points-simplify.pdf
- Damodaran WACC: https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/wacc.html
- Damodaran country risk: https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/ctryprem.html
- KZ methodology: https://adilet.zan.kz/rus/docs/V1900018927
- KZ tax rates: https://kst.kgd.gov.kz/ru/news/izmeneniya-po-socialnomu-nalogu-v-2026-godu-12-163416
- KZ payroll explainer: https://uppersetup.com/ru/blog/employer-payroll-taxes-and-contributions-in-kazakhstan-2026
- KZ social contributions: https://vko.kgd.gov.kz/ru/news/socialnye-platezhi-v-respublike-kazahstan-8-160454

---

## 15. Final rule

The model is allowed to be uncertain. It is not allowed to be opaque. Every number in the five JSON files either has a source, a derivation, or a `Proxy` label. If a reviewer asks “why is this number what it is?”, the answer must be one click away in the row, not in someone’s memory.

---

## 16. Обновление 2026-11-09: вливание реальных закупок ТМК

`analogue_corpus.json` пополнен полем **`tmk_eis_rows` — 60 записей** из собственной ЭТП ТМК
(`zakupki.tmk-group.com`, публичный Ext.Direct API), 2019–2026. Схема строки:

| Поле | Содержание |
|---|---|
| `id`, `registry_number`, `source_url` | Идентификация процедуры на ЭТП |
| `customer`, `supplier` | ПАО «ТМК» / филиалы (ВТЗ, СинТЗ, СТЗ, ПНТЗ, ЭТЕРНО, НГС); поставщик по `winner_id` (51/60) |
| `primary_type` | Категория по выведенному ОКПД2: `software_development` (62.01, n=21), `it_consulting_services` (62.02, n=16), `other_it_services` (62.09, n=11), `hardware_supply` (26.20, n=12) |
| `subtype` | Предметный подтип по заголовку: `erp_1c` (8), `sap` (7), `mes_acstp` (7), `security_kii` (7), `support_maintenance` (7), `hardware_network` (8), `itsm_crm_bpm` (4), `software_licensing` (3), `bi_data_cv` (2), `null` (7) |
| `price_rub`, `price_type` | **Всегда НМЦК (start_price лота 1), не победная цена.** Победная цена, где опубликована, лежит в `scope_notes` (`winning_bid`), 52/60 |
| `vat_included` | `null` + `vat_note`: ЭТП не расщепляет НДС; одна строка проверена через `Lot.load` — `nds_rate = 18` |
| `date_published`, `duration_months_stated` | Дата публикации; срок — только если он был написан в предмете (3/60) |
| `scope_notes` | Машиночитаемые метки: `price_basis`, `winning_bid`, `VAT_nds_rate`, `lots`, `multilot`, `category`, `duration_basis`, `tender_window_months` |
| `confidence` | `high` (цена + поставщик), `medium` (что-то одно), `low` (ни того, ни другого) |

Статистика корпуса: сумма НМЦК 1,82 млрд ₽; медиана 18,58 млн ₽; Q1/Q3 = 7,86/36,54 млн ₽;
P10/P90 = 3,47/80,09 млн ₽; максимум 281,66 млн ₽ (внедрение 1С-ERP, 2025).
Распределение тяжёлое справа: 10 записей > 50 млн ₽ дают ~52% суммы — поэтому в модуле аналогов
нужна **медиана и межквартильный размах по подтипу**, а не среднее.

**Как использовать в продукте.** Это лучший из доступных источников «рыночных аналогов» для
ТМК++: цены реального, закрытого, корпоративного ИТ-рынка, недоступного конкурентам. Гипотеза
модуля Analogues: подобрать в корпусе подтип (`subtype`) и объём (`scope_vector`), показать
медиану и IQR как справочную вилку, и **обязательно** пометить базу («НМЦК, не победная цена,
НДС не расщеплён»). Расхождение параметрической оценки с медианой аналогов > 30% — это сигнал
для пересмотра допущений, а не для подгонки.

Полный анализ корпуса: `research/12_tmk_it_procurement.md`.
