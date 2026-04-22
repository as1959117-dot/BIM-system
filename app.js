/* ============================================================
   app.js — Element Datasheet Page Logic
   BIM Construction Tracking System
   Reads element ID from URL → fetches live data from Firebase
   Updates the page automatically when data changes in admin
   ============================================================ */

// ── FIREBASE CONFIGURATION ──────────────────────────────────
// Paste your Firebase project config here.
// Get it from: Firebase Console → Project Settings → Your Apps → SDK setup
const firebaseConfig = {
  apiKey:            "PASTE_YOUR_API_KEY",
  authDomain:        "PASTE_YOUR_AUTH_DOMAIN",
  projectId:         "PASTE_YOUR_PROJECT_ID",
  storageBucket:     "PASTE_YOUR_STORAGE_BUCKET",
  messagingSenderId: "PASTE_YOUR_MESSAGING_SENDER_ID",
  appId:             "PASTE_YOUR_APP_ID"
};

// ── FIREBASE INITIALISATION ──────────────────────────────────
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ── GET ELEMENT ID FROM URL ──────────────────────────────────
// URL format: index.html?id=B145
const params = new URLSearchParams(window.location.search);
const elementId = params.get("id");

// ── MAIN INIT ───────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  if (!elementId) {
    showError("No element ID found in URL. Please use index.html?id=B145");
    return;
  }

  // Generate QR code for this page URL
  generateQR();

  // Subscribe to live Firestore updates
  // This listener fires immediately with current data, then again on any change
  db.collection("elements").doc(elementId)
    .onSnapshot(
      (doc) => {
        if (doc.exists) {
          populatePage(doc.data());
          hideLoading();
        } else {
          showError(`Element "${elementId}" not found in the database. Check the ID and try again.`);
        }
      },
      (err) => {
        console.error("Firestore error:", err);
        showError("Unable to connect to the database. Check your Firebase configuration.");
      }
    );
});

// ── GENERATE QR CODE ─────────────────────────────────────────
function generateQR() {
  const qrEl = document.getElementById("qr-canvas");
  if (!qrEl || typeof QRCode === "undefined") return;
  const url = window.location.href;
  new QRCode(qrEl, {
    text: url,
    width: 76,
    height: 76,
    colorDark: "#1a3a6b",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });
}

