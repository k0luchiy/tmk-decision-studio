# 10. Интеграция frontend ↔ backend

**Статус:** интегрировано. Дата: 10.11.2026. Frontend работает через API
(`VITE_DATA_MODE=api`), локальный `calc.js` — только fallback.

## 1. Решение

**HTTP REST API.** Frontend (React/Vite, `frontend`) не импортирует расчётные
пакеты: он вызывает API. Backend (`backend`, Fastify) импортирует
`@app/data`, `@app/core`, `@app/intake`, `@app/export` и выполняет всю работу.

```
┌──────────────────┐   HTTP/JSON + файлы   ┌──────────────────────────────┐
│ frontend         │ ────────────────────► │ backend (Fastify, BFF)        │
│ React + Vite     │ ◄──────────────────── │ @app/data  @app/core         │
│ только адаптер   │   Estimate / PDF/XLSX │ @app/intake @app/export      │
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

Frontend **не считает** стоимость, проценты, ROI и не подставляет ставки. Он
рисует то, что вернул API, и отправляет правки пользователя обратно.

## 2. Структура

```
frontend/
├── src/core/api.js        # intake, datasets, HelpDesk, история
├── src/core/apiModel.js   # fetch POST /api/estimates + адаптер модели
├── src/core/apiRequest.js # legacy state → тело запроса
├── vite.config.js         # proxy /api → http://localhost:3001
└── package.json

backend/
├── src/
│   ├── server.ts    # bootstrap, CORS, error handler
│   ├── app.ts       # buildApp() для inject-тестов
│   ├── routes/      # health, meta, datasets, intake, estimates, export, import
│   ├── store.ts     # in-memory + TTL 24 ч
│   └── errors.ts    # единый формат ошибок
└── package.json     # @app/{contract,data,core,intake,export}
```

Порты: web — `5173` (`strictPort`), api — `3001`. В dev Vite проксирует `/api`,
поэтому CORS в браузере не нужен. CORS включён только для отдельного домена.

## 3. Эндпоинты

Базовый префикс `/api`. Все ответы — JSON, кроме экспорта.

| Метод | Путь | Назначение |
|---|---|---|
| GET | `/api/health` | liveness: `{status:'ok', uptime}` |
| GET | `/api/meta` | `{brand, jevModel, datasetVersion, methodVersion, intakeMode, serverTime}` |
| GET | `/api/datasets` | манифест: 6 файлов, строки, хеши, дата |
| GET | `/api/datasets/:name` | read-only строки датасета для экрана «Данные» |
| POST | `/api/intake` | разбор брифа: правила / Jev (cache/live) |
| POST | `/api/intake/confirm` | подтверждение/правка параметров |
| POST | `/api/estimates` | полный расчёт: 3 сценария + вердикт + confidence + дерево |
| GET | `/api/estimates` | последние 20 снимков (краткие строки истории) |
| GET | `/api/estimates/:id` | сохранённая оценка (снимок) + `state` |
| POST | `/api/estimates/:id/export` | PDF / XLSX / JSON (binary) |
| POST | `/api/import/helpdesk` | multipart `.xlsx` → отчёт о качестве |

`POST /api/estimates/:id/recalculate` из ранней версии контракта **не
реализован**: пересчёт — это новый `POST /api/estimates` с другими `options`
(снимок неизменяем, старый `id` остаётся).

### 3.0. `GET /api/meta`

```json
{
  "brand": "TMK Decision Studio",
  "jevModel": "jev-1.13-free",
  "datasetVersion": "47a8fb6b9e9e…",
  "methodVersion": "1.0.0",
  "intakeMode": "cache",
  "serverTime": "2026-11-10T04:45:00.000Z"
}
```

- `brand` — фиксированное имя продукта для UI;
- `jevModel` — модель из `JEV_MODEL` (по умолчанию `jev-1.13`);
- `intakeMode` — эффективный режим (`off` / `cache` / `live`).

### 3.1. `POST /api/intake`

```json
// request
{ "brief": "Интеграция 1С:ERP с WMS, 6 потоков, срок 3 месяца", "mode": "cache" }

