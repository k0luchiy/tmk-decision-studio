import React from 'react';
import {
  AlertTriangle, ArrowRight, BookOpen, Calculator, CheckCircle2, Database, FileText,
  GitBranch, Info, Layers3, ShieldCheck, Target, Users,
} from 'lucide-react';
import { Button, LinkButton, Pill, SectionHead } from '../components/ui.jsx';

const FLOW = [
  { n: '01', title: 'Декомпозиция', text: 'Задача → 6 этапов + сопровождение. Один шаблон для команды и подрядчика.' },
  { n: '02', title: 'Трудоёмкость', text: 'Часы по этапам и ролям, диапазон P10–P90, коэффициент сложности.' },
  { n: '03', title: 'Внутренняя стоимость', text: 'Fully loaded ставка: оклад → gross → взносы → накладные → АРМ.' },
  { n: '04', title: 'Рыночная оценка', text: '≥ 3 аналога, нормализация, медиана, диапазон подрядчика.' },
  { n: '05', title: 'Решение', text: 'Стоимость + срок + риск + гибкость. P50, TCO, break-even, confidence.' },
];

const FORMULAS = [
  {
    id: 'internal',
    title: 'Внутренняя стоимость',
    formula: 'C_team = Σ(часыᵢ × fully_loaded_hourᵢ) + найм + ramp-up + bench + текучесть',
    text: 'Ставки берутся из rate_cards.json: 14 ролей × 4 грейда, fully loaded. Отдельной ставки 4 200 ₽/ч в бэке нет — UI может передать только override средней ставки.',
  },
  {
    id: 'rate',
    title: 'Ставки из rate_cards',
    formula: 'C_час = fully_loaded_hour[роль, грейд];   C_мес = (S_нетто / 0,87) × (1 + взносы) × (1 + накладные) + АРМ;   C_час = C_мес / 120',
    text: '14 ролей × 4 грейда в rate_cards.json и contractor_rate_cards.json. Ставка не пересчитывается: берётся готовая fully_loaded_hour строки датасета.',
  },
  {
    id: 'vendor',
    title: 'Стоимость подрядчика',
    formula: 'C_vendor = Σ(часы × rate_mid) + 15% координация + 5% приёмка + 20% риск-премия (fixed_price) [+ НДС 20%]',
    text: 'Труд — по contractor_rate_cards.json (geo RU). Координация 15%, приёмка 5%, риск-премия фиксированно 20% только для fixed_price. НДС 20% — по флагу vat.',
  },
  {
    id: 'hybrid',
    title: 'Гибридный сценарий',
    formula: 'C_hybrid = Σ (часыᵢ × ставкаᵢ × доля_ТМК + сметаᵢ × (1 − доля_ТМК)) + статьи + координация',
    text: 'Доля ТМК задаётся по каждому этапу. Координация — 3,5%. Найм учитывается пропорционально доле внутренних работ, bench снимается частично.',
  },
  {
    id: 'range',
    title: 'Диапазон P10 / P50 / P90',
    formula: 'μ = (ln P10 + ln P90) / 2;   σ = (ln P90 − ln P10) / (2 × 1,2816);   резерв = P80 − P50',
    text: 'Логнормальные маргиналы, 4 000 итераций Монте-Карло на сценарий, корреляция ρ = 0,5 и обязательный seed. Резерв — это P80 − P50, а не процент.',
  },
  {
    id: 'decision',
    title: 'Рекомендация и confidence',
    formula: 'Score = 0,45 × стоимость + 0,25 × срок + 0,20 × риск + 0,10 × гибкость;   Confidence = 0,30 × бриф + 0,30 × методы + 0,20 × аналоги + 0,20 × данные',
    text: 'Стоимость и срок нормируются относительно лучшего варианта. Риск и гибкость — экспертные шкалы, зависящие от категории работ. Score приходит из API и не пересчитывается на фронте.',
  },
  {
    id: 'tco',
    title: 'TCO и break-even',
    formula: 'TCO(t) = CAPEX + OPEX × 12 × t;   break-even: C_team + S_team × t = C_vendor + S_vendor × t',
    text: 'Сравнение полной стоимости владения на 1, 3 и 5 лет. Break-even — месяц, когда накопленные затраты двух сценариев сравниваются.',
  },
];

