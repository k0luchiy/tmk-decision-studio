# IT Work Estimation: A Mathematical Methodology

**Version 1.0 · research date 2026-11-08**

This document is the mathematical backbone for an IT-work estimation tool. It covers sizing, judgment, probabilistic aggregation, empirical failure evidence, staffing physics, in-house versus outsourced economics, risk quantification, market-analogue data, and an implementation blueprint.

**Evidence tags**

| Tag | Meaning |
|---|---|
| **[CANON]** | Published calibration, standard definition, or statutory rate. |
| **[EMPIRICAL]** | Dataset-derived median, observed range, or measured result. |
| **[RULE OF THUMB]** | Practitioner heuristic. Useful as a prior, not as a law. Calibrate before trusting. |
| **[DISPUTED]** | Contested, deprecated, version-dependent, or known to be internally inconsistent. |

**Tag scope.** A tag on a section heading applies to every constant in that subsection unless a row or sentence carries its own tag. A tag in a table caption or in a cell applies to that row. Untagged prose numbers inherit the nearest preceding tag.

---

## TL;DR

The tool should keep four quantities separate: **size**, **effort**, **duration**, and **cost plus risk**. Most estimation errors come from collapsing them into one number too early.

**Canonical spine**

1. **Size:** IFPUG function points for business applications, COSMIC function points for real-time and layered systems, KSLOC for COCOMO II, use-case points for early UML work, object points for prototyping.
2. **Effort:** COCOMO II.2000 for greenfield work with known architecture, UCP for early use-case work, ISBSG project delivery rate for analogue-based estimates.
3. **Duration:** COCOMO II TDEV for greenfield, critical path or PERT for WBS-based work, Rayleigh staffing as a realism check.
4. **Uncertainty:** lognormal Monte Carlo with correlation, plus reference class forecasting for the outside view.
5. **Economics:** fully loaded in-house cost per person-month versus outsourced rate times coordination, transition, governance, and risk.

**Canonical constants at a glance**

| Constant | Value | Tag |
|---|---:|---|
| COCOMO II.2000 \(A\) | 2.94 | [CANON] |
| COCOMO II.2000 \(B\) | 0.91 | [CANON] |
| COCOMO II.2000 \(C\) | 3.67 | [CANON] |
| COCOMO II.2000 \(D\) | 0.28 | [CANON] |
| COCOMO hours per person-month | 152 | [CANON] |
| UCP default productivity | 20 h/UCP | [CANON] default |
| ISBSG traditional median PDR | 8.3 h/FP | [EMPIRICAL] |
| RU employer statutory burden | 30% up to cap | [CANON] law, 2026 |
| KZ employer statutory burden | 17.5% | [CANON] law, 2026 |
| Budget confidence target | P80 | [RULE OF THUMB] |

**The three formulas that matter most**

\[
PM_{NS}=2.94\cdot Size^{E}\cdot\prod EM_i,\qquad E=0.91+0.01\sum SF_j
\]

\[
P_{80}=e^{\mu+0.8416\sigma},\qquad \mu=\frac{\ln P_{10}+\ln P_{90}}{2},\quad \sigma=\frac{\ln P_{90}-\ln P_{10}}{2\cdot1.2816}
\]

\[
Q^{*}=\frac{F}{r(1+c_c)-c_i}
\]

The first turns size into effort. The second turns a range into a budget. The third tells you when in-house becomes cheaper than outsourcing.

---

## 1. Sizing layer

### 1.1 COCOMO II family

#### Version history and status

| Version | Calibration data | Method | Status |
|---|---:|---|---|
| COCOMO 81 | 63 projects | Multiple linear regression | Historical contrast |
| COCOMO II.1997 | 83 projects | Weighted regression | Superseded |
| COCOMO II.1998 | 161 projects | Bayesian calibration | Superseded |
| **COCOMO II.2000** | **161 projects** | **Bayesian, manual v2.1** | **Canonical** |
| COCOMO III | Not publicly calibrated | Draft | In development since 2016 |

