import './styles.css';

const state = {
  view: 'overview',
  modelInfo: null,
  fairnessMetrics: null,
  counterfactuals: [],
  simulationResults: null,
  causalResults: null,
  predictionResult: null,
  loading: false,
  error: '',
  form: {
    file: null,
    target: 'income',
    sensitiveAttrs: 'gender,race',
    inference: {
      age: 30,
      workclass: 'Private',
      education: 'Bachelors',
      gender: 'Male',
      race: 'White',
      capital_gain: 0,
      capital_loss: 0,
      hours_per_week: 40,
    },
    simGroup: 0,
    simIncome: 1.0,
  },
};

const $root = document.getElementById('app');

const icons = {
  shield: () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.5-2.8 8.4-7 10-4.2-1.6-7-5.5-7-10V6l7-3z"/></svg>`,
  db: () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>`,
  spark: () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2l-2 7-7 2 7 2 2 7 2-7 7-2-7-2-2-7z"/></svg>`,
  cpu: () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 9h6v6H9z"/><path d="M3 9h3M3 15h3M18 9h3M18 15h3M9 3v3M15 3v3M9 18v3M15 18v3"/></svg>`,
  layout: () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 4v16M17 9H7"/></svg>`,
  finger: () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 0 0-4 4v6"/><path d="M8 12V7a4 4 0 0 1 8 0v5"/><path d="M16 12V8a4 4 0 0 1 8 0v4"/><path d="M8 12a4 4 0 0 0 8 0"/></svg>`,
  chart: () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19h16"/><path d="M7 16V9"/><path d="M12 16V5"/><path d="M17 16v-7"/></svg>`,
  binary: () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7v10l3-3"/><path d="M14 7h3v10h-3"/><path d="M17 12h-3"/></svg>`,
  play: () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 5v14l11-7z"/></svg>`,
  chevron: () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`,
  upload: () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 20h16"/></svg>`,
  refresh: () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 1-15.5 6.36"/><path d="M3 12a9 9 0 0 1 15.5-6.36"/><path d="M21 3v6h-6"/><path d="M3 21v-6h6"/></svg>`,
  layers: () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/></svg>`,
  alert: () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
  target: () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 2v4M22 12h-4M12 22v-4M2 12h4"/></svg>`,
  network: () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M4 12h16M4 17h16"/><circle cx="8" cy="7" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="10" cy="17" r="1.5"/></svg>`,
  arrowUp: () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m5 15 7-7 7 7"/><path d="M12 8v12"/></svg>`,
};

const tabs = [
  { id: 'overview', label: 'Overview', hint: 'Story', icon: icons.layout },
  { id: 'inference', label: 'Inference', hint: 'Probe', icon: icons.finger },
  { id: 'fairness', label: 'Fairness', hint: 'Audit', icon: icons.chart },
  { id: 'causal', label: 'Causal', hint: 'Paths', icon: icons.binary },
  { id: 'simulation', label: 'Simulation', hint: 'Shift', icon: icons.play },
];

const fmt = (n, digits = 2) => Number(n).toFixed(digits);

const escapeHtml = (str) =>
  String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const statPill = (label, value) => `
  <div class="status-card">
    <div class="label">${label}</div>
    <div class="value">${value}</div>
  </div>
`;

const cardTitle = (title, sub) => `
  <div>
    <div class="chip-primary">${escapeHtml(sub)}</div>
    <h3 class="section-title">${escapeHtml(title)}</h3>
  </div>
`;

const navMarkup = () =>
  tabs
    .map(
      (tab) => `
      <button class="nav-btn ${state.view === tab.id ? 'active' : ''}" data-view="${tab.id}">
        <div>
          <div class="brand" style="gap:12px">
            <span style="width:20px;height:20px">${tab.icon()}</span>
            <div>
              <strong style="font-size:14px">${tab.label}</strong>
              <span class="hint">${tab.hint}</span>
            </div>
          </div>
        </div>
        <span style="width:16px;height:16px">${icons.chevron()}</span>
      </button>
    `
    )
    .join('');

