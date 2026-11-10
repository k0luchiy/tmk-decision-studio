# Команда и распределение работы

## Состав

| Участник | Контакт | Роль |
|---|---|---|
| **Кириченко Дана Константиновна** | [@kattywife](https://github.com/kattywife) | Frontend + Backend |
| **Осипов Антон Юрьевич** | [@k0luchiy](https://github.com/k0luchiy) | Backend + Modeling + AI (JEV) |
| **Быкова Дарья Евгеньевна** | [@Daria92886](https://github.com/Daria92886) | Analytics + Presentation |

## Кто что делал

### Кириченко Дана — Frontend + Backend
- Кокпит: стартовый экран, обзор, параметры, аналитика, структура оценки,
  обоснование, методика и страница данных.
- Адаптер frontend ↔ API, состояния загрузки/ошибки, fallback на локальный
  расчёт, отображение confidence, сценариев и календарных допущений.
- UI Data Hub: источники, импорт CSV/XLSX/JSON, очередь ревью, публикация
  версии и история релизов.
- Backend-интеграция: маршруты API, Data Hub, Docker/Compose, связка Nginx ↔
  Fastify, проверка пользовательских сценариев.
- Артефакты: `frontend/`, `backend/src/routes/data.ts`, `docs/screenshots/`,
  `docker-compose.yml`, `Dockerfile.*`.

### Осипов Антон — Backend + Modeling + AI (JEV)
- Расчётное ядро: WBS, FP-lite, аналоги, стоимость in-house/contractor,
  риски, Монте-Карло, сценарии, TCO, break-even, вердикт, confidence.
- Календарный слой: этапные лаги, пилот, support-срок, сценарные длительности.
- Intake: правила извлечения, Jev-адаптер (off/cache/live), merge, policy-gate,
  stage-owner suggestions.
- Backend API, экспорт JSON/XLSX/PDF, Data Hub backend, версионирование данных,
  benchmark-прогон и тесты.
- Артефакты: `shared/core/`, `shared/intake/`, `shared/export/`, `backend/src/`,
  `scripts/benchmark.ts`, `docs/deliverables/METHOD.md`.

### Быкова Дарья — Analytics + Presentation
- Разбор кейса, требований и рубрики; карта критериев и артефактов.
- Аналитика рынка и аналогов: структура корпуса, нормализация, ограничения.
- Benchmark suite: 10 кейсов / 20 промптов, эталонные диапазоны и разбор
  расхождений.
- Презентация, сценарий демо, слайды, скриншоты и ответы на вопросы жюри.
- Артефакты: `benchmarks/`, `docs/deliverables/COMPLIANCE.md`,
  `docs/deliverables/PRESENTATION.md`, `docs/deliverables/BENCHMARK_REPORT.md`.

## Что каждый объясняет на защите

| Участник | Вопросы |
|---|---|
| Дана | Как устроен UI-сценарий, почему фронт не считает деньги, как работает Data Hub и экспорт |
| Антон | Как считается трудоёмкость/стоимость/срок, как устроены Jev и fallback, почему такие аналоги и вердикт |
| Дарья | Какие критерии закрывает решение, откуда взяты эталоны, где ограничения и что делать дальше |

## Принцип командной работы

- Решения фиксируются в `docs/DECISIONS.md`.
- Каждый модуль имеет владельца и воспроизводимую проверку.
- Любой участник может объяснить чужой блок на уровне «вход → формула → выход».
- Ограничения не скрываются: они вынесены в `BENCHMARK_REPORT.md` и
  `COMPLIANCE.md`.
