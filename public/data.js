// data.js
import { auth, db } from "./db.js";
import {
  collection, addDoc, query, orderBy, onSnapshot,
  deleteDoc, doc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export async function addTransaction({ amount, category, note, date }) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");

  const n = Number(amount);
  const signedAmount = category === "Income" ? Math.abs(n) : -Math.abs(n);

  return addDoc(collection(db, "users", user.uid, "transactions"), {
    amount: signedAmount,
    category,
    note: (note || "").trim(),
    date: date instanceof Date ? date : new Date(date),
    createdAt: serverTimestamp()
  });
}

export function listenTransactions(render, onError = console.error) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");

  const q = query(
    collection(db, "users", user.uid, "transactions"),
    orderBy("date", "desc")
  );

  return onSnapshot(q, (snap) => {
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    render(rows);
  }, onError);
}

export async function removeTransaction(id) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  return deleteDoc(doc(db, "users", user.uid, "transactions", id));
}
