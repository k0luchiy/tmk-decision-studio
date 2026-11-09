# Frontend — TMK Decision Studio (`frontend/`)

React + Vite (SPA) кокпит TMK Decision Studio: экран решения, графики, формула-дерево.

Правило: UI не считает финансы сам. В режиме `api` модель приходит из
`POST /api/estimates` backend'а и приводится к прежней форме адаптером
`src/core/apiModel.js`. Локальный `src/core/calc.js` остаётся демо-фолбэком.

## Режимы данных

| `VITE_DATA_MODE` | Поведение |
|---|---|
| `api` (по умолчанию в `.env.example`) | 500 мс debounce → `POST /api/estimates`; ответ адаптируется в `model`. Если API недоступен — показывается локальный расчёт и статус «ошибка API». |
| `local` | API не вызывается, всё считается `core/calc.js`. |
| не задан | Как `api`; для короткого брифа (< 20 символов) остаётся локальный расчёт. |

Индикатор режима — в шапке и в рабочей панели: «API», «локально», «ошибка API».

## Запуск с backend

```bash
# из корня репозитория
npm ci
cp frontend/.env.example frontend/.env   # VITE_DATA_MODE=api
npm run dev:api        # Fastify на :3001
npm run dev:frontend   # Vite на :5173, /api проксируется на :3001
# или оба сразу:
npm run dev
```

> Порт `5173` закреплён (`strictPort: true`). Если он занят — освободите порт;
> Vite не переедет молча на `5175`, а завершится с ошибкой.

Экспорт JSON использует `POST /api/estimates/:id/export`; если `estimateId` нет
(локальный режим) — скачивается локальный снимок.

## Без backend

```bash
printf 'VITE_DATA_MODE=local\n' > frontend/.env
npm --prefix frontend run dev
```

## Проверки

```bash
npm --prefix frontend run test    # node --test: calc + apiModel
npm --prefix frontend run build   # vite build
```
