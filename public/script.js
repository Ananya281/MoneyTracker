// -------------------- Firebase SDK --------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore, collection, addDoc, serverTimestamp,
  Timestamp, onSnapshot, query, orderBy, deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// -------------------- Firebase config --------------------
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// -------------------- LOGIN --------------------
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const pass = document.getElementById("password").value.trim();
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      window.location.href = "index.html";
    } catch (err) {
      alert(err.message);
    }
  });
}

// -------------------- SIGNUP --------------------
const signupForm = document.getElementById("signup-form");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const pass = document.getElementById("password").value.trim();
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      window.location.href = "index.html";
    } catch (err) {
      alert(err.message);
    }
  });
}

// -------------------- LOGOUT --------------------
const logoutBtn = document.getElementById("btn-logout");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      window.location.href = "login.html";
    } catch (err) {
      alert(err.message);
    }
  });
}

// -------------------- ADD ENTRY --------------------
const entryForm = document.getElementById("entry-form");
if (entryForm) {
  entryForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const type = document.getElementById("category_select").value;
    const amount = Number(document.getElementById("amount_input").value);
    const info = document.getElementById("info").value.trim();
    const date = document.getElementById("date_input").value;
    const user = auth.currentUser;
    if (!user) return alert("Please log in first.");
    try {
      await addDoc(collection(db, "users", user.uid, "transactions"), {
        type,
        amount,
        info,
        date: Timestamp.fromDate(new Date(date)),
        createdAt: serverTimestamp()
      });
      entryForm.reset();
    } catch (err) {
      alert(err.message);
    }
  });
}

// -------------------- FETCH ENTRIES --------------------
const tbody = document.getElementById("expense-table-body");
function renderTable(items) {
  if (!tbody) return;
  tbody.innerHTML = "";
  items.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.type}</td>
      <td>${row.amount.toFixed(2)}</td>
      <td>${row.info}</td>
      <td>${row.date.toDate().toISOString().slice(0,10)}</td>
      <td><i class="fas fa-trash-alt" data-id="${row.id}"></i></td>
    `;
    tbody.appendChild(tr);
  });
}

if (tbody) {
  auth.onAuthStateChanged(user => {
    if (user) {
      const q = query(
        collection(db, "users", user.uid, "transactions"),
        orderBy("date", "desc")
      );
      onSnapshot(q, snap => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderTable(data);
      });
    }
  });
}
