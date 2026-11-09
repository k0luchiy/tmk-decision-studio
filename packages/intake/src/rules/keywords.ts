/**
 * Keyword dictionaries for deterministic brief classification.
 *
 * Every entry is a lowercase stem/prefix. Matching in `classify` is
 * left-boundary aware, so a keyword matches at the start of a word and
 * may have any suffix (`интеграц` → `интеграция`, `интеграционных`).
 *
 * Order matters: `Object.entries` keeps insertion order and ties between
 * work types are resolved by the first entry. `integration` is first on
 * purpose so the D1 brief ("Интеграция 1С:ERP с WMS…") wins over the
 * generic `erp` bucket it also mentions.
 */

/** Work types → lowercase keyword stems. */
export const WORK_TYPE_KEYWORDS: Record<string, string[]> = {
  integration: [
    'интеграц',
    'обмен данн',
    'шина данн',
    'esb',
    'api-шлюз',
    'коннектор',
    'синхронизац',
  ],
  migration: ['миграц', 'перенос', 'переход на', 'апгрейд', 'обновлен', 'конвертац'],
  support: [
    'сопровожд',
    'поддержк',
    'техподдержк',
    '24/7',
    'круглосуточ',
    'helpdesk',
    'service desk',
    'sla',
  ],
  security: [
    'кибербезопасн',
    'информационн безопасн',
    'кии',
    '187-фз',
    'фстэк',
    'siem',
    'dlp',
    'шифрован',
    'аудит безопасн',
    'защит',
  ],
  mes: ['mes', 'асутп', 'асу тп', 'scada', 'plc', 'производствен', 'операторн', 'цех'],
  rpa: ['rpa', 'роботизац', 'робот', 'uipath', 'blue prism', 'автоматизац процесс'],
  cv: [
    'компьютерн зрен',
    'computer vision',
    'распознаван',
    'видеоаналитик',
    'ocr',
    'детекц',
  ],
  bi: ['bi', 'дашборд', 'аналитик', 'отчетн', 'визуализац', 'power bi', 'tableau', 'olap'],
  data: [
    'данны',
    'etl',
    'хранилищ',
    'озеро данн',
    'data lake',
    'data warehouse',
    'каталог данн',
    'качество данн',
    'запис',
  ],
  ai: [
    'искусственн интеллект',
    'нейросет',
    'machine learning',
    'llm',
    'nlp',
    'gpt',
    'ml',
    ' ии',
  ],
  sap: ['sap', 'abap', 's/4hana', 's4hana', 'sap erp'],
  erp: ['erp', 'mrp', 'scm', 'crm', 'wms', 'учетн', 'бухгалтер', 'учёт'],
  lowcode: ['low-code', 'lowcode', 'bpmsoft', 'bpm', 'no-code', 'nocode', 'конструктор'],
  api: ['api', 'rest', 'graphql', 'grpc', 'openapi', 'swagger', 'endpoint', 'webhook'],
  portal: ['портал', 'личный кабинет', 'интернет-магазин', 'cms', 'витрин', 'сайт'],
  mobile: ['мобильн', 'ios', 'android', 'смартфон', 'flutter', 'react native', 'kotlin', 'swift'],
  observability: [
    'наблюдаем',
    'observability',
    'мониторинг',
    'логирован',
    'трассировк',
    'prometheus',
    'grafana',
    'opentelemetry',
    'apm',
  ],
  document: [
    'сэд',
    'документооборот',
    'электронный документ',
    'эдо',
    'сканирован',
    'архив документ',
    'docflow',
  ],
  infrastructure: [
    'инфраструктур',
    'сервер',
    'сетев',
    'kubernetes',
    'k8s',
    'docker',
    'виртуализац',
    'дата-центр',
    'цод',
    'devops',
  ],
  development: [
    'разработ',
    'доработ',
    'создан',
    'написать',
    'веб-приложен',
    'backend',
    'frontend',
    'микросервис',
    'приложен',
  ],
  legacy: [
    'legacy',
    'устаревш',
    'монолит',
    'переписать',
    'рефактор',
    'техдолг',
    'технический долг',
  ],
};

/** Platforms / stacks → lowercase keyword stems. */
export const PLATFORM_KEYWORDS: Record<string, string[]> = {
  '1c': ['1с', '1c', '1с:erp', '1с erp', 'erp 1с'],
  sap: ['sap', 'abap', 's/4hana', 's4hana'],
  web: ['react', 'vue', 'angular', 'веб', 'web', 'javascript', 'typescript', 'node.js', 'frontend'],
  mobile: ['ios', 'android', 'мобильн', 'flutter', 'react native', 'kotlin', 'swift'],
  dotnet: ['.net', 'dotnet', 'c#', 'asp.net', 'blazor'],
  python: ['python', 'django', 'fastapi', 'flask'],
  lowcode: ['bpmsoft', 'low-code', 'lowcode', 'low code', 'no-code', 'nocode'],
  db: ['oracle', 'postgresql', 'postgres', 'mssql', 'ms sql', 'mysql'],
};
