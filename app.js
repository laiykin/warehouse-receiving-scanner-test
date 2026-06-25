const STORAGE_KEY = "install-label-printer-v2";

const templates = {
  "avery-5164": {
    id: "avery-5164",
    name: "Avery 5164 / 8164",
    note: "6 labels per sheet, 4 in x 3 1/3 in",
    columns: 2,
    rows: 3,
    labelWidth: "4in",
    labelHeight: "3.333in",
    marginTop: "0.5in",
    marginX: "0.156in",
    gapX: "0.188in",
    gapY: "0in",
    density: "roomy",
  },
  "avery-5163": {
    id: "avery-5163",
    name: "Avery 5163 / 8163",
    note: "10 labels per sheet, 4 in x 2 in",
    columns: 2,
    rows: 5,
    labelWidth: "4in",
    labelHeight: "2in",
    marginTop: "0.5in",
    marginX: "0.156in",
    gapX: "0.188in",
    gapY: "0in",
    density: "compact",
  },
};

const defaultDistricts = [
  { id: "61", name: "61", color: "#00a7c8" },
  { id: "103", name: "103", color: "#f0b429" },
  { id: "184", name: "184", color: "#7c55d9" },
  { id: "288", name: "288", color: "#f26d4f" },
];

const emptyDraft = {
  customerName: "",
  jobNumber: "",
  installDate: "",
  districtId: "61",
  labelCount: 1,
};

let state = loadState();
let toastTimer = null;

const root = document.getElementById("app-root");
const toastEl = document.getElementById("toast");

render();

root.addEventListener("input", handleInput);
root.addEventListener("change", handleChange);
root.addEventListener("submit", handleSubmit);
root.addEventListener("click", handleClick);

function loadState() {
  const fallback = {
    draft: { ...emptyDraft },
    jobs: [],
    districts: defaultDistricts,
    settings: {
      templateId: "avery-5164",
      startPosition: 1,
      showSequence: true,
      showDistrictName: true,
    },
  };

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved) return fallback;

    const districts = Array.isArray(saved.districts) && saved.districts.length ? saved.districts : defaultDistricts;
    const validDistrictId = districts.some((district) => district.id === saved.draft?.districtId)
      ? saved.draft.districtId
      : districts[0].id;

    return {
      draft: {
        ...emptyDraft,
        ...(saved.draft || {}),
        districtId: validDistrictId,
        labelCount: clampNumber(saved.draft?.labelCount, 1, 99, 1),
      },
      jobs: Array.isArray(saved.jobs) ? saved.jobs.map(normalizeJob).filter(Boolean) : [],
      districts,
      settings: {
        templateId: templates[saved.settings?.templateId] ? saved.settings.templateId : "avery-5164",
        startPosition: clampNumber(saved.settings?.startPosition, 1, 30, 1),
        showSequence: saved.settings?.showSequence !== false,
        showDistrictName: saved.settings?.showDistrictName !== false,
      },
    };
  } catch {
    return fallback;
  }
}

