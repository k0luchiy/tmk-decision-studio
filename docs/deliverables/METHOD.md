# METHOD — расчётная методика

Документ описывает **как именно** считается оценка. Каждая формула привязана к
реальному файлу кода; коэффициенты — к датасету и источнику. Если код и этот
документ расходятся, правится и то, и другое в одном коммите
(`../../docs/03_estimation_model.md`, `../../docs/05_architecture_data.md` §7).

## 1. Цепочка расчёта

```
Task → WBS (метод A) ─┐
     → FP-lite (B)  ─┼→ combineMethods → трудоёмкость (часы)
     → аналоги (C) ──┘        │
                              ├→ toStageGrid  → часы по этапам/ролям, P10/P50/P80/P90
                              ├→ costInhouse  → строки сметы «своя команда»
                              ├→ costContractor → строки сметы «подрядчик»
                              ├→ buildScenarios → inhouse / contractor / hybrid, TCO, break-even
                              ├→ simulate → распределение стоимости (seed)
                              ├→ schedule → срок и критический путь
                              ├→ buildVerdict → код вердикта и текст
                              ├→ confidence → 0..100 и компоненты
                              └→ buildFormulaTree → дерево «формула по клику»
```

Точка входа: `estimateTask` в `../../shared/core/src/pipeline.ts`. Она возвращает три
полных `Estimate` (`inhouse`, `contractor`, `hybrid`), общий вердикт, confidence,
`EffortGrid` и `FormulaNode`. Все результаты валидируются `EstimateSchema` из
`../../shared/contract/src/entities/decision.ts`.

## 2. Метод A — WBS из архетипов

Код: `../../shared/core/src/sizing/wbs.ts`, доли этапов — `../../shared/core/src/sizing/stageShares.ts`.

- Тип работы определяется по параметрам брифа, затем по ключевым словам
  (`resolveWorkType`), и маппится на архетип (`WORK_TYPE_TO_ARCHETYPE`).
- Архетип задаёт трёхточечную оценку на единицу (`three_point`) и типичный объём
  (`typical_unit_count`). Если бриф даёт объём (потоки, отчёты, АРМ), он
  используется; иначе берётся `typical_unit_count.mid`, а работы помечаются
  `assumption: true`.
- PERT на единицу:

```
E = (O + 4·M + P) / 6
σ = (P − O) / 6
```

- Этапы 1–6 масштабируются долями `STAGE_SHARES`; поддержка (`category:
  support`) — одна работа этапа 7 на весь объём.
- Источник параметров: `../../data/datasets/work_archetypes.json`
  (`three_point`, `default_role_mix_pct`, `typical_unit_count`,
  `productivity_basis.sources`).

## 3. Метод B — FP-lite

Код: `../../shared/core/src/sizing/fpLite.ts`.

```
FP = Σ count(type) × weight(type)
effortHours = FP × PDR(platform)
```

Веса (упрощённый IFPUG, Москва-2018): `ilf 11`, `eif 8`, `ei 5`, `eo 5`, `eq 4`.
PDR по платформам: `traditional 8.3`, `java 8.7`, `lowcode 1.8`, `sap 16.7`,
`mobile 12`, `gov 9.7` часов на FP. Источник — `../../docs/03_estimation_model.md` §3,
`../../research/05_methodology_estimation.md`.

## 4. Метод C — аналоги

Код: `../../shared/core/src/sizing/analogues.ts`.

```
base        = price_mid, иначе (price_low + price_high) / 2
normalized  = base × K_scope × K_complexity × K_region × K_VAT × K_age
K_age       = 1.08 ^ (targetYear − year), если year ≤ targetYear
```

- Целевой год — 2026 (`DEFAULT_TARGET_YEAR`), индекс удорожания —
  `ANALOGUE_AGE_INDEX = 1.08`.
- USD-аналоги **исключаются** (нет источника FX), `reasonExcluded: 'usd_no_fx'`.
- Аналоги без источника или цены исключаются (`no_source`, `no_price`).
- Достаточная выборка — не менее 3 аналогов (`DEFAULT_MIN_ANALOGUES`).
- Для перевода цены в часы используется hours-weighted fully loaded rate из
  `rate_cards.json`; если тип работы не имеет аналогового типа (например,
  поддержка), метод C совпадает с A.
- Источник: `../../data/datasets/analogue_corpus.json`,
  `../../research/15_sector_analogues.md`.

## 5. Триангуляция A/B/C

Код: `../../shared/core/src/sizing/combine.ts`.

```
effort = 0.5·A + 0.2·B + 0.3·C
divergence = max(A,B,C) / min(A,B,C) − 1
```

