// auth.js (standalone)

// Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ✅ Your config (bucket is .appspot.com, not firebasestorage.app)
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

// Google provider
const provider = new GoogleAuthProvider();

// Helpers to safely bind (page pe element ho tabhi bind ho)
const byId = (id) => document.getElementById(id);

// Login
const loginForm = byId("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = byId("email").value.trim();
    const pass  = byId("password").value.trim();
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      window.location.href = "index.html";
    } catch (err) {
      alert(err.message.replace("Firebase:", "").trim());
    }
  });
}

// Signup (button that uses same email/password inputs)
const signupBtn = byId("signup-btn");
if (signupBtn) {
  signupBtn.addEventListener("click", async () => {
    const email = byId("email").value.trim();
    const pass  = byId("password").value.trim();
    if (!email || !pass) return alert("Enter email and password");
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      window.location.href = "index.html";
    } catch (err) {
      alert(err.message.replace("Firebase:", "").trim());
    }
  });
}

// Google Login
const googleBtn = byId("btn-google");
if (googleBtn) {
  googleBtn.addEventListener("click", async () => {
    try {
      await signInWithPopup(auth, provider);
      window.location.href = "index.html";
    } catch (err) {
      alert(err.message.replace("Firebase:", "").trim());
    }
  });
}

// Already logged in? send to dashboard
onAuthStateChanged(auth, (user) => {
  const page = location.pathname.split("/").pop();
  if (user && (page === "login.html" || page === "signup.html" || page === "")) {
    window.location.href = "index.html";
  }
});