function normalizeJob(job) {
  if (!job || typeof job !== "object") return null;
  return {
    id: String(job.id || createId()),
    customerName: String(job.customerName || "").trim(),
    jobNumber: String(job.jobNumber || "").trim(),
    installDate: String(job.installDate || "").trim(),
    districtId: String(job.districtId || "61"),
    labelCount: clampNumber(job.labelCount, 1, 99, 1),
    createdAt: String(job.createdAt || new Date().toISOString()),
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  const template = getTemplate();
  const activeDistrict = getDistrict(state.draft.districtId);
  const labels = getPrintableLabels();
  const totalLabels = labels.filter(Boolean).length;

  root.innerHTML = `
    <div class="app-shell">
      <header class="app-header screen-only">
        <div>
          <h1>Install Label Printer</h1>
          <p>Enter the Salesforce job details once, choose the district color, then print the number of labels needed for that job.</p>
        </div>
        <div class="header-actions">
          <button class="secondary-button" type="button" data-action="sample-job">Sample job</button>
          <button class="primary-button" type="button" data-action="print">Print labels</button>
        </div>
      </header>

      <main class="app-grid">
        <section class="entry-panel screen-only" aria-label="Job label entry">
          <form class="job-form" id="job-form">
            <div class="form-heading">
              <div>
                <h2>Job label</h2>
                <p>Keep this close to the Salesforce entry routine.</p>
              </div>
              <span class="district-chip" style="--chip-color: ${escapeAttribute(activeDistrict.color)}">
                <span aria-hidden="true"></span>${escapeHtml(activeDistrict.name)}
              </span>
            </div>

            ${textField("Customer name", "customerName", state.draft.customerName, "Muniz Caraballo", "text", true)}
            ${textField("Job #", "jobNumber", state.draft.jobNumber, "CO / job number", "text", true)}
            ${textField("Install date", "installDate", state.draft.installDate, "MM/DD/YYYY or leave blank", "text", false)}

            <div class="field">
              <label for="labelCount">Labels needed</label>
              <div class="stepper-row">
                <button class="step-button" type="button" data-action="step-labels" data-step="-1" aria-label="Decrease labels">−</button>
                <input id="labelCount" name="labelCount" type="number" min="1" max="99" inputmode="numeric" value="${state.draft.labelCount}" />
                <button class="step-button" type="button" data-action="step-labels" data-step="1" aria-label="Increase labels">+</button>
              </div>
            </div>

            <div class="field">
              <span class="field-label">District</span>
              <div class="district-picker" role="radiogroup" aria-label="District color">
                ${state.districts.map(renderDistrictButton).join("")}
              </div>
            </div>

            <div class="button-row">
              <button class="primary-button" type="submit">Add to print queue</button>
              <button class="secondary-button" type="button" data-action="add-print">Add and print</button>
            </div>
          </form>

          <div class="settings-panel">
            <div class="section-title">
              <h2>Print setup</h2>
              <p>${escapeHtml(template.note)}</p>
            </div>

            <label class="field" for="templateId">
              <span>Label sheet</span>
              <select id="templateId" name="templateId" data-setting="templateId">
                ${Object.values(templates).map((item) => `<option value="${item.id}" ${item.id === template.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
              </select>
            </label>

            <label class="field" for="startPosition">
              <span>Start at label position</span>
              <input id="startPosition" name="startPosition" data-setting="startPosition" type="number" min="1" max="${template.columns * template.rows}" value="${state.settings.startPosition}" />
            </label>

            <label class="check-row">
              <input type="checkbox" data-setting="showSequence" ${state.settings.showSequence ? "checked" : ""} />
              <span>Print label count, like 1 of 4</span>
            </label>

            <label class="check-row">
              <input type="checkbox" data-setting="showDistrictName" ${state.settings.showDistrictName ? "checked" : ""} />
              <span>Print district name on label</span>
            </label>
          </div>

          <div class="district-admin">
            <div class="section-title">
              <h2>District colors</h2>
              <p>Edit these names and colors to match your actual districts.</p>
            </div>
            <div class="district-editor">
              ${state.districts.map(renderDistrictEditorRow).join("")}
            </div>
            <button class="secondary-button" type="button" data-action="add-district">Add district</button>
          </div>
        </section>

        <section class="queue-panel screen-only" aria-label="Print queue">
          <div class="section-title">
            <h2>Print queue</h2>
            <p>${state.jobs.length ? `${state.jobs.length} job${state.jobs.length === 1 ? "" : "s"} / ${totalLabels} label${totalLabels === 1 ? "" : "s"}` : "No jobs queued. The preview uses the form above until you add a job."}</p>
          </div>

          <div class="queue-list">
            ${state.jobs.length ? state.jobs.map(renderJobRow).join("") : renderEmptyQueue()}
          </div>

          <div class="queue-actions">
            <button class="secondary-button" type="button" data-action="clear-queue" ${state.jobs.length ? "" : "disabled"}>Clear queue</button>
            <button class="primary-button" type="button" data-action="print">Print labels</button>
          </div>
        </section>

        <section class="preview-panel" aria-label="Printable label preview">
          <div class="preview-toolbar screen-only">
            <div>
              <h2>Print preview</h2>
              <p>${escapeHtml(template.name)} · ${totalLabels || state.draft.labelCount} label${(totalLabels || state.draft.labelCount) === 1 ? "" : "s"}</p>
            </div>
            <button class="primary-button" type="button" data-action="print">Print</button>
          </div>
          <div class="print-stage">
            <div class="print-output" id="print-output">
              ${renderSheets(labels, template)}
            </div>
          </div>
        </section>
      </main>
    </div>
  `;
}

function textField(label, name, value, placeholder, type = "text", required = false) {
  return `
    <label class="field" for="${name}">
      <span>${label}</span>
      <input id="${name}" name="${name}" type="${type}" value="${escapeAttribute(value)}" placeholder="${escapeAttribute(placeholder)}" ${required ? "required" : ""} autocomplete="off" />
    </label>
  `;
}

function renderDistrictButton(district) {
  const checked = district.id === state.draft.districtId;
  return `
    <button class="district-button ${checked ? "active" : ""}" type="button" data-action="select-district" data-id="${escapeAttribute(district.id)}" role="radio" aria-checked="${checked}" style="--district-color: ${escapeAttribute(district.color)}">
      <span aria-hidden="true"></span>
      ${escapeHtml(district.name)}
    </button>
  `;
}

function renderDistrictEditorRow(district) {
  return `
    <div class="district-editor-row" data-district-id="${escapeAttribute(district.id)}">
      <input class="district-color-input" type="color" value="${escapeAttribute(district.color)}" data-district-field="color" aria-label="${escapeAttribute(district.name)} color" />
      <input type="text" value="${escapeAttribute(district.name)}" data-district-field="name" aria-label="District name" />
      <button class="icon-button" type="button" data-action="remove-district" data-id="${escapeAttribute(district.id)}" aria-label="Remove ${escapeAttribute(district.name)}">×</button>
    </div>
  `;
}

function renderJobRow(job) {
  const district = getDistrict(job.districtId);
  return `
    <article class="queue-row" style="--row-color: ${escapeAttribute(district.color)}">
      <div class="queue-color" aria-hidden="true"></div>
      <div>
        <strong>${escapeHtml(job.customerName)}</strong>
        <span>${escapeHtml(job.jobNumber)} · ${escapeHtml(district.name)}${job.installDate ? ` · ${escapeHtml(job.installDate)}` : ""}</span>
      </div>
      <div class="queue-count">${job.labelCount}</div>
      <button class="icon-button" type="button" data-action="duplicate-job" data-id="${escapeAttribute(job.id)}" aria-label="Duplicate job">⧉</button>
      <button class="icon-button" type="button" data-action="remove-job" data-id="${escapeAttribute(job.id)}" aria-label="Remove job">×</button>
    </article>
  `;
}

function renderEmptyQueue() {
  return `
    <div class="empty-state">
      <strong>Ready for the first job.</strong>
      <span>Fill out the form, set how many labels are needed, then add it to the queue.</span>
    </div>
  `;
}

function renderSheets(labels, template) {
  const labelsPerPage = template.columns * template.rows;
  const startBlanks = Math.max(0, state.settings.startPosition - 1);
  const printable = [...Array(startBlanks).fill(null), ...labels];
  const minimumSlots = printable.length ? Math.ceil(printable.length / labelsPerPage) * labelsPerPage : labelsPerPage;

  while (printable.length < minimumSlots) printable.push(null);

  return chunk(printable, labelsPerPage)
    .map((pageLabels, pageIndex) => {
      const slots = pageLabels.map((label) => (label ? renderLabel(label, template) : `<div class="label-card label-blank" aria-hidden="true"></div>`)).join("");
      return `
        <section class="sheet ${template.density}" data-template="${escapeAttribute(template.id)}" style="${sheetStyle(template)}" aria-label="Label sheet ${pageIndex + 1}">
          ${slots}
        </section>
      `;
    })
    .join("");
}

function renderLabel(label, template) {
  const district = getDistrict(label.districtId);
  const hasDate = Boolean(label.installDate);
  const compact = template.density === "compact";

  return `
    <article class="label-card ${compact ? "label-compact" : ""}" style="--label-color: ${escapeAttribute(district.color)}">
      <div class="label-stripe" aria-hidden="true"></div>
      <div class="label-main">
        <div class="label-box customer-box">
          <span>Customer name</span>
          <strong>${escapeHtml(label.customerName || " ")}</strong>
        </div>
        <div class="label-box">
          <span>Job #</span>
          <strong>${escapeHtml(label.jobNumber || " ")}</strong>
        </div>
        <div class="label-date-grid">
          <div class="label-box">
            <span>Install date</span>
            <strong class="${hasDate ? "" : "handwrite-line"}">${hasDate ? escapeHtml(label.installDate) : "&nbsp;"}</strong>
          </div>
          <div class="label-box">
            <span>Received</span>
            <strong class="handwrite-line">&nbsp;</strong>
          </div>
        </div>
        <div class="complete-line">
          <span class="print-checkbox" aria-hidden="true"></span>
          <strong>Job is fully received and scheduled</strong>
        </div>
      </div>
      <aside class="label-side">
        <h2>Job Ready<br />For Install</h2>
        ${state.settings.showDistrictName ? `<div class="district-band">${escapeHtml(district.name)}</div>` : ""}
        <div class="count-stack">
          <span>Labels</span>
          <strong>${state.settings.showSequence ? `${label.sequence} of ${label.totalForJob}` : label.totalForJob}</strong>
        </div>
        <div class="service-mark">Home Services</div>
      </aside>
    </article>
  `;
}

function sheetStyle(template) {
  return [
    `--sheet-cols: ${template.columns}`,
    `--label-w: ${template.labelWidth}`,
    `--label-h: ${template.labelHeight}`,
    `--sheet-margin-top: ${template.marginTop}`,
    `--sheet-margin-x: ${template.marginX}`,
    `--sheet-gap-x: ${template.gapX}`,
    `--sheet-gap-y: ${template.gapY}`,
  ].join("; ");
}

function getPrintableLabels() {
  const jobs = state.jobs.length ? state.jobs : getDraftPreviewJobs();
  return jobs.flatMap((job) =>
    Array.from({ length: job.labelCount }, (_, index) => ({
      ...job,
      sequence: index + 1,
      totalForJob: job.labelCount,
    })),
  );
}

function getDraftPreviewJobs() {
  const hasContent = state.draft.customerName.trim() || state.draft.jobNumber.trim();
  if (!hasContent) return [];
  return [
    {
      id: "preview",
      customerName: state.draft.customerName.trim(),
      jobNumber: state.draft.jobNumber.trim(),
      installDate: state.draft.installDate.trim(),
      districtId: state.draft.districtId,
      labelCount: clampNumber(state.draft.labelCount, 1, 99, 1),
    },
  ];
}

function handleInput(event) {
  const target = event.target;

  if (target.matches("[name='customerName'], [name='jobNumber'], [name='installDate']")) {
    const selectionStart = target.selectionStart;
    const selectionEnd = target.selectionEnd;
    state.draft[target.name] = target.value;
    saveState();
    render();
    restoreFocus(target.name, selectionStart, selectionEnd);
    return;
  }

  if (target.name === "labelCount") {
    const selectionStart = target.selectionStart;
    const selectionEnd = target.selectionEnd;
    state.draft.labelCount = clampNumber(target.value, 1, 99, 1);
    saveState();
    render();
    restoreFocus("labelCount", selectionStart, selectionEnd);
    return;
  }

  if (target.dataset.districtField) {
    const row = target.closest("[data-district-id]");
    updateDistrict(row?.dataset.districtId, target.dataset.districtField, target.value, false);
  }
}

function handleChange(event) {
  const target = event.target;

  if (target.dataset.setting) {
    const key = target.dataset.setting;
    if (target.type === "checkbox") {
      state.settings[key] = target.checked;
    } else if (key === "startPosition") {
      const template = getTemplate();
      state.settings.startPosition = clampNumber(target.value, 1, template.columns * template.rows, 1);
    } else {
      state.settings[key] = target.value;
      if (key === "templateId") {
        const template = templates[target.value];
        state.settings.startPosition = clampNumber(state.settings.startPosition, 1, template.columns * template.rows, 1);
      }
    }
    saveState();
    render();
  }

  if (target.dataset.districtField) {
    const row = target.closest("[data-district-id]");
    updateDistrict(row?.dataset.districtId, target.dataset.districtField, target.value, true);
  }
}

function handleSubmit(event) {
  event.preventDefault();
  addDraftToQueue();
}

function handleClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const action = button.dataset.action;

  if (action === "select-district") {
    state.draft.districtId = button.dataset.id;
    saveState();
    render();
  }

  if (action === "step-labels") {
    const step = Number(button.dataset.step || 0);
    state.draft.labelCount = clampNumber(state.draft.labelCount + step, 1, 99, 1);
    saveState();
    render();
  }

  if (action === "add-print") {
    if (addDraftToQueue()) setTimeout(printLabels, 80);
  }

  if (action === "print") {
    printLabels();
  }

  if (action === "clear-queue") {
    state.jobs = [];
    saveState();
    render();
    showToast("Print queue cleared.");
  }

  if (action === "remove-job") {
    state.jobs = state.jobs.filter((job) => job.id !== button.dataset.id);
    saveState();
    render();
  }

  if (action === "duplicate-job") {
    const job = state.jobs.find((item) => item.id === button.dataset.id);
    if (job) {
      state.jobs.push({ ...job, id: createId(), createdAt: new Date().toISOString() });
      saveState();
      render();
    }
  }

  if (action === "add-district") {
    const id = createDistrictId("district");
    state.districts.push({ id, name: "New district", color: "#3b82f6" });
    state.draft.districtId = id;
    saveState();
    render();
  }

  if (action === "remove-district") {
    if (state.districts.length <= 1) {
      showToast("Keep at least one district.");
      return;
    }
    const id = button.dataset.id;
    state.districts = state.districts.filter((district) => district.id !== id);
    if (state.draft.districtId === id) state.draft.districtId = state.districts[0].id;
    state.jobs = state.jobs.map((job) => (job.districtId === id ? { ...job, districtId: state.districts[0].id } : job));
    saveState();
    render();
  }

  if (action === "sample-job") {
    state.draft = {
      customerName: "Sample Customer",
      jobNumber: "CO-123456",
      installDate: "",
      districtId: state.districts[0].id,
      labelCount: 4,
    };
    saveState();
    render();
    showToast("Sample job loaded.");
  }
}

function addDraftToQueue() {
  const customerName = state.draft.customerName.trim();
  const jobNumber = state.draft.jobNumber.trim();

  if (!customerName || !jobNumber) {
    showToast("Customer name and job # are required.");
    return false;
  }

  state.jobs.push({
    id: createId(),
    customerName,
    jobNumber,
    installDate: state.draft.installDate.trim(),
    districtId: state.draft.districtId,
    labelCount: clampNumber(state.draft.labelCount, 1, 99, 1),
    createdAt: new Date().toISOString(),
  });

  state.draft = {
    ...emptyDraft,
    districtId: state.draft.districtId,
  };

  saveState();
  render();
  showToast("Job added to print queue.");
  return true;
}

function printLabels() {
  const hasJobs = state.jobs.length || getDraftPreviewJobs().length;
  if (!hasJobs) {
    showToast("Add a job before printing.");
    return;
  }

  window.print();
}

function updateDistrict(id, field, value, shouldRender = true) {
  const district = state.districts.find((item) => item.id === id);
  if (!district) return;

  if (field === "name") {
    district.name = value.trim() || "District";
  }

  if (field === "color") {
    district.color = value;
  }

  saveState();
  if (shouldRender) render();
}

function getTemplate() {
  return templates[state.settings.templateId] || templates["avery-5164"];
}

function getDistrict(id) {
  return state.districts.find((district) => district.id === id) || state.districts[0] || defaultDistricts[0];
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks.length ? chunks : [[]];
}

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createDistrictId(base) {
  let index = state.districts.length + 1;
  let id = `${base}-${index}`;
  while (state.districts.some((district) => district.id === id)) {
    index += 1;
    id = `${base}-${index}`;
  }
  return id;
}

function restoreFocus(name, selectionStart = null, selectionEnd = null) {
  requestAnimationFrame(() => {
    const input = root.querySelector(`[name="${CSS.escape(name)}"]`);
    if (!input) return;
    input.focus();
    if (typeof input.selectionStart === "number") {
      const end = input.value.length;
      const start = selectionStart === null ? end : Math.min(selectionStart, end);
      const finish = selectionEnd === null ? start : Math.min(selectionEnd, end);
      input.setSelectionRange(start, finish);
    }
  });
}

function showToast(message) {
  clearTimeout(toastTimer);
  toastEl.textContent = message;
  toastEl.classList.add("show");
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2400);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("./sw.js").catch((error) => console.warn("Service worker registration failed", error));
}
