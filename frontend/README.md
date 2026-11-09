# Frontend — TMK Decision Studio (`frontend/`)

React 18 + Vite 6 (SPA) кокпит **TMK Decision Studio**: экран решения, графики,
формула-дерево, обоснование и экспорт.

Правило: UI **не считает** финансы сам. В режиме `api` модель приходит из
`POST /api/estimates` backend'а и приводится к прежней форме адаптером
`src/core/apiModel.js`. Локальный `src/core/calc.js` остаётся демо-фолбэком.

## Режимы данных

`VITE_DATA_MODE` задаётся в `frontend/.env` (шаблон — `frontend/.env.example`):

| `VITE_DATA_MODE` | Поведение |
|---|---|
| `api` (по умолчанию) | 500 мс debounce → `POST /api/estimates`; ответ адаптируется в `model`. Если API недоступен — показывается локальный расчёт и статус «ошибка API». |
| `local` | API не вызывается, всё считается `src/core/calc.js`. |
| не задан | Как `api`; для короткого брифа (< 20 символов) остаётся локальный расчёт. |

Индикатор режима — в шапке и рабочей панели: «API», «локально», «ошибка API».

## Режимы intake

`VITE_INTAKE_MODE` управляет разбором брифа **на фронте**:

| Значение | Поведение |
|---|---|
| `off` | только локальные правила (`parseBrief`) |
| `cache` (по умолчанию) | `POST /api/intake` с `mode: 'cache'` — ответы Jev из кэша |
| `live` | `POST /api/intake` с `mode: 'live'` — реальный вызов Jev на сервере |

При ошибке `live` фронт падает обратно на локальные правила и показывает toast.

## Запуск

```bash
# из корня репозитория
npm ci
(cd frontend && npm ci)
cp frontend/.env.example frontend/.env   # VITE_DATA_MODE=api
npm run dev:api        # Fastify на :3001
npm run dev:frontend   # Vite на :5173, /api проксируется на :3001
# или оба сразу:
npm run dev
```

> Порт `5173` закреплён (`strictPort: true`). Если он занят — освободите порт;
> Vite не переедет молча на `5175`, а завершится с ошибкой. Для параллельного
> QA-стенда порт можно переопределить: `npm --prefix frontend run dev -- --port 5180 --strictPort`.

`VITE_API_URL` — только если `/api` не проксируется Vite (например, разные
домены). В обычном dev он не нужен.

## Экспорт

- JSON/XLSX/PDF — через `POST /api/estimates/:id/export`, если есть `estimateId`.
- Если `estimateId` нет (локальный режим или API недоступен) — JSON-снимок
  скачивается локально, PDF открывается через `window.print()`.
- CSV-таблица этапов формируется на клиенте из текущего состояния.

## Бренд

Продукт — **TMK Decision Studio** (для трека ТМК++). Заголовок вкладки,
шапка, стартовый экран, страницы «Данные»/«Методика» и подписи экспорта
используют только это имя; логотип ТМК как элемент бренда не используется.

## Без backend

```bash
printf 'VITE_DATA_MODE=local\n' > frontend/.env
npm --prefix frontend run dev
```

## Проверки

```bash
npm --prefix frontend run test    # node --test: calc + apiModel + intake + datasets
npm --prefix frontend run build   # vite build
```
