import React from 'react';
import { WorkspaceBar, ScenarioStrip, Sidebar } from './shell.jsx';
import Overview from '../pages/Overview.jsx';
import Parameters from '../pages/Parameters.jsx';
import Analytics from '../pages/Analytics.jsx';
import Estimate from '../pages/Estimate.jsx';
import Justification from '../pages/Justification.jsx';
import Methodology from '../pages/Methodology.jsx';
import DataPage from '../pages/DataPage.jsx';

export default function Cockpit(props) {
  const {
    model, state, activeTab, goTab, activeScenario, setActiveScenario, onCaseChange,
    onExportJSON, onExportCSV, onPrint, rationale, theme, toggleTheme, onDeadlineChange, goHome,
    params, confirmParam, rejectParam, reparse, parsed, files, addFiles, removeFile,
    update, updateStage, removeStage, addStage, updateExtra, removeExtra, addExtra,
    apiStatus,
  } = props;

  const showCards = activeTab === 'overview';

  return (
    <main className="cockpit">
      <WorkspaceBar
        model={model}
        activeScenario={activeScenario}
        setActiveScenario={setActiveScenario}
        onCaseChange={onCaseChange}
        onExportJSON={onExportJSON}
        onExportCSV={onExportCSV}
        onPrint={onPrint}
        theme={theme}
        toggleTheme={toggleTheme}
        apiStatus={apiStatus}
      />
      <div className="cockpit-body">
        <Sidebar activeTab={activeTab} goTab={goTab} goHome={goHome} model={model} />
        <div className="cockpit-main">
          {showCards && (
            <ScenarioStrip
              model={model}
              active={activeScenario}
              setActive={setActiveScenario}
              goTab={goTab}
            />
          )}
          <div className="cockpit-content">

        {activeTab === 'overview' && (
          <Overview model={model} rationale={rationale} goTab={goTab} onExport={onExportJSON} active={activeScenario} state={state} onStageOwnerChange={(id, value) => updateStage(id, 'owner', value)} />
        )}
        {activeTab === 'parameters' && (
          <Parameters
            state={state}
            model={model}
            update={update}
            activeScenario={activeScenario}
            setActiveScenario={setActiveScenario}
            params={params}
            confirmParam={confirmParam}
            rejectParam={rejectParam}
            reparse={reparse}
            parsed={parsed}
            files={files}
            addFiles={addFiles}
            removeFile={removeFile}
            goTab={goTab}
          />
        )}
        {activeTab === 'analytics' && (
          <Analytics model={model} active={activeScenario} setActive={setActiveScenario} onDeadlineChange={onDeadlineChange} state={state} onStageOwnerChange={(id, value) => updateStage(id, 'owner', value)} />
        )}
        {activeTab === 'estimate' && (
          <Estimate
            state={state}
            model={model}
            updateStage={updateStage}
            removeStage={removeStage}
            addStage={addStage}
            updateExtra={updateExtra}
            removeExtra={removeExtra}
            addExtra={addExtra}
            goTab={goTab}
            onExportCSV={onExportCSV}
          />
        )}
        {activeTab === 'justification' && (
          <Justification
            model={model}
            goTab={goTab}
            onExportJSON={onExportJSON}
            onExportCSV={onExportCSV}
            onPrint={onPrint}
          />
        )}
        {activeTab === 'method' && <Methodology goTab={goTab} />}
            {activeTab === 'data' && <DataPage />}
          </div>
        </div>
      </div>
    </main>
  );
}
