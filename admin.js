/* ============================================================
   admin.js — Admin Panel Logic
   BIM Construction Tracking System
   Add / Edit / Delete elements in Firestore
   ============================================================ */

// ── FIREBASE CONFIG ──────────────────────────────────────────
// Same config as app.js — paste here too
const firebaseConfig = {
  apiKey:            "PASTE_YOUR_API_KEY",
  authDomain:        "PASTE_YOUR_AUTH_DOMAIN",
  projectId:         "PASTE_YOUR_PROJECT_ID",
  storageBucket:     "PASTE_YOUR_STORAGE_BUCKET",
  messagingSenderId: "PASTE_YOUR_MESSAGING_SENDER_ID",
  appId:             "PASTE_YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ── STATE ───────────────────────────────────────────────────
let currentElementId = null;  // ID being edited
let logEntries       = [];
let deliveries       = [];
let issues           = [];
let phases           = [];
let carbonDesign     = [];
let carbonActual     = [];
let costItems        = [];
let photos           = [];
let related          = [];

// ── INIT ─────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  loadElementList();
  setupFormButtons();
  initDefaultPhases();
  initDefaultCarbon();
  initDefaultCost();
});

// ── LOAD ELEMENT LIST ────────────────────────────────────────
function loadElementList() {
  const list = document.getElementById("element-list");
  list.innerHTML = `<p style="color:#888;font-size:12px;font-style:italic;">Loading elements...</p>`;

  db.collection("elements").orderBy("elementId")
    .onSnapshot(snap => {
      if (snap.empty) {
        list.innerHTML = `<p style="color:#888;font-size:12px;font-style:italic;">No elements in database. Add one using the form below.</p>`;
        return;
      }
      list.innerHTML = snap.docs.map(doc => {
        const d = doc.data();
        const statusCls = (d.constructionStatus || "").toLowerCase().includes("complete") ? "ok" : "pending";
        return `<div class="element-list-item" onclick="loadElement('${doc.id}')">
          <div>
            <div class="eli-id">${d.elementId || doc.id}</div>
            <div class="eli-name">${d.elementType || ""} — ${d.projectName || ""} — ${d.gridRef || ""}</div>
          </div>
          <div>
            <div class="eli-status ${statusCls}">${d.constructionStatus || "—"}</div>
            <div style="font-size:10px;color:#888;margin-top:2px;">Updated: ${d.lastUpdated || "—"}</div>
          </div>
        </div>`;
      }).join("");
    }, err => {
      list.innerHTML = `<p style="color:#8b1a1a;font-size:12px;">Error loading elements: ${err.message}</p>`;
    });
}

// ── LOAD ELEMENT INTO FORM ───────────────────────────────────
async function loadElement(docId) {
  showAlert("Loading element data...", "info");
  currentElementId = docId;

  try {
    const doc = await db.collection("elements").doc(docId).get();
    if (!doc.exists) { showAlert("Element not found.", "error"); return; }
    const d = doc.data();

    // Simple fields
    const fields = [
      "companyName","projectName","docRef","revision","issueStatus","issueDate",
      "preparedBy","designStandard","elementId","elementType","gridRef","level",
      "span","orientation","concreteGrade","fck","steelGrade","fyk",
      "width","depth","concreteVolume","steelWeight","steelDensity","formworkArea",
      "bendingMoment","shearForce","bottomBars","topBars","hangerBars",
      "stirrupsSupport","stirrupsSpan","deflectionActual","deflectionAllow",
      "deflectionRatio","structuralNotes","constructionStatus","currentActivity",
      "progressPercent","lastUpdated","updatedBy","shearNote",
      "slumpTest","cube7day","cube28day","testLab","cubeSamples","qaApprovalStatus",
      "revitElementId","bimFile","modelSyncStatus","lastSynced","structuralSoftware",
      "liveUrl","costTotal","costNote","carbonDesignTotal","carbonActualTotal",
      "carbonComparison","relatedElementsText","photoUrls","generalNotes"
    ];
    fields.forEach(f => {
      const el = document.getElementById("f-" + f);
      if (el) el.value = d[f] || "";
    });

    // Dynamic arrays
    logEntries   = d.constructionLog || [];
    deliveries   = d.deliveries      || [];
    issues       = d.issues          || [];
    phases       = d.phases          || [];
    carbonDesign = d.carbonDesign    || [];
    carbonActual = d.carbonActual    || [];
    costItems    = d.costItems       || [];
    photos       = d.photos          || [];
    related      = d.relatedElements || [];

    renderLogEntries();
    renderDeliveries();
    renderIssues();
    renderPhases();
    renderCarbonDesign();
    renderCarbonActual();
    renderCostItems();

    document.getElementById("form-title").textContent = `Editing: ${d.elementId || docId}`;
    document.getElementById("delete-btn").style.display = "inline-block";
    document.getElementById("view-btn").href = `index.html?id=${docId}`;
    document.getElementById("view-btn").style.display = "inline-block";

    // Scroll to form
    document.getElementById("edit-form").scrollIntoView({ behavior: "smooth" });
    showAlert(`Element "${d.elementId}" loaded. Make your changes and click Save.`, "info");

  } catch (err) {
    showAlert("Error loading element: " + err.message, "error");
  }
}