// 200
{
  "status": "jev-cache",
  "params": [
    { "key": "work_type", "value": "integration", "unit": "", "source": "rules",
      "confidence": 0.85, "quote": "Интеграция 1С:ERP с WMS", "status": "auto",
      "defaultUsed": false },
    { "key": "flows", "value": 6, "unit": "поток", "source": "rules",
      "confidence": 0.9, "quote": "6 потоков", "status": "auto",
      "defaultUsed": false }
  ],
  "clarification": []
}
```

`status`: `rules | jev-cache | jev-live`. `clarification` — вопросы, если данных
мало. `mode` необязателен и переопределяет `INTAKE_MODE`; `live` без ключа
деградирует до `rules`.

### 3.2. `POST /api/intake/confirm`

```json
// request: params после правок пользователя; каждый status: "confirmed"
{ "params": [ { "key": "flows", "value": 6, "status": "confirmed" } ] }

// 200
{ "params": [ ... ], "complete": true }
```

Если `complete=false` — API вернёт список неподтверждённых ключей; расчёт и
экспорт недоступны.

### 3.3. `POST /api/estimates`

```json
// request
{
  "brief": "Интеграция 1С:ERP с WMS, 6 потоков, срок 3 месяца",
  "params": [
    { "key": "work_type", "value": "integration", "status": "confirmed" },
    { "key": "flows", "value": 6, "unit": "поток", "status": "confirmed" }
  ],
  "options": {
    "hiring": true,
    "utilization": 0.7,
    "model": "fixed_price",
    "vat": false,
    "targetWeeks": 10,
    "extras": [
      { "label": "Лицензии", "amountRub": 100000, "appliesTo": "all" }
    ]
  },
  "seed": 42,
  "state": { "ui": { "tab": "overview" } }
}

