// auth.js — login + signup (uses the shared app from db.js)
import { auth, db } from "./db.js?v=2";
import {
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc, setDoc, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const provider = new GoogleAuthProvider();

// ---------- tiny helpers ----------
const $ = (sel) => document.querySelector(sel);
function showError(targetForm, msg) {
  if (!targetForm) return alert(msg);
  let el = targetForm.querySelector(".auth-error");
  if (!el) {
    el = document.createElement("div");
    el.className = "auth-error";
    el.style.marginTop = "10px";
    el.style.color = "#dc2626";
    el.style.fontSize = ".9rem";
    targetForm.appendChild(el);
  }
  el.textContent = (msg || "").replace("Firebase:", "").trim();
}
function setLoading(btn, loading) {
  if (!btn) return;
  btn.disabled = loading;
  btn.style.opacity = loading ? "0.7" : "1";
}

// ---------- users/{uid} profile doc (email, name, timestamps) ----------
async function ensureUserDoc(user, name) {
  if (!user) return;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  // Always update these:
  const payload = {
    email: user.email ?? null,
    name:  name || user.displayName || null,   // matches your schema
    updatedAt: serverTimestamp()
  };

  // Set createdAt only on first create
  if (!snap.exists()) {
    payload.createdAt = serverTimestamp();
  }

  await setDoc(ref, payload, { merge: true });
}

// ---------- LOGIN ----------
const loginForm = $("#login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("#email")?.value.trim();
    const pass  = $("#password")?.value;
    const remember = $("#remember")?.checked;

    const submitBtn = loginForm.querySelector("button[type=submit]");
    try {
      setLoading(submitBtn, true);
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email, pass);
      await ensureUserDoc(auth.currentUser);        // make sure users/{uid} exists/updates
      window.location.href = "index.html";
    } catch (err) {
      showError(loginForm, err.message);
    } finally {
      setLoading(submitBtn, false);
    }
  });
}

// ---------- GOOGLE (login or signup) ----------
const googleBtn = $("#btn-google");
if (googleBtn) {
  googleBtn.addEventListener("click", async () => {
    try {
      setLoading(googleBtn, true);
      await setPersistence(auth, browserLocalPersistence);
      const cred = await signInWithPopup(auth, provider);
      await ensureUserDoc(cred.user);
      window.location.href = "index.html";
    } catch (err) {
      const form = loginForm || $("#signup-form");
      showError(form, err.message);
    } finally {
      setLoading(googleBtn, false);
    }
  });
}

// ---------- SIGNUP ----------
const signupForm = $("#signup-form");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name  = $("#name")?.value.trim();
    const email = $("#email")?.value.trim();
    const pass  = $("#password")?.value;

    const submitBtn = signupForm.querySelector("button[type=submit]");
    try {
      setLoading(submitBtn, true);
      await setPersistence(auth, browserLocalPersistence);
      const cred = await createUserWithEmailAndPassword(auth, email, pass);

      if (name) {
        try { await updateProfile(cred.user, { displayName: name }); } catch {}
      }
      await ensureUserDoc(cred.user, name);

      window.location.href = "index.html";
    } catch (err) {
      showError(signupForm, err.message);
    } finally {
      setLoading(submitBtn, false);
    }
  });
}

// ---------- Auth redirect guard ----------
// ---------- Auth redirect + ensure profile ----------
onAuthStateChanged(auth, async (user) => {
  try {
    if (user) {
      // safety net: guarantees users/{uid} exists & updates updatedAt
      await ensureUserDoc(user);
    }
  } catch (e) {
    console.error("ensureUserDoc failed:", e);
  }

  const page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const isAuthPage = page === "login.html" || page === "signup.html";
  if (user && isAuthPage) window.location.replace("index.html");
  // If you also want to protect the dashboard:
  // if (!user && page === "index.html") window.location.replace("login.html");
});

