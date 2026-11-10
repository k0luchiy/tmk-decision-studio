# Соответствие рубрике РадиоХак 4.0

Карта «критерий → артефакт → как проверить». Рубрика: `research/22_track_regulation_and_rubric.md`.

| Критерий | Баллы | Артефакт | Проверка |
|---|---:|---|---|
| Соответствие бизнес-цели | 10 | Вердикт, три сценария, PDF/XLSX | `docs/screenshots/02-overview.png`, `docs/deliverables/ARCHITECTURE.md` |
| Внутренняя оценка | 15 | WBS, роли/грейды, fully loaded, найм, bench, TCO | `shared/core/src/cost/`, `docs/deliverables/METHOD.md`, `npm test` |
| Рыночная оценка | 15 | 49 опубликованных аналогов + 60 контрактов ТМК, нормализация, диапазон | `data/datasets/analogue_corpus.json`, `shared/core/src/sizing/analogues.ts` |
| Данные и интеграции | 15 | Единый контракт, загрузка, HelpDesk, Data Hub, manifest, provenance | `shared/contract/`, `shared/data/`, `docs/deliverables/DATA_HUB.md` |
| Архитектура и код | 15 | Модульный monorepo, чистые функции, Docker, CI, 259+ тестов | `docker-compose.yml`, `.github/workflows/ci.yml`, `npm test` |
| Объяснимость | 10 | Формула-дерево, допущения, риски, confidence, календарные допущения | `docs/screenshots/05-justification.png`, `shared/core/src/decision/` |
| Прототип и удобство | 5 | Целостный сценарий: старт → бриф → параметры → вердикт → экспорт | скриншоты `docs/screenshots/` |
| Командная работа | 10 | `DECISIONS.md`, роли, история коммитов | `docs/DECISIONS.md`, `docs/TEAM.md` |
| Защита | 5 | 6 слайдов, живое демо, честные ограничения | `docs/deliverables/PRESENTATION.md` |

## Обязательные артефакты сдачи

| # | Артефакт | Где |
|---|---|---|
| 1 | Работающий прототип | `docker compose up --build`, `npm run dev` |
| 2 | Репозиторий и инструкция запуска | `README.md` |
| 3 | Архитектура и модель данных | `docs/deliverables/ARCHITECTURE.md`, `DATA_MODEL.md` |
| 4 | Методика, формулы, аналоги | `docs/deliverables/METHOD.md` |
| 5 | Результаты контрольных задач | `docs/deliverables/TEST_REPORT.md`, `BENCHMARK_REPORT.md` |
| 6 | Презентация и роли | `docs/deliverables/PRESENTATION.md`, `docs/TEAM.md` |

## Честные ограничения

- Benchmark показывает расхождение с частью эталонных диапазонов; это
  зафиксировано в `BENCHMARK_REPORT.md` и `BENCHMARK_FAILURES.md`.
- Ставки in-house — fully loaded по FR-3.1; payroll-базис не является дефолтом.
- Jev без ключа работает через `cache`/`rules`; `live` требует
  `OPENCODE_API_KEY` только в env backend.
- История оценок хранится в памяти с TTL 24 часа.