// ── POPULATE PAGE WITH ELEMENT DATA ─────────────────────────
function populatePage(d) {
  // Helper: safely set text content
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val || "—";
  };
  const setHTML = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = val || "—";
  };

  // ── Header / title block
  document.title = `${d.elementId || elementId} — ${d.projectName || "BIM Data Sheet"}`;
  set("hdr-company",   d.companyName   || "—");
  set("hdr-project",   d.projectName   || "—");
  set("hdr-docref",    d.docRef        || "—");
  set("hdr-rev",       d.revision      || "—");
  set("hdr-status",    d.issueStatus   || "—");
  set("title-element", `${d.elementType || "Element"} ${d.elementId || elementId}`);
  set("title-sub",     `${d.projectName || ""} — ${d.designStandard || "EN 1992-1-1 (EC2)"}`);
  set("title-date",    `Prepared by: ${d.preparedBy || "—"} — Date: ${d.issueDate || "—"}`);

  // ── Meta row
  set("meta-project",  d.projectName   || "—");
  set("meta-id",       d.elementId     || elementId);
  set("meta-grid",     d.gridRef       || "—");
  set("meta-span",     d.span          || "—");

  // ── Live status
  set("ls-status",     d.constructionStatus  || "—");
  set("ls-activity",   d.currentActivity     || "—");
  set("ls-updated",    d.lastUpdated         || "—");
  set("ls-updatedby",  d.updatedBy           || "—");

  const progress = parseInt(d.progressPercent) || 0;
  const progFill = document.getElementById("prog-fill");
  const progPct  = document.getElementById("prog-pct");
  if (progFill) progFill.style.width = progress + "%";
  if (progPct)  progPct.textContent  = `${progress}% Complete`;

  // Colour code the status value
  const lsStatusEl = document.getElementById("ls-status");
  if (lsStatusEl) {
    lsStatusEl.className = "ls-val";
    const s = (d.constructionStatus || "").toLowerCase();
    if (s.includes("complete") || s.includes("approved")) lsStatusEl.classList.add("ok");
    else if (s.includes("hold") || s.includes("stop"))    lsStatusEl.classList.add("onhold");
    else                                                   lsStatusEl.classList.add("pending");
  }

  // ── Technical data
  set("td-concrete",    d.concreteGrade    || "—");
  set("td-fck",         d.fck              || "—");
  set("td-steel",       d.steelGrade       || "—");
  set("td-fyk",         d.fyk              || "—");
  set("td-width",       d.width            || "—");
  set("td-depth",       d.depth            || "—");
  set("td-spanlen",     d.span             || "—");
  set("td-volume",      d.concreteVolume   || "—");
  set("td-steelwt",     d.steelWeight      || "—");
  set("td-density",     d.steelDensity     || "—");
  set("td-formwork",    d.formworkArea     || "—");
  set("td-moment",      d.bendingMoment    || "—");
  set("td-shear",       d.shearForce       || "—");
  set("td-bottombar",   d.bottomBars       || "—");
  set("td-topbar",      d.topBars          || "—");
  set("td-hangers",     d.hangerBars       || "—");
  set("td-stir-sup",    d.stirrupsSupport  || "—");
  set("td-stir-span",   d.stirrupsSpan     || "—");
  set("td-deflection",  d.deflectionActual || "—");
  set("td-defl-allow",  d.deflectionAllow  || "—");
  set("td-defl-ratio",  d.deflectionRatio  || "—");
  set("td-notes",       d.structuralNotes  || "—");

  // ── BIM integration
  set("bim-revit-id",   d.revitElementId   || "—");
  set("bim-file",       d.bimFile          || "—");
  set("bim-sync",       d.modelSyncStatus  || "—");
  set("bim-syncdate",   d.lastSynced       || "—");
  set("bim-analysis",   d.structuralSoftware || "—");
  const bimLink = document.getElementById("bim-live-link");
  if (bimLink && d.liveUrl) {
    bimLink.href = d.liveUrl;
    bimLink.textContent = d.liveUrl;
  }

  // ── QA / compliance
  set("qa-slump",       d.slumpTest        || "—");
  set("qa-7day",        d.cube7day         || "—");
  set("qa-28day",       d.cube28day        || "—");
  set("qa-lab",         d.testLab          || "—");
  set("qa-samples",     d.cubeSamples      || "—");
  set("qa-status",      d.qaApprovalStatus || "—");

  // ── Deflection check boxes
  set("comp-defl-val",   (d.deflectionActual || "—") + " vs " + (d.deflectionAllow || "—") + " allowable");
  set("comp-defl-ratio", (d.deflectionRatio  || "—"));
  set("comp-shear-val",  d.shearForce        || "—");
  set("comp-shear-note", d.shearNote         || "Shear links provided — verify against design drawings.");

  // ── Cost table
  buildCostTable(d);

  // ── Carbon tables
  buildCarbonTables(d);

  // ── Construction log
  buildLogTable(d.constructionLog || []);

  // ── Material deliveries
  buildDeliveryTable(d.deliveries || []);

  // ── Issues
  buildIssueList(d.issues || []);

  // ── Construction phases
  buildPhaseTable(d.phases || []);

  // ── Photos
  buildPhotoGrid(d.photos || []);

  // ── Related elements
  buildRelatedElements(d.relatedElements || []);

  // ── Footer
  set("footer-id",  d.docRef    || "—");
  set("footer-rev", d.revision  || "—");
  set("footer-date", d.issueDate || "—");
  set("footer-grp",  d.preparedBy || "—");
}