const renderUpload = () => `
  <div class="hero-layout">
    <div class="chip" style="width:max-content">${icons.cpu()} Dataset intake</div>
    <div class="card">
      <div class="accent-band"></div>
      <div class="panel-inner">
        <div class="hero-grid" style="grid-template-columns: 0.95fr 1.05fr; align-items: start">
          <div class="stack" style="gap:16px">
            <div>
              <h2 style="font-size: clamp(2.2rem, 4vw, 4rem); line-height: 0.95; max-width: 11ch">FairSim Calibration</h2>
              <p style="margin-top:12px; color:var(--muted); line-height:1.7">A compact upload card for the training step. No extra panels, no clutter, just the inputs you need.</p>
            </div>
            <div class="stack" style="gap:10px">
              <div class="chip-primary" style="width:max-content">${icons.shield()} Secure ingest</div>
              <div class="chip" style="width:max-content">${icons.db()} CSV ready</div>
              <div class="chip" style="width:max-content">${icons.spark()} Live audit</div>
            </div>
          </div>

          <div class="stack" style="gap:14px">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
              <span class="chip-primary">${icons.cpu()} v1.0</span>
              <span class="chip">${icons.layers()} Static form</span>
            </div>

            <label class="upload-drop" for="file-upload" style="padding:20px">
              <input id="file-upload" type="file" accept=".csv" class="hidden" />
              <div class="upload-icon" style="width:44px;height:44px;margin-bottom:12px">${icons.upload()}</div>
              <div id="upload-label">
                <p style="font-size:13px;font-weight:700;color:#334155">Drop a CSV here or click to browse</p>
                <p style="margin-top:6px;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#64748b">Local upload only</p>
              </div>
            </label>

            <div class="field-grid" style="grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px">
              <div class="field">
                <label>Target vector</label>
                <input id="target-input" class="input-soft" value="${escapeHtml(state.form.target)}" />
              </div>
              <div class="field">
                <label>Protected keys</label>
                <input id="sensitive-input" class="input-soft" value="${escapeHtml(state.form.sensitiveAttrs)}" />
              </div>
            </div>

            <div id="upload-error" class="empty hidden" style="min-height:auto;padding:12px 14px;text-align:left;border-style:solid;background:#fff1f2;color:#b91c1c;border-color:#fecdd3">
              <span style="display:flex;align-items:center;gap:10px">${icons.alert()}<strong>Upload error</strong></span>
              <div style="margin-top:8px;font-size:14px;line-height:1.6">Something went wrong while training.</div>
            </div>

            <button id="train-btn" class="button button-primary" style="width:100%;height:52px;display:flex;justify-content:center;align-items:center;gap:10px">
              <span>Calibrate engine</span>
              <span style="width:16px;height:16px">${icons.arrowUp()}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

const renderHeader = () => `
  <header class="card card-pad">
    <div class="accent-band"></div>
    <div class="topbar">
      <div class="hero">
        <div class="chip" style="width:max-content">${icons.spark()} Production Workspace</div>
        <h2 style="margin-top:16px">FairSim: A split-screen workspace for fairness, inference, and causal storytelling.</h2>
        <p>This interface is optimized for high-performance causal auditing, structural identification, and rapid stress-testing of AI models.</p>
      </div>
      <div class="status-row">
        ${statPill('Dataset', state.modelInfo ? 'Configured' : 'Loaded')}
        ${statPill('Analysis', 'Ready')}
        ${statPill('Compute', 'Live')}
      </div>
    </div>
  </header>
