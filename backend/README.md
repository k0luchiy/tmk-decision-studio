# Backend — Fastify BFF TMK Decision Studio (`backend/`)

Backend-for-frontend: HTTP API для кокпита. Сам ничего не изобретает — вызывает
`@app/data`, `@app/core`, `@app/intake`, `@app/export` из `shared/` и отдаёт
фронту контракт `docs/10_api_contract.md`.

Правила:

- ключ Jev (`OPENCODE_API_KEY`) читается **только** здесь, в браузер не попадает;
- датасеты грузятся из корня репозитория один раз и кешируются в памяти;
- снимки оценок неизменяемы: пересчёт создаёт новый `id`;
- ошибки — единый конверт `{ error: { code, message, details? } }`.

## Запуск

```bash
# из корня репозитория
npm ci
npm --prefix backend run dev      # tsx watch, http://localhost:3001
npm --prefix backend run start    # без watch
npm --prefix backend run test     # vitest + app.inject
npm --prefix backend run typecheck
```

Порт и хост переопределяются переменными `PORT` (по умолчанию `3001`) и `HOST`
(по умолчанию `0.0.0.0`).

## Переменные окружения

| Переменная | Обязательна | Значение по умолчанию | Смысл |
|---|---|---|---|
| `OPENCODE_API_KEY` | для `live` | — | ключ OpenCode; без него intake работает на правилах/кэше |
| `JEV_MODEL` | нет | `jev-1.13` | модель классификации; для демо — `jev-1.13-free` |
| `INTAKE_MODE` | нет | `cache` | режим по умолчанию: `off` / `cache` / `live` |
| `PORT` | нет | `3001` | HTTP-порт |
| `HOST` | нет | `0.0.0.0` | адрес прослушивания |

Ключ передаётся только через окружение процесса, например:

```bash
OPENCODE_API_KEY='...' JEV_MODEL=jev-1.13-free INTAKE_MODE=live npm --prefix backend run dev
```

`backend/.env` загружается автоматически при старте backend; в git он не коммитится, шаблон — `backend/.env.example`. Если ключа нет,
`POST /api/intake` вернёт `status: "rules"` или `"jev-cache"`, а расчёт и
экспорт продолжат работать.

## Эндпоинты

| Метод | Путь | Назначение |
|---|---|---|
| GET | `/api/health` | liveness: `{status:'ok', uptime}` |
| GET | `/api/meta` | `{brand, jevModel, datasetVersion, methodVersion, intakeMode, serverTime}` |
| GET | `/api/datasets` | манифест: 6 файлов, версия, дата, хеши |
| GET | `/api/datasets/:name` | строки датасета (`rate_cards`, `contractor_rate_cards`, `work_archetypes`, `analogue_corpus`, `coefficients`, `tmk_it_contracts`) |
| POST | `/api/intake` | разбор брифа: `rules` / `jev-cache` / `jev-live` |
| POST | `/api/intake/confirm` | подтверждение/правка параметров |
| POST | `/api/estimates` | полный расчёт: 3 сценария + вердикт + confidence + дерево |
| GET | `/api/estimates` | последние 20 снимков (краткие строки истории) |
| GET | `/api/estimates/:id` | сохранённый снимок + `state` |
| POST | `/api/estimates/:id/export` | PDF / XLSX / JSON (binary) |
| POST | `/api/import/helpdesk` | multipart `.xlsx` → отчёт о качестве (4 строки) |

`POST /api/estimates/:id/recalculate` из раннего плана **не реализован**:
пересчёт делается новым `POST /api/estimates` с другими `options`.

## Примеры curl

Health и метаданные:

```bash
curl -s http://localhost:3001/api/health
curl -s http://localhost:3001/api/meta
curl -s http://localhost:3001/api/datasets
```

Intake (кэш) → подтверждение → расчёт:

```bash
BRIEF='Интеграция 1С:ERP с WMS, 6 интеграционных потоков, срок 3 месяца'

curl -s -X POST http://localhost:3001/api/intake \
  -H 'Content-Type: application/json' \
  -d "{\"brief\":\"$BRIEF\",\"mode\":\"cache\"}"

curl -s -X POST http://localhost:3001/api/estimates \
  -H 'Content-Type: application/json' \
  -d "{
    \"brief\": \"$BRIEF\",
    \"params\": [
      {\"key\":\"work_type\",\"value\":\"integration\",\"status\":\"confirmed\"},
      {\"key\":\"flows\",\"value\":6,\"unit\":\"поток\",\"status\":\"confirmed\"}
    ],
    \"options\": {
      \"targetWeeks\": 10,
      \"extras\": [{\"label\":\"Лицензии\",\"amountRub\":100000,\"appliesTo\":\"all\"}],
      \"hiring\": true,
      \"model\": \"fixed_price\"
    },
    \"seed\": 42
  }"
```

История и снимок:

```bash
curl -s http://localhost:3001/api/estimates
curl -s http://localhost:3001/api/estimates/est_<id>
```

Экспорт (сохраняет файл рядом):

```bash
curl -s -X POST http://localhost:3001/api/estimates/est_<id>/export \
  -H 'Content-Type: application/json' \
  -d '{"format":"pdf"}' -o report.pdf

curl -s -X POST http://localhost:3001/api/estimates/est_<id>/export \
  -H 'Content-Type: application/json' \
  -d '{"format":"xlsx"}' -o report.xlsx

curl -s -X POST http://localhost:3001/api/estimates/est_<id>/export \
  -H 'Content-Type: application/json' \
  -d '{"format":"json"}' -o report.json
```

Импорт HelpDesk:

```bash
curl -s -X POST http://localhost:3001/api/import/helpdesk \
  -F file=@data/import/helpdesk-sample.xlsx
# → { "report": {...}, "tasks": 4, "workItems": 4 }
```

## Ключевые поля ответа расчёта

- `estimates.inhouse | contractor | hybrid` — полные снимки `Estimate`;
- `methodDivergence` — относительный разброс методов A/B/C (`max / min − 1`);
- `verdict` — `inhouse` / `contractor` / `hybrid` / `parity` + текст;
- `confidence` — score и 4 компонента;
- `effortGrid` — часы по этапам и ролям;
- `formulaTree` — дерево формулы для «клика по числу»;
- `params` — параметры, по которым считали.

Опции `POST /api/estimates` (все необязательны): `hiring`, `utilization`,
`model` (`t_and_m` / `fixed_price` / `dedicated_team`), `vat`, `teamRate`,
`reservePct`, `oversightPct`, `contractorStages`, `stageHours`,
`targetWeeks` (`1..104`), `extras` (`label`, `amountRub`, `appliesTo`).

- `targetWeeks` меньше P50 добавляет строку `risk` с меткой
  «Сжатие срока (Putnam)» и повышает P50;
- `extras` добавляет строки `extra` в выбранные сценарии и **не** меняет
  сопровождение;
- `params` без `status: "confirmed"` → `409 needs_review`.

## Хранение и TTL

- In-memory `Map<id, snapshot>`; TTL — **24 часа** с момента создания.
- Максимум истории в `GET /api/estimates` — **20** последних записей.
- Просроченные записи удаляются лениво при чтении/листинге.
- Снимок неизменяем; повторный расчёт — новый `id`.
- На диск ничего не пишется и рестарт снимки не переживают (хакатон, одна
  инсталляция, малый объём).
- `state` из запроса хранится вместе со снимком, лимит — **64 КБ**.

## Ошибки

| Код | HTTP | Когда |
|---|---|---|
| `validation_error` | 422 | тело не проходит zod / `state` больше 64 КБ |
| `needs_review` | 409 | есть неподтверждённые параметры |
| `not_found` | 404 | нет оценки/датасета/маршрута |
| `internal_error` | 500 | непредвиденное; стек наружу не уходит |

```json
{ "error": { "code": "needs_review", "message": "Подтвердите параметры", "details": { "unconfirmed": ["flows"] } } }
```

## Тесты

`npm --prefix backend run test` поднимает Fastify через `app.inject` — без
реального сокета и сети: health/meta/datasets, intake, estimates, история,
срок/доп. статьи, экспорт PDF/XLSX/JSON, импорт HelpDesk.