// 201
{
  "id": "est_01H…",
  "createdAt": "2026-11-10T04:45:00.000Z",
  "brief": "...",
  "state": { "ui": { "tab": "overview" } },
  "datasetVersion": "47a8fb6b…",
  "seed": 42,
  "params": [ ... ],
  "estimates": {
    "inhouse":   { "scenario": "inhouse", "cost": { "p10Rub": 0, "p50Rub": 7677686, "p80Rub": 0, "p90Rub": 0 }, ... },
    "contractor":{ "scenario": "contractor", ... },
    "hybrid":    { "scenario": "hybrid", ... }
  },
  "verdict": { "code": "inhouse", "templateId": "inhouse_v1", "text": "...", "numbersRefs": [...] },
  "confidence": { "score": 79, "level": "high", "components": [...] },
  "effortGrid": { "totalHours": 770, "byStage": [...], "byRole": [...] },
  "formulaTree": { "id": "cost_p50", "children": [...] },
  "methodDivergence": 0.084,
  "warnings": []
}
```

- `methodDivergence` — относительный разброс методов A/B/C (`max / min − 1`);
  показывается в UI и влияет на confidence.
- `params` без `status: "confirmed"` → `409 needs_review`.
- `options` — все поля необязательны:

| Поле | Тип | Смысл |
|---|---|---|
| `hiring` | boolean | строка найма самой загруженной роли |
| `utilization` | `(0, 1]` | утилизация команды, по умолчанию 0.7 |
| `model` | `t_and_m` / `fixed_price` / `dedicated_team` | модель контракта подрядчика |
| `vat` | boolean | добавка 20 % НДС подрядчику |
| `teamRate` | 100–100000 ₽/ч | override средней ставки команды |
| `reservePct` | `[0, 0.5]` | риск-резерв |
| `oversightPct` | `[0, 0.5]` | надзор/приёмка заказчика |
| `contractorStages` | `int[]` 1..7 | этапы подрядчика в гибриде |
| `stageHours` | `{stage: hours}` | override часов по этапам |
| `targetWeeks` | `1..104` | сжатие срока по Putnam |
| `extras` | `{label, amountRub, appliesTo?}[]` | доп. статьи затрат |

`targetWeeks` меньше P50 добавляет строку `risk` с меткой
**«Сжатие срока (Putnam)»** и повышает P50. `extras` добавляет строки `extra`
в выбранные сценарии (`all | inhouse | contractor | hybrid`), не меняя
сопровождение в TCO. `state` — необязательный blob UI до 64 КБ, возвращается
вместе со снимком.

### 3.4. `GET /api/estimates` и `GET /api/estimates/:id`

```json
// GET /api/estimates → 200
{
  "items": [
    {
      "id": "est_01H…",
      "createdAt": "2026-11-10T04:45:00.000Z",
      "brief": "Интеграция 1С:ERP с WMS, 6 потоков…",
      "verdict": "inhouse",
      "p50Rub": 7677686,
      "weeks": 13,
      "confidence": 79
    }
  ]
}
```

- только живые снимки (TTL 24 ч), новые первыми, максимум 20;
- `GET /api/estimates/:id` возвращает полный снимок в форме `POST`-ответа,
  включая `state` и `methodDivergence`;
- `404 not_found`, если снимка нет или он истёк.

### 3.5. `POST /api/estimates/:id/export`

```json
{ "format": "pdf" }   // pdf | xlsx | json
```

- `200` + `Content-Type` и `Content-Disposition: attachment; filename="<id>.pdf"`.
- PDF содержит брендированную матрицу трёх сценариев
  («Внутренняя команда», «Подрядчик», «Гибрид»).
- `409 needs_review` + `{unconfirmed:[...]}`, если остались `status!=='confirmed'`.
- `404`, если оценки нет.

### 3.6. `POST /api/import/helpdesk`

`multipart/form-data`, поле `file` — `.xlsx` до 10 МБ.

```json
{ "report": { "rows": 4, "issues": [], "quality": "..." }, "tasks": 4, "workItems": 4 }
```

Возвращает отчёт о качестве и счётчики; тела задач/работ не эхо-ответом не
возвращаются.

### 3.7. Ошибки

```json
{ "error": { "code": "needs_review", "message": "Подтвердите параметры", "details": { "unconfirmed": ["flows"] } } }
```

| Код | HTTP | Когда |
|---|---|---|
| `validation_error` | 422 | тело не проходит zod / `state` > 64 КБ |
| `needs_review` | 409 | есть неподтверждённые параметры |
| `not_found` | 404 | нет оценки/датасета/маршрута |
| `intake_unavailable` | 503 | Jev недоступна и правила не справились |
| `internal_error` | 500 | непредвиденное; без стека наружу |

## 4. Dev и prod

**Dev:**

```js
// frontend/vite.config.js
export default defineConfig({
  server: { port: 5173, strictPort: true, proxy: { '/api': 'http://localhost:3001' } },
});
```

```bash
npm run dev:api   # tsx watch backend/src/server.ts
npm run dev:frontend   # vite frontend
# или оба: npm run dev (concurrently)
```

**Prod:** статический билд `frontend/dist` и `backend` за одним reverse proxy
(nginx/Caddy), `/api` → api, остальное → `index.html`. CORS не нужен.
`VITE_API_URL` — только если домены разные.

## 5. Хранение

- MVP: `Map<id, EstimateBundle>` в памяти + TTL 24 ч.
- Максимум истории — 20 последних оценок.
- Диск/БД не используются: хакатон, одна инсталляция, малый объём; рестарт
  очищает снимки.
- Снимок неизменяем: пересчёт создаёт новый `id`.

## 6. Безопасность

- `OPENCODE_API_KEY` — только в окружении `backend`; в браузер не попадает.
- Лимит тела запроса 256 КБ; таймаут Jev 10 с.
- В Jev уходят только тексты брифа; HelpDesk и внутренние данные — нет.
- Персональные данные в брифах демо — вымышленные.
- Логи не содержат тело брифа целиком (только хеш и размер).

## 7. Синхронизация контракта

- Типы — из `@app/contract` (workspace). API и фронт используют одни и те же
  схемы.
- Ответы API валидируются теми же zod-схемами на сервере (гарантия формы).
- OpenAPI можно сгенерировать позже из zod; на хакатоне достаточно этого
  документа + типов.

## 8. Что делает фронт

1. `POST /api/intake` → таблица проверки (цитата/вероятность, подтвердить/править).
2. `POST /api/intake/confirm` → `complete=true`.
3. `POST /api/estimates` → рисует вердикт, сценарии, графики, формулу-дерево.
4. `POST /api/estimates/:id/export` → скачивает PDF/XLSX/JSON.
5. `GET /api/meta` → бейдж версии датасетов и режима Jev.
6. `GET /api/datasets` → экран «Данные».
7. `GET /api/estimates` / `GET /api/estimates/:id` → «Последние оценки».

Фронт **не** пересчитывает проценты, не меняет ставки локально, не кэширует
оценки как источник истины.

## 9. Статус

Реализовано и покрыто тестами: все эндпоинты выше, включая историю, `targetWeeks`,
`extras`, импорт HelpDesk и брендированный PDF. Не реализовано: авторизация,
`recalculate`, disk persistence, SSE-прогресс Jev, rate limiting (см.
`docs/11_frontend_integration_analysis.md`).