Веса — `DEFAULT_WEIGHTS = { a: 0.5, b: 0.2, c: 0.3 }` (`../../docs/03` §3). Если
`divergence > 0.3` (30 %), добавляется предупреждение `method_divergence`; это
предупреждение, а не ошибка. `estimateTask` масштабирует WBS так, чтобы
`p50` совпадал с триангулированной трудоёмкостью.

## 6. Сетка трудоёмкости

Код: `../../shared/core/src/cost/stageGrid.ts`.

```
p50 = Σ expectedHours
σ   = √Σ sigmaHours²
p10 = max(0, p50 − 1.2816·σ)
p80 = p50 + 0.8416·σ
p90 = p50 + 1.2816·σ
```

`byStage` — часы по этапам с разбивкой по ролям; `byRole` — агрегат по ролям.
`totalHours = p50`. Источник квантилей — нормальное приближение (`../../docs/03` §4).

## 7. Стоимость «своей команды»

Код: `../../shared/core/src/cost/inhouse.ts`.

- Труд: `часы × fully_loaded_hour` из `rate_cards.json` (`status: 'fact'`).
  Ставка **не пересчитывается** — берётся `fully_loaded_hour` строки файла.
- Найм: `1.5 × fully_loaded_month` целевой роли.
- Ramp-up: `2 мес × 0.5 × avg fully_loaded_month`.
- Bench: `max(0, billable/u − billable) × avg fully_loaded_month × months`,
  `billable = Σhours / (months × 120)`, `u = 0.7`.
- Текучесть: `billable × turnover × 0.5 × (avg fully_loaded_month × 12)`,
  `turnover = 0.13`.
- `avg fully_loaded_month` — среднее по часам ролей.
- Источник: `../../data/datasets/rate_cards.json` (`source`,
  `derivation`), `../../research/07_benchmarks_rates_data.md`,
  `../../research/05_methodology_estimation.md` §5.3.

## 8. Стоимость подрядчика

Код: `../../shared/core/src/cost/contractor.ts`.

- Труд: `часы × rate_mid` из `contractor_rate_cards.json` (geo RU).
- Координация: `Σlabor × 0.15`.
- Приёмка/передача: `Σlabor × 0.05`.
- Риск-премия: `Σlabor × 0.20` только для `fixed_price`, иначе 0.
- НДС: `(labor + coordination + acceptance + risk) × 0.20` при `vat: true`.
- Другие geo не конвертируются: `UnsupportedGeoError` (нет FX).
- Источники: `../../data/datasets/contractor_rate_cards.json`
  (`fixed_price_risk_load_pct: [15,30]`), `../../research/10_product_concept.md` §2-L4.

## 9. Сценарии, TCO и break-even

Код: `../../shared/core/src/scenarios/scenarios.ts`.

- `inhouse` — всё внутри; `contractor` — всё подрядчиком; `hybrid` —
  подрядчик владеет этапом 3 («Разработка»), остальное внутри:
  `share = часы(этап 3) / все часы`.
- Поддержка: 12 %/год от труда внутри, 18 %/год у подрядчика, гибрид — 12 %
  (поддержка внутренняя).
- Политический резерв: `p80 = implementation × 1.18` (18 %). Это **не**
  Монте-Карло квантиль; вероятностный P80 — в `risk/monteCarlo.ts`.
- Break-even: месяц `0..36`, когда накопленный кэшфлоу сценария становится
  строго меньше in-house.
- Источник: `../../docs/03_estimation_model.md` §5.3, §6.

## 10. Монте-Карло

Код: `../../shared/core/src/risk/monteCarlo.ts`, PRNG — `risk/prng.ts`.

```
μ = (ln p10 + ln p90) / 2
σ = (ln p90 − ln p10) / (2 × 1.2816)
value = exp(μ + σ·z)
z' = ρ·zg + √(1 − ρ²)·zi
```

- Lognormal-маргиналы из P10/P90 для трудоёмкости, ставки и срока.
- Однофакторная гауссова копула, `ρ = 0.5`; `cost = effort × rate`.
- PRNG — `mulberry32` с обязательным целым seed. `estimateTask` использует
  `n = 4000` на сценарий, чтобы e2e укладывался в 30 с.
- Выход: P10/P50/P80/P90. Одинаковый seed ⇒ побайтно одинаковый результат.

## 11. Срок и критический путь

Код: `../../shared/core/src/schedule/schedule.ts`, календарь — `schedule/calendar.ts`.

