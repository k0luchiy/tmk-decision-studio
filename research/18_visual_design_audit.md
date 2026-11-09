# 18. Visual Design & UX Audit — TMK corporate site + TMK++ IT cluster

**Method.** All measurements are from the supplied full-page PNGs rendered at 1440 px CSS width (±2 px), plus one 390 px mobile capture. Tokens marked **[observed]** are sampled/estimated from the renders; tokens marked **[proposed]** do not exist in either site and are additions for a data product.

---

## A. Corporate site — tmk-group.ru

### A1. Colour system

| Role | Perceived value | Where it appears | Area share |
|---|---|---|---|
| Canvas | `#FFFFFF` | All content sections (tmk_main_home, tmk_ir_dividends) | 55–70% |
| Surface alt | `#F4F4F4` | Footer block, "ЕДИНАЯ АКЦИЯ" promo strip (tmk_main_home), promo band (tmkpp_home) | 8–12% |
| Dark band | `#2B2B2B` | "ПОДПИСАТЬСЯ НА РАССЫЛКУ НОВОСТЕЙ" strip, all pages | 3–5% |
| Utility bar | `#141414` | Top strip with 7 utility links (tmk_main_home, tmk_main_about) | 3–4% |
| Overlay panel | `#1F1F1F` @ ~90% | Cookie banner (tmk_main_products, tmk_ir_finres) | 4–8% when present |
| Ink primary | `#111111` | Headings, body, black chips | — |
| Ink secondary | `#6B6B6B` | News dates, inactive breadcrumb, legal text (tmk_main_home) | — |
| Hairline | `#D6D6D6` | 1 px section rules, doc rows, table grid (tmk_ir_dividends) | — |
| **Accent** | **`#EC6608`** (renders closer to `#F26522` in headings) | See below | **≤2%** |

**Where orange is used (all observed):** section h2 labels ("НОВОСТИ", "ПРОДУКЦИЯ", "ПРОЕКТЫ" — tmk_main_home; "ГОДОВЫЕ ОТЧЕТЫ" — tmk_ir_annual); active tab text + underline (tmk_ir_finres); filled CTA "ЗАКАЗ ПРОДУКЦИИ" (tmk_main_about); cookie primary buttons (tmk_main_products); 2 px column rules in footer; utility-bar links; the orange logo tile variant (tmk_careers). **Orange never fills a section background** — it is a label/action colour only.

**Key contrast note:** `#EC6608` on white = **3.2:1**. Legal for large text (≥24 px regular / 18.7 px bold) only; it fails AA for small links. Corporate h2s at ~30 px are compliant; TMK++ inline orange links at body size are not.

**Secondary accents:** none beyond photography. Black (`#111`) is the de-facto "selected/active" colour (year chips in tmk_ir_finres, news filter chip in tmk_main_home). No green/red/amber semantic colours exist anywhere in either site.

**Overlay treatments:** hero text sits on a left-to-right dark scrim (`rgba(0,0,0,.65)→0`, tmk_main_about, tmk_careers); header floats as `rgba(0,0,0,.55)` over photo heroes (tmk_main_home, tmk_ir_annual, tmk_esg_reports).

### A2. Typography

| Level | Approx px @1440 | Case / tracking | Character |
|---|---|---|---|
| Hero h1 (inner pages) | 84–96 | UPPERCASE, ~0 | Very condensed DIN-like grotesque, flat terminals, tight leading (~0.95) — "ПРОДУКЦИЯ И СЕРВИС", "ИНВЕСТОРАМ" |
| Home slide headline | 38–42 | UPPERCASE | Same family, sentence-length headline |
| Section h2 (orange) | 28–32 | UPPERCASE, ~0 | Same condensed family |
| Card overlay title | 26–32 | UPPERCASE | Same family, white on photo |
| Body | 15–16 / lh 1.55 | Sentence case, 0 | Neutral grotesque (Roboto/Helvetica-like), not condensed |
| Meta (date, breadcrumb) | 11–12 | Mixed | Same body grotesque |
| Nav | 12–13 | UPPERCASE, +0.04–0.06 em | Body grotesque, medium weight |
| Footer head / newsletter | 11 (headings, +0.1 em) / 13 (+0.18 em) | UPPERCASE | Body grotesque |
| Legal | 10 / lh 1.5 | Sentence case | Body grotesque |

