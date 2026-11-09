export const BASE_STAGES = [
  { id: 'discovery', name: 'Аналитика и обследование', desc: 'Сбор требований, интервью, аудит текущего ландшафта', rate: 3200, category: 'Работы' },
  { id: 'design', name: 'Проектирование и архитектура', desc: 'Целевая архитектура, UX/UI, технические решения', rate: 3500, category: 'Работы' },
  { id: 'development', name: 'Разработка и настройка', desc: 'Реализация функциональности, конфигурация платформы', rate: 3400, category: 'Работы' },
  { id: 'integration', name: 'Интеграции и данные', desc: 'API, миграция, шины и сопряжение систем', rate: 3500, category: 'Работы' },
  { id: 'testing', name: 'Тестирование и ИБ', desc: 'Функциональное, нагрузочное тестирование и проверки ИБ', rate: 3100, category: 'Работы' },
  { id: 'deployment', name: 'Внедрение и запуск', desc: 'Промышленный контур, обучение, запуск', rate: 3000, category: 'Работы' },
  { id: 'handover', name: 'Приёмка и передача', desc: 'Документация, передача знаний, гарантийный период', rate: 3000, category: 'Работы' },
];

export const BASE_EXTRAS = [
  { id: 'infra', name: 'Инфраструктура и облачные ресурсы', kind: 'Инфраструктура', internal: 180000, external: 120000, hybrid: 150000 },
  { id: 'license', name: 'Лицензии и программное обеспечение', kind: 'Лицензии', internal: 240000, external: 180000, hybrid: 210000 },
  { id: 'equipment', name: 'Оборудование и рабочие места', kind: 'Оборудование', internal: 120000, external: 90000, hybrid: 105000 },
  { id: 'gpu', name: 'GPU / LLM / вычисления', kind: 'Вычисления', internal: 0, external: 0, hybrid: 0 },
];

const stageOverride = (hours, external, days, split) =>
  BASE_STAGES.map((stage, i) => ({
    ...stage,
    hours: hours[i],
    external: external[i] * 1000,
    days: days[i],
    split: split[i],
    owner: split[i] >= 65 ? 'internal' : split[i] <= 35 ? 'vendor' : 'split',
  }));

const extrasOverride = (values) =>
  BASE_EXTRAS.map((item, i) => ({
    ...item,
    internal: values[i][0],
    external: values[i][1],
    hybrid: values[i][2],
  }));

