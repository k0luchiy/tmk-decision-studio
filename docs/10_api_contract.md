# 10. Интеграция frontend ↔ backend

**Статус:** предложено, ждёт подтверждения. Дата: 9.11.2026.

## 1. Решение

**HTTP REST API.** Frontend (React/Vite, `frontend`) не импортирует расчётные пакеты. Он импортирует только типы из `@app/contract` и вызывает API. Backend (`backend`, Fastify) импортирует `@app/data`, `@app/core`, `@app/intake`, `@app/export` и выполняет всю работу.

```
┌──────────────────┐   HTTP/JSON + файлы   ┌──────────────────────────────┐
│ frontend         │ ────────────────────► │ backend (Fastify, BFF)        │
│ React + Vite     │ ◄──────────────────── │ @app/data  @app/core         │
│ только @app/     │   Estimate / PDF/XLSX │ @app/intake @app/export      │
│ contract (типы)  │                       │ Jev key, датасеты, расчёт    │
└──────────────────┘                       └──────────────────────────────┘
```

Почему так, а не «ядро в браузере»:

| Причина | Следствие |
|---|---|
| Ключ Jev нельзя отдавать в браузер | Jev вызывается только на сервере |
| Датасеты ~800 КБ + 60 контрактов | не грузим в бандл, не дублируем версии |
| PDF (pdfkit) и XLSX (SheetJS) — Node-библиотеки | экспорт формируется на сервере |
| Хранение оценок и снимков | одно место, без localStorage-хаоса |
| Смена фронта не трогает расчёт | контракт стабилен, UI заменяем |

Frontend **не считает** стоимость, проценты, ROI и не подставляет ставки. Он рисует то, что вернул API, и отправляет правки пользователя обратно.

## 2. Структура

```
frontend/
├── src/
├── vite.config.ts       # proxy /api → http://localhost:3001
└── package.json         # зависимость: @app/contract

backend/
├── src/
│   ├── server.ts    # bootstrap, CORS, error handler
│   ├── routes/      # intake, estimates, datasets, export, meta
│   ├── store.ts     # in-memory + опционально data/estimates/*.json
│   └── errors.ts    # единый формат ошибок
└── package.json     # зависимости: @app/{contract,data,core,intake,export}
```

Порты: web — `5173`, api — `3001`. В dev Vite проксирует `/api`, поэтому CORS в браузере не нужен. CORS включается только для отдельного домена.

## 3. Эндпоинты

Базовый префикс `/api`. Все ответы — JSON, кроме экспорта.

| Метод | Путь | Назначение |
|---|---|---|
| GET | `/api/health` | liveness: `{status:'ok', uptime}` |
| GET | `/api/meta` | `{datasetVersion, methodVersion, intakeMode, serverTime}` |
| GET | `/api/datasets` | манифест: 6 файлов, строки, хеши, дата |
| GET | `/api/datasets/:name` | read-only строки датасета для экрана «Данные» |
| POST | `/api/intake` | разбор брифа: правила / Jev (cache/live) |
| POST | `/api/intake/confirm` | подтверждение/правка параметров |
| POST | `/api/estimates` | полный расчёт: 3 сценария + вердикт + confidence + дерево |
| GET | `/api/estimates/:id` | сохранённая оценка (снимок) |
| POST | `/api/estimates/:id/export` | PDF / XLSX / JSON (binary) |
| POST | `/api/estimates/:id/recalculate` | пересчёт с overrides (P1) |

### 3.1. `POST /api/intake`

```json
// request
{ "brief": "Интеграция 1С:ERP с WMS, 6 потоков, срок 3 месяца", "mode": "cache" }

// 200
{
  "status": "jev-cache",
  "params": [
    { "key": "work_type", "value": "integration", "source": "rules", "confidence": "high",
      "quote": "Интеграция 1С:ERP с WMS", "status": "auto" },
    { "key": "flows", "value": 6, "unit": "поток", "source": "rules", "confidence": "high",
      "quote": "6 потоков", "status": "auto" }
  ],
  "clarification": []
}
```

`status`: `rules | jev-cache | jev-live`. `clarification` — вопросы, если данных мало.

### 3.2. `POST /api/intake/confirm`

```json
// request: params после правок пользователя; каждый status: "confirmed"
{ "params": [ { "key": "flows", "value": 6, "status": "confirmed" } ] }

// 200
{ "params": [ ... ], "complete": true }
```

Если `complete=false` — API вернёт список неподтверждённых ключей; расчёт и экспорт недоступны.

### 3.3. `POST /api/estimates`

