# Competitive Landscape: Software Cost and Effort Estimation, Build-vs-Buy Tooling, and the RU/CIS Regulatory Layer

**Research date: 8 November 2026.** Scope: global parametric estimation suites, ISO functional sizing, agile-native engineering intelligence, Monte Carlo forecasting, AI-era estimators (2023-2026), build-vs-buy and TCO frameworks, Russian and CIS regulatory methodologies, local Russian tools, and rate benchmarks.

## How to read the labels

| Label | Meaning |
|---|---|
| **as published 8 Nov 2026** | List price found on the vendor or marketplace page on the research date. Not a negotiated price. |
| **unknown, quoted** | Verified on 8 Nov 2026 that the vendor publishes no list price. A number exists only inside a sales conversation. Nothing is estimated or invented here. |
| **(secondary)** | Third-party reporting or analyst summary, not the vendor's own statement. Verify before using in a client-facing deck. |
| **(vendor claim)** | Vendor assertion that has not been independently audited. |
| **(historical)** | Price or fact from an older source, kept for context and date-stamped. |

---

## TL;DR

1. **The market is bimodal and hollow in the middle.** Heavy parametric suites (SEER-SEM, SLIM, TruePlanning, SCOPE, Planisware) sit at the top with quoted pricing, certified specialists, and enterprise sales cycles. Cheap hour × rate calculators sit at the bottom. The pre-project question, *free text in, defensible risk-adjusted cost out, with market analogues and a build-vs-buy verdict*, has no incumbent.
2. **No product scores above 9 out of 20 on the ten-stage pipeline this track needs.** PRICE/TruePlanning and one open-source agent tool reach 9. Parametric vendors own the effort model and risk engine but have no intake, no dual cost basis, and no Russian regulatory output. AI tools own the intake and nothing else. Russian tools own part of the regulatory layer and nothing else.
3. **The employer on-cost gap is decisive and unmodelled.** Russia plans at ×1.302 (30% unified tariff plus injury contributions). Kazakhstan plans at ×1.12-1.17. No commercial tool models either, so every "offshore is cheaper" recommendation for a Russian industrial client is built on a wrong assumption.
4. **ISBSG is the benchmark everyone cites and nobody can embed.** The ISBSG licence prohibits resale and prohibits incorporating the data into a product for resale. That single clause removes the lazy route to a market-analogue engine and makes benchmark construction the real strategic decision.
5. **Russia has no federal functional-size costing methodology.** Cost discipline at federal level is procedural (ПП 676 requires a ТЭО) and procurement-based (Приказ 567 requires three comparable prices with a coefficient of variation at or below 33%). Functional-size costing exists only regionally (Moscow 2018, Moscow Oblast 2022) and nationally in Kazakhstan. China has a national standard (GB/T 36964-2018) that Russia lacks.
6. **Single-point estimates are scientifically indefensible.** Surveys put effort overrun at 60-80% of projects with a 30-40% average, and there is no evidence that formal models beat expert judgement. The defensible output is a distribution plus an assumption ledger plus a reference-class justification. Every Russian hour × rate calculator fails this test.
7. **The gap is assembly, not models.** Every component exists separately: ISO sizers, parametric engines, benchmarks, Monte Carlo, rate cards, regional formulas. Nothing connects them into one chain: intake → size → calibrated effort → two cost bases → risk distribution → build-vs-buy verdict → procurement-ready artefact.

---

## 0. Corrections to the brief

Four items in the original brief need correction. Three are substantive errors that would have produced a visibly wrong concept document; the fourth is a naming ambiguity that hides a real product.

