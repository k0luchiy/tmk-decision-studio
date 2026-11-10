# Benchmark suite

10 контрольных кейсов и 20 промптов (technical + simple) для проверки
универсальности модели. Это **измерительный набор**, а не набор констант:
в коде нет веток по `CASE-ID`.

## Запуск

```bash
npm run benchmark
```

Результаты:

- `docs/deliverables/BENCHMARK_REPORT.md` — попадание в эталонные диапазоны;
- `docs/deliverables/BENCHMARK_FAILURES.md` — все проваленные прогоны с полным
  текстом промпта, фактическими цифрами и целями.

## Кейсы

| ID | Кейс | Тип |
|---|---|---|
| CASE-01 | Telegram-бот регистрации транспорта | chatbot |
| CASE-02 | Мониторинг энергопотребления | observability |
| CASE-03 | OCR маркировки труб | cv |
| CASE-04 | MES ↔ 1С:ERP traceability | mes |
| CASE-05 | Predictive maintenance валков | pdm |
| CASE-06 | 1С:ERP ↔ WMS | integration |
| CASE-07 | CV-контроль дефектов | cv |
| CASE-08 | Поддержка 24/7 | support |
| CASE-09 | Мобильное приложение | mobile |
| CASE-10 | Миграция инфраструктуры и СУБД | infrastructure |

Эталонные диапазоны и промпты — в [`TEST_PROMPTS.md`](TEST_PROMPTS.md).
