import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Topbar, Footer } from './components/shell.jsx';
import StartScreen from './components/StartScreen.jsx';
import Cockpit from './components/Cockpit.jsx';
import { Toast } from './components/ui.jsx';
import { CASES } from './data/cases.js';
import { computeModel, createCaseState, recommendedRationale } from './core/calc.js';
import { buildModelFromApi, exportApiEstimate, fetchApiModel } from './core/apiModel.js';
import { fetchIntake, confirmIntake, mapIntakeToParams, fetchEstimates, fetchEstimate } from './core/api.js';
import { applyAutoParams, applyParam, parseBrief } from './core/parseBrief.js';

const INTAKE_SOURCES = { rules: 'правила', 'jev-cache': 'Jev-кэш', 'jev-live': 'Jev live' };
const savedName = (brief) => {
  const text = (brief ?? '').trim();
  return text.length > 50 ? `${text.slice(0, 50)}…` : text;
};

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
  const [model, setModel] = useState(() => computeModel(createCaseState(initialCaseId)));
  const [rateDirty, setRateDirty] = useState(false);
  const [stageHoursDirty, setStageHoursDirty] = useState(false);
  const [apiStatus, setApiStatus] = useState('idle');
  const [intakeSource, setIntakeSource] = useState(null);
  const [intakeMode, setIntakeMode] = useState(() => import.meta.env?.VITE_INTAKE_MODE ?? 'cache');
  const apiErrorNotified = useRef(false);
  const skipNextRecalc = useRef(false);

  const rationale = useMemo(() => recommendedRationale(model), [model]);

  useEffect(() => {
    if (skipNextRecalc.current) {
      skipNextRecalc.current = false;
      return undefined;
    }
    const localModel = computeModel(state);
    if (import.meta.env.VITE_DATA_MODE === 'local' || (state.description ?? '').trim().length < 20) {
      setModel(localModel);
      setApiStatus('idle');
      return undefined;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setApiStatus('loading');
      fetchApiModel(state, { rateDirty, stageHoursDirty }, { signal: controller.signal })
        .then((response) => {
          const nextModel = buildModelFromApi(response, state);
          setModel(nextModel);
          setApiStatus('api');
          apiErrorNotified.current = false;
        })
        .catch((error) => {
          if (error?.name === 'AbortError') return;
          setModel(localModel);
          setApiStatus('error');
          if (!apiErrorNotified.current) {
            apiErrorNotified.current = true;
            setToast('API недоступен — показаны локальные расчёты');
          }
        });
    }, 500);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [state, rateDirty, stageHoursDirty]);

  useEffect(() => {
    let alive = true;
    fetchEstimates()
      .then((data) => {
        if (!alive) return;
        const rows = (data?.items ?? []).map((item) => ({
          id: item.id,
          name: savedName(item.brief) || 'Оценка',
          date: item.createdAt,
          cost: item.p50Rub,
        }));
        if (rows.length) setSaved(rows);
      })
      .catch(() => {
        if (!alive) return;
      });
    return () => {
      alive = false;
    };
  }, []);

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

  const parseViaApi = async (brief, mode = intakeMode) => {
    try {
      const response = await fetchIntake(brief, mode);
      const mapped = mapIntakeToParams(response?.params);
      if (mapped.length) {
        setIntakeSource(INTAKE_SOURCES[response.status] ?? 'правила');
        return mapped;
      }
    } catch {
      if (mode === 'live') notify('Jev live недоступен — бриф разобран локальными правилами');
    }
    setIntakeSource(null);
    return parseBrief(brief);
  };

  const changeIntakeMode = (mode) => {
    setIntakeMode(mode);
    reparse(mode);
  };

  const openSaved = async (id) => {
    try {
      const stored = await fetchEstimate(id);
      const nextState = stored.state ?? state;
      const nextModel = buildModelFromApi(stored, nextState);
      skipNextRecalc.current = Boolean(stored.state);
      setState(nextState);
      setRateDirty(false);
      setStageHoursDirty(false);
      setParams(buildParams(nextState));
      setParsed(true);
      setModel(nextModel);
      setActiveScenario(nextModel.recommended);
      setPage('cockpit');
      setActiveTab('overview');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      notify('Сохранённая оценка открыта');
    } catch (error) {
      notify(`Не удалось открыть оценку: ${error.message}`);
    }
  };

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
    setRateDirty(false);
    setStageHoursDirty(false);
    setParams(buildParams(next));
    setParsed(true);
    setFiles([]);
    setActiveScenario(nextModel.recommended);
    setPage('cockpit');
    setActiveTab('overview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    notify(`Загружен кейс ${id}: ${CASES[id].name}`);
  };

  const startAssessment = async ({ brief, files: incomingFiles }) => {
    let next = state;
    if (brief && brief.trim()) {
      const text = brief.trim();
      next = { ...state, description: text, confirmedParams: 0, rejectedParams: 0 };
      setState(next);
      const parsedParams = await parseViaApi(text);
      next = applyAutoParams(next, parsedParams);
      setParams(parsedParams.length ? parsedParams : buildParams(next));
      setParsed(true);
    } else {
      setParams(buildParams(next));
    }
    setState(next);
    setRateDirty(false);
    setStageHoursDirty(false);
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
    if (Object.prototype.hasOwnProperty.call(patch, 'teamRate')) setRateDirty(true);
    if (Object.prototype.hasOwnProperty.call(patch, 'description')) setParsed(false);
  };

  const updateStage = (id, key, value) => {
    const splitByOwner = { internal: 80, split: 50, vendor: 20 };
    if (key === 'hours') setStageHoursDirty(true);
    if (key === 'rate') setRateDirty(true);
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
    setStageHoursDirty(true);
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
    setStageHoursDirty(true);
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
    const nextParams = params.map((item) => (item.id === param.id ? { ...item, status: 'confirmed' } : item));
    setParams(nextParams);
    confirmIntake(nextParams).catch(() => {});
    notify(`Параметр «${param.label}» подтверждён`);
  };

  const rejectParam = (param) => {
    setState((old) => ({ ...old, rejectedParams: Math.min(3, (old.rejectedParams || 0) + 1) }));
    setParams((old) => old.map((item) => (item.id === param.id ? { ...item, status: 'rejected' } : item)));
    notify(`Параметр «${param.label}» отклонён — уверенность снижена`);
  };

  const reparse = async (mode = intakeMode) => {
    const extracted = state.description?.trim() ? await parseViaApi(state.description, mode) : [];
    setParams(extracted.length ? extracted : buildParams(state));
    setState((old) => applyAutoParams({ ...old, confirmedParams: 0, rejectedParams: 0 }, extracted));
    setParsed(true);
    notify(`Бриф разобран: найдено ${extracted.length || 4} параметров`);
  };

  const addFiles = (fileList) => {
    const names = Array.from(fileList || []).map((file) => file.name);
    if (names.length) setFiles((old) => [...new Set([...old, ...names])]);
  };

  const removeFile = (name) => setFiles((old) => old.filter((item) => item !== name));

  const rememberSnapshot = (id) => {
    if (!id) return;
    setSaved((old) => [
      { id, name: savedName(state.description) || state.name, date: new Date().toISOString(), cost: model.scenarios[model.recommended].p50 },
      ...old.filter((item) => item.id !== id),
    ]);
  };

  const exportJSON = async () => {
    if (model.estimateId) {
      try {
        const { blob, filename } = await exportApiEstimate(model.estimateId, 'json');
        download(blob, filename);
        rememberSnapshot(model.estimateId);
        notify('JSON-снимок получен из API и добавлен в последние оценки');
        return;
      } catch (error) {
        notify(`Экспорт API недоступен: ${error.message}. Сохранён локальный снимок`);
      }
    }
    const payload = {
      product: 'TMK Decision Studio',
      version: '3.0.0',
      generatedAt: new Date().toISOString(),
      estimateId: model.estimateId ?? `${state.caseId}-2026-${model.confidence.score}`,
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
    notify('Локальный JSON-снимок сохранён');
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

  const exportPDF = async () => {
    if (model.estimateId) {
      try {
        const { blob, filename } = await exportApiEstimate(model.estimateId, 'pdf');
        download(blob, filename);
        rememberSnapshot(model.estimateId);
        notify('PDF получен из API');
        return;
      } catch (error) {
        notify(`PDF API недоступен: ${error.message}. Открываю печать`);
      }
    }
    window.print();
  };

  const exportXLSX = async () => {
    if (model.estimateId) {
      try {
        const { blob, filename } = await exportApiEstimate(model.estimateId, 'xlsx');
        download(blob, filename);
        rememberSnapshot(model.estimateId);
        notify('XLSX получен из API');
        return;
      } catch (error) {
        notify(`XLSX API недоступен: ${error.message}`);
        return;
      }
    }
    notify('XLSX доступно в API-режиме');
  };

  return (
    <div className="app">
      <Topbar page={page} goHome={goHome} theme={theme} toggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} apiStatus={apiStatus} />
      {page === 'start' ? (
        <StartScreen onStart={startAssessment} onLoadCase={loadCase} onOpenSaved={openSaved} saved={saved} />
      ) : (
        <Cockpit
          model={model}
          state={state}
          goHome={goHome}
          apiStatus={apiStatus}
          activeTab={activeTab}
          goTab={goTab}
          activeScenario={activeScenario}
          setActiveScenario={setActiveScenario}
          onCaseChange={loadCase}
          onExportJSON={exportJSON}
          onExportCSV={exportCSV}
          onExportPDF={exportPDF}
          onExportXLSX={exportXLSX}
          rationale={rationale}
          theme={theme}
          toggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onDeadlineChange={(value) => update({ deadlineWeeks: value })}
          params={params}
          confirmParam={confirmParam}
          rejectParam={rejectParam}
          reparse={reparse}
          parsed={parsed}
          intakeSource={intakeSource}
          intakeMode={intakeMode}
          changeIntakeMode={changeIntakeMode}
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
