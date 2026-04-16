# 🧟 Last Harvest — 좀비 아포칼립스 생존 게임

좀비 아포칼립스 세계에서 낚시, 농사, 요리, 탐색, 거래, 전투를 통해 살아남는 웹 기반 멀티플레이 생존 게임입니다.

## 🎮 현재 구현된 기능 (MVP)

- ✅ Firebase 인증 (이메일 로그인/회원가입)
- ✅ Firestore 기반 플레이어 데이터 저장/로드
- ✅ SVG 맵 (폐허, 산, 강, 호수, 마을, 연구소, 거점 등 9곳)
- ✅ 장소 간 이동
- ✅ 6가지 스킬 시스템 (낚시/요리/농사/교류/전투/탐색, 최대 15레벨)
- ✅ 상태(체력/포만감/수분/감염도) 시스템과 시간 경과에 따른 자동 감소
- ✅ 인벤토리 (20칸, 스택 가능)
- ✅ 버프/디버프 시스템
- ✅ 감염 시스템 + 백신
- ✅ 사망 → 좀비화 → 부활 (죽은 캐릭터는 Firestore `zombies` 컬렉션에 기록)
- ✅ 낚시(간이 버전), 탐색(파밍), 휴식 액션
- ✅ 깔끔한 밝은 톤 UI, 반응형 레이아웃
- ✅ 액션 로그 + 토스트 알림

## 🚧 다음 단계에서 구현할 것

- 낚시 미니게임 (타이밍 바)
- 요리 미니게임 (타이밍 버튼 시퀀스)
- 농사 시간 대기 시스템 (작물 성장 타이머)
- 전투 시스템 (좀비/무뢰배와의 실시간 전투)
- 거래 UI (NPC 상점, 흥정 시스템)
- 유저 간 채팅 (Firestore 실시간)
- 유저 간 거래 (트레이드 요청)
- 좀비화된 유저 추적 & 처치 시스템
- 공동 마을 (여러 유저가 함께 건설)

## 🚀 설치 방법

### 1. Firebase 프로젝트 생성

1. [Firebase 콘솔](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. **Authentication** 활성화 → "이메일/비밀번호" 방식 활성화
3. **Firestore Database** 생성 (테스트 모드로 시작 가능, 나중에 보안 규칙 적용)
4. 프로젝트 설정 → **일반** → **내 앱** → 웹 앱 추가(`</>` 아이콘)
5. `firebaseConfig` 객체 복사

### 2. 설정 파일 수정

`js/firebase.js` 파일을 열고 `firebaseConfig` 객체를 본인 프로젝트 설정으로 교체:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123...",
  appId: "1:123:..."
};
```

### 3. Firestore 보안 규칙 (권장)

Firestore → 규칙 탭에서 아래 규칙 적용:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 플레이어 데이터: 본인만 읽기/쓰기
    match /players/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    // 좀비 기록: 모두 읽기, 인증된 사용자만 쓰기
    match /zombies/{zombieId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    // 채팅 (추후 추가)
    match /chats/{chatId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. GitHub Pages에 배포

```bash
# 1. GitHub에 새 repository 생성 (예: last-harvest)
# 2. 로컬에서
cd zombie-survival
git init
git add .
git commit -m "Initial commit: Last Harvest MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/last-harvest.git
git push -u origin main

# 3. GitHub repository Settings → Pages
#    Source: Deploy from a branch
#    Branch: main / (root)
#    → 몇 분 후 https://YOUR_USERNAME.github.io/last-harvest/ 에서 접속 가능
```

### 5. Firebase 승인 도메인 추가

Firebase 콘솔 → Authentication → Settings → **승인된 도메인**에 GitHub Pages 도메인(`YOUR_USERNAME.github.io`) 추가.

## 📁 파일 구조

```
zombie-survival/
├── index.html              # 로그인 페이지
├── game.html               # 게임 메인 화면
├── css/
│   └── style.css           # 전체 스타일
├── js/
│   ├── firebase.js         # Firebase 초기화
│   ├── auth.js             # 로그인/회원가입 로직
│   ├── data.js             # 게임 정적 데이터 (아이템/스킬/장소 등)
│   ├── game.js             # 게임 메인 로직
│   └── map.js              # SVG 맵 렌더링
└── README.md
```

## 🎨 디자인 컨셉

- **팔레트**: 바랜 종이(#f5f1e8) + 이끼 초록(#6b8e4e) + 녹슨 오렌지(#c2632e)
- **폰트**: Rozha One (타이틀), Gowun Batang (본문), Noto Sans KR (UI)
- **톤**: 어둡지 않은 포스트 아포칼립틱. 희망이 남아있는 세계.

## 🧪 로컬 테스트

ES 모듈을 사용하기 때문에 `file://`로 직접 열면 CORS 오류가 발생합니다.
로컬 서버로 실행:

```bash
# Python
python -m http.server 8000
# Node
npx serve
# VS Code
# → Live Server 확장 사용
```

그 후 `http://localhost:8000/` 접속.

## 🔒 로컬 테스트용 임시 모드

Firebase 설정 없이 UI만 확인하고 싶다면, `js/firebase.js`에서 config 값을 설정하지 않은 채로 빌드하면 인증이 실패하므로, 반드시 위의 Firebase 설정 단계를 먼저 진행하세요.

---

즐거운 생존 되세요, 생존자여. ☘️
