# РадиоХак 4.0: event brief, ТМК++ track, and rubric evidence

**Compiled:** 8 November 2026. **Event status:** starts 9 November 2026.

**Legend**

- ✅ **VERIFIED**: stated by a primary source (official event page, official Telegram channel, partner announcement).
- ⚠️ **INFERRED**: analysis, estimate, or recommendation. Not published by the organizers.

> **Critical timing (✅).** Start: **9 November 2026, 10:00 Yekaterinburg time (UTC+5)**. Stop-code: **10 November 2026, 22:00**. Defenses: **11 November 2026, 10:00-11:30**. Awards: **12 November 2026, 10:00-14:00**. Registration closed early: **2 November 2026, 14:00 Yekaterinburg time**.

---

## TL;DR

- РадиоХак 4.0 is the fourth season of the student hackathon run by **Союз студентов ИРИТ-РТФ, УрФУ** (Yekaterinburg). It is online, runs **9-12 November 2026**, and uses the **Кузница** platform.
- Two tracks: **01 «Сделать или заказать»** from **ТМК++** (8 teams) and **02 «Закрытый контур»** from **РЕГЛАБ** (9 teams).
- Money: **120 000 ₽ total**, of which **60 000 ₽ on the ТМК++ track**, plus a **2027 internship at АО «ДИАЙПИ»** for the best participants. The split by place is not published.
- The ТМК++ case is a **make-or-buy / TCO calculator for IT work**: take a task description, estimate effort, time and cost, compare an in-house team against a contractor, include market analogues, risks and assumptions, and present the result in a clear interface.
- The scoring language sits inside the case itself: «не на глаз, а с расчётом, который можно проверить и объяснить» and «работающий прототип с полным сценарием».
- **No official rubric or weights are public** for this event. Кузница's illustrative default is Product 40 / Technical implementation 40 / Presentation 20. Comparable Russian corporate hackathons converge on problem fit 20-25, working prototype 20-25, feasibility 20-25, evidence and risks 10-15, presentation 15-20.
- ⚠️ Inferred rubric for this track: case fit and full scenario **25**, working prototype **25**, verifiable calculation **20**, UX **15**, pitch **15**.
- The real build window is **about 36 hours**, not four days. The defense slot is **at most about 11 minutes per team**.
- The biggest ways to lose: a black-box calculator with one magic rate, a canned demo, missing submission artifacts, and a model that ignores ТМК++'s insourcing cost reality.

---

## 1. Event ID card

