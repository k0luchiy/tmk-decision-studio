import React, { useEffect, useMemo, useState } from 'react';
import { Topbar, Footer } from './components/shell.jsx';
import StartScreen from './components/StartScreen.jsx';
import Cockpit from './components/Cockpit.jsx';
import { Toast } from './components/ui.jsx';
import { CASES } from './data/cases.js';
import { computeModel, createCaseState, recommendedRationale } from './core/calc.js';
import { applyParam, parseBrief } from './core/parseBrief.js';

const buildParams = (state) => [
  {
    id: 'type',
    label: 'Тип работы',
    value: state.type,
    source: 'Классификация по тексту брифа',
    confidence: 'Высокая',
    status: 'confirmed',
  },
  {
    id: 'integrations',
    label: 'Количество интеграций',
    value: String(state.integrations),
    source: `Контуры обмена в описании: ${state.integrations}`,
    confidence: 'Средняя',
    status: 'confirmed',
  },
  {
    id: 'screens',
    label: 'Экраны интерфейса',
    value: String(state.screens ?? '—'),
    source: 'Из брифа и состава работ',
    confidence: 'Средняя',
    status: 'confirmed',
  },
  {
    id: 'deadline',
    label: 'Целевой срок',
    value: `${state.deadlineWeeks} нед.`,
    source: 'Целевой ориентир, требует подтверждения',
    confidence: 'Средняя',
    status: 'pending',
  },
];

const download = (blob, name) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const escapeCsv = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;

const VALID_TABS = ['overview', 'parameters', 'analytics', 'estimate', 'justification', 'method', 'data'];
const initialQuery = new URLSearchParams(window.location.search);
const initialCaseId = CASES[initialQuery.get('case')] ? initialQuery.get('case') : 'D1';
const initialTab = VALID_TABS.includes(initialQuery.get('tab')) ? initialQuery.get('tab') : 'overview';
const initialPage = initialQuery.has('case') ? 'cockpit' : 'start';

