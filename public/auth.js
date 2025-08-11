// auth.js — login + signup (uses the shared app from db.js)
import { auth } from "./db.js";
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

const provider = new GoogleAuthProvider();

// ---------- helpers ----------
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
      await signInWithPopup(auth, provider);
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
      await createUserWithEmailAndPassword(auth, email, pass);

      // optional: save display name
      if (name) {
        try { await updateProfile(auth.currentUser, { displayName: name }); } catch {}
      }

      window.location.href = "index.html";
    } catch (err) {
      showError(signupForm, err.message);
    } finally {
      setLoading(submitBtn, false);
    }
  });
}

// ---------- Auth redirect guard ----------
onAuthStateChanged(auth, (user) => {
  const page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const isAuthPage = page === "login.html" || page === "signup.html";
  if (user && isAuthPage) window.location.replace("index.html");
  // If you also want to protect the dashboard:
  // if (!user && page === "index.html") window.location.replace("login.html");
});
