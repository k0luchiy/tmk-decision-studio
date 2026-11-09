# Estimation Cockpit: UI/UX and Design Specification

**Context:** an estimation tool for ТМК, an industrial B2B customer. The job is to turn a rough task description into a defensible estimate of scope, effort, duration, and cost, and to compare in-house delivery against contractors. This document converts the pattern research into a buildable screen spec.

---

## TL;DR

- **One screen, not a wizard.** Inputs on the left, the answer at the top of the canvas, the reasoning below it, the comparison rail on the right. Information order: **Inputs → Answer → Why → Compare**.
- **Every number is a range with provenance.** Clicking any figure opens a formula drawer that names its parents, their sources, and what changed since the base case.
- **Baseline is immutable.** Edits live in a scenario sandbox until the user explicitly saves, the Jira Plans model.
- **Charts are named after the question they answer**, not after their geometry. "When does in-house become cheaper?" is the break-even chart.
- **Four charts carry the demo:** break-even crossover, waterfall build-up, tornado sensitivity, and the decision matrix. Radar is a thumbnail only, never the hero.
- **Density targets:** 14px product type, 32px compact table rows, 56px top bar, 320px brief rail, 360px verdict rail, 480px formula drawer, 1440×900 baseline viewport.
- **Non-negotiables:** no dual-axis charts, no single point estimate, no auto-applied AI extraction without a visible confirm step, no color-only encoding.
- **Build order:** P0 gets the cockpit shell, parse, verdict, break-even, comparison, formula drawer, and PDF. P1 adds the review table, waterfall, tornado, scenarios, risk register, and matrix. P2 adds TCO, Monte Carlo bands, XLSX, share links, command palette, and dark mode.

---

## 0. Design stance: three rules

**1. No naked numbers.**
Industrial buyers sign off on assumptions, not on point estimates. Every figure is a range (P50 to P80) with a click path to its formula, its source, and its price-book version. A number that cannot explain itself does not belong on the screen.

**2. Scenario safety.**
Editing never destroys the baseline. All changes live in a diff layer until explicitly committed. Users must be able to try a contractor-heavy plan, dislike it, and return without losing the original.

**3. Density with calm.**
13 to 14px product type, 32px table rows, thin borders instead of shadows, exactly two accent colors. This is Carbon / Siemens iX discipline, not consumer-SaaS airiness. The screen is busy because the decision is busy; the visual system keeps it legible.

---

## 1. Calculator teardowns

### 1.1 What each product actually does

