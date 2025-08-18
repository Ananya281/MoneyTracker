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

    // Actions (Edit & Delete)
    const tdActions = document.createElement("td");
    tdActions.className = "text-center";

    // Create the edit icon element and append it
    const editIcon = document.createElement("i");
    editIcon.className = "fas fa-edit edit-icon me-3";
    editIcon.title = "Edit";
    editIcon.addEventListener("click", () => console.log(`Edit clicked for ID: ${r.id}`));
    tdActions.appendChild(editIcon);

    // Create the delete icon element and append it
    const deleteIcon = document.createElement("i");
    deleteIcon.className = "fas fa-trash-alt delete-icon";
    deleteIcon.title = "Delete";
    deleteIcon.addEventListener("click", () => handleDelete(r.id));
    tdActions.appendChild(deleteIcon);

    tr.appendChild(tdActions);

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

// ---------- NEW EDIT FUNCTION ----------
function handleEdit(row) {
    editingId = row.id;
    selType.value = row.category;
    inputAmount.value = Math.abs(Number(row.amount));
    inputInfo.value = row.note || row.info;
    
    // Format the date for the input field (yyyy-mm-dd)
    const d = row.date?.toDate ? row.date.toDate() : new Date(row.date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    inputDate.value = `${yyyy}-${mm}-${dd}`;

    formBtn.textContent = "Update";
    inputAmount.focus();
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
