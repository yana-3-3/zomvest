// ============================================
// Firebase 설정 및 초기화
// ============================================
// ⚠️ 여기 있는 firebaseConfig는 자신의 Firebase 프로젝트로 교체해야 합니다.
// Firebase 콘솔 → 프로젝트 설정 → 일반 → 웹 앱 → SDK 설정에서 복사
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  addDoc,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// ⚠️ 여기를 자신의 Firebase 프로젝트 설정으로 바꿔주세요 ⚠️
const firebaseConfig = {
  apiKey: "AIzaSyATflBFMqQX8jJSZ7o-tB3FglDTUyP6a9g",
  authDomain: "zomvest.firebaseapp.com",
  projectId: "zomvest",
  storageBucket: "zomvest.firebasestorage.app",
  messagingSenderId: "425701162895",
  appId: "1:425701162895:web:e0148d52b878d4d5b055fa"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 전역 export
export {
  app, auth, db,
  // auth 함수들
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  // firestore 함수들
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  addDoc,
  orderBy,
  limit
};