export const CASES = {
  D1: {
    id: 'D1',
    name: 'Интеграция 1С ↔ WMS',
    shortName: 'Интеграция 1С ↔ WMS',
    type: 'Интеграция систем',
    description:
      'Интеграция 1С:ERP с WMS для синхронизации номенклатуры, остатков и заказов. Обмен в обе стороны, журнал ошибок и мониторинг. Требуется отказоустойчивый контур и передача поддержки внутренней команде.',
    complexity: 'medium',
    integrations: 3,
    screens: 2,
    users: 850,
    deadlineWeeks: 16,
    teamRate: 4200,
    reserve: 12,
    hiring: true,
    contractType: 'tm',
    oversight: 10,
    hybridSplit: 58,
    stages: stageOverride(
      [80, 120, 420, 140, 110, 70, 45],
      [300, 380, 1200, 500, 350, 220, 150],
      [10, 15, 45, 18, 14, 9, 7],
      [80, 80, 50, 50, 50, 80, 80]
    ),
    extras: extrasOverride([
      [180000, 120000, 150000],
      [240000, 180000, 210000],
      [120000, 90000, 105000],
      [0, 0, 0],
    ]),
    confidence: { brief: 82, data: 78, analog: 58, method: 76 },
    scores: {
      internal: { risk: 76, flexibility: 76 },
      vendor: { risk: 58, flexibility: 72 },
      hybrid: { risk: 89, flexibility: 90 },
    },
    supportMonthly: { internal: 80000, vendor: 160000, hybrid: 110000 },
    analogs: [
      { name: 'Интеграция ERP ↔ WMS, металлургия', year: 2025, price: 4100000, normalized: 4400000, coeff: 1.07, source: 'ЕИС · 223-ФЗ', date: '14.03.2025' },
      { name: 'Шина обмена данными предприятия', year: 2024, price: 5200000, normalized: 4800000, coeff: 0.92, source: 'ЕИС · 44-ФЗ', date: '22.09.2024' },
      { name: 'Интеграционный модуль учётной системы', year: 2023, price: 3700000, normalized: 4200000, coeff: 1.14, source: 'Открытые закупки', date: '05.12.2023' },
      { name: 'Проект интеграции 1С и складского контура', year: 2024, price: 4600000, normalized: 4500000, coeff: 0.98, source: 'Аналитика рынка', date: '18.06.2024' },
    ],
    risks: [
      { name: 'Недоступность тестового контура WMS', probability: 0.35, impact: 600000, note: 'Сдвиг интеграционного тестирования' },
      { name: 'Изменение API WMS на стороне поставщика', probability: 0.25, impact: 350000, note: 'Переработка адаптеров' },
      { name: 'Задержка согласования модели данных', probability: 0.2, impact: 900000, note: 'Простой команды и сдвиг вех' },
    ],
    assumptions: [
      { name: 'Ставка внутренней команды', value: '4 200 ₽/ч', range: '3 600–5 200 ₽/ч', source: 'Fully loaded rate card, демо', sensitivity: 'Высокая' },
      { name: 'Резерв на неопределённость', value: '12%', range: '8–20%', source: 'Экспертное допущение', sensitivity: 'Высокая' },
      { name: 'Срок реализации', value: '14–17 нед.', range: '12–20 нед.', source: 'Критический путь, демо', sensitivity: 'Средняя' },
      { name: 'Состав гибридной модели', value: '58% ТМК / 42% подрядчик', range: '40–70% ТМК', source: 'Распределение этапов', sensitivity: 'Средняя' },
    ],
  },
  D2: {
    id: 'D2',
    name: 'CV-чекер ОТК',
    shortName: 'CV-чекер ОТК',
    type: 'Computer Vision',
    description:
      'Система контроля качества трубной продукции с использованием машинного зрения. Детекция дефектов геометрии и поверхности в реальном времени на конвейере. Нужны сбор датасета, обучение модели, кабинет оператора и интеграция с системой качества.',
    complexity: 'high',
    integrations: 2,
    screens: 8,
    users: 240,
    deadlineWeeks: 20,
    teamRate: 4400,
    reserve: 15,
    hiring: true,
    contractType: 'fixed',
    oversight: 15,
    hybridSplit: 52,
    stages: stageOverride(
      [110, 180, 620, 160, 150, 90, 60],
      [430, 520, 1650, 620, 480, 300, 210],
      [14, 22, 65, 22, 20, 12, 9],
      [80, 50, 50, 50, 50, 80, 80]
    ),
    extras: extrasOverride([
      [220000, 160000, 190000],
      [260000, 210000, 235000],
      [160000, 120000, 140000],
      [240000, 300000, 270000],
    ]),
    confidence: { brief: 70, data: 66, analog: 46, method: 62 },
    scores: {
      internal: { risk: 78, flexibility: 74 },
      vendor: { risk: 44, flexibility: 78 },
      hybrid: { risk: 86, flexibility: 88 },
    },
    supportMonthly: { internal: 120000, vendor: 210000, hybrid: 155000 },
    analogs: [
      { name: 'Пилот видеоаналитики на производстве', year: 2025, price: 6800000, normalized: 7200000, coeff: 1.06, source: 'ЕИС · 223-ФЗ', date: '19.02.2025' },
      { name: 'Система контроля качества с CV', year: 2024, price: 8400000, normalized: 7900000, coeff: 0.94, source: 'Открытые закупки', date: '11.08.2024' },
      { name: 'ML-модуль дефектоскопии', year: 2023, price: 5900000, normalized: 6600000, coeff: 1.12, source: 'Аналитика рынка', date: '27.04.2023' },
    ],
    risks: [
      { name: 'Недостаточное качество обучающего датасета', probability: 0.4, impact: 1200000, note: 'Повторный сбор и разметка' },
      { name: 'Ограниченный доступ к производственной линии', probability: 0.3, impact: 800000, note: 'Сдвиг пилота' },
      { name: 'Дефицит CV-специалистов на рынке', probability: 0.35, impact: 1500000, note: 'Удорожание ролей' },
    ],
    assumptions: [
      { name: 'Ставка внутренней команды', value: '4 400 ₽/ч', range: '3 800–5 600 ₽/ч', source: 'Fully loaded rate card, демо', sensitivity: 'Высокая' },
      { name: 'Резерв на неопределённость', value: '15%', range: '12–25%', source: 'Высокая новизна технологии', sensitivity: 'Высокая' },
      { name: 'Срок реализации', value: '18–22 нед.', range: '16–26 нед.', source: 'Критический путь, демо', sensitivity: 'Высокая' },
      { name: 'Состав гибридной модели', value: '52% ТМК / 48% подрядчик', range: '35–65% ТМК', source: 'Распределение этапов', sensitivity: 'Средняя' },
    ],
  },
  D3: {
    id: 'D3',
    name: 'Поддержка 24/7 · SLA',
    shortName: 'Поддержка 24/7 · SLA',
    type: 'Сопровождение',
    description:
      'Организация круглосуточной поддержки критичной ИТ-системы с тремя линиями, SLA 99,95%, мониторингом и регламентами эскалации. Требуется покрытие 24/7 и первичная реакция 15 минут.',
    complexity: 'low',
    integrations: 4,
    screens: 0,
    users: 1200,
    deadlineWeeks: 8,
    teamRate: 3900,
    reserve: 10,
    hiring: false,
    contractType: 'tm',
    oversight: 10,
    hybridSplit: 45,
    stages: stageOverride(
      [70, 60, 150, 110, 90, 60, 40],
      [140, 130, 300, 260, 210, 160, 100],
      [8, 7, 18, 14, 10, 7, 5],
      [50, 50, 20, 20, 50, 80, 80]
    ),
    extras: extrasOverride([
      [140000, 110000, 125000],
      [120000, 100000, 110000],
      [60000, 50000, 55000],
      [0, 0, 0],
    ]),
    confidence: { brief: 88, data: 82, analog: 72, method: 80 },
    scores: {
      internal: { risk: 70, flexibility: 64 },
      vendor: { risk: 86, flexibility: 76 },
      hybrid: { risk: 80, flexibility: 82 },
    },
    supportMonthly: { internal: 95000, vendor: 145000, hybrid: 120000 },
    analogs: [
      { name: 'Сопровождение 24/7 критичной системы', year: 2025, price: 2400000, normalized: 2600000, coeff: 1.08, source: 'ЕИС · 223-ФЗ', date: '06.05.2025' },
      { name: 'Service Desk на 3 линии', year: 2024, price: 3100000, normalized: 2900000, coeff: 0.94, source: 'Открытые закупки', date: '16.10.2024' },
      { name: 'Мониторинг и дежурство 24/7', year: 2023, price: 2200000, normalized: 2400000, coeff: 1.09, source: 'Аналитика рынка', date: '02.03.2023' },
    ],
    risks: [
      { name: 'Несогласованный график дежурств', probability: 0.3, impact: 700000, note: 'Переработки и штрафы SLA' },
      { name: 'Штрафы за нарушение SLA', probability: 0.25, impact: 1200000, note: 'Финансовые санкции' },
      { name: 'Текучесть дежурных специалистов', probability: 0.2, impact: 600000, note: 'Найм и обучение' },
    ],
    assumptions: [
      { name: 'Ставка внутренней команды', value: '3 900 ₽/ч', range: '3 400–4 800 ₽/ч', source: 'Fully loaded rate card, демо', sensitivity: 'Средняя' },
      { name: 'Резерв на неопределённость', value: '10%', range: '6–15%', source: 'Экспертное допущение', sensitivity: 'Средняя' },
      { name: 'Срок реализации', value: '7–9 нед.', range: '6–12 нед.', source: 'Критический путь, демо', sensitivity: 'Низкая' },
      { name: 'Состав гибридной модели', value: '45% ТМК / 55% подрядчик', range: '30–60% ТМК', source: 'Распределение этапов', sensitivity: 'Средняя' },
    ],
  },
};