Scale ratio h1:h2:body:caption ≈ **90 : 30 : 15 : 11** (≈2.7× steps) — a poster scale, not a UI scale. Two families only: condensed display + neutral text grotesque. No italic, no weights above ~700 visible.

### A3. Layout

- **Grid:** near-full-bleed. Content spans x≈24 → 1416 px, i.e. **~1392 px max width with 24 px gutters**; no boxed 1200 container (tmk_main_home, tmk_main_about). 12-col logic visible in footer (4 equal ~340 px columns, 24 px gutters) and in 3-col news / 2-col tiles.
- **Header:** two tiers — 40 px utility bar (7 links + ENG) over 56–60 px primary bar (logo 64×60, hamburger, 5 nav items, search). Header is sticky (captured frozen mid-page in tmk_careers.png and tmk_main_press.png) and inverts light/dark over heroes.
- **Section rhythm:** very generous — 72–120 px between sections, 24–32 px heading→content, full-width 1 px rules as section separators. Inner heroes are 520–780 px tall (about page ≈615 px; products ≈780 px).
- **Photography vs cards:** full-bleed photo bands dominate; "cards" are just photo tiles with overlay type, no box, no radius (tmk_main_about, tmk_main_products, tmk_careers).

### A4. Component repertoire

| Component | Observed shape | Notes / file |
|---|---|---|
| Primary CTA | Solid orange rect, **radius 0**, uppercase 11–12 px, h≈40–44 | "ЗАКАЗ ПРОДУКЦИИ" (tmk_main_about) |
| Secondary CTA | 1 px outline rect, transparent, uppercase | "ПОДРОБНЕЕ" on hero (tmk_main_home) |
| Filter chips | Rect, 1 px border, h≈38–42; active = **black fill / white text** | News categories (tmk_main_home); product tags (tmk_main_products) |
| Year selector | Identical chip set, 24 px version | tmk_ir_finres, tmk_ir_corpres, tmk_esg_reports |
| Tabs | Uppercase 13 px, active = orange + 2 px underline, full-width hairline below | IR/ESG sections (tmk_ir_annual) |
| Document row | Bordered rect, 1 px, h≈56–64: line icon + 15–16 px title + "PDF" + long arrow | tmk_ir_finpres, tmk_esg_presentations |
| Table | 1 px grid, ~12 px text, header slightly bolder, numbers right-aligned, **no zebra**, row h≈28–32 | only real table: dividends (tmk_ir_dividends) |
| Accordion | Bordered row + "+" at right | TMK++ history; no corporate equivalent |
| Breadcrumbs | 12 px, "Главная | Раздел | Лист", current in grey | all inner pages |
| Footer | Dark subscribe band + light 4-col footer, 2 px orange rule per column, circular social icons | all pages |
| Mega-menu | **Not visible** — only hamburger + flat horizontal nav; no opened flyout in any capture | tmk_main_home |
| Forms | **Not observable** — only a search icon; no input fields in any capture | — |

### A5. Imagery
Industrial documentary photography: pipe mills, orange-hot billets, threaded pipe ends, workers in orange helmets/PPE (tmk_main_products, tmk_careers), lab coat + gauge (tmk_main_products certificate tile), dandelions for ESG (tmk_esg_reports), abstract blue trading-chart macro for IR (tmk_ir_annual). **No duotone, no illustration**; natural colour with mild desaturation, hard rectangular crops, no radius; wide 1.9–2.3:1 crops for tiles, 21:9-ish for heroes. Type is always white condensed, bottom-left or centre-left.

### A6. Depth / motion cues
Effectively **zero elevation**: no shadows on cards, buttons, header or footer. Separation is achieved with flat fills, 1 px `#D6D6D6` rules and dark scrims. Interactions visible: carousel arrows (plain 1 px chevrons, tmk_main_home/tmk_main_about), long-arrow "—→" link motif, hover/state system not observable from statics.

### A7. Register
Formal, industrial, poster-like: a corporate annual-report aesthetic rather than a product UI. It earns credibility through full-bleed factory photography and a severe condensed type voice, and it deliberately suppresses UI chrome. On a scale: **formality 9/10, industrial authenticity 9/10, brand distinctiveness 7/10, interface modernity 4/10, information density 2/10.** It reads as a well-art-directed 2017–2020 corporate site; nothing here suggests an app/product design language.

