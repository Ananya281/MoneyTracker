// auth.js (standalone for login + signup)

// Firebase SDKs (keep same minor version you're using)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// === Your Firebase config ===
const firebaseConfig = {
  apiKey: "AIzaSyAFVHLv9lWa69One_nrqxhhkN6qx4elku4",
  authDomain: "money-tracker-daea2.firebaseapp.com",
  projectId: "money-tracker-daea2",
  storageBucket: "money-tracker-daea2.appspot.com",
  messagingSenderId: "1082584224577",
  appId: "1:1082584224577:web:4f6f7ebaa648d73b9b87c0",
  measurementId: "G-WZGRY77CJQ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
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
  el.textContent = msg.replace("Firebase:", "").trim();
}
function setLoading(btn, loading) {
  if (!btn) return;
  btn.disabled = loading;
  btn.style.opacity = loading ? "0.7" : "1";
}

// ---------- LOGIN PAGE ----------
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

// Google on login/signup
["#btn-google"].forEach((sel) => {
  const btn = $(sel);
  if (btn) {
    btn.addEventListener("click", async () => {
      // Persist login across tabs/sessions by default
      try {
        setLoading(btn, true);
        await setPersistence(auth, browserLocalPersistence);
        await signInWithPopup(auth, provider);
        window.location.href = "index.html";
      } catch (err) {
        const form = loginForm || $("#signup-form");
        showError(form, err.message);
      } finally {
        setLoading(btn, false);
      }
    });
  }
});

// ---------- SIGNUP PAGE ----------
const signupForm = $("#signup-form");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name  = $("#name")?.value.trim();            // optional, store later in profile/DB
    const email = $("#email")?.value.trim();
    const pass  = $("#password")?.value;

    const submitBtn = signupForm.querySelector("button[type=submit]");
    try {
      setLoading(submitBtn, true);
      // Keep new signups logged in across sessions
      await setPersistence(auth, browserLocalPersistence);
      await createUserWithEmailAndPassword(auth, email, pass);
      // TODO: you can update profile with displayName if needed via updateProfile(auth.currentUser, { displayName: name })
      window.location.href = "index.html";
    } catch (err) {
      showError(signupForm, err.message);
    } finally {
      setLoading(submitBtn, false);
    }
  });
}

// ---------- Auth guard / redirect ----------
onAuthStateChanged(auth, (user) => {
  const page = location.pathname.split("/").pop() || "index.html";
  const isAuthPage = page === "login.html" || page === "signup.html";
  if (user && isAuthPage) {
    // already logged in → go to app
    window.location.replace("index.html");
  }
  // If you want to protect the dashboard:
  // if (!user && page === "index.html") window.location.replace("login.html");
});
