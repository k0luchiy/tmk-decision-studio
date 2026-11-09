# Benchmark Data: IT Cost and Effort Anchors, Russia and Kazakhstan, 2025-2026

**Document status:** benchmark data set for an IT project cost model.  
**Compiled:** 2026-11-08.  
**Scope:** RU and KZ salaries, employer statutory burden, in-house cost components, outsourcing rate cards, productivity, open analogue data, and published project price anchors.  
**Currencies:** RUB and KZT are kept as quoted. No FX conversion is applied because this data set has no sourced exchange rate; apply the current central-bank rate at the point of use.

**Legend**

| Label | Meaning |
|---|---|
| High | Primary source or official statistic that states the value directly. |
| Medium | Reputable secondary source, survey, or arithmetic derived from High-confidence inputs (the derivation is shown). |
| Low | Blog compilation, small sample, ambiguous basis, or stale figure. |
| Proxy | No defensible public benchmark found. The value is an estimate built from sourced components and must be replaced by a vendor quote or internal data before pricing. |

**Basis vocabulary**

| Basis | Meaning |
|---|---|
| net (на руки) | Take-home pay after personal income tax. Habr Career and most self-reported surveys use this basis. |
| gross | Pay before personal income tax. hh.ru and hh.kz "offered" medians are treated as gross. |
| gross, offered | Employer-offered amount in a vacancy. Usually gross, but the source does not always state it. |
| self-reported | Survey response, not an offer. Skews toward active, senior, and capital-city respondents. |
| contract price | Published project or contract amount. VAT treatment varies by source and is stated where known. |
| rate, excl. VAT | Hourly or daily billing rate before VAT. |
| statutory rate | Tax or contribution rate fixed by law. |
| list price | Vendor or repository published price, before negotiation. |

**How to read the attribute columns.** Every numeric row carries value, unit, period, geography, basis, source URL, and confidence. Where a row is computed, the note says "derived" and the formula appears in the surrounding text. Where a figure is a range, the low and high values are shown in the same cell and the unit applies to both.

---

## TL;DR

- **Russia salary level (net, monthly):** backend 251,000 RUB, frontend 225,000, mobile 295,000, architect 504,000, 1C 197,000, QA 200,000, analyst 250,000. Grade ladder: junior 82,000-111,000, middle 164,000-201,000, senior 286,000-337,000, lead 342,000-404,000. See section 1.
- **Kazakhstan salary level (KZT, monthly):** hh.kz developer median 359,198; developer survey median 960,000 and mean 1,220,000; official average IT salary 818,100 in Q3 2025. The vacancy median and the survey median are different ledgers, not the same number measured twice. See section 2.
- **Russia employer burden (2026):** 30% up to 2,979,000 RUB per person per year, 15.1% above. Gross multiplier is 1.300 at 200,000 RUB/month and 1.274 at 300,000; net-to-employer is about 1.50 at 200,000 net and 1.46 at 300,000 net. See section 3.
- **Kazakhstan employer burden (2026):** social tax 6%, OPVR 3.5%, social contributions 5%, OSMS 3%. On a 1,000,000 KZT gross salary the employer pays 147,550 KZT (14.76%), giving a 1.148 gross multiplier and a 1.449 net multiplier. See section 4.
- **In-house full cost:** office 22,423 RUB/m²/year plus 6,000 RUB/m²/year OPEX in Moscow Class B; 36,000-52,000 RUB/workstation/month leased; 56,228 RUB/workstation/month co-working; hardware 150,000-300,000 RUB per developer per three years. Full cost lands at 1.30-1.65x gross and roughly 1.50-1.85x net after workplace loading. See section 5.
- **Outsourcing:** RU custom development 2,000-6,500 RUB/hour, 1C 1,500-4,500 RUB/hour; KZ 15-50 USD/hour; India 24-41 USD/hour; Poland senior 64-76 USD/hour. See section 6.
- **Productivity correction:** the widely repeated "7-8 FP per person-month" is a misreading. ISBSG's headline is 7-8 **hours per function point**. At 160 hours/month that yields 16-25 FP/person-month, and ISBSG's MDR says 20-40 FP/person-month for most projects. See section 7.
- **Open data:** zakupki.gov.ru contract registry, goszakup.gov.kz GraphQL/REST, ISBSG paid repository, PROMISE effort data sets, and GH Archive. Each has different fields and licensing. See section 8.
- **Price anchors:** 1C ERP 1-300M RUB; SAP-to-1C 9.5M-1B RUB; MES 62M-1B+ RUB; CV quality control 0.6-5M RUB; DWH 1.5M-1.11B RUB; KII work 55,000-50.4M RUB. These are price, not effort. See section 9.
- **The three credibility drivers:** the net-vs-gross basis of salary medians, the RU contribution cap arithmetic, and the hours-per-FP correction. If those three are wrong, every downstream cost estimate inherits the error. See sections 1, 3, and 7.

---

## 1. Salary benchmarks, Russia

### 1.1 Method and ledger split

Russia has two salary ledgers that are often compared as if they were one:

1. **Habr Career** reports take-home pay, explicitly "на руки, за вычетом всех налогов". The H2 2025 all-IT median is 183,333 RUB/month, and the H1 2026 all-IT median is 191,000 RUB/month ([Habr Career H2 2025](https://habr.com/ru/specials/994308/), 2026-02-09; [Habr Career H1 2026](https://habr.com/ru/companies/habr_career/articles/1075936/), 2026-08-28).
2. **hh.ru** reports median offered pay in vacancies. Its 2025 all-IT median is about 96,300 RUB/month ([hh.ru IT market 2025](https://habr.com/ru/companies/hh/articles/1010834/), 2026-03-16; [CNews/hh.ru](https://www.cnews.ru/news/line/2025-09-22_skolko_rabotodateli_gotovy), 2025-09-22).

The gap is not only tax. Habr respondents are active, senior, and concentrated in Moscow and St. Petersburg; hh.ru vacancies include support, junior, and regional roles. Treat Habr as a **role band** and hh.ru as a **market floor**. Do not compare them directly. The ledger reconciliation is in section 1.6.

### 1.2 Role medians, Russia

Values are monthly. "All grades" means the source publishes a single median for the role, not a grade ladder.

| Role | Value | Unit | Period | Geography | Basis | Source | Confidence |
|---|---:|---|---|---|---|---|---|
| Backend (Java, Kotlin, Python, C#, Go, PHP) | 251,000 | RUB/month | 2026-H1 | RU | net (на руки) | https://habr.com/ru/companies/habr_career/articles/1075936/ | High |
| Frontend | 225,000 | RUB/month | 2026-H1 | RU | net (на руки) | https://habr.com/ru/companies/habr_career/articles/1075936/ | High |
| Fullstack | 208,000 | RUB/month | 2026-H1 | RU | net (на руки) | https://habr.com/ru/companies/habr_career/articles/1075936/ | High |
| Mobile (iOS and Android) | 295,000 | RUB/month | 2026-H1 | RU | net (на руки) | https://habr.com/ru/companies/habr_career/articles/1075936/ | High |
| Architect | 504,000 | RUB/month | 2026-H1 | RU | net (на руки) | https://habr.com/ru/companies/habr_career/articles/1075936/ | High |
| Architect, prior cut | 465,000 | RUB/month | 2025-H2 | RU | net (на руки) | https://habr.com/ru/specials/994308/ | High |
| 1C developer | 197,000 | RUB/month | 2026-H1 | RU | net (на руки) | https://habr.com/ru/companies/habr_career/articles/1075936/ | High |
| Database developer | 220,000 | RUB/month | 2026-H1 | RU | net (на руки) | https://habr.com/ru/companies/habr_career/articles/1075936/ | High |
| Embedded developer | 168,000 | RUB/month | 2026-H1 | RU | net (на руки) | https://habr.com/ru/companies/habr_career/articles/1075936/ | High |
| HTML/CSS developer | 114,000 | RUB/month | 2026-H1 | RU | net (на руки) | https://habr.com/ru/companies/habr_career/articles/1075936/ | High |
| QA, all grades | 200,000 | RUB/month | 2025-H2 | RU | net, self-reported | https://ruitunion.org/posts/2025-10-13-it-specialist-salaries-in-the-second-half-of-2025/ | High |
| Analyst (system, business, data) | 250,000 | RUB/month | 2025-H2 | RU | net, self-reported | https://ruitunion.org/posts/2025-10-13-it-specialist-salaries-in-the-second-half-of-2025/ | High |
| DevOps, SRE, admin | 245,000 | RUB/month | 2025 | RU | net, self-reported | https://thecode.media/zarplaty-it-specialistov-v-konce-2025/ | High |
| Data engineer | 255,000 | RUB/month | 2025 | RU | net, self-reported | https://thecode.media/zarplaty-it-specialistov-v-konce-2025/ | High |
| Business analyst | 167,000 | RUB/month | 2025 | RU | net, self-reported | https://thecode.media/zarplaty-it-specialistov-v-konce-2025/ | High |
| UX and UI designer | 115,000 | RUB/month | 2025-H1 | RU | net, self-reported | https://habr.com/ru/specials/936618/ | High |
| PM, team lead, product owner, low manager | 330,000 | RUB/month | 2025-H2 | RU | net, self-reported | https://ruitunion.org/posts/2025-10-13-it-specialist-salaries-in-the-second-half-of-2025/ | High |
| Information security | 150,000-250,000 | RUB/month | 2025 | RU | net, proxy | https://www.cnews.ru/news/line/2025-12-15_za_pyat_let_predlagaemye | Proxy |

**Information security gap.** Habr reports a 5% increase for information security in H2 2025 but does not publish an absolute in the article text ([Habr H2 2025](https://habr.com/ru/specials/994308/)). hh.ru's offered median for information security is 85,300 RUB/month gross across all levels ([CNews, 2025-12-15](https://www.cnews.ru/news/line/2025-12-15_za_pyat_let_predlagaemye)). That is a vacancy floor, not a senior specialist rate. The 150,000-250,000 RUB/month net row is a proxy. Replace it with your own offers before using it in a bid.

**City split, net, 2026-H1:** Moscow developers 270,000 RUB/month; St. Petersburg 247,000; regions 200,000; all-IT median 191,000 (Moscow 235,000, St. Petersburg 200,000, regions 160,000). Source: [Habr Career H1 2026](https://habr.com/ru/companies/habr_career/articles/1075936/), 2026-08-28. Confidence: High.

### 1.3 Grade ladder, Russia

| Grade | Regions, RUB/month | Moscow and St. Petersburg, RUB/month | Unit | Period | Geography | Basis | Source | Confidence |
|---|---:|---:|---|---|---|---|---|---|
| Intern | 59,000 | 69,000 | RUB/month | 2025 | RU | net, self-reported | https://thecode.media/zarplaty-it-specialistov-v-konce-2025/ | High |
| Junior | 82,000 | 111,000 | RUB/month | 2025 | RU | net, self-reported | https://thecode.media/zarplaty-it-specialistov-v-konce-2025/ | High |
| Middle | 164,000 | 201,000 | RUB/month | 2025 | RU | net, self-reported | https://thecode.media/zarplaty-it-specialistov-v-konce-2025/ | High |
| Senior | 286,000 | 337,000 | RUB/month | 2025 | RU | net, self-reported | https://thecode.media/zarplaty-it-specialistov-v-konce-2025/ | High |
| Lead | 342,000 | 404,000 | RUB/month | 2025 | RU | net, self-reported | https://thecode.media/zarplaty-it-specialistov-v-konce-2025/ | High |

**Cross-check, RUIT Union H2 2025:** intern 65,000; junior 110,000; middle 200,000; senior 300,000; lead 380,000 RUB/month, self-reported, likely net. Source: [RUIT Union](https://ruitunion.org/posts/2025-10-13-it-specialist-salaries-in-the-second-half-of-2025/), 2025-10-13. Confidence: High. The two ladders are broadly consistent at middle and senior level: the Moscow middle is within about 1% of the RUIT middle, while the regional middle is about 18% below it. That is enough to treat the grade ratios as stable, but not enough to use one ladder for both geographies.

**Grade ratios derived from the RUIT ladder:** junior 0.55, middle 1.00, senior 1.50, lead 1.90. These ratios are used only if you need to move a role median to another grade. They are a derived planning aid, not a sourced salary table.

### 1.4 Role by grade bands, Russia, gross

The table below is a market compilation, not a primary survey. It is **gross**, while section 1.2 is **net**. Do not mix the two.

| Role | Junior, RUB/month | Middle, RUB/month | Senior, RUB/month | Lead, RUB/month | Unit | Period | Geography | Basis | Source | Confidence |
|---|---:|---:|---:|---:|---|---|---|---|---|---|
| Backend | 80,000-140,000 | 180,000-280,000 | 320,000-500,000 | 450,000-800,000 | RUB/month | 2025-2026 | RU | gross | https://www.trillioncredit.ru/blog/zarplaty-v-it/ | Low |
| Frontend | 70,000-120,000 | 160,000-250,000 | 280,000-450,000 | 400,000-700,000 | RUB/month | 2025-2026 | RU | gross | https://www.trillioncredit.ru/blog/zarplaty-v-it/ | Low |
| Mobile | 90,000-150,000 | 200,000-320,000 | 350,000-550,000 | not published | RUB/month | 2025-2026 | RU | gross | https://www.trillioncredit.ru/blog/zarplaty-v-it/ | Low |
| QA manual | 50,000-90,000 | 100,000-160,000 | not published | not published | RUB/month | 2025-2026 | RU | gross | https://www.trillioncredit.ru/blog/zarplaty-v-it/ | Low |
| QA automation | 100,000-160,000 | 180,000-280,000 | 300,000-450,000 | 350,000-550,000 | RUB/month | 2025-2026 | RU | gross | https://www.trillioncredit.ru/blog/zarplaty-v-it/ | Low |
| DevOps and SRE | not published | 220,000-350,000 | 400,000-600,000 | 600,000-900,000 | RUB/month | 2025-2026 | RU | gross | https://www.trillioncredit.ru/blog/zarplaty-v-it/ | Low |
| Data engineer and DS | not published | 200,000-320,000 | 400,000-650,000 | not published | RUB/month | 2025-2026 | RU | gross | https://www.trillioncredit.ru/blog/zarplaty-v-it/ | Low |
| Business and system analyst | 80,000-130,000 | 180,000-280,000 | 350,000-600,000 | not published | RUB/month | 2025-2026 | RU | gross | https://www.trillioncredit.ru/blog/zarplaty-v-it/ | Low |

The bands are useful for shape, not for price. Recalibrate them against section 1.2 and your own offers. The source is a blog aggregation and is marked Low on purpose.

### 1.5 Language premiums, Russia

All values are monthly, net, RU, and self-reported unless noted.

| Language | Value, RUB/month | Period | Basis | Source | Confidence | Note |
|---|---:|---|---|---|---|---|
| Objective-C | 355,000 | 2025-H2 | net | https://habr.com/ru/specials/994308/ | High | H1 2026 reports 400,000 |
| Objective-C | 400,000 | 2026-H1 | net | https://habr.com/ru/companies/habr_career/articles/1075936/ | High | latest cut |
| Elixir | 335,000 | 2025-H2 | net | https://habr.com/ru/specials/994308/ | High | |
| Golang | 320,000 | 2025-H2 | net | https://habr.com/ru/specials/994308/ | High | 309,000 in H1 2025, +4% |
| Kotlin | 306,000 | 2025-H2 | net | https://habr.com/ru/specials/994308/ | Medium | derived: 300,000 in H1 2025 x 1.02 |
| C# | 251,000 | 2025-H2 | net | https://habr.com/ru/specials/994308/ | Medium | derived: 230,000 in H1 2025 x 1.09 |
| Python | 229,000 | 2025-H2 | net | https://habr.com/ru/specials/994308/ | Medium | derived: 212,000 in H1 2025 x 1.08 |
| Java | 251,000 | 2026-H1 | net | https://habr.com/ru/companies/habr_career/articles/1075936/ | Proxy | proxy equals backend median; Java absolute not published in article text |
| C++ | 240,000 | 2025-H2 | net | https://habr.com/ru/specials/994308/ | Medium | 211,000 in H1 2025, +14% |
| C | 220,000 | 2025-H2 | net | https://habr.com/ru/specials/994308/ | Medium | +18% in H2 2025 |

Source for H1 2025 absolute values: [Habr Career H1 2025](https://habr.com/ru/specials/936618/), 2025-08-14. Source for H2 2025 changes: [Habr Career H2 2025](https://habr.com/ru/specials/994308/), 2026-02-09.

**hh.ru lower bound, gross, offered, August-September 2025:** Python 165,000; PostgreSQL 169,000; SQL 147,400; Git 149,000; Linux 112,000 RUB/month; all-IT vacancy median 96,300. Source: [CNews/hh.ru](https://www.cnews.ru/news/line/2025-09-22_skolko_rabotodateli_gotovy), 2025-09-22; [hh.ru IT market 2025](https://habr.com/ru/companies/hh/articles/1010834/), 2026-03-16. Confidence: High for the vacancy ledger.

### 1.6 Ledger reconciliation: Habr net versus hh gross

| Ledger | Value, RUB/month | Period | Geography | Basis | Source | Confidence |
|---|---:|---|---|---|---|---|
| Habr Career, all IT | 183,333 | 2025-H2 | RU | net (на руки) | https://habr.com/ru/specials/994308/ | High |
| Habr Career, all IT | 191,000 | 2026-H1 | RU | net (на руки) | https://habr.com/ru/companies/habr_career/articles/1075936/ | High |
| hh.ru, all IT vacancies | 96,300 | 2025 | RU | gross, offered | https://habr.com/ru/companies/hh/articles/1010834/ | High |
| RUIT Union, all roles | 252,000 | 2025-H2 | RU | self-reported, likely net | https://ruitunion.org/posts/2025-10-13-it-specialist-salaries-in-the-second-half-of-2025/ | High |

**Why the three numbers differ.** Habr's 183,333 net grosses up to about 210,727 at a flat 13% NDFL, which is 2.19 times the hh.ru vacancy median. The remaining gap is sample composition, not tax. RUIT's 252,000 is higher than Habr because RUIT respondents skew middle and senior. For a cost model, use Habr for role bands, hh.ru for the floor, and RUIT for the grade ladder. Do not average the three.

---

## 2. Salary benchmarks, Kazakhstan

### 2.1 Vacancy medians, hh.kz

Values are monthly, KZT, employer-offered. hh.kz does not state a net basis, so treat them as gross.

| Role | Value, KZT/month | Unit | Period | Geography | Basis | Source | Confidence |
|---|---:|---|---|---|---|---|---|
| Programmer and developer | 359,198 | KZT/month | 2025 | KZ | gross, offered | https://hh.kz/article/34221 | High |
| QA tester | 233,980 | KZT/month | 2025 | KZ | gross, offered | https://hh.kz/article/34221 | High |
| Analyst, generic | 313,989 | KZT/month | 2025 | KZ | gross, offered | https://hh.kz/article/34221 | High |
| Business analyst | 415,157 | KZT/month | 2025 | KZ | gross, offered | https://hh.kz/article/34221 | High |
| System analyst | 340,278 | KZT/month | 2025 | KZ | gross, offered | https://hh.kz/article/34221 | High |
| DevOps | 247,000 | KZT/month | 2025 | KZ | gross, offered | https://hh.kz/article/34221 | High |
| Information security | 231,523 | KZT/month | 2025 | KZ | gross, offered | https://hh.kz/article/34221 | High |
| Project manager | 378,683 | KZT/month | 2025 | KZ | gross, offered | https://hh.kz/article/34221 | High |
| Product manager | 290,359 | KZT/month | 2025 | KZ | gross, offered | https://hh.kz/article/34221 | High |
| Designer | 275,906 | KZT/month | 2025 | KZ | gross, offered | https://hh.kz/article/34221 | High |
| Data scientist | 440,000 | KZT/month | 2025 | KZ | gross, offered | https://hh.kz/article/34221 | High |
| CTO | 498,500 | KZT/month | 2025 | KZ | gross, offered | https://hh.kz/article/34221 | High |
| CIO | 436,345 | KZT/month | 2025 | KZ | gross, offered | https://hh.kz/article/34221 | High |
| System administrator | 272,614 | KZT/month | 2025 | KZ | gross, offered | https://hh.kz/article/34221 | High |
| Support specialist | 220,929 | KZT/month | 2025 | KZ | gross, offered | https://hh.kz/article/34221 | High |

### 2.2 Experience ladder, hh.kz

| Experience | Value, KZT/month | Unit | Period | Geography | Basis | Source | Confidence |
|---|---:|---|---|---|---|---|---|
| No experience | 228,154 | KZT/month | 2025-Q1 | KZ | gross, offered | https://hh.kz/article/33667 | High |
| Up to 3 years | 323,646 | KZT/month | 2025-Q1 | KZ | gross, offered | https://hh.kz/article/33667 | High |
| Up to 6 years | 529,778 | KZT/month | 2025-Q1 | KZ | gross, offered | https://hh.kz/article/33667 | High |
| 6+ years | 782,639 | KZT/month | 2025-Q1 | KZ | gross, offered | https://hh.kz/article/33667 | High |

### 2.3 Survey and official anchors, Kazakhstan

| Source | Metric | Value, KZT/month | Unit | Period | Geography | Basis | URL | Confidence |
|---|---|---|---:|---|---|---|---|---|
| Digital Business developer survey | Median | 960,000 | KZT/month | 2025 | KZ | self-reported | https://digitalbusiness.kz/2025-02-07/bolshe-1-mln-tenge-stala-izvestna-srednyaya-zarplata-razrabotchikov-v-kazahstane/ | High |
| Digital Business developer survey | Mean | 1,220,000 | KZT/month | 2025 | KZ | self-reported | https://digitalbusiness.kz/2025-02-07/bolshe-1-mln-tenge-stala-izvestna-srednyaya-zarplata-razrabotchikov-v-kazahstane/ | High |
| Kolesa Group analyst survey | Data analytics median | 780,000 | KZT/month | 2025 | KZ | self-reported | https://digitalbusiness.kz/2025-10-22/skolko-platyat-analitikam-v-kazahstane-dannie-kolesa-group/ | High |
| Kolesa Group analyst survey | DWH median | 970,000 | KZT/month | 2025 | KZ | self-reported | https://digitalbusiness.kz/2025-10-22/skolko-platyat-analitikam-v-kazahstane-dannie-kolesa-group/ | High |
| Kolesa Group analyst survey | BI median | 850,000 | KZT/month | 2025 | KZ | self-reported | https://digitalbusiness.kz/2025-10-22/skolko-platyat-analitikam-v-kazahstane-dannie-kolesa-group/ | High |
| Kolesa Group analyst survey | Data science median | 930,000 | KZT/month | 2025 | KZ | self-reported | https://digitalbusiness.kz/2025-10-22/skolko-platyat-analitikam-v-kazahstane-dannie-kolesa-group/ | High |
| Kolesa Group analyst survey | ML median | 1,060,000 | KZT/month | 2025 | KZ | self-reported | https://digitalbusiness.kz/2025-10-22/skolko-platyat-analitikam-v-kazahstane-dannie-kolesa-group/ | High |
| Bureau of National Statistics via inform.kz | Average nominal IT salary | 818,100 | KZT/month | 2025-Q3 | KZ | gross, official average | https://www.inform.kz/ru/bolee-800-tisyach-tenge-zarabativayut-it-spetsialisti-v-kazahstane-61f86a | High |
| Bureau of National Statistics via inform.kz | Astana average | 975,300 | KZT/month | 2025-Q3 | KZ | gross, official average | https://www.inform.kz/ru/bolee-800-tisyach-tenge-zarabativayut-it-spetsialisti-v-kazahstane-61f86a | High |
| Bureau of National Statistics via inform.kz | Almaty average | 898,800 | KZT/month | 2025-Q3 | KZ | gross, official average | https://www.inform.kz/ru/bolee-800-tisyach-tenge-zarabativayut-it-spetsialisti-v-kazahstane-61f86a | High |

### 2.4 Ledger reconciliation: hh.kz versus developer and analyst surveys

| Ledger | Value, KZT/month | Period | Geography | Basis | Source | Confidence |
|---|---:|---|---|---|---|---|
| hh.kz programmer and developer median | 359,198 | 2025 | KZ | gross, offered | https://hh.kz/article/34221 | High |
| Developer survey median | 960,000 | 2025 | KZ | self-reported | https://digitalbusiness.kz/2025-02-07/bolshe-1-mln-tenge-stala-izvestna-srednyaya-zarplata-razrabotchikov-v-kazahstane/ | High |
| Developer survey mean | 1,220,000 | 2025 | KZ | self-reported | https://digitalbusiness.kz/2025-02-07/bolshe-1-mln-tenge-stala-izvestna-srednyaya-zarplata-razrabotchikov-v-kazahstane/ | High |
| Official average IT salary | 818,100 | 2025-Q3 | KZ | gross, official average | https://www.inform.kz/ru/bolee-800-tisyach-tenge-zarabativayut-it-spetsialisti-v-kazahstane-61f86a | High |

**Why the gap is 2.7x.** hh.kz covers every IT vacancy, including support, junior, and regional roles. The developer survey covers people who answered a developer survey, which selects for employed, senior, and Almaty or Astana respondents. The official average is a payroll statistic and sits between the two. Use hh.kz as the **floor**, the survey as the **experienced-hire band**, and the official average as a **sanity check**. Never use the 359,198 figure as a senior developer cost.

---

## 3. Employer burden, Russia

### 3.1 Statutory rates, 2026

| Item | Value | Unit | Period | Geography | Basis | Source | Confidence |
|---|---:|---|---|---|---|---|---|
| Unified social contributions up to threshold | 30 | % of gross | 2026 | RU | statutory rate | https://www.nalog.gov.ru/rn32/news/seminar/16610341/ | High |
| Unified social contributions above threshold | 15.1 | % of gross above threshold | 2026 | RU | statutory rate | https://www.nalog.gov.ru/rn32/news/seminar/16610341/ | High |
| Contribution threshold | 2,979,000 | RUB/person/year | 2026 | RU | statutory threshold | https://www.nalog.gov.ru/rn77/news/activities_fts/16577139/ | High |
| Accredited IT company, up to threshold | 15 | % of gross | 2026 | RU | statutory rate | https://www.klerk.ru/buh/articles/669936/ | High |
| Accredited IT company, above threshold | 7.6 | % of gross above threshold | 2026 | RU | statutory rate | https://www.klerk.ru/buh/articles/669936/ | High |
| NDFL, first bracket | 13 | % up to 2,400,000 RUB/year | 2026 | RU | statutory rate | https://www.nalog.gov.ru/rn38/taxation/taxes/ndfl/16453713/ | High |
| NDFL, second bracket | 15 | % on 2,400,000-5,000,000 RUB/year | 2026 | RU | statutory rate | https://www.nalog.gov.ru/rn38/taxation/taxes/ndfl/16453713/ | High |
| NDFL, third bracket | 18 | % on 5,000,000-20,000,000 RUB/year | 2026 | RU | statutory rate | https://www.nalog.gov.ru/rn38/taxation/taxes/ndfl/16453713/ | High |
| NDFL, fourth bracket | 20 | % on 20,000,000-50,000,000 RUB/year | 2026 | RU | statutory rate | https://www.nalog.gov.ru/rn38/taxation/taxes/ndfl/16453713/ | High |
| NDFL, fifth bracket | 22 | % above 50,000,000 RUB/year | 2026 | RU | statutory rate | https://www.nalog.gov.ru/rn38/taxation/taxes/ndfl/16453713/ | High |

Supporting legal sources: [Tax Code Article 425](https://www.consultant.ru/document/cons_doc_LAW_28165/a3f603ffd57b1431ed51e1693ba710093347235d/), [Government Decree 1705](https://www.consultant.ru/document/cons_doc_LAW_518016/), [FNS NDFL page](https://www.nalog.gov.ru/rn38/taxation/taxes/ndfl/16453713/), [Garant NDFL overview](https://www.garant.ru/actual/nalog/ndfl/).

### 3.2 Contribution cap arithmetic

Formula: `contributions = 30% x min(annual gross, 2,979,000) + 15.1% x max(0, annual gross - 2,979,000)`.

| Gross salary, RUB/month | Annual gross, RUB | Contributions, RUB/year | Employer cost, RUB/month | Gross multiplier | Period | Geography | Basis | Source | Confidence |
|---:|---:|---:|---:|---:|---|---|---|---|---|
| 200,000 | 2,400,000 | 720,000 | 260,000 | 1.300 | 2026 | RU | gross | https://www.nalog.gov.ru/rn32/news/seminar/16610341/ | High |
| 250,000 | 3,000,000 | 896,871 | 324,739 | 1.299 | 2026 | RU | gross | https://www.nalog.gov.ru/rn32/news/seminar/16610341/ | Medium |
| 300,000 | 3,600,000 | 987,471 | 382,289 | 1.274 | 2026 | RU | gross | https://www.nalog.gov.ru/rn32/news/seminar/16610341/ | Medium |
| 400,000 | 4,800,000 | 1,168,671 | 497,389 | 1.243 | 2026 | RU | gross | https://www.nalog.gov.ru/rn32/news/seminar/16610341/ | Medium |
| 500,000 | 6,000,000 | 1,349,871 | 612,489 | 1.225 | 2026 | RU | gross | https://www.nalog.gov.ru/rn32/news/seminar/16610341/ | Medium |

Worked checks:

- 250,000 RUB/month is 3,000,000 RUB/year. The first 2,979,000 is taxed at 30%: 893,700. The remaining 21,000 is taxed at 15.1%: 3,171. Total 896,871. Employer annual cost 3,896,871, or 324,739/month. Multiplier 1.299.
- 300,000 RUB/month is 3,600,000 RUB/year. The first 2,979,000 gives 893,700. The remaining 621,000 gives 93,771. Total 987,471. Employer annual cost 4,587,471, or 382,289/month. Multiplier 1.274.
- 500,000 RUB/month is 6,000,000 RUB/year. The first 2,979,000 gives 893,700. The remaining 3,021,000 gives 456,171. Total 1,349,871. Employer annual cost 7,349,871, or 612,489/month. Multiplier 1.225.

The multiplier falls as salary rises because the 15.1% marginal rate is lower than the 30% rate. For a typical middle or senior salary in 2026, use **1.27-1.30x gross**, not a flat 1.30.

### 3.3 Net to employer cost, Russia

Habr medians are net, so the cost model must gross them up before applying contributions. The simple rule is `net / 0.87 x 1.30`, but the 2025 progressive NDFL makes the exact gross slightly different once annual gross crosses 2,400,000 RUB.

| Net salary, RUB/month | Gross salary, RUB/month | NDFL, RUB/month | Employer payroll cost, RUB/month | Net multiplier | Period | Geography | Basis | Source | Confidence |
|---:|---:|---:|---:|---:|---|---|---|---|---|
| 200,000 | 230,588 | 30,588 | 299,765 | 1.499 | 2026 | RU | net to gross to employer | https://www.nalog.gov.ru/rn38/taxation/taxes/ndfl/16453713/ | Medium |
| 300,000 | 348,235 | 48,235 | 437,808 | 1.459 | 2026 | RU | net to gross to employer | https://www.nalog.gov.ru/rn38/taxation/taxes/ndfl/16453713/ | Medium |
| 500,000 | 589,634 | 89,634 | 715,658 | 1.431 | 2026 | RU | net to gross to employer | https://www.nalog.gov.ru/rn38/taxation/taxes/ndfl/16453713/ | Medium |

Worked check for 200,000 RUB net/month:

1. Annual net 2,400,000. With NDFL at 13% up to 2,400,000 and 15% above, solve `net = gross - 312,000 - 0.15 x (gross - 2,400,000)`. That gives gross 2,767,059/year, or 230,588/month.
2. Annual gross 2,767,059 is below the 2,979,000 contribution cap, so contributions are 30%: 830,118/year.
3. Employer annual cost 3,597,177, or 299,765/month. That is 1.499 times the 200,000 net.

The often-quoted "1.45-1.50x net" is a reasonable approximation for **payroll only** at middle salaries; the exact range across 200,000-500,000 RUB net is 1.43-1.50x. Add office, hardware, and licenses and the net multiplier rises (section 5).

### 3.4 Severance

| Item | Value | Unit | Period | Geography | Basis | Source | Confidence |
|---|---:|---|---|---|---|---|---|
| Statutory severance, reduction | 1 average monthly earnings, plus a 2nd month if not employed, plus a 3rd month by employment-service decision | months of average earnings | 2026 | RU | statutory | https://www.consultant.ru/document/cons_doc_LAW_34683/0526867a7eace3f1f88798592ed0bdf3589f0528/ | High |
| Alternative severance | 2 average monthly earnings immediately | months of average earnings | 2026 | RU | statutory | https://www.consultant.ru/document/cons_doc_LAW_34683/0526867a7eace3f1f88798592ed0bdf3589f0528/ | High |
| Tax treatment | Not taxed up to 3 average monthly earnings | multiple of average earnings | 2026 | RU | statutory | https://kontur.ru/articles/87618-vyplaty_pri_sokraschenii_shtata | High |

For a cost model, carry a severance reserve of **2-3 average monthly gross salaries** for a reduction scenario, and remember that the first three averages are outside NDFL and contributions within the statutory limits.

---

## 4. Employer burden, Kazakhstan

### 4.1 Rule set, 2025 versus 2026

| Payment | 2025 rule | 2026 rule | Who pays | Unit | Period | Geography | Basis | Source | Confidence |
|---|---|---|---|---|---|---|---|---|---|
| Social tax, СН | 11% minus social contributions, about 6% net | 6%, no offset against social contributions | Employer | % of base | 2025-2026 | KZ | statutory rate | https://kst.kgd.gov.kz/ru/news/izmeneniya-po-socialnomu-nalogu-v-2026-godu-12-163416 | High |
| OPV, pension | 10% | 10% | Employee | % of gross | 2025-2026 | KZ | statutory rate | https://vko.kgd.gov.kz/ru/news/socialnye-platezhi-v-respublike-kazahstan-8-160454 | High |
| OPVR, employer pension | 2.5% | 3.5%, rising to 5% by 2028 | Employer | % of gross | 2025-2026 | KZ | statutory rate | https://uppersetup.com/ru/blog/employer-payroll-taxes-and-contributions-in-kazakhstan-2026 | High |
| Social contributions, SO | 5% | 5%, base capped at 7 minimum wages | Employer | % of base | 2025-2026 | KZ | statutory rate | https://vko.kgd.gov.kz/ru/news/socialnye-platezhi-v-respublike-kazahstan-8-160454 | High |
| OSMS, employer | 3% | 3%, base cap raised to 40 minimum wages | Employer | % of gross | 2025-2026 | KZ | statutory rate | https://uppersetup.com/ru/blog/employer-payroll-taxes-and-contributions-in-kazakhstan-2026 | High |
| VOSMS, employee | 2% | 2%, cap 20 minimum wages | Employee | % of gross | 2025-2026 | KZ | statutory rate | https://uppersetup.com/ru/blog/employer-payroll-taxes-and-contributions-in-kazakhstan-2026 | High |
| IPN | 10% | 10% up to 8,500 minimum wages per year, 15% above | Employee | % of taxable base | 2025-2026 | KZ | statutory rate | https://vko.kgd.gov.kz/ru/news/osnovnye-izmeneniya-v-nalogovom-kodekse-rk-s-1-yanvarya-2026-goda-chto-vazhno-znat-o-ipn-i | High |
| Minimum wage | not used here | 85,000 KZT | reference | KZT/month | 2026 | KZ | statutory | https://zan.kz/kk/news/Details?id=629 | High |
| Monthly reference index, MRP | not used here | 4,325 KZT | reference | KZT/month | 2026 | KZ | statutory | https://zan.kz/kk/news/Details?id=629 | High |

Supporting overview: [Kazakhstan new tax code summary](https://zan.kz/kk/news/Details?id=629), 2025-12-31.

### 4.2 Worked example: 1,000,000 KZT gross per month, 2026

Formulas used:

- `OPV = 10% x gross`
- `VOSMS = 2% x gross`
- `IPN = 10% x (gross - OPV - VOSMS)`
- `ST = 6% x (gross - OPV - VOSMS)`
- `OPVR = 3.5% x gross`
- `SO = 5% x min(gross - OPV, 7 x 85,000)`
- `OSMS = 3% x gross`

| Step | Amount, KZT/month | Unit | Period | Geography | Basis | Source | Confidence |
|---|---:|---|---|---|---|---|---|
| Gross salary | 1,000,000 | KZT/month | 2026 | KZ | gross | https://kst.kgd.gov.kz/ru/news/izmeneniya-po-socialnomu-nalogu-v-2026-godu-12-163416 | High |
| OPV, employee | 100,000 | KZT/month | 2026 | KZ | statutory deduction | https://vko.kgd.gov.kz/ru/news/socialnye-platezhi-v-respublike-kazahstan-8-160454 | High |
| VOSMS, employee | 20,000 | KZT/month | 2026 | KZ | statutory deduction | https://uppersetup.com/ru/blog/employer-payroll-taxes-and-contributions-in-kazakhstan-2026 | High |
| IPN, employee | 88,000 | KZT/month | 2026 | KZ | statutory deduction | https://vko.kgd.gov.kz/ru/news/osnovnye-izmeneniya-v-nalogovom-kodekse-rk-s-1-yanvarya-2026-goda-chto-vazhno-znat-o-ipn-i | High |
| Net salary | 792,000 | KZT/month | 2026 | KZ | net | derived from the three deductions above | High |
| Social tax, employer | 52,800 | KZT/month | 2026 | KZ | statutory contribution on 880,000 base | https://kst.kgd.gov.kz/ru/news/izmeneniya-po-socialnomu-nalogu-v-2026-godu-12-163416 | High |
| OPVR, employer | 35,000 | KZT/month | 2026 | KZ | statutory contribution | https://uppersetup.com/ru/blog/employer-payroll-taxes-and-contributions-in-kazakhstan-2026 | High |
| Social contributions, employer | 29,750 | KZT/month | 2026 | KZ | statutory contribution on capped base 595,000 | https://vko.kgd.gov.kz/ru/news/socialnye-platezhi-v-respublike-kazahstan-8-160454 | High |
| OSMS, employer | 30,000 | KZT/month | 2026 | KZ | statutory contribution | https://uppersetup.com/ru/blog/employer-payroll-taxes-and-contributions-in-kazakhstan-2026 | High |
| Employer total | 147,550 | KZT/month | 2026 | KZ | sum of four employer lines | derived | Medium |
| Employer cost | 1,147,550 | KZT/month | 2026 | KZ | gross plus employer total | derived | Medium |
| Gross multiplier | 1.148 | ratio | 2026 | KZ | employer cost / gross | derived | Medium |
| Net multiplier | 1.449 | ratio | 2026 | KZ | employer cost / net | derived | Medium |

The social contribution cap matters. The base is `gross - OPV = 900,000`, but 7 minimum wages is `7 x 85,000 = 595,000`. The 5% contribution is therefore 29,750, not 45,000. Without the cap the employer total would be 162,800 and the gross multiplier would be 1.163. The cap cuts the effective burden by about 1.5 percentage points at a 1,000,000 KZT salary.

### 4.3 Lower salary checks, 2026

| Gross, KZT/month | OPV | VOSMS | IPN | Net | ST | OPVR | SO | OSMS | Employer total | Gross multiplier | Net multiplier | Period | Geography | Basis | Source | Confidence |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|---|---|---|
| 300,000 | 30,000 | 6,000 | 26,400 | 237,600 | 15,840 | 10,500 | 13,500 | 9,000 | 48,840 | 1.163 | 1.468 | 2026 | KZ | gross | derived from statutory rates | Medium |
| 500,000 | 50,000 | 10,000 | 44,000 | 396,000 | 26,400 | 17,500 | 22,500 | 15,000 | 81,400 | 1.163 | 1.468 | 2026 | KZ | gross | derived from statutory rates | Medium |
| 1,000,000 | 100,000 | 20,000 | 88,000 | 792,000 | 52,800 | 35,000 | 29,750 | 30,000 | 147,550 | 1.148 | 1.449 | 2026 | KZ | gross | derived from statutory rates | Medium |

All amounts are KZT/month unless the column says ratio. The 300,000 and 500,000 rows are below the social contribution cap, so their gross multiplier is 1.163. At 1,000,000 the cap reduces it to 1.148.

### 4.4 2025 comparison

In 2025 the social tax was 11% but was reduced by the 5% social contribution, leaving about 6% net. OPVR was 2.5% instead of 3.5%. The combined employer burden was therefore similar to 2026, roughly 1.15-1.16x gross, but the composition was different. **Do not apply the 2026 OPVR rate to a 2025 payroll.** The 2026 rule set also removed the social-tax offset, so the same headline rates produce a different calculation. Source: [KGD Kostanay](https://kst.kgd.gov.kz/ru/news/izmeneniya-po-socialnomu-nalogu-v-2026-godu-12-163416), 2026-02-18; [UPPERSETUP](https://uppersetup.com/ru/blog/employer-payroll-taxes-and-contributions-in-kazakhstan-2026), 2026-08-13.

**Not modeled:** the Kazakhstan IT Park special regime. It exists, but this data set has no verified rate card for it. Treat IT Park participation as a separate legal and tax assessment, not as a default assumption.

---

## 5. In-house cost components

### 5.1 Office

| Item | Value | Unit | Period | Geography | Basis | Source | Confidence |
|---|---:|---|---|---|---|---|---|
| Moscow Class B rent | 22,423 | RUB/m²/year | 2025-Q3 | RU, Moscow | rent, excl. OPEX | https://media.kf.expert/lenta_analytics/0/889/NF%20GROUP%20_Office%20market%20report_Moscow_Q3%20_2025.pdf | High |
| Moscow Class B OPEX | 6,000 | RUB/m²/year | 2025-Q3 | RU, Moscow | operating expenses | https://media.kf.expert/lenta_analytics/0/889/NF%20GROUP%20_Office%20market%20report_Moscow_Q3%20_2025.pdf | High |
| Moscow Class B and B+ rent | 25,000-30,000 | RUB/m²/year | 2025 | RU, Moscow | rent | https://www.arendator.ru/news/189526-stavki_arendy_ofisov_klassa_v_v_moskve_vyrosli_na_19_za_god/ | High |
| Moscow inside the Third Ring | 30,000-34,000 | RUB/m²/year | 2025 | RU, Moscow | rent | https://www.arendator.ru/news/189526-stavki_arendy_ofisov_klassa_v_v_moskve_vyrosli_na_19_za_god/ | High |
| Leased workplace, rent plus OPEX | 36,000-52,000 | RUB/workstation/month | 2025-Q1 | RU, Moscow | all-in workplace | https://static.energy-agency.ru/eevents/230425/1-viktoriya-goryacheva-nikoliers.pdf | High |
| Co-working and flexible office | 56,228 | RUB/workstation/month | 2025-Q3 | RU, Moscow | all-in, VAT where applicable | https://media.kf.expert/lenta_analytics/0/889/NF%20GROUP%20_Office%20market%20report_Moscow_Q3%20_2025.pdf | High |
| Market average base rent, reference | 28,899 | RUB/m²/year | 2025-Q1 | RU | rent | https://www.cmwp.ru/news/po-itogam-1-kv-2025-g-srednevzveshennaya-bazovaya-stavka-arendy-po-rynku-sostavila-28-899-rub-kv-m-g/ | Medium |

**Derived workplace arithmetic (10 m² and 12 m² per person, Class B):**

- Rent plus OPEX = 22,423 + 6,000 = 28,423 RUB/m²/year.
- At 10 m²: 284,230 RUB/year, or 23,686 RUB/month.
- At 12 m²: 341,076 RUB/year, or 28,423 RUB/month.
- At the arendator range of 25,000-30,000 plus 6,000 OPEX: 31,000-36,000 RUB/m²/year, or 25,833-30,000 RUB/month at 10 m².

So a leased Moscow workplace costs about **24,000-30,000 RUB/month** before furniture and meeting-space overhead. A co-working desk costs **56,228 RUB/month**. The Nikoliers all-in range of **36,000-52,000** sits between the two. For a region outside Moscow, this data set has no sourced figure; use the Moscow range as an upper bound and mark the result Proxy.

### 5.2 Hardware

| Item | Value | Unit | Period | Geography | Basis | Source | Confidence |
|---|---:|---|---|---|---|---|---|
| Non-PC workstation setup: monitor, arms, keyboard, chair, desk accessories | 97,539 | RUB per workstation | 2024 | RU | retail component prices | https://habr.com/ru/articles/827656/ | High |
| Laptop or PC plus peripherals | 150,000-300,000 | RUB per developer per 3 years | 2025 | RU | planning proxy | 97,539 peripherals plus 80,000-200,000 laptop/PC gives a component total of 177,539-297,539 | Proxy |
| Home-office build-out | 16,000-300,000 | RUB per home office | 2025 | RU | retail, scope-dependent | https://aif.ru/realty/price/ofis-na-domu-skolko-stoit-obustroit-rabochee-mesto-dlya-udalen | High |
| Amortized hardware cost, 3 years | 4,932-8,265 | RUB/month per developer | 2025 | RU | 177,539-297,539 divided by 36 | derived from the component total | Medium |

The 150,000-300,000 RUB per three years figure is a **planning proxy**, not a survey. A component build gives 97,539 RUB for peripherals plus a laptop or PC at 80,000-200,000 RUB, or 177,539-297,539 RUB in total. The monthly amortization of that component build is 4,932-8,265 RUB. If you need a defensible number, replace both with your procurement history.

### 5.3 Licenses

| Item | Value | Unit | Period | Geography | Basis | Source | Confidence |
|---|---:|---|---|---|---|---|---|
| Software licenses per developer | 50,000-150,000 | RUB/year | 2025 | RU | vendor list prices, no public benchmark | no single source found in this data set | Proxy |
| Software licenses as share of payroll | 5-10 | % of gross payroll | 2025 | RU | enterprise software budget rule | no single source found in this data set | Proxy |

No reliable public per-seat benchmark was found. The 50,000-150,000 RUB/year range is roughly 2-6% of a 2,400,000 RUB annual gross salary. The 5-10% payroll share is an enterprise-wide rule that includes servers, databases, CI, security, and office software. Use the per-developer range for a single seat and the payroll share for a full department. Replace both with vendor quotes before pricing.

### 5.4 Full cost multiplier derivation

The "1.3-1.6x" rule is often quoted without saying what is included. The arithmetic below separates payroll, workplace, hardware, and licenses.

**Payroll only, gross basis, 2026:**

| Gross salary, RUB/month | Employer payroll cost, RUB/month | Gross multiplier | Period | Geography | Basis | Source | Confidence |
|---:|---:|---:|---|---|---|---|---|
| 200,000 | 260,000 | 1.300 | 2026 | RU | gross plus contributions | https://www.nalog.gov.ru/rn32/news/seminar/16610341/ | High |
| 300,000 | 382,289 | 1.274 | 2026 | RU | gross plus contributions | https://www.nalog.gov.ru/rn32/news/seminar/16610341/ | Medium |
| 500,000 | 612,489 | 1.225 | 2026 | RU | gross plus contributions | https://www.nalog.gov.ru/rn32/news/seminar/16610341/ | Medium |

**Full cost, gross basis, 2026, leased Moscow workplace at 10 m², mid-range hardware, 100,000 RUB/year licenses.** The hardware line uses 6,250 RUB/month, a rounded planning value inside the 4,932-8,265 range. Input URLs for both derived full-cost tables: contributions https://www.nalog.gov.ru/rn32/news/seminar/16610341/; office https://media.kf.expert/lenta_analytics/0/889/NF%20GROUP%20_Office%20market%20report_Moscow_Q3%20_2025.pdf; hardware https://habr.com/ru/articles/827656/; licenses are a proxy with no single source.

| Gross salary, RUB/month | Payroll, RUB/month | Office, RUB/month | Hardware, RUB/month | Licenses, RUB/month | Full cost, RUB/month | Gross multiplier | Period | Geography | Basis | Source | Confidence |
|---:|---:|---:|---:|---:|---:|---:|---|---|---|---|---|
| 200,000 | 260,000 | 23,686 | 6,250 | 8,333 | 298,269 | 1.491 | 2026 | RU, Moscow | gross plus workplace | derived from sections 3, 5.1, 5.2, 5.3 | Medium |
| 300,000 | 382,289 | 23,686 | 6,250 | 8,333 | 420,558 | 1.402 | 2026 | RU, Moscow | gross plus workplace | derived from sections 3, 5.1, 5.2, 5.3 | Medium |
| 500,000 | 612,489 | 23,686 | 6,250 | 8,333 | 650,758 | 1.302 | 2026 | RU, Moscow | gross plus workplace | derived from sections 3, 5.1, 5.2, 5.3 | Medium |

**Full cost, net basis, 2026, same assumptions:**

| Net salary, RUB/month | Gross, RUB/month | Employer payroll, RUB/month | Full cost, RUB/month | Net multiplier | Period | Geography | Basis | Source | Confidence |
|---:|---:|---:|---:|---:|---|---|---|---|---|
| 200,000 | 230,588 | 299,765 | 338,034 | 1.690 | 2026 | RU, Moscow | net plus workplace | derived from sections 3 and 5 | Medium |
| 300,000 | 348,235 | 437,808 | 476,077 | 1.587 | 2026 | RU, Moscow | net plus workplace | derived from sections 3 and 5 | Medium |
| 500,000 | 589,634 | 715,658 | 753,927 | 1.508 | 2026 | RU, Moscow | net plus workplace | derived from sections 3 and 5 | Medium |

With a co-working desk at 56,228 RUB/month instead of a leased 10 m² office, add 32,542 RUB/month to each full-cost line. The 200,000 net case becomes 370,576 RUB/month, or 1.853x net.

**Conclusion.** The 1.30-1.60x gross rule is directionally right if you use a leased office and a mid-range salary. The 1.45-1.65x net rule understates the full cost of a net-quoted Moscow salary once a real workplace is included. For a defensible model, use **1.30-1.65x gross** and **1.50-1.85x net**, and state whether the office is leased or co-working.

---

## 6. Outsourcing rate cards

### 6.1 Russia onshore

All rates are RUB/hour excluding VAT unless the unit says otherwise.

| Segment | Value | Unit | Period | Geography | Basis | Source | Confidence |
|---|---:|---|---|---|---|---|---|
| In-house equivalent, junior | 1,300-2,700 | RUB/hour | 2025 | RU | internal cost rate | https://www.klerk.ru/materials/2025-10-06/skolko-stoit-chas-raboty-programmista/ | High |
| In-house equivalent, middle | 3,100-5,600 | RUB/hour | 2025 | RU | internal cost rate | https://www.klerk.ru/materials/2025-10-06/skolko-stoit-chas-raboty-programmista/ | High |
| In-house equivalent, senior | 5,700 and above | RUB/hour | 2025 | RU | internal cost rate | https://www.klerk.ru/materials/2025-10-06/skolko-stoit-chas-raboty-programmista/ | High |
| Outsourcing, junior | 1,500-3,200 | RUB/hour | 2025 | RU | rate, excl. VAT | https://www.klerk.ru/materials/2025-10-06/skolko-stoit-chas-raboty-programmista/ | High |
| Outsourcing, middle | 3,700-6,600 | RUB/hour | 2025 | RU | rate, excl. VAT | https://www.klerk.ru/materials/2025-10-06/skolko-stoit-chas-raboty-programmista/ | High |
| Outsourcing, senior | 6,700 and above | RUB/hour | 2025 | RU | rate, excl. VAT | https://www.klerk.ru/materials/2025-10-06/skolko-stoit-chas-raboty-programmista/ | High |
| DINS survey, middle | 2,200-2,800 | RUB/hour | 2025 | RU | rate, excl. VAT | https://codingteam.ru/blog/autsorsing-razrabotchikov-v-2025-kogda-vigodnee-na | High |
| DINS survey, senior | 3,000-4,200 | RUB/hour | 2025 | RU | rate, excl. VAT | https://codingteam.ru/blog/autsorsing-razrabotchikov-v-2025-kogda-vigodnee-na | High |
| DINS survey, team lead | 4,500 and above | RUB/hour | 2025 | RU | rate, excl. VAT | https://codingteam.ru/blog/autsorsing-razrabotchikov-v-2025-kogda-vigodnee-na | High |
| SkillStaff average IT outstaff rate | 2,400 | RUB/hour | 2025-Q3 | RU | rate, excl. VAT | https://prosharing.ru/spros-na-autstaffing-vyros-pochti-v-poltora-raza-v-tretem-kvartale-2025-goda/ | High |
| CNews average billed day, developer | 24,900 | RUB/day | 2025 | RU | rate, excl. VAT | https://www.cnews.ru/reviews/zakaznaya_razrabotka_po_2025/articles/v_zakaznoj_razrabotke_stali_platit | High |
| CNews average billed day, PM | 27,200 | RUB/day | 2025 | RU | rate, excl. VAT | https://www.cnews.ru/reviews/zakaznaya_razrabotka_po_2025/articles/v_zakaznoj_razrabotke_stali_platit | High |
| 1C developer | 1,500-4,500 | RUB/hour | 2026 | RU | rate, excl. VAT | https://esres.ru/price | High |
| 1C developer | 1,500-4,500 | RUB/hour | 2026 | RU | rate, excl. VAT | https://itviar.ru/stati/services-stati/autstaffing/stoimost-autstaffinga-1s-v-2026-godu/ | High |
| 1C developer | 1,500-4,500 | RUB/hour | 2026 | RU | rate, excl. VAT | https://fortech.dev/services/backend/1c/ | High |

**Interpretation.** A 1,500-4,000 RUB/hour assumption is at the low end of the 2026 range. It fits 1C work and junior-to-middle custom development. Senior custom development is 3,000-6,700 RUB/hour, and the Klerk outsourcing band reaches 6,700+. For a defensible 2026 estimate use **2,000-6,500 RUB/hour** for custom development and **1,500-4,500 RUB/hour** for 1C. The CNews average day rate of 24,900 RUB/day is about 3,113 RUB/hour at 8 hours, which sits inside the custom-development band.

**T1 and Luxoft.** Luxoft exited the Russian market after 2022. T1 is private and does not publish a rate card. No defensible public rate exists for these integrators in this data set. Use the market bands above and request a quote.

### 6.2 Nearshore and offshore

All rates are USD/hour excluding VAT unless the unit says otherwise.

| Region | Junior | Senior | Unit | Period | Geography | Basis | Source | Confidence |
|---|---:|---:|---|---|---|---|---|---|
| Kazakhstan | 15-20 | 35-50 | USD/hour | 2025 | KZ | rate, excl. VAT | https://osn.kz/blog/it-outsourcing-kazakhstan-2025 | High |
| Kazakhstan, team lead | not published | 45-60 | USD/hour | 2025 | KZ | rate, excl. VAT | https://osn.kz/blog/it-outsourcing-kazakhstan-2025 | High |
| Kazakhstan, Uzbekistan, Azerbaijan average | not published | 25-49 | USD/hour | 2026 | Central Asia | rate, excl. VAT | https://sigma.software/insights/software-outsourcing-to-central-asia-uzbekistan-kazakhstan-azerbaijan | High |
| Kazakhstan, Wadline median | not published | 37 | USD/hour | 2026 | KZ | rate, excl. VAT | https://ru.wadline.com/rates | High |
| Kazakhstan, Wadline range | not published | 28-61 | USD/hour | 2026 | KZ | rate, excl. VAT | https://ru.wadline.com/rates | High |
| Armenia | not published | 25-49 | USD/hour | 2025-2026 | AM | rate, excl. VAT | https://codeorigins.am/services/outsourcing-to-armenia | High |
| Armenia, Georgia, Azerbaijan salary guide | 500-2,300 | 3,000-7,000 | USD/month, gross | 2025 | Caucasus | gross salary | https://hiring-elixir.com/wp-content/themes/hiring-elixir/assets/Salary%20guide%202025.pdf | High |
| India and South Asia | 24-31 | 31-41 | USD/hour | 2025 | India | rate, excl. VAT | https://www.accelerance.com/blog/2026-outsourcing-rate-trends-asia-europe-latam | High |
| India, Clutch band | not published | 25-49 | USD/hour | 2026 | India | rate, excl. VAT | https://turtlebyte.in/blog/software-development-rates-by-country | Medium |
| Poland and Central Europe | 31-39 | 64-76 | USD/hour | 2025 | Poland, CEE | rate, excl. VAT | https://www.accelerance.com/blog/2026-outsourcing-rate-trends-asia-europe-latam | High |
| Poland, Wadline median | not published | 75 | USD/hour | 2026 | Poland | rate, excl. VAT | https://ru.wadline.com/rates | High |
| Poland, Wadline range | not published | 61-76 | USD/hour | 2026 | Poland | rate, excl. VAT | https://ru.wadline.com/rates | High |
| Latin America | 33-45 | 60-75 | USD/hour | 2025 | LatAm | rate, excl. VAT | https://www.accelerance.com/blog/2026-outsourcing-rate-trends-asia-europe-latam | High |
| United States, onshore mid-senior contractor | not published | 80-150 and above | USD/hour | 2026 | US | rate, excl. VAT | https://aiservicescompanies.com/research/offshore-ai-development-rates-2026/ | Medium |

Additional rate reference: [Beon developer hourly rates](https://beon.tech/blog/software-developer-hourly-rates/), 2026-09-25. It is a vendor overview, not a primary survey, so it is not used as a row.

### 6.3 Dedicated-team pricing

| Region | Team size | Value | Unit | Period | Geography | Basis | Source | Confidence |
|---|---:|---:|---|---|---|---|---|---|
| Kazakhstan | 5 people | 20,000-30,000 | USD/month | 2025 | KZ | dedicated team, all-in | https://osn.kz/blog/it-outsourcing-kazakhstan-2025 | High |
| Kazakhstan | 10 people | 40,000-60,000 | USD/month | 2025 | KZ | dedicated team, all-in | https://osn.kz/blog/it-outsourcing-kazakhstan-2025 | High |
| Kazakhstan | 25+ people | 100,000 and above | USD/month | 2025 | KZ | dedicated team, all-in | https://osn.kz/blog/it-outsourcing-kazakhstan-2025 | High |
| Kazakhstan setup | not applicable | 10,000-50,000 | USD one-time | 2025 | KZ | setup fee | https://osn.kz/blog/it-outsourcing-kazakhstan-2025 | High |
| Russia | 1 FTE, middle | 300,000-500,000 | RUB/month | 2026 | RU | dedicated team, all-in | derived from Klerk 3x rule and section 1 salaries | Medium |

**Russia dedicated-team check.** A middle developer at 250,000 RUB net costs about 375,000 RUB/month at the Klerk "3x salary" rule. The market dedicated-team FTE is 300,000-500,000 RUB/month depending on grade and overhead. That is consistent with a 1.5-2.0x gross payroll plus margin. Source for the 3x rule: [Klerk](https://www.klerk.ru/materials/2025-10-06/skolko-stoit-chas-raboty-programmista/), 2025-10-06.

---

## 7. Productivity benchmarks

### 7.1 The hours-per-FP correction

The frequently repeated claim "ISBSG average is 7-8 function points per person-month" is a misreading. The ISBSG headline is **7-8 hours per function point** (PDR), not 7-8 FP per month. Once you divide a 160-hour month by 6.5-7.0 hours per FP, you get 23-25 FP per person-month, not 7-8.

| Metric | Value | Unit | Period | Geography | Basis | Source | Confidence |
|---|---:|---|---|---|---|---|---|
| ISBSG PDR, recent projects, median | 6.5 | hours/FP | 2021 | multi-country | effort PDR | https://www.isbsg.org/wp-content/uploads/2022/05/Short-Paper-2021-10-Use-of-Output-Based-KPIs-in-AD-Contracts.pdf | High |
| ISBSG PDR, recent projects, average | 7.0 | hours/FP | 2021 | multi-country | effort PDR | https://www.isbsg.org/wp-content/uploads/2022/05/Short-Paper-2021-10-Use-of-Output-Based-KPIs-in-AD-Contracts.pdf | High |
| ISBSG government projects, median | 9.7 | hours/FP | 2021 | multi-country | effort PDR | https://totalmetrics.com/function-points/Software-Productivity-Government-ISBSG.pdf | High |
| ISBSG government projects, mean | 13.7 | hours/FP | 2021 | multi-country | effort PDR | https://totalmetrics.com/function-points/Software-Productivity-Government-ISBSG.pdf | High |
| Java industry average | 8-9 | hours/FP | 2021 | multi-country | effort PDR | https://www.isbsg.org/resources-productivity/ | High |
| COBOL industry average | more than 15 | hours/FP | 2021 | multi-country | effort PDR | https://www.isbsg.org/resources-productivity/ | High |
| ISBSG MDR, most projects | 20-40 | FP/person/month | 2024 | multi-country | delivery rate, elapsed person-months | https://www.isbsg.org/wp-content/uploads/2025/01/2024-12-Manpower-Delivery-Rate.pdf | High |
| ISBSG MDR, top 10% | up to 160 | FP/person/month | 2024 | multi-country | delivery rate, elapsed person-months | https://www.isbsg.org/wp-content/uploads/2025/01/2024-12-Manpower-Delivery-Rate.pdf | High |

**Derived FP per person-month at 160 hours/month:**

- 6.5 hours/FP: 160 / 6.5 = **24.6 FP/person-month**
- 7.0 hours/FP: 160 / 7.0 = **22.9 FP/person-month**
- 9.7 hours/FP: 160 / 9.7 = **16.5 FP/person-month**

The defensible planning range is **16-25 FP/person-month** for typical business and enterprise software. ISBSG's MDR range of 20-40 is higher because it uses elapsed person-months, not 160-hour effort months. For a conservative bid use **15-20 FP/person-month**. For a mature Java or web team use **20-30 FP/person-month**. Do not use 7-8 FP/person-month.

### 7.2 FP per person-month and LOC per person-month by language

| Language | LOC/FP | Productivity, FP/person-month | Derived LOC/person-month | Unit | Period | Geography | Basis | Source | Confidence |
|---|---:|---:|---:|---|---|---|---|---|---|
| C | 128 | 5-10 | 640-1,280 | LOC/person-month | 2018 | multi-country | Capers Jones table | https://doi.org/10.5277/e-inf180102 | High |
| COBOL | 107 | 5-10 | 535-1,070 | LOC/person-month | 2018 | multi-country | Capers Jones table | https://doi.org/10.5277/e-inf180102 | High |
| C++ | 53 | 10-20 | 530-1,060 | LOC/person-month | 2018 | multi-country | Capers Jones table | https://doi.org/10.5277/e-inf180102 | High |
| Java | 53 | 10-20 | 530-1,060 | LOC/person-month | 2018 | multi-country | Capers Jones table | https://doi.org/10.5277/e-inf180102 | High |
| Visual Basic | 40 | 10-20 | 400-800 | LOC/person-month | 2018 | multi-country | Capers Jones table | https://doi.org/10.5277/e-inf180102 | High |
| SQL | 13 | 30-50 | 390-650 | LOC/person-month | 2018 | multi-country | Capers Jones table | https://doi.org/10.5277/e-inf180102 | High |
| ABAP | 16 | 15-30 | 240-480 | LOC/person-month | 2018 | multi-country | Capers Jones table | https://doi.org/10.5277/e-inf180102 | High |
| Access | 38 | 16-23 | 608-874 | LOC/person-month | 2018 | multi-country | Capers Jones table | https://doi.org/10.5277/e-inf180102 | High |

The LOC/FP values are from Capers Jones as reproduced in Lavazza, Morasca, and Tosi (2018), Table 7. The LOC/person-month column is derived: LOC/FP multiplied by FP/person-month. It is not a direct source. A second copy of the LOC/FP table is at [Ball State University](https://www.cs.bsu.edu/homepages/dmz/cs697/langtbl.htm).

### 7.3 Productive hours and velocity

| Metric | Value | Unit | Period | Geography | Basis | Source | Confidence |
|---|---:|---|---|---|---|---|---|
| Sellable or billable hours | 120 | hours/month | 2025 | RU | billable capacity | https://www.klerk.ru/materials/2025-10-06/skolko-stoit-chas-raboty-programmista/ | High |
| Productive hours | 1,320 | hours/year | 2025 | RU | productive capacity | https://www.klerk.ru/materials/2025-10-06/skolko-stoit-chas-raboty-programmista/ | High |
| Common planning range | 1,200-1,400 | hours/year | 2025 | multi-country | planning convention | derived from the 1,320 anchor | Medium |
| Story points to hours | no universal conversion | not applicable | 2026 | multi-country | not a benchmark | no defensible public source | Proxy |
| Velocity, cross-company | no defensible benchmark | not applicable | 2026 | multi-country | not a benchmark | no defensible public source | Proxy |
| Government delivery-speed proxy | 38-41 | FP/month | 2021 | multi-country | ISBSG government median | https://totalmetrics.com/function-points/Software-Productivity-Government-ISBSG.pdf | Medium |

Story points are team-relative. Do not put a global hours-per-story-point number in a benchmark. If you must calibrate locally, treat 1 story point as 4-16 hours only inside one team's history, and label it as a local calibration, never as an industry fact. The same applies to velocity: use your own sprint history, not a cross-company average. ISBSG's 38-41 FP/month government delivery-speed figure is the closest objective proxy, but it is a delivery rate, not a team velocity.

---

## 8. Open data sources for market analogues

### 8.1 Russia: zakupki.gov.ru

| Item | Detail | Unit | Period | Geography | Basis | Source | Confidence |
|---|---|---|---|---|---|---|---|
| Access channels | UI export from the contract registry; open-data XML and ZIP; SOI integration service | channel | 2026 | RU | open data | https://tendergos.ru/vygruzka-reestra-kontraktov-iz-eis/ | High |
| SOI endpoint, 44-FZ | `https://int44.zakupki.gov.ru/eis-integration/services/getDocsMis2` | URL | 2026 | RU | API | https://tendergos.ru/vygruzka-reestra-kontraktov-iz-eis/ | High |
| SOI endpoint, 223-FZ | `https://int223.zakupki.gov.ru/eis-integration/services/getDocsMis2` | URL | 2026 | RU | API | https://tendergos.ru/vygruzka-reestra-kontraktov-iz-eis/ | High |
| FTP status | FTP closed as a working channel from 2024; use SOI | status | 2024-2026 | RU | access note | https://infoculture.github.io/finguide/data-sources/federal/zakupki-xml | High |
| Contract registry fields | registry number, contract number, IKZ, customer and supplier with INN, subject, price, currency, price type, conclusion, publication and update dates, execution status, document links, purchase and plan linkage | field list | 2026 | RU | open data | https://gosplan.info/docs/guides/contracts/ | High |
| IT subject codes | OKPD2 62.01 programming, 62.02 consulting, 62.03 facilities management, 62.09 other IT | code list | 2026 | RU | classifier | https://www.tenderguru.ru/api/documentation/contracts | High |
| Data volume example, 44-FZ | 176.4M records, about 473 GB structured, about 7.5 TB primary documents | records and bytes | 2026 | RU | open data | https://data.apicrafter.ru/packages/govspending44fz | Medium |
| Registry extraction guide | step-by-step extraction and field notes | guide | 2024-2026 | RU | open data | https://habr.com/ru/articles/869934/ | Medium |

**How to build an analogue database.** Pull the contract registry by OKPD2 62.* and a date range. Extract price, customer INN, supplier INN, subject text, and duration. Normalize to function points or person-months using section 7. Deduplicate by registry number. Join to EGRUL by INN. The public registry gives **contract price**, not effort. To turn price into an effort analogue you must divide by a rate and normalize for scope. Price alone is a weak effort analogue.

### 8.2 Kazakhstan: goszakup.gov.kz

| Item | Detail | Unit | Period | Geography | Basis | Source | Confidence |
|---|---|---|---|---|---|---|---|
| API | `ows.goszakup.gov.kz`, REST and GraphQL v3; token from the Ministry of Finance | API | 2026 | KZ | open data | https://ows.goszakup.gov.kz/help/ | High |
| Entities | participants, announcements, contracts, acts, lots, annual plans, unscrupulous suppliers, news, supplier bids | entity list | 2026 | KZ | open data | https://ows.goszakup.gov.kz/help/v3/schema/query.doc.html | High |
| Contract fields | `contractSum`, `contractSumWnds`, `signDate`, `ecEndDate`, `planExecDate`, `faktExecDate`, `customerBin`, `supplierBiin`, `descriptionRu`, `refSubjectTypeId`, `ContractUnits`, `ContractPayment`, `ContractSpecSum` | field list | 2026 | KZ | open data | https://ows.goszakup.gov.kz/help/v3/schema/contract.doc.html | High |
| Pagination | `limit` 0-200, `after` last ID | parameter | 2026 | KZ | API | https://ows.goszakup.gov.kz/help/v3/schema/query.doc.html | High |
| IT filtering | `descriptionRu` keywords and subject type; no OKPD2 equivalent in the schema | method | 2026 | KZ | practical note | https://ows.goszakup.gov.kz/help/v3/schema/query.doc.html | High |

### 8.3 ISBSG: what is free and what is paid

| Item | Detail | Unit | Period | Geography | Basis | Source | Confidence |
|---|---|---|---|---|---|---|---|
| Development and Enhancement repository | 13,718 projects | projects | 2025 | multi-country | repository size | https://www.isbsg.org/subscriptions/ | High |
| Maintenance and Support repository | 2,417 applications | applications | 2025 | multi-country | repository size | https://www.isbsg.org/subscriptions/ | High |
| Fields | 118 data fields per project: size, effort, duration, cost, quality, phase effort, architecture, technique, platform | fields | 2025 | multi-country | data dictionary | https://www.isbsg.org/wp-content/uploads/2025/05/Short-Paper-2025-05-ISBSG-Overview.pdf | High |
| Free sample | free sample of the Development and Enhancement data | sample | 2025 | multi-country | free | https://www.isbsg.org/development-and-enhancement-data/ | High |
| Single-user subscription | 3,000 | AUD/year | 2025 | multi-country | list price | https://www.isbsg.org/product/project-data-subscription/ | High |
| Corporate subscription, 1-9 users | 7,500 | AUD/year | 2025 | multi-country | list price | https://www.isbsg.org/subscriptions/ | High |
| Corporate subscription, 10+ users | 10,000 | AUD/year | 2025 | multi-country | list price | https://www.isbsg.org/subscriptions/ | High |
| PDQ tool | 15 per month or 150 per year | AUD | 2025 | multi-country | list price | https://www.isbsg.org/subscriptions/ | High |
| License term | 12 months, single user, no redistribution, data destroyed at expiry | license term | 2025 | multi-country | license | https://www.isbsg.org/wp-content/uploads/2021/08/b.-LICENSE-AGREEMENT-Development-Enhancement-data-Repository-2021R1.pdf | High |

**Product implication.** ISBSG data can calibrate a model internally. It cannot be redistributed inside a commercial estimation product without a separate distribution license. For a shipped product, use ISBSG-derived aggregate coefficients, cite ISBSG as the source, or negotiate a distribution license.

### 8.4 Public effort-estimation data sets

| Data set | Projects | Target | Schema highlights | Unit | Period | Geography | Basis | Link | Confidence |
|---|---:|---|---|---|---|---|---|---|---|
| Desharnais | 81, 77 complete | effort in person-hours | Project, TeamExp, ManagerExp, YearEnd, Length, Effort, Transactions, Entities, PointsAdjust, Envergure, PointsNonAjust, Language | projects | research release, year not stated in source | not stated in source | public research data | http://promise.site.uottawa.ca/SERepository/datasets/desharnais.arff | High |
| China | 499 | effort in person-hours | AFP, Input, Output, Enquiry, File, Interface, Added, Changed, Deleted, PDR_AFP, PDR_UFP, Resource, Dev.Type, Duration, N_effort, Effort | projects | research release | China | public research data | https://zenodo.org/records/268446 | High |
| Maxwell | 62 | effort in person-hours | Syear, App, Har, Dba, Ifc, Source, Telonuse, Nlan, T01-T15, Duration, Size, Time, Effort | projects | research release | multi-country | public research data | https://zenodo.org/records/268461 | High |
| Albrecht | 24 | effort in thousands of person-hours | function-point components plus effort | projects | research release | multi-country | public research data | http://promise.site.uottawa.ca/SERepository/datasets-page.html | High |
| COCOMO81 | 63 | effort in person-months | 17 attributes, classic COCOMO drivers | projects | 1981 | multi-country | public research data | https://zenodo.org/records/268424 | High |
| NASA93 | 93 | effort in person-months | COCOMO drivers | projects | 1993 | US, NASA | public research data | https://zenodo.org/records/268419 | High |
| Kitchenham | 145 | effort | dates available for temporal split | projects | research release | multi-country | public research data | https://zenodo.org/records/268457 | High |
| SEERA | about 120 | effort plus 70 cost drivers | economic attributes | projects | research release | multi-country | public research data | https://zenodo.org/records/4312777 | High |
| JOSSE | JIRA tasks | real effort | about 19% carry an expert estimate | tasks | research release | multi-country | public research data | https://zenodo.org/records/7022735 | High |
| TAWOS | about 458,000 issues | effort | JIRA, 39+ projects | issues | research release | multi-country | public research data | https://doi.org/10.5522/04/21308124 | High |

Aggregated catalog with row counts: [Derek-Jones/Software-estimation-datasets](https://github.com/Derek-Jones/Software-estimation-datasets). Compact registry with licenses: [metis-benchmark registry](https://github.com/NaCode-Studios/metis-benchmark/blob/main/src/metis_benchmark/datasets/registry.py). China mirror: [GitHub ARFF](https://github.com/aferamb/models_effort_estimation/blob/a4e14af1/data/raw/china.arff). These data sets are small enough to ship as calibration fixtures: Desharnais about 15 KB, Maxwell about 4.8 KB, China about 100 KB, COCOMO81 about 20 KB.

### 8.5 Git-hosted proxies

| Source | What it gives | Size and access | Unit | Period | Geography | Basis | Source | Confidence |
|---|---|---|---|---|---|---|---|---|
| GH Archive | every public GitHub event since 2011, hourly JSON gzip; push, pull request, issue, star, fork events | 2020 to August 2025 about 3.5 TB raw; BigQuery public data set `githubarchive` updated hourly; 1 TB/month free query | events | 2011-2025 | global | open data | https://www.gharchive.org/ | High |
| GH Archive schema | `type`, `public`, `payload`, `repo`, `actor`, `org`, `created_at`, `id`, `other` | BigQuery schema | field list | 2025 | global | open data | https://deepwiki.com/igrigorik/gharchive.org/3.3-bigquery-schema | High |
| libraries.io | package and repository metadata, dependencies, language, status | BigQuery public data set `libraries_io` | metadata | 2025 | global | open data | https://codelabs.developers.google.com/codelabs/bigquery-github | High |
| OpenHub, Black Duck Open Hub | project size and contributor statistics | bulk API and data access are limited and have changed over time; verify current terms | metadata | 2026 | global | uncertain | no stable public URL in this data set | Proxy |

**How to use Git data.** Commits and pull requests are activity, not effort. Use them to estimate relative size, such as lines added, files touched, and contributors multiplied by months, then calibrate against a known-effort subset. Do not treat commits as person-hours without a calibration factor.

### 8.6 Analogue normalization rules

1. **Price is not effort.** A contract price must be divided by a sourced rate or normalized to function points before it becomes an effort analogue.
2. **Scope vector.** For every analogue, record users, integrations, sites, data volume, duration, and whether the price includes hardware, licenses, and support.
3. **Deduplicate.** Contract registries repeat rows across revisions. Use the registry number or contract ID as the primary key.
4. **Date bucket.** Inflation and exchange-rate moves make a 2019 contract a different unit than a 2025 contract. Bucket by year and state the period.
5. **Geography.** Moscow, region, KZ, and offshore are different cost bases. Do not pool them without a location factor.

---

## 9. Project price anchors by project type

These are published case prices, not market averages. They are useful as order-of-magnitude anchors. Scope varies widely, so normalize before comparing.

### 9.1 ERP, 1C, and SAP migration

| Project type | Value | Unit | Period | Geography | Basis | Source | Confidence |
|---|---:|---|---|---|---|---|---|
| 1C ERP, small business, up to 10 users | 1,000,000-3,000,000 | RUB | 2025 | RU | contract price | https://balns.ru/info/articles/skolko-stoit-vnedrenie-1s-erp-v-2025-godu-podrobnyy-obzor-rynka-faktorov-i-resheniy/ | Medium |
| 1C ERP, medium, 10-50 users | 3,000,000-15,000,000 | RUB | 2025 | RU | contract price | https://balns.ru/info/articles/skolko-stoit-vnedrenie-1s-erp-v-2025-godu-podrobnyy-obzor-rynka-faktorov-i-resheniy/ | Medium |
| 1C ERP, large, 50+ users | 15,000,000-300,000,000 | RUB | 2025 | RU | contract price | https://balns.ru/info/articles/skolko-stoit-vnedrenie-1s-erp-v-2025-godu-podrobnyy-obzor-rynka-faktorov-i-resheniy/ | Medium |
| Complex 1C ERP at a 3,500-employee plant | more than 100,000,000 direct cost; about 109,000,000 including VAT; about 26,000 person-hours; 2+ years | RUB and person-hours | 2025 | RU | contract price | https://fto.com.ru/blog/stoimost-proekta-po-perehodu-na-1s-erp-primer-realnogo-kejsa/ | High |
| SAP to 1C ERP, small and mid | from 9,500,000; 2.5 months; 300 users | RUB | 2025 | RU | contract price | https://www.nep-group.ru/cases/importozameshchenie-realizovali-perehod-iz-sap-v-1s-erp | High |
| SAP to 1C, typical large enterprise | 100,000,000-150,000,000 for 1C; 200,000,000-300,000,000 for SAP, pre-2022 estimate | RUB | 2024 | RU | contract price | https://sapland.ru/p-events/news/1s-vmesto-sap-boli-slozhnosti-preimuschestva-mneniya.html | Medium |
| Aeroflot SAP to 1C ERP | about 1,000,000,000 | RUB | 2025 | RU | contract price | https://30-erp.cnews.ru/content/20s-nowadays | Medium |
| 1C ERP base license | 662,800 from 2025-07-01; previously 581,400 | RUB | 2025 | RU | list price | https://i-erp.ru/skolko-stoit-vnedrenie-1-na-proizvodstve | High |

### 9.2 MES

| Project | Value | Unit | Period | Geography | Basis | Source | Confidence |
|---|---:|---|---|---|---|---|---|
| MES at PhosAgro and Apatit, ZIIoT | 318,400,000 grant co-financing, 20/80 | RUB | 2025 | RU | grant amount, total not asserted | https://www.comnews.ru/content/238390/2025-03-21/2025-w12/1008/fosagro-importozamestila-predpriyatie-apatit-srok | High |
| Digital Production Ural, Prof-IT MES and QMS | more than 217,000,000 grant, about 50% of total project cost | RUB | 2025 | RU | grant amount | https://www.cnews.ru/news/line/2025-05-29_prof-it_group_podderzhit_proekt | High |
| Kazan dairy MES and SCADA | 108,800,000 grant; total digitalization investment more than 226,300,000 | RUB | 2025 | RU | grant and total investment | https://www.komos.ru/press-center/news/32400/ | High |
| Severstal MES Metallurgy and IPS planning | more than 1,000,000,000 total grant for two systems: MES 475,000,000; planning 600,000,000 | RUB | 2025 | RU | total project amount | https://www.comnews.ru/content/241454/2025-09-26/2025-w39/1008/severstal-nachnet-oktyabr-cherepovce-zapuska-otechestvennoy-mes-sistemy | High |
| GAZ Dispatcher MES and MDC | 513,000,000 total, of which 379,700,000 RF grant | RUB | 2025 | RU | total project amount | https://www.zyfra.com/ru/news/media/gaz-zyfra-2/ | High |
| MES and APS at a power-engineering plant | 62,000,000 project budget, payback in year 2 | RUB | 2024 | RU | project budget | https://tapmes.ru/cases.html | Medium |

The 318,400,000 PhosAgro figure is a grant co-financing amount at a 20/80 ratio. The total project cost is not asserted here because the source's ratio wording is ambiguous. Do not multiply by five without checking the primary document.

### 9.3 Computer vision and quality control

| Project | Value | Unit | Period | Geography | Basis | Source | Confidence |
|---|---:|---|---|---|---|---|---|
| CV quality control, typical | 600,000-5,000,000; typical 1,800,000; support 80,000-250,000 per month; 8-16 weeks | RUB | 2025-2026 | RU | contract price | https://process-buro.com/solutions/production/kontrol-kachestva-kompyuternym-zreniem | High |
| CV entry threshold | from 1,000,000; complex 2,500,000-5,000,000 | RUB | 2025 | RU | expert estimate | https://www.dp.ru/a/2025/11/12/roboti-vsjo-vidjat | Medium |
| Dobroflot canned-food line | about 230,000 per control point; about 900,000 for 4 points | RUB | 2025 | RU | contract price | https://www.retail.ru/cases/dobroflot-vnedril-mashinnoe-zrenie-na-konservnoy-linii-i-sekonomil-dva-milliona-rubley/ | High |
| DGTU Detect Defect R&D | 7,000,000 total; 1,700,000 first stage; system 400,000-1,000,000 | RUB | 2025 | RU | R&D budget | https://news.donstu.ru/news/v-dgtu-razrabatyvayut-sistemu-kompyuternogo-zreniya-dlya-vyyavleniya-defektov-detaley-pri-proizvodst | High |
| Tekhnonikol, Serpukhov | about 38,000,000 for CV projects in 2025; 16,000,000 for one quality CV system | RUB | 2025 | RU | investment amount | https://www.tn.ru/about/press/news/tekhnonikol-investiruet-v-tsifrovye-proekty-dlya-remonta-podmoskovnogo-zavoda/ | High |

### 9.4 DWH and BI

| Project | Value | Unit | Period | Geography | Basis | Source | Confidence |
|---|---:|---|---|---|---|---|---|
| SMB BI and ETL | 1,500,000-2,000,000 typical | RUB | 2026 | RU | contract price | https://habr.com/ru/companies/w_code/articles/1022844/ | Medium |
| DWH implementation, minimum | from 1,500,000 | RUB | 2025 | RU | contract price | https://www.qlever.ru/press/zachem-biznesu-nuzhno-dwh-i-kak-obosnovat-neobhodimost-proekta | Medium |
| DWH, minimum project | from 15,000,000 | RUB | 2025-2026 | RU | contract price | https://arkona-softlab.ru/products/arkona-data-warehouse | Medium |
| DWH, minimum | from 20,000,000 | RUB | 2025-2026 | RU | contract price | https://ibs-analytics.ru/analiticheskie-sistemy/classic_dwh/ | Medium |
| Rosatom DWH 2.0, first stage | 1,110,000,000 starting contract price | RUB | 2023 | RU | contract price | https://www.cnews.ru/news/top/2023-03-03_rosatom_zapuskaet_gigantskij | High |
| VTB24 Teradata DWH | about 33,000,000 | USD | 2012-2015 | RU | total project cost | https://www.tadviser.ru/index.php/%D0%9F%D1%80%D0%BE%D0%B5%D0%BA%D1%82:%D0%92%D0%A2%D0%9124_(Teradata_Active_Enterprise_Data_Warehouse_6750_(Teradata_Active_EDW) | High |

The DWH range is wide because the scope is wide. A 1,500,000 RUB SMB BI package and a 1,110,000,000 RUB Rosatom platform share a label, not a scope. Normalize by users, data volume, source systems, and whether hardware is included.

### 9.5 Information security, 187-FZ, and KII

| Service | Value | Unit | Period | Geography | Basis | Source | Confidence |
|---|---:|---|---|---|---|---|---|
| KII categorization, 1 object | from 55,000 | RUB | 2025-2026 | RU | service price | https://security-electronics.ru/ | High |
| KII categorization, 15 objects | up to 240,000 | RUB | 2025-2026 | RU | service price | https://www.altirixgroup.com/napravleniya-deyatelnosti/informaczionnaya-bezopasnost/zakonodatelstvo-i-konsalting/kriticheskaya-informaczionnaya-infrastruktura/kategorirovanie-obektov-kii/ | High |
| KII categorization, fixed 2026 offer | 277,800 for no more than 1 legal entity and no more than 10 objects | RUB | 2026 | RU | fixed offer | https://www.altirixgroup.com/napravleniya-deyatelnosti/informaczionnaya-bezopasnost/zakonodatelstvo-i-konsalting/kriticheskaya-informaczionnaya-infrastruktura/kategorirovanie-obektov-kii/ | High |
| KII protection system | from 900,000; 2-3 months | RUB | 2025-2026 | RU | service price | https://www.budget-soft.ru/uslugi/zashchita-kii/ | High |
| KII protection, general | from 350,000-400,000 | RUB | 2025-2026 | RU | service price | https://xonsecurity.ru/services/organizatsiya-zashchity-kii/ | High |
| KII protection, general | from 350,000-400,000 | RUB | 2025-2026 | RU | service price | https://ovodov.su/prices | High |
| Typical KII project | tens of millions of rubles; 14% of companies raised budgets 10x | RUB | 2024-2025 | RU | survey and case estimate | https://files.k2.tech/view.php?file=Issledovanie_gotovnosti_subektov_KII_k_ispolneniju_zakonodatelstv%D0%B0.pdf | Medium |
| SOC build | from 1,500,000 | RUB | 2025-2026 | RU | service price | https://ovodov.su/prices | High |
| GosSOPKA center, self-built | minimum 50,400,000; 1.5 years; about 20 staff | RUB | 2025 | RU | project estimate | https://rt-solar.ru/upload/iblock/256/Solar_JSOC_GosSOPKA.pdf | High |

**How to use project anchors.** Pair each price with a scope vector: users, integrations, sites, data volume, duration, and whether the price includes hardware, licenses, and support. Normalize to RUB per user, RUB per integration, or RUB per function point. A 100,000,000 RUB ERP and a 1,800,000 RUB CV project are not comparable without normalization.

---



## 10. Drop-in benchmark JSON

The JSON below is a flat row set. It is valid JSON, with no comments and no trailing commas. Load it into a table, a document store, or a spreadsheet import. Each row has the same attribute set as the tables above.

**Row schema**

| Field | Type | Meaning |
|---|---|---|
| id | string | Stable row key. Use it as a primary key. |
| domain | string | salary, burden, cost, rate, productivity, or anchor. |
| geo | string | RU, KZ, GLOBAL, IN, PL, LATAM, US. |
| role | string | Role or cost item. "all" means the row is not role-specific. |
| grade | string | Grade, seniority, or scope bucket. |
| value_low | number | Low bound of the range. Equals value_mid and value_high for a point estimate. |
| value_mid | number | Midpoint or point estimate. |
| value_high | number | High bound of the range. For open-ended rows this is the last published bound and the note says "and above". |
| unit | string | Unit of measure. Monthly values say RUB/month or KZT/month. |
| basis | string | net, gross, gross_offered, self_reported, contract_price, rate_excl_vat, statutory_rate, and so on. |
| period | string | Year, half-year, quarter, or date range. |
| source | string | Source URL, or "no single source" for a proxy. |
| source_date | string | Publication or access date. |
| confidence | string | High, Medium, Low, or Proxy. |
| note | string | Derivation note, caveat, or blank. |

**Loading examples**

```bash
jq '.rows[] | select(.domain == "salary" and .geo == "RU")' bench.json
jq '.rows[] | select(.domain == "burden")' bench.json
jq '[.rows[] | select(.domain == "rate" and .unit == "RUB/hour") | .value_mid] | add / length' bench.json
```

```json
{
  "schema_version": "1.0",
  "generated": "2026-11-08",
  "notes": "Flat rows for a benchmark database. Salary values are monthly unless the unit says otherwise. basis net means take-home; gross means before personal income tax; gross_offered means vacancy-offered and usually gross. Confidence values are High, Medium, Low, Proxy. value_mid is the point estimate, or the midpoint or cross-check stated in the note. Arithmetic-derived rows are Medium and carry a note or a global derivation note. No FX conversion is applied.",
  "rows": [
    {"id":"sal_ru_backend_median_2026h1","domain":"salary","geo":"RU","role":"backend","grade":"all","value_low":251000,"value_mid":251000,"value_high":251000,"unit":"RUB/month","basis":"net","period":"2026-H1","source":"https://habr.com/ru/companies/habr_career/articles/1075936/","source_date":"2026-08-28","confidence":"High","note":""},
    {"id":"sal_ru_frontend_median_2026h1","domain":"salary","geo":"RU","role":"frontend","grade":"all","value_low":225000,"value_mid":225000,"value_high":225000,"unit":"RUB/month","basis":"net","period":"2026-H1","source":"https://habr.com/ru/companies/habr_career/articles/1075936/","source_date":"2026-08-28","confidence":"High","note":""},
    {"id":"sal_ru_fullstack_median_2026h1","domain":"salary","geo":"RU","role":"fullstack","grade":"all","value_low":208000,"value_mid":208000,"value_high":208000,"unit":"RUB/month","basis":"net","period":"2026-H1","source":"https://habr.com/ru/companies/habr_career/articles/1075936/","source_date":"2026-08-28","confidence":"High","note":""},
    {"id":"sal_ru_mobile_median_2026h1","domain":"salary","geo":"RU","role":"mobile","grade":"all","value_low":295000,"value_mid":295000,"value_high":295000,"unit":"RUB/month","basis":"net","period":"2026-H1","source":"https://habr.com/ru/companies/habr_career/articles/1075936/","source_date":"2026-08-28","confidence":"High","note":""},
    {"id":"sal_ru_architect_median_2026h1","domain":"salary","geo":"RU","role":"architect","grade":"senior_lead","value_low":504000,"value_mid":504000,"value_high":504000,"unit":"RUB/month","basis":"net","period":"2026-H1","source":"https://habr.com/ru/companies/habr_career/articles/1075936/","source_date":"2026-08-28","confidence":"High","note":"prior H2 2025 median 465000"},
    {"id":"sal_ru_1c_median_2026h1","domain":"salary","geo":"RU","role":"1c_developer","grade":"all","value_low":197000,"value_mid":197000,"value_high":197000,"unit":"RUB/month","basis":"net","period":"2026-H1","source":"https://habr.com/ru/companies/habr_career/articles/1075936/","source_date":"2026-08-28","confidence":"High","note":""},
    {"id":"sal_ru_db_median_2026h1","domain":"salary","geo":"RU","role":"database_developer","grade":"all","value_low":220000,"value_mid":220000,"value_high":220000,"unit":"RUB/month","basis":"net","period":"2026-H1","source":"https://habr.com/ru/companies/habr_career/articles/1075936/","source_date":"2026-08-28","confidence":"High","note":""},
    {"id":"sal_ru_embedded_median_2026h1","domain":"salary","geo":"RU","role":"embedded","grade":"all","value_low":168000,"value_mid":168000,"value_high":168000,"unit":"RUB/month","basis":"net","period":"2026-H1","source":"https://habr.com/ru/companies/habr_career/articles/1075936/","source_date":"2026-08-28","confidence":"High","note":""},
    {"id":"sal_ru_html_median_2026h1","domain":"salary","geo":"RU","role":"html_css","grade":"all","value_low":114000,"value_mid":114000,"value_high":114000,"unit":"RUB/month","basis":"net","period":"2026-H1","source":"https://habr.com/ru/companies/habr_career/articles/1075936/","source_date":"2026-08-28","confidence":"High","note":""},
    {"id":"sal_ru_qa_median_2025h2","domain":"salary","geo":"RU","role":"qa","grade":"all","value_low":200000,"value_mid":200000,"value_high":200000,"unit":"RUB/month","basis":"net","period":"2025-H2","source":"https://ruitunion.org/posts/2025-10-13-it-specialist-salaries-in-the-second-half-of-2025/","source_date":"2025-10-13","confidence":"High","note":""},
    {"id":"sal_ru_analyst_median_2025h2","domain":"salary","geo":"RU","role":"analyst","grade":"all","value_low":250000,"value_mid":250000,"value_high":250000,"unit":"RUB/month","basis":"net","period":"2025-H2","source":"https://ruitunion.org/posts/2025-10-13-it-specialist-salaries-in-the-second-half-of-2025/","source_date":"2025-10-13","confidence":"High","note":""},
    {"id":"sal_ru_devops_median_2025","domain":"salary","geo":"RU","role":"devops","grade":"all","value_low":245000,"value_mid":245000,"value_high":245000,"unit":"RUB/month","basis":"net","period":"2025","source":"https://thecode.media/zarplaty-it-specialistov-v-konce-2025/","source_date":"2025-12-03","confidence":"High","note":""},
    {"id":"sal_ru_data_engineer_median_2025","domain":"salary","geo":"RU","role":"data_engineer","grade":"all","value_low":255000,"value_mid":255000,"value_high":255000,"unit":"RUB/month","basis":"net","period":"2025","source":"https://thecode.media/zarplaty-it-specialistov-v-konce-2025/","source_date":"2025-12-03","confidence":"High","note":""},
    {"id":"sal_ru_ba_median_2025","domain":"salary","geo":"RU","role":"business_analyst","grade":"all","value_low":167000,"value_mid":167000,"value_high":167000,"unit":"RUB/month","basis":"net","period":"2025","source":"https://thecode.media/zarplaty-it-specialistov-v-konce-2025/","source_date":"2025-12-03","confidence":"High","note":""},
    {"id":"sal_ru_ux_median_2025h1","domain":"salary","geo":"RU","role":"ux_ui_designer","grade":"all","value_low":115000,"value_mid":115000,"value_high":115000,"unit":"RUB/month","basis":"net","period":"2025-H1","source":"https://habr.com/ru/specials/936618/","source_date":"2025-08-14","confidence":"High","note":""},
    {"id":"sal_ru_pm_median_2025h2","domain":"salary","geo":"RU","role":"pm_teamlead","grade":"all","value_low":330000,"value_mid":330000,"value_high":330000,"unit":"RUB/month","basis":"net","period":"2025-H2","source":"https://ruitunion.org/posts/2025-10-13-it-specialist-salaries-in-the-second-half-of-2025/","source_date":"2025-10-13","confidence":"High","note":""},
    {"id":"sal_ru_infosec_proxy_2025","domain":"salary","geo":"RU","role":"infosec","grade":"all","value_low":150000,"value_mid":200000,"value_high":250000,"unit":"RUB/month","basis":"net","period":"2025","source":"https://www.cnews.ru/news/line/2025-12-15_za_pyat_let_predlagaemye","source_date":"2025-12-15","confidence":"Proxy","note":"hh offered median 85300 gross; proxy is for mid-senior"},
    {"id":"sal_ru_grade_intern_2025","domain":"salary","geo":"RU","role":"all","grade":"intern","value_low":59000,"value_mid":65000,"value_high":69000,"unit":"RUB/month","basis":"net","period":"2025","source":"https://thecode.media/zarplaty-it-specialistov-v-konce-2025/","source_date":"2025-12-03","confidence":"High","note":"low/high are regions to Moscow/SPb; mid is RUIT cross-check"},
    {"id":"sal_ru_grade_junior_2025","domain":"salary","geo":"RU","role":"all","grade":"junior","value_low":82000,"value_mid":110000,"value_high":111000,"unit":"RUB/month","basis":"net","period":"2025","source":"https://thecode.media/zarplaty-it-specialistov-v-konce-2025/","source_date":"2025-12-03","confidence":"High","note":"low/high are regions to Moscow/SPb; mid is RUIT cross-check"},
    {"id":"sal_ru_grade_middle_2025","domain":"salary","geo":"RU","role":"all","grade":"middle","value_low":164000,"value_mid":200000,"value_high":201000,"unit":"RUB/month","basis":"net","period":"2025","source":"https://thecode.media/zarplaty-it-specialistov-v-konce-2025/","source_date":"2025-12-03","confidence":"High","note":"low/high are regions to Moscow/SPb; mid is RUIT cross-check"},
    {"id":"sal_ru_grade_senior_2025","domain":"salary","geo":"RU","role":"all","grade":"senior","value_low":286000,"value_mid":300000,"value_high":337000,"unit":"RUB/month","basis":"net","period":"2025","source":"https://thecode.media/zarplaty-it-specialistov-v-konce-2025/","source_date":"2025-12-03","confidence":"High","note":"low/high are regions to Moscow/SPb; mid is RUIT cross-check"},
    {"id":"sal_ru_grade_lead_2025","domain":"salary","geo":"RU","role":"all","grade":"lead","value_low":342000,"value_mid":380000,"value_high":404000,"unit":"RUB/month","basis":"net","period":"2025","source":"https://thecode.media/zarplaty-it-specialistov-v-konce-2025/","source_date":"2025-12-03","confidence":"High","note":"low/high are regions to Moscow/SPb; mid is RUIT cross-check"},
    {"id":"sal_ru_backend_junior_band","domain":"salary","geo":"RU","role":"backend","grade":"junior","value_low":80000,"value_mid":110000,"value_high":140000,"unit":"RUB/month","basis":"gross","period":"2025-2026","source":"https://www.trillioncredit.ru/blog/zarplaty-v-it/","source_date":"2025-07-06","confidence":"Low","note":""},
    {"id":"sal_ru_backend_middle_band","domain":"salary","geo":"RU","role":"backend","grade":"middle","value_low":180000,"value_mid":230000,"value_high":280000,"unit":"RUB/month","basis":"gross","period":"2025-2026","source":"https://www.trillioncredit.ru/blog/zarplaty-v-it/","source_date":"2025-07-06","confidence":"Low","note":""},
    {"id":"sal_ru_backend_senior_band","domain":"salary","geo":"RU","role":"backend","grade":"senior","value_low":320000,"value_mid":410000,"value_high":500000,"unit":"RUB/month","basis":"gross","period":"2025-2026","source":"https://www.trillioncredit.ru/blog/zarplaty-v-it/","source_date":"2025-07-06","confidence":"Low","note":""},
    {"id":"sal_ru_backend_lead_band","domain":"salary","geo":"RU","role":"backend","grade":"lead","value_low":450000,"value_mid":625000,"value_high":800000,"unit":"RUB/month","basis":"gross","period":"2025-2026","source":"https://www.trillioncredit.ru/blog/zarplaty-v-it/","source_date":"2025-07-06","confidence":"Low","note":""},
    {"id":"sal_kz_developer_median_2025","domain":"salary","geo":"KZ","role":"programmer_developer","grade":"all","value_low":359198,"value_mid":359198,"value_high":359198,"unit":"KZT/month","basis":"gross_offered","period":"2025","source":"https://hh.kz/article/34221","source_date":"2026-02-18","confidence":"High","note":""},
    {"id":"sal_kz_qa_median_2025","domain":"salary","geo":"KZ","role":"qa","grade":"all","value_low":233980,"value_mid":233980,"value_high":233980,"unit":"KZT/month","basis":"gross_offered","period":"2025","source":"https://hh.kz/article/34221","source_date":"2026-02-18","confidence":"High","note":""},
    {"id":"sal_kz_analyst_median_2025","domain":"salary","geo":"KZ","role":"analyst","grade":"all","value_low":313989,"value_mid":313989,"value_high":313989,"unit":"KZT/month","basis":"gross_offered","period":"2025","source":"https://hh.kz/article/34221","source_date":"2026-02-18","confidence":"High","note":""},
    {"id":"sal_kz_ba_median_2025","domain":"salary","geo":"KZ","role":"business_analyst","grade":"all","value_low":415157,"value_mid":415157,"value_high":415157,"unit":"KZT/month","basis":"gross_offered","period":"2025","source":"https://hh.kz/article/34221","source_date":"2026-02-18","confidence":"High","note":""},
    {"id":"sal_kz_sa_median_2025","domain":"salary","geo":"KZ","role":"system_analyst","grade":"all","value_low":340278,"value_mid":340278,"value_high":340278,"unit":"KZT/month","basis":"gross_offered","period":"2025","source":"https://hh.kz/article/34221","source_date":"2026-02-18","confidence":"High","note":""},
    {"id":"sal_kz_devops_median_2025","domain":"salary","geo":"KZ","role":"devops","grade":"all","value_low":247000,"value_mid":247000,"value_high":247000,"unit":"KZT/month","basis":"gross_offered","period":"2025","source":"https://hh.kz/article/34221","source_date":"2026-02-18","confidence":"High","note":""},
    {"id":"sal_kz_infosec_median_2025","domain":"salary","geo":"KZ","role":"infosec","grade":"all","value_low":231523,"value_mid":231523,"value_high":231523,"unit":"KZT/month","basis":"gross_offered","period":"2025","source":"https://hh.kz/article/34221","source_date":"2026-02-18","confidence":"High","note":""},
    {"id":"sal_kz_pm_median_2025","domain":"salary","geo":"KZ","role":"project_manager","grade":"all","value_low":378683,"value_mid":378683,"value_high":378683,"unit":"KZT/month","basis":"gross_offered","period":"2025","source":"https://hh.kz/article/34221","source_date":"2026-02-18","confidence":"High","note":""},
    {"id":"sal_kz_designer_median_2025","domain":"salary","geo":"KZ","role":"designer","grade":"all","value_low":275906,"value_mid":275906,"value_high":275906,"unit":"KZT/month","basis":"gross_offered","period":"2025","source":"https://hh.kz/article/34221","source_date":"2026-02-18","confidence":"High","note":""},
    {"id":"sal_kz_ds_median_2025","domain":"salary","geo":"KZ","role":"data_scientist","grade":"all","value_low":440000,"value_mid":440000,"value_high":440000,"unit":"KZT/month","basis":"gross_offered","period":"2025","source":"https://hh.kz/article/34221","source_date":"2026-02-18","confidence":"High","note":""},
    {"id":"sal_kz_cto_median_2025","domain":"salary","geo":"KZ","role":"cto","grade":"all","value_low":498500,"value_mid":498500,"value_high":498500,"unit":"KZT/month","basis":"gross_offered","period":"2025","source":"https://hh.kz/article/34221","source_date":"2026-02-18","confidence":"High","note":""},
    {"id":"sal_kz_cio_median_2025","domain":"salary","geo":"KZ","role":"cio","grade":"all","value_low":436345,"value_mid":436345,"value_high":436345,"unit":"KZT/month","basis":"gross_offered","period":"2025","source":"https://hh.kz/article/34221","source_date":"2026-02-18","confidence":"High","note":""},
    {"id":"sal_kz_sysadmin_median_2025","domain":"salary","geo":"KZ","role":"sysadmin","grade":"all","value_low":272614,"value_mid":272614,"value_high":272614,"unit":"KZT/month","basis":"gross_offered","period":"2025","source":"https://hh.kz/article/34221","source_date":"2026-02-18","confidence":"High","note":""},
    {"id":"sal_kz_support_median_2025","domain":"salary","geo":"KZ","role":"support","grade":"all","value_low":220929,"value_mid":220929,"value_high":220929,"unit":"KZT/month","basis":"gross_offered","period":"2025","source":"https://hh.kz/article/34221","source_date":"2026-02-18","confidence":"High","note":""},
    {"id":"sal_kz_exp_none_2025q1","domain":"salary","geo":"KZ","role":"all","grade":"no_experience","value_low":228154,"value_mid":228154,"value_high":228154,"unit":"KZT/month","basis":"gross_offered","period":"2025-Q1","source":"https://hh.kz/article/33667","source_date":"2025-05-19","confidence":"High","note":""},
    {"id":"sal_kz_exp_up_to_3_2025q1","domain":"salary","geo":"KZ","role":"all","grade":"up_to_3_years","value_low":323646,"value_mid":323646,"value_high":323646,"unit":"KZT/month","basis":"gross_offered","period":"2025-Q1","source":"https://hh.kz/article/33667","source_date":"2025-05-19","confidence":"High","note":""},
    {"id":"sal_kz_exp_up_to_6_2025q1","domain":"salary","geo":"KZ","role":"all","grade":"up_to_6_years","value_low":529778,"value_mid":529778,"value_high":529778,"unit":"KZT/month","basis":"gross_offered","period":"2025-Q1","source":"https://hh.kz/article/33667","source_date":"2025-05-19","confidence":"High","note":""},
    {"id":"sal_kz_exp_6plus_2025q1","domain":"salary","geo":"KZ","role":"all","grade":"6_plus_years","value_low":782639,"value_mid":782639,"value_high":782639,"unit":"KZT/month","basis":"gross_offered","period":"2025-Q1","source":"https://hh.kz/article/33667","source_date":"2025-05-19","confidence":"High","note":""},
    {"id":"sal_kz_survey_median_2025","domain":"salary","geo":"KZ","role":"developer","grade":"all","value_low":960000,"value_mid":960000,"value_high":960000,"unit":"KZT/month","basis":"self_reported","period":"2025","source":"https://digitalbusiness.kz/2025-02-07/bolshe-1-mln-tenge-stala-izvestna-srednyaya-zarplata-razrabotchikov-v-kazahstane/","source_date":"2025-02-07","confidence":"High","note":""},
    {"id":"sal_kz_survey_mean_2025","domain":"salary","geo":"KZ","role":"developer","grade":"all","value_low":1220000,"value_mid":1220000,"value_high":1220000,"unit":"KZT/month","basis":"self_reported","period":"2025","source":"https://digitalbusiness.kz/2025-02-07/bolshe-1-mln-tenge-stala-izvestna-srednyaya-zarplata-razrabotchikov-v-kazahstane/","source_date":"2025-02-07","confidence":"High","note":""},
    {"id":"sal_kz_official_avg_2025q3","domain":"salary","geo":"KZ","role":"all","grade":"all","value_low":818100,"value_mid":818100,"value_high":818100,"unit":"KZT/month","basis":"gross_official_average","period":"2025-Q3","source":"https://www.inform.kz/ru/bolee-800-tisyach-tenge-zarabativayut-it-spetsialisti-v-kazahstane-61f86a","source_date":"2025-12-05","confidence":"High","note":""},
    {"id":"burden_ru_threshold_2026","domain":"burden","geo":"RU","role":"all","grade":"all","value_low":2979000,"value_mid":2979000,"value_high":2979000,"unit":"RUB/person/year","basis":"statutory_threshold","period":"2026","source":"https://www.nalog.gov.ru/rn77/news/activities_fts/16577139/","source_date":"2025-11-12","confidence":"High","note":""},
    {"id":"burden_ru_rate_up_to_threshold_2026","domain":"burden","geo":"RU","role":"all","grade":"all","value_low":30,"value_mid":30,"value_high":30,"unit":"%","basis":"statutory_rate","period":"2026","source":"https://www.nalog.gov.ru/rn32/news/seminar/16610341/","source_date":"2026-03-18","confidence":"High","note":""},
    {"id":"burden_ru_rate_above_threshold_2026","domain":"burden","geo":"RU","role":"all","grade":"all","value_low":15.1,"value_mid":15.1,"value_high":15.1,"unit":"%","basis":"statutory_rate","period":"2026","source":"https://www.nalog.gov.ru/rn32/news/seminar/16610341/","source_date":"2026-03-18","confidence":"High","note":""},
    {"id":"burden_ru_it_rate_2026","domain":"burden","geo":"RU","role":"all","grade":"all","value_low":7.6,"value_mid":15,"value_high":15,"unit":"%","basis":"statutory_rate","period":"2026","source":"https://www.klerk.ru/buh/articles/669936/","source_date":"2025-11-24","confidence":"High","note":"15% up to threshold, 7.6% above"},
    {"id":"burden_kz_social_tax_2026","domain":"burden","geo":"KZ","role":"all","grade":"all","value_low":6,"value_mid":6,"value_high":6,"unit":"%","basis":"statutory_rate","period":"2026","source":"https://kst.kgd.gov.kz/ru/news/izmeneniya-po-socialnomu-nalogu-v-2026-godu-12-163416","source_date":"2026-02-18","confidence":"High","note":""},
    {"id":"burden_kz_opvr_2026","domain":"burden","geo":"KZ","role":"all","grade":"all","value_low":3.5,"value_mid":3.5,"value_high":3.5,"unit":"%","basis":"statutory_rate","period":"2026","source":"https://uppersetup.com/ru/blog/employer-payroll-taxes-and-contributions-in-kazakhstan-2026","source_date":"2026-08-13","confidence":"High","note":""},
    {"id":"burden_kz_social_contributions_2026","domain":"burden","geo":"KZ","role":"all","grade":"all","value_low":5,"value_mid":5,"value_high":5,"unit":"%","basis":"statutory_rate","period":"2026","source":"https://vko.kgd.gov.kz/ru/news/socialnye-platezhi-v-respublike-kazahstan-8-160454","source_date":"2025-11-26","confidence":"High","note":""},
    {"id":"burden_kz_osms_2026","domain":"burden","geo":"KZ","role":"all","grade":"all","value_low":3,"value_mid":3,"value_high":3,"unit":"%","basis":"statutory_rate","period":"2026","source":"https://uppersetup.com/ru/blog/employer-payroll-taxes-and-contributions-in-kazakhstan-2026","source_date":"2026-08-13","confidence":"High","note":""},
    {"id":"burden_kz_opv_2026","domain":"burden","geo":"KZ","role":"all","grade":"all","value_low":10,"value_mid":10,"value_high":10,"unit":"%","basis":"statutory_rate","period":"2026","source":"https://vko.kgd.gov.kz/ru/news/socialnye-platezhi-v-respublike-kazahstan-8-160454","source_date":"2025-11-26","confidence":"High","note":""},
    {"id":"burden_kz_vosms_2026","domain":"burden","geo":"KZ","role":"all","grade":"all","value_low":2,"value_mid":2,"value_high":2,"unit":"%","basis":"statutory_rate","period":"2026","source":"https://uppersetup.com/ru/blog/employer-payroll-taxes-and-contributions-in-kazakhstan-2026","source_date":"2026-08-13","confidence":"High","note":""},
    {"id":"burden_kz_ipn_2026","domain":"burden","geo":"KZ","role":"all","grade":"all","value_low":10,"value_mid":10,"value_high":10,"unit":"%","basis":"statutory_rate","period":"2026","source":"https://vko.kgd.gov.kz/ru/news/osnovnye-izmeneniya-v-nalogovom-kodekse-rk-s-1-yanvarya-2026-goda-chto-vazhno-znat-o-ipn-i","source_date":"2026-02-12","confidence":"High","note":""},
    {"id":"burden_kz_minimum_wage_2026","domain":"burden","geo":"KZ","role":"all","grade":"all","value_low":85000,"value_mid":85000,"value_high":85000,"unit":"KZT/month","basis":"statutory_reference","period":"2026","source":"https://zan.kz/kk/news/Details?id=629","source_date":"2025-12-31","confidence":"High","note":""},
    {"id":"cost_ru_office_rent_class_b_2025q3","domain":"cost","geo":"RU","role":"all","grade":"all","value_low":22423,"value_mid":22423,"value_high":22423,"unit":"RUB/m2/year","basis":"rent_excl_opex","period":"2025-Q3","source":"https://media.kf.expert/lenta_analytics/0/889/NF%20GROUP%20_Office%20market%20report_Moscow_Q3%20_2025.pdf","source_date":"2025-Q3","confidence":"High","note":""},
    {"id":"cost_ru_office_opex_class_b_2025q3","domain":"cost","geo":"RU","role":"all","grade":"all","value_low":6000,"value_mid":6000,"value_high":6000,"unit":"RUB/m2/year","basis":"operating_expense","period":"2025-Q3","source":"https://media.kf.expert/lenta_analytics/0/889/NF%20GROUP%20_Office%20market%20report_Moscow_Q3%20_2025.pdf","source_date":"2025-Q3","confidence":"High","note":""},
    {"id":"cost_ru_workplace_leased_2025q1","domain":"cost","geo":"RU","role":"all","grade":"all","value_low":36000,"value_mid":44000,"value_high":52000,"unit":"RUB/workstation/month","basis":"all_in","period":"2025-Q1","source":"https://static.energy-agency.ru/eevents/230425/1-viktoriya-goryacheva-nikoliers.pdf","source_date":"2025-Q1","confidence":"High","note":""},
    {"id":"cost_ru_coworking_2025q3","domain":"cost","geo":"RU","role":"all","grade":"all","value_low":56228,"value_mid":56228,"value_high":56228,"unit":"RUB/workstation/month","basis":"all_in","period":"2025-Q3","source":"https://media.kf.expert/lenta_analytics/0/889/NF%20GROUP%20_Office%20market%20report_Moscow_Q3%20_2025.pdf","source_date":"2025-Q3","confidence":"High","note":""},
    {"id":"cost_ru_hardware_setup_2024","domain":"cost","geo":"RU","role":"all","grade":"all","value_low":97539,"value_mid":97539,"value_high":97539,"unit":"RUB/workstation","basis":"retail_components","period":"2024","source":"https://habr.com/ru/articles/827656/","source_date":"2024-07-09","confidence":"High","note":""},
    {"id":"cost_ru_hardware_3y_proxy","domain":"cost","geo":"RU","role":"all","grade":"all","value_low":150000,"value_mid":225000,"value_high":300000,"unit":"RUB/developer/3years","basis":"estimated_total","period":"2025","source":"https://habr.com/ru/articles/827656/","source_date":"2024-07-09","confidence":"Proxy","note":"derived from 97539 peripherals plus 80000-200000 laptop/PC"},
    {"id":"cost_ru_licenses_proxy","domain":"cost","geo":"RU","role":"all","grade":"all","value_low":50000,"value_mid":100000,"value_high":150000,"unit":"RUB/developer/year","basis":"vendor_list_proxy","period":"2025","source":"no single source","source_date":"2026-11-08","confidence":"Proxy","note":""},
    {"id":"rate_ru_inhouse_junior_2025","domain":"rate","geo":"RU","role":"all","grade":"junior","value_low":1300,"value_mid":2000,"value_high":2700,"unit":"RUB/hour","basis":"internal_cost_rate","period":"2025","source":"https://www.klerk.ru/materials/2025-10-06/skolko-stoit-chas-raboty-programmista/","source_date":"2025-10-06","confidence":"High","note":""},
    {"id":"rate_ru_inhouse_middle_2025","domain":"rate","geo":"RU","role":"all","grade":"middle","value_low":3100,"value_mid":4350,"value_high":5600,"unit":"RUB/hour","basis":"internal_cost_rate","period":"2025","source":"https://www.klerk.ru/materials/2025-10-06/skolko-stoit-chas-raboty-programmista/","source_date":"2025-10-06","confidence":"High","note":""},
    {"id":"rate_ru_inhouse_senior_2025","domain":"rate","geo":"RU","role":"all","grade":"senior","value_low":5700,"value_mid":5700,"value_high":5700,"unit":"RUB/hour","basis":"internal_cost_rate","period":"2025","source":"https://www.klerk.ru/materials/2025-10-06/skolko-stoit-chas-raboty-programmista/","source_date":"2025-10-06","confidence":"High","note":"open-ended and above"},
    {"id":"rate_ru_outsource_junior_2025","domain":"rate","geo":"RU","role":"all","grade":"junior","value_low":1500,"value_mid":2350,"value_high":3200,"unit":"RUB/hour","basis":"rate_excl_vat","period":"2025","source":"https://www.klerk.ru/materials/2025-10-06/skolko-stoit-chas-raboty-programmista/","source_date":"2025-10-06","confidence":"High","note":""},
    {"id":"rate_ru_outsource_middle_2025","domain":"rate","geo":"RU","role":"all","grade":"middle","value_low":3700,"value_mid":5150,"value_high":6600,"unit":"RUB/hour","basis":"rate_excl_vat","period":"2025","source":"https://www.klerk.ru/materials/2025-10-06/skolko-stoit-chas-raboty-programmista/","source_date":"2025-10-06","confidence":"High","note":""},
    {"id":"rate_ru_outsource_senior_2025","domain":"rate","geo":"RU","role":"all","grade":"senior","value_low":6700,"value_mid":6700,"value_high":6700,"unit":"RUB/hour","basis":"rate_excl_vat","period":"2025","source":"https://www.klerk.ru/materials/2025-10-06/skolko-stoit-chas-raboty-programmista/","source_date":"2025-10-06","confidence":"High","note":"open-ended and above"},
    {"id":"rate_ru_dins_middle_2025","domain":"rate","geo":"RU","role":"all","grade":"middle","value_low":2200,"value_mid":2500,"value_high":2800,"unit":"RUB/hour","basis":"rate_excl_vat","period":"2025","source":"https://codingteam.ru/blog/autsorsing-razrabotchikov-v-2025-kogda-vigodnee-na","source_date":"2025-11-07","confidence":"High","note":""},
    {"id":"rate_ru_dins_senior_2025","domain":"rate","geo":"RU","role":"all","grade":"senior","value_low":3000,"value_mid":3600,"value_high":4200,"unit":"RUB/hour","basis":"rate_excl_vat","period":"2025","source":"https://codingteam.ru/blog/autsorsing-razrabotchikov-v-2025-kogda-vigodnee-na","source_date":"2025-11-07","confidence":"High","note":""},
    {"id":"rate_ru_dins_teamlead_2025","domain":"rate","geo":"RU","role":"all","grade":"teamlead","value_low":4500,"value_mid":4500,"value_high":4500,"unit":"RUB/hour","basis":"rate_excl_vat","period":"2025","source":"https://codingteam.ru/blog/autsorsing-razrabotchikov-v-2025-kogda-vigodnee-na","source_date":"2025-11-07","confidence":"High","note":"open-ended and above"},
    {"id":"rate_ru_skillstaff_avg_2025q3","domain":"rate","geo":"RU","role":"all","grade":"all","value_low":2400,"value_mid":2400,"value_high":2400,"unit":"RUB/hour","basis":"rate_excl_vat","period":"2025-Q3","source":"https://prosharing.ru/spros-na-autstaffing-vyros-pochti-v-poltora-raza-v-tretem-kvartale-2025-goda/","source_date":"2025-10-16","confidence":"High","note":""},
    {"id":"rate_ru_cnews_dev_day_2025","domain":"rate","geo":"RU","role":"developer","grade":"all","value_low":24900,"value_mid":24900,"value_high":24900,"unit":"RUB/day","basis":"rate_excl_vat","period":"2025","source":"https://www.cnews.ru/reviews/zakaznaya_razrabotka_po_2025/articles/v_zakaznoj_razrabotke_stali_platit","source_date":"2026-03-23","confidence":"High","note":""},
    {"id":"rate_ru_cnews_pm_day_2025","domain":"rate","geo":"RU","role":"project_manager","grade":"all","value_low":27200,"value_mid":27200,"value_high":27200,"unit":"RUB/day","basis":"rate_excl_vat","period":"2025","source":"https://www.cnews.ru/reviews/zakaznaya_razrabotka_po_2025/articles/v_zakaznoj_razrabotke_stali_platit","source_date":"2026-03-23","confidence":"High","note":""},
    {"id":"rate_ru_1c_2026","domain":"rate","geo":"RU","role":"1c_developer","grade":"all","value_low":1500,"value_mid":3000,"value_high":4500,"unit":"RUB/hour","basis":"rate_excl_vat","period":"2026","source":"https://itviar.ru/stati/services-stati/autstaffing/stoimost-autstaffinga-1s-v-2026-godu/","source_date":"2026-05-19","confidence":"High","note":""},
    {"id":"rate_kz_hourly_2025","domain":"rate","geo":"KZ","role":"all","grade":"all","value_low":15,"value_mid":32.5,"value_high":50,"unit":"USD/hour","basis":"rate_excl_vat","period":"2025","source":"https://osn.kz/blog/it-outsourcing-kazakhstan-2025","source_date":"2025-08-15","confidence":"High","note":""},
    {"id":"rate_kz_average_2026","domain":"rate","geo":"KZ","role":"all","grade":"all","value_low":25,"value_mid":37,"value_high":49,"unit":"USD/hour","basis":"rate_excl_vat","period":"2026","source":"https://sigma.software/insights/software-outsourcing-to-central-asia-uzbekistan-kazakhstan-azerbaijan","source_date":"2026-04-08","confidence":"High","note":""},
    {"id":"rate_kz_wadline_2026","domain":"rate","geo":"KZ","role":"all","grade":"all","value_low":28,"value_mid":37,"value_high":61,"unit":"USD/hour","basis":"rate_excl_vat","period":"2026","source":"https://ru.wadline.com/rates","source_date":"2026-11-07","confidence":"High","note":""},
    {"id":"rate_india_2025","domain":"rate","geo":"IN","role":"all","grade":"all","value_low":24,"value_mid":32.5,"value_high":41,"unit":"USD/hour","basis":"rate_excl_vat","period":"2025","source":"https://www.accelerance.com/blog/2026-outsourcing-rate-trends-asia-europe-latam","source_date":"2025-11-24","confidence":"High","note":""},
    {"id":"rate_poland_senior_2025","domain":"rate","geo":"PL","role":"all","grade":"senior","value_low":64,"value_mid":70,"value_high":76,"unit":"USD/hour","basis":"rate_excl_vat","period":"2025","source":"https://www.accelerance.com/blog/2026-outsourcing-rate-trends-asia-europe-latam","source_date":"2025-11-24","confidence":"High","note":""},
    {"id":"rate_poland_wadline_2026","domain":"rate","geo":"PL","role":"all","grade":"all","value_low":61,"value_mid":75,"value_high":76,"unit":"USD/hour","basis":"rate_excl_vat","period":"2026","source":"https://ru.wadline.com/rates","source_date":"2026-11-07","confidence":"High","note":""},
    {"id":"rate_latam_senior_2025","domain":"rate","geo":"LATAM","role":"all","grade":"senior","value_low":60,"value_mid":67.5,"value_high":75,"unit":"USD/hour","basis":"rate_excl_vat","period":"2025","source":"https://www.accelerance.com/blog/2026-outsourcing-rate-trends-asia-europe-latam","source_date":"2025-11-24","confidence":"High","note":""},
    {"id":"rate_us_senior_2026","domain":"rate","geo":"US","role":"all","grade":"senior","value_low":80,"value_mid":115,"value_high":150,"unit":"USD/hour","basis":"rate_excl_vat","period":"2026","source":"https://aiservicescompanies.com/research/offshore-ai-development-rates-2026/","source_date":"2026-11-05","confidence":"Medium","note":""},
    {"id":"prod_isbsg_pdr_median","domain":"productivity","geo":"GLOBAL","role":"all","grade":"all","value_low":6.5,"value_mid":6.5,"value_high":6.5,"unit":"hours/FP","basis":"effort_pdr","period":"2021","source":"https://www.isbsg.org/wp-content/uploads/2022/05/Short-Paper-2021-10-Use-of-Output-Based-KPIs-in-AD-Contracts.pdf","source_date":"2021-10","confidence":"High","note":""},
    {"id":"prod_isbsg_pdr_average","domain":"productivity","geo":"GLOBAL","role":"all","grade":"all","value_low":7.0,"value_mid":7.0,"value_high":7.0,"unit":"hours/FP","basis":"effort_pdr","period":"2021","source":"https://www.isbsg.org/wp-content/uploads/2022/05/Short-Paper-2021-10-Use-of-Output-Based-KPIs-in-AD-Contracts.pdf","source_date":"2021-10","confidence":"High","note":""},
    {"id":"prod_isbsg_pdr_government","domain":"productivity","geo":"GLOBAL","role":"all","grade":"all","value_low":9.7,"value_mid":9.7,"value_high":9.7,"unit":"hours/FP","basis":"effort_pdr","period":"2021","source":"https://totalmetrics.com/function-points/Software-Productivity-Government-ISBSG.pdf","source_date":"2021","confidence":"High","note":""},
    {"id":"prod_isbsg_mdr","domain":"productivity","geo":"GLOBAL","role":"all","grade":"all","value_low":20,"value_mid":30,"value_high":40,"unit":"FP/person/month","basis":"delivery_rate_elapsed","period":"2024","source":"https://www.isbsg.org/wp-content/uploads/2025/01/2024-12-Manpower-Delivery-Rate.pdf","source_date":"2024-12","confidence":"High","note":""},
    {"id":"prod_fp_per_person_month_derived","domain":"productivity","geo":"GLOBAL","role":"all","grade":"all","value_low":16.5,"value_mid":20.55,"value_high":24.6,"unit":"FP/person/month","basis":"derived_from_pdr_at_160h","period":"2021","source":"https://www.isbsg.org/wp-content/uploads/2022/05/Short-Paper-2021-10-Use-of-Output-Based-KPIs-in-AD-Contracts.pdf","source_date":"2021-10","confidence":"Medium","note":"derived 160/9.7 to 160/6.5"},
    {"id":"prod_sellable_hours","domain":"productivity","geo":"RU","role":"all","grade":"all","value_low":120,"value_mid":120,"value_high":120,"unit":"hours/month","basis":"billable_capacity","period":"2025","source":"https://www.klerk.ru/materials/2025-10-06/skolko-stoit-chas-raboty-programmista/","source_date":"2025-10-06","confidence":"High","note":""},
    {"id":"prod_productive_hours","domain":"productivity","geo":"RU","role":"all","grade":"all","value_low":1320,"value_mid":1320,"value_high":1320,"unit":"hours/year","basis":"productive_capacity","period":"2025","source":"https://www.klerk.ru/materials/2025-10-06/skolko-stoit-chas-raboty-programmista/","source_date":"2025-10-06","confidence":"High","note":""},
    {"id":"anchor_1c_erp_small","domain":"anchor","geo":"RU","role":"erp_1c","grade":"small","value_low":1000000,"value_mid":2000000,"value_high":3000000,"unit":"RUB","basis":"contract_price","period":"2025","source":"https://balns.ru/info/articles/skolko-stoit-vnedrenie-1s-erp-v-2025-godu-podrobnyy-obzor-rynka-faktorov-i-resheniy/","source_date":"2025-10-21","confidence":"Medium","note":""},
    {"id":"anchor_1c_erp_medium","domain":"anchor","geo":"RU","role":"erp_1c","grade":"medium","value_low":3000000,"value_mid":9000000,"value_high":15000000,"unit":"RUB","basis":"contract_price","period":"2025","source":"https://balns.ru/info/articles/skolko-stoit-vnedrenie-1s-erp-v-2025-godu-podrobnyy-obzor-rynka-faktorov-i-resheniy/","source_date":"2025-10-21","confidence":"Medium","note":""},
    {"id":"anchor_1c_erp_large","domain":"anchor","geo":"RU","role":"erp_1c","grade":"large","value_low":15000000,"value_mid":157500000,"value_high":300000000,"unit":"RUB","basis":"contract_price","period":"2025","source":"https://balns.ru/info/articles/skolko-stoit-vnedrenie-1s-erp-v-2025-godu-podrobnyy-obzor-rynka-faktorov-i-resheniy/","source_date":"2025-10-21","confidence":"Medium","note":""},
    {"id":"anchor_1c_erp_complex_cost","domain":"anchor","geo":"RU","role":"erp_1c","grade":"complex","value_low":100000000,"value_mid":104500000,"value_high":109000000,"unit":"RUB","basis":"contract_price","period":"2025","source":"https://fto.com.ru/blog/stoimost-proekta-po-perehodu-na-1s-erp-primer-realnogo-kejsa/","source_date":"2025-02-18","confidence":"High","note":"direct cost to including VAT"},
    {"id":"anchor_1c_erp_complex_hours","domain":"anchor","geo":"RU","role":"erp_1c","grade":"complex","value_low":26000,"value_mid":26000,"value_high":26000,"unit":"person-hours","basis":"effort","period":"2025","source":"https://fto.com.ru/blog/stoimost-proekta-po-perehodu-na-1s-erp-primer-realnogo-kejsa/","source_date":"2025-02-18","confidence":"High","note":""},
    {"id":"anchor_sap_to_1c_small","domain":"anchor","geo":"RU","role":"sap_migration","grade":"small","value_low":9500000,"value_mid":9500000,"value_high":9500000,"unit":"RUB","basis":"contract_price","period":"2025","source":"https://www.nep-group.ru/cases/importozameshchenie-realizovali-perehod-iz-sap-v-1s-erp","source_date":"2025","confidence":"High","note":""},
    {"id":"anchor_sap_to_1c_typical","domain":"anchor","geo":"RU","role":"sap_migration","grade":"large","value_low":100000000,"value_mid":125000000,"value_high":150000000,"unit":"RUB","basis":"contract_price","period":"2024","source":"https://sapland.ru/p-events/news/1s-vmesto-sap-boli-slozhnosti-preimuschestva-mneniya.html","source_date":"2024-07-04","confidence":"Medium","note":""},
    {"id":"anchor_aeroflot_sap_to_1c","domain":"anchor","geo":"RU","role":"sap_migration","grade":"enterprise","value_low":1000000000,"value_mid":1000000000,"value_high":1000000000,"unit":"RUB","basis":"contract_price","period":"2025","source":"https://30-erp.cnews.ru/content/20s-nowadays","source_date":"2025","confidence":"Medium","note":""},
    {"id":"anchor_mes_phosagro_grant","domain":"anchor","geo":"RU","role":"mes","grade":"large","value_low":318400000,"value_mid":318400000,"value_high":318400000,"unit":"RUB","basis":"grant_amount","period":"2025","source":"https://www.comnews.ru/content/238390/2025-03-21/2025-w12/1008/fosagro-importozamestila-predpriyatie-apatit-srok","source_date":"2025-03-21","confidence":"High","note":""},
    {"id":"anchor_mes_kazan_total","domain":"anchor","geo":"RU","role":"mes","grade":"medium","value_low":226300000,"value_mid":226300000,"value_high":226300000,"unit":"RUB","basis":"total_investment","period":"2025","source":"https://www.komos.ru/press-center/news/32400/","source_date":"2025-05-28","confidence":"High","note":""},
    {"id":"anchor_mes_severstal_total","domain":"anchor","geo":"RU","role":"mes","grade":"large","value_low":1000000000,"value_mid":1000000000,"value_high":1000000000,"unit":"RUB","basis":"total_project_amount","period":"2025","source":"https://www.comnews.ru/content/241454/2025-09-26/2025-w39/1008/severstal-nachnet-oktyabr-cherepovce-zapuska-otechestvennoy-mes-sistemy","source_date":"2025-09-26","confidence":"High","note":""},
    {"id":"anchor_mes_gaz_total","domain":"anchor","geo":"RU","role":"mes","grade":"large","value_low":513000000,"value_mid":513000000,"value_high":513000000,"unit":"RUB","basis":"total_project_amount","period":"2025","source":"https://www.zyfra.com/ru/news/media/gaz-zyfra-2/","source_date":"2025","confidence":"High","note":""},
    {"id":"anchor_cv_typical","domain":"anchor","geo":"RU","role":"computer_vision","grade":"typical","value_low":600000,"value_mid":1800000,"value_high":5000000,"unit":"RUB","basis":"contract_price","period":"2025-2026","source":"https://process-buro.com/solutions/production/kontrol-kachestva-kompyuternym-zreniem","source_date":"2025","confidence":"High","note":""},
    {"id":"anchor_dwh_smb","domain":"anchor","geo":"RU","role":"dwh_bi","grade":"small","value_low":1500000,"value_mid":1750000,"value_high":2000000,"unit":"RUB","basis":"contract_price","period":"2026","source":"https://habr.com/ru/companies/w_code/articles/1022844/","source_date":"2026-04-13","confidence":"Medium","note":""},
    {"id":"anchor_dwh_ibs_min","domain":"anchor","geo":"RU","role":"dwh_bi","grade":"minimum","value_low":20000000,"value_mid":20000000,"value_high":20000000,"unit":"RUB","basis":"contract_price","period":"2025-2026","source":"https://ibs-analytics.ru/analiticheskie-sistemy/classic_dwh/","source_date":"2025","confidence":"Medium","note":""},
    {"id":"anchor_dwh_rosatom","domain":"anchor","geo":"RU","role":"dwh_bi","grade":"enterprise","value_low":1110000000,"value_mid":1110000000,"value_high":1110000000,"unit":"RUB","basis":"contract_price","period":"2023","source":"https://www.cnews.ru/news/top/2023-03-03_rosatom_zapuskaet_gigantskij","source_date":"2023-03-03","confidence":"High","note":""},
    {"id":"anchor_kii_categorization","domain":"anchor","geo":"RU","role":"kii_security","grade":"categorization","value_low":55000,"value_mid":166400,"value_high":277800,"unit":"RUB","basis":"service_price","period":"2025-2026","source":"https://www.altirixgroup.com/napravleniya-deyatelnosti/informaczionnaya-bezopasnost/zakonodatelstvo-i-konsalting/kriticheskaya-informaczionnaya-infrastruktura/kategorirovanie-obektov-kii/","source_date":"2025-05-02","confidence":"High","note":""},
    {"id":"anchor_kii_protection_system","domain":"anchor","geo":"RU","role":"kii_security","grade":"protection","value_low":900000,"value_mid":900000,"value_high":900000,"unit":"RUB","basis":"service_price","period":"2025-2026","source":"https://www.budget-soft.ru/uslugi/zashchita-kii/","source_date":"2025","confidence":"High","note":""},
    {"id":"anchor_gossopka_center","domain":"anchor","geo":"RU","role":"kii_security","grade":"soc","value_low":50400000,"value_mid":50400000,"value_high":50400000,"unit":"RUB","basis":"project_estimate","period":"2025","source":"https://rt-solar.ru/upload/iblock/256/Solar_JSOC_GosSOPKA.pdf","source_date":"2025","confidence":"High","note":""}
  ]
}

```

**JSON notes.** The row set has 113 rows. Salary rows are monthly. Burden rows are annual thresholds or percentage rates. Cost rows are monthly or annual as stated. Rate rows are hourly or daily as stated. Productivity rows use hours per function point, function points per person-month, or hours per period. Anchor rows are project prices or effort counts. Do not sum rows across domains; a salary row and an anchor row are different units.

---

## 11. What is missing and the proxy policy

### 11.1 Gaps in the public record

| Gap | Why it matters | Current treatment | Next action |
|---|---|---|---|
| Russia information security net median | Habr publishes the direction but not the absolute in the article text; hh.ru's 85,300 RUB gross is a vacancy floor, not a senior rate. | 150,000-250,000 RUB/month net, marked Proxy. | Collect 10-20 offers or use an internal grade card. |
| Java absolute median | Habr's H2 2025 article gives the change (+1%) but not the absolute; the chart is an image. | Proxy equals the backend median of 251,000 RUB/month net. | Pull the Habr calculator or a paid survey cut. |
| PM boundary | "PM" can mean project manager, product owner, or team lead. RUIT's 330,000 RUB net is a low-manager bucket, while hh.ru's project-manager figure is much lower. | Use 330,000 RUB/month net for a technical PM or team lead, and about 130,000 RUB/month gross for a non-technical project manager (hh.ru vacancy median). | Define the role in the estimate before choosing a number. |
| Per-seat software licenses | No public per-seat benchmark was found. Vendor list prices are not a market survey. | 50,000-150,000 RUB/developer/year, marked Proxy. | Get three vendor quotes for the actual stack. |
| Corporate workstation total cost | The 97,539 RUB figure covers peripherals, not the laptop or PC. The 150,000-300,000 per three years figure is a derived proxy. | Use the proxy and amortize over 36 months. | Replace with procurement history. |
| Office cost outside Moscow | Only Moscow Class B, Moscow co-working, and a market-average rent were sourced. | Use Moscow as an upper bound and mark regional estimates Proxy. | Get a local lease quote or a regional colliers report. |
| Kazakhstan IT Park regime | The special regime exists, but this data set has no verified rate card. | Not modeled. | Confirm eligibility and rates with a KZ tax adviser. |
| FX rates | RUB, KZT, and USD are not converted. | Kept in original currency. | Apply the central-bank rate on the estimate date and record the rate. |
| T1 and Luxoft rate cards | Luxoft exited Russia after 2022; T1 is private. | No public rate; use the market bands. | Request a quote. |
| Story points and velocity | There is no defensible cross-company conversion. | No global number; local calibration only. | Use the team's own sprint history. |
| ISBSG redistribution | The license is single-user and forbids redistribution. | Use aggregate coefficients, not raw rows, in a shipped product. | Negotiate a distribution license if raw data is required. |
| OpenHub bulk data | Bulk API and data access have changed over time. | Not used; marked uncertain. | Check current terms before relying on it. |
| goszakup IT classifier | The schema has no OKPD2 field. | Classify by `descriptionRu` and subject type. | Build a keyword and manual-review pipeline. |
| zakupki price versus effort | The contract registry gives price, not effort. | Price anchors only. | Pair each price with a scope vector before normalizing. |
| Project anchor scope | Case prices range from 1.5M to 1.11B RUB because scope ranges from an SMB BI package to a national DWH. | Use as order-of-magnitude anchors. | Normalize by users, integrations, sites, data volume, and duration. |
| 1C license versus implementation | The 662,800 RUB base license is not an implementation price. | Keep license and implementation rows separate. | Do not add a license row to an implementation anchor without checking scope. |
| MES grant versus total cost | The PhosAgro 318.4M figure is grant co-financing at 20/80; the total is ambiguous. | Grant amount only; total not asserted. | Read the primary grant agreement. |
| KZ 2025 exact arithmetic | The 2025 social tax offset and OPVR rate differ from 2026. | 2025 rules stated; 2026 worked example used. | Recompute 2025 with the 2025 base definitions if a 2025 payroll is modeled. |
| Severance tax detail | The first three average earnings are outside NDFL and contributions within statutory limits, but the exact regional and contractual treatment varies. | Reserve 2-3 average monthly gross salaries. | Confirm with payroll and legal. |
| ДИАЙПИ average salary | Two public estimates disagree by 3.4x: 42,000 RUB/month for 2025 and 142,700 RUB/month for 2023. | Neither is used as a market benchmark. | Use section 1 medians and the company's own offers. |

**ДИАЙПИ salary ledger, the 42k versus 142k discrepancy.** The project company dossier carries two average-salary estimates for АО «ДИАЙПИ». Neither is a market benchmark.

| Ledger | Value | Unit | Period | Geography | Basis | Source | Confidence |
|---|---:|---|---|---|---|---|---|
| Firmoteka estimate | 42,000 | RUB/month | 2025 | RU, Chelyabinsk | unclear, likely gross | https://firmoteka.ru/6625034780 | Low |
| Payroll-based calculation | 142,700 | RUB/month | 2023 | RU, Chelyabinsk | derived, likely gross | https://www.rusprofile.ru/id/749796 | Low |

The 42,000 figure is 3.4x lower than 142,700 and about 3.9x lower than the all-Russia regions middle of 164,000 RUB/month net in section 1.3. It is almost certainly a data error or a different metric, such as a non-IT or regional average. The 142,700 figure is from 2023 and is stale for 2026. Use neither for the cost model. The 42k figure is the kind of ledger error that can halve an estimate if it is imported without a basis check.

### 11.2 Proxy policy

1. **Source first.** Use a sourced number whenever one exists, even if it is a range. Do not replace a sourced number with an estimate because the estimate looks cleaner.
2. **Label every proxy.** A proxy row must say Proxy in the confidence column and must state its inputs. "Proxy" is not a synonym for "unknown"; it is a documented estimate that must be replaced.
3. **Do not mix net and gross.** Convert first, then compare. Habr medians are net. hh.ru and hh.kz offers are gross. A net number and a gross number can differ by 15-30% before contributions.
4. **Use ranges, not points.** Price with P50 and P75, not a single median. The role medians are central tendencies, not rate cards.
5. **Triangulate.** Any number that moves the project price by more than 10% should have at least two independent sources or one source plus internal data.
6. **Normalize anchors.** A project price is not an effort. Pair it with a scope vector before using it in an analogue.
7. **Recalibrate salaries.** Replace the market medians with your own offer history before the final bid. The medians are a starting band, not a commitment.
8. **State the date and the rate.** Salaries, taxes, and rates move. Record the period and the FX rate in every estimate.
9. **Respect licenses.** ISBSG data cannot be redistributed without a distribution license. PROMISE data sets have their own terms. Check before shipping.
10. **Keep an audit trail.** Every row in the JSON has a source and a source date. If you override a row, add a new row rather than editing the source row.

### 11.3 Confidence policy

| Confidence | Use it when | Example |
|---|---|---|
| High | A primary source or official statistic states the value directly, or a named survey reports it with a clear basis. | FNS contribution rate; hh.kz median; ISBSG PDR. |
| Medium | A reputable secondary source, a survey with a small sample, or arithmetic from High inputs. | Derived contribution cap table; 1C ERP medium range; DWH minimum from a vendor. |
| Low | A blog compilation, a small or biased sample, or a figure with an ambiguous basis. | Role-by-grade bands from a blog; a 2023 case price used as a 2026 anchor. |
| Proxy | No defensible public benchmark exists. The value is built from sourced components and must be replaced. | Per-seat licenses; regional office cost; information security net median; Java absolute. |

### 11.4 Ledger discrepancy register

| Discrepancy | Ledger A | Ledger B | Resolution |
|---|---|---|---|
| Habr net versus hh gross | Habr all-IT median 183,333 RUB/month net, 2025-H2, https://habr.com/ru/specials/994308/ | hh.ru all-IT vacancy median 96,300 RUB/month gross, 2025, https://habr.com/ru/companies/hh/articles/1010834/ | Different bases and samples. Use Habr for role bands and hh.ru for the floor. Do not average. |
| Habr versus RUIT | Habr all-IT median 183,333 RUB/month net, 2025-H2 | RUIT all-role median 252,000 RUB/month self-reported, 2025-H2, https://ruitunion.org/posts/2025-10-13-it-specialist-salaries-in-the-second-half-of-2025/ | RUIT skews middle and senior. Use RUIT for the grade ladder, not for the all-market median. |
| hh.kz versus developer survey | hh.kz developer median 359,198 KZT/month, 2025, https://hh.kz/article/34221 | Developer survey median 960,000 KZT/month, 2025, https://digitalbusiness.kz/2025-02-07/bolshe-1-mln-tenge-stala-izvestna-srednyaya-zarplata-razrabotchikov-v-kazahstane/ | Vacancy ledger versus self-reported ledger. Use hh.kz as the floor and the survey as the experienced-hire band. |
| ДИАЙПИ average salary | 42,000 RUB/month, 2025, https://firmoteka.ru/6625034780 | 142,700 RUB/month, 2023, derived from https://www.rusprofile.ru/id/749796 | Both are unreliable for a market benchmark. The 42,000 figure is implausibly low; the 142,700 figure is stale. Use section 1 medians and internal offers. |
| ISBSG "7-8 FP per person-month" | Repeated claim: 7-8 FP/person-month | ISBSG headline: 6.5-7.0 hours/FP, https://www.isbsg.org/wp-content/uploads/2022/05/Short-Paper-2021-10-Use-of-Output-Based-KPIs-in-AD-Contracts.pdf | The claim misreads hours per FP as FP per month. Correct range is 16-25 FP/person-month at 160 hours/month. |
| RU full-cost multiplier | Rule of thumb: 1.30-1.60x gross, 1.45-1.65x net | Derived full cost: 1.30-1.65x gross, 1.50-1.85x net | The net rule understates a Moscow workplace. State whether office, hardware, and licenses are included. |
| MES grant versus total | PhosAgro grant 318.4M RUB at 20/80, https://www.comnews.ru/content/238390/2025-03-21/2025-w12/1008/fosagro-importozamestila-predpriyatie-apatit-srok | Severstal total 1B RUB, GAZ total 513M RUB | Grant and total project cost are different units. Do not compare or multiply without the primary agreement. |
| DWH minimum | 1.5M RUB SMB BI, https://www.qlever.ru/press/zachem-biznesu-nuzhno-dwh-i-kak-obosnovat-neobhodimost-proekta | 20M RUB IBS minimum; 1.11B RUB Rosatom, https://ibs-analytics.ru/analiticheskie-sistemy/classic_dwh/ | Scope differences: SMB package, enterprise minimum, national platform. Normalize before comparing. |
| 1C ERP range | 1-3M RUB small business, https://balns.ru/info/articles/skolko-stoit-vnedrenie-1s-erp-v-2025-godu-podrobnyy-obzor-rynka-faktorov-i-resheniy/ | 100M+ RUB complex plant, https://fto.com.ru/blog/stoimost-proekta-po-perehodu-na-1s-erp-primer-realnogo-kejsa/ | User count, integration count, and duration differ by orders of magnitude. Use a scope vector. |
| KZ 2025 versus 2026 | 2025: social tax 11% minus 5% SO, OPVR 2.5% | 2026: social tax 6%, OPVR 3.5%, no offset | Same approximate total, different composition. Do not apply 2026 rates to 2025 payroll. |
| Aeroflot versus typical SAP migration | Aeroflot about 1B RUB, https://30-erp.cnews.ru/content/20s-nowadays | Typical large enterprise 100-150M RUB for 1C, https://sapland.ru/p-events/news/1s-vmesto-sap-boli-slozhnosti-preimuschestva-mneniya.html | Aeroflot is an enterprise-scale outlier. Use it as a ceiling, not a median. |
| VTB24 versus Rosatom DWH | VTB24 about 33M USD, 2012-2015 | Rosatom 1.11B RUB, 2023, https://www.cnews.ru/news/top/2023-03-03_rosatom_zapuskaet_gigantskij | Different eras, currencies, and scopes. Do not compare without normalization. |
| Python median | hh.ru offered 165,000 RUB/month gross, 2025, https://www.cnews.ru/news/line/2025-09-22_skolko_rabotodateli_gotovy | Habr 229,000 RUB/month net, 2025-H2, https://habr.com/ru/specials/994308/ | Vacancy versus self-reported, gross versus net. Use both, with the basis stated. |
| QA median | RUIT 200,000 RUB/month net, 2025-H2, https://ruitunion.org/posts/2025-10-13-it-specialist-salaries-in-the-second-half-of-2025/ | JobAspect 130,000 RUB/month gross, Q4 2025, https://www.jobaspect.ru/hr-analitika/it-specialisty/ | RUIT is self-reported and skews senior; JobAspect is a vacancy median. Use RUIT for a grade-card cross-check and JobAspect for a market floor. |

---

## Appendix: source index

Every source URL used in this document is listed below. URLs are grouped by the section where they first appear. Duplicate and truncated variants are collapsed to the longest canonical form.

- http://promise.site.uottawa.ca/SERepository/datasets-page.html
- http://promise.site.uottawa.ca/SERepository/datasets/desharnais.arff
- https://30-erp.cnews.ru/content/20s-nowadays
- https://aif.ru/realty/price/ofis-na-domu-skolko-stoit-obustroit-rabochee-mesto-dlya-udalen
- https://aiservicescompanies.com/research/offshore-ai-development-rates-2026/
- https://arkona-softlab.ru/products/arkona-data-warehouse
- https://balns.ru/info/articles/skolko-stoit-vnedrenie-1s-erp-v-2025-godu-podrobnyy-obzor-rynka-faktorov-i-resheniy/
- https://beon.tech/blog/software-developer-hourly-rates/
- https://codelabs.developers.google.com/codelabs/bigquery-github
- https://codeorigins.am/services/outsourcing-to-armenia
- https://codingteam.ru/blog/autsorsing-razrabotchikov-v-2025-kogda-vigodnee-na
- https://companies.rbc.ru/id/1056601489010-ao-didzhital-ajron-pajp/
- https://companium.ru/id/1056601489010-diaypi
- https://data.apicrafter.ru/packages/govspending44fz
- https://deepwiki.com/igrigorik/gharchive.org/3.3-bigquery-schema
- https://digitalbusiness.kz/2025-02-07/bolshe-1-mln-tenge-stala-izvestna-srednyaya-zarplata-razrabotchikov-v-kazahstane/
- https://digitalbusiness.kz/2025-10-22/skolko-platyat-analitikam-v-kazahstane-dannie-kolesa-group/
- https://doi.org/10.5277/e-inf180102
- https://doi.org/10.5522/04/21308124
- https://esres.ru/price
- https://files.k2.tech/view.php?file=Issledovanie_gotovnosti_subektov_KII_k_ispolneniju_zakonodatelstv%D0%B0.pdf
- https://firmoteka.ru/6625034780
- https://fortech.dev/services/backend/1c/
- https://fto.com.ru/blog/stoimost-proekta-po-perehodu-na-1s-erp-primer-realnogo-kejsa/
- https://github.com/Derek-Jones/Software-estimation-datasets
- https://github.com/NaCode-Studios/metis-benchmark/blob/main/src/metis_benchmark/datasets/registry.py
- https://github.com/aferamb/models_effort_estimation/blob/a4e14af1/data/raw/china.arff
- https://gosplan.info/docs/guides/contracts/
- https://habr.com/ru/articles/827656/
- https://habr.com/ru/articles/869934/
- https://habr.com/ru/articles/981704/
- https://habr.com/ru/companies/habr_career/articles/1075936/
- https://habr.com/ru/companies/hh/articles/1010834/
- https://habr.com/ru/companies/w_code/articles/1022844/
- https://habr.com/ru/specials/936618/
- https://habr.com/ru/specials/994308/
- https://hh.kz/article/33667
- https://hh.kz/article/34221
- https://hiring-elixir.com/wp-content/themes/hiring-elixir/assets/Salary%20guide%202025.pdf
- https://i-erp.ru/skolko-stoit-vnedrenie-1-na-proizvodstve
- https://ibs-analytics.ru/analiticheskie-sistemy/classic_dwh/
- https://infoculture.github.io/finguide/data-sources/federal/zakupki-xml
- https://int223.zakupki.gov.ru/eis-integration/services/getDocsMis2
- https://int44.zakupki.gov.ru/eis-integration/services/getDocsMis2
- https://itviar.ru/stati/services-stati/autstaffing/stoimost-autstaffinga-1s-v-2026-godu/
- https://kontur.ru/articles/87618-vyplaty_pri_sokraschenii_shtata
- https://kst.kgd.gov.kz/ru/news/izmeneniya-po-socialnomu-nalogu-v-2026-godu-12-163416
- https://media.kf.expert/lenta_analytics/0/889/NF%20GROUP%20_Office%20market%20report_Moscow_Q3%20_2025.pdf
- https://news.donstu.ru/news/v-dgtu-razrabatyvayut-sistemu-kompyuternogo-zreniya-dlya-vyyavleniya-defektov-detaley-pri-proizvodst
- https://osn.kz/blog/it-outsourcing-kazakhstan-2025
- https://ovodov.su/prices
- https://ows.goszakup.gov.kz/help/
- https://ows.goszakup.gov.kz/help/v3/schema/contract.doc.html
- https://ows.goszakup.gov.kz/help/v3/schema/query.doc.html
- https://process-buro.com/solutions/production/kontrol-kachestva-kompyuternym-zreniem
- https://prosharing.ru/spros-na-autstaffing-vyros-pochti-v-poltora-raza-v-tretem-kvartale-2025-goda/
- https://rt-solar.ru/upload/iblock/256/Solar_JSOC_GosSOPKA.pdf
- https://ru.wadline.com/rates
- https://ruitunion.org/posts/2025-10-13-it-specialist-salaries-in-the-second-half-of-2025/
- https://sapland.ru/p-events/news/1s-vmesto-sap-boli-slozhnosti-preimuschestva-mneniya.html
- https://security-electronics.ru/
- https://sigma.software/insights/software-outsourcing-to-central-asia-uzbekistan-kazakhstan-azerbaijan
- https://static.energy-agency.ru/eevents/230425/1-viktoriya-goryacheva-nikoliers.pdf
- https://tapmes.ru/cases.html
- https://tendergos.ru/vygruzka-reestra-kontraktov-iz-eis/
- https://thecode.media/zarplaty-it-specialistov-v-konce-2025/
- https://totalmetrics.com/function-points/Software-Productivity-Government-ISBSG.pdf
- https://turtlebyte.in/blog/software-development-rates-by-country
- https://uppersetup.com/ru/blog/employer-payroll-taxes-and-contributions-in-kazakhstan-2026
- https://vko.kgd.gov.kz/ru/news/osnovnye-izmeneniya-v-nalogovom-kodekse-rk-s-1-yanvarya-2026-goda-chto-vazhno-znat-o-ipn-i
- https://vko.kgd.gov.kz/ru/news/socialnye-platezhi-v-respublike-kazahstan-8-160454
- https://www.accelerance.com/blog/2026-outsourcing-rate-trends-asia-europe-latam
- https://www.altirixgroup.com/napravleniya-deyatelnosti/informaczionnaya-bezopasnost/zakonodatelstvo-i-konsalting/kriticheskaya-informaczionnaya-infrastruktura/kategorirovanie-obektov-kii/
- https://www.arendator.ru/news/189526-stavki_arendy_ofisov_klassa_v_v_moskve_vyrosli_na_19_za_god/
- https://www.budget-soft.ru/uslugi/zashchita-kii/
- https://www.cmwp.ru/news/po-itogam-1-kv-2025-g-srednevzveshennaya-bazovaya-stavka-arendy-po-rynku-sostavila-28-899-rub-kv-m-g/
- https://www.cnews.ru/news/line/2025-05-29_prof-it_group_podderzhit_proekt
- https://www.cnews.ru/news/line/2025-09-22_skolko_rabotodateli_gotovy
- https://www.cnews.ru/news/line/2025-12-15_za_pyat_let_predlagaemye
- https://www.cnews.ru/news/top/2023-03-03_rosatom_zapuskaet_gigantskij
- https://www.cnews.ru/reviews/zakaznaya_razrabotka_po_2025/articles/v_zakaznoj_razrabotke_stali_platit
- https://www.comnews.ru/content/238390/2025-03-21/2025-w12/1008/fosagro-importozamestila-predpriyatie-apatit-srok
- https://www.comnews.ru/content/241454/2025-09-26/2025-w39/1008/severstal-nachnet-oktyabr-cherepovce-zapuska-otechestvennoy-mes-sistemy
- https://www.consultant.ru/document/cons_doc_LAW_28165/a3f603ffd57b1431ed51e1693ba710093347235d/
- https://www.consultant.ru/document/cons_doc_LAW_34683/0526867a7eace3f1f88798592ed0bdf3589f0528/
- https://www.consultant.ru/document/cons_doc_LAW_518016/
- https://www.cs.bsu.edu/homepages/dmz/cs697/langtbl.htm
- https://www.dp.ru/a/2025/11/12/roboti-vsjo-vidjat
- https://www.garant.ru/actual/nalog/ndfl/
- https://www.gharchive.org/
- https://www.inform.kz/ru/bolee-800-tisyach-tenge-zarabativayut-it-spetsialisti-v-kazahstane-61f86a
- https://www.isbsg.org/development-and-enhancement-data/
- https://www.isbsg.org/product/project-data-subscription/
- https://www.isbsg.org/resources-productivity/
- https://www.isbsg.org/subscriptions/
- https://www.isbsg.org/wp-content/uploads/2021/08/b.-LICENSE-AGREEMENT-Development-Enhancement-data-Repository-2021R1.pdf
- https://www.isbsg.org/wp-content/uploads/2022/05/Short-Paper-2021-10-Use-of-Output-Based-KPIs-in-AD-Contracts.pdf
- https://www.isbsg.org/wp-content/uploads/2025/01/2024-12-Manpower-Delivery-Rate.pdf
- https://www.isbsg.org/wp-content/uploads/2025/05/Short-Paper-2025-05-ISBSG-Overview.pdf
- https://www.jobaspect.ru/hr-analitika/it-specialisty/
- https://www.klerk.ru/buh/articles/669936/
- https://www.klerk.ru/materials/2025-10-06/skolko-stoit-chas-raboty-programmista/
- https://www.komos.ru/press-center/news/32400/
- https://www.nalog.gov.ru/rn32/news/seminar/16610341/
- https://www.nalog.gov.ru/rn38/taxation/taxes/ndfl/16453713/
- https://www.nalog.gov.ru/rn77/news/activities_fts/16577139/
- https://www.nep-group.ru/cases/importozameshchenie-realizovali-perehod-iz-sap-v-1s-erp
- https://www.qlever.ru/press/zachem-biznesu-nuzhno-dwh-i-kak-obosnovat-neobhodimost-proekta
- https://www.retail.ru/cases/dobroflot-vnedril-mashinnoe-zrenie-na-konservnoy-linii-i-sekonomil-dva-milliona-rubley/
- https://www.rusprofile.ru/id/749796
- https://www.tadviser.ru/index.php/%D0%9F%D1%80%D0%BE%D0%B5%D0%BA%D1%82:%D0%92%D0%A2%D0%9124_(Teradata_Active_Enterprise_Data_Warehouse_6750_(Teradata_Active_EDW
- https://www.tenderguru.ru/api/documentation/contracts
- https://www.tn.ru/about/press/news/tekhnonikol-investiruet-v-tsifrovye-proekty-dlya-remonta-podmoskovnogo-zavoda/
- https://www.trillioncredit.ru/blog/zarplaty-v-it/
- https://www.zyfra.com/ru/news/media/gaz-zyfra-2/
- https://xonsecurity.ru/services/organizatsiya-zashchity-kii/
- https://zan.kz/kk/news/Details?id=629
- https://zenodo.org/records/268419
- https://zenodo.org/records/268424
- https://zenodo.org/records/268446
- https://zenodo.org/records/268457
- https://zenodo.org/records/268461
- https://zenodo.org/records/4312777
- https://zenodo.org/records/7022735