// ── SAVE ELEMENT ─────────────────────────────────────────────
async function saveElement() {
  const getId = (id) => {
    const el = document.getElementById("f-" + id);
    return el ? el.value.trim() : "";
  };

  const docId = getId("elementId") || currentElementId;
  if (!docId) { showAlert("Element ID is required.", "error"); return; }

  const data = {
    companyName: getId("companyName"),
    projectName: getId("projectName"),
    docRef:      getId("docRef"),
    revision:    getId("revision"),
    issueStatus: getId("issueStatus"),
    issueDate:   getId("issueDate"),
    preparedBy:  getId("preparedBy"),
    designStandard: getId("designStandard"),
    elementId:   getId("elementId"),
    elementType: getId("elementType"),
    gridRef:     getId("gridRef"),
    level:       getId("level"),
    span:        getId("span"),
    orientation: getId("orientation"),
    concreteGrade:  getId("concreteGrade"),
    fck:            getId("fck"),
    steelGrade:     getId("steelGrade"),
    fyk:            getId("fyk"),
    width:          getId("width"),
    depth:          getId("depth"),
    concreteVolume: getId("concreteVolume"),
    steelWeight:    getId("steelWeight"),
    steelDensity:   getId("steelDensity"),
    formworkArea:   getId("formworkArea"),
    bendingMoment:  getId("bendingMoment"),
    shearForce:     getId("shearForce"),
    bottomBars:     getId("bottomBars"),
    topBars:        getId("topBars"),
    hangerBars:     getId("hangerBars"),
    stirrupsSupport: getId("stirrupsSupport"),
    stirrupsSpan:    getId("stirrupsSpan"),
    deflectionActual: getId("deflectionActual"),
    deflectionAllow:  getId("deflectionAllow"),
    deflectionRatio:  getId("deflectionRatio"),
    structuralNotes:  getId("structuralNotes"),
    constructionStatus: getId("constructionStatus"),
    currentActivity:    getId("currentActivity"),
    progressPercent:    getId("progressPercent"),
    lastUpdated:        new Date().toLocaleString("en-GB", { dateStyle:"long", timeStyle:"short" }),
    updatedBy:          getId("updatedBy"),
    shearNote:          getId("shearNote"),
    slumpTest:          getId("slumpTest"),
    cube7day:           getId("cube7day"),
    cube28day:          getId("cube28day"),
    testLab:            getId("testLab"),
    cubeSamples:        getId("cubeSamples"),
    qaApprovalStatus:   getId("qaApprovalStatus"),
    revitElementId:     getId("revitElementId"),
    bimFile:            getId("bimFile"),
    modelSyncStatus:    getId("modelSyncStatus"),
    lastSynced:         getId("lastSynced"),
    structuralSoftware: getId("structuralSoftware"),
    liveUrl:            getId("liveUrl"),
    costTotal:          getId("costTotal"),
    costNote:           getId("costNote"),
    carbonDesignTotal:  getId("carbonDesignTotal"),
    carbonActualTotal:  getId("carbonActualTotal"),
    carbonComparison:   getId("carbonComparison"),
    generalNotes:       getId("generalNotes"),
    constructionLog:    logEntries,
    deliveries:         deliveries,
    issues:             issues,
    phases:             phases,
    carbonDesign:       carbonDesign,
    carbonActual:       carbonActual,
    costItems:          costItems,
    photos:             photos,
    relatedElements:    related,
    _savedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    await db.collection("elements").doc(docId).set(data, { merge: true });
    currentElementId = docId;
    showAlert(`Element "${docId}" saved successfully. The element page will update automatically.`, "success");
    document.getElementById("delete-btn").style.display = "inline-block";
    document.getElementById("view-btn").href = `index.html?id=${docId}`;
    document.getElementById("view-btn").style.display = "inline-block";
  } catch (err) {
    showAlert("Error saving: " + err.message, "error");
  }
}

