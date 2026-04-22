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
  apiKey:            "AIzaSyACk7s3iAqID4cHxsHUyJWlY6KaC3yBLaE",
  authDomain:        "bim-beam-145.firebaseapp.com",
  projectId:         "bim-beam-145",
  storageBucket:     "bim-beam-145.firebasestorage.app",
  messagingSenderId: "1080298944444",
  appId:             "1:1080298944444:web:571ac2de49dedb74195db9"
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
  if (!qrEl) return;

  const url = window.location.href;

  // Try QRCode library first
  if (typeof QRCode !== "undefined") {
    try {
      new QRCode(qrEl, {
        text: url,
        width: 76,
        height: 76,
        colorDark: "#1a3a6b",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
      return;
    } catch(e) {}
  }

  // Fallback — use Google Charts API as an img tag
  const img = document.createElement("img");
  img.src = "https://api.qrserver.com/v1/create-qr-code/?size=76x76&ecc=H&data=" + encodeURIComponent(url);
  img.alt = "QR Code for Beam 145 live record";
  img.style.cssText = "width:76px;height:76px;border:1px solid #bbb;padding:2px;display:block;";
  qrEl.appendChild(img);
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

  // ── Charts and Revit section
  buildCharts(d);
  buildRevitSection(d);

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

  const ctEl = document.getElementById("cost-total");
  if (ctEl) ctEl.textContent = d.costTotal || "—";
  const cnEl = document.getElementById("cost-note");
  if (cnEl) cnEl.textContent = d.costNote || "Source: BCIS regional rates. Excludes preliminaries, overheads and profit.";
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
  const ccEl = document.getElementById("carbon-compare");
  if (ccEl) ccEl.textContent = d.carbonComparison || "Carbon comparison data not yet available.";
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

// ── CHARTS ───────────────────────────────────────────────────
// Called after data loads — draws all 4 charts using Chart.js

let chartProgress = null, chartCarbon = null, chartCost = null, chartTimeline = null;

function buildCharts(d) {
  buildProgressChart(d);
  buildCarbonChart(d);
  buildCostChart(d);
  buildTimelineChart(d);
}

// 1. Construction Phase Progress — horizontal bar showing approved vs pending vs on hold
function buildProgressChart(d) {
  const ctx = document.getElementById("chart-progress");
  if (!ctx) return;
  if (chartProgress) chartProgress.destroy();

  const phases = d.phases || [];
  const labels = phases.map(p => p.phase && p.phase.length > 22 ? p.phase.substring(0,22)+"…" : (p.phase || "Phase"));
  const approved = phases.map(p => p.status === "Approved" ? 1 : 0);
  const pending  = phases.map(p => p.status === "Pending"  ? 1 : 0);
  const onhold   = phases.map(p => p.status === "On Hold"  ? 1 : 0);

  chartProgress = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Approved",  data: approved, backgroundColor: "#1c6b35", borderWidth: 0 },
        { label: "Pending",   data: pending,  backgroundColor: "#f59e0b", borderWidth: 0 },
        { label: "On Hold",   data: onhold,   backgroundColor: "#8b1a1a", borderWidth: 0 },
      ]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      plugins: {
        legend: { position: "bottom", labels: { font: { family:"Arial", size:10 }, boxWidth:12 } },
        tooltip: { callbacks: { label: ctx => ctx.dataset.label } }
      },
      scales: {
        x: { stacked: true, max: 1, display: false },
        y: { stacked: true, ticks: { font: { family:"Arial", size:9 } } }
      }
    }
  });
}

