// script.js — Dashboard UI only (uses db.js + data.js)
import { auth } from "./db.js";
import { addTransaction, listenTransactions, removeTransaction } from "./data.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ---------- DOM ----------
const $ = (s) => document.querySelector(s);

const loginGuardRedirect = "login.html";

const form        = $("#entry-form");
const selType     = $("#category_select");
const inputAmount = $("#amount_input");
const inputInfo   = $("#info");
const inputDate   = $("#date_input");

const tbody       = $("#expense-table-body");
const incomeEl    = $("#total-income");
const expenseEl   = $("#total-expense");
const netEl       = $("#total-net");
const emailEl     = $("#user-email");
const logoutBtn   = $("#btn-logout");

// INR formatter
const fmtINR = (n) =>
  Number(n || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

// ---------- Auth guard + start stream ----------
let unsubscribe = null;

onAuthStateChanged(auth, (user) => {
  if (!user) return location.replace(loginGuardRedirect);

  if (emailEl) emailEl.textContent = user.email || "";

  // start Firestore stream for this user
  unsubscribe?.();
  unsubscribe = listenTransactions((rows) => {
    renderTable(rows);
    renderTotals(rows);
  }, (err) => {
    console.error(err);
    alert("Failed to load entries.");
  });
});

// ---------- Logout ----------
logoutBtn?.addEventListener("click", async () => {
  try {
    await signOut(auth);
    location.replace(loginGuardRedirect);
  } catch (err) {
    alert(err.message || "Logout failed");
  }
});

// ---------- Add entry ----------
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return location.replace(loginGuardRedirect);

  const category = selType.value; // "Expense" | "Income"
  const amount   = Number(inputAmount.value);
  const note     = inputInfo.value.trim();
  const dStr     = inputDate.value;
  const date     = dStr ? new Date(`${dStr}T00:00:00`) : new Date();

  if (!amount || amount <= 0) {
    inputAmount.focus();
    return;
  }

  try {
    // NOTE: data.js will handle +/- sign based on category
    await addTransaction({ amount, category, note, date });
    form.reset();
  } catch (err) {
    console.error(err);
    alert(err.message || "Failed to add entry.");
  }
});

// ---------- Render helpers ----------
function renderTable(rows) {
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!rows.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.style.textAlign = "center";
    td.textContent = "No entries yet. Add your first one!";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  for (const r of rows) {
    const tr = document.createElement("tr");

    // Type
    const tdType = document.createElement("td");
    // Prefer r.category if present, else infer from amount
    tdType.textContent = r.category || (Number(r.amount) >= 0 ? "Income" : "Expense");
    tr.appendChild(tdType);

    // Amount
    const tdAmt = document.createElement("td");
    tdAmt.textContent = fmtINR(Number(r.amount || 0));
    tr.appendChild(tdAmt);

    // Info
    const tdInfo = document.createElement("td");
    tdInfo.textContent = r.note || r.info || "";
    tr.appendChild(tdInfo);

    // Date
    const tdDate = document.createElement("td");
    const d = r.date?.toDate ? r.date.toDate() : new Date(r.date);
    tdDate.textContent = d.toLocaleDateString("en-IN");
    tr.appendChild(tdDate);

    // Delete
    const tdDel = document.createElement("td");
    const del = document.createElement("i");
    del.className = "fas fa-trash-alt delete-icon";
    del.style.cursor = "pointer";
    del.title = "Delete";
    del.addEventListener("click", () => handleDelete(r.id));
    tdDel.appendChild(del);
    tr.appendChild(tdDel);

    tbody.appendChild(tr);
  }
}

function renderTotals(rows) {
  const income  = rows.filter(r => Number(r.amount) > 0).reduce((a,b)=>a+Number(b.amount), 0);
  const expense = rows.filter(r => Number(r.amount) < 0).reduce((a,b)=>a+Number(b.amount), 0);
  const net     = income + expense;

  if (incomeEl)  incomeEl.textContent  = fmtINR(income);
  if (expenseEl) expenseEl.textContent = fmtINR(Math.abs(expense));
  if (netEl)     netEl.textContent     = fmtINR(net);
}

async function handleDelete(id) {
  if (!confirm("Delete this entry?")) return;
  try {
    await removeTransaction(id);
  } catch (err) {
    console.error(err);
    alert(err.message || "Delete failed.");
  }
}