// ── DELETE ELEMENT ────────────────────────────────────────────
async function deleteElement() {
  if (!currentElementId) return;
  if (!confirm(`Delete element "${currentElementId}"? This cannot be undone.`)) return;
  try {
    await db.collection("elements").doc(currentElementId).delete();
    showAlert(`Element "${currentElementId}" deleted.`, "success");
    clearForm();
  } catch (err) {
    showAlert("Error deleting: " + err.message, "error");
  }
}

// ── CLEAR FORM ────────────────────────────────────────────────
function clearForm() {
  currentElementId = null;
  document.querySelectorAll("#edit-form input, #edit-form textarea, #edit-form select")
    .forEach(el => { el.value = ""; });
  logEntries = []; deliveries = []; issues = [];
  phases = []; carbonDesign = []; carbonActual = [];
  costItems = []; photos = []; related = [];
  renderLogEntries(); renderDeliveries(); renderIssues();
  renderPhases(); renderCarbonDesign(); renderCarbonActual(); renderCostItems();
  document.getElementById("form-title").textContent = "Add / Edit Element";
  document.getElementById("delete-btn").style.display = "none";
  document.getElementById("view-btn").style.display = "none";
  initDefaultPhases();
  initDefaultCarbon();
  initDefaultCost();
  showAlert("Form cleared. Ready to add a new element.", "info");
}

// ── CONSTRUCTION LOG ──────────────────────────────────────────
function addLogEntry() {
  logEntries.push({ date: "", activity: "", description: "", recordedBy: "", status: "Complete" });
  renderLogEntries();
}
function removeLogEntry(i) { logEntries.splice(i, 1); renderLogEntries(); }
function updateLogEntry(i, field, val) { logEntries[i][field] = val; }
function renderLogEntries() {
  const wrap = document.getElementById("log-entries");
  wrap.innerHTML = logEntries.map((e, i) => `
    <div class="log-entry-row">
      <input type="text" placeholder="Date (e.g. 22 Apr 2026)" value="${e.date}" oninput="updateLogEntry(${i},'date',this.value)" />
      <input type="text" placeholder="Activity" value="${e.activity}" oninput="updateLogEntry(${i},'activity',this.value)" />
      <input type="text" placeholder="Description" value="${e.description}" oninput="updateLogEntry(${i},'description',this.value)" />
      <button class="btn btn-danger" onclick="removeLogEntry(${i})">Remove</button>
    </div>
    <div class="log-entry-row" style="grid-template-columns:1fr 1fr;margin-top:-4px;">
      <input type="text" placeholder="Recorded by" value="${e.recordedBy}" oninput="updateLogEntry(${i},'recordedBy',this.value)" />
      <select oninput="updateLogEntry(${i},'status',this.value)">
        ${["Complete","In Progress","Upcoming","Pending"].map(s => `<option ${e.status===s?"selected":""}>${s}</option>`).join("")}
      </select>
    </div>`
  ).join("<hr style='border:none;border-top:1px dashed #ccc;margin:6px 0;'>");
}

