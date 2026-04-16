// ============================================
// 절차적 월드 맵 — SVG 아이콘 기반
// 시드 고정으로 모든 유저가 동일한 맵 공유
// ============================================

import { WORLD, LOCATION_TYPES, TRADER_POOL } from './data.js';

// =========================================================
// 시드 기반 난수 (mulberry32)
// =========================================================
function mulberry32(seed) {
  let a = seed >>> 0;
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// 문자열 → 시드
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// =========================================================
// 월드 생성
// =========================================================
let _world = null;
export function getWorld() {
  if (_world) return _world;
  _world = generateWorld();
  return _world;
}

function generateWorld() {
  const rng = mulberry32(WORLD.seed);
  const W = WORLD.width, H = WORLD.height;

  // 산맥 — 맵 가장자리 근처에 배치
  const mountains = [];
  for (let i = 0; i < WORLD.mountainRanges; i++) {
    const side = Math.floor(rng() * 4); // 0:상, 1:하, 2:좌, 3:우
    let cx, cy;
    if (side === 0) { cx = rng() * W; cy = rng() * (H * 0.25); }
    else if (side === 1) { cx = rng() * W; cy = H - rng() * (H * 0.25); }
    else if (side === 2) { cx = rng() * (W * 0.25); cy = rng() * H; }
    else { cx = W - rng() * (W * 0.25); cy = rng() * H; }
    // 산맥은 여러 봉우리의 묶음
    const peaks = [];
    const numPeaks = 4 + Math.floor(rng() * 5);
    const angle = rng() * Math.PI * 2;
    for (let j = 0; j < numPeaks; j++) {
      const dist = j * (40 + rng() * 30);
      peaks.push({
        x: cx + Math.cos(angle) * dist + (rng() - 0.5) * 40,
        y: cy + Math.sin(angle) * dist + (rng() - 0.5) * 40,
        size: 45 + rng() * 55
      });
    }
    mountains.push({ peaks });
  }

  // 강줄기 — 맵 한 변에서 다른 변으로 흐르는 곡선
  const rivers = [];
  const numRivers = 2;
  for (let i = 0; i < numRivers; i++) {
    // 시작/끝 점을 각기 다른 변에서
    const startSide = Math.floor(rng() * 4);
    const endSide = (startSide + 2) % 4; // 반대편
    const start = sideCoord(startSide, rng, W, H);
    const end = sideCoord(endSide, rng, W, H);
    // 중간 제어점 2개
    const cp1 = { x: rng() * W, y: rng() * H };
    const cp2 = { x: rng() * W, y: rng() * H };
    rivers.push({ start, end, cp1, cp2 });
  }

  // 호수
  const lakes = [];
  for (let i = 0; i < WORLD.lakes; i++) {
    lakes.push({
      x: 200 + rng() * (W - 400),
      y: 200 + rng() * (H - 400),
      rx: 60 + rng() * 50,
      ry: 40 + rng() * 40,
      rot: rng() * 360
    });
  }

  // 숲
  const forests = [];
  for (let i = 0; i < WORLD.forests; i++) {
    forests.push({
      x: 150 + rng() * (W - 300),
      y: 150 + rng() * (H - 300),
      r: 80 + rng() * 120,
      trees: 12 + Math.floor(rng() * 18)
    });
  }

  // =========================================================
  // 장소 배치 (서로 최소 거리 유지)
  // =========================================================
  const locations = [];
  const minDist = 180;

  function placeLocation(type, count) {
    const def = LOCATION_TYPES[type];
    for (let i = 0; i < count; i++) {
      let tries = 0;
      while (tries < 80) {
        const x = 100 + rng() * (W - 200);
        const y = 100 + rng() * (H - 200);
        let ok = true;
        for (const l of locations) {
          const dx = l.x - x, dy = l.y - y;
          if (dx*dx + dy*dy < minDist * minDist) { ok = false; break; }
        }
        if (ok) {
          const nameIdx = Math.floor(rng() * def.names.length);
          const id = `${type}_${i}`;
          const loc = {
            id,
            type,
            name: def.names[nameIdx],
            x, y,
            actions: def.actions.slice(),
            danger: def.danger || 0
          };
          // 마을이라면 상인 고정 할당
          if (type === 'village') {
            const traderKeys = Object.keys(TRADER_POOL);
            const t = traderKeys[Math.floor(rng() * traderKeys.length)];
            loc.trader = t;
            loc.name = TRADER_POOL[t].name + '의 ' + loc.name;
          }
          locations.push(loc);
          break;
        }
        tries++;
      }
    }
  }

  placeLocation('village',    WORLD.villages);
  placeLocation('ruins_mall', WORLD.ruinsMalls);
  placeLocation('ruins_city', WORLD.ruinsCity);
  placeLocation('ruins_farm', WORLD.farmsteads);
  placeLocation('lab',        WORLD.labs);

  // 강/호수 근처에 "강변/호숫가" 장소도 몇 개 자동 생성
  // (지형을 활용하게 만들기 위함)
  const waterSpots = [];
  for (const lake of lakes) {
    waterSpots.push({
      id: `lake_spot_${lakes.indexOf(lake)}`,
      type: 'lake',
      name: LOCATION_TYPES.lake.names[Math.floor(rng() * LOCATION_TYPES.lake.names.length)],
      x: lake.x + Math.cos(rng() * Math.PI * 2) * (lake.rx + 20),
      y: lake.y + Math.sin(rng() * Math.PI * 2) * (lake.ry + 20),
      actions: LOCATION_TYPES.lake.actions.slice()
    });
  }
  // 강에 낚시 포인트 여러 개
  for (let i = 0; i < WORLD.riverBends; i++) {
    const river = rivers[i % rivers.length];
    const t = rng();
    const pt = bezierPoint(river.start, river.cp1, river.cp2, river.end, t);
    waterSpots.push({
      id: `river_spot_${i}`,
      type: 'river',
      name: LOCATION_TYPES.river.names[Math.floor(rng() * LOCATION_TYPES.river.names.length)],
      x: pt.x, y: pt.y,
      actions: LOCATION_TYPES.river.actions.slice()
    });
  }

  locations.push(...waterSpots);

  // 숲 중심에 탐색 가능한 숲 지점도 추가
  for (let i = 0; i < Math.min(6, forests.length); i++) {
    const f = forests[i];
    locations.push({
      id: `forest_spot_${i}`,
      type: 'forest',
      name: LOCATION_TYPES.forest.names[Math.floor(rng() * LOCATION_TYPES.forest.names.length)],
      x: f.x, y: f.y,
      actions: LOCATION_TYPES.forest.actions.slice()
    });
  }

  // 산 정상 근처 탐색 포인트
  mountains.forEach((range, rIdx) => {
    range.peaks.forEach((p, pIdx) => {
      if (pIdx % 2 === 0) {
        locations.push({
          id: `mountain_spot_${rIdx}_${pIdx}`,
          type: 'mountain',
          name: LOCATION_TYPES.mountain.names[Math.floor(rng() * LOCATION_TYPES.mountain.names.length)],
          x: p.x + (rng() - 0.5) * 40,
          y: p.y + (rng() - 0.5) * 40,
          actions: LOCATION_TYPES.mountain.actions.slice()
        });
      }
    });
  });

  return { width: W, height: H, mountains, rivers, lakes, forests, locations };
}

function sideCoord(side, rng, W, H) {
  if (side === 0) return { x: rng() * W, y: 0 };
  if (side === 1) return { x: rng() * W, y: H };
  if (side === 2) return { x: 0, y: rng() * H };
  return { x: W, y: rng() * H };
}

function bezierPoint(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return {
    x: u*u*u*p0.x + 3*u*u*t*p1.x + 3*u*t*t*p2.x + t*t*t*p3.x,
    y: u*u*u*p0.y + 3*u*u*t*p1.y + 3*u*t*t*p2.y + t*t*t*p3.y
  };
}

// =========================================================
// SVG 렌더링
// =========================================================
const NS = 'http://www.w3.org/2000/svg';

// 뷰포트 상태 (카메라)
let camera = {
  x: 1200, y: 900,   // 월드 좌표계에서 화면 중심
  zoom: 1,           // 0.4 ~ 2.0
  vpWidth: 1,
  vpHeight: 1
};

let svgRoot = null;
let worldGroup = null;      // 월드 트랜스폼 그룹 (panning/zoom)
let playerMarker = null;
let homeMarker = null;
let onLocationClickCb = null;
let onEmptyClickCb = null;  // 빈 곳 클릭 시 (정착 후보)
let currentPlayerPos = { x: 1200, y: 900 };
let currentHomePos = null;

// =========================================================
// SVG 아이콘 정의 — 장소 타입별 고유한 실루엣
// =========================================================
function makeIcon(type, g) {
  switch (type) {
    case 'village': {
      // 지붕+몸체 = 작은 마을 실루엣 (건물 2채)
      const g1 = document.createElementNS(NS, 'g');
      g1.innerHTML = `
        <rect x="-14" y="-4" width="12" height="14" fill="#c2632e" stroke="#5a2a0f" stroke-width="1.2"/>
        <polygon points="-15,-4 -8,-13 -1,-4" fill="#8f4820" stroke="#5a2a0f" stroke-width="1.2"/>
        <rect x="-9" y="2" width="3" height="5" fill="#fdfaf2"/>
        <rect x="1" y="-2" width="14" height="12" fill="#d97a4e" stroke="#5a2a0f" stroke-width="1.2"/>
        <polygon points="0,-2 8,-11 16,-2" fill="#8f4820" stroke="#5a2a0f" stroke-width="1.2"/>
        <rect x="6" y="3" width="4" height="6" fill="#fdfaf2"/>
      `;
      g.appendChild(g1);
      break;
    }
    case 'home': {
      const g1 = document.createElementNS(NS, 'g');
      g1.innerHTML = `
        <rect x="-10" y="-2" width="20" height="14" fill="#8ab370" stroke="#2d4a1d" stroke-width="1.2"/>
        <polygon points="-12,-2 0,-14 12,-2" fill="#4a6b35" stroke="#2d4a1d" stroke-width="1.2"/>
        <rect x="-3" y="4" width="6" height="8" fill="#5a3820"/>
        <rect x="-8" y="-8" width="2" height="6" fill="#d4a04a"/>
      `;
      g.appendChild(g1);
      break;
    }
    case 'ruins_mall': {
      // 무너진 사각 건물
      const g1 = document.createElementNS(NS, 'g');
      g1.innerHTML = `
        <rect x="-14" y="-8" width="28" height="14" fill="#8a7f6a" stroke="#3d362a" stroke-width="1.2"/>
        <polygon points="-14,-8 -8,-12 -2,-9 4,-13 10,-8 14,-10 14,-8" fill="#3d362a"/>
        <rect x="-10" y="-2" width="3" height="4" fill="#2d2a24"/>
        <rect x="-4" y="-4" width="3" height="5" fill="#2d2a24"/>
        <rect x="4" y="-2" width="3" height="4" fill="#2d2a24"/>
        <line x1="-14" y1="-3" x2="14" y2="-3" stroke="#3d362a" stroke-width="0.5"/>
      `;
      g.appendChild(g1);
      break;
    }
    case 'ruins_city': {
      // 무너진 고층 건물 3개
      const g1 = document.createElementNS(NS, 'g');
      g1.innerHTML = `
        <polygon points="-14,8 -14,-6 -10,-10 -6,-4 -6,8" fill="#6b604c" stroke="#3d362a" stroke-width="1.2"/>
        <polygon points="-5,8 -5,-14 -1,-18 3,-10 3,8" fill="#8a7e68" stroke="#3d362a" stroke-width="1.2"/>
        <polygon points="4,8 4,-8 9,-12 14,-4 14,8" fill="#6b604c" stroke="#3d362a" stroke-width="1.2"/>
        <rect x="-11" y="-4" width="1.5" height="2" fill="#2d2a24"/>
        <rect x="-11" y="0" width="1.5" height="2" fill="#2d2a24"/>
        <rect x="-3" y="-10" width="1.5" height="2" fill="#2d2a24"/>
        <rect x="-3" y="-6" width="1.5" height="2" fill="#2d2a24"/>
        <rect x="-3" y="-2" width="1.5" height="2" fill="#2d2a24"/>
        <rect x="6" y="-4" width="1.5" height="2" fill="#2d2a24"/>
        <rect x="6" y="0" width="1.5" height="2" fill="#2d2a24"/>
      `;
      g.appendChild(g1);
      break;
    }
    case 'ruins_farm': {
      // 기울어진 헛간 + 울타리
      const g1 = document.createElementNS(NS, 'g');
      g1.innerHTML = `
        <polygon points="-11,6 -11,-4 -5,-4 -1,-10 7,-10 11,-4 11,6" fill="#a0745a" stroke="#3d2818" stroke-width="1.2" transform="rotate(-4)"/>
        <rect x="-3" y="-4" width="4" height="8" fill="#3d2818" transform="rotate(-4)"/>
        <line x1="-14" y1="7" x2="14" y2="7" stroke="#5a3820" stroke-width="1.2"/>
        <line x1="-10" y1="5" x2="-10" y2="9" stroke="#5a3820" stroke-width="1"/>
        <line x1="12" y1="5" x2="12" y2="9" stroke="#5a3820" stroke-width="1"/>
      `;
      g.appendChild(g1);
      break;
    }
    case 'lab': {
      // 원통형 저장탱크 + 굴뚝
      const g1 = document.createElementNS(NS, 'g');
      g1.innerHTML = `
        <rect x="-12" y="-6" width="14" height="14" fill="#9ec1b8" stroke="#2d4a45" stroke-width="1.2"/>
        <ellipse cx="-5" cy="-6" rx="7" ry="2" fill="#6b8e85" stroke="#2d4a45" stroke-width="1.2"/>
        <rect x="4" y="-12" width="4" height="20" fill="#6b8e85" stroke="#2d4a45" stroke-width="1.2"/>
        <circle cx="-5" cy="1" r="2.5" fill="#d4a04a" stroke="#2d4a45" stroke-width="1"/>
        <text x="-5" y="3" text-anchor="middle" font-size="5" font-weight="700" fill="#2d4a45">!</text>
      `;
      g.appendChild(g1);
      break;
    }
    case 'lake': {
      // 물결 무늬
      const g1 = document.createElementNS(NS, 'g');
      g1.innerHTML = `
        <ellipse cx="0" cy="0" rx="14" ry="9" fill="#a8c8dc" stroke="#3d5a72" stroke-width="1.2"/>
        <path d="M -8 -2 Q -4 -4, 0 -2 T 8 -2" stroke="#3d5a72" stroke-width="0.8" fill="none"/>
        <path d="M -6 3 Q -2 1, 2 3 T 8 3" stroke="#3d5a72" stroke-width="0.8" fill="none"/>
      `;
      g.appendChild(g1);
      break;
    }
    case 'river': {
      // 낚싯대 + 물결
      const g1 = document.createElementNS(NS, 'g');
      g1.innerHTML = `
        <ellipse cx="0" cy="3" rx="12" ry="4" fill="#a8c8dc" stroke="#3d5a72" stroke-width="1"/>
        <line x1="-8" y1="-8" x2="4" y2="4" stroke="#5a3820" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="4" y1="4" x2="6" y2="8" stroke="#3d5a72" stroke-width="0.8"/>
        <circle cx="6" cy="8" r="1.5" fill="#c2632e"/>
      `;
      g.appendChild(g1);
      break;
    }
    case 'mountain': {
      // 날카로운 봉우리
      const g1 = document.createElementNS(NS, 'g');
      g1.innerHTML = `
        <polygon points="-14,8 -4,-10 2,-2 8,-12 14,8" fill="#8a7f6a" stroke="#3d362a" stroke-width="1.2"/>
        <polygon points="-6,-5 -4,-10 -2,-6" fill="#fdfaf2"/>
        <polygon points="6,-8 8,-12 10,-7" fill="#fdfaf2"/>
      `;
      g.appendChild(g1);
      break;
    }
    case 'forest': {
      // 침엽수 3그루
      const g1 = document.createElementNS(NS, 'g');
      g1.innerHTML = `
        <polygon points="-10,8 -10,2 -6,-10 -2,2 -2,8" fill="#4a6b35" stroke="#2d4a1d" stroke-width="1"/>
        <polygon points="-4,8 -4,0 0,-14 4,0 4,8" fill="#6b8e4e" stroke="#2d4a1d" stroke-width="1"/>
        <polygon points="2,8 2,3 6,-8 10,3 10,8" fill="#4a6b35" stroke="#2d4a1d" stroke-width="1"/>
      `;
      g.appendChild(g1);
      break;
    }
    default: {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', 8);
      c.setAttribute('fill', '#8a7f6a');
      g.appendChild(c);
    }
  }
}

// =========================================================
// 초기 렌더링
// =========================================================
export function initMap(container, opts) {
  const {
    initialX, initialY, homeX, homeY,
    onLocationClick, onEmptyClick
  } = opts;

  onLocationClickCb = onLocationClick;
  onEmptyClickCb = onEmptyClick;
  currentPlayerPos = { x: initialX, y: initialY };
  if (homeX != null && homeY != null) currentHomePos = { x: homeX, y: homeY };

  const world = getWorld();

  // 뷰포트 계산
  const rect = container.getBoundingClientRect();
  camera.vpWidth = rect.width;
  camera.vpHeight = rect.height;
  camera.x = initialX;
  camera.y = initialY;

  container.innerHTML = '';

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.style.display = 'block';
  svg.style.background = '#ebe0c8';
  svg.style.cursor = 'grab';
  svgRoot = svg;

  // 월드 그룹 (이게 panning/zoom의 대상)
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('class', 'world-group');
  svg.appendChild(g);
  worldGroup = g;

  // 지형 렌더링
  renderTerrain(g, world);

  // 장소 렌더링
  for (const loc of world.locations) {
    renderLocation(g, loc);
  }

  // 거점 마커
  if (currentHomePos) {
    renderHome(g, currentHomePos.x, currentHomePos.y);
  }

  // 플레이어 마커
  renderPlayer(g, currentPlayerPos.x, currentPlayerPos.y);

  container.appendChild(svg);

  updateViewport();
  setupInteraction(container, svg);
}

function renderTerrain(g, world) {
  // 바닥 전체
  const bg = document.createElementNS(NS, 'rect');
  bg.setAttribute('x', 0); bg.setAttribute('y', 0);
  bg.setAttribute('width', world.width); bg.setAttribute('height', world.height);
  bg.setAttribute('fill', '#ebe0c8');
  g.appendChild(bg);

  // 바닥 얼룩 무늬 (아주 크게 뭉친 패치들)
  const patchRng = mulberry32(WORLD.seed + 1);
  for (let i = 0; i < 40; i++) {
    const px = patchRng() * world.width;
    const py = patchRng() * world.height;
    const pr = 80 + patchRng() * 160;
    const e = document.createElementNS(NS, 'ellipse');
    e.setAttribute('cx', px); e.setAttribute('cy', py);
    e.setAttribute('rx', pr); e.setAttribute('ry', pr * (0.6 + patchRng() * 0.5));
    e.setAttribute('fill', patchRng() > 0.5 ? '#d6c9a8' : '#c8b991');
    e.setAttribute('opacity', 0.35);
    g.appendChild(e);
  }

  // 숲 (녹색 덩어리 + 나무 점들)
  for (const f of world.forests) {
    const base = document.createElementNS(NS, 'ellipse');
    base.setAttribute('cx', f.x); base.setAttribute('cy', f.y);
    base.setAttribute('rx', f.r); base.setAttribute('ry', f.r * 0.7);
    base.setAttribute('fill', '#6b8e4e');
    base.setAttribute('opacity', 0.35);
    g.appendChild(base);

    // 개별 나무들
    const treeRng = mulberry32(Math.floor(f.x * 10 + f.y));
    for (let i = 0; i < f.trees; i++) {
      const angle = treeRng() * Math.PI * 2;
      const dist = treeRng() * f.r * 0.85;
      const tx = f.x + Math.cos(angle) * dist;
      const ty = f.y + Math.sin(angle) * dist * 0.7;
      const t = document.createElementNS(NS, 'g');
      t.setAttribute('transform', `translate(${tx}, ${ty})`);
      t.innerHTML = `
        <rect x="-1" y="0" width="2" height="6" fill="#5a3820"/>
        <polygon points="-5,2 0,-10 5,2" fill="#4a6b35" stroke="#2d4a1d" stroke-width="0.5"/>
      `;
      g.appendChild(t);
    }
  }

  // 산맥 (봉우리들)
  for (const range of world.mountains) {
    for (const peak of range.peaks) {
      const mt = document.createElementNS(NS, 'g');
      mt.setAttribute('transform', `translate(${peak.x}, ${peak.y})`);
      const s = peak.size;
      // 그림자 베이스
      const shadow = document.createElementNS(NS, 'ellipse');
      shadow.setAttribute('cx', 0); shadow.setAttribute('cy', s * 0.35);
      shadow.setAttribute('rx', s * 0.9); shadow.setAttribute('ry', s * 0.2);
      shadow.setAttribute('fill', '#8a7f6a');
      shadow.setAttribute('opacity', 0.3);
      mt.appendChild(shadow);
      // 봉우리 몸체
      const body = document.createElementNS(NS, 'polygon');
      body.setAttribute('points', `${-s*0.8},${s*0.3} 0,${-s*0.6} ${s*0.8},${s*0.3}`);
      body.setAttribute('fill', '#a0937a');
      body.setAttribute('stroke', '#3d362a');
      body.setAttribute('stroke-width', 1.2);
      mt.appendChild(body);
      // 눈
      const snow = document.createElementNS(NS, 'polygon');
      const sy = -s*0.6, sb = sy + s*0.3;
      const sw = s*0.25;
      snow.setAttribute('points', `${-sw},${sb} 0,${sy} ${sw},${sb}`);
      snow.setAttribute('fill', '#fdfaf2');
      mt.appendChild(snow);
      g.appendChild(mt);
    }
  }

  // 호수
  for (const l of world.lakes) {
    const e = document.createElementNS(NS, 'ellipse');
    e.setAttribute('cx', l.x); e.setAttribute('cy', l.y);
    e.setAttribute('rx', l.rx); e.setAttribute('ry', l.ry);
    e.setAttribute('transform', `rotate(${l.rot} ${l.x} ${l.y})`);
    e.setAttribute('fill', '#a8c8dc');
    e.setAttribute('stroke', '#7a99b0');
    e.setAttribute('stroke-width', 1.5);
    g.appendChild(e);
  }

  // 강 (넓은 곡선)
  for (const r of world.rivers) {
    const path = document.createElementNS(NS, 'path');
    const d = `M ${r.start.x} ${r.start.y} C ${r.cp1.x} ${r.cp1.y}, ${r.cp2.x} ${r.cp2.y}, ${r.end.x} ${r.end.y}`;
    path.setAttribute('d', d);
    path.setAttribute('stroke', '#a8c8dc');
    path.setAttribute('stroke-width', 24);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    g.appendChild(path);
    // 강 테두리
    const path2 = document.createElementNS(NS, 'path');
    path2.setAttribute('d', d);
    path2.setAttribute('stroke', '#7a99b0');
    path2.setAttribute('stroke-width', 26);
    path2.setAttribute('fill', 'none');
    path2.setAttribute('stroke-linecap', 'round');
    path2.setAttribute('opacity', 0.5);
    g.insertBefore(path2, path);
  }
}

function renderLocation(g, loc) {
  const node = document.createElementNS(NS, 'g');
  node.setAttribute('class', 'loc-node');
  node.dataset.locId = loc.id;
  node.setAttribute('transform', `translate(${loc.x}, ${loc.y})`);
  node.style.cursor = 'pointer';

  // 아이콘
  makeIcon(loc.type, node);

  // 이름 라벨 (배경 + 텍스트)
  const labelGroup = document.createElementNS(NS, 'g');
  labelGroup.setAttribute('class', 'loc-label');
  const textLen = Math.max(40, loc.name.length * 7.5);
  const bg = document.createElementNS(NS, 'rect');
  bg.setAttribute('x', -textLen / 2); bg.setAttribute('y', 16);
  bg.setAttribute('width', textLen); bg.setAttribute('height', 16);
  bg.setAttribute('fill', '#fdfaf2');
  bg.setAttribute('stroke', '#c9bfa8');
  bg.setAttribute('stroke-width', 0.8);
  bg.setAttribute('rx', 3);
  bg.setAttribute('opacity', 0.92);
  labelGroup.appendChild(bg);

  const text = document.createElementNS(NS, 'text');
  text.setAttribute('x', 0); text.setAttribute('y', 27);
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('font-family', "'Gowun Batang', serif");
  text.setAttribute('font-size', 11);
  text.setAttribute('font-weight', 700);
  text.setAttribute('fill', '#2d2a24');
  text.textContent = loc.name;
  labelGroup.appendChild(text);
  node.appendChild(labelGroup);

  node.addEventListener('click', (e) => {
    e.stopPropagation();
    if (onLocationClickCb) onLocationClickCb(loc);
  });

  g.appendChild(node);
}

function renderPlayer(g, x, y) {
  const marker = document.createElementNS(NS, 'g');
  marker.setAttribute('class', 'player-marker');
  marker.setAttribute('transform', `translate(${x}, ${y})`);
  marker.innerHTML = `
    <circle r="16" fill="#d4a04a" opacity="0.25"/>
    <circle r="8" fill="#d4a04a" opacity="0.45"/>
    <circle r="4" fill="#c2632e" stroke="#fdfaf2" stroke-width="2"/>
  `;
  g.appendChild(marker);
  playerMarker = marker;
}

function renderHome(g, x, y) {
  const marker = document.createElementNS(NS, 'g');
  marker.setAttribute('class', 'home-marker');
  marker.setAttribute('transform', `translate(${x}, ${y})`);
  marker.innerHTML = `
    <rect x="-10" y="-2" width="20" height="14" fill="#8ab370" stroke="#2d4a1d" stroke-width="1.2"/>
    <polygon points="-12,-2 0,-14 12,-2" fill="#4a6b35" stroke="#2d4a1d" stroke-width="1.2"/>
    <rect x="-3" y="4" width="6" height="8" fill="#5a3820"/>
    <rect x="-8" y="-8" width="2" height="6" fill="#d4a04a"/>
  `;
  // 거점 라벨
  const label = document.createElementNS(NS, 'g');
  label.innerHTML = `
    <rect x="-22" y="15" width="44" height="14" fill="#fdfaf2" stroke="#2d4a1d" stroke-width="0.8" rx="3"/>
    <text x="0" y="25" text-anchor="middle" font-family="'Gowun Batang', serif" font-size="10" font-weight="700" fill="#2d4a1d">내 거점</text>
  `;
  marker.appendChild(label);
  g.appendChild(marker);
  homeMarker = marker;
}

// =========================================================
// 뷰포트/카메라 업데이트
// =========================================================
function updateViewport() {
  if (!svgRoot) return;
  const w = camera.vpWidth / camera.zoom;
  const h = camera.vpHeight / camera.zoom;
  const vx = camera.x - w / 2;
  const vy = camera.y - h / 2;
  svgRoot.setAttribute('viewBox', `${vx} ${vy} ${w} ${h}`);
}

export function centerOnPlayer() {
  camera.x = currentPlayerPos.x;
  camera.y = currentPlayerPos.y;
  updateViewport();
}

export function zoomBy(factor) {
  const newZoom = Math.max(0.35, Math.min(2.5, camera.zoom * factor));
  camera.zoom = newZoom;
  updateViewport();
}

export function setPlayerPos(x, y, animated = true) {
  currentPlayerPos = { x, y };
  if (!playerMarker) return;
  if (animated) {
    playerMarker.style.transition = 'transform 0.4s ease';
  } else {
    playerMarker.style.transition = 'none';
  }
  playerMarker.setAttribute('transform', `translate(${x}, ${y})`);
}

export function setHomePos(x, y) {
  currentHomePos = { x, y };
  if (homeMarker) {
    homeMarker.setAttribute('transform', `translate(${x}, ${y})`);
  } else if (worldGroup) {
    renderHome(worldGroup, x, y);
  }
}

// =========================================================
// 인터랙션: 드래그 팬, 휠 줌, 빈 곳 클릭
// =========================================================
function setupInteraction(container, svg) {
  let isDragging = false;
  let dragStart = { x: 0, y: 0 };
  let camStart = { x: 0, y: 0 };
  let clickStartPos = null;
  let dragDistance = 0;

  svg.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragStart = { x: e.clientX, y: e.clientY };
    camStart = { x: camera.x, y: camera.y };
    clickStartPos = { x: e.clientX, y: e.clientY };
    dragDistance = 0;
    svg.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = (e.clientX - dragStart.x) / camera.zoom;
    const dy = (e.clientY - dragStart.y) / camera.zoom;
    camera.x = camStart.x - dx;
    camera.y = camStart.y - dy;
    // 경계 clamp
    const world = getWorld();
    const vw = camera.vpWidth / camera.zoom / 2;
    const vh = camera.vpHeight / camera.zoom / 2;
    camera.x = Math.max(vw, Math.min(world.width - vw, camera.x));
    camera.y = Math.max(vh, Math.min(world.height - vh, camera.y));
    dragDistance = Math.max(dragDistance, Math.hypot(e.clientX - clickStartPos.x, e.clientY - clickStartPos.y));
    updateViewport();
  });

  window.addEventListener('mouseup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    svg.style.cursor = 'grab';

    // 짧은 클릭이면 빈 곳 클릭 이벤트
    if (dragDistance < 4 && onEmptyClickCb && e.target === svg) {
      const pt = screenToWorld(svg, e.clientX, e.clientY);
      onEmptyClickCb(pt.x, pt.y);
    }
  });

  // 휠 줌
  svg.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.35, Math.min(2.5, camera.zoom * delta));
    // 마우스 위치를 기준으로 줌
    const pt = screenToWorld(svg, e.clientX, e.clientY);
    camera.zoom = newZoom;
    const pt2 = screenToWorld(svg, e.clientX, e.clientY);
    camera.x += pt.x - pt2.x;
    camera.y += pt.y - pt2.y;
    updateViewport();
  }, { passive: false });

  // 터치 지원 (간단)
  let touchStart = null;
  let camStartTouch = null;
  svg.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    touchStart = { x: t.clientX, y: t.clientY };
    camStartTouch = { x: camera.x, y: camera.y };
  });
  svg.addEventListener('touchmove', (e) => {
    if (!touchStart || e.touches.length !== 1) return;
    const t = e.touches[0];
    const dx = (t.clientX - touchStart.x) / camera.zoom;
    const dy = (t.clientY - touchStart.y) / camera.zoom;
    camera.x = camStartTouch.x - dx;
    camera.y = camStartTouch.y - dy;
    updateViewport();
    e.preventDefault();
  }, { passive: false });
  svg.addEventListener('touchend', () => { touchStart = null; });

  // 윈도우 리사이즈
  const ro = new ResizeObserver(() => {
    const rect = container.getBoundingClientRect();
    camera.vpWidth = rect.width;
    camera.vpHeight = rect.height;
    updateViewport();
  });
  ro.observe(container);
}

function screenToWorld(svg, sx, sy) {
  const rect = svg.getBoundingClientRect();
  const relX = sx - rect.left;
  const relY = sy - rect.top;
  const w = camera.vpWidth / camera.zoom;
  const h = camera.vpHeight / camera.zoom;
  const wx = (camera.x - w / 2) + (relX / rect.width) * w;
  const wy = (camera.y - h / 2) + (relY / rect.height) * h;
  return { x: wx, y: wy };
}

// =========================================================
// 주변 장소 찾기 (플레이어 좌표 기준 반경 내)
// =========================================================
export function findNearbyLocation(x, y, radius = 50) {
  const world = getWorld();
  let closest = null;
  let closestDist = radius * radius;
  for (const loc of world.locations) {
    const dx = loc.x - x, dy = loc.y - y;
    const d2 = dx * dx + dy * dy;
    if (d2 < closestDist) {
      closestDist = d2;
      closest = loc;
    }
  }
  return closest;
}

export function getLocationById(id) {
  const world = getWorld();
  return world.locations.find(l => l.id === id) || null;
}
