# Deployment — локально и Docker

## 1. Локально

```bash
npm ci
(cd frontend && npm ci)
npm run dev
```

- frontend: http://localhost:5173
- backend: http://localhost:3001
- Vite proxy: `/api` → `:3001`

Отдельно:

```bash
npm run dev:api
npm run dev:frontend
```

Порт `5173` закреплён (`strictPort: true`). Если занят — освободите порт.

## 2. Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

- UI: http://localhost:8080
- API: http://localhost:3001
- Nginx внутри frontend проксирует `/api` в сервис `backend`.

Остановка:

```bash
docker compose down
```

## 3. Jev

| `INTAKE_MODE` | Что делает | Нужен ключ |
|---|---|---|
| `off` | только правила | нет |
| `cache` | ответы из `data/cache/jev-responses.json`, miss → rules | нет |
| `live` | вызов Jev, fallback → rules | `OPENCODE_API_KEY` |

`JEV_MODEL=jev-1.13-free` — демо-модель. Ключ передаётся только в env backend:

```bash
OPENCODE_API_KEY='...' INTAKE_MODE=live JEV_MODEL=jev-1.13-free npm run dev:api
```

В Docker — через корневой `.env` (не коммитится).

## 4. Проверки

```bash
npm test
npm --prefix backend run test
npm --prefix frontend test
npm --prefix frontend run build
npm run data:check
npm run e2e
npm run benchmark
docker compose config
```

## 5. Частые проблемы

- **Порт 5173 занят** — освободите порт; strictPort не переедет молча.
- **Порт 8080 занят** — задайте `WEB_PORT=8081` в `.env`.
- **Jev live не отвечает** — останется `rules`/`cache`; проверьте ключ и сеть.
- **Нет Docker registry доступа** — используйте локальный запуск; compose
  конфигурация при этом валидна (`docker compose config`).
- **Старые данные в UI** — API кэширует датасеты в памяти; после публикации
  Data Hub кэш сбрасывается автоматически, после ручного изменения файлов
  перезапустите backend.