// ── DELIVERIES ────────────────────────────────────────────────
function addDelivery() {
  deliveries.push({ material:"", supplier:"", batchId:"", quantity:"", date:"", status:"Delivered" });
  renderDeliveries();
}
function removeDelivery(i) { deliveries.splice(i, 1); renderDeliveries(); }
function updateDelivery(i, f, v) { deliveries[i][f] = v; }
function renderDeliveries() {
  const wrap = document.getElementById("delivery-entries");
  wrap.innerHTML = deliveries.map((d, i) => `
    <div class="log-entry-row" style="grid-template-columns:1fr 1fr 1fr auto;">
      <input type="text" placeholder="Material" value="${d.material}" oninput="updateDelivery(${i},'material',this.value)" />
      <input type="text" placeholder="Supplier" value="${d.supplier}" oninput="updateDelivery(${i},'supplier',this.value)" />
      <input type="text" placeholder="Batch ID" value="${d.batchId}" oninput="updateDelivery(${i},'batchId',this.value)" />
      <button class="btn btn-danger" onclick="removeDelivery(${i})">Remove</button>
    </div>
    <div class="log-entry-row" style="grid-template-columns:1fr 1fr 1fr;margin-top:-4px;">
      <input type="text" placeholder="Quantity" value="${d.quantity}" oninput="updateDelivery(${i},'quantity',this.value)" />
      <input type="text" placeholder="Date" value="${d.date}" oninput="updateDelivery(${i},'date',this.value)" />
      <input type="text" placeholder="Status" value="${d.status}" oninput="updateDelivery(${i},'status',this.value)" />
    </div>`
  ).join("<hr style='border:none;border-top:1px dashed #ccc;margin:6px 0;'>");
}

// ── ISSUES ────────────────────────────────────────────────────
function addIssue() {
  const n = issues.length + 1;
  issues.push({ id:`ISS-00${n}`, title:"", identified:"", description:"", action:"", standard:"", status:"Open" });
  renderIssues();
}
function removeIssue(i) { issues.splice(i, 1); renderIssues(); }
function updateIssue(i, f, v) { issues[i][f] = v; }
function renderIssues() {
  const wrap = document.getElementById("issue-entries");
  wrap.innerHTML = issues.map((iss, i) => `
    <div style="border:1px solid #ccc;padding:10px;margin-bottom:8px;background:#fffbf0;">
      <div class="log-entry-row" style="grid-template-columns:auto 2fr 1fr auto;">
        <input type="text" placeholder="Issue ID" value="${iss.id}" oninput="updateIssue(${i},'id',this.value)" style="width:80px;" />
        <input type="text" placeholder="Title / short description" value="${iss.title}" oninput="updateIssue(${i},'title',this.value)" />
        <select oninput="updateIssue(${i},'status',this.value)">
          ${["Open","Resolved"].map(s=>`<option ${iss.status===s?"selected":""}>${s}</option>`).join("")}
        </select>
        <button class="btn btn-danger" onclick="removeIssue(${i})">Remove</button>
      </div>
      <div class="form-grid" style="margin-top:6px;">
        <div class="form-group"><label>Identified (date and by)</label><input type="text" value="${iss.identified}" oninput="updateIssue(${i},'identified',this.value)" /></div>
        <div class="form-group"><label>Standard reference</label><input type="text" value="${iss.standard}" oninput="updateIssue(${i},'standard',this.value)" /></div>
        <div class="form-group form-full"><label>Description</label><textarea oninput="updateIssue(${i},'description',this.value)">${iss.description}</textarea></div>
        <div class="form-group form-full"><label>Action taken</label><textarea oninput="updateIssue(${i},'action',this.value)">${iss.action}</textarea></div>
      </div>
    </div>`
  ).join("");
}