const DATA_MODEL = [
  { name: 'Task', text: 'Бриф, тип, сложность, интеграции, пользователи', icon: FileText },
  { name: 'WorkItem', text: '6 этапов + сопровождение: часы, роли, P10–P90', icon: Layers3 },
  { name: 'Estimate', text: 'Три сценария, диапазоны, срок, вердикт, уверенность', icon: Calculator },
  { name: 'CostLine', text: 'labor, coordination, risk, vat, hiring, rampup, bench', icon: Database },
  { name: 'Assumption / Risk / Source', text: 'Значение, диапазон, P × I, версия и ссылка на источник', icon: ShieldCheck },
];

const RATE_CHAIN = [
  { label: 'rate_cards.json', value: '14 ролей', note: 'внутренняя команда' },
  { label: 'Грейды', value: '4 на роль', note: 'junior → lead' },
  { label: 'fully_loaded_hour', value: 'из датасета', note: 'не пересчитывается' },
  { label: 'contractor_rate_cards', value: 'rate_mid', note: 'только geo RU' },
  { label: 'Координация / приёмка', value: '15% / 5%', note: 'от труда подрядчика' },
];

const SOURCES = [
  { name: 'data/datasets/rate_cards.json', version: '14 ролей × 4 грейда', date: '09.11.2026', status: 'Демо', text: 'Fully loaded ставки внутренней команды; берутся как есть из датасета.' },
  { name: 'data/datasets/contractor_rate_cards.json', version: 'geo RU', date: '09.11.2026', status: 'Демо', text: 'Ставки подрядчика, риск-премия fixed_price 15–30%, НДС-флаг.' },
  { name: 'data/datasets/analogue_corpus.json', version: '49 якорей', date: '09.11.2026', status: 'Проверка', text: 'Опубликованные аналоги с нормализацией; требуют ручной валидации.' },
  { name: 'data/manifest.json', version: '47a8fb6b…', date: '09.11.2026', status: 'Демо', text: 'Версия датасетов и SHA256 шести файлов для воспроизводимости.' },
];