---

## B. IT cluster — tmkplusplus.tmk-group.ru

### B8. Same analysis + corporate comparison

| Dimension | TMK++ | vs corporate |
|---|---|---|
| Canvas | `#FFFFFF`; `#F4F4F4` footer | Same |
| Accent | `#EC6608` for h2, active tabs, inline links, footer rules | Same hue, **higher share of small text** (links at body size — contrast risk) |
| Selection colour | Orange for tabs; no black chips present | Corporate uses black chips for state |
| Display type | Same condensed uppercase, but h1 only **46–56 px** ("О ТМК++"), subtitle 26–28 px ("ИСТОРИЯ") | Corporate h1 is ~1.7× larger |
| Body type | Same-ish neutral grotesque **16 px / lh 1.65**, paragraphs separated ~24 px | Slightly larger and airier than corporate |
| Container | 24 px gutters, near-full-bleed — body lines run **~1390 px ≈ 130–150 characters** (tmkpp_consulting, tmkpp_development) | Corporate keeps text in columns; TMK++ does not |
| Hero | Static full-bleed **office/lifestyle** photo, ~470 px; dark translucent nav bar over it (tmkpp_home, tmkpp_history) | Corporate = industrial photography, rotating carousel, taller hero |
| Nav | 3 items ("О ТМК++, РАБОТА В ТМК++, КОНТАКТЫ") + hamburger at desktop + search | Corporate = 5 primary + 7 utility, far deeper |
| Tabs | Two stacked underline tab rows (section + competency) | Corporate has one tab row |
| Components | Underline tabs, bordered accordion with "+", photo carousel with square arrows + thumbnails, plain bullet lists | Corporate has chips, doc rows, one table; **TMK++ has no table, no chips, no cards** |
| Density | Extremely low: competencies page = 6 orange links (tmkpp_competencies); development page = ~40 bullets in a 700 px column with ~55% empty canvas (tmkpp_development) | Even lower than corporate |
| Footer | 3 columns + copyright, orange 2 px rules, circular social icons, identical legal block | **Pixel-identical footer system** |
| Cookie banner | Identical component and copy, full-width dark overlay | **Same shared component** |

**Verdict:** the two sites share one brand kit (accent, condensed display, 24 px gutter, flat rules, footer, cookie banner) but TMK++ is a *thinner* implementation — fewer components, longer lines, less content, smaller type scale. It reads as a lighter template-built microsite, not as a separate design system.

### B9. Information architecture quality
- **Top level:** 3 items, depth 2–3 clicks. Home → "О ТМК++" → "Компетенции" → "Разработка" = 3 clicks to the only substantive technical content.
- **Missing entirely:** news, case studies, projects/portfolio, client logos, metrics (team size, project count, SLA numbers), events, blog, team/leadership detail (a "Менеджмент" tab exists but its content is not in the set), any contact form — "Контакты" is a flat list of 12 postal addresses (tmkpp_contacts).
- **Recruitment-first:** the only home CTA is "УПРАВЛЯЙТЕ СВОЕЙ КАРЬЕРОЙ С TMK++" (tmkpp_home); 1 of 3 nav items is "Работа в ТМК++"; the richest pages are career/education (tmkpp_career, tmkpp_education). For a B2B IT vendor, the sales narrative is absent.
- **Content depth:** ~200–400 words per leaf page, no proof, no numbers, no deliverables. Competencies are a link index, not a service description.
- **Quality bugs visible:** tmkpp_career hero has a white title on a missing background (unreadable); tmkpp_education contains an empty bordered 260×170 placeholder and a 370×40 broken image strip; tmkpp_contacts has the cookie banner covering the first address lines.

### B10. Mobile (tmkpp_home_mobile.png, ~390 px)
- **Collapses:** nav → hamburger (right), search icon retained, footer 3 columns → single column, CTA card full-width.
- **Works:** footer stacking and 44 px social rows; headline wraps cleanly to 2 lines at ~28 px condensed; generous tap targets.
- **Breaks:** (1) hero crop is not art-directed — the laptop/people photo becomes an unreadable close-up of a screen and keyboard; (2) the cookie banner occupies ~35% of the viewport and pushes the only CTA below the fold, with "НАСТРОИТЬ" wrapping to a second row; (3) the desktop hairline under "ПОДРОБНЕЕ" survives as orphan decoration; (4) page content = photo + banner + one card + footer — effectively zero information.