```
HPPW = 120 × 12 / 52 ≈ 27.69 продуктивных часов/нед на FTE
capacity = Σ fte × HPPW × utilization
p50Weeks = max(1, ceil(Σhours / capacity))
σweeks = σhours / capacity
p10 = max(1, p50 − 1.2816σ), p80 = p50 + 0.8416σ, p90 = p50 + 1.2816σ
```

- По умолчанию — по одному FTE на каждую роль из `byRole`, `utilization = 0.7`.
- Сжатие срока ниже P50 на > 25 % даёт надбавку по Putnam `(p50/target)^4` и
  предупреждение `schedule_compression`.
- Календарь — пятидневка с праздниками РФ 2026–2027 (`calendar.ts`).
- Сроки **сценарные**, а не общие: in-house получает базовый срок +2 недели при
  найме/онбординге, подрядчик — базовый ×0.85 (быстрая мобилизация), гибрид —
  базовый ×0.92. Квантили P10/P80/P90 масштабируются тем же коэффициентом,
  минимум 1 неделя. Это допущение для демо, не бенчмарк; код —
  `shared/core/src/pipeline/durations.ts`.

## 12. Вердикт

Код: `../../shared/core/src/decision/verdict.ts`, тексты — `decision/templates.ts`.

Правила применяются по порядку:

1. **parity** — `|tco_inhouse − tco_contractor| ≤ max(p80 − p50)`: числа не
   различают сценарии, решают качественные оси.
2. **hybrid** — `hybrid.tco ≤ 1.05 × min(tco_inhouse, tco_contractor)` и
   подрядчик быстрее (`contractor.weeks < inhouse.weeks`).
3. **conditional in-house** — подрядчик дешевле сразу, но дороже на горизонте.
4. **TCO winner** — иначе побеждает меньший TCO.

Текст — фиксированный шаблон с подстановкой чисел; LLM не используется.

## 13. Уверенность (Confidence Score)

Код: `../../shared/core/src/decision/confidence.ts`.

| Компонент | Вес | Что измеряет |
|---|---:|---|
| `brief` | 0.30 | доля подтверждённых параметров брифа |
| `methods` | 0.30 | `1 − min(1, divergence)` методов A/B/C |
| `analogues` | 0.20 | `min(1, count/3) × sufficiency` |
| `data` | 0.20 | свежесть и покрытие источников |

`score = round(100 × Σ w·v)`; `level`: `high ≥ 70`, `medium ≥ 40`, иначе `low`.
Для класса `order_of_magnitude` score ограничен 60. Веса — явное допущение
(`../../docs/03` §9).

## 14. Формула-дерево

Код: `../../shared/core/src/decision/formulaTree.ts`.

Корень `cost_p50` = сумма строк сметы; дети — `effort` (P50 часы), `reserve`
(P80 − P50) и группы статей (`labor`, `coordination`, `risk`, `vat`, `hiring`,
`rampup`, `bench`, `turnover`, …). Каждая строка несёт `formula`, `inputs` и
`sourceId`, поэтому любое число раскрывается до источника.

## 15. Допущения

| Допущение | Значение | Источник |
|---|---:|---|
| Загрузка команды | 0.7 | `../../research/05` §5.3 |
| Продуктивных часов в месяц | 120 | `../../docs/03` §5.1 |
| Найм | 1.5 месячных fully loaded | `../../research/05` §5.3 |
| Ramp-up | 2 мес × 50 % | `../../research/05` §5.3 |
| Текучесть | 13 %/год, замена 0.5 года | `../../research/05` §5.3 |
| Координация подрядчика | 15 % | `../../docs/03` §5.2 |
| Приёмка | 5 % | `../../docs/03` §5.2 |
| Риск fixed price | 20 % (диапазон 15–30 %) | `../../research/10` §2-L4 |
| НДС | 20 % | `../../research/10` §2-L4 |
| Поддержка in-house / contractor | 12 % / 18 % в год | `../../docs/03` §5.3 |
| Резерв P80 | 18 % (политика) | `../../docs/03` §6 |
| Горизонт break-even | 36 месяцев | `../../docs/03` §6 |
| Горизонт TCO | 3 года | `../../docs/03` §5.3 |
| Корреляция Монте-Карло | ρ = 0.5 | `../../docs/03` §8 |

## 16. Границы методики

- Это **оценка порядка, а не смета**; на экране и в PDF есть дисклеймер.
- MAPE/PRED(25) **не считаются**: в выгрузке HelpDesk 4 строки, нужно ≥ 10 пар
  план/факт (`../../research/20`, `TEST_REPORT.md` §4).
- Аналоги не конвертируются из USD: нет источника FX.
- Ставки подрядчика — только RU; другие geo не поддерживаются.
- Все числа детерминированы при фиксированных `inputHash + datasetVersion +
  seed`.
