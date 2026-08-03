const state = { rates: [], payments: [], rows: [] };
const $ = (id) => document.getElementById(id);
const gbp = (value) => Number(value || 0).toLocaleString("en-GB", { style: "currency", currency: "GBP" });
const pct = (value) => `${(Number(value) * 100).toFixed(3)}%`;

function payload() {
  return {
    principal: Number($("principal").value),
    discount: Number($("discount").value),
    start: $("start").value,
    end: $("end").value,
    timing: document.querySelector('input[name="timing"]:checked').value,
    rates: state.rates,
    payments: state.payments,
  };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function render(rows) {
  state.rows = rows;
  const last = rows.at(-1);
  const interest = rows.reduce((total, row) => total + row["Interest charged"], 0);
  const paid = rows.reduce((total, row) => total + row.Payment, 0);
  $("closing-balance").textContent = gbp(last?.["Closing balance"] ?? Number($("principal").value));
  $("interest-charged").textContent = gbp(interest);
  $("payments-applied").textContent = gbp(paid);
  $("unpaid-interest").textContent = gbp(last?.["Unpaid interest"] ?? 0);
  $("period-count").textContent = `${rows.length} periods`;
  $("payment-count").textContent = `${state.payments.length} actual CSV rows`;
  $("statement-end").textContent = `At ${$("end").value}`;
  $("statement-body").innerHTML = rows.map((row) => `<tr>
    <td>${row.Period}</td><td>${row.From}<br><small>to ${row.To}</small></td>
    <td>${pct(row["Average Bank Rate"])}</td><td>${pct(row["Loan rate"])}</td>
    <td>${gbp(row["Interest charged"])}</td><td>${gbp(row.Payment)}</td>
    <td><em class="${row["Payment source"] === "CSV" ? "actual" : ""}">${escapeHtml(row["Payment source"])}</em></td>
    <td>${gbp(row["Unpaid interest"])}</td><td>${gbp(row["Closing principal"])}</td><td><b>${gbp(row["Closing balance"])}</b></td>
  </tr>`).join("");
}

let calculationNumber = 0;
async function calculate() {
  const thisCalculation = ++calculationNumber;
  const error = $("error");
  error.hidden = true;
  try {
    const response = await fetch("/api/calculate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload()) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "The statement could not be calculated.");
    if (thisCalculation === calculationNumber) render(result.rows);
  } catch (problem) {
    error.textContent = problem.message;
    error.hidden = false;
  }
}

function parsePayments(text) {
  const lines = text.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
  const start = /date|amount|payment/i.test(lines[0] || "") ? 1 : 0;
  return lines.slice(start).map((line) => {
    const match = line.match(/^\s*"?([^",]+)"?\s*,\s*"?£?([\d,.-]+)"?\s*$/);
    if (!match) return null;
    let date = match[1].trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) date = `${date.slice(6)}-${date.slice(3, 5)}-${date.slice(0, 2)}`;
    const amount = Number(match[2].replaceAll(",", ""));
    return Number.isFinite(amount) ? { date, amount } : null;
  }).filter(Boolean);
}

async function exportStatement() {
  const response = await fetch("/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload()) });
  if (!response.ok) {
    const result = await response.json();
    $("error").textContent = result.error || "The spreadsheet could not be exported.";
    $("error").hidden = false;
    return;
  }
  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") || "";
  const filename = disposition.match(/filename=([^;]+)/)?.[1]?.replaceAll('"', "") || "loan-statement.xlsx";
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

async function initialise() {
  $("end").value = new Date().toISOString().slice(0, 10);
  const response = await fetch("/api/bank-rate");
  const result = await response.json();
  state.rates = result.rates;
  const current = state.rates.at(-1);
  $("current-rate").textContent = `${Number(current.rate).toFixed(2)}%`;
  $("current-rate-date").textContent = `effective ${current.date}`;
  $("rate-status").textContent = result.live ? "Official source checked online" : "Stored official history (offline fallback)";
  calculate();
}

document.querySelectorAll("input[type=number], input[type=date], input[name=timing]").forEach((input) => input.addEventListener("change", calculate));
$("payments-file").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  state.payments = parsePayments(await file.text());
  $("file-status").textContent = `${file.name} · ${state.payments.length} rows`;
  calculate();
});
$("export").addEventListener("click", exportStatement);
initialise();