// 2. Carbon comparison — grouped bar: Design vs Actual per material
function buildCarbonChart(d) {
  const ctx = document.getElementById("chart-carbon");
  if (!ctx) return;
  if (chartCarbon) chartCarbon.destroy();

  const designRows = d.carbonDesign || [];
  const actualRows = d.carbonActual || [];
  const labels = designRows.map(r => r.material || "—");
  const designVals = designRows.map(r => parseFloat((r.total||"0").replace(/,/g,"")) || 0);
  const actualVals = actualRows.map(r => parseFloat((r.total||"0").replace(/,/g,"")) || 0);

  // Add totals bar
  const dTotal = parseFloat((d.carbonDesignTotal||"0").replace(/,/g,"")) || 0;
  const aTotal = parseFloat((d.carbonActualTotal||"0").replace(/,/g,"")) || 0;
  labels.push("TOTAL");
  designVals.push(dTotal);
  actualVals.push(aTotal);

  chartCarbon = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Design Estimate", data: designVals, backgroundColor: "#2356a8", borderWidth: 0 },
        { label: "Actual As-Built", data: actualVals, backgroundColor: "#1c6b35", borderWidth: 0 },
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position:"bottom", labels:{ font:{family:"Arial",size:10}, boxWidth:12 } }
      },
      scales: {
        x: { ticks:{ font:{family:"Arial",size:9} } },
        y: { ticks:{ font:{family:"Arial",size:9} }, title:{ display:true, text:"kgCO2e", font:{family:"Arial",size:9} } }
      }
    }
  });
}

// 3. Cost breakdown — doughnut chart
function buildCostChart(d) {
  const ctx = document.getElementById("chart-cost");
  if (!ctx) return;
  if (chartCost) chartCost.destroy();

  const items = d.costItems || [];
  if (!items.length) return;

  const labels = items.map(r => r.desc && r.desc.length > 30 ? r.desc.substring(0,30)+"…" : r.desc);
  const vals   = items.map(r => parseFloat((r.total||"0").replace(/,/g,"")) || 0);
  const colors = ["#1a3a6b","#2356a8","#4a7fd4","#7aa8e8","#a8c8f8","#c8d8f0"];

  chartCost = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{ data: vals, backgroundColor: colors, borderWidth: 1, borderColor: "#fff" }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position:"bottom", labels:{ font:{family:"Arial",size:9}, boxWidth:12 } },
        tooltip: { callbacks: { label: ctx => `${ctx.label}: £${ctx.parsed.toLocaleString()}` } }
      }
    }
  });
}

// 4. Timeline chart — horizontal bar showing phase durations
function buildTimelineChart(d) {
  const ctx = document.getElementById("chart-timeline");
  if (!ctx) return;
  if (chartTimeline) chartTimeline.destroy();

  // Static timeline data for Beam 145 — update via admin if needed
  const timelineData = d.timelineData || [
    { phase:"Setting Out",        planned:3,  actual:3  },
    { phase:"Formwork",           planned:5,  actual:6  },
    { phase:"Rebar Delivery",     planned:2,  actual:2  },
    { phase:"Reinforcement Fix",  planned:4,  actual:4  },
    { phase:"Pre-Pour Inspection",planned:1,  actual:1  },
    { phase:"Concrete Pour",      planned:1,  actual:1  },
    { phase:"Curing",             planned:7,  actual:null },
    { phase:"QA Testing",         planned:28, actual:null },
  ];

  chartTimeline = new Chart(ctx, {
    type: "bar",
    data: {
      labels: timelineData.map(r => r.phase),
      datasets: [
        { label:"Planned (days)", data: timelineData.map(r=>r.planned), backgroundColor:"#4a7fd4", borderWidth:0 },
        { label:"Actual (days)",  data: timelineData.map(r=>r.actual||0), backgroundColor:"#1c6b35", borderWidth:0 },
      ]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      plugins: {
        legend: { position:"bottom", labels:{ font:{family:"Arial",size:10}, boxWidth:12 } }
      },
      scales: {
        x: { ticks:{ font:{family:"Arial",size:9} }, title:{ display:true, text:"Days", font:{family:"Arial",size:9} } },
        y: { ticks:{ font:{family:"Arial",size:9} } }
      }
    }
  });
}