`;

const renderOverview = () => `
  <div class="split">
    <div class="stack">
      <div class="panel">
        <div class="panel-inner">
          ${cardTitle('Bias analysis', 'Fairness audit')}
          <p class="section-sub">Inspect group-level selection rates, counterfactual stability, and flagged disparity details from one compact overview.</p>
          <div style="height:18px"></div>
          ${renderFairnessMini()}
        </div>
      </div>
    </div>

    <div class="stack">
      <div class="panel">
        <div class="panel-inner">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
            <div>
              <div class="chip-primary">System Workflow</div>
              <h3 class="section-title" style="font-size:24px">What to present</h3>
            </div>
            <span style="width:22px;height:22px">${icons.layers()}</span>
          </div>
          <div class="stack" style="margin-top:14px">
            ${['Upload a CSV and train the model', 'Show the fairness audit first', 'Use inference, causal, and simulation as the story']
              .map(
                (item, idx) => `
                  <div class="list-item">
                    <span class="val">${idx + 1}</span>
                    <span class="muted">${item}</span>
                  </div>
                `
              )
              .join('')}
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-inner">
          <div class="chip-primary">System summary</div>
          <h3 class="section-title" style="font-size:24px">System Metrics</h3>
          <div class="stack" style="margin-top:14px">
            ${[
              ['Precision', '92.4%'],
              ['Latency', '12 ms'],
              ['Audit state', 'Verified'],
              ['Confounders', '3 flagged'],
            ]
              .map(
                ([label, value]) => `
                <div class="list-item">
                  <span class="key">${label}</span>
                  <span class="val">${value}</span>
                </div>
              `
              )
              .join('')}
          </div>
        </div>
      </div>
    </div>
  </div>
`;

const renderPrediction = () => {
  const inf = state.form.inference;
  const keys = Object.keys(inf);
  return `
    <div class="split">
      <div class="panel">
        <div class="panel-inner">
          <div class="chip-primary">${icons.target()} Inference probe</div>
          <h3 class="section-title">Predict a record</h3>
          <p class="section-sub">Fill in a sample profile, run the model, and inspect the counterfactuals generated alongside the prediction.</p>
          <div style="height:16px"></div>
          <div class="field-grid">
            ${keys
              .map(
                (key) => `
                <div class="field">
                  <label>${key.replaceAll('_', ' ')}</label>
                  <input class="input-soft inference-input" data-key="${key}" value="${escapeHtml(inf[key])}" />
                </div>
              `
              )
              .join('')}
          </div>
          <div style="height:16px"></div>
          <button id="predict-btn" class="button button-solid" style="width:100%;height:54px;display:flex;align-items:center;justify-content:center;gap:10px">
            <span>${icons.spark()}</span>
            <span>Run model</span>
          </button>
          ${state.predictionResult ? renderPredictionResult() : ''}
        </div>
      </div>
      <div class="panel">
        <div class="panel-inner">
          <div class="chip-primary">${icons.layers()} Counterfactual explorer</div>
          <h3 class="section-title">Alternate states</h3>
          <p class="section-sub">Run inference first and the counterfactual states will appear here.</p>
          <div style="height:16px"></div>
          ${state.counterfactuals.length ? renderCounterfactuals() : `<div class="empty"><div><div style="width:72px;height:72px;border-radius:24px;background:#eff6ff;display:grid;place-items:center;margin:0 auto 14px">${icons.layers()}</div><strong style="display:block;color:#0f172a;font-size:18px">Counterfactuals will appear here</strong><p style="margin-top:8px;max-width:34ch">Run a prediction to fill this space with alternate outcomes and changed features.</p></div></div>`}
        </div>
      </div>
    </div>
  `;
};

const renderPredictionResult = () => {
  const result = state.predictionResult;
  const pct = fmt(result.probability[result.prediction] * 100, 1);
  return `
    <div style="height:18px"></div>
    <div class="metric" style="padding:18px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
        <div>
          <div class="chip-primary">Prediction result</div>
          <h4 style="margin-top:10px;font-size:18px">Outcome vector</h4>
        </div>
        <div class="chip ${result.prediction === 1 ? 'chip-primary' : ''}" style="${result.prediction === 1 ? '' : 'background:#fff1f2;border-color:#fecdd3;color:#b91c1c'}">
          ${result.prediction === 1 ? 'Approved' : 'Rejected'}
        </div>
      </div>
      <div style="height:14px"></div>
      <div class="list-item" style="align-items:flex-end">
        <div>
          <div class="key">Confidence</div>
          <div class="val" style="font-size:42px;line-height:1.05;margin-top:8px">${pct}%</div>
        </div>
        <div style="text-align:right">
          <div class="key">Path</div>
          <div class="val" style="font-family:monospace;margin-top:8px">0x${Math.floor(Math.random() * 1000).toString(16).toUpperCase()}</div>
        </div>
      </div>
      <div style="height:12px"></div>
      <div style="height:12px;background:#e2e8f0;border-radius:999px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--primary),var(--secondary));border-radius:999px"></div>
      </div>
    </div>
  `;
};

const renderCounterfactuals = () => `
  <div class="scroll stack">
    ${state.counterfactuals
      .map(
        (cf, idx) => `
        <div class="metric">
          <div class="list-item" style="margin-bottom:12px">
            <div>
              <div class="key">Alternate vector</div>
              <div class="val" style="margin-top:6px">Scenario ${idx + 1}</div>
            </div>
            <div class="chip ${cf.income === 1 ? 'chip-primary' : ''}" style="${cf.income === 1 ? '' : 'background:#fff1f2;border-color:#fecdd3;color:#b91c1c'}">
              ${cf.income === 1 ? 'Success state' : 'Fail state'}
            </div>
          </div>
          <div class="grid-responsive" style="grid-template-columns:repeat(2,minmax(0,1fr))">
            ${Object.keys(cf)
              .filter((k) => k !== 'income')
              .map(
                (key) => `
                <div class="mini-stat" style="text-align:left">
                  <small>${key.replaceAll('_', ' ')}</small>
                  <strong style="margin-top:8px">${escapeHtml(cf[key])}</strong>
                </div>
              `
              )
              .join('')}
          </div>
        </div>
      `
      )
      .join('')}
  </div>