export default function App() {
  const [theme, setTheme] = useState(() => {
    const fromUrl = initialQuery.get('theme');
    if (fromUrl === 'dark' || fromUrl === 'light') return fromUrl;
    return localStorage.getItem('tmk-theme') || 'light';
  });
  const [page, setPage] = useState(initialPage);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeScenario, setActiveScenario] = useState(() => computeModel(createCaseState(initialCaseId)).recommended);
  const [state, setState] = useState(() => createCaseState(initialCaseId));
  const [params, setParams] = useState(() => buildParams(createCaseState(initialCaseId)));
  const [parsed, setParsed] = useState(true);
  const [files, setFiles] = useState([]);
  const [saved, setSaved] = useState([]);
  const [toast, setToast] = useState('');

  const model = useMemo(() => computeModel(state), [state]);
  const rationale = useMemo(() => recommendedRationale(model), [model]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('tmk-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const url = page === 'cockpit' ? `?case=${state.caseId}&tab=${activeTab}` : window.location.pathname;
    window.history.replaceState(null, '', url);
  }, [page, activeTab, state.caseId]);

  const notify = (message) => setToast(message);

  const goTab = (tab) => {
    setPage('cockpit');
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goHome = () => {
    setPage('start');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadCase = (id) => {
    const next = createCaseState(id);
    const nextModel = computeModel(next);
    setState(next);
    setParams(buildParams(next));
    setParsed(true);
    setFiles([]);
    setActiveScenario(nextModel.recommended);
    setPage('cockpit');
    setActiveTab('overview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    notify(`Загружен кейс ${id}: ${CASES[id].name}`);
  };

  const startAssessment = ({ brief, files: incomingFiles }) => {
    let next = state;
    if (brief && brief.trim()) {
      next = { ...state, description: brief.trim() };
      const parsedParams = parseBrief(brief.trim());
      setParams(parsedParams.length ? parsedParams : buildParams(next));
      next = { ...next, confirmedParams: 0, rejectedParams: 0 };
      setParsed(true);
    } else {
      setParams(buildParams(next));
    }
    setState(next);
    setFiles(incomingFiles || []);
    const nextModel = computeModel(next);
    setActiveScenario(nextModel.recommended);
    setPage('cockpit');
    setActiveTab('overview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    notify('Оценка сформирована: три сценария готовы к сравнению');
  };

  const update = (patch) => {
    setState((old) => {
      const next = { ...old, ...patch };
      if (patch.teamRate && old.teamRate && patch.teamRate !== old.teamRate) {
        const factor = Number(patch.teamRate) / Number(old.teamRate);
        next.stages = old.stages.map((stage) => ({ ...stage, rate: Math.round(stage.rate * factor) }));
      }
      return next;
    });
    if (Object.prototype.hasOwnProperty.call(patch, 'description')) setParsed(false);
  };

  const updateStage = (id, key, value) => {
    const splitByOwner = { internal: 80, split: 50, vendor: 20 };
    setState((old) => ({
      ...old,
      stages: old.stages.map((stage) => {
        if (stage.id !== id) return stage;
        if (key === 'owner') {
          return { ...stage, owner: value, split: splitByOwner[value] ?? stage.split };
        }
        if (key === 'name' || key === 'desc') {
          return { ...stage, [key]: value };
        }
        return {
          ...stage,
          [key]: key === 'split' ? Number(value) : Number(value) || 0,
          ...(key === 'split'
            ? { owner: Number(value) >= 65 ? 'internal' : Number(value) <= 35 ? 'vendor' : 'split' }
            : {}),
        };
      }),
    }));
  };

  const addStage = () => {
    const id = `stage-${Date.now()}`;
    setState((old) => ({
      ...old,
      stages: [
        ...old.stages,
        {
          id,
          name: 'Новый этап',
          desc: 'Опишите состав работ и ответственность',
          hours: 40,
          rate: old.teamRate,
          external: 250000,
          days: 5,
          split: old.hybridSplit,
          owner: old.hybridSplit >= 65 ? 'internal' : old.hybridSplit <= 35 ? 'vendor' : 'split',
          category: 'Работы',
        },
      ],
    }));
    notify('Этап добавлен');
    return id;
  };

  const removeStage = (id) => {
    setState((old) => ({ ...old, stages: old.stages.filter((stage) => stage.id !== id) }));
    notify('Этап удалён');
  };

  const updateExtra = (id, key, value) => {
    setState((old) => ({
      ...old,
      extras: old.extras.map((item) => (item.id === id ? { ...item, [key]: Number(value) || 0 } : item)),
    }));
  };

  const addExtra = (payload) => {
    setState((old) => ({
      ...old,
      extras: [...old.extras, { id: `extra-${Date.now()}`, ...payload }],
    }));
    notify('Статья затрат добавлена');
  };

  const removeExtra = (id) => {
    setState((old) => ({ ...old, extras: old.extras.filter((item) => item.id !== id) }));
    notify('Статья затрат удалена');
  };

  const confirmParam = (param) => {
    setState((old) => {
      const applied = applyParam(old, param);
      return { ...applied, confirmedParams: Math.min(4, (old.confirmedParams || 0) + 1) };
    });
    setParams((old) => old.map((item) => (item.id === param.id ? { ...item, status: 'confirmed' } : item)));
    notify(`Параметр «${param.label}» подтверждён`);
  };

  const rejectParam = (param) => {
    setState((old) => ({ ...old, rejectedParams: Math.min(3, (old.rejectedParams || 0) + 1) }));
    setParams((old) => old.map((item) => (item.id === param.id ? { ...item, status: 'rejected' } : item)));
    notify(`Параметр «${param.label}» отклонён — уверенность снижена`);
  };

  const reparse = () => {
    const extracted = parseBrief(state.description);
    setParams(extracted.length ? extracted : buildParams(state));
    setState((old) => ({ ...old, confirmedParams: 0, rejectedParams: 0 }));
    setParsed(true);
    notify(`Бриф разобран: найдено ${extracted.length || 4} параметров`);
  };

  const addFiles = (fileList) => {
    const names = Array.from(fileList || []).map((file) => file.name);
    if (names.length) setFiles((old) => [...new Set([...old, ...names])]);
  };

  const removeFile = (name) => setFiles((old) => old.filter((item) => item !== name));

  const exportJSON = () => {
    const payload = {
      product: 'TMK Decision Studio',
      version: '2.0.0',
      generatedAt: new Date().toISOString(),
      estimateId: `${state.caseId}-2026-${model.confidence.score}`,
      notice: 'Все данные демонстрационные. Не является коммерческим предложением.',
      state,
      summary: {
        recommended: model.recommended,
        confidence: model.confidence,
        effort: model.effort,
        scenarios: model.scenarios,
        warnings: model.warnings,
        analogs: model.meta.analogs,
        risks: model.risks,
        assumptions: model.meta.assumptions,
      },
    };
    download(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), `tmk-decision-${state.caseId}-${Date.now()}.json`);
    setSaved((old) => [
      { id: state.caseId, name: state.name, date: new Date().toLocaleDateString('ru-RU'), cost: model.scenarios[model.recommended].p50 },
      ...old.filter((item) => item.id !== state.caseId),
    ]);
    notify('JSON-снимок сохранён и добавлен в последние оценки');
  };

  const exportCSV = () => {
    const rows = [
      ['Этап', 'Часы ТМК', 'Ставка, ₽/ч', 'Внутренняя стоимость, ₽', 'Стоимость подрядчика, ₽', 'Доля ТМК в гибриде, %', 'Дни'],
      ...state.stages.map((stage) => [
        stage.name,
        stage.hours,
        stage.rate,
        stage.hours * stage.rate,
        stage.external,
        stage.split,
        stage.days,
      ]),
      [],
      ['Сценарий', 'P10, ₽', 'P50, ₽', 'P90, ₽', 'Срок, нед.', 'TCO 3 года, ₽'],
      ...['internal', 'vendor', 'hybrid'].map((id) => [
        id,
        Math.round(model.scenarios[id].p10),
        Math.round(model.scenarios[id].p50),
        Math.round(model.scenarios[id].p90),
        model.scenarios[id].weeks,
        Math.round(model.scenarios[id].tco3),
      ]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(escapeCsv).join(';')).join('\n')}`;
    download(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `tmk-estimate-${state.caseId}.csv`);
    notify('CSV-таблица этапов подготовлена');
  };

  const print = () => {
    window.print();
  };

  return (
    <div className="app">
      <Topbar page={page} goHome={goHome} theme={theme} toggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
      {page === 'start' ? (
        <StartScreen onStart={startAssessment} onLoadCase={loadCase} saved={saved} />
      ) : (
        <Cockpit
          model={model}
          state={state}
          goHome={goHome}
          activeTab={activeTab}
          goTab={goTab}
          activeScenario={activeScenario}
          setActiveScenario={setActiveScenario}
          onCaseChange={loadCase}
          onExportJSON={exportJSON}
          onExportCSV={exportCSV}
          onPrint={print}
          rationale={rationale}
          theme={theme}
          toggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onDeadlineChange={(value) => update({ deadlineWeeks: value })}
          params={params}
          confirmParam={confirmParam}
          rejectParam={rejectParam}
          reparse={reparse}
          parsed={parsed}
          files={files}
          addFiles={addFiles}
          removeFile={removeFile}
          update={update}
          updateStage={updateStage}
          removeStage={removeStage}
          addStage={addStage}
          updateExtra={updateExtra}
          removeExtra={removeExtra}
          addExtra={addExtra}
        />
      )}
      <Footer goHome={goHome} />
      <Toast message={toast} />
    </div>
  );
}