export default function Methodology({ goTab }) {
  return (
    <div className="page-stack">
      <section className="method-hero">
        <div>
          <div className="eyebrow light">МЕТОДИКА · ВЕРСИЯ 1.0 · DATASET 47A8FB6B…</div>
          <h1>Каждая цифра должна иметь объяснение</h1>
          <p>
            Decision Studio считает три сценария из одной декомпозиции. Показываем формулу, исходные параметры,
            источники, допущения и границы применимости — чтобы расчёт можно было проверить, а не принять на веру.
          </p>
        </div>
        <div className="method-hero-mark"><BookOpen size={34} /><span>METHOD</span></div>
      </section>

      <section className="method-flow">
        {FLOW.map((step) => (
          <div key={step.n} className="method-step">
            <span>{step.n}</span>
            <b>{step.title}</b>
            <p>{step.text}</p>
          </div>
        ))}
      </section>

      <section className="panel">
        <SectionHead
          eyebrow="ФОРМУЛЫ"
          title="Как считается оценка"
          description="Формулы, которые связывают входные данные и результат из API"
          actions={<Pill tone="good"><ShieldCheck size={12} /> Проверяемо</Pill>}
        />
        <div className="formula-grid">
          {FORMULAS.map((formula) => (
            <article className="formula-card" key={formula.id}>
              <div className="formula-card-head">
                <span><Calculator size={15} /></span>
                <h3>{formula.title}</h3>
              </div>
              <code>{formula.formula}</code>
              <p>{formula.text}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="method-two-col">
        <section className="panel">
          <SectionHead
            eyebrow="СТАВКА"
            title="От оклада до fully loaded часа"
            description="Почему нельзя умножать «нетто × часы»"
          />
          <div className="rate-chain">
            {RATE_CHAIN.map((item, index) => (
              <div key={item.label} className="rate-chain-row">
                <span className="rate-index">{String(index + 1).padStart(2, '0')}</span>
                <div><b>{item.label}</b><small>{item.note}</small></div>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
          <div className="rate-note">
            <Info size={15} />
            <span>Единой ставки 4 200 ₽/ч нет: API берёт fully_loaded_hour из rate_cards по роли и грейду. UI может передать только override средней ставки.</span>
          </div>
        </section>

        <section className="panel">
          <SectionHead
            eyebrow="МОДЕЛЬ ДАННЫХ"
            title="Одна цепочка происхождения"
            description="Task → WorkItem → Estimate → CostLine → Assumption / Risk / Source"
          />
          <div className="data-model">
            {DATA_MODEL.map((item, index) => (
              <div className="data-model-row" key={item.name}>
                <span className="data-model-icon"><item.icon size={14} /></span>
                <div><b>{item.name}</b><small>{item.text}</small></div>
                {index < DATA_MODEL.length - 1 && <ArrowRight size={13} />}
              </div>
            ))}
          </div>
          <div className="rate-note">
            <GitBranch size={15} />
            <span>Один <b>estimate_id</b> связывает расчёт, допущения, риски, источники и экспорт.</span>
          </div>
        </section>
      </div>

      <section className="panel">
        <SectionHead
          eyebrow="ИСТОЧНИКИ"
          title="Реестр данных"
          description="Версия, дата и статус каждого набора"
          actions={<LinkButton onClick={() => goTab('data')}>Открыть реестр</LinkButton>}
        />
        <div className="source-registry">
          {SOURCES.map((source) => (
            <div className="source-registry-card" key={source.name}>
              <div className="source-registry-head">
                <Database size={15} />
                <b>{source.name}</b>
                <Pill tone={source.status === 'Демо' ? 'warn' : source.status === 'Схема' ? 'info' : 'neutral'}>{source.status}</Pill>
              </div>
              <p>{source.text}</p>
              <div className="source-registry-meta"><span>{source.version}</span><span>{source.date}</span></div>
            </div>
          ))}
        </div>
      </section>

      <div className="method-bottom">
        <section className="panel limitation-panel">
          <SectionHead eyebrow="ОГРАНИЧЕНИЯ" title="Что методика не утверждает" description="Честные границы прототипа" />
          <ul className="limitation-list">
            <li><AlertTriangle size={14} /> Не заменяет детальную смету, техническое обследование и коммерческое предложение.</li>
            <li><AlertTriangle size={14} /> Ставки, аналоги и риски — демонстрационные, не подтверждённые данные ТМК.</li>
            <li><AlertTriangle size={14} /> Confidence — качество входа, а не вероятность точности прогноза.</li>
            <li><AlertTriangle size={14} /> Срок зависит от критического пути и доступности людей, а не только от суммы часов.</li>
            <li><AlertTriangle size={14} /> Для production нужны калибровка на 10–15 закрытых проектах и MAPE ≤ 30%.</li>
          </ul>
        </section>
        <section className="panel method-cta">
          <Target size={22} />
          <h3>Проверить на конкретной задаче</h3>
          <p>Откройте параметры, измените ставку, резерв, срок или доли гибрида — и посмотрите, как меняется рекомендация.</p>
          <div className="method-cta-actions">
            <Button variant="primary" rightIcon={ArrowRight} onClick={() => goTab('parameters')}>К параметрам</Button>
            <Button variant="secondary" onClick={() => goTab('justification')}>К обоснованию</Button>
          </div>
          <div className="method-cta-foot"><Users size={14} /> Роли и вклад команды — в презентации и журнале решений</div>
        </section>
      </div>
    </div>
  );
}