// ── PHASES ────────────────────────────────────────────────────
function initDefaultPhases() {
  if (phases.length) return;
  phases = [
    { num:"01", phase:"Substructure and Setting Out", description:"Survey check of column positions and pad levels. Grid lines confirmed against datum.", standard:"BS 5606", approvedBy:"Site Engineer", date:"—", status:"Pending" },
    { num:"02", phase:"Formwork Design and Erection", description:"Formwork designed for hydrostatic pressure of C35/45 concrete. Props and soffit inspected before rebar.", standard:"BS EN 13670", approvedBy:"Temp. Works Eng.", date:"—", status:"Pending" },
    { num:"03", phase:"Rebar Delivery and Inspection", description:"B500C steel delivered with mill certificates. Weights verified against BIM schedule.", standard:"BS 4449:2005", approvedBy:"Site Engineer", date:"—", status:"Pending" },
    { num:"04", phase:"Reinforcement Fixing", description:"Bottom, top and link bars placed per IFC drawings. Cover spacers checked. Cage signed off before pour.", standard:"EN 1992-1-1", approvedBy:"Site Eng. and Foreman", date:"—", status:"Pending" },
    { num:"05", phase:"Pre-Pour Inspection", description:"Full inspection of formwork, rebar, cover and spacers. Checklist signed off. Green light issued for pour.", standard:"BS EN 13670", approvedBy:"Lead Struct. Eng.", date:"—", status:"Pending" },
    { num:"06", phase:"Concrete Supply and Pour", description:"Ready-mix concrete supplied and placed. Slump test checked. Vibrated at 300 mm intervals.", standard:"BS EN 206", approvedBy:"Site Engineer", date:"—", status:"Pending" },
    { num:"07", phase:"Concrete Testing and QA", description:"Cube samples taken during pour and sent to UKAS lab. Striking not permitted until 28-day strength confirmed.", standard:"BS EN 12390", approvedBy:"QA Manager", date:"—", status:"Pending" },
    { num:"08", phase:"Curing", description:"Polythene sheeting applied. Minimum 7 days curing above 5 degrees. No striking during curing period.", standard:"BS EN 13670 S8", approvedBy:"Site Engineer", date:"—", status:"Pending" },
    { num:"09", phase:"Formwork Striking", description:"Props retained until cube strength confirmed. Written approval required before any props removed.", standard:"EN 1992-1-1 S7.4", approvedBy:"Lead Struct. Eng.", date:"—", status:"On Hold" },
    { num:"10", phase:"Final Inspection and Handover", description:"Beam inspected. As-built checked against BIM model. Revit model updated and signed off.", standard:"ISO 19650", approvedBy:"BIM Manager", date:"—", status:"On Hold" },
  ];
  renderPhases();
}
function updatePhase(i, f, v) { phases[i][f] = v; }
function renderPhases() {
  const wrap = document.getElementById("phase-entries");
  wrap.innerHTML = phases.map((p, i) => `
    <div style="border:1px solid #ccc;padding:8px;margin-bottom:6px;background:#f8f8f8;display:grid;grid-template-columns:40px 1fr 1fr 1fr 1fr;gap:6px;align-items:center;">
      <input type="text" value="${p.num}" oninput="updatePhase(${i},'num',this.value)" style="width:36px;" />
      <input type="text" placeholder="Phase name" value="${p.phase}" oninput="updatePhase(${i},'phase',this.value)" />
      <input type="text" placeholder="Standard" value="${p.standard}" oninput="updatePhase(${i},'standard',this.value)" />
      <input type="text" placeholder="Approved by" value="${p.approvedBy}" oninput="updatePhase(${i},'approvedBy',this.value)" />
      <div style="display:flex;gap:4px;">
        <input type="text" placeholder="Date" value="${p.date}" oninput="updatePhase(${i},'date',this.value)" style="flex:1;" />
        <select oninput="updatePhase(${i},'status',this.value)" style="flex:1;">
          ${["Approved","Pending","On Hold"].map(s=>`<option ${p.status===s?"selected":""}>${s}</option>`).join("")}
        </select>
      </div>
    </div>
    <div style="padding:0 8px 8px;margin-top:-6px;">
      <input type="text" placeholder="Phase description" value="${p.description}" oninput="updatePhase(${i},'description',this.value)" style="width:100%;border:1px solid #ccc;padding:5px 8px;font-size:12px;" />
    </div>`
  ).join("");
}

