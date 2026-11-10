# Data Hub — обновление и версионирование данных

## 1. Зачем

Оценка должна опираться на актуальные аналоги, ставки и коэффициенты, но при
этом оставаться воспроизводимой. Поэтому данные не читаются из внешнего
источника в момент расчёта: они проходят путь **raw → normalized → review →
published**, а расчёт использует только опубликованный снапшот.

Три режима:

| Режим | Где используется | Гарантия |
|---|---|---|
| `snapshot` | расчёт, экспорт, сохранённые оценки | воспроизводимость по `datasetVersion` |
| `cache` | предпросмотр, повторная проверка | последний ответ источника |
| `live` | кнопка refresh / недельный job | актуальность, но не воспроизводимость |

Это та же логика, что у Jev: `live → cache → rules`, только для данных —
`live → cache → snapshot`.

## 2. Компоненты

```text
data/sources.json                  реестр источников и расписание
        ↓
POST /api/data/refresh             live/cache загрузка источника
POST /api/data/import              ручной CSV/XLSX/JSON
        ↓
.artifacts/data-hub/candidates.json очередь кандидатов
        ↓
approve / reject                   ручное ревью
        ↓
POST /api/data/publish             публикация релиза
        ↓
data/datasets/analogue_corpus.json
data/manifest.json                 новый datasetVersion
data/releases.json                 версия, changelog, кто утвердил
```

## 3. Реестр источников

`data/sources.json`:

```json
{
  "id": "tmk_etp",
  "name": "ETP ТМК",
  "kind": "procurement",
  "cadence": "weekly",
  "mode": "parser",
  "keywords": ["интеграция", "1С", "WMS", "MES", "сопровождение"],
  "okpd2": ["62.01", "62.02"],
  "trust": "high",
  "enabled": true
}
```

Поля:

- `cadence` — рекомендуемая частота: weekly / monthly / quarterly / on-demand;
- `mode` — `parser` или `manual`;
- `keywords`, `okpd2` — профиль поиска для парсера;
- `trust` — уровень доверия источнику;
- `feedUrl` — необязательный URL JSON/CSV для live refresh. Если его нет,
  источник работает только через ручной импорт.

## 4. Ручной импорт

Поддерживаются CSV, XLSX и JSON. Минимальные поля строки:

| Поле | Обязательно | Комментарий |
|---|---|---|
| `project_type` | да | `erp_1c`, `mes`, `cv_qc`, `dwh_bi`, … |
| `title` | да | название проекта/кейса |
| `source` | да | URL источника |
| `price_mid` или `price_low` + `price_high` | да | цена в рублях |
| `year` | нет | по умолчанию текущий год |
| `price_basis` | нет | `contract_price`, `НМЦК`, … |
| `source_date`, `confidence`, `note` | нет | провенанс |

Пример: `data/import/analogue-sample.csv`.

После импорта строки попадают в очередь, а не в датасет. Дубликаты
отсекаются по `id` и по паре `source + title`.

## 5. Ревью и публикация

1. Загрузить файл.
2. Проверить кандидатов в разделе «Обновление данных».
3. Одобрить или отклонить каждую строку.
4. Указать changelog.
5. Нажать «Опубликовать версию».

Публикация:

- добавляет только `approved`-строки в `analogue_corpus.json`;
- пересобирает `data/manifest.json` и `datasetVersion`;
- создаёт запись в `data/releases.json`;
- сбрасывает in-memory кэш датасетов backend;
- не меняет уже сохранённые оценки: они остаются на своём `datasetVersion`.

## 6. API

| Метод | Путь | Назначение |
|---|---|---|
| `GET` | `/api/data/hub` | источники, очередь, релизы, текущая версия |
| `POST` | `/api/data/import?sourceId=manual` | multipart CSV/XLSX/JSON |
| `POST` | `/api/data/candidates/:id/approve` | одобрить строку |
| `POST` | `/api/data/candidates/:id/reject` | отклонить строку |
| `POST` | `/api/data/publish` | `{changelog, approvedBy}` |
| `POST` | `/api/data/refresh` | `{sourceId}` — live refresh, если задан `feedUrl` |

## 7. Расписание

Шаблон GitHub Actions: `.github/workflows/data-refresh.yml`.

- запуск каждый понедельник в 03:00 UTC;
- ручной `workflow_dispatch`;
- вызывает `POST /api/data/refresh`;
- требует секрет `DATA_HUB_URL` с адресом развёрнутого backend.

Парсер ЕИС/ETP — источник-специфичный. В реестре уже есть профиль ключевых
слов и ОКПД2; для production нужно добавить connector, который забирает выдачу
и отдаёт нормализованные строки в тот же import pipeline.

## 8. Что показывать на демо

1. Раздел «Данные и источники» → «Обновление данных».
2. Загрузить `data/import/analogue-sample.csv`.
3. Показать: 3 строки, 0 дубликатов, 0 ошибок.
4. Одобрить 2 строки, одну отклонить.
5. Опубликовать версию с changelog.
6. Показать новый `datasetVersion` и строку в истории версий.
7. Открыть оценку: в аналогах появились новые строки.
8. Открыть старую сохранённую оценку: её `datasetVersion` не изменился.

## 9. Ограничения текущей версии

- Парсер ЕИС/ETP — заготовка: нужен connector под конкретный источник.
- Очередь кандидатов хранится в `.artifacts/data-hub/` и не коммитится.
- Нет ролей и авторизации: `approvedBy` — строковое поле для аудита.
- Публикация пишет в `data/` напрямую; в production нужен отдельный data-store
  и транзакционная публикация.
- Ставки и архетипы обновляются вручную: это методологические данные, их
  нельзя менять так же часто, как аналоги.