| Product | Layout | Signature idiom worth stealing | Weakness to avoid | Reference |
|---|---|---|---|---|
| **AWS Pricing Calculator** | Service picker → per-service config → "My Estimate" document | The estimate is a *document*, not a form: groups, upfront/monthly/12-month columns, CSV/PDF/JSON export, share link that freezes a point-in-time price | Share links are snapshots that silently go stale; editing never updates an already-shared link | [calculator.aws](https://calculator.aws/), [export docs](https://docs.aws.amazon.com/pricing-calculator/latest/userguide/export-estimate.html), [share docs](https://docs.aws.amazon.com/pricing-calculator/latest/userguide/save-share-estimate.html) |
| **Azure Pricing Calculator** | Three zones: product picker (left), estimate plus config (center), estimation summary (bottom) | **Multiple named estimates** as first-class what-if objects; clone a product config; export to Excel; currency switch | Summary sits below the fold; you scroll past configuration to see totals | [azure.microsoft.com/pricing/calculator](https://azure.microsoft.com/en-us/pricing/calculator/), [learn docs](https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/pricing-calculator) |
| **Google Cloud Pricing Calculator** | Catalog plus config | Persistent **cost details panel**; monthly *and* annual (×12) side by side; side-by-side estimate comparison | Annual is a naive ×12, which they correctly label as such | [cloud.google.com/products/calculator](https://cloud.google.com/products/calculator), [billing docs](https://cloud.google.com/billing/docs/how-to/estimate-costs) |
| **Stripe Pricing** | Rate-card page, not a calculator | **Componentized disclosure**: base 2.9% + 30¢, then expandable "+0.5% manually entered, +1.5% international, +1% conversion" | No native reverse solve; third parties add it | [stripe.com/pricing](https://stripe.com/pricing) |
| **Vercel Pricing** | Plan matrix plus metered usage rate table | Plan *and* usage in one mental model: seat price, included allowance, overage rate | Their own page has no interactive estimator; third-party calculators fill the gap with a seat slider and workload presets | [vercel.com/pricing](https://vercel.com/pricing), [docs](https://vercel.com/docs/pricing), [toolradar](https://toolradar.com/tools/vercel/calculator), [makerkit](https://makerkit.dev/pricing-calculator/vercel) |
| **Cloudflare** | Static plan comparison plus per-product meters | Honest tiering: plan fee is per zone, Workers and R2 are metered separately | **There is no official unified Cloudflare TCO calculator.** Anything claiming to be one is third party. Do not cite it as a product reference. | [cloudflare.com/plans](https://www.cloudflare.com/plans/) |

### 1.2 Calculator anatomy: six patterns

**P1. Three-zone shell.**
Catalog and inputs on the left, configuration canvas in the center, a persistent total on the right or pinned to the bottom. The total must never scroll out of view. AWS and Azure both fail this partially; fix it with a sticky verdict rail.

**P2. Progressive disclosure ladder.**
Four optional levels: `Plan/tier → Product/service → Configuration → Advanced (reserved, savings plan, modifiers)`. A collapsed level shows *the chosen value*, never the word "Configure". Azure's product module is the reference: high-level filters at top, dependent options below, defaults pre-filled so the estimate is valid before the user touches anything.

**P3. Reverse solve.**
Stripe's third-party calculators expose two modes: *what I receive* against *what to charge*. For ТМК this is the highest-value idiom. "The budget is ₽5M, what scope and team fit?" goes on the verdict card as a `Estimate → Target` toggle. Solving backwards is a different mental task; it deserves its own mode, not a hidden feature.

**P4. Estimate as a versioned artifact.**
Named estimates (Azure), share links pinned to a frozen price-book version (AWS), exports that embed the parameters (AWS). Industrial procurement needs to answer: who estimated what, on which price list, on which date.

**P5. Right rail as a live, editable mirror.**
The summary is not read-only. Clicking a line in the summary jumps to and focuses the originating control; editing the control updates the summary in place. This is the "right-to-left editing" idiom: the rail is a control surface, not a report.

**P6. Grouping and billing-period grammar.**
Group line items by architecture component or cost owner. Show `Upfront / Monthly / Annual / 3-year TCO` as columns, not tabs. Tabs hide the comparison; columns make it scannable.

### 1.3 Anti-patterns observed

- **A single total with no range** (Vercel, Cloudflare plan pages). Correct for list pricing, fatal for project estimation.
- **Currency and region buried in settings.** The price book must be visible in the top bar.
- **Export as an afterthought.** AWS treats it as a feature; everyone else treats it as a button.
- **Catalog-first with an empty cart.** Pre-seed a plausible baseline so the first render is meaningful.

---

## 2. Planning tool teardowns

### 2.1 What each tool teaches

| Tool | What it is | Idiom to copy | Reference |
|---|---|---|---|
| **Jira Plans (Advanced Roadmaps)** | Cross-team planning over Jira issues | **Eight view modes for eight questions**: Summary, Timeline, List, Program Board, Calendar, Teams, Dependencies, **Scenarios**. Scenarios are a sandbox with a color flag on every changed item; "Review changes" commits to Jira | [Atlassian guide](https://www.atlassian.com/software/jira/guides/advanced-roadmaps/overview), [Scenarios doc](https://confluence.atlassian.com/jirasoftware/scenarios-in-advanced-roadmaps-1688898863.html), [capacity doc](https://support.atlassian.com/jira-software-cloud/docs/enable-capacity-planning-in-advanced-roadmaps/) |
| **Linear** | Issue tracking with project planning | **Cycle capacity dial** ("will we finish?"); **cycle graph** with four explicitly labelled series (gray = scope, dotted = target pace, yellow = started, blue = completed); **timeframes with deliberate uncertainty** (year, half, quarter, month, day) | [Cycles](https://linear.app/docs/use-cycles), [Cycle graph](https://linear.app/docs/cycle-graph), [Timeline](https://linear.app/docs/timeline), [Projects](https://linear.app/docs/projects) |
| **Tempo Capacity Planner** | Resource and capacity planning on Jira | **Three-state capacity cell**: green check means fully allocated, yellow bar means room left, red bar means overbooked. Weeks/Days toggle. Work-item side panel dragged onto a person's timeline | [Resource Planner](https://help.tempo.io/planner/latest/overview-of-resource-planner) |
| **Planisware** | Enterprise PPM | **Scenario comparison as the primary object**: business case → scorecards (qualitative) plus NPV and cash flow (quantitative) → efficient frontier and sensitivity analysis → what-if resourcing simulation. Parametric estimation and estimation-by-analogy are explicit methods | [Product](https://planisware.com/products/planisware-enterprise), [Strategic planning](https://planisware.com/capabilities/strategic-planning) |
| **Broken Build Monte Carlo** | Jira app | Histogram of outcomes plus cumulative probability curve, **P50/P70/P85/P95 dashed markers**, RAG bands (>85% green, 50 to 85% amber, <50% red), target marker. Default run is 100,000 trials | [App](https://www.brokenbuild.net/apps/agile-monte-carlo-charts), [reading guide](https://brokenbuild.atlassian.net/wiki/spaces/MTC/pages/4452909112/Getting+Started) |
| **ActionableAgile (55 Degrees)** | Jira analytics | "Monte Carlo: When" answers the probability that N items finish by a date; histogram, calendar, and throughput basis are each toggleable | [Docs](https://55degrees.atlassian.net/wiki/spaces/ActionableAgile/pages/2408972289/Monte+Carlo+When) |
| **Focused Objective** | Troy Magennis' spreadsheets and tools | Throughput forecaster, **multi-feature cut line** (which features ship by a date), percentile output; "team focus %" and "backlog uncertainty" as explicit dials | [focusedobjective.com](https://focusedobjective.com/), [tools](https://learn.focusedobjective.com/pages/free-spreadsheets-and-tools) |

### 2.2 Scenario mechanics: six rules

1. **Baseline is immutable.** Every scenario is a diff layer over it.
2. **Clone, don't blank.** A new scenario starts as a copy of the current one (Azure and Jira both do this).
3. **Color-flag every changed field** in the scenario's assigned color. A change you cannot see is a change you cannot defend.
4. **Named, colored, switchable** scenarios in a top-level tab strip. Not a modal, not a setting buried in a menu.
5. **Commit is explicit.** Show an "Unsaved scenario" badge and a "Review changes" diff before write-back.
6. **Compare exactly two at a time**, side by side, with deltas. Three-way comparison is unreadable.

### 2.3 Forecast presentation

- Show **P50 / P80 / P95 only**. Three is the cognitive limit. Label them in words: "50% likely", "80%, planning", "95%, commitment".
- **Histogram plus cumulative curve in one frame.** The curve answers "by date X, what is my probability?" The histogram answers "what is the most likely outcome?"
- **RAG band strip** along the x-axis. Never color the bars by probability and by category at the same time.
- **Target marker** as a labeled vertical rule. "Target sits at P62" is the sentence the product exists to produce.
- **Distribution width is the risk story.** Widen the band when assumptions are weak.
- Worked examples: [Broken Build Monte Carlo example](https://www.brokenbuild.net/examples/monte-carlo-forecasting-chart-for-scrum).

---

## 3. Data-viz pattern set

### 3.1 Chart by question

| Question the user asks | Chart | Encoding | Do not use when | Library | Reference |
|---|---|---|---|---|---|
| "When does in-house become cheaper?" | **Break-even / crossover** | Two cumulative-cost lines, crossover annotated, shaded savings region after crossover | One option dominates from month 0 (say it in text instead) | Recharts `LineChart` + `ReferenceLine` | [Data to Viz](https://www.data-to-viz.com/), [FT Visual Vocabulary](https://ft-interactive.github.io/visual-vocabulary/) |
| "What builds up this number?" | **Waterfall** | Floating bars: baseline → each driver (+/−) → total, connectors between bars | More than about 8 steps (group into "Other") | Recharts stacked bar with an invisible base series | [Bodmer, ch. 18](https://onlinelibrary.wiley.com/doi/10.1002/9781118957394.ch18) |
| "Which assumption hurts me most?" | **Tornado** | Horizontal bars, sorted by absolute swing, centered on the base value; low and high in two tones | Inputs are correlated (then use scenario bands, not one-at-a-time) | Recharts `BarChart layout="vertical"` | [Bodmer](https://edbodmer.com/advanced-tornado-diagrams-and-waterfall-charts-for-sensitivity-analysis/), [U. Alberta lecture](https://sites.ualberta.ca/~mlipsett/ENGM401_620/ENGM401-X1-2010-09-Lecture_29-SensitivityAnalysis&Uncertainty-annotated.pdf) |
| "What does five years look like?" | **Stacked area TCO** | Area = cost category per year; total line on top | Categories change composition drastically year to year (use small multiples) | Recharts `AreaChart` | FT Visual Vocabulary (part-to-whole and change over time) |
| "Cost versus speed trade-off?" | **Scatter** | x = duration, y = cost, point = option or scenario, Pareto frontier line | More than about 12 points | Recharts `ScatterChart` | Data to Viz |
| "Which option wins on many criteria?" | **Decision matrix** (table plus inline bars) | Rows = options, columns = weighted criteria, final weighted score and rank | Criteria are not independent, or weights are unstable (show weight sensitivity) | Plain table plus `Progress` bars | [Lucid](https://lucid.co/blog/weighted-decision-matrix), [PortfolioHub](https://portfoliohub.io/blog/project-scoring-model) |
| "What is the overall shape of the option?" | **Radar**, secondary only | 5 to 7 normalized axes, maximum 2 series | As the primary comparison; occlusion and false continuity mislead | Recharts `RadarChart` | [Scott Logic critique](https://blog.scottlogic.com/2011/09/23/a-critique-of-radar-charts.html) |

### 3.2 Per-chart specifications

#### 3.2.1 Break-even / crossover: "When does in-house become cheaper?"

- **Purpose:** show the month where cumulative in-house spend drops below cumulative contractor spend, and the savings that follow.
- **Axes:** x = time in months, 0 to 36; y = cumulative cost in ₽M, zero baseline.
- **Marks:** two solid cumulative lines (in-house `#0072B2`, contractor `#D55E00`), risk band at 12% opacity in the same hue as each line, vertical rule at the crossover labeled "M9", shaded region after crossover.
- **Annotation:** one sentence, not a legend. "Contractor is cheaper until month 9; after that in-house is ₽2.1M cheaper by year 3."
- **Interaction:** hover gives a crosshair with both values and the delta. Clicking the crossover opens the formula drawer explaining fixed versus variable cost.
- **Fallback:** "View as table" renders month, in-house cumulative, contractor cumulative, delta.
- **Do not:** use two different hues for the same option's P50 and P80. Use one hue at two opacities.

#### 3.2.2 Waterfall: "What builds up this number?"

- **Purpose:** decompose the estimate into named drivers so the total stops being a black box.
- **Axes:** x = ordered drivers (baseline, scope, roles, rate, risk, contingency, total); y = ₽M.
- **Marks:** floating bars with connectors; increases and decreases in two tones of one hue; the total bar visually distinct.
- **Limit:** 8 steps maximum. Group the tail into "Other".
- **Interaction:** clicking a step opens its formula node; hover shows the running total.
- **Fallback:** table of step, delta, running total.
- **Implementation:** Recharts stacked bar with a transparent `base` series and a visible `delta` series.

#### 3.2.3 Tornado: "Which assumption hurts me most?"

- **Purpose:** rank assumptions by how much they move the result.
- **Axes:** x = cost impact in ₽M or percent versus base; y = assumption name, sorted by absolute swing.
- **Marks:** horizontal bars centered on the base value, low and high in two tones, base reference line at zero, swing value labeled at the bar end.
- **Rules:** pinned assumptions are excluded from the vary set and show a lock icon. Sensitivity is computed, not authored.
- **Interaction:** clicking a bar scrolls to and highlights that assumption. Hover shows the range that produced the bar.
- **Fallback:** table of assumption, low, base, high, swing.
- **Do not:** use a tornado when inputs are correlated. Use scenario bands instead. For the classic tornado-versus-spider comparison, see [INFORMS, "Spider versus Tornado diagrams"](https://pubsonline.informs.org/doi/10.1287/inte.22.6.40).

#### 3.2.4 Stacked area TCO: "What does five years look like?"

- **Purpose:** show how cost composition evolves across a multi-year horizon.
- **Axes:** x = years 0 to 5; y = annual cost by category, with a total line on top. Offer a cumulative variant when the buyer thinks in total outlay.
- **Marks:** one area per cost category, direct labels for the top three categories.
- **Interaction:** hover shows the full category breakdown for that year; clicking a category isolates it.
- **Fallback:** table of year by category.
- **Do not:** use stacked area when composition changes drastically, small multiples read better.

#### 3.2.5 Scatter / Pareto: "Cost versus speed?"

- **Purpose:** place options on the cost-duration plane and draw the efficient frontier.
- **Axes:** x = duration; y = cost; one point per option or scenario; Pareto frontier line.
- **Limit:** about 12 points. Beyond that, cluster or switch to a table.
- **Interaction:** clicking a point switches to that scenario; hover shows the option name and its deltas.
- **Fallback:** table of option, duration, cost, dominated (yes/no).

#### 3.2.6 Decision matrix: "Which option wins on many criteria?"

- **Purpose:** make multi-criteria trade-offs explicit and adjustable.
- **Structure:** rows = options; columns = criteria (cost, time-to-start, quality, IP and security, flexibility, risk); weights sum to 100; scores 1 to 5; weighted total and rank.
- **Marks:** inline `Progress` bars under each score, weight sliders, "weights sum 100" indicator.
- **Rule:** show a weight-sensitivity note when the winner changes under small weight perturbations.
- **Interaction:** moving a weight updates scores live; expanding a cell shows the evidence behind the score.
- **Fallback:** the matrix is a table already; add CSV export.

#### 3.2.7 Radar: shape recognition only

- **Purpose:** a small profile thumbnail inside an option card, so users can recognize a shape at a glance.
- **Rules:** 5 to 7 normalized axes, maximum 2 series, never the main chart, never the hero of a demo.
- **Why:** occlusion and false continuity mislead; the decision matrix does the actual comparison work.
- **Reference:** [Scott Logic radar critique](https://blog.scottlogic.com/2011/09/23/a-critique-of-radar-charts.html).

### 3.3 Chart chrome rules

- **No dual-axis charts.** Two y-scales make crossings meaningless, which is exactly what a break-even chart is about. Use one axis with currency, or index both series to 100 at month 0 and label absolute values in the tooltip ([Datawrapper](https://www.datawrapper.de/blog/dualaxis)).
- **Direct labels** at the end of each line instead of a legend whenever there are 4 or fewer series. Label on the graphic.
- **Units in the axis title, not in every tick.** Write `Cost, ₽M`.
- **Every chart has a "View as table" toggle** rendering the same data as an accessible table.
- **Hover gives a crosshair and a tooltip** with the value, the delta versus baseline, and the assumption that drives it.
- **Zero baseline for bars.** Always.
- **Annotation beats decoration.** One sentence on the chart is worth more than any gridline.
- **No value on a chart without a provenance path.** The chart is a view of the formula tree, not a separate truth.

### 3.4 Which values to encode

- **Base case:** solid line, 100% opacity.
- **P50 and P80:** same hue, band fill at 12% and 8% opacity. Never two hues for the same option.
- **Baseline scenario in compare mode:** 1.5px dashed line, 40% opacity, labeled "Base".
- **Risk-adjusted total:** a separate number, not a wider bar. The bar is P50; a `+ risk` segment stacks on top in the risk hue.

### 3.5 Palettes and colorblind safety

Use the **Okabe-Ito** categorical palette, which stays distinguishable under protanopia and deuteranopia ([Color Universal Design](https://jfly.uni-koeln.de/color/)):

| Swatch | Hex | Role |
|---|---|---|
| Orange | `#E69F00` | Categorical 1 |
| Sky blue | `#56B4E9` | Categorical 2 |
| Bluish green | `#009E73` | Categorical 3, also "good" in RAG |
| Yellow | `#F0E442` | Categorical 4 (dark text only) |
| Blue | `#0072B2` | Categorical 5, **in-house** |
| Vermilion | `#D55E00` | Categorical 6, **contractor** |
| Reddish purple | `#CC79A7` | Categorical 7 |
| Gray | `#999999` | Categorical 8, de-emphasis |

**Colorblind-unsafe palettes to reject:** red/green as the only distinction, rainbow or "jet" ramps, and any categorical set where two hues share lightness. Never encode state with hue alone; pair every color with a label, an icon, or a line style.

---

## 4. AI-assisted intake idioms

### 4.1 The five-state intake flow

```
EMPTY → PARSING → NEEDS_REVIEW → CONFIRMED → (STALE ↔ CONFIRMED)
                                      ↘ ERROR
```

| State | UI | Rule |
|---|---|---|
| **Empty** | Large textarea: "Paste the task, a ticket, or a SoW." plus `Drop file` and 3 example chips | No wizard. One box. |
| **Parsing** | **Extraction table renders immediately** with skeleton rows; fields fill progressively | Never a full-panel spinner. Pending rows are honest placeholders ([Scrim pattern](https://scrimui.dev/patterns/extraction-review)). |
| **Needs review** | Per-field confidence badges (only medium and low), source quote on hover, Accept / Edit / Reject | Badge the *field*, never the whole document. |
| **Confirmed** | Badge count collapses to "12 parameters · 2 edited" | Export and Generate enable only when all flagged fields are resolved. |
| **Stale** | Amber banner: "Brief edited after extraction. 3 parameters may be out of date. Re-parse?" | Never silently recompute from stale extraction. |

### 4.2 Extraction review table

| Column | Content | Interaction |
|---|---|---|
| Parameter | Canonical name plus type icon | Click row scrolls to the parameter in the rail |
| Extracted value | Value and unit, `tabular-nums` | Inline edit |
| Confidence | Three-dot or mini-bar; text label `High / Medium / Low` for accessibility | Hover shows the reason ("ambiguous date format") |
| Source | Quoted span from the brief, truncated, expandable | Hover highlights the original text |
| Action | Accept, edit, reject | Keyboard `a / e / r` |
| Under value | **Original extracted value preserved after edit**, muted | Audit trail; never overwrite |

Reference implementations of exactly this pattern: [Extend Human Review](https://docs.extend.ai/workflows/human-review) (document left, outputs right, citations, `initialOutput` against `reviewedOutput`), [Uxopian HITL](https://doc.uxopian.com/docs/uxopian-ai/how_to/human_in_the_loop_review/) (validate, refuse-and-retype, revert; `j/k` navigation), [Airparser](https://airparser.com/human-in-the-loop-document-parsing/), [DocuPipe visual review](https://docs.docupipe.ai/docs/generating-a-visual-review).

### 4.3 Assumption card and chip

Two representations of the same object.

**Chip** (left rail, always visible):

```
[ Team ramp · 6 wk · ⚠ High ]   [ Rate inflation · 8%/yr · ● Med ]
```

Anatomy: `label · value+unit · sensitivity dot`. Click opens the card. Hover shows "±10% moves cost by ₽420k".

**Card** (assumptions section or slide-over):

```
┌───────────────────────────────────────────────┐
│ Team ramp                          [pin] [⋯]  │
│ 6 weeks            Range 4 ──●── 10           │
│ Source: AI · from "onboarding" in brief       │
│ Sensitivity  ±2 wk → cost +₽310k (+5.1%)      │
│ [Explain]  [Edit]  [Duplicate]                │
└───────────────────────────────────────────────┘
```

Rules: every assumption has **value, range, source, sensitivity**. Pinned assumptions are excluded from the tornado's vary set and show a lock icon. Sensitivity is computed, not authored.

### 4.4 Explainability drawer (formula breakdown)

Slides in from the right, 480px wide, overlaying the verdict rail, opened by clicking **any number**.

```
Cost (P80)                                    ₽7.24M
└─ Base cost                                  ₽6.10M
   ├─ Effort            480 h × ₽9,800/h      ₽4.70M
   │  ├─ Analysis       80 h  × ₽9,200        ₽0.74M
   │  ├─ Development   280 h  × ₽10,400       ₽2.91M
   │  └─ QA           120 h  × ₽8,800         ₽1.06M
   ├─ Overhead          12%                   ₽0.56M
   └─ Contingency       14%                   ₽0.84M
└─ Risk adjustment    +18.7%                 ₽1.14M
   ├─ Schedule risk   P80 minus P50            ₽0.72M
   └─ Quality/rework  expected value           ₽0.42M
```

Each node shows its value, formula, input chips, source badge (AI, benchmark, user, price book), and an `Edit` affordance that jumps to the control. The header shows `vs. base: +₽0.9M (+14%)` when in a scenario.

This combines the TurboTax "Data Source" pattern, where a computed cell names its upstream lines and entered values look different from calculated ones ([Intuit community](https://ttlc.intuit.com/community/get-your-taxes-done-using-turbotax-6/how-to-go-to-calculated-entries-375079)), with AWS's "see the math behind the price" ([calculator.aws](https://calculator.aws/)).

### 4.5 Diff and what-if compare

Two-pane modal (or full-width view):

| | Base | In-house +1 dev | Delta |
|---|---|---|---|
| Effort | 480 h | 512 h | +32 h |
| Duration | 14 wk | **11 wk** | −3 wk |
| Cost P50 | ₽6.10M | ₽6.74M | +₽0.64M |
| Cost P80 | ₽7.24M | ₽7.61M | +₽0.37M |

Changed assumptions get a left color bar; unchanged rows are muted. Charts overlay the base as a dashed ghost. The bottom bar holds `[Save as scenario] [Export diff]`.

### 4.6 Export

| Format | Contents | Notes |
|---|---|---|
| **PDF** | One-page verdict, comparison, charts, then an appendix with assumptions, formula tree, and risk register | Print stylesheet, page numbers, "generated on / price book v" footer |
| **XLSX** | Sheets: `Scenarios`, `LineItems`, `Assumptions`, `Risks`, `Sensitivity` | Values plus formulas, not a flat dump |
| **PNG/SVG** | Active chart | Transparent background option |
| **Link** | Frozen snapshot plus `priceBookVersion` | Show "snapshot from 12 Mar" banner when opened later |

Export is a **computed state**: disabled until extraction flags are resolved and validation passes ([Scrim](https://scrimui.dev/patterns/extraction-review)).

---

## 5. Design system

### 5.1 Type scale (product UI, 14px base)

| Token | Size / line-height | Weight | Use |
|---|---|---|---|
| `caption` | 12 / 16 | 500 | Axis labels, meta, badges |
| `body-sm` | 13 / 18 | 400 | Table cells, dense lists |
| `body` | 14 / 20 | 400 | Default |
| `body-strong` | 14 / 20 | 600 | Row headers, labels |
| `title-sm` | 16 / 22 | 600 | Card titles |
| `title` | 18 / 24 | 600 | Panel titles |
| `h3` | 20 / 28 | 600 | Section |
| `h2` | 24 / 30 | 600 | Page |
| `metric` | 30 / 36 | 600 | Verdict card numbers |
| `metric-lg` | 36 / 40 | 650 | Hero cost |
| `mono` | 13 / 18 | 500 | Formulas, IDs |

Font: **Inter** for UI, or IBM Plex Sans for a more industrial accent. Carbon's productive base is 14px and expressive is 16px ([Carbon type sets](https://www.carbondesignsystem.com/building-blocks/foundations/typography/type-sets)). All numbers use `font-variant-numeric: tabular-nums slashed-zero` so columns align.

### 5.2 Spacing, density, radius, elevation

- **Spacing:** 4px base → 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64. Atlassian's 8px base (`space.100` = 8px) is the alternative; 4px gives the density control industrial buyers expect ([Atlassian spacing](https://atlassian.design/foundations/spacing)).
- **Radius:** 4px inputs and chips, 6px cards, 8px modals, full pills.
- **Elevation:** prefer a 1px `--border` over shadow. Shadows only for overlays (drawer, modal, popover): `0 8px 24px rgb(0 0 0 / .12)`.
- **Density modes:** Comfortable 40px rows, Compact 32px, Ultra 28px. Carbon's five row sizes are the canonical reference: 24 / 32 / 40 / 48 / 64 ([Carbon data table](https://www.carbondesignsystem.com/building-blocks/core/components/data-table/specifications)).

### 5.3 Color tokens

| Role | Light | Dark | Notes |
|---|---|---|---|
| `bg` | `#F7F8FA` | `#0B0F14` | |
| `panel` | `#FFFFFF` | `#11161D` | |
| `subtle` | `#F1F3F6` | `#1A212B` | Table header, hover |
| `border` | `#E3E6EA` | `#26303B` | |
| `text` | `#101828` | `#E6EAF0` | ≥ 4.5:1 |
| `text-secondary` | `#475467` | `#9AA6B2` | |
| `primary` | `#1D4ED8` | `#5B8DEF` | Actions, focus |
| `in-house` | `#0072B2` | `#56B4E9` | Series color, always labeled |
| `contractor` | `#D55E00` | `#E69F00` | Series color, always labeled |
| `risk` | `#B2182B` | `#EF6A6A` | Chips and status only, never a series color |
| `good` | `#009E73` | lighter variant | RAG |
| `warn` | `#B45309` | lighter variant | RAG |
| `bad` | `#B2182B` | lighter variant | RAG |

The in-house and contractor pair is the Okabe-Ito blue and vermilion pair. Use color **plus** line style plus direct labels; never hue alone.

**Contrast contract:** body text ≥ 4.5:1, large text ≥ 3:1, UI boundaries and chart strokes ≥ 3:1 ([WCAG 2.2 SC 1.4.3](https://www.w3.org/TR/WCAG22/), [SC 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast)). Dark mode is mandatory for shop-floor and control-room contexts.

### 5.4 Table spec

- Header: 12px/600, uppercase, `+0.04em`, on `subtle`, sticky.
- Rows: 32px compact by default, 13px text, 1px bottom border.
- Numeric columns right-aligned, tabular numerals, **unit in the header**.
- First column sticky on horizontal scroll; totals row pinned to the bottom.
- Inline edit: click to open an input; `Enter` commits, `Esc` reverts; validation message at the field.
- Toolbar above the table: search, filter chips, density toggle, column visibility, "N of M".
- Empty state explains *why* it is empty and offers the next action.

Reference: Ant Design's `size` of `large | middle | small` with cell padding 16 / 12 / 8 and `virtual` scrolling for 100k rows ([ant.design/components/table](https://ant.design/components/table/)).

### 5.5 Charting library decision

| Need | Pick | Why |
|---|---|---|
| Break-even, waterfall, tornado, stacked area, bars, lines, radar | **Recharts + shadcn `ChartContainer`** | React-native composition, SVG (inspectable, SSR-safe), CSS-variable theming, `accessibilityLayer` for keyboard and screen-reader support ([shadcn charts](https://ui.shadcn.com/docs/components/chart), [Recharts](https://recharts.github.io/)) |
| Sankey, heatmap, 100k+ points, built-in decal patterns | **Apache ECharts** | 20+ types, Canvas/SVG switch, automatic aria descriptions plus decals ([echarts.apache.org](https://echarts.apache.org/en/)) |
| One bespoke visualization (custom forecast cone, ribbon) | **visx** | Low-level primitives, smallest bundle ([airbnb.io/visx](https://airbnb.io/visx/)) |
| Polished defaults and SSR, 30+ types | **Nivo** | Strong themes, per-package installs ([nivo.rocks](https://nivo.rocks/)) |
| Ship a dashboard fast | **Tremor** | Copy-paste blocks over Recharts ([tremor.so](https://tremor.so/)) |

**Recommendation:** Recharts for v1. Waterfall is a stacked bar with a transparent `base` series and a visible `delta` series; tornado is horizontal bars with a `ReferenceLine x={base}`; break-even is two `Line` series plus `ReferenceLine` plus `ReferenceArea` after the crossover. Add ECharts only if you introduce Sankey or heatmap.

### 5.6 Component inventory (shadcn mapping)

`Tabs` (chart tabs, scenario tabs) · `Accordion` (parameter groups) · `Table` and `DataTable` (line items, risks, decision matrix) · `Card` (verdict metrics, option cards) · `Badge` (confidence, source, sensitivity) · `Slider` paired with `Input` (never slider-only) · `Sheet` (formula drawer) · `Dialog` (scenario compare) · `Command` (⌘K) · `Tooltip` · `Progress` (score bars, capacity) · `Alert` (staleness, infeasible) · `ToggleGroup` (estimate/target, density) · `Separator`.

Skeleton shell: the [shadcn dashboard block](https://ui.shadcn.com/blocks/dashboard) already gives sidebar, header, KPI cards, chart, and data table, which is 80% of the layout.

### 5.7 Accessibility contract

- Every chart has a **"View as table"** toggle.
- `aria-live="polite"` on the verdict strip, throttled to about 500ms so it does not announce every keystroke.
- Focus visible: 2px ring, 2px offset, ≥ 3:1 against adjacent colors.
- Full keyboard: chart tabs `1` to `5`, scenarios `[` and `]`, drawer `Esc`, command palette `⌘/Ctrl+K`.
- Sliders paired with numeric inputs; numeric inputs accept units and a step.
- `prefers-reduced-motion` disables number count-ups and chart transitions.
- Never encode state with color alone; add an icon or text (`High`, `⚠`, `✓`).

### 5.8 Industrial design-system references

| System | What to borrow | Reference |
|---|---|---|
| **IBM Carbon** | Productive 14px base, expressive 16px, five data-table row heights (24 / 32 / 40 / 48 / 64), table header treatment | [Data table spec](https://www.carbondesignsystem.com/building-blocks/core/components/data-table/specifications), [type sets](https://www.carbondesignsystem.com/building-blocks/foundations/typography/type-sets) |
| **Atlassian Design System** | 8px space base, clear token naming, dense but friendly enterprise patterns | [Spacing](https://atlassian.design/foundations/spacing) |
| **Ant Design** | Table sizing (`large | middle | small`), cell padding 16 / 12 / 8, virtual scrolling for large data | [Table](https://ant.design/components/table/) |
| **Siemens iX** | Purpose-built for industrial software: KPI component, key-value display, data grid (AG Grid based), control-room readability | [iX overview](https://ix.siemens.io/docs/home/overview) |

Siemens iX is the closest cultural fit for ТМК. Borrow its KPI and key-value components for the verdict strip, and its data-grid conventions for the line-items table.

---

## 6. Explainable-estimation references

| Product | What it does | Takeaway |
|---|---|---|
| **TurboTax** | Calculated fields look different from entered fields; a "Data Source" view names the exact upstream lines; "Smart Worksheet" shows the computation; a What-If worksheet exists for scenarios | The gold standard for provenance: every computed cell can name its parents ([community thread](https://ttlc.intuit.com/community/get-your-taxes-done-using-turbotax-6/how-to-go-to-calculated-entries-375079)) |
| **AWS Pricing Calculator** | "See the math behind the price"; the export includes the parameters used | Export the inputs, not only the outputs |
| **Azure Pricing Calculator** | Per-unit price from the Retail Prices API multiplied by your quantity; upfront versus monthly split | Show `unit price × quantity` inline, per line |
| **Stripe** | Base rate plus expandable modifiers (+0.5%, +1.5%, +1%) | Decompose fees into named, individually toggleable modifiers |
| **Linear cycle graph** | Gray scope line plus dotted target line, so "on track" is a geometric fact | A target or pace reference line makes status legible without a score |
| **Jira Plans scenarios** | Changed items flagged in the scenario's color | Provenance at item level, not just at the total |

**Risk and assumption registers** follow the RAID convention (Risks, Assumptions, Issues, Dependencies). Each risk carries probability, impact, owner, and mitigation; each assumption carries value, range, source, and sensitivity. Background: [IIL on assumptions and risks](https://blog.iil.com/managing-project-assumptions-and-risks/), [RAID log explained](https://gotpmp.com/en/blog/raid-log-explained), [Airtable RAID template](https://www.airtable.com/templates/raid-log-template/expDQIPco49GXO0Fx).

---

## 7. THE SPEC: single-screen Estimation Cockpit

### 7.1 Grid and wireframe (1440×900 baseline)

Columns: `320px | 1fr | 360px`. Top bar 56px. Gutter 16px. The center column at 1440px resolves to roughly 700px, which holds a 560×340 chart with room for labels.

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ A · TOPBAR  56px                                                                    │
│ ТМК · Задача «Миграция MES»   [Base][In-house][Contractor][+]   P80 ▾   Share Export │
├──────────────────┬───────────────────────────────────────────────┬─────────────────┤
│ B · BRIEF  320   │ C · CANVAS  1fr                               │ D · VERDICT 360 │
│                  │                                               │                 │
│ ┌──────────────┐ │ ┌─ C1 Verdict strip ────────────────────────┐ │ ┌─ Option ────┐ │
│ │ Paste brief  │ │ │  Effort      Duration      Cost (P80)     │ │ │ In-house    │ │
│ │ [textarea]   │ │ │  480 h       14 wk         ₽7.24M         │ │ │ ₽7.24M      │ │
│ │ ⤓ file       │ │ │  410-560     12-18        6.1M-8.4M       │ │ │ +18% risk   │ │
│ └──────────────┘ │ └───────────────────────────────────────────┘ │ └─────────────┘ │
│                  │ ┌─ C2 Chart tabs ───────────────────────────┐ │ ┌─ Option ────┐ │
│ Extraction       │ │ Break-even│Waterfall│Tornado│TCO│Matrix   │ │ │ Contractor  │ │
│ ┌──────────────┐ │ │                                           │ │ │ ₽8.10M      │ │
│ │12 params ·2✎ │ │ │           (chart 560×340)                 │ │ │ +9% risk    │ │
│ └──────────────┘ │ │                                           │ │ └─────────────┘ │
│                  │ └───────────────────────────────────────────┘ │ Δ +₽0.86M +12%  │
│ ▸ Scope          │ ┌─ C3 Insight strip ────────────────────────┐ │ Break-even: M9  │
│ ▸ Team           │ │ "Contractor is cheaper until month 9."    │ │                 │
│ ▸ Rates          │ └───────────────────────────────────────────┘ │ Decision matrix │
│ ▸ Risk           │ ┌─ C4 Detail ───────────────────────────────┐ │ Cost    30 ▓▓▓  │
│ ▸ Timeline       │ │ Line items  |  Risk register              │ │ Speed   20 ▓▓   │
│                  │ │                                           │ │ Quality 25 ▓▓▓  │
│ Assumptions      │ │                                           │ │ Risk    25 ▓▓   │
│ [chip][chip]     │ └───────────────────────────────────────────┘ │ [Generate PDF]  │
└──────────────────┴───────────────────────────────────────────────┴─────────────────┘
```

Information order is **Inputs → Answer → Why → Compare**. The verdict is visible without scrolling, the comparison stays on screen, and the brief is editable in place.

### 7.2 Component tree

```
<CockpitShell>
  <TopBar>
    <ProjectSwitcher/> <ScenarioTabs/> <ConfidenceSelect P50|P80|P95/>
    <PriceBookBadge/> <ShareButton/> <ExportMenu/>
  </TopBar>

  <Body>
    <BriefRail>
      <BriefComposer/>                  // textarea, drop zone, example chips
      <ExtractionSummary/>              // "12 parameters · 2 edited" → opens review
      <ParamAccordion>                  // 6 groups, one open by default
        <ParamRow/>                     // label, value+unit, source, sensitivity dot
      </ParamAccordion>
      <AssumptionChipList/>
      <AddAssumptionButton/>
    </BriefRail>

    <Canvas>
      <VerdictStrip>
        <MetricCard metric="effort|duration|cost"/>
        <ModeToggle estimate|target/>   // reverse solve
      </VerdictStrip>
      <ChartPanel>
        <ChartTabs/>                    // 5
        <ChartCanvas/>                  // Recharts
        <ChartFooter/>                  // view-as-table, legend, note
      </ChartPanel>
      <InsightStrip/>                   // 1-3 generated sentences, each clickable
      <DetailPanel>
        <LineItemsTable/> | <RiskRegister/>
      </DetailPanel>
    </Canvas>

    <VerdictRail>
      <OptionCard option="in-house"/>   // P50, P80, risk premium, delta
      <OptionCard option="contractor"/>
      <DeltaSummary/>                   // absolute + %, winner
      <BreakEvenBadge/>                 // "Month 9 · P50"
      <DecisionMatrixSummary/>          // 4 criteria, weighted score, expand
      <PrimaryAction label="Generate proposal"/>
    </VerdictRail>
  </Body>

  <FormulaDrawer/>                      // slide-over 480, from any number
  <ScenarioCompareDialog/>              // two-column diff
  <ExtractionReviewSheet/>              // table of fields
</CockpitShell>
```

### 7.3 Zone by zone: controls and states

**A · TopBar**

| Control | States |
|---|---|
| Scenario tabs | `base` (locked), `active`, `dirty` (dot), `unsaved` |
| Confidence select | P50 / P80 / P95; changes *which number is hero*, not the data |
| Price book badge | `current`, `stale` (amber, tooltip with date) |
| Export | disabled while `needs_review`; tooltip explains why |

**B · BriefRail**

| Control | States |
|---|---|
| BriefComposer | `empty`, `typing`, `parsing` (progress line), `parsed` |
| ParamRow | `default`, `ai-sourced` (sparkle), `user-edited`, `pinned`, `invalid`, `stale` |
| Assumption chip | `normal`, `high-sensitivity` (⚠), `pinned` (lock) |
| Accordion | one-open-at-a-time optional; remember open groups per session |

**C · Canvas**

| Control | States |
|---|---|
| MetricCard | `loading`, `ready`, `recalculating` (subtle pulse, numbers stay legible), `infeasible` (dash) |
| ChartTabs | `active`, `has-warning` (for example a non-monotonic break-even) |
| ChartCanvas | `empty`, `partial`, `ready`, `hover`, `selected`, `error` |
| InsightStrip | `none`, `1-3 insights`; each opens the relevant chart or assumption |
| DetailPanel | `line-items`, `risk`, `empty`, `filtered` |

**D · VerdictRail**

| Control | States |
|---|---|
| OptionCard | `winner` (2px left accent), `loser`, `tie`, `incomplete` |
| DeltaSummary | positive and negative framed as *cost*, not as "good" or "bad" |
| BreakEvenBadge | `crossover@M9`, `no-crossover`, `dominates` |
| PrimaryAction | `disabled` until review is complete |

### 7.4 State machine

```
EMPTY
  └─ paste/upload → PARSING
       ├─ success → NEEDS_REVIEW ──all resolved──→ READY
       └─ fail → ERROR (retry / manual entry)
READY ──edit param──→ DIRTY ──recalc (<150ms)──→ READY
READY ──brief edited──→ STALE ──re-parse──→ PARSING
READY ──price book changed──→ STALE_PRICES (banner, "refresh prices")
READY ──constraints unsatisfiable──→ INFEASIBLE (explain + suggest)
```

### 7.5 Interaction contract

1. **Every number is a button.** Hover shows a dotted underline; click opens `FormulaDrawer` at that node.
2. **Recalculation is non-blocking.** Values update within 150ms after a 250ms debounce; inputs never lose focus; only the changed series animates.
3. **Edits are sandboxed.** A change marks the scenario dirty. Nothing is written to the project until `Save scenario`.
4. **Compare pins a baseline.** Deltas are always against the pinned scenario, and the pin is visible in the top bar.
5. **Charts are controls, not pictures.** Clicking a tornado bar scrolls to and highlights that assumption; clicking a waterfall step opens its formula node; clicking a scatter point switches to that scenario.
6. **Insight sentences are links.** "Contractor is cheaper until month 9" focuses the break-even chart and highlights the crossover.
7. **Progressive disclosure for risk.** The risk premium is a single number on the option card; expanding it reveals the risk register with probability times impact.
8. **Keyboard parity.** Everything is reachable without a mouse.

### 7.6 Responsive behavior

| Width | Layout |
|---|---|
| ≥ 1280 | Three columns: 320 / 1fr / 360 |
| 1024 to 1279 | Two columns: brief rail collapses to a `Sheet`; verdict rail becomes a sticky bottom bar |
| < 1024 | Single column: verdict, then chart, then comparison; brief in a full-screen sheet |
| Print | One page: title, verdict, comparison table, break-even chart, assumptions appendix |

### 7.7 Data contract the UI needs

```ts
type Estimate = {
  id: string;
  scenarioId: string;
  currency: "RUB";
  priceBookVersion: string;          // shown in top bar and exports
  effort:   { p50: number; p80: number; unit: "h"; byRole: RoleLine[] };
  duration: { p50: number; p80: number; unit: "wk"; criticalPath: string[] };
  cost:     { p50: number; p80: number; breakdown: CostNode[]; riskPremium: number };
  assumptions: Assumption[];         // id, label, value, unit, range, source, sensitivity
  risks:       Risk[];               // id, desc, probability, impact, owner, mitigation
  warnings:    Warning[];            // stale, infeasible, low-confidence, price drift
};

type CostNode = {
  id: string; label: string; value: number;
  formula: string;                   // "480 h × ₽9,800/h"
  inputs: string[];                  // node ids
  source: "ai" | "user" | "benchmark" | "pricebook";
};
```

The formula tree is *data*, not UI logic. That single decision makes the drawer, the exports, and the audit story cheap to build.

---

## 8. Hackathon build order and demo script

### P0: the demo cannot exist without these

1. Cockpit shell, top bar, three-column grid.
2. Brief composer → mocked parse → extraction summary.
3. `ParamAccordion` with 8 to 10 parameters and assumption chips.
4. Verdict strip: effort, duration, cost with P50 to P80 ranges.
5. Break-even chart with crossover annotation.
6. Option cards, delta, break-even badge.
7. `FormulaDrawer` on the cost number.
8. PDF export (a print stylesheet is enough).

### P1: makes it credible

9. Extraction review table with confidence badges.
10. Waterfall and tornado.
11. Scenario tabs plus diff dialog.
12. Risk register with probability times impact.
13. Decision matrix with editable weights.

### P2: polish

14. Stacked-area TCO across five years.
15. Monte Carlo P80 bands plus RAG strip; a static precomputed distribution is convincing enough.
16. XLSX export, share link, command palette, dark mode.

### 90-second demo script

Paste a real ТМК-style brief. Show 12 extracted parameters with two flagged amber. Accept one, edit one. The verdict appears, ₽6.1M to ₽8.4M. Click the cost, and the formula drawer opens. Switch to the Contractor scenario and watch the delta update. The break-even chart says crossover at month 9. The decision matrix says in-house wins 3 of 4 criteria. Export the PDF.

### What to avoid in the demo

A single number with no range, a radar chart as the hero, a dual-axis chart, and any auto-applied AI extraction without a visible confirm step. An industrial evaluator reads those four choices as evidence that you do not understand their world.