```json
// request
{
  "params": [ { "key": "work_type", "value": "integration", "status": "confirmed" }, ... ],
  "options": { "hiring": true, "utilization": 0.7, "model": "t_and_m", "vat": false },
  "seed": 42
}

// 201
{
  "id": "est_01H...",
  "datasetVersion": "47a8fb6b...",
  "seed": 42,
  "createdAt": "2026-11-09T18:00:00.000Z",
  "estimates": {
    "inhouse": { "scenario": "inhouse", "cost": { "p50Rub": 7677686 }, ... },
    "contractor": { "scenario": "contractor", ... },
    "hybrid": { "scenario": "hybrid", ... }
  },
  "verdict": { "code": "inhouse", "templateId": "inhouse_v1", "text": "...", "numbersRefs": [...] },
  "confidence": { "score": 79, "level": "high", "components": [...] },
  "effortGrid": { "totalHours": 770, "byStage": [...], "byRole": [...] },
  "formulaTree": { "id": "cost_p50", "children": [...] },
  "warnings": []
}
```

Тело соответствует `Estimate`/`Verdict`/`ConfidenceScore`/`FormulaNode` из `@app/contract`. Ошибки валидации — 422.

### 3.4. `POST /api/estimates/:id/export`

```json
{ "format": "pdf" }   // pdf | xlsx | json
```

- `200` + `Content-Type` и `Content-Disposition: attachment; filename="<id>.pdf"`.
- `409 needs_review` + `{unconfirmed:[...]}`, если остались `status!=='confirmed'`.
- `404`, если оценки нет.

### 3.5. Ошибки

```json
{ "error": { "code": "needs_review", "message": "Подтвердите параметры", "details": { "unconfirmed": ["flows"] } } }
```

| Код | HTTP | Когда |
|---|---|---|
| `validation_error` | 422 | тело не проходит zod |
| `needs_review` | 409 | есть неподтверждённые параметры |
| `not_found` | 404 | нет оценки/датасета |
| `intake_unavailable` | 503 | Jev недоступна и правила не справились |
| `internal_error` | 500 | непредвиденное; без стека наружу |

## 4. Dev и prod

**Dev:**
```ts
// frontend/vite.config.ts
export default defineConfig({
  server: { proxy: { '/api': 'http://localhost:3001' } },
});
```
```bash
npm run dev:api   # tsx watch backend/src/server.ts
npm run dev:web   # vite frontend
# или оба: npm run dev (concurrently)
```

**Prod:** статический билд `frontend/dist` и `backend` за одним reverse proxy (nginx/Caddy), `/api` → api, остальное → `index.html`. CORS не нужен. `VITE_API_URL` — только если домены разные.

## 5. Хранение

- MVP: `Map<id, EstimateBundle>` в памяти + TTL 24 ч.
- Опционально: запись снимка в `data/estimates/<id>.json` (каталог в `.gitignore`), чтобы пережить рестарт.
- БД не вводим: хакатон, одна инсталляция, объём мал.
- Снимок неизменяем: пересчёт создаёт новый `id`.

## 6. Безопасность

- `OPENCODE_API_KEY` — только в окружении `backend`; в браузер не попадает.
- Лимит тела запроса 256 КБ; таймаут Jev 10 с; rate limit на `/api/intake` (например, 30/мин на IP) — на уровне Fastify.
- В Jev уходят только тексты брифа; HelpDesk и внутренние данные — нет.
- Персональные данные в брифах демо — вымышленные.
- Логи не содержат тело брифа целиком (только хеш и размер).

## 7. Синхронизация контракта

- Типы — из `@app/contract` (workspace). API и фронт используют одни и те же схемы.
- Ответы API валидируются теми же zod-схемами на сервере (гарантия формы).
- OpenAPI можно сгенерировать позже из zod; на хакатоне достаточно `docs/09_integration_contract.md` + типов.

## 8. Что делает фронт

1. `POST /api/intake` → таблица проверки (цитата/вероятность, подтвердить/править).
2. `POST /api/intake/confirm` → `complete=true`.
3. `POST /api/estimates` → рисует вердикт, сценарии, графики, формулу-дерево.
4. `POST /api/estimates/:id/export` → скачивает PDF/XLSX.
5. `GET /api/meta` → бейдж версии датасетов.
6. `GET /api/datasets` → экран «Данные».

Фронт **не** пересчитывает проценты, не меняет ставки локально, не кэширует оценки как источник истины.

## 9. Открытые вопросы

1. Нужна ли авторизация (хотя бы один общий токен) для демо? Рекомендация: нет, но закрыть API от внешней сети.
2. Хранить ли оценки на диске между рестартами? Рекомендация: да, `data/estimates/` с TTL.
3. Нужен ли SSE/WS для прогресса Jev? Рекомендация: нет, 10 с укладывается в обычный запрос.
4. Кто пишет `backend` — backend-разработчик или я? Рекомендация: я, по этому контракту; фронт только потребляет.
