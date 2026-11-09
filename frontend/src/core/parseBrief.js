const snippet = (text, index, length) => {
  const start = Math.max(0, index - 22);
  const end = Math.min(text.length, index + length + 22);
  return `«${text.slice(start, end).trim()}»`;
};

const detectType = (text) => {
  const lower = text.toLowerCase();
  if (/(компьютерн|машинн|cv|дефект|видеоаналит|зрени)/.test(lower)) return 'Computer Vision';
  if (/(поддержк|sla|24\/7|дежурств|сопровожд)/.test(lower)) return 'Сопровождение';
  if (/(интеграц|api|обмен|шлюз|wms|1с)/.test(lower)) return 'Интеграция систем';
  if (/(мобильн|приложен|кабинет|интерфейс)/.test(lower)) return 'Разработка ПО';
  return 'ИТ-инициатива';
};

export const parseBrief = (text) => {
  const source = String(text || '');
  const params = [];

  params.push({
    id: 'type',
    label: 'Тип работы',
    value: detectType(source),
    source: 'Классификация по тексту брифа',
    confidence: source.length > 120 ? 'Высокая' : 'Средняя',
    status: 'pending',
  });

  const integrationMatch = source.match(/(\d+)\s*(поток|интеграц|контур|систем)/i);
  if (integrationMatch) {
    params.push({
      id: 'integrations',
      label: 'Количество интеграций',
      value: integrationMatch[1],
      source: snippet(source, integrationMatch.index, integrationMatch[0].length),
      confidence: 'Средняя',
      status: 'pending',
    });
  }

  const screenMatch = source.match(/(\d+)\s*(экран|форм|кабинет)/i);
  if (screenMatch) {
    params.push({
      id: 'screens',
      label: 'Экраны интерфейса',
      value: screenMatch[1],
      source: snippet(source, screenMatch.index, screenMatch[0].length),
      confidence: 'Средняя',
      status: 'pending',
    });
  }

  const userMatch = source.match(/(\d[\d\s]{1,6})\s*(польз|сотрудник|рабочих мест)/i);
  if (userMatch) {
    params.push({
      id: 'users',
      label: 'Пользователи',
      value: userMatch[1].trim().replace(/\s/g, ''),
      source: snippet(source, userMatch.index, userMatch[0].length),
      confidence: 'Средняя',
      status: 'pending',
    });
  }

  const deadlineMatch = source.match(/(\d+)\s*(нед|мес|дн|день|дней)/i);
  if (deadlineMatch) {
    const unit = /мес/i.test(deadlineMatch[2]) ? 'мес.' : /дн|день|дней/i.test(deadlineMatch[2]) ? 'дн.' : 'нед.';
    params.push({
      id: 'deadline',
      label: 'Желаемый срок',
      value: `${deadlineMatch[1]} ${unit}`,
      source: snippet(source, deadlineMatch.index, deadlineMatch[0].length),
      confidence: 'Средняя',
      status: 'pending',
    });
  }

  if (/(24\/7|круглосуточ|sla|99[.,]\d+)/i.test(source)) {
    params.push({
      id: 'sla',
      label: 'Требования SLA',
      value: 'Круглосуточный режим, эскалация',
      source: 'Найдено упоминание SLA / 24/7',
      confidence: 'Высокая',
      status: 'pending',
    });
  }

  return params;
};

const WORK_TYPE_LABELS = {
  integration: 'Интеграция систем',
  development: 'Разработка ПО',
  cv: 'Computer Vision',
  support: 'Сопровождение',
  default: 'ИТ-инициатива',
};

const toNumber = (value, fallback) => Number(String(value).replace(/\D/g, '')) || fallback;

export const applyParam = (state, param) => {
  const next = { ...state, stages: state.stages.map((stage) => ({ ...stage })), extras: state.extras.map((item) => ({ ...item })) };
  const id = param.id;
  if (id === 'type' || id === 'work_type') {
    next.type = id === 'work_type' ? (WORK_TYPE_LABELS[String(param.value)] ?? String(param.value)) : param.value;
  }
  if (id === 'integrations' || id === 'flows') next.integrations = toNumber(param.value, state.integrations);
  if (id === 'screens') next.screens = toNumber(param.value, 0);
  if (id === 'users') next.users = toNumber(param.value, state.users);
  if (id === 'complexity') next.complexity = String(param.value);
  if (id === 'deadline' || id === 'duration_weeks') {
    const value = Number(String(param.value).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    const weeks = /мес/i.test(param.value) ? value * 4.345 : /дн/i.test(param.value) ? value / 5 : value;
    if (weeks) next.deadlineWeeks = Math.round(weeks);
  }
  return next;
};