// ── REVIT SKETCHES / GRAPHS SECTION ─────────────────────────
function buildRevitSection(d) {
  const wrap = document.getElementById("revit-wrap");
  if (!wrap) return;

  // Use photos array — filter for Revit/sketch type, or show all with Revit labels
  const photos = d.photos || [];
  const revitPhotos = d.revitImages || [];

  // Combine all available images
  const allImages = [
    ...revitPhotos.map(p => ({ ...p, isRevit: true })),
    ...photos.map(p => ({ ...p, isRevit: false }))
  ];

  if (!allImages.length) {
    // Show placeholder grid with instructions
    wrap.innerHTML = `<div class="revit-grid">
      ${["Revit 3D Model View — Beam 145 in Full Structure",
         "Revit Structural Plan — Grid C/4 to C/6",
         "Robot Structural Analysis — Bending Moment Diagram",
         "Robot Structural Analysis — Shear Force Diagram"].map((title, i) => `
        <div class="revit-card">
          <div class="rt">📐 ${title}</div>
          <div class="revit-placeholder">
            <div style="font-size:28px">📐</div>
            <div style="font-weight:bold;color:#1a3a6b;">${title.split("—")[0].trim()}</div>
            <div style="font-size:9.5px;text-align:center;padding:0 10px;color:#888;">Add image URL in admin panel → Photo URLs field → Save</div>
          </div>
          <div class="rc">Upload via admin panel — accepts any image URL (Google Drive, Dropbox, GitHub raw, etc.)</div>
        </div>`).join("")}
    </div>`;
    return;
  }

  const titles = [
    "Revit 3D Model View",
    "Revit Structural Plan",
    "Robot — Bending Moment Diagram",
    "Robot — Shear Force Diagram",
    "Site Photograph",
    "Structural Sketch",
  ];

  wrap.innerHTML = `<div class="revit-grid">${
    allImages.map((img, i) => `
      <div class="revit-card">
        <div class="rt">📐 ${img.stage || titles[i] || "BIM View " + (i+1)}</div>
        ${img.url
          ? `<img src="${img.url}" alt="${img.stage || "BIM View"}" />`
          : `<div class="revit-placeholder"><div style="font-size:24px">📐</div><div>Image pending upload</div></div>`
        }
        <div class="rc">${img.date || ""} ${img.caption ? "— " + img.caption : ""}</div>
      </div>`).join("")
  }</div>`;
}


// ── CHARTS FROM FIREBASE DATA ────────────────────────────────
// All 4 charts are built from live Firestore data.
// Update phase statuses, carbon values or cost items in admin
// and the charts update automatically on next page load.

let _chartProgress = null, _chartCarbon = null,
    _chartTimeline = null, _chartCost = null;

function buildCharts(d) {
  _buildProgressChart(d);
  _buildCarbonChart(d);
  _buildTimelineChart(d);
  _buildCostChart(d);
}

// 1. Phase progress — reads from d.phases array
function _buildProgressChart(d) {
  const ctx = document.getElementById("chart-progress");
  if (!ctx) return;
  if (_chartProgress) { _chartProgress.destroy(); }

  const phases = d.phases || [];
  const labels   = phases.map(p => p.phase ? p.phase.substring(0,22) : "Phase");
  const approved = phases.map(p => p.status === "Approved" ? 1 : 0);
  const pending  = phases.map(p => p.status === "Pending"  ? 1 : 0);
  const onhold   = phases.map(p => p.status === "On Hold"  ? 1 : 0);

  _chartProgress = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label:"Approved", data:approved, backgroundColor:"#1c6b35", borderWidth:0 },
        { label:"Pending",  data:pending,  backgroundColor:"#f59e0b", borderWidth:0 },
        { label:"On Hold",  data:onhold,   backgroundColor:"#8b1a1a", borderWidth:0 },
      ]
    },
    options: {
      indexAxis:"y", responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ position:"bottom", labels:{ font:{family:"Arial",size:9}, boxWidth:10 } } },
      scales:{
        x:{ stacked:true, max:1, display:false },
        y:{ stacked:true, ticks:{ font:{family:"Arial",size:8} } }
      }
    }
  });
}