// ── CARBON TABLES ─────────────────────────────────────────────
function initDefaultCarbon() {
  if (carbonDesign.length && carbonActual.length) return;
  carbonDesign = [
    { material:"Concrete C35/45", qty:"5.99", unit:"m3", factor:"310 kgCO2e/m3", total:"1,856.90" },
    { material:"Steel B500C (rebar)", qty:"1,206.99", unit:"kg", factor:"1.99 kgCO2e/kg", total:"2,401.91" },
    { material:"Formwork (plywood)", qty:"35.66", unit:"m2", factor:"14.5 kgCO2e/m2", total:"517.07" },
  ];
  carbonActual = [
    { material:"Concrete C35/45", qty:"5.99", unit:"m3", factor:"295 kgCO2e/m3", total:"1,767.05" },
    { material:"Steel B500C (rebar)", qty:"1,206.99", unit:"kg", factor:"1.85 kgCO2e/kg", total:"2,232.93" },
    { material:"Formwork (plywood)", qty:"35.66", unit:"m2", factor:"13.2 kgCO2e/m2", total:"470.71" },
  ];
  renderCarbonDesign(); renderCarbonActual();
}
function addCarbonDesign() { carbonDesign.push({material:"",qty:"",unit:"",factor:"",total:""}); renderCarbonDesign(); }
function removeCarbonDesign(i) { carbonDesign.splice(i,1); renderCarbonDesign(); }
function updateCarbonDesign(i,f,v) { carbonDesign[i][f]=v; }
function renderCarbonDesign() {
  const wrap = document.getElementById("carbon-design-entries");
  wrap.innerHTML = carbonDesign.map((r,i) => `
    <div class="log-entry-row" style="grid-template-columns:2fr 1fr 1fr 1fr 1fr auto;">
      <input type="text" placeholder="Material" value="${r.material}" oninput="updateCarbonDesign(${i},'material',this.value)"/>
      <input type="text" placeholder="Qty" value="${r.qty}" oninput="updateCarbonDesign(${i},'qty',this.value)"/>
      <input type="text" placeholder="Unit" value="${r.unit}" oninput="updateCarbonDesign(${i},'unit',this.value)"/>
      <input type="text" placeholder="Factor" value="${r.factor}" oninput="updateCarbonDesign(${i},'factor',this.value)"/>
      <input type="text" placeholder="Total CO2e" value="${r.total}" oninput="updateCarbonDesign(${i},'total',this.value)"/>
      <button class="btn btn-danger" onclick="removeCarbonDesign(${i})">X</button>
    </div>`).join("");
}
function addCarbonActual() { carbonActual.push({material:"",qty:"",unit:"",factor:"",total:""}); renderCarbonActual(); }
function removeCarbonActual(i) { carbonActual.splice(i,1); renderCarbonActual(); }
function updateCarbonActual(i,f,v) { carbonActual[i][f]=v; }
function renderCarbonActual() {
  const wrap = document.getElementById("carbon-actual-entries");
  wrap.innerHTML = carbonActual.map((r,i) => `
    <div class="log-entry-row" style="grid-template-columns:2fr 1fr 1fr 1fr 1fr auto;">
      <input type="text" placeholder="Material" value="${r.material}" oninput="updateCarbonActual(${i},'material',this.value)"/>
      <input type="text" placeholder="Qty" value="${r.qty}" oninput="updateCarbonActual(${i},'qty',this.value)"/>
      <input type="text" placeholder="Unit" value="${r.unit}" oninput="updateCarbonActual(${i},'unit',this.value)"/>
      <input type="text" placeholder="Factor" value="${r.factor}" oninput="updateCarbonActual(${i},'factor',this.value)"/>
      <input type="text" placeholder="Total CO2e" value="${r.total}" oninput="updateCarbonActual(${i},'total',this.value)"/>
      <button class="btn btn-danger" onclick="removeCarbonActual(${i})">X</button>
    </div>`).join("");
}