---

## C. Synthesis for the estimation cockpit

### C11. Design tokens

| Token | Value | Source |
|---|---|---|
| `bg` | `#FFFFFF` | observed |
| `surface` | `#F4F4F4` | observed (footer/promo) |
| `surface-sunken` | `#EDEDED` | derived step |
| `band-dark` | `#1E1E1E` | observed (utility/newsletter) |
| `border` | `#D6D6D6` (decorative) | observed |
| `border-strong` | `#9A9A9A` (functional, 3:1) | **proposed** — current 1.5:1 fails 1.4.11 |
| `text-primary` | `#111111` | observed |
| `text-secondary` | `#6B6B6B` (5.1:1) | observed |
| `text-disabled` | `#A3A3A3` | derived |
| `accent` | `#EC6608` (verified; renders ≤`#F26522`) | observed |
| `accent-hover` | `#D45A06` | derived |
| `accent-text-small` | `#B4470A` (4.6:1) | **proposed** — for links <24 px |
| `accent-soft` | `#FCEADF` | **proposed** (no tints exist today) |
| `on-accent` | `#FFFFFF` | observed |
| RAG success / warn / danger / info | `#2F6B4F` / `#D98E1F` / `#C0392B` / `#2A5D8F` | **proposed** — no semantic colours exist in either site |
| RAG tints | `#E8F1EC` / `#FBF0DC` / `#F7E4E1` / `#E4ECF3` | proposed |
| Radius | `0` cards/chips/tables; `2` inputs/buttons; `999` status dots only | observed 0 everywhere |
| Shadow | none by default; overlay `0 12px 32px rgba(17,17,17,.14)`; focus `0 0 0 2px #EC6608` | observed flat + proposed elevation/focus |
| Spacing | 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 | observed 24 px gutter, 32 px heading gap |
| Grid | 12 col, 16 px gutter, 24 px margin, max 1440; fixed 360 px right rail for results | derived from observed 24 px/12-col logic |

**Type scale (product, px):**

| Token | px / lh | Treatment |
|---|---|---|
| `num-xl` (cost, effort) | 40 / 1.0 | Condensed, **tabular**, weight 700 |
| `h1` page | 32 / 1.05 | Condensed UPPERCASE |
| `h2` panel | 22 / 1.15 | Condensed UPPERCASE (the orange label) |
| `h3` card | 16 / 1.3 | Grotesque 600, sentence case |
| `body` | 14 / 1.45 | Grotesque 400 |
| `body-s` | 13 / 1.4 | Grotesque 400 |
| `label` / table head | 11 / 1.2, +0.08 em | UPPERCASE 600 |
| `micro` | 11 / 1.3 | timestamps, units, footnotes |
| `num` | 13–14 / 1.2 | Tabular numerals, right-aligned |
| `btn` | 12 / 1, +0.08 em | UPPERCASE 600 |

Family pairing to stay native: condensed display (DIN/Oswald-class) + Roboto-class text grotesque; no third family.

```css
:root{
  --bg:#fff; --surface:#f4f4f4; --band:#1e1e1e;
  --border:#d6d6d6; --border-strong:#9a9a9a;
  --ink:#111; --ink-2:#6b6b6b; --accent:#ec6608;
  --accent-hover:#d45a06; --accent-soft:#fceadf;
  --ok:#2f6b4f; --warn:#d98e1f; --bad:#c0392b; --info:#2a5d8f;
  --r:0px; --r-in:2px; --sp:8px;
  --font-d:"DIN Condensed","Oswald",sans-serif;
  --font-t:"Roboto","Inter",sans-serif;
  --num:"font-variant-numeric: tabular-nums";
}
```

### C12. Five borrow moves / five break moves

**Borrow (native signals):**

