// db.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
const db   = getFirestore(app);

export { app, auth, db };