| Item | Fact | Status | Source |
|---|---|---|---|
| Name | РадиоХак 4.0 | ✅ | [event page](https://urfu.kuznitsa.tech/e/radiohack4), [channel](https://t.me/s/radiohack_rtf) |
| Organizer | **Союз студентов ИРИТ-РТФ**, УрФУ. ИРИТ-РТФ is the Institute of Radio Electronics and Information Technology, Yekaterinburg | ✅ | [event page footer](https://urfu.kuznitsa.tech/e/radiohack4) |
| Dates | **9-12 November 2026** | ✅ | [event page](https://urfu.kuznitsa.tech/e/radiohack4) |
| Format | **Online**, four days. Participants are excused from classes | ✅ | [event page](https://urfu.kuznitsa.tech/e/radiohack4), [post 108](https://t.me/radiohack_rtf/108) |
| Platform | **Кузница** at `urfu.kuznitsa.tech`. Handles registration, track choice, solution upload and expert evaluation | ✅ | [post 106](https://t.me/radiohack_rtf/106), [kuznitsa.tech](https://kuznitsa.tech/) |
| Team size | **3-5 people**, pre-formed teams | ✅ | [event page FAQ](https://urfu.kuznitsa.tech/e/radiohack4) |
| Eligibility | General channel post: students **2nd year and above**. ТМК track card: **2-3 course, IT specialties**. The two formulations differ | ✅, with a discrepancy to check | [post 102](https://t.me/radiohack_rtf/102), [event page](https://urfu.kuznitsa.tech/e/radiohack4) |
| Prize fund | **120 000 ₽ total**, **60 000 ₽ for the ТМК++ track**. Distribution by place is not published | ✅ | [post 102](https://t.me/radiohack_rtf/102), [post 105](https://t.me/radiohack_rtf/105) |
| Extra prize | **2027 internship at АО «ДИАЙПИ»** for the best participants | ✅ | [post 105](https://t.me/radiohack_rtf/105) |
| Registration | Opened in post 102, deadline **2 November 14:00 Yekaterinburg time**, then closed early because all teams were filled | ✅ | [post 102](https://t.me/radiohack_rtf/102), [post 104](https://t.me/radiohack_rtf/104) |
| Capacity | ТМК track: **8 teams**, full. РЕГЛАБ track: **9 teams** | ✅ | [event page](https://urfu.kuznitsa.tech/e/radiohack4), [post 103](https://t.me/radiohack_rtf/103) |

### 1.1 Tracks

| # | Track | Partner | Audience | Teams | Source |
|---|---|---|---|---|---|
| 01 | **«Сделать или заказать»**, tool for evaluating IT work | **ТМК++** | 2-3 course, IT specialties | 8 | [event page](https://urfu.kuznitsa.tech/e/radiohack4), [post 105](https://t.me/radiohack_rtf/105) |
| 02 | **«Закрытый контур»**, «Externum Setup: единый графический установщик для Astra Linux» | **РЕГЛАБ** | 2nd course and above | 9 | [event page](https://urfu.kuznitsa.tech/e/radiohack4), [post 109](https://t.me/radiohack_rtf/109) |

The launch post frames the range of tasks in one line ([post 101](https://t.me/radiohack_rtf/101)):

> «Собирай команду из 3-5 студентов 2 курса и старше... с 9 по 12 ноября реальные задачи: от разработки графического ПО для ОС Astra Linux до создания инструментов оценки ИТ-работ»

Registration closed before the deadline. The announcement ([post 104](https://t.me/radiohack_rtf/104)) says, in fragments:

> «Регистрация объявляется закрытой! Все команды набраны, треки укомплектованы... закрыть регистрацию намного раньше»

The ТМК track specifically was full ([post 103](https://t.me/radiohack_rtf/103)):

> «Команды набраны на трек от ТМК!»

### 1.2 Money and status

- ✅ **60 000 ₽ per track**, 120 000 ₽ across two tracks ([post 102](https://t.me/radiohack_rtf/102), [post 105](https://t.me/radiohack_rtf/105)).
- ⚠️ The number of prize places and the 1st/2nd/3rd split are **not published**. Ask the organizers.
- ✅ The internship is at **АО «ДИАЙПИ»**, the key legal entity of the ТМК++ IT cluster.
- ✅ The event is **online**. There is no venue requirement in any public source.

---

## 2. The ТМК++ track case, verbatim

### 2.1 Official case text

Source: partner announcement, [post 105](https://t.me/radiohack_rtf/105). Preserved exactly, including formatting and emoji.

> **«Разработка инструмента оценки ИТ-работ»**
>
> Представьте, что компании необходимо реализовать ИТ-проект, но возникает вопрос: выгоднее поручить работу собственной команде или обратиться к внешнему подрядчику?
> Участникам предстоит разработать инструмент, который поможет сравнить эти два варианта и объективно оценить **трудоёмкость, сроки и стоимость** выполнения ИТ-задач.
>
> Что должен уметь сервис:
> 🔹 Принимать описание ИТ-задачи и рассчитывать предполагаемые затраты.
> 🔹 Сравнивать стоимость и сроки работы внутренней команды и подрядчика.
> 🔹 Учитывать **рыночные аналоги, возможные риски и допущения**.
> 🔹 Представлять результаты в понятном и удобном интерфейсе.

### 2.2 The scoring phrase from the track card

Source: [event page](https://urfu.kuznitsa.tech/e/radiohack4). This is the single most important sentence for the defense.

> «Помогите компании отвечать на этот вопрос не на глаз, а с расчётом, который можно проверить и объяснить. К защите — работающий прототип с полным сценарием.»

### 2.3 What the wording requires

Three phrases act as the rubric in plain language:

1. **«можно проверить»**. Every number must trace back to a formula and a named source. A rate with no derivation fails this test.
2. **«и объяснить»**. The model must be explainable to a non-technical business stakeholder. A black box with one coefficient fails this test.
3. **«полный сценарий»**. The deliverable is not a calculator screen. It is the full path from a task description to a decision: input, estimate, comparison, risks, assumptions, result, export.

### 2.4 Who the customer is

- ✅ **ТМК++** is the in-house IT cluster of Трубная Металлургическая Компания. It is an **insourcing** structure of about 1 000 people, formed in 2022, covering infrastructure, security, development, architecture, digital and client service ([hh.ru profile](https://hh.ru/article/30553), [ТМК++ history](https://tmkplusplus.tmk-group.ru/history)).
- ✅ **АО «ДИАЙПИ»** is the key legal entity of the cluster. It is an accredited IT company since 2015, based in Chelyabinsk, with 2.459 bn ₽ revenue in 2024 and rank 239 in TAdviser500 ([TAdviser](<https://www.tadviser.ru/index.php/%D0%9A%D0%BE%D0%BC%D0%BF%D0%B0%D0%BD%D0%B8%D1%8F:%D0%94%D0%98%D0%90%D0%99%D0%9F%D0%98_(%D0%A2%D0%9C%D0%9A)>)), [ТМК++ history](https://tmkplusplus.tmk-group.ru/history)).
- ✅ **Implication for the model.** The jury are the people who sell internal IT to the business and buy from contractors. They will check whether the calculation reflects **their** cost reality: loaded FTE cost, contractor margin, management overhead, ramp-up, acceptance, knowledge transfer, bench and idle time. A textbook rate card alone will not convince them.

### 2.5 FAQ: participation, format, submission

| Question | Answer | Status and source |
|---|---|---|
| Who can participate? | Students of UrFU, 2nd year and above per the channel. The ТМК track card says **2-3 course, IT specialties**. If you are a 4th-year student, verify before relying on the general wording | ✅, discrepancy |
| How large is a team? | **3-5 people**, teams must be pre-formed | ✅ [event page](https://urfu.kuznitsa.tech/e/radiohack4) |
| Is it online? | Yes, fully online | ✅ [event page](https://urfu.kuznitsa.tech/e/radiohack4) |
| Are classes excused? | Yes, the schedule announcement mentions «освобождение» | ✅ [post 108](https://t.me/radiohack_rtf/108) |
| Which platform? | **Кузница**, `urfu.kuznitsa.tech/e/radiohack4` | ✅ [post 106](https://t.me/radiohack_rtf/106) |
| How many teams? | ТМК track: **8**, full. РЕГЛАБ track: **9** | ✅ [event page](https://urfu.kuznitsa.tech/e/radiohack4), [post 103](https://t.me/radiohack_rtf/103) |
| What is the prize? | **60 000 ₽** on the track, **120 000 ₽** across the event. Place split not published | ✅ [post 102](https://t.me/radiohack_rtf/102), [post 105](https://t.me/radiohack_rtf/105) |
| Is there an internship? | Yes, **2027**, at **АО «ДИАЙПИ»**, for the best participants | ✅ [post 105](https://t.me/radiohack_rtf/105) |
| Can I still register? | No. Registration closed early on **2 November 14:00**; all teams were filled | ✅ [post 104](https://t.me/radiohack_rtf/104) |
| What exactly must be uploaded? | **Not published for 4.0.** The 3.0 precedent is the working assumption (see §4) | ⚠️ inferred |

---

## 3. Schedule and the real time budget

### 3.1 Programme

All times are Yekaterinburg local, **UTC+5**.

| Date | Time | Activity | Source |
|---|---|---|---|
| 9 November | 10:00 | Start | [event page](https://urfu.kuznitsa.tech/e/radiohack4) |
| 9 November | 10:30 | Q&A on the cases | [event page](https://urfu.kuznitsa.tech/e/radiohack4) |
| 9 November | 19:00-20:30 | Expert consultations | [event page](https://urfu.kuznitsa.tech/e/radiohack4) |
| 10 November | 13:00-14:30 | Expert consultations | [event page](https://urfu.kuznitsa.tech/e/radiohack4) |
| 10 November | **22:00** | **Stop-code**, hard upload deadline | [event page](https://urfu.kuznitsa.tech/e/radiohack4) |
| 11 November | **10:00-11:30** | **Defenses**, all 8 teams in 90 minutes | [event page](https://urfu.kuznitsa.tech/e/radiohack4) |
| 12 November | 10:00-14:00 | Winners announcement and awards | [event page](https://urfu.kuznitsa.tech/e/radiohack4) |

The schedule post itself is an image ([post 108](https://t.me/radiohack_rtf/108)), so the table above follows the event page text.

### 3.2 The math

| Window | Duration | What it means |
|---|---|---|
| 9 Nov 10:00 → 10 Nov 22:00 | **36 hours wall clock** | The entire build window. Includes Q&A, consultations, meals and sleep |
| Q&A, 9 Nov 10:30 | about 0.5 h | The only guaranteed access to the case owner before the sprint |
| Consultations, 9 Nov 19:00-20:30 | 1.5 h | Optional expert feedback. Use it to validate the cost model |
| Consultations, 10 Nov 13:00-14:30 | 1.5 h | Last chance to check the model before freeze |
| Stop-code, 10 Nov 22:00 | hard deadline | Upload must be complete. The organizers enforce deadlines |
| Defenses, 11 Nov 10:00-11:30 | 90 min for 8 teams = **11.25 min per team** at most | ⚠️ With transitions, likely 8-10 min per team, probably 5 min pitch plus 3-5 min Q&A |

⚠️ **Realistic capacity.** Subtract roughly 1 hour of Q&A, 3 hours of optional consultations, 12-14 hours of sleep across two nights, and 3 hours for meals and context switching. That leaves **about 18-24 hours of focused hands-on work**, not 36. Plan for the lower bound.

⚠️ **Defense format.** The only public fact is the 90-minute block for 8 teams. A 5-minute pitch followed by questions is the safe assumption. Rehearse to 4:40 and prepare a 90-second fallback.

**What the timetable rules out:** a four-day product. This is a two-day sprint with a morning defense. Scope must be frozen by the evening of 9 November, and the demo must be runnable by the afternoon of 10 November.

---

## 4. Submission artifacts (⚠️ inferred from the 3.0 precedent)

No artifact list for 4.0 is published. The closest primary evidence is the 3.0 requirement ([post 91](https://t.me/radiohack_rtf/91)):

- A **public info-repo** containing links to the code repositories (web or mobile, plus backend).
- A **description** explaining the features and the hypotheses from the case section **«Проработка пользовательских сценариев»**.
- **Screenshots or a video demo**.
- An **APK** if the product is Android.

### 4.1 Working checklist for the ТМК++ track

⚠️ Treat every line as inferred until the organizers confirm in the chat. The mapping to a web tool is a recommendation:

1. **Public info-repo** with a top-level README.
2. **Links to frontend and backend repositories.** Keep them public or grant access before the stop-code.
3. **README feature map**, with one section per case requirement: input, estimate, comparison, market analogues, risks, assumptions, UI.
4. **Run instructions** that work from a clean machine: environment variables, seed data, one command to start.
5. **Demo video, 60-90 seconds**, plus screenshots in the README.
6. **Assumptions and risks section** visible in both the product and the README.
7. **No secrets in the repository.** Rotate any key that was ever committed.
8. **Upload to Кузница before 22:00 on 10 November**, with a buffer of at least one hour.

If the 4.0 case has named sections such as «Проработка пользовательских сценариев», mirror them one-to-one in the README and the pitch. Juries score against the case's own structure, and the 3.0 post shows that the organizers name those sections explicitly.

---

## 5. Previous seasons: what is documented and what is not

| Season | Dates | Format and cases | What won | What is not public | Source |
|---|---|---|---|---|---|
| **1.0** (number not stated in the source; chronologically first) | 25-27 April 2025, online | 48 teams. Three cases across two tracks: **«Аналитика» (Wildberries & Russ)** and **«Веб + игровой» (Контур)**. 60 000 ₽ per track. Defenses 29-30 April, awards 7 May 2025 | **«Дикие ягоды»**, 1st place in Аналитика: Екатерина Безукладникова, Кирилл Цепелев, Анна Кравченко, all first-year students. **«Бомбардило Крокодило»**, 1st place in Веб+игровой: Денис Линберг, Михаил Соломеин, Сергей Стахеев, Данил Трифонов, Сергей Цыпышев, all third-year | The official season number, the full jury protocol, the exact prize split, and the full team roster | [УрФУ newspaper PDF, May 2025](https://elar.urfu.ru/bitstream/10995/143439/1/uf_2025_09.pdf) |
| **2.0** | October 2025 | Cases from **ТМК** (Telegram Mini App for client order automation), **Контур** («Разработка следующего большого продукта для Контура»), and **Екатеринбургская городская дума** | 1st place on the Контур case per a participant's CV. The гордума project continued after the hackathon as a real pilot, «Цифровой кабинет депутата» | Complete winner list, all track results, official score tables | [solution repo](https://github.com/Mihendy/RadioHack2.0_TMK), [CV](https://www.toropov.dev/), [Urals24](https://ural24.com/news/prilozhenie_dlya_raboty_ekaterinburgskoj_dumy_s_dokumentami_protestiruet_molodyozhnaya_palata) |
| **3.0** | April-May 2026 | **10 teams selected**: 67бит, Minions-MK, DIAMOND DOGS, RTF Wizards, 2Д1Т, payasos, Nexa, Котята овощата, downcastики, Monkey Business. One case published at the opening. Stop-code 30 April 18:00, defenses 5 May, awards 7 May 2026 | **Not published.** The channel's public archive jumps from the 7 May announcement to the 4.0 teaser | Winners, case text, partner list, scores | [post 85](https://t.me/radiohack_rtf/85), [post 92](https://t.me/radiohack_rtf/92), [channel](https://t.me/s/radiohack_rtf) |
| **4.0** | 9-12 November 2026 | ТМК++ and РЕГЛАБ, 17 teams total | In progress | Winners and scores | [event page](https://urfu.kuznitsa.tech/e/radiohack4) |

### 5.1 What the history actually tells you

1. **The closest analogue to this case was the «Аналитика» track in the first season, and first-year students won it.** That track rewarded a clear analytical product, not the deepest ML. Do not assume the jury wants engineering sophistication.
2. **The most durable outcome of 2.0 was the гордума app, which went to a real pilot.** Judges in this ecosystem visibly value "can this be used next quarter", and the customer said so publicly.
3. **3.0 was a single case with 10 teams over about three days.** 4.0 has 8 teams on the ТМК track. The jury will remember every team, and the gap between 1st and 3rd place will come from demo quality and defensibility, not feature count.
4. **Submission hygiene is enforced.** The 3.0 post lists the info-repo, code links, description, screenshots or video and APK ([post 91](https://t.me/radiohack_rtf/91)). Assume the same template for 4.0 until told otherwise.
5. **The 2.0 ТМК solution was a full-stack Telegram Mini App**, with ASP.NET Core 8, Next.js, Postgres and Docker ([repo](https://github.com/Mihendy/RadioHack2.0_TMK)). The winning bar on a ТМК case was a complete, runnable product, not a mockup.

---

## 6. Rubric evidence: what is public and what is not

### 6.1 What is public

- ❌ **No official положение or регламент** for РадиоХак 4.0. The only public rules are the FAQ on the event page.
- ❌ **No published criteria or weights.** Nothing on the landing page, nothing in the Telegram channel, nothing on the public Кузница page.
- ✅ **The platform supports weighted criteria and can show them to participants.** Кузница's own materials describe judging criteria configured per event, and at another event on the platform participants "saw the criteria they were judged by" ([Кубок Оренбуржья case](https://kuznitsa.tech/works/orenburg-programming-cup)).
- ⚠️ **Practical move:** open the event card inside Кузница and check the participant chat. The rubric may be visible after registration even though it is absent from the public page.

### 6.2 The platform's illustrative default (not necessarily РадиоХак's)

Кузница's demo judging screen uses three blocks ([kuznitsa.tech](https://kuznitsa.tech/)):

| Block | Weight | Sub-criteria |
|---|---|---|
| Продукт | 40% | Оригинальность идеи /10, соответствие треку /10 |
| Техническая реализация | 40% | Качество кода /10 |
| Презентация | 20% | Чёткость защиты /10 |

The organizer can edit this. The value of the example is its mental model: **product plus technical implementation plus pitch, with pitch at about 20%**.

### 6.3 Comparable Russian corporate and case hackathons with published weights

| Event | Criteria and weights | Source |
|---|---|---|
| **Сбер «Уральский код»** (Yekaterinburg, 2025) | Four equal criteria, scored 1-5: idea, feasibility, benefit, monetisation and development cost; product implementation (architecture, performance, scalability); look and usability; presentation and public speaking | [положение](http://xn--80ailedcd2alms5i.xn--p1ai/document) |
| **Биохакатон «Фарватер» 2026** | 25% realizability · 20% innovation and technology · 15% efficiency and quality of elaboration · 25% implementation effect · 15% presentation | [FAQ](https://biohackathon.ru/faq.php) |
| **Hackathon rubric, NAO administration** | Five criteria scored 0-3: fit to the task, completeness of the solution and functionality, **usability**, technological maturity, quality of the public presentation. Plus expert scores 0-5 and a mentor coefficient of 0.7-1.0 | [PDF](https://hack.adm-nao.ru/files/kriterii.pdf) |
| **«Атомик Хак 3.0»** (Rosatom × UrFU, 2025) | Fit to the technical specification, innovation, quality of code and documentation. Weights not published | [UrFU news](https://urfu.ru/ru/news/56647/) |
| **Corporate hackathon rubric** (av55.ru, 2026) | 25% fit to the task and value · 15% evidence of need · 20% **working prototype** · 20% potential for a pilot · 10% data, security and risks · 10% clarity of the demo | [av55.ru](https://av55.ru/articles/korporativnyy-hakaton-2026/) |
| **ITKAN AI Hackathon** | 20% problem and impact · 15% originality · **25% working demo** · 25% quality of AI use · 15% presentation | [judging page](https://www.itkan.one/I-Hackathon/judging) |
| **Stavleak template** | 4-6 criteria with weights summing to 100, plus evidence anchors per level | [toolkit](https://org.stavleak.com/ru/toolkit/judging-criteria) |

### 6.4 The convergence pattern

Across the published rubrics, the weights cluster around:

| Dimension | Typical range |
|---|---|
| Problem fit and value | 20-25% |
| Working prototype | 20-25% |
| Feasibility and technical implementation | 20-25% |
| Evidence, data and risks | 10-15% |
| Presentation | 15-20% |

Mature events publish these weights before the start. РадиоХак 4.0 does not, which is why §7 is labeled as inference.

---

## 7. Inferred rubric for the ТМК++ track (⚠️ not official)

Derived from the case's own wording, the platform default and the comparables in §6.3.

| Criterion | Weight | Verbatim requirement it serves | What the jury will actually look for | Basis |
|---|---|---|---|---|
| **Соответствие кейсу и полнота сценария** | 25% | «работающий прототип с полным сценарием»; all four capability bullets | The full path works end to end: task description → estimate → in-house vs contractor comparison → risks and assumptions → decision output | Case text, Кузница product block |
| **Работоспособный прототип** | 25% | «работающий прототип» | Runs live on **the judge's own input**, not on canned data. The repository starts from the README | ITKAN 25% demo, av55 20% prototype, Кузница 40% technical implementation |
| **Обоснованность и проверяемость расчёта** | 20% | «не на глаз, а с расчётом, который можно проверить и объяснить»; «рыночные аналоги, возможные риски и допущения» | Visible formulas, sourced rates, explicit assumptions, ranges P50/P80, sensitivity analysis, a back-test with a stated error | Case text, estimation literature in §8 |
| **UX и понятность результата** | 15% | «в понятном и удобном интерфейсе» | A CFO understands the comparison screen in 30 seconds. Export to PDF or Excel | Кузница product block, NAO usability criterion, Сбер usability criterion |
| **Питч и ответы на вопросы** | 15% | Defense format | Five minutes, every team member can answer, no overrun, survives "where did this rate come from?" | Кузница 20% presentation, comparables 15-20% |
| **Total** | **100%** | | | |

### 7.1 Requirement-to-artifact map

| Verbatim requirement | Where it must appear | Primary criterion |
|---|---|---|
| «Принимать описание ИТ-задачи и рассчитывать предполагаемые затраты» | Input wizard and estimation engine | Case fit, prototype |
| «Сравнивать стоимость и сроки работы внутренней команды и подрядчика» | Side-by-side comparison screen | Case fit |
| «Учитывать рыночные аналоги, возможные риски и допущения» | Benchmark table, assumptions registry, risk register | Verifiable calculation |
| «Представлять результаты в понятном и удобном интерфейсе» | Comparison dashboard, report export | UX |
| «работающий прототип с полным сценарием» | Live demo and runnable repository | Prototype |
| «расчёт, который можно проверить и объяснить» | Formula drill-down, sources, P50/P80, sensitivity | Verifiable calculation |

⚠️ **Alternative scenario.** If the organizers use the Кузница default unchanged, technical implementation jumps to about 40%. In that case, repository quality, README, tests and runnability are not optional. They are worth building either way, because they also support the "working prototype" criterion.

---

## 8. What typically loses

### 8.1 Generic failure modes

1. **Slides instead of a running product.** ITKAN states that "a great idea that doesn't run can't win", and the working demo carries 25% there ([source](https://www.itkan.one/I-Hackathon/judging)). Devfolio's judging system explicitly hunts claim-code mismatches with file and line citations ([source](https://devfolio.co/blog/the-discerning-machine/)). Assume at least one juror opens the repository.
2. **Promising more than was built.** The av55 rubric has a separate criterion for whether the team separates what is done from what is promised ([source](https://av55.ru/articles/korporativnyy-hakaton-2026/)). Admitting a stub costs little. Hiding one and being caught costs the podium.
3. **Pitch theatre replacing evidence.** A large separate weight for "quality of delivery" lets stage confidence crowd out substance, a known rubric anti-pattern ([Stavleak](https://info.stavleak.com/ru/guides/kriterii-ocenki-hakatona)).
4. **Missing mandatory artifacts.** At 3.0, no public info-repo with code links, description, screenshots or video meant no evaluation ([post 91](https://t.me/radiohack_rtf/91)).
5. **Late upload.** The stop-code is 22:00 on 10 November, and the organizers have enforced deadlines before ([post 92](https://t.me/radiohack_rtf/92)).

### 8.2 Failure modes specific to an estimation case

6. **A black-box calculator.** One magic coefficient, for example "берём 2 500 ₽/час", with no derivation. This directly violates «расчёт, который можно проверить и объяснить».
7. **No data grounding.** Lack of historical data is one of the most consistently reported causes of inaccurate estimates ([Basten & Sunyaev, CAIS 2014](https://doi.org/10.17705/1cais.03404)). Organizations that do not retain project data are "flying blind" ([QSM](https://qsm.com/articles/problems-software-development-seen-professional-estimators)). Practitioners systematically underestimate by about 25-30% ([ArtofBA](https://www.artofba.com/post/business-analysis-task-estimation-1), [DOU](https://dou.ua/lenta/articles/estimation-of-labor-input-1/)). A serious tool shows a calibration factor and a back-test, not a raw number.
8. **Ignoring hidden cost buckets.** The correct frame is TCO: direct costs plus management, launch, downtime, risks and knowledge transfer. For outsourcing, add requirements preparation, customer-side management, acceptance, scope changes and result handover ([TProger, 2026](https://tproger.ru/articles/vydelennye-komandy-autsors-ili-inhaus-kak-schitat-realnyj-tco)). A richer component list includes management overhead, ramp tax, bench tax, coordination, knowledge attrition and termination ([TCD framework, aiDOOS](https://aidoos.com/blog/total-cost-of-delivery-framework/)). Rate times hours loses to this.
9. **A single number with no risk.** No range, no Monte Carlo, no sensitivity tornado means it is a calculator, not a decision tool. The case explicitly asks for «риски и допущения».
10. **No market analogues.** The case asks for «рыночные аналоги». The jury question you must survive is: "Чем это отличается от Excel и COCOMO?" Prepare a four-row answer.
11. **Building for the wrong customer.** ТМК++ is an insourcer whose job is to justify internal delivery. If the model structurally favors the contractor, with no internal overhead, no bench and no knowledge-transfer cost, the domain logic is wrong.
12. **Scope creep into a fake AI product.** The window is 36 hours. A transparent deterministic model with sensitivity beats an "ML estimator" trained on zero data, and the jury will ask what it was trained on.

---

## 9. Build and pitch plan mapped to the rubric

### 9.1 Minimum viable, maximally scoreable product

- **Input wizard.** A structured task card: type of work (development, analytics, QA, PM, DevOps), stack, complexity, integrations, non-functional requirements, deadline, team location. Free-text parsing is a bonus, never the only path.
- **Estimation engine.** Three-point PERT (optimistic, most likely, pessimistic) per role, converted to person-hours and cost.
  - Internal: `loaded rate = salary × (1 + taxes + overhead + bench factor)`.
  - Contractor: `rate card × hours + margin + customer-side management + acceptance + knowledge transfer + risk buffer`.
  - Timeline: effort divided by capacity, with parallelization.
- **Comparison screen.** In-house versus contractor side by side: cost, duration, **risk-adjusted cost P50/P80**, break-even point. This is the screen the jury remembers.
- **Explainability layer.** Click any number to see the formula and the source. Assumptions registry and risk register are first-class UI elements, not an appendix. A sensitivity tornado chart answers "which input moves cost most".
- **Report.** One-click PDF or Excel export with assumptions and sources. This is the artifact a real manager takes to a decision meeting.
- **Proof.** Two or three reference cases, back-tested with a stated error percentage, plus a calibration coefficient.

### 9.2 36-hour schedule

Hour 0 is 9 November, 10:00. The stop-code is hour 36.

| Block | Hours | Deliverable | Rubric criterion served |
|---|---|---|---|
| Model and data | 0-3 | Cost buckets fixed, 10-15 rate data points collected, assumptions frozen | Case fit, verifiable calculation |
| Engine | 3-12 | PERT, loaded rate, contractor cost, risk buffer, Monte Carlo, unit tests on three reference cases | Prototype, verifiable calculation |
| Interface | 12-24 | Three screens (input, comparison, report) plus PDF/Excel export | UX, full scenario |
| Demo and packaging | 24-32 | Seeded demo data, 60-90 second video, README, info-repo, screenshots | Prototype, submission |
| Pitch and submit | 32-36 | Six-slide deck, three rehearsals, upload at least one hour before 22:00 | Pitch |
| Defense morning | 11 Nov, 09:00 | One full run-through, fallback demo recorded | Pitch, prototype |

### 9.3 Submission package

Mirror the 3.0 template:

1. Public info-repo.
2. Links to frontend and backend repositories.
3. README with run instructions and a feature map.
4. One section per case requirement, including «рыночные аналоги», «риски» and «допущения».
5. Screenshots plus a 60-90 second video.
6. No secrets in the repository.

### 9.4 Five-minute pitch

| Time | Content |
|---|---|
| 0:00-0:30 | Problem and who pays for the wrong make-or-buy decision |
| 0:30-3:00 | Live demo on a judge's input: task, estimate, comparison, risks, export |
| 3:00-4:00 | Why the numbers are trustworthy: formula, rate sources, P50/P80, sensitivity |
| 4:00-4:30 | Pilot plan: two weeks, five real tasks, target MAPE ≤ 25% |
| 4:30-5:00 | Team and what each member owns |

Rehearse to 4:40. Record a fallback demo video in case the live environment fails.

### 9.5 Two questions for the 9 November 10:30 Q&A

These also signal competence to the case owner:

1. «Какие статьи затрат ТМК++ считает обязательными в сравнении, например ramp-up, bench, передача знаний, приёмка?»
2. «Есть ли у вас исторические данные по фактическим трудозатратам проектов, на которых можно откалибровать модель, или нам закладывать допущения?»

---

## 10. Open questions for the organizers

1. **Is the rubric visible in Кузница?** If yes, what are the criteria and weights?
2. **How is the 60 000 ₽ split across places?** One winner or a top three?
3. **What is the exact defense format?** Pitch length, Q&A length and whether the demo must be live.
4. **Is the 4.0 artifact list identical to 3.0?** Public info-repo, code links, description, screenshots or video, APK.
5. **Which eligibility rule applies to the ТМК track?** The card says 2-3 course and IT specialties, while the general post says 2nd year and above. This matters for 4th-year participants.
6. **Are historical actuals available for calibration?** Even a small anonymized dataset changes the model design.
7. **Which cost buckets are mandatory in the comparison?** Ramp-up, bench, knowledge transfer, acceptance, customer-side management.
8. **Are market analogues expected as a comparison table**, or is a narrative mention enough?
9. **Will the jury test the product with its own input?** If yes, the demo must accept arbitrary tasks.
10. **Can a team switch tracks?** Registration is closed and tracks are full, but confirm the lock.

Contact named in the research: [@cattushka](https://t.me/cattushka).

---

## Appendix A. Sources

### Official event sources

- Event page: [urfu.kuznitsa.tech/e/radiohack4](https://urfu.kuznitsa.tech/e/radiohack4)
- Official Telegram channel: [t.me/s/radiohack_rtf](https://t.me/s/radiohack_rtf)
- Channel posts cited: [85](https://t.me/radiohack_rtf/85), [91](https://t.me/radiohack_rtf/91), [92](https://t.me/radiohack_rtf/92), [101](https://t.me/radiohack_rtf/101), [102](https://t.me/radiohack_rtf/102), [103](https://t.me/radiohack_rtf/103), [104](https://t.me/radiohack_rtf/104), [105](https://t.me/radiohack_rtf/105), [106](https://t.me/radiohack_rtf/106), [108](https://t.me/radiohack_rtf/108), [109](https://t.me/radiohack_rtf/109)
- Platform: [kuznitsa.tech](https://kuznitsa.tech/), [Кубок Оренбуржья case](https://kuznitsa.tech/works/orenburg-programming-cup)

### Previous seasons

- Season 1.0: [УрФУ newspaper PDF, May 2025](https://elar.urfu.ru/bitstream/10995/143439/1/uf_2025_09.pdf)
- Season 2.0 solution: [github.com/Mihendy/RadioHack2.0_TMK](https://github.com/Mihendy/RadioHack2.0_TMK)
- Season 2.0 participant CV: [toropov.dev](https://www.toropov.dev/)
- Season 2.0 гордума pilot: [Urals24](https://ural24.com/news/prilozhenie_dlya_raboty_ekaterinburgskoj_dumy_s_dokumentami_protestiruet_molodyozhnaya_palata)

### Customer context

- ТМК++ history: [tmkplusplus.tmk-group.ru/history](https://tmkplusplus.tmk-group.ru/history)
- ТМК++ insourcing profile: [hh.ru/article/30553](https://hh.ru/article/30553)
- АО «ДИАЙПИ»: [TAdviser](<https://www.tadviser.ru/index.php/%D0%9A%D0%BE%D0%BC%D0%BF%D0%B0%D0%BD%D0%B8%D1%8F:%D0%94%D0%98%D0%90%D0%99%D0%9F%D0%98_(%D0%A2%D0%9C%D0%9A)>))

### Rubric comparables

- Сбер «Уральский код»: [положение](http://xn--80ailedcd2alms5i.xn--p1ai/document)
- Биохакатон «Фарватер»: [biohackathon.ru/faq.php](https://biohackathon.ru/faq.php)
- NAO hackathon criteria: [hack.adm-nao.ru/files/kriterii.pdf](https://hack.adm-nao.ru/files/kriterii.pdf)
- «Атомик Хак 3.0»: [urfu.ru news 56647](https://urfu.ru/ru/news/56647/)
- Corporate hackathon rubric: [av55.ru](https://av55.ru/articles/korporativnyy-hakaton-2026/)
- ITKAN: [itkan.one/I-Hackathon/judging](https://www.itkan.one/I-Hackathon/judging)
- Stavleak: [toolkit](https://org.stavleak.com/ru/toolkit/judging-criteria), [guide](https://info.stavleak.com/ru/guides/kriterii-ocenki-hakatona)

### Failure modes and domain grounding

- Devfolio judging: [devfolio.co/blog/the-discerning-machine](https://devfolio.co/blog/the-discerning-machine/)
- Estimation accuracy: [Basten & Sunyaev, CAIS 2014](https://doi.org/10.17705/1cais.03404)
- Professional estimators: [QSM](https://qsm.com/articles/problems-software-development-seen-professional-estimators)
- Underestimation: [ArtofBA](https://www.artofba.com/post/business-analysis-task-estimation-1), [DOU](https://dou.ua/lenta/articles/estimation-of-labor-input-1/)
- TCO formula: [TProger, 2026](https://tproger.ru/articles/vydelennye-komandy-autsors-ili-inhaus-kak-schitat-realnyj-tco)
- Total Cost of Delivery: [aiDOOS](https://aidoos.com/blog/total-cost-of-delivery-framework/)

---

## Appendix B. Confidence

| Claim | Confidence |
|---|---|
| Organizer, dates, format, team size, prize, tracks, programme | **High**, official landing page and official channel |
| Case text and deliverables | **High**, verbatim from the partner post and track card |
| ДИАЙПИ and ТМК++ context | **High**, corporate sources and TAdviser |
| Season 1.0 results and numbers | **High** for content, **medium** for the "1.0" label (the source does not number it) |
| Season 2.0 partners and outcomes | **Medium-high**, repository, CV and city media |
| Season 3.0 winners | **Unknown**, not published in any reachable source |
| Judging criteria and weights | **Unknown**, explicitly not public; §7 is inference |
| Pitch time limit, prize split, 4.0 artifact list | **Unknown**, verify with organizers |
