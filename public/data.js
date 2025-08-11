// data.js — top-level `transactions` + userId link
import { auth, db } from "./db.js";
import {
  collection, addDoc, query, where, orderBy, onSnapshot,
  deleteDoc, doc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const txCol = () => collection(db, "transactions");

export async function addTransaction({ amount, category, note, date }) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");

  const n = Number(amount);
  const signed = category === "Income" ? Math.abs(n) : -Math.abs(n);

  return addDoc(txCol(), {
    userId: user.uid,                       // link to users/{uid}
    amount: isNaN(signed) ? 0 : signed,
    category,
    note: (note || "").trim(),
    date: date instanceof Date ? date : new Date(date),
    createdAt: serverTimestamp()
  });
}

// Robust date → millis helper (handles Firestore Timestamps and plain dates)
function toMillisSafe(d) {
  if (!d) return 0;
  try {
    if (typeof d.toMillis === "function") return d.toMillis();
    const t = new Date(d).getTime();
    return Number.isFinite(t) ? t : 0;
  } catch {
    return 0;
  }
}

export function listenTransactions(render, onError = console.error) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");

  let unsubscribe = onSnapshot(
    // Preferred (needs composite index: userId ASC, date DESC)
    query(txCol(), where("userId", "==", user.uid), orderBy("date", "desc")),
    snap => render(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    err => {
      // If index missing, fall back to no-order + client sort
      if (err.code === "failed-precondition") {
        console.warn("Missing Firestore index (userId ASC, date DESC). Falling back to client-side sort.");
        try { unsubscribe && unsubscribe(); } catch {}
        unsubscribe = onSnapshot(
          query(txCol(), where("userId", "==", user.uid)),
          snap => {
            const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            rows.sort((a, b) => toMillisSafe(b.date) - toMillisSafe(a.date)); // desc
            render(rows);
          },
          onError
        );
      } else {
        onError(err);
        alert("Failed to load entries. Check console for details.");
      }
    }
  );

  return () => { try { unsubscribe && unsubscribe(); } catch {} };
}

export async function removeTransaction(id) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  return deleteDoc(doc(db, "transactions", id));
}