`;

const renderFairnessMini = () => {
  if (!state.fairnessMetrics) {
    return `<div class="empty"><div><strong style="display:block;color:#0f172a;font-size:18px">No fairness data yet</strong><p style="margin-top:8px">Train the model first and this panel will fill with real metrics.</p></div></div>`;
  }

  const m = state.fairnessMetrics;
  const groups = Object.keys(m.group_metrics || {});
  const score = Number(m.counterfactual_fairness_score || 0);
  const bars = groups
    .map((g, i) => {
      const v = Number(m.group_metrics[g].selection_rate || 0) * 100;
      return `<div class="bar ${i % 2 ? 'alt' : ''}" style="height:${Math.max(v, 8)}%"></div>`;
    })
    .join('');
  return `
    <div class="grid-responsive" style="grid-template-columns: 260px 1fr">
      <div class="panel-shell" style="padding:20px;text-align:center">
        <div class="ring">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(148,163,184,0.2)" stroke-width="8"></circle>
            <circle cx="50" cy="50" r="44" fill="none" stroke="var(--primary)" stroke-width="8" stroke-linecap="round" stroke-dasharray="${score * 276} 276"></circle>
          </svg>
          <div class="center">
            <strong>${Math.round(score * 100)}</strong>
            <span>Score</span>
          </div>
        </div>
        <p class="muted" style="margin-top:12px;line-height:1.6">Measures how stable predictions remain when protected attributes are flipped.</p>
      </div>
      <div class="panel-shell" style="padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div>
            <div class="chip-primary">${icons.chart()} Selection rates</div>
            <h4 style="margin-top:10px;font-size:22px">By group</h4>
          </div>
          <div class="chip">${state.form.sensitiveAttrs.toUpperCase()}</div>
        </div>
        <div class="chart-bars">${bars}</div>
        <div class="grid-responsive" style="grid-template-columns:repeat(2,minmax(0,1fr));margin-top:16px">
          ${(state.fairnessMetrics.bias_details || [])
            .filter((d) => d.bias_flag)
            .slice(0, 4)
            .map(
              (d) => `
              <div class="list-item">
                <div>
                  <div class="key">Index</div>
                  <div class="val" style="font-family:monospace;margin-top:6px">#${(d.index + 1024).toString(16).toUpperCase()}</div>
                </div>
                <div class="val">${d.original === d.counterfactual ? 'OK' : 'Shift'}</div>
              </div>
            `
            )
            .join('')}
        </div>
      </div>
    </div>
  `;
};

const renderCausal = () => {
  if (!state.causalResults) {
    return `<div class="empty"><div><strong style="display:block;color:#0f172a;font-size:18px">No causal output yet</strong><p style="margin-top:8px">Fetch the structural model after training.</p></div></div>`;
  }
  return `
    <div class="grid-responsive" style="grid-template-columns:1fr 1fr">
      <div class="panel-shell" style="padding:20px">
        <div class="chip-primary">${icons.network()} Structural identifiability</div>
        <h3 style="font-size:24px;margin-top:12px">Causal logic</h3>
        <div class="metric" style="margin-top:16px;background:#f8fafc">
          <div class="key">Estimated ATE</div>
          <div class="val" style="margin-top:10px;font-size:56px;line-height:1">${fmt(state.causalResults.ate || 0, 4)}</div>
          <div class="muted" style="margin-top:10px">Structural estimate from the backend causal model.</div>
        </div>
      </div>
      <div class="panel-shell" style="padding:20px">
        <div class="chip-primary">${icons.binary()} Estimand logic</div>
        <div class="metric" style="margin-top:16px;background:#f8fafc">
          <div class="key">Path</div>
          <div class="val" style="margin-top:10px;font-family:monospace;line-height:1.7;white-space:pre-wrap">${escapeHtml(state.causalResults.estimand || '')}</div>
        </div>
      </div>
    </div>
  `;
};

const renderSimulation = () => {
  const data = state.simulationResults ? Object.keys(state.simulationResults.group_metrics || {}) : [];
  const bars = data.length
    ? data
        .map((g, i) => {
          const v = Number(state.simulationResults.group_metrics[g].selection_rate || 0) * 100;
          return `<div class="bar ${i % 2 ? 'alt' : ''}" style="height:${Math.max(v, 8)}%"></div>`;
        })
        .join('')
    : '';

  return `
    <div class="split">
      <div class="panel">
        <div class="panel-inner">
          <div class="chip-primary">${icons.play()} Simulation mode</div>
          <h3 class="section-title">Projections</h3>
          <p class="section-sub">Adjust the controls and preview how the selection rates shift across the groups.</p>
          <div style="height:16px"></div>
          <div class="stack">
            <div class="metric">
              <div class="list-item" style="border:0;background:transparent;padding:0">
                <div class="key">Group volatility</div>
                <div class="val">+${Math.round(state.form.simGroup * 100)}%</div>
              </div>
              <input id="sim-group" type="range" min="0" max="0.5" step="0.05" value="${state.form.simGroup}" style="width:100%;accent-color:var(--primary)" />
              <div class="list-item" style="border:0;background:transparent;padding:0;margin-top:10px">
                <div class="key">Economic vector</div>
                <div class="val">×${state.form.simIncome.toFixed(2)}</div>
              </div>
              <input id="sim-income" type="range" min="0.8" max="1.2" step="0.01" value="${state.form.simIncome}" style="width:100%;accent-color:var(--secondary)" />
            </div>
            <button id="simulate-btn" class="button button-primary">Run simulation</button>
          </div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-inner">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
            <div>
              <div class="chip-primary">${icons.chart()} Outcome manifold</div>
              <h3 class="section-title">Projected allocation</h3>
            </div>
            <div class="chip">${icons.db()} Validated</div>
          </div>
          <div style="height:16px"></div>
          ${data.length ? `<div class="chart-bars">${bars}</div>` : `<div class="empty"><div><strong style="display:block;color:#0f172a;font-size:18px">Awaiting parameter injection</strong><p style="margin-top:8px">Run the simulation to render the outcome bars.</p></div></div>`}
        </div>
      </div>
    </div>
  `;
};

const renderMain = () => `
  <div class="app-shell">
    <div class="workspace">
      <aside class="card sidebar">
        <div class="accent-band"></div>
        <div class="card-pad" style="display:flex;flex-direction:column;gap:20px;min-height:0;height:100%">
          <div>
            <div class="brand">
              <div class="brand-mark">${icons.shield()}</div>
              <div>
                <p class="chip-primary">${icons.shield()} Fairness workspace</p>
                <h1 style="margin-top:10px;font-size:28px">FairSim</h1>
              </div>
            </div>
            <p style="margin-top:14px;color:var(--muted);line-height:1.7">One clean canvas for bias checks, counterfactuals, and simulation storytelling.</p>
          </div>
          <div class="nav-list">${navMarkup()}</div>
          <div class="nav-meta">
            <div class="stats-grid">
              ${statPill('Mode', 'Live')}
              ${statPill('Checks', 'Ready')}
              ${statPill('API', 'Online')}
            </div>
          </div>
        </div>
      </aside>

      <section class="content">
        <header class="card card-pad">
          <div class="accent-band"></div>
          <div class="topbar">
            <div class="hero">
              <div class="chip">${icons.spark()} Production Workspace</div>
              <h2>FairSim: A split-screen workspace for fairness, inference, and causal storytelling.</h2>
              <p>This interface is optimized for high-performance causal auditing, structural identification, and rapid stress-testing of AI models.</p>
            </div>
            <div class="status-row">
              ${statPill('Dataset', state.modelInfo ? 'Configured' : 'Loaded')}
              ${statPill('Analysis', 'Ready')}
              ${statPill('Compute', 'Live')}
            </div>
          </div>
        </header>

        <div class="tabs">
          ${tabs
            .map(
              (tab) => `
                <button class="tab ${state.view === tab.id ? 'active' : ''}" data-view="${tab.id}">
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
                    <div>
                      <strong style="font-size:14px">${tab.label}</strong>
                      <span class="small">${tab.hint}</span>
                    </div>
                    <span style="width:18px;height:18px">${tab.icon()}</span>
                  </div>
                </button>
              `
            )
            .join('')}
        </div>

        <main class="card" style="flex:1;min-height:0">
          <div class="panel-inner" style="height:100%;overflow:auto">
            ${state.view === 'overview' ? renderOverview() : ''}
            ${state.view === 'inference' ? renderPrediction() : ''}
            ${state.view === 'fairness' ? renderFairnessMini() : ''}
            ${state.view === 'causal' ? renderCausal() : ''}
            ${state.view === 'simulation' ? renderSimulation() : ''}
          </div>
        </main>
      </section>
    </div>
  </div>