export const CASE_LIST = Object.values(CASES);

export const SCENARIO_META = {
  internal: {
    id: 'internal',
    name: 'Внутренняя команда',
    shortName: 'Команда',
    subtitle: 'Собственные ресурсы ТМК++',
    color: 'internal',
    description: 'Полный контроль знаний и приоритетов. Выше нагрузка на штат и риск найма.',
  },
  vendor: {
    id: 'vendor',
    name: 'Внешний подрядчик',
    shortName: 'Подрядчик',
    subtitle: 'Внешний исполнитель',
    color: 'vendor',
    description: 'Быстрый доступ к экспертизе и ответственность по договору. Дороже в сопровождении.',
  },
  hybrid: {
    id: 'hybrid',
    name: 'Гибридная модель',
    shortName: 'Гибрид',
    subtitle: 'Совместная реализация',
    color: 'hybrid',
    description: 'Подрядчик закрывает критический путь, ТМК сохраняет архитектуру и приёмку.',
  },
};

export const CONFIDENCE_WEIGHTS = [
  { id: 'brief', label: 'Полнота брифа', weight: 0.3 },
  { id: 'data', label: 'Качество данных', weight: 0.25 },
  { id: 'analog', label: 'Сопоставимость аналогов', weight: 0.25 },
  { id: 'method', label: 'Согласие методов', weight: 0.2 },
];

export const DECISION_WEIGHTS = [
  { id: 'cost', label: 'Стоимость', weight: 0.45 },
  { id: 'time', label: 'Срок', weight: 0.25 },
  { id: 'risk', label: 'Риск и контроль', weight: 0.2 },
  { id: 'flexibility', label: 'Гибкость', weight: 0.1 },
];