// ── COST ITEMS ────────────────────────────────────────────────
function initDefaultCost() {
  if (costItems.length) return;
  costItems = [
    { desc:"Ready-Mix Concrete C35/45", qty:"5.99", unit:"m3", supply:"118.00/m3", labour:"38.00/m3", total:"933.44" },
    { desc:"Steel Reinforcement B500C", qty:"1,206.99", unit:"kg", supply:"0.95/kg", labour:"0.48/kg", total:"1,726.00" },
    { desc:"Formwork — Supply, Erect and Strike", qty:"35.66", unit:"m2", supply:"32.00/m2", labour:"19.00/m2", total:"1,818.66" },
    { desc:"Concrete Testing and QA — UKAS lab", qty:"1", unit:"item", supply:"155.00", labour:"—", total:"155.00" },
    { desc:"Site Management and Supervision (5%)", qty:"—", unit:"%", supply:"5%", labour:"—", total:"231.66" },
  ];
  renderCostItems();
}
function addCostItem() { costItems.push({desc:"",qty:"",unit:"",supply:"",labour:"",total:""}); renderCostItems(); }
function removeCostItem(i) { costItems.splice(i,1); renderCostItems(); }
function updateCostItem(i,f,v) { costItems[i][f]=v; }
function renderCostItems() {
  const wrap = document.getElementById("cost-entries");
  wrap.innerHTML = costItems.map((r,i) => `
    <div class="log-entry-row" style="grid-template-columns:3fr 1fr 1fr 1fr 1fr 1fr auto;">
      <input type="text" placeholder="Description" value="${r.desc}" oninput="updateCostItem(${i},'desc',this.value)"/>
      <input type="text" placeholder="Qty" value="${r.qty}" oninput="updateCostItem(${i},'qty',this.value)"/>
      <input type="text" placeholder="Unit" value="${r.unit}" oninput="updateCostItem(${i},'unit',this.value)"/>
      <input type="text" placeholder="Supply rate" value="${r.supply}" oninput="updateCostItem(${i},'supply',this.value)"/>
      <input type="text" placeholder="Labour rate" value="${r.labour}" oninput="updateCostItem(${i},'labour',this.value)"/>
      <input type="text" placeholder="Total" value="${r.total}" oninput="updateCostItem(${i},'total',this.value)"/>
      <button class="btn btn-danger" onclick="removeCostItem(${i})">X</button>
    </div>`).join("");
}

// ── BUTTON WIRING ─────────────────────────────────────────────
function setupFormButtons() {
  document.getElementById("save-btn")  ?.addEventListener("click", saveElement);
  document.getElementById("clear-btn") ?.addEventListener("click", clearForm);
  document.getElementById("delete-btn")?.addEventListener("click", deleteElement);
}

// ── ALERT ─────────────────────────────────────────────────────
function showAlert(msg, type="info") {
  const el = document.getElementById("admin-alert");
  if (!el) return;
  el.textContent = msg;
  el.className = `alert alert-${type}`;
  el.style.display = "block";
  if (type === "success") setTimeout(() => { el.style.display = "none"; }, 5000);
}