// ── BUILD COST TABLE ─────────────────────────────────────────
function buildCostTable(d) {
  const tbody = document.getElementById("cost-tbody");
  if (!tbody) return;
  const items = d.costItems || [
    { desc: "Ready-Mix Concrete " + (d.concreteGrade || "C35/45"), qty: d.concreteVolume || "—", unit: "m3", supply: "—", labour: "—", total: "—" },
    { desc: "Steel Reinforcement " + (d.steelGrade || "B500C"),   qty: d.steelWeight    || "—", unit: "kg", supply: "—", labour: "—", total: "—" },
    { desc: "Formwork — Supply, Erect and Strike",                  qty: d.formworkArea   || "—", unit: "m2", supply: "—", labour: "—", total: "—" },
  ];
  tbody.innerHTML = items.map(r => `
    <tr>
      <td>${r.desc}</td>
      <td style="text-align:center">${r.qty}</td>
      <td style="text-align:center">${r.unit}</td>
      <td style="text-align:center">${r.supply}</td>
      <td style="text-align:center">${r.labour}</td>
      <td style="text-align:center"><b>${r.total}</b></td>
    </tr>`).join("");

  set("cost-total", d.costTotal || "—");
  set("cost-note",  d.costNote  || "Source: BCIS regional rates. Excludes preliminaries, overheads and profit.");
}

// ── BUILD CARBON TABLES ──────────────────────────────────────
function buildCarbonTables(d) {
  // Table A — Design estimate
  const tbA = document.getElementById("carbon-a-tbody");
  if (tbA) {
    const rows = d.carbonDesign || [];
    tbA.innerHTML = rows.map(r => `
      <tr>
        <td>${r.material}</td>
        <td style="text-align:center">${r.qty}</td>
        <td style="text-align:center">${r.unit}</td>
        <td style="text-align:center">${r.factor}</td>
        <td style="text-align:center">${r.total}</td>
      </tr>`).join("");
    const totalA = document.getElementById("carbon-a-total");
    if (totalA) totalA.textContent = d.carbonDesignTotal || "—";
  }

  // Table B — Actual
  const tbB = document.getElementById("carbon-b-tbody");
  if (tbB) {
    const rows = d.carbonActual || [];
    tbB.innerHTML = rows.map(r => `
      <tr>
        <td>${r.material}</td>
        <td style="text-align:center">${r.qty}</td>
        <td style="text-align:center">${r.unit}</td>
        <td style="text-align:center">${r.factor}</td>
        <td style="text-align:center">${r.total}</td>
      </tr>`).join("");
    const totalB = document.getElementById("carbon-b-total");
    if (totalB) totalB.textContent = d.carbonActualTotal || "—";
  }

  // Comparison note
  set("carbon-compare", d.carbonComparison || "Carbon comparison data not yet available.");
}

// ── BUILD CONSTRUCTION LOG ───────────────────────────────────
function buildLogTable(log) {
  const tbody = document.getElementById("log-tbody");
  if (!tbody) return;
  if (!log.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#888;font-style:italic;">No log entries recorded yet.</td></tr>`;
    return;
  }
  tbody.innerHTML = log.map(r => {
    const cls = r.status === "Complete" ? "val-ok" : r.status === "Upcoming" ? "val-blue" : "val-warn";
    return `<tr>
      <td>${r.date}</td>
      <td><b>${r.activity}</b></td>
      <td>${r.description}</td>
      <td>${r.recordedBy}</td>
      <td class="${cls}">${r.status}</td>
    </tr>`;
  }).join("");
}

// ── BUILD DELIVERY TABLE ─────────────────────────────────────
function buildDeliveryTable(deliveries) {
  const tbody = document.getElementById("delivery-tbody");
  if (!tbody) return;
  if (!deliveries.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#888;font-style:italic;">No delivery records found.</td></tr>`;
    return;
  }
  tbody.innerHTML = deliveries.map(r => {
    const cls = r.status === "Delivered and placed" || r.status === "Delivered and fixed" || r.status === "Delivered and erected" ? "val-ok" : "val-warn";
    return `<tr>
      <td><b>${r.material}</b></td>
      <td>${r.supplier}</td>
      <td class="val-mono">${r.batchId}</td>
      <td>${r.quantity}</td>
      <td>${r.date}</td>
      <td class="${cls}">${r.status}</td>
    </tr>`;
  }).join("");
}