| Brief says | What is actually true | Source |
|---|---|---|
| «ГОСТ Р 56969-2016 (project management)» | **Wrong document.** ГОСТ Р 56969-2016 covers the unified energy system: coordinated operation of centralised automatic frequency and active-power flow control systems, including hydroelectric plants. It is a power-grid standard. The Russian project management standard is **ГОСТ Р 54869-2011 «Проектный менеджмент. Требования к управлению проектом»**, which does include cost management as a process area but provides no costing formula. | [ГОСТ Р 56969-2016 full text](https://meganorm.ru/mega_doc/norm/gost-r_gosudarstvennyj-standart/3/gost_r_56969-2016_natsionalnyy_standart_rossiyskoy.html) · [ГОСТ Р 54869-2011 PDF](https://rosgosts.ru/file/gost/03/100/gost_r_54869-2011.pdf) |
| «Costimator (CostXpert)» | **Two unrelated products, in two different industries.** *Costimator* is MTI Systems' **manufacturing** should-cost tool (machining, sheet metal, welding). *Cost Xpert* is a separate German/US **software** cost estimation tool using SLOC, function point and GUI metrics in the COCOMO family, now acquired or merged. | [MTI Costimator history and specs](https://www.mtisystems.com/articles/article_may_06.html) · [FAA appendix describing Cost Xpert](https://fast.faa.gov/archive/v0111/pricing/c1919-19D.htm) · [PitchBook: Cost Xpert Group, acquired/merged](https://pitchbook.com/profiles/company/63214-21) |
| The ГОСТ 34 series is current | **Most of the series was replaced between 2020 and 2022.** 34.601-90 → **ГОСТ Р 59793-2021**; 34.602-89 → **ГОСТ 34.602-2020**; 34.603-92 → **ГОСТ Р 59792-2021**; 34.201-89 → **ГОСТ 34.201-2020**; РД 50-34.698-90 → **ГОСТ Р 59795-2021**. | [Angara Security replacement table](https://habr.com/ru/companies/angarasecurity/articles/671882) · [ГОСТ 34 series status](https://www.angarasecurity.ru/stati/sudba-trebovaniy-gost-34-y-serii-v-proektakh-po-informatsionnoy-bezopasnosti) |
| «SCOPE2» as a standalone function-point product | **The product is SCOPE Project Sizing Software by Total Metrics.** SCOPE 2.0 was an early-2000s release; the current line is 5.2. It is the reference implementation of manual IFPUG counting and, notably, exports directly into a SEER-SEM project file. | [SCOPE history](https://totalmetrics.com/scope-project-sizing-software/history) · [SCOPE 4.1 release notes, SEER-SEM export](https://totalmetrics.com/scope-project-sizing-software/history/scope-4.1-whats-new.html) |

One structural fact belongs next to these corrections: **there is no federal Russian methodology for IT project cost estimation.** Federal cost discipline comes from two places only. Постановление Правительства РФ № 676 requires a Концепция containing a технико-экономическое обоснование. Приказ Минэкономразвития № 567 governs the initial maximum contract price (НМЦК). Functional-size-based costing exists at regional level (Moscow, Moscow Oblast) and at national level in Kazakhstan. Details in §9.

---

## 1. Five-layer landscape map

```
LAYER 5   Build-vs-buy / TCO decision frameworks .... consulting IP, paywalled research, cloud TCO calculators
LAYER 4   AI-era scoping (2023-2026) ................ LLM text to spec to hours, no benchmark, no risk discipline
LAYER 3   Agile-native delivery intelligence ........ Jira/Tempo, Jellyfish, Swarmia, DX, Monte Carlo add-ons
LAYER 2   Functional sizing (ISO standards) ......... IFPUG, COSMIC, NESMA, SCOPE, ScopeMaster, DCG, CAST
LAYER 1   Parametric cost models and benchmarks ..... SEER-SEM, SLIM, PRICE/TruePlanning, COCOMO II, ISBSG
          Fortune-1000, defence and government, consultant-heavy, quoted pricing
```

Mapping to this document: Layer 1 is §2, Layer 2 is §3, Layer 3 is §4 with its Monte Carlo primitive in §5, Layer 4 is §6, Layer 5 is §8. §7 covers the commercial layer (contract models) that any build-vs-buy comparison must price. §9 to §11 cover the Russian and CIS specifics that sit underneath all five layers.

The structural observation: the market is **bimodal and hollow in the middle**. At the top, parametric suites with no self-serve tier, no published price, and a certified-operator requirement. At the bottom, free or near-free calculators that multiply hours by a rate. Between them, nobody sells a pre-project estimator to a 10 to 200 person IT department.

---

## 2. Layer 1: parametric cost models and benchmarks

| Vendor / product | Core method | Inputs → outputs | Pricing | Target persona | Known criticisms |
|---|---|---|---|---|---|
| **Planisware** (Enterprise, Orchestra, Nova, Horizon, Valoris) | PPM suite with parametric estimation, estimation by analogy, and "AI-based estimation" for resource demand | Project and portfolio data, budgets, resource demand, scorecards → budgets, forecasts, resource capacity, scenario and NPV/ECV comparison | **USD 45/user/mo** for Orchestra (as published 8 Nov 2026; third-party Capterra listing, not vendor-published). Enterprise, Nova, Horizon, Valoris: **unknown, quoted**. FY2025 revenue €198.0M across more than 600 organisations, roughly €330k per customer per year including services | Large PMOs; pharma, aerospace, manufacturing, IT portfolio offices | Reviewers describe licences plus support plus consulting as expensive; configuration is heavy, so services dominate year one. Estimation is a feature inside a PPM, not a standalone estimator |
| **Galorath SEER-SEM** | Parametric equations with knowledge bases for platform, application, acquisition method, development method and standard; 50+ parameters; three-point PERT inputs feeding Monte Carlo | Size (SLOC, FP, use cases, features, custom), WBS, 50+ cost drivers → effort, schedule, staffing plan, defects, cost, confidence levels (10/50/90%), sensitivity, top-10 effort impact | **unknown, quoted**: "pricing is scoped to each organization through a consultation"; modular domain licensing | Engineering, finance, PMO, procurement, programme offices; mid-market to enterprise | Opaque pricing; needs calibrated historical data to be trustworthy; model complexity blocks non-specialists; built for "official estimates", not fast pre-sales triage |
| **QSM SLIM** (SLIM-Estimate, Control, DataManager, Metrics, MasterPlan, Collaborate) | Top-down Software Lifecycle Model in the Putnam tradition: size, productivity, time and effort relationships with machine-learning algorithms across products | Size (T-shirt to detailed), productivity, constraints → effort, cost, duration, staffing, quality plans, risk; benchmarked against **14,500 verified projects** | **unknown, quoted** (perpetual and network licences; EULA is seat and CPU based; no public list) | Fortune 1000 and government; positioned on "four decades" of data | Same critique class as all parametric models: productivity factors are garbage-in; enterprise sales cycle; desktop-era UX |
| **PRICE Systems / Unison TruePlanning** | Activity-based parametric cost estimating relationships; "50 years of cost research"; hardware, software, microcircuits, IT and system-of-systems | Technical solution parameters → cost, schedule, uncertainty, basis of estimate, bid/no-bid, should-cost, price-to-win, 40+ metrics | **unknown, quoted** (reseller and quote only) | Government, defence, aerospace, NASA/DoD-type programmes, large commercial OEMs | Cost-engineering-grade tooling: high skill floor, heavy data requirements, defence framing that does not translate to a 20-person internal IT team |
| **Costimator (MTI Systems)** | Manufacturing should-cost: feature-based cycle-time and cost models; 2,400 work centres, 2,600 parametric elements, 3,500 process standards, 2,000 materials; optional 3DFX feature recognition | Lot size, material, process routing, shop rates → machine cycle time, setup, labour, burden, material → should-cost | **unknown, quoted** (quote after demo). Was "starting under USD 13,000" in a 2006 article (as published 2006, historical); the current page publishes no price. Free specialist-led demo using your own CAD and shop rates | Cost estimators, cost engineers, manufacturing engineers, OEM should-cost teams | Not a software tool at all, but the closest behavioural analogue to this track: should-cost as a negotiation instrument, not a project plan |
| **COCOMO II** (Boehm, USC) | Algorithmic: three sub-models (Application Composition, Early Design, Post-Architecture); effort = a · Size^b · EAF | Size (SLOC, FP, object points), 17+ cost drivers, scale factors → effort in person-months, schedule, phase distribution, staffing | **Free** (model and web tool). COCOMO III is "a project underway". (as published 8 Nov 2026) | Researchers, cost analysts, defence and government estimators, students | 2000-era calibration; needs SLOC or reliable FP; academic UX; no evidence that formal models beat expert judgement (see §12.3) |
| **ISBSG** (repository plus Productivity Query Tool) | Benchmark dataset rather than a model; used to calibrate COCOMO, SEER-SEM and TruePlanning | 118 fields per project: size, effort by phase, duration, cost, defects, language, platform, architecture, methodology, estimate versus actual | **AUD 3,000** Data Subscription, 1 user, 12 months. **AUD 7,500** Corporate, 1-9 users. **AUD 10,000** Corporate, 10+ users. Productivity Query Tool **AUD 15/month or AUD 150/year**. Report Pack **AUD 250**. (all as published 8 Nov 2026) | Estimators, benchmarkers, outsourcing managers, auditors | **The licence prohibits resale and prohibits incorporation into any product for resale** (see the licence callout below). Staleness: 41% of projects completed in the last decade |

Sources: [Planisware Enterprise](https://planisware.com/products/planisware-enterprise) · [Planisware pricing analysis citing Capterra](https://portfoliohub.io/blog/planisware-pricing) · [SEER-SEM product page](https://galorath.com/seer/solution/software-development/) · [SEER-SEM capabilities PDF](https://totalmetrics.com/__data/assets/pdf_file/0018/6840/SEER-for-Software.pdf) · [SEER pricing by consultation](https://galorath.com/seer/) · [QSM SLIM suite](https://www.qsm.com/products) · [QSM licence terms](https://qsm.com/accept-or-decline-qsm-license-agreement-0) · [Unison/PRICE TruePlanning](https://www.unisonglobal.com/product/cost-engineering) · [PRICE Systems history](https://en.wikipedia.org/wiki/PRICE_Systems) · [Costimator history and specs](https://www.mtisystems.com/articles/article_may_06.html) · [Costimator pricing by quote](https://quotedpart.com/guides/comparisons/costimator-pricing) · [COCOMO II](https://boehmcsse.org/tools/cocomo-ii/) · [COCOMO model family](https://boehmcsse.org/tools/cocomo-models/) · [COCOMO II web tool](https://softwarecost.org/tools/COCOMO/) · [ISBSG subscriptions and prices](https://www.isbsg.org/subscriptions/) · [ISBSG overview and calibration use](https://www.isbsg.org/wp-content/uploads/2025/05/Short-Paper-2025-05-ISBSG-Overview.pdf) · [ISBSG field descriptions and licence](https://isbsg.org/wp-content/uploads/2017/05/e.-ISBSG-Release-2017-R1-Field-Descriptions.pdf)

### 2.1 The ISBSG licensing constraint

> **Decision-relevant, read this before designing any benchmark feature.** The ISBSG licence "prohibit[s] it from being resold in any form or incorporated into any product for resale". You can license ISBSG to advise, calibrate an internal model, or produce a consulting deliverable for a specific client. You cannot ship ISBSG records, or a product whose value depends on ISBSG records, as a commercial estimator. Whether aggregated percentiles count as "derived" is not settled by the public licence text and needs a written answer from ISBSG. Treat this as the single biggest execution risk in any benchmark-led concept.

Source: [ISBSG field descriptions and licence text](https://isbsg.org/wp-content/uploads/2017/05/e.-ISBSG-Release-2017-R1-Field-Descriptions.pdf)

### 2.2 What ISBSG actually contains

The repository holds **13,718 development and enhancement projects** plus **2,417 maintenance and support projects**, with **118 fields** per record. The field inventory is the closest thing in the market to a specification for a market-analogue engine:

- Identity and context: project ID, industry sector, organisation type, application group and type, development type (new, enhancement, re-development), platform, language type.
- Effort: normalised level-1 effort, normalised work effort, summary work effort in hours.
- Size: function point component counts (inputs, outputs, enquiries, files, interfaces) for IFPUG, NESMA and Mark II, plus **COSMIC CFP** for additions, changes and deletions.
- Planning-stage estimates: size estimate, effort estimate, cost estimate, delivery-date estimate, method used, tool used.
- Money: total project cost, phase cost breakdown, currency, overheads-included flag, "all costs included" flag.
- Quality: defect counts by phase, data quality rating A to E.

That schema is exactly what a market-analogue engine needs. It is also exactly what the licence forbids embedding. Both facts are true at once, and both must be stated in the concept document.

---

## 3. Layer 2: functional sizing, the only auditable basis for market analogues

| Standard / tool | What it is | Licensing and cost | Strengths | Weaknesses |
|---|---|---|---|---|
| **IFPUG FPA, ISO/IEC 20926:2009** | ISO standard for the IFPUG functional size measurement method; status confirmed current in 2024 | Standard purchased from ISO; the method itself needs certified counters (CFPS). Price of the standard not published by ISO as a single figure, **unknown, quoted** via ISO catalogue | De-facto language of outsourcing contracts; huge historical dataset; convertible to prior editions | Slow and expensive manual counting (Capers Jones: 400-600 FP per day; Total Metrics: 200-300 FP per day); inter-counter variability; weights and criticality thresholds criticised; GSC adjustment largely abandoned (now optional, with IFPUG pushing SNAP for non-functional size) |
| **COSMIC, ISO/IEC 19761:2011** | ISO standard; 1 CFP equals 1 data movement (Entry, Exit, Read, Write); free Measurement Manual; confirmed current in 2025 | **Free** documentation (public domain); certification paid | Simple, technology-agnostic, works for real-time, embedded and agile; endorsed or used by the US GAO and the EU Large Systems group; explicit rules for changed and deleted functions, which suits enhancement pricing | Requires functional-process decomposition; not designed for algorithm-heavy, simulation or continuous-signal software (explicitly out of scope) |
| **SCOPE Project Sizing Software (Total Metrics)** | Reference implementation of manual function-point counting. IFPUG FPA per ISO/IEC 20926, CPM 4.3 unadjusted; NESMA weightings via "Numerical Attributes"; explicit enhancement and change-request counting with rework tracking; audit trail of who created or modified a node and when | **unknown, quoted**; sold through registered resellers in the UK, Europe, North America, APAC, China and Japan | **Exports project, FP size and environment data directly into a SEER-SEM-formatted project file.** Multi-user, multi-lingual metrics repository with audit tracking, 38 report types, baseline/release/project-level size, impacted-size reports, Excel export. Used in 15+ countries (USA, UK, Germany, Netherlands, China, Japan, India, Belgium, Australia, New Zealand, Czech Republic, Italy, Austria, Ireland, Brazil); clients include Atos Origin, Australia Post, Bank of Montreal, Dutch Tax (Belastingdienst) | Manual counting at expert speed (200-600 FP per day industry range); licensing plus certified-counter dependency; worthless without a trained measurer |
| **ScopeMaster** | Automated sizing from requirements text; NLP and AI; certified by COSMIC in 2020 and by IFPUG in 2025 | Credits-based consumption ("pay for what you use, top up anytime"); per-seat for 30+ users; free "Proof of Value"; exact USD **unknown, quoted** | The only tool certified for automated sizing in **both** ISO standards; within 15% of a manual COSMIC count (vendor claim); finds 30-60% of requirements defects (vendor claim); Jira and Azure DevOps sync; REST API | Sizes requirements text you already have; does not price; does not compare in-house versus outsourced; no risk-adjusted cost. Documented languages: English, Spanish, Portuguese, Italian, French |
| **DCG Software Value** | Services: function point counting, benchmarking, estimation, vendor evaluation | **unknown, quoted** (services) | Deep IFPUG and COSMIC bench; publishes benchmarking guidance with LEDAmc and TI Métricas; strong for outsource bid evaluation | Consultancy, not software; not self-serve; not a product |
| **CAST** (AIP / Highlight) | Automated code analysis producing structural quality, technical debt and size from existing systems | **unknown, quoted** (enterprise) | Reverse-sizing legacy portfolios; objective code-level facts; DCG partners with CAST for this | Post-hoc: needs code; cannot estimate a system that has not been built |

Sources: [ISO/IEC 20926:2009](https://www.iso.org/standard/51717.html) · [ISO/IEC 19761:2011](https://www.iso.org/standard/54849.html) · [COSMIC official site](https://cosmic-sizing.org/) · [COSMIC introduction and CFP definition](https://cosmic-sizing.org/cosmic-sizing/intro/) · [ScopeMaster pricing model](https://www.scopemaster.com/pricing/) · [ScopeMaster automated function points and certifications](https://www.scopemaster.com/features/automated-function-points/) · [ScopeMaster 15% claim](https://www.scopemaster.com/features/automated-software-sizing/) · [DCG capability profile](https://www.linkedin.com/company/dcg-software-value) · [DCG benchmarking guide](https://www.prlog.org/12599790-dcg-software-value-announces-the-software-development-productivity-benchmarking-guide.html) · [DCG and CAST partnership](https://www.castsoftware.com/usa/partners) · [FP counting speed and FPA criticism](https://personales.upv.es/thinkmind/dl/conferences/icsea/icsea_2016/icsea_2016_1_30_10077.pdf) · [FPA limitations systematic review](https://www.fattocs.com/wp-content/uploads/2020/04/MarcosFJunior-MarceloFantinato-VioletaSun-2015.pdf) · [SCOPE history and designer](https://totalmetrics.com/scope-project-sizing-software/history) · [SCOPE 4.1 release notes, SEER-SEM export](https://totalmetrics.com/scope-project-sizing-software/history/scope-4.1-whats-new.html) · [SCOPE clients and country list](https://totalmetrics.com/scope-project-sizing-software/clients.html) · [SCOPE method, ISO 20926 and NESMA](https://totalmetrics.com/help/Background_and_Articles_on_Functional_Size/Introduction_to_Function_Point_Analysis/What_is_Functional_Size_Measurement_.htm) · [IFPUG share of ISBSG](https://totalmetrics.com/help/Background_and_Articles_on_Functional_Size/Why_Use_Functional_Size/Why_Measure_Software_Size.htm) · [SCOPE gap analysis versus Function Point Workbench](https://totalmetrics.com/__data/assets/pdf_file/0014/9212/SCOPE-053-Gap-Analysis-with-SCOPE-5-with-FPW_1.0.pdf)

### 3.1 The architectural finding that follows from SCOPE

SCOPE's only documented estimation output is a **hand-off to a parametric model**. Total Metrics also states that more than 90% of the ISBSG repository is IFPUG-measured, with COSMIC share rising.

The market's own integration pattern is therefore **ISO sizer → parametric effort model**, not one monolithic tool. That validates a two-engine design (sizing engine plus cost and risk engine) and reframes the competitive position: the product does not compete with SEER-SEM. It replaces the SCOPE-style front end that SEER-SEM currently requires a certified human to operate.

---

## 4. Layer 3: agile-native and engineering-intelligence tools

These tools answer "when will it be done" and "where did the money go" from **existing delivery data**. None answers "what should this not-yet-started initiative cost, and should we build or buy".

| Tool | What it actually does | Estimation and costing capability | Pricing | Gap for this use case |
|---|---|---|---|---|
| **Jira plus Tempo Capacity Planner / Financial Manager / Timesheets** | Resource capacity and project P&L inside Jira | Epic estimates in hours or FTE; cost and billing rates per role; planned versus actual cost and revenue forecasting; budget milestones | Capacity Planner **USD 4.39/user/mo** at 11-100 users, **USD 11 flat** at 10 or fewer; Financial Manager **USD 3.18/user/mo**; Timesheets **USD 5.99/user/mo** (all as published 8 Nov 2026) | Requires Jira plus logged time plus plans. No pre-project sizing, no in-house versus vendor comparison, no market benchmark |
| **Atlassian Jira / Advanced Roadmaps / Jira Align** | Work tracking, portfolio planning | Story point and estimate roll-up; no cost model | Jira per-seat (published); Align bundled into Strategy Collection and requires Jira Cloud Premium (as published 8 Nov 2026) | Estimates are inputs you type, not computed values |
| **Linear** | Issue tracking, projects, cycles, initiatives; AI agent | **No effort or cost estimation feature**; no cost rates | **Free / USD 10 / USD 16 / Enterprise custom** per user per month, annual only; AI credits metered separately (as published 8 Nov 2026) | Pure planning UX; zero cost engineering |
| **IBM Targetprocess (ex-Apptio)** | Enterprise agile planning wired to ApptioOne financials: labour allocation, capitalisation, labour forecasts | Portfolio and resource planning; cost allocation through ApptioOne | **USD 40,500/year for up to 125 connected users** (AWS Marketplace, as published 8 Nov 2026); **GBP 12-32/user/mo** on UK G-Cloud (as published 8 Nov 2026) | Quote-only at scale; assumes an existing Apptio cost model; not a pre-sales estimator |
| **IBM Apptio One (Costing and Planning)** | IT financial management and TBM: cost allocation, TCO, vendor and cloud spend | Full IT TCO model, not project effort | **GBP 42,000 per licence per year** (G-Cloud, as published 8 Nov 2026) | Enterprise ITFM; 30-34 weeks of Expert Labs to stand up |
| **Jellyfish** | Engineering management platform: patented allocations model, investment allocation, DevFinOps, R&D capitalisation, AI token cost | Cost of **existing** engineering effort allocated to initiatives; benchmarks | Per-seat, sales-led, **unknown, quoted**. Secondary research puts the annual contract value for 50-200 engineers at roughly **USD 30k-60k** (secondary, third-party estimate) | Post-hoc allocation, not forward estimation. Needs issue-tracker hygiene |
| **Swarmia** | Engineering intelligence: DORA and SPACE metrics, DevEx surveys, software capitalisation (FTE model, roughly 95% accuracy claimed) | Effort to capitalisation; investment balance reporting | **USD 45/dev/mo** Standard, **USD 55** Enterprise; modules at **USD 5 / 9 / 18 / 23** per dev per month (as published 8 Nov 2026) | Team-level only; no project cost estimate, no vendor comparison |
| **DX (GetDX, now Atlassian)** | DevEx measurement (DXI), SDLC analytics, AI-code measurement | None; productivity, not cost | **unknown, quoted**; sales-led, no public pricing. Atlassian acquired DX for roughly **USD 1B**, close reported 10 Nov 2025 (secondary) | Not an estimation tool |
| **Uplevel** | Focus time, meeting load, burnout signals from calendar, chat, git and Jira | None | **unknown, quoted** | Adjacent; no cost model |
| **Pluralsight Flow, now Appfire Flow** | Git analytics (ex-GitPrime, acquired by Pluralsight for **USD 170M** in 2019; acquired by Appfire Feb 2025) | None | Per-seat. **Retirement announced for 31 Dec 2027, renewals closed 30 Jun 2026** (secondary) | Do not build on it; end-of-life |
| **LinearB, Waydev, Allstacks, CodePulse** | Delivery and engineering analytics | Allstacks: statistical delivery forecasting; others: metrics | Allstacks **USD 400/contributor/yr** at up to 500 contributors; CodePulse **USD 199/mo flat** (as published 8 Nov 2026) | Forecasting dates, not costs |

Sources: [Tempo Capacity Planner pricing](https://www.tempo.io/pricing/capacity-planner) · [Tempo Financial Manager pricing](https://www.tempo.io/pricing/project-financial-management) · [Tempo cost forecasting mechanics](https://www.tempo.io/blog/project-cost-forecasting) · [Linear pricing](https://linear.app/pricing) · [IBM Targetprocess on AWS Marketplace](https://aws.amazon.com/marketplace/pp/prodview-j3dktajl67scs) · [Targetprocess G-Cloud listing](https://www.applytosupply.digitalmarketplace.service.gov.uk/g-cloud/services/247836595643812) · [Apptio One at GBP 42k per licence](https://www.applytosupply.digitalmarketplace.service.gov.uk/g-cloud/services/790459700943786) · [Jellyfish pricing model](https://jellyfish.co/pricing/) · [Jellyfish pricing and ACV context](https://www.g2.com/products/jellyfish-2025-10-22/pricing) · [Jellyfish versus Allstacks ACV figures](https://codepulsehq.com/guides/jellyfish-vs-allstacks) · [Swarmia pricing](https://www.swarmia.com/pricing/) · [Developer productivity insight platforms, Swarmia FTE claim](https://www.gartner.com/reviews/market/developer-productivity-insight-platforms) · [DX, Flow and Uplevel status plus pricing](https://waydev.co/navigating-the-software-engineering-intelligence/) · [DPIP market comparison](https://dpip.news/)

---

## 5. Monte Carlo forecasting add-ons: the risk primitive

Every serious estimator needs a distribution, not a point. These are the existing implementations, all of which forecast **dates from throughput history** rather than cost from scope.

| Tool | What it does | Notes |
|---|---|---|
| **Broken Build, "Monte Carlo simulations for Scrum/Kanban"** (Jira) | When and How-many charts, percentile bands at P50/P70/P85/P95, capacity simulation, what-if analysis | Roughly **606-1,130 installs**; SOC 2 Type 2; Standard and Advanced editions; price on Atlassian Marketplace (as published 8 Nov 2026) |
| **Agile Monte Carlo (BOJA Technology)** | **5,000 simulations** per forecast; story points or issue count; roadmap Gantt plus lean metrics | Free for open-source projects |
| **Focused Objective spreadsheets (Troy Magennis)** | The canonical free Excel throughput forecaster, referenced in academic practice papers | Free; the reference implementation many commercial tools copy |
| **montecarluni (lunivore)** | Apache-2.0 Kotlin CLI: Jira CSV to 500-scenario weekly distribution | **33 commits**; small but citable open source |
| **Flow Metrics and Forecasting for Jira (9ByNight)** | Throughput percentiles plus Monte Carlo at 50/85/95% | Free tier plus Pro; Forge, read-only |
| **Agile Monte Carlo / "Agile Project"** | 5,000-simulation engine on Jira data | Commercial |

Sources: [Broken Build Marketplace app](https://marketplace.atlassian.com/apps/3709319691/monte-carlo-simulations-capacity-planning-for-scrum-kanban) · [Broken Build method](https://www.brokenbuild.net/apps/agile-monte-carlo-charts) · [BOJA FAQ](http://agilemontecarlo.com/faq.html) · [montecarluni](https://github.com/lunivore/montecarluni) · [Flow Metrics and Forecasting app](https://marketplace.atlassian.com/apps/3298816930/flow-metrics-forecasting-for-jira) · [Practice paper citing Focused Objective](https://www.berkkibarer.com/wp-content/uploads/2026/01/Kibarer_operationalizing_percentile_release_forecasting_jss.pdf)

---

## 6. Layer 4: AI-era estimation, 2023-2026

| Tool | Type | Input → output | Traction and pricing | What it does not do |
|---|---|---|---|---|
| **ScopeMaster** | NLP sizing (see §3) | User stories → COSMIC/IFPUG size, quality findings, test scenarios | Certified by both ISO methods; credits pricing (**unknown, quoted**) | No cost, no in-house versus vendor comparison, no risk range expressed in money |
| **UppLabs AI Estimator** | Agency lead-generation tool | Free-text project description → phases, team composition, stack, budget range (low, expected, high), risks, a build-vs-buy note, PDF | **Free, no signup** (as published 8 Nov 2026); claims "100+ projects" in training data and "±20%" (vendor claim, unaudited) | Trained on one agency's projects, so not a market benchmark; no reproducibility or audit trail |
| **EstimatorGPT (Softup AI Lab)** | Multi-agent pipeline: Clarifier → Architecture → Decomposition → Estimation | Requirements → spec, feature breakdown, XS-XL hours, timeline, export to PDF/Markdown/Jira | Commercial SaaS; price **unknown, quoted** | Targets agencies writing proposals; hours are model opinions, not calibrated to a dataset |
| **Estimiqly** | LLM platform | Text, PDF or Word requirements → epics, stories, acceptance criteria, story points, hours, team scenarios, cost sheet, Jira export | **Private beta, waitlist** (2026); price **unknown, quoted** | Pre-revenue; no benchmark data; no risk model |
| **Devplan** | AI product-management platform ("product brain") | Code plus company context → estimates grounded in your codebase | Commercial; SOC 2 Type II; price **unknown, quoted** | Estimates from existing code; weak for greenfield |
| **agent-estimate (kiloloop)** | Open-source CLI plus skill, Apache-2.0 | Task list or GitHub issues → **PERT (optimistic/most likely/pessimistic)** with spec-clarity, context and agent-fit modifiers; METR reliability thresholds; wave planning; human-equivalent cost | **250+ dispatches validated (May 2026), average 3.7× compression, 75% within calibration band**; pip install; free | Estimates **AI-agent** work, not human team cost; no rates, no outsourcing comparison |
| **agent-estimation (ZhangHanDong)** | Agent "skill", MIT | Task → tool-call rounds → wall-clock | **3 commits**; small | Same scope limitation |
| **Epoch (KyaniteLabs)** | MCP server | PERT, COCOMO II, Monte Carlo, sprint forecasting, token-to-time mapping | **8 GitHub stars**; TypeScript | Early; no cost model |
| **Research front** | Academic work | LLM story-point estimation; LLM early-stage estimation systematic mapping; hybrid human-LLM effort models | Applied Sciences 2025 mapping study; arXiv 2026 story-point study; Springer 2026 hybrid-intelligence effort study | Key finding: effort in LLM-assisted development is **no longer dominated by human artifact size**, so the assumptions behind existing models break |

Sources: [UppLabs AI Estimator](https://www.upplabs.com/products/ai-estimator) · [EstimatorGPT](https://www.estimatorgpt.ai/) · [Estimiqly](https://www.gyanbyte.com/portfolio/ai-project-estimation-tool/) · [Devplan](https://devplan.com/resources/blog/software-project-estimation-ai) · [agent-estimate repository](https://github.com/kiloloop/agent-estimate) · [agent-estimate site and metrics](https://kiloloop.com/agent-estimate/) · [agent-estimation](https://github.com/ZhangHanDong/agent-estimation) · [LLM early-estimation mapping study](https://doi.org/10.3390/app152413099) · [LLM story points, arXiv](https://arxiv.org/abs/2603.06276) · [Hybrid intelligence effort, Springer 2026](https://link.springer.com/article/10.1007/s10791-026-10331-6)

### 6.1 GitHub traction check

Stars read from the GitHub API in November 2026.

| Repository | Stars | What it is |
|---|---|---|
| `boyter/scc` | **8,863** | SLOC, CLOC and complexity counter **with a COCOMO estimate**. The most-starred estimation-adjacent project, and it is a code counter |
| `Otutu11/Effort-Estimation-Using-Historical-Data` | 41 | Streamlit effort-estimation demo |
| `nbrown02/Story-Point-Correlation` | 23 | Power BI story-point correlation template |
| `leftpudding/Function-Point-Spreadsheet` | 22 | LibreOffice/Excel IFPUG function-point spreadsheet |
| `abaranoff/cocomo2` | 9 | COCOMO II PHP library |
| `snelsi/COCOMO-calculator` | 9 | React COCOMO calculator |
| `KyaniteLabs/Epoch` | 8 | MCP estimation server (COCOMO II, Monte Carlo) |

**Conclusion:** there is **no high-traction open-source end-to-end estimator**. The most popular artefact is a line counter. Every serious estimator is closed and quoted. That is an opening and a warning at the same time: nobody has commoditised this, most likely because the benchmark data is the moat.

---

## 7. The commercial layer: contract models the comparison engine must price

Anyone comparing in-house versus outsourced needs to model the contract shape, not just the rate.

| Model | Who carries scope risk | Cash-flow shape | Pros | Cons | Source for framing |
|---|---|---|---|---|---|
| **T&M (time and material)** | Client | Variable, hourly | Full flexibility; transparent hours; good for discovery | Budget uncertainty; hours can run; requires client PM maturity | [MediaTen T&M definition](https://mediaten.ru/outsourcing-developers) |
| **Fixed price** | Vendor | Milestone-based | Budget certainty; easy to approve | Vendor prices the risk in (20-50% premium); change requests become adversarial; scope disputes | [EGAR model list](https://egar.ru/outsourcing) |
| **Dedicated team** | Shared | Monthly per seat | Long-lived products with changing scope; vendor handles HR and bench; fastest ramp | Client must manage product; bench and idle time are priced in; exit means knowledge loss | [YuSMP dedicated team](https://yusmpgroup.ru/blog/vydelennaya-komanda-razrabotchikov-kak-rabotaet) |
| **Outstaffing** | Client | Monthly per seat | Fast (days), no hiring risk, reversible | Client owns delivery; contractor margin on top; weaker commitment | [BUDGET SOFT comparison](https://www.budget-soft.ru/uslugi/it-autstaffing) |
| **Outcome or value-based** | Vendor, shared upside | Milestone plus bonus | Aligned incentives; rising adoption per Deloitte | Hard to define outcomes for internal IT; measurement disputes | [Deloitte 2024 outsourcing survey](https://www.deloitte.com/global/en/issues/work/global-outsourcing-survey.html) |
| **In-house (штат)** | Client | Salary plus 30.2% plus workplace injury plus recruiting | Control, domain knowledge, IP retention | 3-6 weeks to hire (3-6 months for rare stacks); roughly 18-22% TCO above salary in steady state and 60-80% in year one; idle time is paid | [YuSMP in-house TCO analysis](https://yusmpgroup.ru/blog/arenda-razrabotchikov-vs-shtat-kogda-vygodnee) |

The in-house row is the one most tools get wrong. They compare a contractor invoice against a **salary**, not against a **fully loaded internal cost**. §11.1 supplies the correct multiplier.

---

## 8. Layer 5: build-vs-buy and TCO frameworks, plus calculator UX patterns

| Framework or artefact | Core content | Usability as a product reference |
|---|---|---|
| **Thoughtworks, "Build vs. buy: a strategic framework"** (2022 PDF) | Needs definition → cross-functional evaluation → technical needs → vendor assessment → proof of value → **TCO and ROI forecast**. Explicitly warns that vendor-supplied TCO tools obscure true costs | Best-documented end-to-end process. Its instruction to "own the process" supports an independent-estimator positioning |
| **Gartner, "Decision Point for the Build vs. Buy Software Sourcing Decision"** (3 July 2012, paywalled) | Four form-factors: **Build (custom development), Borrow (open source), Buy (COTS), Rent (SaaS)**; criteria across technical architecture, financial, risk and principles; includes scoring sheets and a decision tool | The canonical four-way framing, better than a binary build/buy. Paywalled, so cite the title and summary only |
| **Deloitte Global Outsourcing Survey 2024** | 83% use AI in outsourced services; 80% will maintain or increase third-party outsourcing; **only 26% see a reduction in vendor service cost**; outcome-based models rising; insourcing and captive centres rising | Evidence that "outsourcing equals cheaper" is no longer a safe assumption, so the tool must model both sides honestly |
| **McKinsey core-versus-context logic** (widely restated) | Build what differentiates; buy what merely has to work; hidden integration, migration and process costs often exceed the licence | Use as a decision rule in the UI: a differentiation score gate before the cost comparison |
| **TCO worksheet patterns** (practitioner guides, 2026) | Three to five year TCO, both sides, line by line: initial delivery, integration (often 0.5-2× year-one licence), migration, training, maintenance at **15-25% of build cost per year**, exit, opportunity cost | Directly reusable as the default cost template. Caveat: most such guides are SEO content, not primary research |
| **AWS Pricing Calculator** | Public, no account: add services, configure, **totals with visible arithmetic**, hierarchical groups, shareable link, export to **CSV, PDF or JSON**; explicitly "not a quote tool"; break-even analysis for on-demand versus reserved | **The best UX reference in the whole landscape.** Transparency of the arithmetic, shareable estimates, export, an explicit assumptions page. Copy this interaction model |
| **Azure TCO Calculator** | Workload → on-premises versus Azure comparison | Same pattern: side-by-side comparison as the primary output |

Sources: [Thoughtworks build-vs-buy PDF](https://www.thoughtworks.com/content/dam/thoughtworks/documents/e-book/tw_ebook_build_vs_buy_2022.pdf) · [Gartner Decision Point](https://www.gartner.com/doc/2071619/decision-point-build-vs-buy) · [Deloitte 2024 Global Outsourcing Survey](https://www.deloitte.com/global/en/issues/work/global-outsourcing-survey.html) · [Deloitte/WSJ on the 26% cost-reduction finding](https://deloitte.wsj.com/cio/talent-sourcing-models-adapt-to-future-needs-96a3ccb3) · [TCO line-item guidance](https://counsileum.com/blog/build-vs-buy-decision-framework) · [AWS Pricing Calculator user guide](https://docs.aws.amazon.com/pricing-calculator/latest/userguide/getting-started.html) · [AWS calculator assumptions](https://aws.amazon.com/calculator/calculator-assumptions/) · [AWS calculator features](https://aws.amazon.com/aws-cost-management/aws-pricing-calculator/features)

### 8.1 The four UX patterns worth stealing

1. **Visible arithmetic.** Every total can be expanded to its components. No black box, no "trust us".
2. **Shareable, exportable artefacts.** A link plus CSV, PDF and JSON covers the three audiences: reviewer, spreadsheet modeller, integration.
3. **Explicit assumptions page.** Separate from the result, dated, editable.
4. **Side-by-side comparison as the primary output.** The answer is a comparison, not a single figure.

No vendor in the estimation market applies these four patterns to software effort. Parametric suites produce audit reports, not interactive assumption ledgers. AI tools produce a paragraph.

---

## 9. RU/CIS regulatory and methodological landscape

### 9.1 Standards map: what actually exists

| Document | Status | What it gives you |
|---|---|---|
| **ГОСТ Р 54869-2011** «Проектный менеджмент. Требования к управлению проектом» | Active | Process areas including **управление затратами в проекте**, scope, schedule, risk, deliverables; mandatory process outputs. Not a costing formula |
| **ГОСТ Р ИСО 21500-2023, 21502-2024, 21504-2016** | Active | Project, programme and portfolio guidance (ISO adoptions) |
| **ГОСТ Р 59793-2021** (replaces 34.601-90) | Active since 30.04.2022 | Eight stages of automated-system creation, which becomes **the WBS skeleton for a ГИС estimate** |
| **ГОСТ 34.602-2020** (replaces 34.602-89) | Active since 01.01.2022 | Structure and content of the ТЗ: functional and non-functional requirements, which is the sizing input |
| **ГОСТ Р 59792-2021** (replaces 34.603-92) | Active | Test types, which become test-effort line items |
| **ГОСТ 34.201-2020** (replaces 34.201-89) | Active | Document set for the technical project |
| **ГОСТ Р 59795-2021** (replaces РД 50-34.698-90) | Active | Required content of each document |
| **Постановление Правительства РФ № 676** (06.07.2015, revision 01.07.2026) | Active | ГИС creation requires a **Концепция with технико-экономическое обоснование**; iterative lifecycle now permitted; Минцифры publishes methodological recommendations |
| **Приказ Минэкономразвития № 567** (02.10.2013) | Active, recommendatory but de-facto enforced | НМЦК methods: **market-comparable (three or more prices, coefficient of variation at or below 33%)**, normative, tariff, design-estimate, **cost method**, plus life-cycle cost. Since 01.03.2025 a failure to justify НМЦК is a standalone offence under ч. 3 ст. 7.30.1 КоАП |
| **Методика г. Москвы** (joint order of ДИТ and ДЭПиР, 28.02.2018 № 64-16-89/18/3-р) | Active | **Functional points → thousand conditional lines of code → labour inputs → price**, with named coefficients such as "требуемая надёжность ИС". Direct precedent for FP-based Russian public pricing |
| **Методика Московской области** (Постановление № 1251/38, 11.11.2022) | Active | **Функциональные единицы измерения** → human-months → cost; wages indexed to the **Росстат** nominal wage for OKVED "Разработка компьютерного программного обеспечения"; progressive-estimation principle |
| **Методика РК** (order published at adilet V1900018927) | Active | **RUP process decomposition** (business modelling, requirements, design, development and so on), correction coefficients, human-months, **average cost of one engineer-month**, inflation, location |

**Corrections carried forward, repeated here because they are easy to get wrong in a deck:** ГОСТ Р 56969-2016 is a power-grid standard, not project management; ГОСТ Р 54869-2011 is the project management standard; and five of the ГОСТ 34 series documents were replaced between 2020 and 2022 (see §0).

### 9.2 The structural finding

Russia regulates **process artefacts** (ТЗ, stages, documents) and **procurement price** (Приказ 567). It regulates **functional-size costing** only regionally (Moscow, Moscow Oblast). Kazakhstan regulates functional-size costing **nationally**. China goes further with **GB/T 36964-2018 «软件工程 软件开发成本度量规范»**, which makes function point analysis the national basis for software cost measurement, supported by **GB/T 42588-2023** specifying NESMA estimated function points.

**Russia has no federal equivalent.** That is simultaneously a market gap and a positioning opportunity: implement in software what Moscow, Moscow Oblast and Kazakhstan currently do on paper.

Sources: [ГОСТ Р 54869-2011](https://rosgosts.ru/file/gost/03/100/gost_r_54869-2011.pdf) · [ГОСТ Р 59793-2021 and the replacement table](https://habr.com/ru/companies/angarasecurity/articles/671882) · [ГОСТ 34 series status](https://www.angarasecurity.ru/stati/sudba-trebovaniy-gost-34-y-serii-v-proektakh-po-informatsionnoy-bezopasnosti) · [ПП 676](https://www.consultant.ru/document/cons_doc_LAW_182413/eecf65c8134ba3d1cd1b5422632829f5a04af2c5) · [ПП 676 official publication](http://publication.pravo.gov.ru/file/pdf?eoNumber=0001201507080013) · [Приказ 567](https://normativ.kontur.ru/document?documentId=220720&moduleId=1) · [Приказ 567 in practice, CV 33%](https://tz-lab.ru/knowledge/standards/prikaz-mert-567) · [Москва 2018 methodology, FP to thousand lines](https://base.garant.ru/49651972/53f89421bbdaf741eb2d1ecc4ddb4c33/) · [Московская область 2022 methodology](https://mosoblpravo.ru/postanovlenie/2022/11/11/n-1251-38) · [Методика РК](https://adilet.zan.kz/rus/docs/V1900018927) · [Chinese GB/T 36964-2018 context](https://cloud.tencent.com.cn/developer/article/2657692)

---

## 10. Local Russian tools

| Tool | What it does | Price | Weakness |
|---|---|---|---|
| **Project Calc** (projectcalc.ru; Роспатент registration № 20256139) | WBS-based labour and cost, roles and executors, scenarios, **AI consistency check of estimate documents** (flags missed functional areas, checks term and module consistency) | **unknown, quoted** (online version, registration) | Single-vendor SaaS; no market benchmark; no ISBSG-class dataset; no in-house versus vendor dual model |
| **Estimate / Cash-meter (SimbirSoft)** | 1C-based corporate solution; **hour and money estimate with a min-max range**, role model, approval workflow, Excel export; claims **10,000+ projects estimated** (vendor claim) | **unknown, quoted** ("получить корпоративное решение") | Corporate and 1C lock-in; the range is expert-set, not statistically derived |
| **aimsmart PERT calculators** | Two PERT calculators (analyst effort and programmer effort), with an E + 2σ 95% bound | Free (as published 8 Nov 2026) | Task list only; no cost, no benchmark |
| **productlab.ru calculator** | Team composition × hours × region (RU, Eastern Europe, Western Europe, US, Asia) plus infrastructure and overhead percentage | Free (as published 8 Nov 2026) | Rough order of magnitude only; no risk, no analogues, no build-vs-buy logic |
| **fittin.ru calculator** | Product class → budget band plus timeline plus contract model hint | Free, lead generation (as published 8 Nov 2026) | Marketing instrument |
| **ITRTS, EGAR, MediaTen, BUDGET SOFT, DEVCOM rate cards** | Published hourly rates (see §11.2) | Public (as published 8 Nov 2026) | Rate cards, not estimators |

Sources: [Project Calc](https://projectcalc.ru/) · [Project Calc launch story](https://vc.ru/dev/1819208-project-calc-sistema-dlya-rascheta-trudoemkosti-i-stoimosti-proekta) · [SimbirSoft Cash-meter](https://estimater.ru/) · [aimsmart PERT](https://aimsmart.ru/pert) · [productlab calculator](https://productlab.ru/calculator/software-development-cost) · [fittin calculator](https://fittin.ru/blog/stoimost-razrabotki-po)

---

## 11. Rate benchmarks, 2025-2026

### 11.1 Russia: in-house salaries

All figures gross unless stated. **Every figure in this table is as published 8 Nov 2026**, and each reports survey data collected in 2026; the survey period and sample are given in the source column.

| Grade | Median, RUB per month | Source and scope |
|---|---|---|
| All IT | **191,000** (net, including bonus) | Habr Career calculator, 1H2026, n≈45,226 |
| Developer, Moscow | **270,000** | Habr Career, 1H2026 |
| Developer, St. Petersburg | **247,000** | Habr Career, 1H2026 |
| Developer, regions | **200,000** | Habr Career, 1H2026 |
| Backend junior / middle / senior / lead | 100k / 200k / **330k** / 409k | Habr Career, 1H2026 |
| Frontend junior / middle / senior / lead | 80k / 182k / 305k / 384k | Habr Career, 1H2026 |
| Mobile junior / middle / senior / lead | 100k / 217k / 350k / 468k | Habr Career, 1H2026 |
| 1C junior / middle / senior / lead | 87k / 180k / 270k / 340k | Habr Career, 1H2026 |
| All developers, aggregate gross | median **245,000**; junior 95k / middle 220k / senior 370k / lead 520k | IT-Stat, Q2 2026 (aggregated) |
| hh.ru **offered** median | 96,300 Russia / 147,700 Moscow | hh.ru offered salaries, structurally lower than survey data |

**Employer on-cost, Russia.** Unified tariff **30%** up to the annual base (**2026 limit RUB 2,979,000**), then **15.1%** above it, plus workplace-injury contributions of **0.2-8.5%** by risk class. IT companies retain a reduced regime in some cases, with one source citing 7.6%. The standard planning convention is a **multiplier of 1.302**.

Worked example, and the number an in-house branch must use rather than the salary: **a RUB 270,000 Moscow developer costs roughly RUB 351,500 per month fully loaded.**

Sources: [Habr Career 1H2026 medians](https://habr.com/ru/companies/habr_career/articles/1075936/) · [Salary table by direction and grade](https://proprogrammer.ru/karera/skolko-zarabatyvayut-programmisty) · [IT-Stat Q2 2026](https://www.it-stat.ru/zarplaty-v-it/) · [30%, 15.1% and 0.2-8.5%](https://sfr.gov.ru/branches/spb/info/~2026/09/04/13307?info_category=2) · [30% base and 15.1% excess](https://vitvet.com/articles/nalogi/po_nalogam/strakhovye_2026) · [IT reduced tariff 7.6%](https://vitvet.com/articles/nalogi/po_nalogam/strakhovye_2026) · [1.302 multiplier used in practice](https://yusmpgroup.ru/blog/arenda-razrabotchikov-vs-shtat-kogda-vygodnee)

### 11.2 Russia: contractor rate cards

Every rate below is as published 8 Nov 2026.

| Provider | Rate card |
|---|---|
| **ITRTS** | Sysadmin and DevOps from RUB 2,500/h; 1C support from 2,800; 1C development from 3,200; other languages from 3,500; consulting and audit on request |
| **EGAR** | Developers from RUB 2,500/h; analysts from 2,400; QA from 1,800 (base rate, adjusted for grade and urgency) |
| **MediaTen** | From RUB 3,350/h (T&M, part-time minimum 20 hours; project minimum RUB 800,000) |
| **YuSMP Group** | Junior 1,500-3,200; middle **3,700-6,600**; senior **from 6,700** (citing Klerk.ru); a five-person team approximately RUB 1.8-2.5m per month |
| **BUDGET SOFT** | From RUB 1,400/h (QA), **1,900/h** middle and above, **2,500/h** senior |
| **DEVCOM** | 1C development 2,600-3,000; QA for 1C 2,400-3,100; business and systems analyst 2,800-3,300; Java development 2,400-3,300 |
| **up-im** | RUB 1,000-1,500 (junior freelancer) up to 3,000-4,500 (agency senior); single rate 2,500/h; **in-house hour costed at RUB 2,400-3,600** |
| **KVANT-C** (1C niche) | Freelance 500-1,500; outsource 1,500-2,500; staff junior 60-90k per month; senior outsource **5,000-10,000/h** |

**Consolidated planning bands, Russia 2026:** junior RUB 1,500-3,200; middle 2,200-6,600; senior 3,000-6,700+; team lead 4,500+. Expect a **1.5-3× spread** between an individual freelancer and a brand-name integrator for the same nominal grade. Any comparison that uses a single rate card is mis-specified.

Sources: ITRTS rate card, published on the provider site (no URL was captured in the source research, so none is cited here) · [EGAR outsourcing models](https://egar.ru/outsourcing) · [MediaTen outsourcing](https://mediaten.ru/outsourcing-developers) · [YuSMP rate bands and 1.302](https://yusmpgroup.ru/blog/arenda-razrabotchikov-vs-shtat-kogda-vygodnee) · [BUDGET SOFT outstaffing](https://www.budget-soft.ru/uslugi/it-autstaffing)

### 11.3 Kazakhstan: in-house

Every figure below is as published 8 Nov 2026; the source column states the survey or register and its sample.

| Metric | Value | Source and caveat |
|---|---|---|
| IT median, survey | **KZT 1.2m/month** (p25-p75: 700k-1,549.6k) | RAEM citing Taylor.kz; high, likely a remote or international sample |
| IT median, vacancy-based | **KZT 500,000** (p25 350k, p75 800k; n=313 vacancies) | Taylor.kz, November 2026 |
| Programmer median offered | **KZT 359,198** (2025) → **KZT 441,597** (January 2026) | hh.kz |
| Official average wage, IT sector | Approximately **KZT 1.3m** | Bureau of National Statistics via TAdviser |
| Grades, vacancy sample | Junior 325k, middle 575k, senior 1,000k | Taylor.kz |
| Grades, survey sample | Junior 507k, middle 1.1m, senior 1.5-2.44m, lead 2.2m | RAEM |
| **Discrepancy warning** | 500k, 1.2m and 1.3m describe **different populations** (vacancies, anonymous surveys, official payroll). Do not average them. |  |

**Employer on-cost, Kazakhstan, 2026:** **ОПВР 3.5% + СО 5% + ООСМС 3% + СН 6%** (social tax cut from 11%, with the СО offset abolished). Worked examples: KZT 4,000,000 salary → KZT 485,710 employer on-cost, or **12.1%**; at KZT 85,000 → **16.8%**. The planning **multiplier is 1.12-1.17**, roughly half the Russian burden. That difference is decisive for any Russia-versus-Kazakhstan comparison.

Sources: [RAEM and Taylor.kz medians](https://raem.kz/skolko-zarabatyvaet-it-speczialist-v-kazahstane-v-2026-godu) · [Taylor.kz salary data](https://taylor.kz/salaries) · [hh.kz IT results 2025](https://hh.kz/article/34221) · [Official KZT 1.3m average](https://www.tadviser.ru/index.php/%D0%A1%D1%82%D0%B0%D1%82%D1%8C%D1%8F:%D0%97%D0%B0%D1%80%D0%BF%D0%BB%D0%B0%D1%82%D1%8B_%D0%98%D0%A2-%D1%81%D0%BF%D0%B5%D1%86%D0%B8%D0%B0%D0%BB%D0%B8%D1%81%D1%82%D0%BE%D0%B2_%D0%B2_%D0%9A%D0%B0%D0%B7%D0%B0%D1%85%D1%81%D1%82%D0%B0%D0%BD%D0%B5) · [2026 payroll rates and worked examples](https://uppersetup.com/ru/blog/employer-payroll-taxes-and-contributions-in-kazakhstan-2026) · [Base rates table 2026](https://nalogikz.kz/docs/basic-rates-2026.html) · [СН 6% mechanics](https://pro1c.kz/news/zakonodatelstvo/stavka-sotsialnogo-naloga-snizhena)

### 11.4 Offshore and nearshore rates, USD per hour

All rates below are as published 8 Nov 2026.

| Region | Junior | Mid | Senior | Source |
|---|---|---|---|---|
| **Asia (Accelerance network)** | not published | not published | **USD 31-41** | Accelerance 2026 guide via [STG](https://stgconsulting.com/onshore-vs-nearshore-vs-offshore-software-development-the-2026-cost-comparison) |
| **Europe (CEE)** | USD 31-39 | not published | **USD 64-76** | same |
| **Latin America** | USD 33-45 | not published | **USD 60-75** (rates fell 7.1% in 2025) | same |
| **India (Clutch band)** | USD 15-25 | USD 25-40 | **USD 35-55** | [Clutch via Easital](https://easital.com/blog-details/offshore-software-development-rates-by-country) |
| **Poland** | USD 30-40 | USD 45-60 | **USD 60-90** | [vamasters](https://vamasters.com/software-development-outsourcing-rates-by-country/) |
| **Ukraine** | USD 25-30 | USD 35-45 | **USD 45-65** | same |
| **US onshore** | not published | not published | USD 50-99 (Clutch band); approximately USD 93/h fully loaded median employee | [Clutch via Easital](https://easital.com/blog-details/offshore-software-development-rates-by-country) · [BLS-based calculation](https://stgconsulting.com/onshore-vs-nearshore-vs-offshore-software-development-the-2026-cost-comparison) |

**Armenia (sourced, October 2026):**

| Data point | Value | Evidence quality |
|---|---|---|
| Senior-only placement, US contract | **USD 25-50/h** | Vendor rate card, verified October 2026 |
| Staff augmentation "from" rate | **USD 15/h** entry; dedicated teams from 15 | Vendor marketing; treat 15 as a floor, not a median |
| Per engineer-month | **USD 2.4k-8k** | Vendor-computed band |
| Agency average band | **USD 25-49/h** (3 of 5 disclosing companies); USD 50-99 (1 of 5) | Directory sample, n=6, as of 31 October 2026 |
| Upwork Node.js listings | USD 23-35/h | Marketplace listings |
| Monthly blended by role | Python developer **USD 3,563/mo**, data science **USD 4,037/mo**, QA automation USD 1,586/mo | Vendor rate card 2026 |

**Georgia: unknown.** The only data point found is a multi-country vendor with a Tbilisi office quoting USD 50-99/h, which is a blended brand band and says nothing about Georgian payroll. Do not put a Georgia number in the deck. Closing it needs a primary source: local job boards such as `jobs.ge`, a Georgian vendor rate card, or three quotes.

Sources: [Armenia senior rate card](https://rocketsystems.net/locations/armenia) · [Armenia guide, USD 15 entry](https://rocketsystems.net/blog/software-outsourcing-to-armenia-guide-2026) · [Armenia per engineer-month](https://rocketsystems.net/blog/armenian-developers-for-uae-companies) · [Armenia agency bands](https://superbcompanies.com/categories/software-development-companies-in-armenia/) · [Armenia monthly by role](https://sourcefit.com/outsourcing-armenia) · [Amsoft dedicated teams](https://amsoft.am/services/dedicated-team/) · [Astudio outsourcing](https://astudio.am/en/services/outsourcing) · [Upwork Armenia Node.js](https://www.upwork.com/hire/nodejs-developers/am) · [Georgia data point, Energize Global Services](https://enosisoutsourcing.com/profile/energize-global-services) (the source research also contained a malformed variant, `enosisoutsourcing.profile/energize-global-services`, superseded by this canonical URL)

**Important nuance.** Offshore and nearshore rate gaps are positioning, not payroll. Of 6,658 companies with public rates, only **1.1%** publish a rate on their own website; **80%** of Czech shops position at USD 50+/h against **16%** of Indian shops. The "nearshore premium" is largely a brand choice, so a pure rate-table comparison will mislead. Source: [Offshore.dev, 6,658 companies across 20 countries](https://offshore.dev/reports/offshore-development-rates-2026)

### 11.5 Derived cross-jurisdiction comparison

All rows derived from the sourced figures above, as published 8 Nov 2026.

| Source region | Senior USD/h | Fully loaded employer multiplier | Note |
|---|---|---|---|
| Russia, in-house | approximately RUB 3,000-4,500, about **USD 37-56** | **×1.302** (30% plus injury) | Highest on-cost in the set |
| Russia, contractor | RUB 3,000-6,700, about **USD 37-83** | included | Wide spread, brand-driven |
| Kazakhstan, in-house | KZT 1.0-1.5m, about **USD 2.2-3.3k/mo or USD 13-20/h** | **×1.12-1.17** | Cheapest fully loaded option in the CIS |
| Armenia, contractor | **USD 25-50** | included | Rough parity with the Russian mid-market |
| Poland / CEE | **USD 60-90** | included | Two to three times Armenia |
| India | **USD 35-55** | included | Often **above** Armenia at senior level |

The non-obvious, decision-relevant fact: at senior level, **Armenia is now cheaper than India** (25-50 versus 35-55) and roughly at parity with a Russian mid-market contractor, while **Kazakhstan in-house is the cheapest option in the entire comparison** once the 1.12-1.17 multiplier replaces Russia's 1.302. Any tool that hard-codes "offshore equals cheap" will produce a wrong recommendation for a Russian industrial client. No competitor in this landscape can produce that insight, because none models jurisdiction-specific employer burden.

---

## 12. Gap synthesis: what nobody does

### 12.1 The ten-stage chain and the coverage score

The useful framing is not "which tool is best" but **which stage of the chain each tool owns**. The chain this track requires:

**A** free-text intake → **B** ISO functional sizing → **C** calibrated effort model → **D** dual cost basis (in-house fully loaded versus contractor) → **E** risk distribution → **F** market analogues → **G** build-vs-buy verdict → **H** explainable assumption ledger → **I** RU/KZ regulatory output → **J** self-serve at a published price.

Scoring: **0** absent, **1** partial or manual, **2** native. Maximum 20. Each score is an assessment against the evidence cited in this document, not a vendor self-rating.

| Tool | A | B | C | D | E | F | G | H | I | J | **Total** |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| **PRICE / TruePlanning** | 0 | 1 | 2 | 0 | 2 | 1 | 1 | 2 | 0 | 0 | **9** |
| **agent-estimate (OSS)** | 2 | 0 | 1 | 1 | 1 | 0 | 0 | 2 | 0 | 2 | **9** |
| **Galorath SEER-SEM** | 0 | 1 | 2 | 0 | 2 | 1 | 0 | 2 | 0 | 0 | **8** |
| **QSM SLIM** | 0 | 1 | 2 | 0 | 2 | 2 | 0 | 1 | 0 | 0 | **8** |
| **UppLabs AI Estimator** | 2 | 0 | 1 | 1 | 1 | 0 | 1 | 0 | 0 | 2 | **8** |
| **Project Calc (RU)** | 0 | 0 | 1 | 1 | 1 | 0 | 0 | 1 | 1 | 1 | **6** |
| **Planisware** | 0 | 0 | 1 | 0 | 1 | 0 | 1 | 1 | 0 | 1 | **5** |
| **SCOPE (Total Metrics)** | 0 | 2 | 0 | 0 | 0 | 1 | 0 | 2 | 0 | 0 | **5** |
| **Tempo (Jira)** | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 1 | 0 | 2 | **5** |
| **ScopeMaster** | 1 | 2 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 1 | **5** |
| **ISBSG** | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 1 | 0 | 1 | **4** |
| **Jellyfish** | 0 | 0 | 0 | 1 | 0 | 1 | 0 | 1 | 0 | 0 | **3** |
| **Target product** | **2** | **2** | **2** | **2** | **2** | **1 to 2** | **2** | **2** | **2** | **2** | **17-18** |

**The single conclusion that should drive the concept document:** no product scores above **9/20**, and the failures are systematically complementary. Parametric vendors own C, E and H but have no intake, no dual cost basis and no Russian regulatory layer. AI tools own A and nothing else. Russian tools own part of I and nothing else. Russian rate cards and government methodologies exist, but they are not wired to each other.

### 12.2 The seven specific gaps, with evidence

| # | Gap | Hard evidence | Closest incumbent | Why it stays open |
|---|---|---|---|---|
| **1** | **Intake to size, in Russian, from a ТЗ** | ScopeMaster documents five languages, none Russian; SCOPE needs a certified counter | ScopeMaster (English) | Language and certification economics |
| **2** | **Dual cost basis with real employer burden** | Russia ×1.302 versus Kazakhstan ×1.12-1.17; no tool models either | Tempo, Jellyfish (single-jurisdiction rates) | They are US-centric; RU/KZ payroll is a boring localisation moat |
| **3** | **Sizer to model hand-off without a certified human** | SCOPE's only estimation output is a SEER-SEM file export; manual counting runs 200-600 FP per day | SCOPE plus SEER-SEM | Both require trained specialists; automation is the wedge |
| **4** | **A benchmark you are allowed to embed** | ISBSG licence prohibits resale in any form and incorporation into any product for resale | ISBSG itself (AUD 3,000 per user per year) | The barrier is legal, not technical |
| **5** | **Build-vs-buy as a verdict, not a footnote** | Gartner's four-way model dates from 2012 and is paywalled; UppLabs gives one bullet | UppLabs | Nobody scores the decision |
| **6** | **RU regulatory artefacts** | Москва-2018 FP-to-ruble formula; МО-2022 functional units to human-months; Приказ 567 requires three prices with CV at or below 33%; China has GB/T 36964-2018, Russia has no federal equivalent | Project Calc (partial) | Requires domain translation, not machine learning |
| **7** | **Explainability as a UI contract** | AWS Pricing Calculator is the only consumer-grade "see the math" pattern with export and shareable links; parametric vendors issue audit reports, not interactive assumption ledgers | AWS Pricing Calculator | Nobody has applied it to software effort |

### 12.3 Why single-point estimates are indefensible

| Finding | Magnitude | Source |
|---|---|---|
| Projects with effort or schedule overrun | **60-80%** of projects; average overrun **30-40%** | Moløkken and Jørgensen survey review |
| Standish CHAOS "189% overrun" | **Methodologically unsound**; population biased toward failures; likely too high | Jenkins review in *Information and Software Technology* |
| Formal models versus expert judgement | **"No evidence that formal estimation models lead to more accurate estimates"**; expert judgement is the most-used method | Moløkken and Jørgensen |
| Function-point-estimated projects | Had **larger** overruns than others in one survey | Heemstra and Kusters, via the same review |
| Estimates versus actuals | Often differ **by a factor of two or more**; input reliability varies widely; managers "manage to the estimate", which corrupts historical data | US National Academies, *Statistical Software Engineering* |
| Cognitive bias | Planning fallacy, over-optimism, over-confidence, confirmation and bandwagon bias in model building | Mair and Shepperd; Prince, "The Dangers of Parametrics" (NASA) |

**Design implication:** a tool that outputs one number is scientifically indefensible. The defensible output is a **distribution plus an assumption ledger plus a reference-class justification**. That is also the clearest differentiator against every hour × rate calculator in Russia.

Sources: [Moløkken and Jørgensen survey review](https://static.aminer.org/pdf/PDF/000/435/238/a_review_of_surveys_on_software_effort_estimation.pdf) · [Jenkins on the CHAOS 189% figure](https://www.sciencedirect.com/science/article/abs/pii/S0950584905001023) · [US National Academies](https://www.nationalacademies.org/read/5018/chapter/6) · [Mair and Shepperd](https://dl.acm.org/doi/pdf/10.1145/1985374.1985393) · [The Dangers of Parametrics](http://hdl.handle.net/2060/20170005353)

### 12.4 Two claims downgraded to "not verified"

Both were asserted in the first research pass and cannot be shipped as written.

| Original claim | Status | Corrected wording |
|---|---|---|
| "Nothing ingests a **Russian-language ТЗ**" | **Unverified inference.** ScopeMaster documents English, Spanish, Portuguese, Italian and French only; SCOPE is "multi-lingual" but publishes no language list; no Russian vendor advertises text-to-size from a Russian ТЗ | "**No tool found advertises Russian-language requirement-text intake.** ScopeMaster publishes five supported languages, none Russian; SCOPE's localisation list is unpublished. Verify before claiming white space." |
| "ISBSG coverage of RU/KZ is **thin**" | **Unverified.** ISBSG publishes "26 countries" (2023) and "over 30" (2025) but **no country breakdown** | "ISBSG reports 26-30+ countries **without a published country breakdown**; RU/KZ representation cannot be confirmed from public material. Request the Demographics Report before assuming comparables can be bought." |

Both claims are still *likely* true. "Likely" is not citable. The second one is a procurement blocker that must be resolved anyway (see Appendix A).

---

## 13. Positioning wedge and differentiation thesis for the ТМК++ track

### 13.1 Positioning statement

> **"Should-cost for IT."** Paste a Russian-language ТЗ → get an ISO-based functional size → get two fully loaded price tags (your own team at ×1.302 versus a contractor at market rates) → get a P50/P80/P90 range with the assumptions on the page → get a build-vs-buy verdict and a Приказ-567-compatible justification pack.

The word choice is deliberate. **"Should-cost", not "estimate"** reframes the output from a guess about the future, which the research says is unreliable, into a number you negotiate with. The framing is defensible, memorable, and borrows the credibility of manufacturing should-cost tools such as Costimator without borrowing their domain.

### 13.2 The four defensible wedges, ranked

| Rank | Wedge | Why it holds | Effort |
|---|---|---|---|
| **1** | **Dual cost basis with jurisdiction multipliers** (RU 1.302, KZ 1.12-1.17) | Nobody else has it; it changes the answer (KZ in-house beats a RU or Armenian contractor); it is a lookup table plus twenty lines of arithmetic, not machine learning | **Low** |
| **2** | **RU regulatory output pack** (567 justification with three prices and a CV, Москва-2018 FP formula, МО-2022 functional units, ГОСТ Р 59793 stage plan) | Boring, specific, unglamorous, and not buildable by global vendors; immediately verifiable by a procurement reviewer | **Medium** |
| **3** | **Risk-first output** (P50/P80/P90, top-10 cost drivers, assumption ledger) | Answers the published failure mode directly; benchmark-able UX exists in the AWS calculator | **Medium** |
| **4** | **Text to size in Russian** | The visible "wow"; ScopeMaster proves it is technically possible in five other languages | **High**, and only if a Russian requirements corpus exists |

Ship 1 and 3 first. Wedge 2 is the differentiator against Russian incumbents. Wedge 4 is the demo moment, not the moat.

### 13.3 Why this is defensible in a ТМК++ / industrial context

1. **Nobody in RU/CIS sells an estimator; they sell calculators or consulting.** Local tools are hour × rate sheets or 1C-embedded workflow.
2. **The regulatory artefacts are a moat.** Producing a 567-style three-price justification, a Москва/МО-style functional-size calculation and a ГОСТ Р 59793 stage plan is boring, specific and unglamorous, which is exactly what global vendors will not build.
3. **The benchmark is the hard part, and ISBSG licensing blocks the lazy path.** A defensible substitute is needed: an own reference class (ТМК IT portfolio plus partner integrators), calibrated openly, with published global PDR ranges as priors. Say this explicitly in the concept document. It is the single biggest execution risk.
4. **Risk-first UX is the visible differentiator.** P50/P80/P90, top-10 cost drivers and an assumption ledger, in a Russian-language interface, at self-serve speed.

### 13.4 What not to build

- **Do not build a COCOMO calculator.** `scc` already gives COCOMO from SLOC for free at 8,863 stars. It is a commodity and it signals "toy".
- **Do not attempt a Jira or Linear integration in v1.** That means competing with Tempo at USD 4.39/user/mo and Jellyfish at a five-figure, sales-led ACV. Pre-project is uncontested; in-flight is a knife fight.
- **Do not claim "AI predicts your project".** The 2026 literature says effort in LLM-assisted work is no longer a function of artifact size. A point estimate from an LLM is the least defensible artefact available. Sell calibrated ranges and auditable assumptions.
- **Do not ship an Armenian or Georgian rate without a primary source.** One vendor's USD 50-99 band is not a market.

### 13.5 Benchmark strategy: the only real strategic decision

Three options. Pick one before writing the roadmap.

| Option | What it is | Pros | Cons |
|---|---|---|---|
| **A. Own corpus** (recommended) | ТМК IT portfolio plus three to five partner integrators' closed projects, normalised to function points, at least 60 projects for credible percentiles | Defensible, embeddable, no licence risk, improves with use | Slow; 6-12 months to critical mass; cold-start problem at demo |
| **B. License ISBSG** | AUD 3,000 per user per year (as published 8 Nov 2026) | Instant global credibility, 13,718 projects | **The licence forbids embedding in a resold product**, so you can consult on it, not productise it |
| **C. Published priors** | Cite public PDR ranges (ISBSG short papers, DCG and LEDAmc guides) as **sourced priors**, not as your dataset | Free, citable, honest | Weak moat; every competitor can do the same |

**Recommended hybrid:** C at launch, as an honest "industry prior" band that is clearly labelled, moving to A as the moat. Be explicit in the UI about which numbers are priors and which are the product's own data. That transparency is itself a differentiator in a market where parametric vendors hide calibration and AI tools hide their training set.

### 13.6 Execution risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Benchmark cold-start**: no data, so "market analogues" is vapour | **Fatal** | Ship v1 with sourced priors and a visible confidence grade; recruit three design partners who contribute closed projects |
| **Russian text-to-size quality**: the model mis-sizes a Russian ТЗ | High | Human-in-the-loop review; report a **size confidence band**, never a single FP count; certify against five manual counts |
| **Buyer does not believe a new tool** | High | Output the **calculation**, not the conclusion; make every line editable; ship the 567-style pack so the number is externally checkable |
| **Incumbent bundling** (ScopeMaster adds cost and Russian; Tempo adds pre-project) | Medium | The moat is I (regulatory) and D (jurisdiction), both localisation-heavy for them |
| **Scope creep into PPM** | Medium | Hard product boundary: **stop at the decision**, do not become a tracker |
| **Regulatory drift** (the ГОСТ replacements already happened once, in 2020-2022) | Low to medium | Version the regulatory profiles; date-stamp every output |

### 13.7 One-paragraph summary for the concept document

> The global estimation market is split between parametric suites that produce defensible numbers only in the hands of certified specialists (SEER-SEM, SLIM, TruePlanning, SCOPE, all quoted, all enterprise) and engineering-analytics platforms that cost **existing** work rather than forecasting new work (Jellyfish, Tempo, Swarmia, DX). AI entrants from 2023-2026 solve intake and nothing else: they emit hours with no ISO size, no benchmark, no jurisdiction cost model and no auditable uncertainty. In Russia and Kazakhstan the situation is inverted. Detailed public methodologies exist (Москва-2018 and МО-2022 functional-size formulas, Kazakhstan's RUP-based national methodology, Приказ 567 procurement rules), but the only commercial tools are hour × rate calculators and a 1C-embedded workflow tool. **The gap is not a missing model; it is a missing assembly.** No product connects free-text intake → ISO functional size → two fully loaded cost bases → a risk distribution → a build-vs-buy verdict → a procurement-ready artefact. That assembly, localised to Russian-language input and Russian/Kazakh cost structures, is the defensible product.

---

## Appendix A. Source confidence and open unknowns

### A.1 Confidence tiers

- **Vendor-primary, high confidence:** Planisware product page; Galorath SEER pages; QSM product pages; Unison/PRICE; MTI Costimator history; ISBSG prices; ISO catalogue entries; COSMIC; ScopeMaster; Tempo prices; Linear prices; Swarmia prices; AWS calculator documentation; SCOPE history, clients and method pages.
- **Marketplace and G-Cloud list prices, high confidence but not a negotiated price:** IBM Targetprocess at USD 40,500 for 125 users; Apptio One at GBP 42,000 per licence.
- **Third-party trackers, medium confidence:** Planisware Orchestra at USD 45/user/mo (Capterra via PortfolioHub); Jellyfish ACV of USD 30k-60k (CodePulse); Linear historical price increases (PricePulse/UsagePricing).
- **Secondary claims not to put in a client-facing deck without re-verification:** Atlassian-DX "USD 1B" and the 10 November 2025 close date; Appfire acquiring Flow in February 2025 and the 31 December 2027 retirement; Swarmia's "95% FTE accuracy" (a vendor claim); the "Gartner SaaS hidden costs +150-200%" figure, which circulates in SEO blogs and whose primary report could not be located, so it is excluded from this document entirely.
- **Explicitly unknown pricing, all quoted only:** SEER-SEM, QSM SLIM, PRICE/TruePlanning, DCG, CAST, DX, Uplevel, Jellyfish, Project Calc, SimbirSoft Cash-meter, EstimatorGPT, Devplan, Costimator at current list.
- **Numbers deliberately not invented:** Armenia and Georgia nearshore rates in the first pass (Armenia is now sourced, Georgia remains unknown); any "average cost per function point in Russia" (no public dataset was found).

### A.2 Open unknowns register

| Item | Why it matters | How to close |
|---|---|---|
| SEER-SEM, SLIM, TruePlanning, SCOPE, DCG, CAST unit pricing | Proves the claim that enterprise tools are out of reach | One vendor call each; a single quoted seat price is enough |
| ISBSG country breakdown for RU/KZ projects | Determines whether licensing ISBSG is viable at all | Request the D&E Demographics Report, free per ISBSG |
| Whether ISBSG permits **derived percentiles** in a commercial product | Defines the legal boundary of the licensing option | Written answer from ISBSG, not a reading of the licence |
| Georgia developer rates | Needed if Kazakhstan or Georgia nearshore is in scope | `jobs.ge` scrape or three vendor quotes |
| Russian-language capability of ScopeMaster and SCOPE | Validates gap #1 | Direct product question; do not infer |
| Actual count of RU IT tenders publishing function-point justifications | Sizes the market-education burden | Контроль-44 or zakupki.gov.ru keyword study |
| COCOMO III publication status | If released, changes the free-tool baseline | Monitor boehmcsse.org |

### A.3 Verification queue, ordered by risk reduction per hour

1. **Ask ISBSG in writing** whether an aggregated or derived benchmark, as distinct from raw records, can be embedded commercially. The licence says no resale and no embedding; the boundary for derived percentiles is worth a written answer.
2. **Put the Москва-2018 and МО-2022 formulas into a spreadsheet** and test them on three real ТМК IT initiatives. If they produce plausible numbers, a "regulatory mode" already exists.
3. **Price-check one SEER-SEM seat and one SLIM seat** through a vendor call. A single quoted figure substantially strengthens the "enterprise tools are out of reach" claim.
4. **Count how many RU IT tenders publish a functional-size justification.** Near zero means a high market-education burden; a growing number writes the timing argument by itself.
5. **Decide the benchmark strategy now**: own corpus, licensed, or published priors. Everything else in the product is engineering. This is the only true strategic choice.