// 2. Carbon comparison — reads from d.carbonDesign and d.carbonActual
function _buildCarbonChart(d) {
  const ctx = document.getElementById("chart-carbon");
  if (!ctx) return;
  if (_chartCarbon) { _chartCarbon.destroy(); }

  const design = d.carbonDesign || [];
  const actual = d.carbonActual || [];
  const labels = design.map(r => r.material || "");
  const dVals  = design.map(r => parseFloat((r.total||"0").replace(/,/g,"")) || 0);
  const aVals  = actual.map(r => parseFloat((r.total||"0").replace(/,/g,"")) || 0);

  const dTotal = parseFloat((d.carbonDesignTotal||"0").replace(/,/g,"")) || 0;
  const aTotal = parseFloat((d.carbonActualTotal||"0").replace(/,/g,"")) || 0;
  labels.push("TOTAL"); dVals.push(dTotal); aVals.push(aTotal);

  _chartCarbon = new Chart(ctx, {
    type:"bar",
    data:{
      labels,
      datasets:[
        { label:"Design Estimate", data:dVals, backgroundColor:"#2356a8", borderWidth:0 },
        { label:"Actual As-Built", data:aVals, backgroundColor:"#1c6b35", borderWidth:0 },
      ]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ position:"bottom", labels:{ font:{family:"Arial",size:9}, boxWidth:10 } } },
      scales:{
        x:{ ticks:{ font:{family:"Arial",size:8} } },
        y:{ ticks:{ font:{family:"Arial",size:8} }, title:{ display:true, text:"kgCO2e", font:{family:"Arial",size:9} } }
      }
    }
  });
}

// 3. Timeline — reads from d.timelineData or falls back to phases
function _buildTimelineChart(d) {
  const ctx = document.getElementById("chart-timeline");
  if (!ctx) return;
  if (_chartTimeline) { _chartTimeline.destroy(); }

  const tl = d.timelineData || [
    { phase:"Setting Out",   planned:3,  actual:3  },
    { phase:"Formwork",      planned:5,  actual:6  },
    { phase:"Rebar Delivery",planned:2,  actual:2  },
    { phase:"Rebar Fixing",  planned:4,  actual:4  },
    { phase:"Pre-Pour",      planned:1,  actual:1  },
    { phase:"Concrete Pour", planned:1,  actual:1  },
    { phase:"Curing",        planned:7,  actual:0  },
    { phase:"QA Testing",    planned:28, actual:0  },
  ];

  _chartTimeline = new Chart(ctx, {
    type:"bar",
    data:{
      labels: tl.map(r=>r.phase),
      datasets:[
        { label:"Planned (days)", data:tl.map(r=>r.planned), backgroundColor:"#4a7fd4", borderWidth:0 },
        { label:"Actual (days)",  data:tl.map(r=>r.actual||0), backgroundColor:"#1c6b35", borderWidth:0 },
      ]
    },
    options:{
      indexAxis:"y", responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ position:"bottom", labels:{ font:{family:"Arial",size:9}, boxWidth:10 } } },
      scales:{
        x:{ ticks:{ font:{family:"Arial",size:8} }, title:{ display:true, text:"Days", font:{family:"Arial",size:9} } },
        y:{ ticks:{ font:{family:"Arial",size:8} } }
      }
    }
  });
}

// 4. Cost doughnut — reads from d.costItems
function _buildCostChart(d) {
  const ctx = document.getElementById("chart-cost");
  if (!ctx) return;
  if (_chartCost) { _chartCost.destroy(); }

  const items = d.costItems || [];
  if (!items.length) return;

  const labels = items.map(r => r.desc ? r.desc.split("—")[0].substring(0,20).trim() : "Item");
  const vals   = items.map(r => parseFloat((r.total||"0").replace(/,/g,"")) || 0);

  _chartCost = new Chart(ctx, {
    type:"doughnut",
    data:{
      labels,
      datasets:[{
        data:vals,
        backgroundColor:["#1a3a6b","#2356a8","#4a7fd4","#7aa8e8","#a8c8f8","#c8d8f0"],
        borderWidth:1, borderColor:"#fff"
      }]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{
        legend:{ position:"bottom", labels:{ font:{family:"Arial",size:9}, boxWidth:10 } },
        tooltip:{ callbacks:{ label:ctx=>"£"+ctx.parsed.toLocaleString() } }
      }
    }
  });
}