// ── BUILD ISSUE LIST ─────────────────────────────────────────
function buildIssueList(issues) {
  const wrap = document.getElementById("issue-wrap");
  if (!wrap) return;
  if (!issues.length) {
    wrap.innerHTML = `<p style="font-family:Arial;font-size:11.5px;color:#888;font-style:italic;">No issues recorded for this element.</p>`;
    return;
  }
  wrap.innerHTML = issues.map(iss => {
    const resolved = iss.status === "Resolved";
    return `<div class="issue-box">
      <div class="ib-head ${resolved ? "resolved" : ""}">
        <div>
          <span class="ib-id ${resolved ? "resolved" : ""}">${iss.id}</span>
          &nbsp; ${iss.title}
        </div>
        <div class="ib-status ${resolved ? "ok" : "open"}">${iss.status}</div>
      </div>
      <div class="ib-body">
        <b>Identified:</b> ${iss.identified}<br>
        <b>Description:</b> ${iss.description}<br>
        <b>Action taken:</b> ${iss.action}<br>
        <b>Standard reference:</b> ${iss.standard}
      </div>
    </div>`;
  }).join("");
}

// ── BUILD PHASE TABLE ────────────────────────────────────────
function buildPhaseTable(phases) {
  const tbody = document.getElementById("phase-tbody");
  if (!tbody) return;
  if (!phases.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#888;font-style:italic;">No phase data available.</td></tr>`;
    return;
  }
  tbody.innerHTML = phases.map(p => {
    const cls = p.status === "Approved"   ? "val-ok"
              : p.status === "Pending"    ? "val-warn"
              : p.status === "On Hold"    ? "val-fail"
              : "val-blue";
    return `<tr>
      <td style="font-family:var(--font-mono);color:#888">${p.num}</td>
      <td><b>${p.phase}</b></td>
      <td>${p.description}</td>
      <td style="font-style:italic;color:#888">${p.standard}</td>
      <td>${p.approvedBy}</td>
      <td style="font-style:italic;color:#888">${p.date}</td>
      <td class="${cls}">${p.status}</td>
    </tr>`;
  }).join("");
}

// ── BUILD PHOTO GRID ─────────────────────────────────────────
function buildPhotoGrid(photos) {
  const wrap = document.getElementById("photo-wrap");
  if (!wrap) return;
  if (!photos.length) {
    wrap.innerHTML = `<p style="font-family:Arial;font-size:11.5px;color:#888;font-style:italic;">No site photos uploaded yet for this element.</p>`;
    return;
  }
  wrap.innerHTML = `<div class="photo-grid">${
    photos.map(p => `
      <div class="photo-card">
        <div class="pt">📷 ${p.stage}</div>
        ${p.url
          ? `<img src="${p.url}" alt="${p.stage}" />`
          : `<div class="photo-placeholder"><div style="font-size:24px">📷</div><div>${p.stage}</div><div style="font-size:9px;color:#aaa">Photo pending</div></div>`
        }
        <div class="pc">${p.date} — ${p.caption}</div>
      </div>`).join("")
  }</div>`;
}

// ── BUILD RELATED ELEMENTS ───────────────────────────────────
function buildRelatedElements(related) {
  const wrap = document.getElementById("related-wrap");
  if (!wrap) return;
  if (!related.length) {
    wrap.innerHTML = `<p style="font-family:Arial;font-size:11.5px;color:#888;font-style:italic;">No related elements linked.</p>`;
    return;
  }
  wrap.innerHTML = related.map(r =>
    `<a href="index.html?id=${r.id}" style="display:inline-block;margin:3px 5px 3px 0;padding:4px 10px;border:1px solid #bbb;font-family:Arial;font-size:11.5px;color:#1a3a6b;text-decoration:none;background:#eef3fc;">${r.id} — ${r.name}</a>`
  ).join("");
}

// ── UI HELPERS ───────────────────────────────────────────────
function hideLoading() {
  const el = document.getElementById("loading-msg");
  if (el) el.style.display = "none";
  const main = document.getElementById("main-content");
  if (main) main.style.display = "block";
}

function showError(msg) {
  const el = document.getElementById("loading-msg");
  if (el) { el.textContent = msg; el.className = "error-msg"; }
}
