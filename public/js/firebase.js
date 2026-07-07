// Firebase Web SDK Configuration & Initialisation
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// Firebase Project Configuration keys provided by the user
const firebaseConfig = {
  apiKey: "AIzaSyDesglMm2MaBZx_7LoujaZ0m_vFt9I8k9Y",
  authDomain: "syama-birthday-surprise.firebaseapp.com",
  projectId: "syama-birthday-surprise",
  storageBucket: "syama-birthday-surprise.firebasestorage.app",
  messagingSenderId: "485993846084",
  appId: "1:485993846084:web:00645a80aba2a072b17311",
  measurementId: "G-E3PWSS0T1L"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
