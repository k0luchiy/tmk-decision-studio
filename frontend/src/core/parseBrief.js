const snippet = (text, index, length) => {
  const start = Math.max(0, index - 22);
  const end = Math.min(text.length, index + length + 22);
  return `«${text.slice(start, end).trim()}»`;
};

const detectType = (text) => {
  const lower = text.toLowerCase();
  if (/(компьютерн|машинн|cv|дефект|видеоаналит|зрени)/.test(lower)) return 'Computer Vision';
  if (/(поддержк|sla|24\/7|дежурств|сопровожд)/.test(lower)) return 'Сопровождение';
  if (/(предиктив|pdm|вибрац|остаточн|прогноз|rul)/.test(lower)) return 'Предиктивная аналитика';
  if (/(телеграм|telegram|aiogram|чат-бот|чатбот)/.test(lower)) return 'Чат-бот';
  if (/(искусственн|нейросет|llm|nlp)/.test(lower)) return 'Искусственный интеллект';
  if (/(завод|датчик|аварийн|регулир|диспетчер|асутп|mes|scada|оборудован)/.test(lower)) return 'MES / АСУ ТП';
  if (/(инфраструктур|сервер|виртуализац|\bvm\b|цод)/.test(lower)) return 'ИТ-инфраструктура';
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
  ai: 'Искусственный интеллект',
  chatbot: 'Чат-бот',
  pdm: 'Предиктивная аналитика',
  mes: 'MES / АСУ ТП',
  infrastructure: 'ИТ-инфраструктура',
  rpa: 'RPA',
  mobile: 'Мобильная разработка',
  bi: 'BI и аналитика',
  default: 'ИТ-инициатива',
};

const toNumber = (value, fallback) => Number(String(value).replace(/\D/g, '')) || fallback;

export const applyParam = (state, param) => {
  const next = { ...state, stages: state.stages.map((stage) => ({ ...stage })), extras: state.extras.map((item) => ({ ...item })) };
  const id = param.id;
  if (id === 'type' || id === 'work_type') {
    next.type = id === 'work_type' ? (WORK_TYPE_LABELS[String(param.value)] ?? String(param.value)) : param.value;
  }
  if (id === 'platform') next.platform = String(param.value);
  if (id === 'servers' || id === 'vms') next.servers = toNumber(param.value, state.servers ?? 0);
  if (id.startsWith('stage_owner_')) {
    const stageId = id.slice('stage_owner_'.length);
    const owner = String(param.value);
    const splitByOwner = { internal: 80, split: 50, vendor: 20 };
    if (splitByOwner[owner] !== undefined) {
      next.stages = next.stages.map((stage) => (
        stage.id === stageId ? { ...stage, owner, split: splitByOwner[owner] } : stage
      ));
    }
  }
  if (id === 'integrations' || id === 'flows') next.integrations = toNumber(param.value, state.integrations);
  if (id === 'screens') next.screens = toNumber(param.value, 0);
  if (id === 'users') next.users = toNumber(param.value, state.users);
  if (id === 'complexity') next.complexity = String(param.value);
  if (id === 'deadline' || id === 'duration' || id === 'duration_weeks') {
    const raw = String(param.value);
    const unit = String(param.unit ?? '');
    const isDays = /^(дн|день|дней)$/i.test(unit) || /дн|день|дней/i.test(raw);
    if (isDays) return next;
    const value = Number(raw.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    const weeks = /мес/i.test(unit) || /мес/i.test(raw)
      ? value * 4.345
      : /год|лет/i.test(unit) || /год|лет/i.test(raw)
        ? value * 52
        : /нед/i.test(unit) || /нед/i.test(raw)
          ? value
          : value;
    if (weeks) next.deadlineWeeks = Math.round(weeks);
  }
  return next;
};

export const applyAutoParams = (state, params = []) => (
  params.filter((param) => param.autoAccepted).reduce(applyParam, state)
);