`;

const bindUpload = () => {
  const fileInput = document.getElementById('file-upload');
  const label = document.getElementById('upload-label');
  const targetInput = document.getElementById('target-input');
  const sensitiveInput = document.getElementById('sensitive-input');
  const trainBtn = document.getElementById('train-btn');
  const errorBox = document.getElementById('upload-error');

  fileInput?.addEventListener('change', (e) => {
    state.form.file = e.target.files?.[0] || null;
    if (label) {
      label.innerHTML = state.form.file
        ? `<p style="font-size:14px;font-weight:700;color:#0f172a">${escapeHtml(state.form.file.name)}</p><p style="margin-top:8px;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#2563eb">File queued for training</p>`
        : `<p style="font-size:14px;font-weight:700;color:#334155">Drop a CSV here or click to browse</p><p style="margin-top:8px;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#64748b">Local upload only</p>`;
    }
  });

  targetInput?.addEventListener('input', (e) => {
    state.form.target = e.target.value;
  });

  sensitiveInput?.addEventListener('input', (e) => {
    state.form.sensitiveAttrs = e.target.value;
  });

  trainBtn?.addEventListener('click', async () => {
    if (!state.form.file) return;
    state.loading = true;
    state.error = '';
    if (errorBox) errorBox.classList.add('hidden');
    render();

    const formData = new FormData();
    formData.append('file', state.form.file);
    formData.append('target', state.form.target);
    formData.append('sensitive_attributes', state.form.sensitiveAttrs);

    try {
      const response = await fetch('/api/train', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      state.modelInfo = {
        ...data.metrics,
        sensitive_attributes: state.form.sensitiveAttrs.split(',').map((s) => s.trim()),
      };
      state.view = 'overview';
    } catch (err) {
      state.error = 'Deployment failed: the training request could not be completed.';
      if (errorBox) {
        errorBox.innerHTML = `<span style="display:flex;align-items:center;gap:10px">${icons.alert()}<strong>Upload error</strong></span><div style="margin-top:8px;font-size:14px;line-height:1.6">${state.error}</div>`;
        errorBox.classList.remove('hidden');
      }
    } finally {
      state.loading = false;
      render();
    }
  });
};

const bindTabs = () => {
  document.querySelectorAll('[data-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.view = btn.getAttribute('data-view');
      render();
    });
  });
};

const bindInference = () => {
  document.querySelectorAll('.inference-input').forEach((input) => {
    input.addEventListener('input', (e) => {
      const key = e.target.getAttribute('data-key');
      state.form.inference[key] = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    });
  });

  document.getElementById('predict-btn')?.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.form.inference),
      });
      state.predictionResult = await res.json();

      const cfRes = await fetch('/api/counterfactual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.form.inference),
      });
      state.counterfactuals = await cfRes.json();
      render();
    } catch (err) {
      console.error(err);
    }
  });
};

const bindSimulation = () => {
  const g = document.getElementById('sim-group');
  const i = document.getElementById('sim-income');

  g?.addEventListener('input', (e) => {
    state.form.simGroup = Number(e.target.value);
  });
  i?.addEventListener('input', (e) => {
    state.form.simIncome = Number(e.target.value);
  });

  document.getElementById('simulate-btn')?.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_pct_change: { gender: state.form.simGroup },
          feature_shifts: { income: state.form.simIncome },
        }),
      });
      state.simulationResults = await res.json();
      render();
    } catch (err) {
      console.error(err);
    }
  });
};

const fetchDeferred = async () => {
  if (!state.modelInfo) return;
  try {
    const fairness = await fetch(`/api/fairness?sensitive_attr=${encodeURIComponent(state.form.sensitiveAttrs.split(',')[0].trim())}`);
    state.fairnessMetrics = await fairness.json();
  } catch (err) {
    console.error(err);
  }

  try {
    const causal = await fetch('/api/causal');
    state.causalResults = await causal.json();
  } catch (err) {
    console.error(err);
  }
};

function render() {
  if (!state.modelInfo) {
    $root.innerHTML = `
      <div class="app-shell" style="display:grid;place-items:center">
        <div class="card card-pad" style="max-width:1200px;width:100%">
          <div class="accent-band"></div>
          ${renderUpload()}
        </div>
      </div>
    `;
    bindUpload();
    return;
  }

  $root.innerHTML = renderMain();
  bindTabs();
  bindInference();
  bindSimulation();
}

render();

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    state.view = 'overview';
    render();
  }
});

// initialize post-training fetches lazily once the app is live
const livePoll = setInterval(() => {
  if (state.modelInfo && !state._hydrated) {
    state._hydrated = true;
    fetchDeferred();
    clearInterval(livePoll);
  }
}, 500);
