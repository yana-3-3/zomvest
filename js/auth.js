// ============================================
// 인증 (로그인 / 회원가입)
// ============================================

import {
  auth, db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  doc, setDoc, getDoc, serverTimestamp
} from './firebase.js';

import { createNewPlayerData } from './data.js';

const tabs = document.querySelectorAll('.auth-tab');
const forms = document.querySelectorAll('.auth-form');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const msgBox = document.getElementById('auth-message');

// 탭 전환
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    tabs.forEach(t => t.classList.toggle('active', t === tab));
    forms.forEach(f => f.classList.toggle('active', f.id === `${target}-form`));
    showMessage('', '');
  });
});

function showMessage(text, type = '') {
  msgBox.textContent = text;
  msgBox.className = 'auth-message ' + type;
}

// 이미 로그인되어 있으면 게임으로 리다이렉트
onAuthStateChanged(auth, (user) => {
  if (user) {
    // 현재 페이지가 index.html일 때만 리다이렉트
    if (!location.pathname.includes('game.html')) {
      location.href = 'game.html';
    }
  }
});

// 회원가입
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nickname = document.getElementById('register-nickname').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;

  if (!nickname || !email || !password) return;

  try {
    showMessage('등록 중...', '');
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    // 초기 플레이어 데이터 생성
    const newPlayer = createNewPlayerData(nickname);
    await setDoc(doc(db, 'players', user.uid), {
      ...newPlayer,
      uid: user.uid,
      email: email,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    });

    showMessage('생존자 등록 완료!', 'success');
    setTimeout(() => { location.href = 'game.html'; }, 600);

  } catch (err) {
    console.error(err);
    showMessage(firebaseErrorMessage(err), 'error');
  }
});

// 로그인
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) return;

  try {
    showMessage('입장 중...', '');
    const cred = await signInWithEmailAndPassword(auth, email, password);

    // lastLoginAt 업데이트
    const pref = doc(db, 'players', cred.user.uid);
    const snap = await getDoc(pref);
    if (snap.exists()) {
      await setDoc(pref, { lastLoginAt: serverTimestamp() }, { merge: true });
    } else {
      // 만약 플레이어 문서가 없다면 (오래된 계정 등) 기본값으로 생성
      const newPlayer = createNewPlayerData(email.split('@')[0]);
      await setDoc(pref, {
        ...newPlayer,
        uid: cred.user.uid,
        email: email,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      });
    }

    showMessage('환영합니다!', 'success');
    setTimeout(() => { location.href = 'game.html'; }, 400);

  } catch (err) {
    console.error(err);
    showMessage(firebaseErrorMessage(err), 'error');
  }
});

// Firebase 에러 메시지 한글화
function firebaseErrorMessage(err) {
  const code = err.code || '';
  const map = {
    'auth/email-already-in-use': '이미 등록된 이메일입니다.',
    'auth/invalid-email': '이메일 형식이 올바르지 않습니다.',
    'auth/weak-password': '비밀번호는 6자 이상이어야 합니다.',
    'auth/user-not-found': '등록되지 않은 이메일입니다.',
    'auth/wrong-password': '비밀번호가 일치하지 않습니다.',
    'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않습니다.',
    'auth/too-many-requests': '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.',
    'auth/network-request-failed': '네트워크 연결을 확인해주세요.'
  };
  return map[code] || ('오류: ' + (err.message || code || '알 수 없는 오류'));
}
