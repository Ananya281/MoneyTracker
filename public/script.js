// -------------------- Firebase SDK (ES modules via CDN) --------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore, collection, addDoc, serverTimestamp,
  Timestamp, onSnapshot, query, orderBy, deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// -------------------- TODO: paste your Firebase config here ----------------
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAFVHLv9lWa69One_nrqxhhkN6qx4elku4",
  authDomain: "money-tracker-daea2.firebaseapp.com",
  projectId: "money-tracker-daea2",
  storageBucket: "money-tracker-daea2.firebasestorage.app",
  messagingSenderId: "1082584224577",
  appId: "1:1082584224577:web:4f6f7ebaa648d73b9b87c0",
  measurementId: "G-WZGRY77CJQ"
};

// ---------------------------------------------------------------------------

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// -------------------- DOM refs --------------------
const appMain = document.getElementById("app");
const userBar = document.getElementById("user-bar");
const authForm = document.getElementById("auth-form");
const userEmailEl = document.getElementById("user-email");
const btnSignup = document.getElementById("btn-signup");
const btnLogout = document.getElementById("btn-logout");

const categorySelect = document.getElementById("category_select");
const amountInput = document.getElementById("amount_input");
const infoInput = document.getElementById("info");
const dateInput = document.getElementById("date_input");
const entryForm = document.getElementById("entry-form");

const tbody = document.getElementById("expense-table-body");
const totalIncomeEl  = document.getElementById("total-income");
const totalExpenseEl = document.getElementById("total-expense");
const totalNetEl     = document.getElementById("total-net");

// Default date = today
dateInput.valueAsDate = new Date();

// -------------------- Auth handlers --------------------
authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    alert(err.message.replace("Firebase:", "").trim());
  }
});

btnSignup.addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  if (!email || !password) return alert("Enter email & password first.");
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("Account created. You're logged in.");
  } catch (err) {
    alert(err.message.replace("Firebase:", "").trim());
  }
});

btnLogout?.addEventListener("click", () => signOut(auth));

// -------------------- UI state by auth --------------------
let unsub = null; // to stop previous Firestore listener

onAuthStateChanged(auth, (user) => {
  if (user) {
    // show app
    document.getElementById("auth-form").classList.add("hidden");
    userBar.classList.remove("hidden");
    userEmailEl.textContent = user.email;
    appMain.classList.remove("hidden");

    // listen to transactions in realtime
    const txnsRef = collection(db, "users", user.uid, "transactions");
    const q = query(txnsRef, orderBy("date", "desc"));
    if (unsub) unsub();
    unsub = onSnapshot(q, (snap) => {
      renderTable(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  } else {
    // hide app
    if (unsub) { unsub(); unsub = null; }
    clearTable();
    appMain.classList.add("hidden");
    userBar.classList.add("hidden");
    document.getElementById("auth-form").classList.remove("hidden");
  }
});

// -------------------- Add entry --------------------
entryForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return alert("Please login first.");

  const type = categorySelect.value; // "Income" | "Expense"
  const amount = Number(amountInput.value);
  const info = infoInput.value.trim();
  const dateStr = dateInput.value;

  if (!type || !amount || !dateStr || !info) return alert("Fill all fields.");

  try {
    await addDoc(collection(db, "users", user.uid, "transactions"), {
      type,
      amount,
      info,
      date: Timestamp.fromDate(new Date(dateStr)),
      createdAt: serverTimestamp()
    });
    // reset quick
    amountInput.value = "";
    infoInput.value = "";
    dateInput.valueAsDate = new Date();
    categorySelect.value = "Expense";
  } catch (err) {
    alert(err.message.replace("Firebase:", "").trim());
  }
});

// -------------------- Render/Delete helpers --------------------
function clearTable() {
  tbody.innerHTML = "";
  updateTotals(0, 0);
}

function renderTable(items) {
  tbody.innerHTML = "";

  let income = 0, expense = 0;

  items.forEach((row) => {
    if (row.type === "Income") income += row.amount;
    else expense += row.amount;

    const tr = document.createElement("tr");

    const tdType = document.createElement("td");
    tdType.textContent = row.type;

    const tdAmount = document.createElement("td");
    tdAmount.textContent = row.amount.toFixed(2);

    const tdInfo = document.createElement("td");
    tdInfo.textContent = row.info || "-";

    const tdDate = document.createElement("td");
    const d = row.date?.toDate ? row.date.toDate() : new Date(row.date);
    tdDate.textContent = d.toISOString().slice(0, 10);

    const tdDel = document.createElement("td");
    const del = document.createElement("i");
    del.className = "fas fa-trash-alt delete-icon";
    del.title = "Delete";
    del.addEventListener("click", () => handleDelete(row.id));
    tdDel.appendChild(del);

    tr.append(tdType, tdAmount, tdInfo, tdDate, tdDel);
    tbody.appendChild(tr);
  });

  updateTotals(income, expense);
}

async function handleDelete(id) {
  const user = auth.currentUser;
  if (!user) return;
  if (!confirm("Delete this entry?")) return;
  try {
    await deleteDoc(doc(db, "users", user.uid, "transactions", id));
  } catch (err) {
    alert(err.message.replace("Firebase:", "").trim());
  }
}

function updateTotals(income, expense) {
  const nf = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
  totalIncomeEl.textContent = "₹" + nf.format(income);
  totalExpenseEl.textContent = "₹" + nf.format(expense);
  totalNetEl.textContent = "₹" + nf.format(income - expense);
}
