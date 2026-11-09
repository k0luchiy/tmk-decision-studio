# Рабочие данные (`data/`)

Здесь лежат версионируемые данные, которые читает код во время запуска.
Оригиналы материалов исследования остаются в `research/data/` для провенанса;
рабочие копии — здесь. Правило: **оригиналы — в `research/`, рабочие копии — в `data/`**.

## Карта каталога

| Путь | Назначение |
|---|---|
| `datasets/` | 6 рабочих JSON-датасетов: `rate_cards.json`, `contractor_rate_cards.json`, `work_archetypes.json`, `analogue_corpus.json`, `coefficients.json`, `tmk_it_contracts.json` |
| `schemas/` | JSON-схемы импорта: `helpdesk_import_schema.json` |
| `import/` | Обезличенные примеры выгрузок: `helpdesk-sample.xlsx` |
| `cache/` | Кэш ответов Jev (`jev-responses.json`) |
| `eval/` | Размеченные брифы для оценки intake (`briefs.json`) |
| `seeds/` | Контрольные ожидания регрессии (`control.json`) |
| `manifest.json` | Версия каждого файла: SHA-256, число строк, дата, исходный путь |

## Источники и пересборка

- `datasets/*` — рабочие копии из `research/data/product/` и `research/data/tmk_it_contracts.json`;
  исходный путь каждого файла зафиксирован в поле `source` манифеста.
- `schemas/helpdesk_import_schema.json` — копия `research/data/product/helpdesk_import_schema.json`.
- `import/helpdesk-sample.xlsx` — обезличенная копия `research/data/Выгрузка полей.xlsx`.

```bash
npm run data:manifest   # пересобрать manifest.json и datasetVersion
npm run data:check      # проверить датасеты, схемы и манифест
```