COCOMO II.2000, published in the *COCOMO II Model Definition Manual* v2.1, is the current canonical model. COCOMO III has been in development since 2016. As of 2025-2026 it remains a draft and is not a calibrated public model. ([Boehm CSSE models](https://boehmcsse.org/tools/cocomo-models/), [COCOMO III page](https://boehmcsse.org/tools/cocomo-iii/), [Clark 2022 DHS presentation](https://www.dhs.gov/sites/default/files/2023-01/Clark_Introducting_COCOMO_III_v1_Remediated.pdf))

#### Version confusion: the most common implementation error

- **COCOMO II.2000:** \(A=2.94\), \(B=0.91\), \(C=3.67\), \(D=0.28\).
- **2.5 and 2.45** are pre-2000 COCOMO II calibration values. Do not mix them with II.2000.
- **3.0** is the **COCOMO 81 semi-detached \(a\)**, not a COCOMO II.2000 constant. It also appears in simplified teaching examples such as \(PM=3.0\cdot KSLOC^{1.12}\), which is COCOMO 81, not COCOMO II.2000.
- **0.28** is \(D\), the base schedule exponent, not an effort constant.
- There is no official “COCOMO II.0” with a separate canonical constant set. “II.0” in papers usually means a pre-2000 calibration.

Sources: [COCOMO II.2000 manual, Otago mirror](https://www.cs.otago.ac.nz/cosc345/resources/COCOMO-II-2000.pdf), [Rose-Hulman mirror](https://www.rose-hulman.edu/class/csse/csse372/201410/Homework/CII_modelman2000.pdf), [DataCamp note on the 2.5 value](https://www.datacamp.com/tutorial/cocomo-model).

#### Post-Architecture effort equation [CANON]

\[
PM_{NS}=A\cdot Size^{E}\cdot\prod_{i=1}^{n}EM_i
\]

\[
E=B+0.01\sum_{j=1}^{5}SF_j
\]

\[
PM=PM_{NS}\cdot EM_{SCED}
\]

Definitions:

- \(Size\) is KSLOC, or UFP converted to SLOC and divided by 1,000.
- \(PM\) is person-months. One nominal person-month is **152 hours** [CANON].
- \(PM_{NS}\) excludes the SCED effort multiplier. SCED is applied separately to effort and also enters the schedule equation.
- \(n\) is **17** in the canonical Post-Architecture cost-driver set, including TOOL. The manual’s prose says “16” in places while its own tables and later text say “17.” Treat this as a published inconsistency and document your choice. ([manual](https://www.cs.otago.ac.nz/cosc345/resources/COCOMO-II-2000.pdf))

#### Schedule equation [CANON]

\[
TDEV_{NS}=C\cdot PM_{NS}^{F}
\]

\[
F=D+0.2(E-B)=0.28+0.2(E-0.91)
\]

\[
TDEV=TDEV_{NS}\cdot\frac{SCED\%}{100}
\]

- \(SCED\%\) is 100 at nominal schedule. The rated compression and stretch levels are 75, 85, 130, and 160.
- Some sources write SCED as a fraction, for example 1.0 rather than 100. Pick one convention and enforce it in code.
- For II.2000, \(F\) ranges from **0.28** to **0.3432** as \(E\) moves from 0.91 to 1.2262.
- Manual worked example: 100 KSLOC, \(E=1.15\), all EMs at 1.0 gives \(PM=586.6\), \(TDEV=29.7\) months, and average staff of 19.75. ([manual](https://www.cs.otago.ac.nz/cosc345/resources/COCOMO-II-2000.pdf))

#### Scale factors, five drivers by six ratings [CANON]

| Driver | Very Low | Low | Nominal | High | Very High | Extra High |
|---|---:|---:|---:|---:|---:|---:|
| PREC | 6.20 | 4.96 | 3.72 | 2.48 | 1.24 | 0.00 |
| FLEX | 5.07 | 4.05 | 3.04 | 2.03 | 1.01 | 0.00 |
| RESL | 7.07 | 5.65 | 4.24 | 2.83 | 1.41 | 0.00 |
| TEAM | 5.48 | 4.38 | 3.29 | 2.19 | 1.10 | 0.00 |
| PMAT | 7.80 | 6.24 | 4.68 | 3.12 | 1.56 | 0.00 |

Extra High is 0 for all five drivers. Maximum \(\sum SF=31.62\), so \(E_{\max}=0.91+0.3162=1.2262\). Source: COCOMO II.2000 manual, Table 10. ([manual](https://www.cs.otago.ac.nz/cosc345/resources/COCOMO-II-2000.pdf))

#### Post-Architecture effort multipliers, 17 drivers [CANON]

| Driver | Very Low | Low | Nominal | High | Very High | Extra High |
|---|---:|---:|---:|---:|---:|---:|
| RELY | 0.82 | 0.92 | 1.00 | 1.10 | 1.26 | n/a |
| DATA | n/a | 0.90 | 1.00 | 1.14 | 1.28 | n/a |
| CPLX | 0.73 | 0.87 | 1.00 | 1.17 | 1.34 | 1.74 |
| RUSE | n/a | 0.95 | 1.00 | 1.07 | 1.15 | 1.24 |
| DOCU | 0.81 | 0.91 | 1.00 | 1.11 | 1.23 | n/a |
| TIME | n/a | n/a | 1.00 | 1.11 | 1.29 | 1.63 |
| STOR | n/a | n/a | 1.00 | 1.05 | 1.17 | 1.46 |
| PVOL | n/a | 0.87 | 1.00 | 1.15 | 1.30 | n/a |
| ACAP | 1.42 | 1.19 | 1.00 | 0.85 | 0.71 | n/a |
| PCAP | 1.34 | 1.15 | 1.00 | 0.88 | 0.76 | n/a |
| PCON | 1.29 | 1.12 | 1.00 | 0.90 | 0.81 | n/a |
| APEX | 1.22 | 1.10 | 1.00 | 0.88 | 0.81 | n/a |
| PLEX | 1.19 | 1.09 | 1.00 | 0.91 | 0.85 | n/a |
| LTEX | 1.20 | 1.09 | 1.00 | 0.91 | 0.84 | n/a |
| TOOL | 1.17 | 1.09 | 1.00 | 0.90 | 0.78 | n/a |
| SITE | 1.22 | 1.09 | 1.00 | 0.93 | 0.86 | 0.80 |
| SCED | 1.43 | 1.14 | 1.00 | 1.00 | 1.00 | n/a |

Source: [COCOMO II.2000 Post-Architecture effort multipliers, 17 cost drivers](http://staff.um.edu.mt/ecac1/files/COCOMOII_PostArchitecture_EffortMultipliers_17CostDrivers.pdf), consistent with the manual. The published manual says “16” in prose but lists 17; use 17 for Post-Architecture and document the choice. [DISPUTED]

#### Early Design composite multipliers [CANON]

Early Design uses 7 composite multipliers rather than the 17 Post-Architecture drivers.

| Driver | Extra Low | Very Low | Low | Nominal | High | Very High | Extra High |
|---|---:|---:|---:|---:|---:|---:|---:|
| PERS (ACAP, PCAP, PCON) | 2.12 | 1.62 | 1.26 | 1.00 | 0.83 | 0.63 | 0.50 |
| RCPX (RELY, DATA, CPLX, DOCU) | 0.49 | 0.60 | 0.83 | 1.00 | 1.33 | 1.91 | 2.72 |
| PDIF (TIME, STOR, PVOL) | n/a | n/a | 0.87 | 1.00 | 1.29 | 1.81 | 2.61 |
| PREX (APEX, PLEX, LTEX) | 1.59 | 1.33 | 1.12 | 1.00 | 0.87 | 0.74 | 0.62 |
| FCIL (TOOL, SITE) | 1.43 | 1.30 | 1.10 | 1.00 | 0.87 | 0.73 | 0.62 |
| RUSE | n/a | n/a | 0.95 | 1.00 | 1.07 | 1.15 | 1.24 |
| SCED | n/a | 1.43 | 1.14 | 1.00 | 1.00 | 1.00 | n/a |

Source: [COCOMO II.2000 Early Design composite cost drivers](http://staff.um.edu.mt/ecac1/files/COCOMOII_EarlyDesign_CompositeCostDrivers.pdf).

#### Application Composition and object points [CANON]

For prototyping and ICASE-composed applications, COCOMO II uses object points instead of KSLOC.

\[
OP=\sum_{type}\sum_{complexity}count_{type,complexity}\cdot w_{type,complexity}
\]

\[
NOP=OP\cdot\frac{100-\%reuse}{100}
\]

\[
PM=\frac{NOP}{PROD}
\]

Object-point complexity weights:

| Object type | Simple | Medium | Difficult |
|---|---:|---:|---:|
| Screen | 1 | 2 | 3 |
| Report | 2 | 5 | 8 |
| 3GL component | 10 | 10 | 10 |

Productivity \(PROD\), in NOP per person-month:

| Developer experience and ICASE maturity | Very Low | Low | Nominal | High | Very High |
|---|---:|---:|---:|---:|---:|
| PROD | 4 | 7 | 13 | 25 | 50 |

Source: [COCOMO II manual, object-point section](https://www.cs.montana.edu/courses/spring2004/352/public/cocomo/modelman.pdf). Screens are classified by number of views and data tables. Reports are classified by sections and data tables. The canonical 3GL weight is a single 10.

#### Local calibration [CANON method, EMPIRICAL data]

The manual recommends calibrating at least \(A\) and \(C\). For a local dataset:

\[
\ln PM=\ln A+E\ln Size+\sum\ln EM_i
\]

Estimate \(A\) and \(B\) by regression on log-transformed data, or use Bayesian calibration as in COCOMO II.1998.

Report:

\[
MMRE=\frac{1}{n}\sum_i\frac{|pred_i-actual_i|}{actual_i}
\]

\[
PRED(25)=\frac{\#\{i:|pred_i-actual_i|/actual_i\le0.25\}}{n}
\]

Calibration evidence:

- COCOMO II.1997 achieved PRED(30) of 52% [EMPIRICAL].
- COCOMO II.1998 achieved PRED(30) of 71% on 161 projects [EMPIRICAL].
- Hira (2020) calibrated COCOMO II directly on IFPUG FP and COSMIC CFP, achieving PRED(25) of 68% for FP and 70% for CFP, versus 36% and 38% for the best alternative [EMPIRICAL].

Sources: [1998 calibration paper](https://dl.icdst.org/pdfs/files/8c4dc66410f39402092a65650a4418ca.pdf), [Hira slides](https://www.dhs.gov/sites/default/files/publications/200827_calibratingcocomoiiforfsm_hira.pdf), [Hira dissertation](https://doi.org/10.25549/usctheses-c89-366241).

Use the Hira functional-size calibration when your product sizes in FP or CFP and you do not want a lossy FP-to-SLOC conversion.

#### COCOMO 81 constants for contrast [CANON]

\[
PM=a\cdot KSLOC^b,\qquad TDEV=c\cdot PM^d
\]

| Mode | a | b | c | d |
|---|---:|---:|---:|---:|
| Organic | 2.4 | 1.05 | 2.5 | 0.38 |
| Semi-detached | 3.0 | 1.12 | 2.5 | 0.35 |
| Embedded | 3.6 | 1.20 | 2.5 | 0.32 |

Source: [COCOMO 81 constants](https://athena.ecs.csus.edu/~buckley/CSc231_files/COCOMO.pdf). This table is the origin of the “3.0” confusion.

---

### 1.2 IFPUG function points

IFPUG counts five functional component types. Complexity is determined by DETs (data element types), RETs (record element types), and FTRs (file types referenced).

| Component | Low | Average | High |
|---|---:|---:|---:|
| Internal Logical File (ILF) | 7 | 10 | 15 |
| External Interface File (EIF) | 5 | 7 | 10 |
| External Input (EI) | 3 | 4 | 6 |
| External Output (EO) | 4 | 5 | 7 |
| External Query (EQ) | 3 | 4 | 6 |

\[
UFP=\sum ILF+\sum EIF+\sum EI+\sum EO+\sum EQ
\]

The canonical counting rules are IFPUG CPM 4.3 and 4.3.1, aligned with ISO/IEC 20926. ([IFPUG CPM 4.3 release](https://ifpug.org/2009/10/01/the-international-function-point-users-group-announces-the-release-of-version-4-3-of-the-counting-practices-manual))

#### Value Adjustment Factor [DISPUTED]

\[
VAF=0.65+0.01\sum_{i=1}^{14}GSC_i
\]

- Each General System Characteristic is rated 0 to 5.
- \(\sum GSC\in[0,70]\), so \(VAF\in[0.65,1.35]\).
- \(AFP=UFP\times VAF\).

**Important:** in CPM 4.3 and later, the 14 GSCs and VAF are optional. The ISO-compliant functional size is the **unadjusted** FP count. ISBSG reports unadjusted FP. Do not use VAF by default. ([Total Metrics note on VAF](https://totalmetrics.com/help/Managing_your_Function_Point_Counts/Managing_Applications_Projects_and_Counts/Value_Adjustment_Factor/Assessing_the_Value_Adjustment_Factor.htm), [function-point fundamentals with the formula](https://www.jodypaul.com/SWE/FunctionPointAnalysisFundamentals.pdf))

**RCAF and reuse:** IFPUG has no universal “RCAF.” Reuse adjustment is model-specific. COCOMO II has a reuse model, and vendors price reuse through rate cards or licensing. Do not invent a universal reuse adjustment factor.

---

### 1.3 COSMIC function points

COSMIC is defined by ISO/IEC 19761:2011, reconfirmed in 2019. The Measurement Manual v5.0 is dated September 2024. ([COSMIC Measurement Manual v5.0](https://cosmic-sizing.org/wp-content/uploads/2022/11/Combination-of-Parts-v5.0-Sep-2024.pdf), [manual page](https://cosmic-sizing.org/measurement-manual/))

COSMIC counts **data movements**:

- **Entry (E):** a data group enters the software across the boundary.
- **Exit (X):** a data group exits across the boundary.
- **Read (R):** a data group is retrieved from persistent storage.
- **Write (W):** a data group is written to persistent storage.

Counting rules:

1. A functional process is triggered by an Entry and contains at least one Entry plus one Exit or Write.
2. Each data movement is **1 CFP** [CANON].
3. Count types, not occurrences.
4. A data group is a unique set of attributes describing one object of interest.
5. Functional size of a process:

\[
CFP_{process}=\#Entry+\#Exit+\#Read+\#Write
\]

6. Software size is the sum over functional processes.

**No adjustment factors.** COSMIC deliberately has no VAF or GSC layer. This is a fundamental difference from IFPUG.

**Do not sum IFPUG FP and CFP.** They are different units. Convert only through a calibrated local mapping, never with a universal ratio.

---

### 1.4 Use Case Points

\[
UUCP=UAW+UUCW
\]

\[
UCP=UUCP\cdot TCF\cdot ECF
\]

\[
Effort=UCP\cdot PF
\]

Actor weights, \(UAW\):

| Actor type | Weight |
|---|---:|
| Simple | 1 |
| Average | 2 |
| Complex | 3 |

Use-case weights, \(UUCW\):

| Use-case type | Transactions | Weight |
|---|---|---:|
| Simple | 1 to 3 | 5 |
| Average | 4 to 7 | 10 |
| Complex | more than 7 | 15 |

Technical Complexity Factor:

\[
TCF=0.6+0.01\sum_{i=1}^{13}w_i v_i
\]

Environmental Complexity Factor:

\[
ECF=1.4-0.03\sum_{i=1}^{8}w_i v_i
\]

where each \(v_i\in[0,5]\).

Standard Karner weights:

| TCF factor | Weight | ECF factor | Weight |
|---|---:|---|---:|
| Distributed system | 2 | Familiar with RUP | 1.5 |
| Response time | 1 | Application experience | 0.5 |
| End-user efficiency | 1 | Object-oriented experience | 1.0 |
| Complex internal processing | 1 | Lead analyst capability | 0.5 |
| Reusable code | 1 | Motivation | 1.0 |
| Easy to install | 0.5 | Stable requirements | 2.0 |
| Easy to use | 0.5 | Part-time workers | -1.0 |
| Portable | 2 | Difficult programming language | -2.0 |
| Easy to change | 1 | | |
| Concurrent | 1 | | |
| Special security | 1 | | |
| Third-party access | 1 | | |
| Special user training | 1 | | |

Source: [Ochodek et al. UCP paper](https://people.eecs.ku.edu/~saiedian/Teaching/811/Papers/Use-Case-Points/use-case-points-simplify.pdf), [Methods & Tools UCP article](https://www.methodsandtools.com/archive/archive.php?id=25p3).

Productivity factor, \(PF\):

| Source | PF |
|---|---:|
| Karner default | 20 h/UCP [CANON] |
| Ribu observed range | 15-30 h/UCP [EMPIRICAL] |
| Schneider-Winters, 2 or fewer negative environmental factors | 20 h/UCP [RULE OF THUMB] |
| Schneider-Winters, 3 to 4 negative factors | 28 h/UCP [RULE OF THUMB] |
| Schneider-Winters, more than 4 negative factors | 36 h/UCP [RULE OF THUMB] |

These are defaults, not universal constants. Ochodek’s 14-project calibration produced post-hoc PF values from **4 to 35 h/UCP**, a very wide spread [EMPIRICAL]. ([Ochodek paper](https://people.eecs.ku.edu/~saiedian/Teaching/811/Papers/Use-Case-Points/use-case-points-simplify.pdf))

---

### 1.5 FP productivity and project delivery rates

ISBSG measures **Project Delivery Rate**, or PDR, as effort hours per functional size unit. Lower is more productive.

| Segment | PDR |
|---|---:|
| Traditional languages, median | **8.3 h/FP** [EMPIRICAL] |
| Traditional languages, P10 | 3.2 h/FP [EMPIRICAL] |
| Low-code, median | **1.8 h/FP** [EMPIRICAL] |
| Java, median | **8.7 h/FP** [EMPIRICAL] |
| Java, P90 | **24.2 h/FP** [EMPIRICAL] |
| Low-code, P90 | 2.4 h/FP [EMPIRICAL] |

Sources: [ISBSG Java versus low-code](https://www.isbsg.org/wp-content/uploads/2022/05/Short-Paper-2021-12-Productivity-Java-Vs-Low-Code-Projects.pdf), [ISBSG traditional versus low-code](https://www.isbsg.org/wp-content/uploads/2021/08/Short-Paper-2021-06-Productivity-of-Low-Code-projects.pdf).

ISBSG **Manpower Delivery Rate**, or MDR, is FP per person per month:

- Most projects: **20-40 FP/person-month** [EMPIRICAL].
- Top roughly 10%: up to 160 FP/person-month [EMPIRICAL].
- Low-code platforms are highest; mobile Android and iOS are lowest.
- Productivity can differ by **6x** across projects [EMPIRICAL].

Source: [ISBSG MDR 2024](https://www.isbsg.org/wp-content/uploads/2025/01/2024-12-Manpower-Delivery-Rate.pdf).

Independent ISBSG R12 analysis by language:

| Language | Median FP per person-hour | Approx. hours per FP |
|---|---:|---:|
| C# | 0.044 | 22.7 |
| COBOL | 0.063 | 15.9 |
| Java | 0.103 | 9.7 |
| C | 0.098 | 10.2 |
| C++ | 0.083 | 12.0 |
| SQL | 0.144 | 6.9 |
| Access | 0.425 | 2.4 |
| ABAP | 0.060 | 16.7 |

Source: [Lavazza et al. 2018](https://doi.org/10.5277/e-inf180102). All values [EMPIRICAL].

**Implementation rule:** model PDR as a lognormal distribution by language, platform, and project type. Do not use the median as a point estimate without its spread. ISBSG’s own reports show that the spread is the point.

---

### 1.6 LOC per FP: use only as a cited prior

No universal LOC-per-FP ratio exists. LOC per FP depends on language, coding style, framework density, generated code, and whether comments and blanks are counted. The table below is a cited empirical reference class, not a universal constant.

Capers Jones language-level table, approximate logical source statements per function point:

| Language or generation | Approx. logical statements per FP | Tag |
|---|---:|---|
| Basic assembly | 320 | [EMPIRICAL] |
| Macro assembly | 213 | [EMPIRICAL] |
| C | 128 | [EMPIRICAL] |
| COBOL | 107 | [EMPIRICAL] |
| FORTRAN | 107 | [EMPIRICAL] |
| Pascal | 91 | [EMPIRICAL] |
| PL/I | 80 | [EMPIRICAL] |
| Ada 83 | 71 | [EMPIRICAL] |
| JavaScript | 71 | [EMPIRICAL] |
| C++ | 53 | [EMPIRICAL] |
| Java | 53 | [EMPIRICAL] |
| Python | 53 | [EMPIRICAL] |
| C# | 51 | [EMPIRICAL] |
| Ruby | 46 | [EMPIRICAL] |
| SQL | 13 | [EMPIRICAL] |

Sources: [Capers Jones, “Function points as a universal software metric,” ACM SIGSOFT SEN 38(4), 2013, Table 14.1](https://dl.acm.org/doi/pdf/10.1145/2492248.2492268), [Programming Languages Table mirror](https://www.cs.bsu.edu/homepages/dmz/cs697/langtbl.htm), [QSM function-point languages and gearing factors](https://qsm.com/resources/function-point-languages-table).

These values are **logical statements**, not physical lines. They are a reference class, not a conversion law. Different editions of the Jones table disagree for some languages, and modern frameworks change the ratio substantially. [DISPUTED]

Use these rules:

- If you have KSLOC, feed COCOMO II directly.
- If you have FP, use an FP-calibrated effort model, or calibrate a local FP-to-SLOC ratio on your own repositories.
- Never apply a single industry LOC/FP ratio across languages.
- If you must convert, record the conversion factor, the sample, and the date. Treat the conversion as a source of uncertainty, not as a constant.

---

### 1.7 Size-unit conversion warnings

| Conversion | Status | Rule |
|---|---|---|
| IFPUG FP to COSMIC CFP | [DISPUTED] | No universal ratio. Calibrate locally. |
| COSMIC CFP to IFPUG FP | [DISPUTED] | Same. Do not sum the units. |
| FP to SLOC | [DISPUTED] | No universal table. Calibrate per language and codebase. |
| Story points to hours | [DISPUTED] | Team-specific. Use the team’s velocity history only. |
| Object points to FP | [DISPUTED] | Different model. Do not convert without a local study. |
| UCP to FP | [DISPUTED] | Different model. Calibrate locally. |

---

## 2. Judgment methods and bias

### 2.1 Wideband Delphi [CANON procedure]

Original Boehm and Farquhar procedure:

1. The coordinator gives each expert the specification and an estimation form.
2. The group meets to discuss issues.
3. Experts fill in forms **anonymously**.
4. The coordinator summarizes the estimates and distributes them.
5. The group meets again, focusing on outliers and wide variations.
6. Experts re-estimate anonymously. Repeat steps 4 to 6 until convergence.

The design goal is independent initial estimates, structured discussion, and anonymity. ([Wideband Delphi](https://en.wikipedia.org/wiki/Wideband_delphi), [McConnell excerpt](https://flylib.com/books/en/2.822.1.91/2/))

### 2.2 Planning poker [CANON procedure]

- Each estimator privately selects a card, often from a Fibonacci-like sequence: 0, 1, 2, 3, 5, 8, 13, 20, 40, 100.
- Cards are revealed simultaneously.
- The highest and lowest estimators explain their reasoning.
- The group re-votes until consensus or until the range is accepted.
- Do not force consensus when the spread contains real uncertainty. The spread is information.

Source: [Agile Alliance planning poker](https://agilealliance.org/glossary/planning-poker/).

### 2.3 Expert-judgment bias [EMPIRICAL]

| Bias | Evidence | Product implication |
|---|---|---|
| **Anchoring** | Early irrelevant numbers strongly shift estimates. Cohen’s \(d=1.19\) in 410 developers. A de-biasing workshop reduced the effect to \(d=0.72\). | Never show a target budget before collecting independent estimates. |
| **Planning fallacy and optimism** | People predict their own work too optimistically despite knowing past overruns. | Use the outside view and reference class forecasting, not the inside view. |
| **Overconfidence in ranges** | Expert prediction intervals are far too narrow for the stated confidence. | Do not trust “90% confident” ranges. Widen empirically or simulate. |
| **Estimates change the work** | Optimistic estimates can cause scope reduction or effort overrun depending on project priorities. | Separate bid, plan, and most-likely estimates. |
| **Risk identification can increase over-optimism** | Four experiments found that more risk work sometimes increased over-optimism and over-confidence. | Keep the risk register separate from effort estimation. Do not let a risk workshop become a reassurance ritual. |

Sources: [Jørgensen 2004 review](https://cms.simula.no/sites/default/files/publications/SE.4.Joergensen.2004.c.pdf), [anchoring experiment](https://dl.acm.org/doi/10.1145/3167132.3167293), [over-confidence in prediction intervals](<https://dl.acm.org/doi/10.1016/S0164-1212(02)00160-7>), [risk identification paradox](https://dl.acm.org/doi/10.1016/j.infsof.2009.12.002).

**Practical rule:** use an algorithmic model for the baseline, judgment for adjustments, and keep an audit trail for every adjustment.

---

## 3. Probabilistic aggregation

### 3.1 PERT and three-point estimation [CANON]

\[
E=\frac{O+4M+P}{6}
\]

\[
SD=\frac{P-O}{6}
\]

\[
Var=\left(\frac{P-O}{6}\right)^2
\]

For independent tasks:

\[
E_{project}=\sum E_i,\qquad \sigma_{project}=\sqrt{\sum \sigma_i^2}
\]

Do not add standard deviations directly. Add variances. If tasks are correlated, this formula underestimates project spread.

The PERT beta formula is an approximation. The triangular alternative is:

\[
E=\frac{O+M+P}{3}
\]

Source: [Vose three-point estimating](https://www.vosesoftware.com/Articles/Three-Point-Estimating.php), [NASA Cost Estimating Handbook](https://everyspec.com/NASA/NASA-General/download.php?spec=NASA_Cost_Estimating_HDBK-CEH-Ver-4-0.055787.pdf).

### 3.2 Monte Carlo for cost and schedule

Pipeline:

1. For each WBS item, define a distribution for size, productivity, and cost rate.
2. Sample and compute effort as size times PDR, or use COCOMO II.
3. Compute schedule from effort and constraints, using COCOMO TDEV or the critical path.
4. Add discrete risks as Bernoulli events with impact distributions.
5. Correlate common drivers.
6. Read percentiles from the simulated total.

#### Lognormal distribution [EMPIRICAL model choice, CANON math]

Aerospace and MITRE studies found the lognormal distribution a good model for both cost and schedule because both are positive and right-skewed. ([Measurable News](https://mycpm.org/wp-content/uploads/2023/04/Measurable-News-Issue-4-2007-PG11_15.pdf))

If you have P10 and P90:

\[
\mu=\frac{\ln P_{10}+\ln P_{90}}{2}
\]

\[
\sigma=\frac{\ln P_{90}-\ln P_{10}}{2\cdot1.2816}
\]

Then:

\[
P_{50}=e^{\mu}
\]

\[
P_{80}=e^{\mu+0.8416\sigma}
\]

\[
P_{90}=e^{\mu+1.2816\sigma}
\]

If you have the arithmetic mean \(\bar{x}\) and standard deviation \(s\):

\[
\sigma^2=\ln\left(1+\left(\frac{s}{\bar{x}}\right)^2\right)
\]

\[
\mu=\ln(\bar{x})-\frac{\sigma^2}{2}
\]

#### Correlation [CANON math]

Ignoring correlation understates project risk because independent errors cancel. Use a one-factor Gaussian copula:

\[
z_i'=\rho z_g+\sqrt{1-\rho^2}z_i
\]

\[
u_i=\Phi(z_i'),\qquad x_i=F_i^{-1}(u_i)
\]

Here \(z_g\) is a shared factor such as team productivity, requirements volatility, or vendor performance. \(z_i\) is the item-specific deviate. \(F_i\) is the item’s marginal CDF. Pairwise correlation within the group is approximately \(\rho^2\) in normal space. Source: [RunMonteCarlo math](https://runmontecarlo.com/maths).

#### Contingency

\[
Contingency_{P80}=P_{80}-E_{base}
\]

- If \(E_{base}\) is the sum of most-likely values, it often sits below P50, so the P80 contingency is correspondingly larger.
- Worked example: base €12.0m, mean €13.05m, P50 €12.96m, P80 €13.96m. The P80 contingency is €1.96m, or **16.4%** of base. A flat 10% contingency would only fund to about P58. ([Vose worked example](https://www.vosesoftware.com/Risk-In-Excel/Risk-Analysis-Example-Models-In-Excel/Cost-Contingency-Worked-Example.php))
- Correlation is material. In that example, switching off correlation reduced P80 by about €0.30m, roughly 15% of the contingency.

#### Joint confidence level

Do not promise “P80 cost and P80 schedule” as an 80% plan. In a correlated example, P80 cost and P80 date separately gave only **73.6%** chance of meeting both. ([Vose integrated cost and schedule example](https://www.vosesoftware.com/Risk-In-Excel/Risk-Analysis-Example-Models-In-Excel/Integrated-Cost-And-Schedule-Risk.php))

### 3.3 Reference class forecasting

Outside-view method:

1. Identify a reference class of comparable completed projects.
2. Collect actual-to-estimate ratios \(R_i=Actual_i/Estimate_i\).
3. Fit a distribution, usually lognormal, to \(R_i\).
4. Choose a percentile \(q\), for example P80.
5. Adjust the inside estimate:

\[
E_{adj}=E_{inside}\cdot Q_q(R)
\]

or express the adjustment as an uplift:

\[
u_q=Q_q(R)-1
\]

6. If the project is not average within the class, position it by size or complexity and use the conditional distribution.

This bypasses optimism bias and strategic misrepresentation by cutting directly to outcomes. Sources: [Flyvbjerg and Budzier, HBR 2011](https://hbr.org/2011/09/why-your-it-project-may-be-riskier-than-you-think), [SCL reference class explainer](https://www.scl.org/3872-reference-class-forecasting-and-realistic-tech-contracts/).

### 3.4 Cone of Uncertainty [DISPUTED]

McConnell’s table, adapted from Boehm:

| Phase | Low multiplier | High multiplier | Spread |
|---|---:|---:|---:|
| Initial concept | 0.25x | 4.0x | 16x |
| Approved product definition | 0.50x | 2.0x | 4x |
| Requirements complete | 0.67x | 1.5x | 2.25x |
| User interface design complete | 0.80x | 1.25x | 1.56x |
| Detailed design complete | 0.90x | 1.10x | 1.22x |

Sources: [McConnell cone of uncertainty](https://athena.ecs.csus.edu/~buckley/CSc231_files/McConell_ConeofUncertainty.pdf), [Construx white paper](https://www.construx.com/wp-content/uploads/2023/03/ConeOfUncertainty_Scaled.pdf).

The cone’s ranges came from judgment as 80% confidence limits, not from a measured dataset. Real project data are asymmetric and run late more often than early. Treat the cone as a prior for phase-based uncertainty, not as a statistical law. ([Bossavit critique summary](https://resources.rework.com/libraries/project-management/cone-of-uncertainty))

---

## 4. Empirical evidence on estimation failure

### 4.1 Standish CHAOS [DISPUTED]

| Year | Success | Challenged | Failed |
|---|---:|---:|---:|
| 1994 | 16% | 53% | 31% |
| 2004 | 29% | 53% | 18% |
| 2009 | 32% | 44% | 24% |
| 2019 | 16.2% | 52.7% | 31.1% |
| 2020 | 31% | 50% | 19% |

Sources: [DeFranco and Voas 2022 table](https://doi.org/10.1109/mc.2022.3146648), [opencommons CHAOS summary](https://opencommons.org/CHAOS_Report_on_IT_Project_Outcomes).

Do not use these numbers as priors without caveats:

- The 1994 figure of 189% average cost overrun is almost certainly biased and unrepresentative. The sample was recruited by asking for failure stories, and the overrun measure is poorly defined. ([Jørgensen and Moløkken-Østvold 2006](https://cms.simula.no/sites/default/files/publications/Jorgensen.2006.4.pdf), [Jenkins 2006 review](https://www.sciencedirect.com/science/article/abs/pii/S0950584905001023))
- Standish’s success definition is one-sided. Any 1% overrun counts as challenged, and on-time, on-budget, and on-scope are combined with AND logic. This distorts estimation practice. ([Eveleens and Verhoef 2009](https://doi.org/10.1109/ms.2009.154))
- Standish does not disclose sampling and analysis sufficiently for replication. ([Glass 2006](https://dl.acm.org/doi/pdf/10.1145/1145287.1145301?download=true))

Use instead the qualitative claim that a large share of projects miss at least one of cost, schedule, or scope, and calibrate magnitudes from your own data or a disclosed reference class.

### 4.2 Flyvbjerg and Budzier: fat tails, not averages [EMPIRICAL]

- 1,471 IT projects.
- Average cost overrun **27%**.
- **1 in 6** projects had a cost overrun of **200%** on average, with schedule overrun around **70%**.
- Overall schedule risk **+55%**. Among projects with cost overrun, **+70%**. Among black swans, **+68%**.
- Cost overruns follow a fat-tailed, power-law-like pattern. The average is a poor risk measure.

Sources: [HBR 2011](https://hbr.org/2011/09/why-your-it-project-may-be-riskier-than-you-think), [Budzier working paper](https://ora.ox.ac.uk/objects/uuid:7139e1c6-1884-4563-807e-810715e78ce5/files/m47172bf0a46426d73d7046d357ab0605).

**Product implication:** set the budget at P80 or P90 of a simulated or reference-class distribution, not at mean plus a flat contingency. A single black swan can dwarf dozens of normal projects.

### 4.3 McKinsey and Oxford: large IT projects [EMPIRICAL]

- More than 5,400 projects with initial budgets above $15m.
- Average **45% over budget**, **7% over schedule**, and **56% less value** than predicted.
- **17%** went so badly that they threatened the company’s existence.
- Every additional year of duration added about **15%** to cost overrun.
- **Software projects** had the highest risk: **66% average cost overrun** and **33% schedule overrun**, according to CIO.de’s report of the study.

Sources: [McKinsey 2012](https://www.mckinsey.com/capabilities/tech-and-ai/our-insights/delivering-large-scale-it-projects-on-time-on-budget-and-on-value), [CIO.de summary with the software subset](https://www.cio.de/article/3667811/software-projekte-zwei-drittel-uber-dem-budget.html).

**Correction to a common claim:** the “66% overrun” figure refers to **software projects within the McKinsey IT sample**, not to infrastructure in general. Infrastructure and construction have their own overrun literature. Do not attribute 66% to infrastructure.

### 4.4 ISBSG: use it for productivity, not overrun rates

ISBSG records actual size, effort, duration, cost, defects, language, platform, and phase effort for completed projects. It does **not** consistently record the original approved estimate, so it cannot by itself produce an overrun rate. Use it to build a PDR distribution and a reference class, not to claim “ISBSG says X% overrun.” ([ISBSG data description](https://www.isbsg.org/development-and-enhancement-data/))

### 4.5 Synthesis: why IT estimation fails

1. **Fat tails and black swans.** Averages hide catastrophic outliers.
2. **Optimism bias and strategic misrepresentation.** Forecasts are political and cognitive, not neutral.
3. **Requirements volatility.** Scope grows during delivery. See §7.
4. **Diseconomies of scale.** Communication and integration overhead rise with size. COCOMO \(E>1\) captures this.
5. **Schedule compression.** Effort scales roughly as \(1/t^4\). Adding people late makes it worse.
6. **Reference class neglect.** Inside-view estimates ignore base rates.
7. **Measurement mismatch.** FP, CFP, SLOC, UCP, object points, and story points are not interchangeable.
8. **Vendor and contractor information asymmetry.** Coordination, switching, and hidden costs are systematically underestimated.

---

## 5. Throughput, staffing, and schedule physics

### 5.1 Brooks’s law [CANON]

Communication paths grow quadratically:

\[
\text{paths}=\frac{n(n-1)}{2}
\]

Adding people to a late project increases coordination and onboarding load. It can make the project later. Source: *The Mythical Man-Month* (1975).

### 5.2 Putnam, SLIM, and Norden-Rayleigh [CANON]

Rayleigh staffing curve:

\[
E(t)=\frac{K}{t_d^2}\,t\,e^{-t^2/(2t_d^2)}
\]

- \(K\) is total effort, the area under the curve.
- \(t_d\) is the time of peak staffing, approximately development time.
- \(E(t)\) is the staffing rate at time \(t\).

Putnam software equation:

\[
S=C_k K^{1/3} t_d^{4/3}
\]

Solving for effort:

\[
K=\left(\frac{S}{C_k t_d^{4/3}}\right)^3
\]

Key trade-off:

\[
K\propto t_d^{-4}
\]

Compressing schedule by 20% requires roughly \(1/0.8^4=2.44\) times the effort. This is the mathematical form of Brooks’s law. Sources: [Putnam model](https://en.wikipedia.org/wiki/Putnam_model), [QSM effort-time trade-off](https://www.qsm.com/articles/familiar-metric-management-effort-time-trade-its-data), [Rayleigh derivation](https://dspmuranchi.ac.in/pdf/Blog/staffing%20level%20estimation.pdf).

**Technology constant \(C_k\) [DISPUTED units]:** published teaching values are **2** for a poor environment, **8** for good, and **11** for excellent. A real project example uses \(C_k=10040\). Units differ between sources, including KLOC versus SLOC and person-months versus person-years. Calibrate \(C_k\) locally and check units before copying a number.

**SLIM metrics:** Productivity Index, Manpower Build-up Index, and the Rayleigh parameters compare actual staffing profiles against the ideal curve. If staffing peaks much later or is much flatter than Rayleigh, schedule slippage is likely.

### 5.3 Utilization and effective capacity [EMPIRICAL]

| Metric | Value |
|---|---:|
| Average billable utilization, 2024 | **68.9%** |
| Average billable utilization, 2025 | **66.4%** |
| “Optimal” or high-performer target | **75%** |
| Small firms, 10 to 30 people | **65.4%** |
| Firms with 31 to 100 people | **69.2%** |
| Above roughly 85% | burnout risk, unsustainable |

Sources: [SPI 2025 benchmark](https://forms.workday.com/content/dam/web/en-us/documents/reports/SPI_2025_Benchmark_Report.pdf), [SPI utilization note](https://spiresearch.com/the-truth-about-billable-utilization/), [Deltek 2026 summary](https://www.deltek.com/resources/articles/professional-services-benchmarks/).

Effective hours:

\[
H_{eff}=2080\cdot(1-\ell)\cdot u
\]

Here \(\ell\) is the leave, training, and sick fraction, typically 0.10 to 0.15 [RULE OF THUMB], and \(u\) is utilization, typically 0.65 to 0.75 [EMPIRICAL]. Use \(H_{eff}\) to convert salary cost to productive-hour cost. Do not price a person as 2,080 billable hours.

---

## 6. In-house versus outsourced economics

### 6.1 Fully loaded in-house cost

Definitions:

- \(S\) = annual gross salary
- \(b\) = employer statutory burden rate
- \(\beta\) = benefits and overhead rate
- \(H\) = annual hardware and licenses
- \(O\) = annual office and space
- \(M\) = annual management allocation
- \(u\) = utilization
- \(\ell\) = leave and training fraction
- \(h=2080\) paid hours per year

\[
C_{FTE}=S(1+b)(1+\beta)+H+O+M
\]

\[
H_{eff}=h(1-\ell)u
\]

\[
c_{PM}=\frac{C_{FTE}}{12}
\]

\[
c_h=\frac{C_{FTE}}{H_{eff}}
\]

#### Employer statutory burden: Russia, 2026 [CANON law]

- Unified social tax: **30%** up to **2,979,000 RUB per year** per employee, and **15.1%** above that cap.
- Workplace injury contributions: **0.2% to 8.5%**, depending on the occupational risk class.
- IT organizations: preferential rate of **15%** up to the cap in 2026, and **7.6%** above, subject to eligibility conditions.
- SMEs: preferential 15% only for priority industries from 2026, not universal.

Sources: [FTS 2026 cap announcement](https://www.nalog.gov.ru/rn77/news/activities_fts/16577139/), [FTS regional explanation](https://www.nalog.gov.ru/rn86/news/activities_fts/16596985/).

#### Employer statutory burden: Kazakhstan, 2026 [CANON law]

The old 9.5% social tax figure is obsolete.

| Payment | 2026 rate | Who pays | Base and cap |
|---|---:|---|---|
| Social tax (SN) | **6%** | Employer | Income minus OPV and VOSMS; minimum base applies (14 MW per source, verify) [DISPUTED] |
| Social contributions (SO) | **5%** | Employer | Income minus OPV; cap 7 MW |
| Employer pension (OPVR) | **3.5%** | Employer | 1 to 50 MW |
| Employer health (OOSMS) | **3%** | Employer | Cap 40 MW |
| Employee pension (OPV) | 10% | Employee | Cap 50 MW |
| Employee health (VOSMS) | 2% | Employee | Cap 20 MW |
| Personal income tax (IPN) | 10% or 15% | Employee | After deductions |

**Employer burden is approximately 6% + 5% + 3.5% + 3% = 17.5%** of gross, before caps. In 2025 the social tax was 11%, so the total was about 21.5%. In 2023-2024 it was 9.5%, which is where the obsolete figure comes from. The 2026 reform lowered the headline social tax but decoupled it from social contributions. The total employer burden remains about 17.5%.

Sources: [mybuh 2026 rates](https://mybuh.kz/keyinfo/), [UPPERSETUP 2026 explainer](https://uppersetup.com/ru/blog/employer-payroll-taxes-and-contributions-in-kazakhstan-2026), [Kaspi guide](https://guide.kaspi.kz/partner/ru/tax/conditions/general-mode/q2759), [Balanc.kz](https://balanc.kz/nalogi-i-vznosy-s-zarplaty-2026-kazakhstan/).

#### Recruiting and replacement [EMPIRICAL]

| Item | Value |
|---|---|
| SHRM average cost per hire, non-executive | **$5,475** |
| SHRM median cost per hire, non-executive | **$1,200** |
| SHRM median time-to-fill, non-executive | **39 days** |
| Technical roles time-to-fill | **60-65 days** |
| Agency fee, direct hire | **15-25% of first-year salary** |
| Replacement cost | **0.5x to 2x annual salary** |
| SHRM “find and train” replacement | **6-9 months of pay** |

Sources: [SHRM 2025](https://www.shrm.org/executive-network/insights/people-strategy/state-of-recruiting-2025-insights-to-maximize-recruitment), [SHRM and TrueStep summary](https://truestephr.com/sources/cost-of-turnover), [IT turnover benchmarks](https://www.theashgroup.com/the-true-costs-of-it-turnover-and-vacancy/).

#### Ramp-up [RULE OF THUMB]

Typical developer ramp is 1 to 3 months. Complex systems and senior roles can take 3 to 6 months. Model as a productivity ramp:

\[
C_{ramp}=S_{monthly}\sum_{m=1}^{R}(1-\pi_m)
\]

Here \(\pi_m\) is productivity in month \(m\), for example 0.25, 0.50, 0.75, 0.90. These are rules of thumb, not canonical constants.

#### Turnover [EMPIRICAL]

Software engineer voluntary turnover is about **13.2%**. SPI professional-services total attrition is about **11.7%**. Use 10% to 15% as a planning prior, calibrated by role and market.

Expected annual replacement cost:

\[
C_{turnover}=N\cdot\tau\cdot C_{replace}
\]

#### Bench and idle capacity [EMPIRICAL utilization, CANON arithmetic]

If you need \(N_{billable}\) productive people at utilization \(u\), you must employ:

\[
N_{req}=\frac{N_{billable}}{u}
\]

\[
C_{bench}=(N_{req}-N_{billable})C_{FTE}
\]

At \(u=0.70\), a 10-person billable team requires about 14.3 FTEs, or about 4.3 FTEs of bench and idle cost. This is why in-house work looks expensive per delivered person-month unless utilization is managed.

### 6.2 Outsourced cost

\[
C_{out}=\sum PM\cdot r\cdot(1+c_c)+C_{transition}+C_{switch}+C_{gov}+C_{risk}
\]

- \(r\) = contracted rate per PM, or per hour times hours per PM.
- \(c_c\) = coordination and procurement overhead as a fraction of contract value.
- \(C_{transition}\) = knowledge transfer, double staffing, and onboarding.
- \(C_{switch}\) = vendor switching and exit cost.
- \(C_{gov}\) = vendor management, audits, and SLA reporting.
- \(C_{risk}\) = expected value of vendor-specific risks, including quality, security, key-person, and lock-in.

#### Vendor margin versus markup [EMPIRICAL]

These are different and are routinely confused.

\[
margin=\frac{markup}{1+markup}
\]

\[
markup=\frac{margin}{1-margin}
\]

Market ranges:

| Model | Range |
|---|---:|
| IT staffing markup on pay rate | **35-50%**, up to 65-75% for scarce skills |
| Gross margin on bill rate | **20-35%** defensible, 30-50% at some vendors |
| Direct-hire agency fee | **18-30% of first-year salary** |
| Pass-through or payrolling margin | **10-20% of bill rate** |

Sources: [Full Scale markup and margin](https://fullscale.io/blog/staff-augmentation-markup/), [ApTask IT staffing costs](https://aptask.com/guides/it-staffing-cost), [Supersourcing 2026 fees](https://supersourcing.com/blog/it-staffing-agency-fees/).

#### Coordination and hidden costs [EMPIRICAL]

- Vendor selection and contract writing: about **3%** of total outsourcing cost.
- Ongoing contract management: about **$300,000 per year** in the studied sample.
- Transition: **5-15%** of annual base contract cost.
- Poor governance: **5-30%** of expected value lost per year. 63% of companies report about 25% loss.
- One study of 26 outsourced projects found hidden client-side costs averaging **190% of the contract cost**, almost twice the contract. This is an outlier but shows the tail.
- Switching providers: selection takes 6 to 9 months, knowledge transfer takes 2 weeks to 3 months, and double staffing is common during transition.

Sources: [Barthélemy, MIT Sloan](https://sloanreview.mit.edu/article/the-hidden-costs-of-it-outsourcing/), [Computerworld summary](https://www.computerworld.com/article/1325329/costly-surprises.html), [CIO governance leakage](https://www.cio.com/article/282138/outsourcing-9-ways-to-stop-your-it-outsourcing-deal-from-leaking-money.html), [AMCIS 26-project study](https://aisel.aisnet.org/cgi/viewcontent.cgi?article=1140&context=amcis2010), [contract renewal and coordination](http://jitm.ubalt.edu/XXII-4/article3.pdf).

**Implementation default:** set \(c_c=0.10\) to \(0.25\) of contract value [EMPIRICAL/RULE OF THUMB], with a separate transition line of 5% to 15% of year-one contract value. Do not bury coordination inside the rate.

### 6.3 Break-even formula [CANON]

Definitions:

- \(F\) = annual fixed in-house cost that does not scale with project volume, including management, office, tools, bench reserve, and recruiting amortization.
- \(c_i\) = loaded variable in-house cost per PM.
- \(r_o=r(1+c_c)\) = all-in outsourced cost per PM.
- \(Q\) = person-months delivered per year.

In-house annual cost:

\[
C_{in}=F+c_iQ
\]

Outsourced annual cost:

\[
C_{out}=r_oQ
\]

Break-even:

\[
Q^{*}=\frac{F}{r_o-c_i}
\]

If \(r_o\le c_i\), in-house never breaks even on variable cost. Outsourcing is cheaper at any volume before risk and quality differences.

Multi-year, with discount rate \(w\):

\[
Q^{*}=\frac{\sum_t F_t/(1+w)^t}{\sum_t (r_o-c_i)/(1+w)^t}
\]

Three-year TCO comparison:

\[
TCO_{in}=\sum_{t=0}^{3}\frac{F_t+c_iQ_t+R_t+C_{turnover,t}}{(1+w)^t}
\]

\[
TCO_{out}=\sum_{t=0}^{3}\frac{r_oQ_t+C_{transition,t}+C_{gov,t}+C_{risk,t}}{(1+w)^t}
\]

NPV difference:

\[
NPV_{\Delta}=\sum_{t=0}^{T}\frac{C_{out,t}-C_{in,t}}{(1+w)^t}
\]

A positive \(NPV_{\Delta}\) means outsourcing is more expensive in present-value terms. IRR is the \(w\) that sets \(NPV_{\Delta}=0\). Solve numerically.

### 6.4 Cost of capital [EMPIRICAL]

Damodaran’s January 2026 US industry WACC data:

| Industry | Cost of capital |
|---|---:|
| Software, System and Application | **9.34%** |
| Computer Services | **7.83%** |
| Information Services | **7.00%** |
| Engineering and Construction | **8.69%** |
| Total Market | **6.96%** |

Source: [Damodaran WACC, January 2026](https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/wacc.html). The source also records a no-tilde variant at [pages.stern.nyu.edu/adamodar](https://pages.stern.nyu.edu/adamodar/New_Home_Page/datafile/wacc.html).

Country risk premiums for the build-up: [Damodaran country risk premiums](https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/ctryprem.html).

The common “10-15% for industrials” is a **rule of thumb**, not a canonical software WACC. For a private company in Russia or Kazakhstan, start from the US industry WACC, add Damodaran’s country risk premium and a size or company premium. Use 10% to 15% as a defensible planning range for emerging-market private IT, but document the build-up. [RULE OF THUMB]

---

## 7. Risk quantification

### 7.1 Basic formulas [CANON]

\[
RE=P\times I
\]

\[
EMV=\sum_i p_i I_i
\]

- \(RE\) is risk exposure, the expected loss.
- \(EMV\) is the expected monetary value of a risk register.
- Use \(RE\) to rank risks. Use \(EMV\) to add to the base estimate.

Source for risk exposure and software risk management: [Boehm 1991, Software Risk Management](https://doi.org/10.1109/52.62930).

### 7.2 Contingency [CANON method, RULE OF THUMB fallback]

\[
Contingency_{q}=F^{-1}(q)-E_{base}
\]

- For a normal distribution, \(z_{0.80}=0.8416\) and \(z_{0.90}=1.2816\).
- Default budget confidence is **P80**. Contractual or regulatory work often uses **P90**.
- A flat 10% to 30% contingency is a **rule of thumb**, not a substitute for a distribution. Boehm’s own example used a 15% risk reserve for requirements volatility. NASA-style cost risk uses P80 unallocated future expense. ([USC COCOMO risk example](https://slideum.com/doc/8278761/using-cocomo%C2%AE-ii-for-software-decisions), [NASA Cost Estimating Handbook](https://everyspec.com/NASA/NASA-General/download.php?spec=NASA_Cost_Estimating_HDBK-CEH-Ver-4-0.055787.pdf))

### 7.3 Scope creep and requirements volatility

Let \(r\) be monthly compounding requirements growth:

\[
Size_t=Size_0(1+r)^t
\]

At \(r=1\%/month\), a 36-month project grows to \(1.01^{36}=1.43\), or **+43%** effective size. [EMPIRICAL]

Evidence:

- Capers Jones: creeping requirements change about **1% per month**. Average creep is **35%**, maximum is **200%**, and it occurs on more than 70% of applications over 1,000 FP. ([Jones 1994, summarized](https://www.slideserve.com/sakina/lecture-3-requirements))
- Boehm treats change rates on the order of **1% per month** as the boundary of stable plan-driven requirements. ([Boehm, “Home Grounds”](https://studylib.net/doc/8490928/the-%E2%80%9Chome-grounds%E2%80%9D-of-agile-and-plan))
- Between **20% and 53%** of original requirements change by project completion. ([Davis et al. 2008](https://doi.org/10.1109/compsac.2008.216))
- COCOMO II handles this through **REVL**: effective size equals \(Size_{delivered}(1+REVL/100)\), where REVL is the percentage of code discarded because of requirements evolution. ([COCOMO II manual](https://www.cs.otago.ac.nz/cosc345/resources/COCOMO-II-2000.pdf))
- Kulk and Verhoef model requirements volatility as compound interest and show that outsourced projects have similar volatility to in-house projects. ([Kulk and Verhoef](https://www.cs.vu.nl/~x/qrv/qrv.pdf))

### 7.4 Vendor-specific risks

Model each risk as a Bernoulli event with a probability and an impact distribution.

| Risk | Typical mechanism | Mitigation or contract lever |
|---|---|---|
| Key-person dependency | One or two people hold critical knowledge. | Escrow, documentation, named backups, knowledge-transfer milestones. |
| Lock-in | Proprietary tooling or data formats. | Open standards, data export rights, IP ownership. |
| Quality shortfall | Defects, rework, acceptance disputes. | Acceptance criteria, warranty, defect SLA, holdback. |
| Security and compliance | Data breach or regulatory breach. | Security addendum, audit rights, insurance. |
| Financial instability | Vendor insolvency. | Financial checks, escrow, step-in rights. |
| Scope dispute | Change-request pricing. | Change-control clause, rate card, fixed-price boundaries. |

Risk-adjusted vendor rate:

\[
r_{adj}=r(1+\rho)
\]

Here \(\rho\) is the expected risk premium as a fraction of rate, or add \(EMV\) as a separate line.

---

## 8. Market-analogue data sources

### 8.1 ISBSG [EMPIRICAL]

- **13,718** development and enhancement projects, plus **2,417** maintenance and support applications.
- **118 fields** per project in the 2024 release: size in IFPUG, NESMA, or COSMIC; effort by phase; duration; team size; language; platform; defects; industry; country; data quality.
- License: **AUD 3,000 per year** for a single user. Corporate licenses are **AUD 7,500 to 10,000 per year** for 1 to 9 or 10+ users.
- Data quality rating A or B; normalized effort.

Sources: [ISBSG subscriptions](https://www.isbsg.org/subscriptions/), [ISBSG overview 2025](https://www.isbsg.org/wp-content/uploads/2025/05/Short-Paper-2025-05-ISBSG-Overview.pdf), [ISBSG data subscription](https://www.isbsg.org/product/project-data-subscription/).

**How to use it:** filter to comparable language, platform, domain, and size. Fit a lognormal to PDR. Use P50 and P80. Never quote the median as a point estimate without the spread.

### 8.2 PROMISE, Zenodo, and academic datasets [EMPIRICAL]

| Dataset | Projects | Target | Notes |
|---|---:|---|---|
| COCOMO81 | 63 | person-months | Boehm 1981 |
| NASA93 | 93 | person-months | NASA 1971-1987 |
| Desharnais | 81, 77 complete | person-hours | Canadian software house |
| Albrecht | 24 | person-hours | FP plus effort |
| Kemerer | 15 | person-months | Classic small dataset |
| Maxwell | 62 | person-hours | Finnish bank |
| China | 499 | person-hours | Large multi-industry |
| Miyazaki94 | 48 | person-months | Japanese |
| Tukutuku | 53 | person-months | Web projects |
| Kitchenham | 145 | person-hours | |
| UCP | 70 | person-months | Use-case points |
| Finnish | 38 | person-hours | |
| Telecom | 18 | person-months | UK telecom |

Sources: [PROMISE datasets](http://promise.site.uottawa.ca/SERepository/datasets-page.html), [Derek-Jones GitHub mirror](https://github.com/Derek-Jones/Software-estimation-datasets), [dataset review](https://thesai.org/Downloads/Volume14No7/Paper_100-Review_of_Existing_Datasets_Used_for_Software_Effort_Estimation.pdf).

These datasets are old, small, and heterogeneous. Use them to calibrate or benchmark models, not as current market prices. Many machine-learning papers overfit them. Report leave-one-out or k-fold results.

### 8.3 GitHub mining [EMPIRICAL, weak proxies]

- The GitHub public API exposes repository size in KB including git metadata, language bytes, commits, contributors, issues, and releases.
- The BEA study used **7.75 million repositories** and **3.2 million contributors**, combining lines of code with COCOMO II organic calibration to estimate person-months and software investment. ([BEA WP2022-10](https://www.bea.gov/sites/default/files/papers/BEA-WP2022-10.pdf))
- The OpenStack effort model combined repository activity with a developer survey to estimate effort with bounded error. ([Robles et al.](https://dl.acm.org/doi/10.1145/2597073.2597107))
- GHTorrent is a **15TB+** offline mirror of GitHub API data. ([Gousios and Spinellis](https://gousios.org/pub/mining-soft-eng-data-github.pdf))
- LOC and commit counts are weak proxies for effort. One commit can represent minutes or days. Commit granularity varies. Bots, squashed commits, forks, and non-merged work distort counts. ([FAU thesis 2026](https://oss.cs.fau.de/wp-content/uploads/2026/04/Stenzel_2026.pdf), [Robles et al. 2022](https://arxiv.org/pdf/2203.09898))

**How to use it:** use GitHub as a **size prior** from `cloc` or linguist, and as a **duration prior** from first-to-last commit and active days. Do not treat it as a direct effort measure. Calibrate against known projects in the same domain.

### 8.4 Russian government procurement data, zakupki.gov.ru [EMPIRICAL]

This is a genuine data moat for Russian prices.

What exists:

- The EIS contract registry for 44-FZ and 223-FZ includes contract price, subject, OKPD2 code, customer, supplier, region, signing and execution dates, documents, and acceptance acts.
- There is an open-data section with datasets and an integration service, SOI, for programmatic access.
- The FTP channel `ftp.zakupki.gov.ru` was closed as a mass-export channel. Official dates differ by source: 2024-07-01 or 2025-01-01. Current access is through SOI using SOAP with a token or qualified electronic signature, or through the open-data section.
- Third-party aggregators expose REST APIs, for example gosplan.info, with 44-FZ, 223-FZ, and PPRF-615 data.

Sources: [Habr SOAP guide](https://habr.com/ru/articles/869934/), [EIS contract registry export guide 2026](https://tendergos.ru/vygruzka-reestra-kontraktov-iz-eis/), [gosplan history-data note](https://gosplan.info/docs/guides/history-data/), [gosplan Swagger](https://swagger.gosplan.info/), [finguide XML overview](https://infoculture.github.io/finguide/data-sources/federal/zakupki-xml), [Habr parsing experience](https://habr.com/ru/articles/1041566/).

How to turn it into an analogue engine:

1. Filter to OKPD2 codes for software development and services, for example 62.01, 62.02, and 62.09.
2. Extract contract price, subject text, duration, region, customer type, and supplier.
3. Normalize to **price per month** and, where the technical specification includes scope, to **price per function point** or per use case.
4. Build a reference-class distribution by domain, region, and size.
5. Use P50 and P80 price per PM as a market-rate benchmark and to sanity-check vendor rate cards.

**Caveat:** contract price is not effort. Many contracts bundle licenses, hardware, support, and VAT. Normalize carefully. Do not treat price as a pure development rate.

### 8.5 Kaggle and Hugging Face

Search terms that return effort datasets:

- “software effort estimation”
- “COCOMO”
- “function point effort”
- “PROMISE software engineering”
- “NASA93”, “Desharnais”, “China effort”

Quality and licensing vary. Prefer the original PROMISE or Zenodo mirrors.

---

## 9. Implementation blueprint

### 9.1 Input schema hints

```json
{
  "project": {
    "name": "string",
    "phase": "concept|approved|requirements|design|build",
    "domain": "web|mobile|backend|data|embedded|erp|other",
    "lifecycle": "waterfall|agile|hybrid"
  },
  "size": {
    "method": "IFPUG_FP|COSMIC_CFP|KSLOC|UCP|OBJECT_POINTS|STORY_POINTS",
    "value": 0,
    "reuse_pct": 0,
    "revl_pct": 0
  },
  "cocomo": {
    "scale_factors": {
      "PREC": "N",
      "FLEX": "N",
      "RESL": "N",
      "TEAM": "N",
      "PMAT": "N"
    },
    "effort_multipliers": {
      "RELY": "N",
      "DATA": "N",
      "CPLX": "N",
      "RUSE": "N",
      "DOCU": "N",
      "TIME": "N",
      "STOR": "N",
      "PVOL": "N",
      "ACAP": "N",
      "PCAP": "N",
      "PCON": "N",
      "APEX": "N",
      "PLEX": "N",
      "LTEX": "N",
      "TOOL": "N",
      "SITE": "N",
      "SCED": "N"
    }
  },
  "team": {
    "location": "RU|KZ|OTHER",
    "gross_salary_annual": 0,
    "employer_burden_pct": 0.30,
    "benefits_overhead_pct": 0.15,
    "utilization": 0.70,
    "leave_pct": 0.12,
    "turnover_pct": 0.12
  },
  "vendors": [
    {
      "name": "string",
      "rate_per_pm": 0,
      "coordination_pct": 0.15,
      "transition_pct": 0.10
    }
  ],
  "risk": {
    "contingency_level": 0.80,
    "correlation": 0.50,
    "risks": [
      {
        "name": "string",
        "probability": 0.20,
        "impact_low": 0,
        "impact_high": 0
      }
    ]
  },
  "finance": {
    "wacc": 0.12,
    "years": 3
  }
}
```

### 9.2 Estimation pipeline

1. **Normalize size** to FP or SLOC. Keep the original unit and the conversion provenance.
2. **Build the effort distribution:**
   - COCOMO II when architecture and size are known.
   - UCP when use cases exist.
   - Object points when prototyping.
   - ISBSG PDR times FP when analogues exist.
3. **Build the schedule distribution:**
   - COCOMO TDEV for greenfield work.
   - Critical path or PERT for WBS-based work.
   - Rayleigh staffing check for realism.
4. **Build the cost distribution:**
   - In-house loaded cost per PM times effort.
   - Outsourced rate times effort times (1 + coordination), plus transition and risk.
5. **Overlay risk:**
   - Bernoulli risks, correlation, and scope creep.
6. **Produce outputs:**
   - P10, P50, P80, and P90 for effort, duration, and cost.
   - In-house versus outsource TCO, NPV, IRR, and break-even PM.
   - Tornado sensitivity.
   - Assumptions and data provenance.

### 9.3 Defaults table

| Parameter | Default | Tag |
|---|---:|---|
| COCOMO II \(A\) | 2.94 | [CANON] |
| COCOMO II \(B\) | 0.91 | [CANON] |
| COCOMO II \(C\) | 3.67 | [CANON] |
| COCOMO II \(D\) | 0.28 | [CANON] |
| COCOMO hours per PM | 152 | [CANON] |
| UCP \(PF\) | 20 h/UCP | [CANON] default |
| UCP \(PF\) range | 15-30 h/UCP | [EMPIRICAL] |
| ISBSG PDR, traditional | 8.3 h/FP median | [EMPIRICAL] |
| ISBSG PDR, low-code | 1.8 h/FP median | [EMPIRICAL] |
| ISBSG MDR | 20-40 FP/person-month | [EMPIRICAL] |
| Utilization | 0.65-0.75 | [EMPIRICAL] |
| RU employer burden | 0.30 up to cap | [CANON law, 2026] |
| KZ employer burden | 0.175 | [CANON law, 2026] |
| Recruiting and replacement | 0.5x to 2x annual salary | [EMPIRICAL] |
| Vendor gross margin | 0.20-0.35 | [EMPIRICAL] |
| Coordination overhead | 0.10-0.25 of contract | [EMPIRICAL/RULE OF THUMB] |
| Contingency | P80 of simulation | [CANON method] |
| Flat contingency fallback | 0.15-0.30 | [RULE OF THUMB] |
| WACC, US software | 0.0934 | [EMPIRICAL] |
| WACC, emerging-market private IT | 0.10-0.15 | [RULE OF THUMB] |
| Scope creep | 1% per month | [EMPIRICAL] |
| Requirements change, total | 20-53% | [EMPIRICAL] |
| Cone, early phase | 0.25x to 4x | [DISPUTED] |

### 9.4 Validation metrics [CANON definitions]

\[
MMRE=\frac{1}{n}\sum\frac{|pred-actual|}{actual}
\]

\[
MdMRE=\text{median}\left(\frac{|pred-actual|}{actual}\right)
\]

\[
PRED(25)=\frac{\#\{|pred-actual|/actual\le0.25\}}{n}
\]

Also report:

- MARP, mean absolute relative error.
- MBRE, mean balanced relative error.
- SA, summary accuracy.
- Calibration slope and intercept.
- Out-of-sample performance using leave-one-out or k-fold cross-validation.

### 9.5 Guardrails

- Do not mix FP, CFP, SLOC, UCP, object points, and story points in one total.
- Do not use VAF by default. Use unadjusted FP.
- Do not treat the Standish numbers as a prior without the critiques.
- Do not run COCOMO II before the architecture and cost drivers are known.
- Do not confuse vendor margin with markup.
- Do not ignore correlation in Monte Carlo.
- Do not quote a single-point estimate. Quote a distribution and the confidence level.
- Do not use 2,080 hours as billable capacity.
- Do not use a universal LOC-per-FP ratio.
- Do not use COCOMO III as if it were released.

---

## 10. Where the literature disagrees and what not to trust

| Claim or constant | Status | Why it is unreliable | What to do instead |
|---|---|---|---|
| COCOMO II \(A=2.94\) is universal | [DISPUTED] | It is the II.2000 calibration on 161 projects. Older 2.45 and 2.5 values appear in pre-2000 material. | Use II.2000 and label the version. Calibrate locally. |
| COCOMO II has 16 effort multipliers | [DISPUTED] | The manual says 16 in prose but lists 17, including TOOL. | Use 17 for Post-Architecture and document the choice. |
| IFPUG VAF is mandatory | [DISPUTED] | CPM 4.3 and later make the 14 GSCs optional. ISO size is unadjusted. | Use unadjusted FP. Add VAF only if a client contract requires it. |
| COSMIC needs adjustment factors | [DISPUTED] | COSMIC has no VAF or GSC layer by design. | Use raw CFP. Do not apply IFPUG adjustments. |
| UCP productivity is 20 h/UCP | [EMPIRICAL] | Observed values range from 4 to 35 h/UCP. | Use 20 as a default, then calibrate. |
| Standish success and overrun rates | [DISPUTED] | Sampling, definitions, and disclosure are weak. The 189% figure is not a reliable prior. | Use the qualitative claim, then calibrate on your own data. |
| Cone of Uncertainty is measured | [DISPUTED] | The ranges are judgment-based 80% confidence limits, not a dataset. Real data are asymmetric. | Use it as a phase prior, not a statistical law. |
| Average IT overrun is 27% | [DISPUTED] | The mean hides a fat tail. One in six projects averages 200% overrun. | Model the distribution and use P80 or P90. |
| “66% overrun” describes infrastructure | [DISPUTED] | The 66% figure is the software subset of McKinsey’s IT sample, not infrastructure. | Attribute it correctly. Do not use it for construction. |
| Kazakhstan social tax is 9.5% | [DISPUTED] | That was the 2023-2024 rate. The 2026 employer burden is about 17.5%. | Use the 2026 table. Recheck the law each year. |
| Vendor margin equals markup | [DISPUTED] | Margin is a percentage of bill rate. Markup is a percentage of cost. | Convert explicitly with the formulas in §6.2. |
| WACC for software is 10-15% | [RULE OF THUMB] | Damodaran’s January 2026 US software WACC is 9.34%. Emerging-market private firms need a build-up. | Start from the published WACC, add country and size premiums. |
| ISBSG median PDR is a point estimate | [EMPIRICAL] | The distribution is wide. The median hides 3x to 6x variation. | Fit a lognormal and use P50 and P80. |
| COCOMO III is available | [DISPUTED] | It has been in draft since 2016 and is not a calibrated public model. | Use COCOMO II.2000. Monitor the COCOMO III page. |
| Putnam \(C_k\) is 2, 8, or 11 | [DISPUTED] | Units differ across sources. Real examples use values near 10,000. | Calibrate locally and check units. |
| A universal LOC-per-FP ratio exists | [DISPUTED] | Language, style, framework, and counting rules change the ratio. | Calibrate locally or use FP-calibrated models. |
| Story points convert to hours | [DISPUTED] | Story points are team-relative. | Use the team’s own velocity history only. |
| Outsourcing hidden costs are 190% | [DISPUTED] | This is one 26-project study and an outlier. | Use 10-25% coordination as a planning range, with a tail scenario. |
| Requirements creep is always 1% per month | [EMPIRICAL] | It is an industry average. Project context changes it. | Model as a distribution. Use 1% per month as a prior. |

---

## 11. Source list

### COCOMO and functional-size calibration

- COCOMO II.2000 manual, Otago mirror: https://www.cs.otago.ac.nz/cosc345/resources/COCOMO-II-2000.pdf
- COCOMO II.2000 manual, Rose-Hulman mirror: https://www.rose-hulman.edu/class/csse/csse372/201410/Homework/CII_modelman2000.pdf
- COCOMO II.2000 manual, Montana mirror: https://www.cs.montana.edu/courses/spring2004/352/public/cocomo/modelman.pdf
- Boehm CSSE COCOMO models: https://boehmcsse.org/tools/cocomo-models/
- Boehm CSSE COCOMO III: https://boehmcsse.org/tools/cocomo-iii/
- Clark, Introducing COCOMO III, DHS 2022: https://www.dhs.gov/sites/default/files/2023-01/Clark_Introducting_COCOMO_III_v1_Remediated.pdf
- COCOMO II.2000 Post-Architecture effort multipliers: http://staff.um.edu.mt/ecac1/files/COCOMOII_PostArchitecture_EffortMultipliers_17CostDrivers.pdf
- COCOMO II.2000 Early Design composite cost drivers: http://staff.um.edu.mt/ecac1/files/COCOMOII_EarlyDesign_CompositeCostDrivers.pdf
- COCOMO II.1998 calibration paper: https://dl.icdst.org/pdfs/files/8c4dc66410f39402092a65650a4418ca.pdf
- Hira, Calibrating COCOMO II for functional size, slides: https://www.dhs.gov/sites/default/files/publications/200827_calibratingcocomoiiforfsm_hira.pdf
- Hira dissertation: https://doi.org/10.25549/usctheses-c89-366241
- COCOMO 81 constants: https://athena.ecs.csus.edu/~buckley/CSc231_files/COCOMO.pdf
- DataCamp COCOMO tutorial, note on the 2.5 value: https://www.datacamp.com/tutorial/cocomo-model
- USC COCOMO risk example: https://slideum.com/doc/8278761/using-cocomo%C2%AE-ii-for-software-decisions

### IFPUG, COSMIC, UCP, and function-point productivity

- IFPUG CPM 4.3 release: https://ifpug.org/2009/10/01/the-international-function-point-users-group-announces-the-release-of-version-4-3-of-the-counting-practices-manual
- Total Metrics, VAF assessment: https://totalmetrics.com/help/Managing_your_Function_Point_Counts/Managing_Applications_Projects_and_Counts/Value_Adjustment_Factor/Assessing_the_Value_Adjustment_Factor.htm
- Function-point fundamentals with VAF formula: https://www.jodypaul.com/SWE/FunctionPointAnalysisFundamentals.pdf
- Third-party VAF formula mirror recorded in source: https://www.tutorialspoint.com.cach3.com/estimation_techniques/estimation_techniques_fp_counting_process.htm
- COSMIC Measurement Manual v5.0: https://cosmic-sizing.org/wp-content/uploads/2022/11/Combination-of-Parts-v5.0-Sep-2024.pdf
- COSMIC measurement manual page: https://cosmic-sizing.org/measurement-manual/
- Ochodek et al., Use Case Points: https://people.eecs.ku.edu/~saiedian/Teaching/811/Papers/Use-Case-Points/use-case-points-simplify.pdf
- Methods & Tools, Use Case Points: https://www.methodsandtools.com/archive/archive.php?id=25p3
- ISBSG MDR 2024: https://www.isbsg.org/wp-content/uploads/2025/01/2024-12-Manpower-Delivery-Rate.pdf
- ISBSG Java versus low-code: https://www.isbsg.org/wp-content/uploads/2022/05/Short-Paper-2021-12-Productivity-Java-Vs-Low-Code-Projects.pdf
- ISBSG traditional versus low-code: https://www.isbsg.org/wp-content/uploads/2021/08/Short-Paper-2021-06-Productivity-of-Low-Code-projects.pdf
- Lavazza et al. 2018, ISBSG R12 by language: https://doi.org/10.5277/e-inf180102

### LOC/FP conversion

- Capers Jones, Function points as a universal software metric, ACM SIGSOFT SEN 38(4), 2013: https://dl.acm.org/doi/pdf/10.1145/2492248.2492268
- Programming Languages Table mirror: https://www.cs.bsu.edu/homepages/dmz/cs697/langtbl.htm
- QSM function-point languages and gearing factors: https://qsm.com/resources/function-point-languages-table

### Judgment methods and bias

- Wideband Delphi: https://en.wikipedia.org/wiki/Wideband_delphi
- McConnell, Wideband Delphi excerpt: https://flylib.com/books/en/2.822.1.91/2/
- Agile Alliance, planning poker: https://agilealliance.org/glossary/planning-poker/
- Jørgensen 2004, expert judgment review: https://cms.simula.no/sites/default/files/publications/SE.4.Joergensen.2004.c.pdf
- Anchoring experiment: https://dl.acm.org/doi/10.1145/3167132.3167293
- Over-confidence in prediction intervals: https://dl.acm.org/doi/10.1016/S0164-1212(02)00160-7
- Risk identification paradox: https://dl.acm.org/doi/10.1016/j.infsof.2009.12.002

### Probabilistic aggregation

- Vose, three-point estimating: https://www.vosesoftware.com/Articles/Three-Point-Estimating.php
- NASA Cost Estimating Handbook: https://everyspec.com/NASA/NASA-General/download.php?spec=NASA_Cost_Estimating_HDBK-CEH-Ver-4-0.055787.pdf
- Measurable News, lognormal cost and schedule: https://mycpm.org/wp-content/uploads/2023/04/Measurable-News-Issue-4-2007-PG11_15.pdf
- Vose, cost contingency worked example: https://www.vosesoftware.com/Risk-In-Excel/Risk-Analysis-Example-Models-In-Excel/Cost-Contingency-Worked-Example.php
- Vose, integrated cost and schedule risk: https://www.vosesoftware.com/Risk-In-Excel/Risk-Analysis-Example-Models-In-Excel/Integrated-Cost-And-Schedule-Risk.php
- RunMonteCarlo math: https://runmontecarlo.com/maths
- NASA analytic method for probabilistic cost and schedule: https://cmapspublic3.ihmc.us/rid=1MHBNZSMH-1ZKX4WR-16GB/NASA%20Analytic%20Method%20for%20Probabilistic%20Cost%20%26%20Schedule%20Risk%20Analysis.pdf
- Flyvbjerg and Budzier, HBR 2011: https://hbr.org/2011/09/why-your-it-project-may-be-riskier-than-you-think
- Budzier working paper: https://ora.ox.ac.uk/objects/uuid:7139e1c6-1884-4563-807e-810715e78ce5/files/m47172bf0a46426d73d7046d357ab0605
- SCL, reference class forecasting: https://www.scl.org/3872-reference-class-forecasting-and-realistic-tech-contracts/
- McConnell cone of uncertainty: https://athena.ecs.csus.edu/~buckley/CSc231_files/McConell_ConeofUncertainty.pdf
- Construx cone of uncertainty: https://www.construx.com/wp-content/uploads/2023/03/ConeOfUncertainty_Scaled.pdf
- Bossavit critique summary: https://resources.rework.com/libraries/project-management/cone-of-uncertainty

### Empirical failure evidence

- DeFranco and Voas 2022, Standish table: https://doi.org/10.1109/mc.2022.3146648
- opencommons CHAOS summary: https://opencommons.org/CHAOS_Report_on_IT_Project_Outcomes
- Jørgensen and Moløkken-Østvold 2006: https://cms.simula.no/sites/default/files/publications/Jorgensen.2006.4.pdf
- Jenkins 2006 review: https://www.sciencedirect.com/science/article/abs/pii/S0950584905001023
- Eveleens and Verhoef 2009: https://doi.org/10.1109/ms.2009.154
- Glass 2006: https://dl.acm.org/doi/pdf/10.1145/1145287.1145301?download=true
- Glass 2006, base URL variant: https://dl.acm.org/doi/pdf/10.1145/1145287.1145301
- McKinsey 2012: https://www.mckinsey.com/capabilities/tech-and-ai/our-insights/delivering-large-scale-it-projects-on-time-on-budget-and-on-value
- CIO.de software subset: https://www.cio.de/article/3667811/software-projekte-zwei-drittel-uber-dem-budget.html
- ISBSG data description: https://www.isbsg.org/development-and-enhancement-data/

### Throughput, staffing, and schedule

- Putnam model: https://en.wikipedia.org/wiki/Putnam_model
- QSM effort-time trade-off: https://www.qsm.com/articles/familiar-metric-management-effort-time-trade-its-data
- Rayleigh derivation: https://dspmuranchi.ac.in/pdf/Blog/staffing%20level%20estimation.pdf
- SPI 2025 benchmark: https://forms.workday.com/content/dam/web/en-us/documents/reports/SPI_2025_Benchmark_Report.pdf
- SPI utilization note: https://spiresearch.com/the-truth-about-billable-utilization/
- Deltek professional-services benchmarks: https://www.deltek.com/resources/articles/professional-services-benchmarks/

### Economics, taxes, recruiting, and outsourcing

- FTS 2026 social-tax cap: https://www.nalog.gov.ru/rn77/news/activities_fts/16577139/
- FTS regional explanation: https://www.nalog.gov.ru/rn86/news/activities_fts/16596985/
- mybuh Kazakhstan 2026 rates: https://mybuh.kz/keyinfo/
- UPPERSETUP Kazakhstan 2026 payroll explainer: https://uppersetup.com/ru/blog/employer-payroll-taxes-and-contributions-in-kazakhstan-2026
- Kaspi Kazakhstan tax guide: https://guide.kaspi.kz/partner/ru/tax/conditions/general-mode/q2759
- Balanc.kz 2026 payroll taxes: https://balanc.kz/nalogi-i-vznosy-s-zarplaty-2026-kazakhstan/
- SHRM 2025 recruiting insights: https://www.shrm.org/executive-network/insights/people-strategy/state-of-recruiting-2025-insights-to-maximize-recruitment
- TrueStep cost of turnover: https://truestephr.com/sources/cost-of-turnover
- The Ash Group IT turnover and vacancy: https://www.theashgroup.com/the-true-costs-of-it-turnover-and-vacancy/
- Full Scale staff-augmentation markup: https://fullscale.io/blog/staff-augmentation-markup/
- ApTask IT staffing costs: https://aptask.com/guides/it-staffing-cost
- Supersourcing IT staffing fees: https://supersourcing.com/blog/it-staffing-agency-fees/
- Barthélemy, hidden costs of IT outsourcing: https://sloanreview.mit.edu/article/the-hidden-costs-of-it-outsourcing/
- Computerworld, costly surprises: https://www.computerworld.com/article/1325329/costly-surprises.html
- CIO, outsourcing governance leakage: https://www.cio.com/article/282138/outsourcing-9-ways-to-stop-your-it-outsourcing-deal-from-leaking-money.html
- AMCIS 26-project hidden-cost study: https://aisel.aisnet.org/cgi/viewcontent.cgi?article=1140&context=amcis2010
- Contract renewal and coordination: http://jitm.ubalt.edu/XXII-4/article3.pdf
- Damodaran WACC, January 2026: https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/wacc.html
- Damodaran WACC, no-tilde variant recorded in source: https://pages.stern.nyu.edu/adamodar/New_Home_Page/datafile/wacc.html

### Risk and requirements volatility

- Boehm, “Home Grounds” excerpt: https://studylib.net/doc/8490928/the-%E2%80%9Chome-grounds%E2%80%9D-of-agile-and-plan
- Davis et al. 2008, requirements change: https://doi.org/10.1109/compsac.2008.216
- Kulk and Verhoef, requirements volatility: https://www.cs.vu.nl/~x/qrv/qrv.pdf
- Jones 1994 requirements creep summary: https://www.slideserve.com/sakina/lecture-3-requirements

### Market-analogue data

- ISBSG subscriptions: https://www.isbsg.org/subscriptions/
- ISBSG overview 2025: https://www.isbsg.org/wp-content/uploads/2025/05/Short-Paper-2025-05-ISBSG-Overview.pdf
- ISBSG project data subscription: https://www.isbsg.org/product/project-data-subscription/
- PROMISE datasets: http://promise.site.uottawa.ca/SERepository/datasets-page.html
- Derek-Jones software-estimation datasets: https://github.com/Derek-Jones/Software-estimation-datasets
- Zenodo dataset record: https://zenodo.org/records/268461
- Nature Scientific Reports dataset table: https://www.nature.com/articles/s41598-025-14372-7/tables/1
- Dataset review: https://thesai.org/Downloads/Volume14No7/Paper_100-Review_of_Existing_Datasets_Used_for_Software_Effort_Estimation.pdf
- BEA WP2022-10, GitHub and software investment: https://www.bea.gov/sites/default/files/papers/BEA-WP2022-10.pdf
- Robles et al., OpenStack effort model: https://dl.acm.org/doi/10.1145/2597073.2597107
- Robles et al. 2022: https://arxiv.org/pdf/2203.09898
- Gousios and Spinellis, GHTorrent: https://gousios.org/pub/mining-soft-eng-data-github.pdf
- FAU thesis 2026 on commit proxies: https://oss.cs.fau.de/wp-content/uploads/2026/04/Stenzel_2026.pdf
- Habr SOAP guide for zakupki: https://habr.com/ru/articles/869934/
- EIS contract registry export guide 2026: https://tendergos.ru/vygruzka-reestra-kontraktov-iz-eis/
- gosplan history-data note: https://gosplan.info/docs/guides/history-data/
- gosplan Swagger: https://swagger.gosplan.info/
- finguide zakupki XML overview: https://infoculture.github.io/finguide/data-sources/federal/zakupki-xml
- Habr parsing experience: https://habr.com/ru/articles/1041566/
