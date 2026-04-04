import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCpdefg_swRO9ui-ltlCNCaZeZA1L4b8EQ",
  authDomain: "fitbsync.firebaseapp.com",
  projectId: "fitbsync",
  storageBucket: "fitbsync.firebasestorage.app",
  messagingSenderId: "1021625356667",
  appId: "1:1021625356667:web:1cad1ccbc2f5427ca3adde",
  measurementId: "G-P33MNLB1W3"
};

let app, db;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log("Firebase initialized successfully");
} catch (e) {
  console.error("Firebase initialization error:", e);
}

export { db, doc, setDoc, getDoc, onSnapshot };