// ── SEED SAMPLE DATA ──────────────────────────────────────────
// Call this once to pre-populate 3 sample elements in Firestore
async function seedSampleData() {
  const samples = [
    {
      elementId:"B145", elementType:"RC Beam", companyName:"Group 1 — BIM and Digital Construction",
      projectName:"Lakeside Arts: Pavilion Expansion", docRef:"LAP-BIM-STR-B145-DS-001",
      revision:"P1", issueStatus:"Issued for Construction", issueDate:"22 Apr 2026",
      preparedBy:"Group 1", designStandard:"EN 1992-1-1 (EC2) — EN ISO 19650",
      gridRef:"C/4 - C/6, Level 01", level:"Level 01 (+4.200 m)", span:"12.8228 m",
      orientation:"East to West", concreteGrade:"C35/45", fck:"35.00 MPa",
      steelGrade:"B500C", fyk:"500.00 MPa", width:"400 mm", depth:"1100 mm",
      concreteVolume:"5.99 m3", steelWeight:"1,206.99 kg", steelDensity:"201.36 kg/m3",
      formworkArea:"35.66 m2", bendingMoment:"1,470.14 kN.m", shearForce:"945.24 kN",
      bottomBars:"8 phi25 (As = 3928 mm2)", topBars:"12 phi25 (As = 5892 mm2)",
      hangerBars:"4 phi10", stirrupsSupport:"4 legs phi10 @ 125 mm",
      stirrupsSpan:"4 legs phi10 @ 300 mm", deflectionActual:"20 mm",
      deflectionAllow:"51 mm", deflectionRatio:"0.39 - PASS",
      constructionStatus:"In Progress - Curing", currentActivity:"Concrete curing — polythene sheet protection",
      progressPercent:"65", lastUpdated:"22 Apr 2026, 16:00", updatedBy:"Site Engineer - Group 1",
      slumpTest:"80 mm (S3 class) — Pass", cube7day:"26.4 MPa (awaiting lab confirmation)",
      cube28day:"Pending — due 20 May 2026", testLab:"UKAS-accredited laboratory, Nottingham",
      cubeSamples:"4 cubes taken during pour", qaApprovalStatus:"Pending 28-day cube result",
      revitElementId:"Beam - 145 (LAP-STR-L01)", bimFile:"Expansion after editing (Recovered).RTD",
      modelSyncStatus:"Up to date", lastSynced:"22 Apr 2026, 14:35",
      structuralSoftware:"Robot Structural Analysis 2026",
      liveUrl:"https://as1959117-dot.github.io/Beam-145-/",
      costTotal:"4,864.76", carbonDesignTotal:"4,775.88", carbonActualTotal:"4,470.69",
      carbonComparison:"Carbon reduction of 305.19 kgCO2e (6.4% below design estimate). Reduction attributed to lower-carbon concrete mix and recycled-content B500C rebar. Emission factors from ICE Database v3.0.",
    },
    {
      elementId:"C12", elementType:"RC Column", companyName:"Group 1 — BIM and Digital Construction",
      projectName:"Lakeside Arts: Pavilion Expansion", docRef:"LAP-BIM-STR-C12-DS-001",
      revision:"P1", issueStatus:"Issued for Construction", issueDate:"15 Apr 2026",
      preparedBy:"Group 1", designStandard:"EN 1992-1-1 (EC2) — EN ISO 19650",
      gridRef:"C/4, Level 00 to Level 01", level:"Level 00 (Ground) to Level 01 (+4.200 m)",
      span:"4.200 m (height)", orientation:"Vertical", concreteGrade:"C35/45",
      fck:"35.00 MPa", steelGrade:"B500C", fyk:"500.00 MPa",
      width:"400 mm", depth:"400 mm", concreteVolume:"0.67 m3",
      steelWeight:"98.40 kg", steelDensity:"146.87 kg/m3",
      formworkArea:"6.72 m2", bendingMoment:"—", shearForce:"—",
      bottomBars:"8 phi16 (longitudinal)", topBars:"8 phi16 (longitudinal)",
      hangerBars:"—", stirrupsSupport:"phi8 links @ 200 mm",
      stirrupsSpan:"phi8 links @ 300 mm",
      constructionStatus:"Completed", currentActivity:"Column cast and cured — above element under construction",
      progressPercent:"100", lastUpdated:"10 Apr 2026, 10:30", updatedBy:"Site Engineer - Group 1",
      slumpTest:"75 mm (S3 class) — Pass", cube7day:"27.1 MPa",
      cube28day:"38.4 MPa — Pass", testLab:"UKAS-accredited laboratory, Nottingham",
      cubeSamples:"4 cubes", qaApprovalStatus:"Approved — 28-day result confirmed",
    },
    {
      elementId:"S05", elementType:"RC Slab", companyName:"Group 1 — BIM and Digital Construction",
      projectName:"Lakeside Arts: Pavilion Expansion", docRef:"LAP-BIM-STR-S05-DS-001",
      revision:"P0", issueStatus:"For Review", issueDate:"22 Apr 2026",
      preparedBy:"Group 1", designStandard:"EN 1992-1-1 (EC2) — EN ISO 19650",
      gridRef:"C/4 to C/6 — D/4 to D/6, Level 01", level:"Level 01 (+4.200 m)",
      span:"5.50 x 4.80 m", orientation:"Horizontal", concreteGrade:"C32/40",
      fck:"32.00 MPa", steelGrade:"B500B", fyk:"500.00 MPa",
      width:"5500 mm", depth:"200 mm",
      constructionStatus:"Not started — awaiting beam curing completion",
      currentActivity:"Waiting for Beam 145 and Column C12 curing sign-off",
      progressPercent:"0", lastUpdated:"22 Apr 2026, 09:00", updatedBy:"BIM Manager - Group 1",
    },
  ];
  for (const s of samples) {
    await db.collection("elements").doc(s.elementId).set(s, { merge: true });
    console.log("Seeded:", s.elementId);
  }
  showAlert("3 sample elements seeded to Firestore: B145, C12, S05", "success");
}