| # | Move | Evidence | Application |
|---|---|---|---|
| 1 | Orange condensed UPPERCASE panel titles at 22–24 px, no underline needed | "НОВОСТИ", "ФИНАНСОВЫЕ РЕЗУЛЬТАТЫ ПО МСФО" (tmk_main_home, tmk_ir_finres) | "ОЦЕНКА", "СРАВНЕНИЕ", "РИСКИ" panel headers |
| 2 | Chips: black fill = selected, 1 px border = idle, radius 0 | year selector (tmk_ir_finres), news filters (tmk_main_home) | Scenario/currency/team-mode switchers |
| 3 | Bordered document row: icon + title + format + long arrow, 56–64 px | tmk_ir_finpres, tmk_esg_presentations | Export history, artifact checklist, "Скачать PDF" |
| 4 | Dark 40 px utility strip above a white 56 px bar | tmk_main_home header | Utility strip = project/env/user; white bar = product nav + primary action |
| 5 | Uppercase micro-labels (+0.08 em) + long-arrow link + 2 px orange rule over grouped content | footers, "ПОДРОБНЕЕ —→" | Field labels, "Раскрыть расчёт —→", grouping rails in the right panel |

**Break (deliberate modernization):**

| # | Break | Why | Replacement |
|---|---|---|---|
| 1 | 520–780 px photographic hero | In a cockpit it pushes the task below the fold | 64 px command bar + a 96 px KPI strip (effort / duration / cost / delta) |
| 2 | ~140-character line measure (tmkpp_consulting) | Unreadable for specs and assumptions | 12-col grid, 65–75 ch text column + 360 px result rail |
| 3 | No numeric typography (dividends table uses proportional body figures) | Cost/effort comparison lives on alignment | Tabular numerals, right alignment, condensed 40 px KPIs, units in `micro` |
| 4 | Photo tiles as content containers | Zero information per pixel | Bordered data cards: value, delta, 40 px sparkline, RAG chip; allow **one** photo band on login/empty state only |
| 5 | No semantic colour / no state system | Risk and in-house-vs-contractor need instant reading | RAG palette above + hover/focus/selected states; keep `#EC6608` exclusively for action and labels so it never competes with "warning" |

### C13. Warning list — what would hurt a data-heavy tool if copied naively

1. **Density is the opposite of what you need.** Corporate pages spend 55–70% of pixels on white and 520–780 px on photography (tmk_main_about); TMK++ spends ~50% of the viewport on empty canvas (tmkpp_competencies). Do not inherit section paddings of 72–120 px; use 24–32 px.
2. **Long measure.** TMK++ body text spans the full 1392 px container (tmkpp_development, tmkpp_consulting). Cap prose at 65–75 ch or the spec/assumption text becomes unscannable.
3. **Orange is a label colour, not a status colour.** It is already used for headings, links, tabs and CTAs; adding it to warnings would destroy meaning. Keep RAG separate.
4. **Orange small text fails AA.** `#EC6608` = 3.2:1. Their ~30 px headings are fine; your 11–13 px links/labels are not — use `#B4470A`.
5. **Hairlines are too light for table grids.** `#D6D6D6` = 1.5:1; at 20+ rows (cf. tmk_ir_dividends) the grid disappears. Use `#9A9A9A` for functional borders, keep `#D6D6D6` for decoration.
6. **No numeric or chart vocabulary exists.** The most "financial" page in the estate is a list of PDF rows (tmk_ir_finpres) plus one bordered table. You are inventing the entire data language — budget for it, and keep it flat (no gradients/glass) so it still feels TMK.
7. **Image-dependent components produce voids.** On tmk_main_home two of three news cards render without thumbnails, leaving a large hole; tmkpp_education has an empty 260×170 placeholder. Never let layout depend on an image loading.
8. **Chrome eats vertical space.** Two-tier header (~100 px) + section tab row (~60 px) + breadcrumb (~40 px) = 200 px before content; on mobile the cookie takeover hides the only CTA (tmkpp_home_mobile). In the cockpit, use one 56–64 px bar, no tab row, no breadcrumb above the fold.
9. **Carousel/arrow navigation is a dead end for analysis.** Both sites navigate by arrows and "подробнее" (tmk_main_home, tmkpp_history); a cockpit should expose comparisons simultaneously, never behind a slider.
10. **White-on-photo only works because of the scrim.** If you borrow the photo hero, you must also borrow the `rgba(0,0,0,.65)` gradient — otherwise the type contrast collapses (already broken on tmkpp_career).
