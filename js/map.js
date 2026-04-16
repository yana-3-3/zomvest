// ============================================
// SVG 맵 렌더링
// ============================================

let currentPlayerMarker = null;
let currentLocations = {};

export function renderMap(container, locations, currentLocId, onLocationClick) {
  currentLocations = locations;
  container.innerHTML = '';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 800 600');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  // -------- 정의 (그라디언트, 패턴) --------
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <radialGradient id="grad-terrain" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#e8dcc0"/>
      <stop offset="60%" stop-color="#d6c5a3"/>
      <stop offset="100%" stop-color="#b5a180"/>
    </radialGradient>
    <linearGradient id="grad-water" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#a8c8dc"/>
      <stop offset="100%" stop-color="#7aa3c2"/>
    </linearGradient>
    <linearGradient id="grad-mountain" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#a0937a"/>
      <stop offset="100%" stop-color="#6b604c"/>
    </linearGradient>
    <radialGradient id="grad-ruins" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#8a7e68"/>
      <stop offset="100%" stop-color="#5f5440"/>
    </radialGradient>
    <radialGradient id="grad-village" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#c2632e"/>
      <stop offset="100%" stop-color="#8f4820"/>
    </radialGradient>
    <linearGradient id="grad-lab" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#9ec1b8"/>
      <stop offset="100%" stop-color="#6b8e85"/>
    </linearGradient>
    <radialGradient id="grad-home" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#8ab370"/>
      <stop offset="100%" stop-color="#4a6b35"/>
    </radialGradient>
    <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="0.8" fill="#8a7f6a" opacity="0.3"/>
    </pattern>
  `;
  svg.appendChild(defs);

  // -------- 배경 (황무지 지형) --------
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('x', 0); bg.setAttribute('y', 0);
  bg.setAttribute('width', 800); bg.setAttribute('height', 600);
  bg.setAttribute('fill', 'url(#grad-terrain)');
  svg.appendChild(bg);

  // 바닥 텍스처
  const tex = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  tex.setAttribute('x', 0); tex.setAttribute('y', 0);
  tex.setAttribute('width', 800); tex.setAttribute('height', 600);
  tex.setAttribute('fill', 'url(#dots)');
  svg.appendChild(tex);

  // -------- 지형 (강, 호수, 산) --------
  // 강
  const river = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  river.setAttribute('d',
    'M 20 180 Q 120 200, 180 220 T 280 260 Q 320 280, 280 320 T 240 400 Q 220 460, 180 520 L 120 580 L 80 580 Q 100 500, 130 440 Q 160 380, 180 320 Q 200 270, 150 230 Q 80 210, 20 210 Z'
  );
  river.setAttribute('fill', 'url(#grad-water)');
  river.setAttribute('opacity', '0.85');
  svg.appendChild(river);

  // 호수
  const lake = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  lake.setAttribute('cx', 620); lake.setAttribute('cy', 470);
  lake.setAttribute('rx', 90); lake.setAttribute('ry', 60);
  lake.setAttribute('fill', 'url(#grad-water)');
  lake.setAttribute('opacity', '0.85');
  svg.appendChild(lake);

  // 산맥 (여러 삼각형)
  const mountains = [
    { x: 280, y: 120, w: 80, h: 80 },
    { x: 340, y: 80, w: 90, h: 90 },
    { x: 420, y: 110, w: 70, h: 70 },
    { x: 150, y: 90, w: 60, h: 60 }
  ];
  mountains.forEach(m => {
    const mountain = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    mountain.setAttribute('points', `${m.x - m.w/2},${m.y + m.h/2} ${m.x},${m.y - m.h/2} ${m.x + m.w/2},${m.y + m.h/2}`);
    mountain.setAttribute('fill', 'url(#grad-mountain)');
    mountain.setAttribute('opacity', '0.7');
    svg.appendChild(mountain);

    // 산 정상 눈
    const snow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    const snowTop = m.y - m.h/2;
    const snowBot = snowTop + m.h * 0.25;
    const snowWidth = m.w * 0.25;
    snow.setAttribute('points', `${m.x - snowWidth},${snowBot} ${m.x},${snowTop} ${m.x + snowWidth},${snowBot}`);
    snow.setAttribute('fill', '#f5f1e8');
    snow.setAttribute('opacity', '0.9');
    svg.appendChild(snow);
  });

  // 나무 그룹 (장식)
  const trees = [
    {x: 50, y: 380}, {x: 70, y: 440}, {x: 30, y: 320},
    {x: 480, y: 380}, {x: 510, y: 420}, {x: 470, y: 440},
    {x: 720, y: 380}, {x: 740, y: 330}, {x: 760, y: 410},
    {x: 580, y: 80}, {x: 610, y: 130}, {x: 650, y: 100}
  ];
  trees.forEach(t => {
    const trunk = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    trunk.setAttribute('x', t.x - 1.5); trunk.setAttribute('y', t.y);
    trunk.setAttribute('width', 3); trunk.setAttribute('height', 8);
    trunk.setAttribute('fill', '#6b5440');
    svg.appendChild(trunk);
    const crown = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    crown.setAttribute('cx', t.x); crown.setAttribute('cy', t.y - 2);
    crown.setAttribute('r', 6);
    crown.setAttribute('fill', '#6b8e4e');
    crown.setAttribute('opacity', '0.8');
    svg.appendChild(crown);
  });

  // 길 (장소들을 연결하는 점선)
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d',
    'M 400 300 L 180 220 M 400 300 L 620 450 M 400 300 L 280 420 M 400 300 L 520 180 M 400 300 L 680 280 M 400 300 L 120 450 M 400 300 L 460 540 M 400 300 L 360 100'
  );
  path.setAttribute('stroke', '#8a7f6a');
  path.setAttribute('stroke-width', '1.5');
  path.setAttribute('stroke-dasharray', '4 4');
  path.setAttribute('fill', 'none');
  path.setAttribute('opacity', '0.4');
  svg.appendChild(path);

  // -------- 장소 마커 --------
  for (const loc of Object.values(locations)) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'map-location');
    g.setAttribute('data-loc', loc.id);
    g.setAttribute('transform', `translate(${loc.x}, ${loc.y})`);
    g.style.cursor = 'pointer';

    // 장소 타입별 렌더링
    const marker = renderLocationMarker(loc);
    g.appendChild(marker);

    // 라벨
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('class', 'map-location-label');
    label.setAttribute('x', 0);
    label.setAttribute('y', 32);
    label.setAttribute('text-anchor', 'middle');
    label.textContent = loc.name;
    // 가독성을 위한 배경
    const labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    const textLen = loc.name.length * 7 + 8;
    labelBg.setAttribute('x', -textLen / 2);
    labelBg.setAttribute('y', 22);
    labelBg.setAttribute('width', textLen);
    labelBg.setAttribute('height', 14);
    labelBg.setAttribute('fill', '#fdfaf2');
    labelBg.setAttribute('opacity', '0.85');
    labelBg.setAttribute('rx', 3);
    g.appendChild(labelBg);
    g.appendChild(label);

    if (loc.id === currentLocId) g.classList.add('active');

    g.addEventListener('click', () => {
      if (onLocationClick) onLocationClick(loc.id);
    });

    svg.appendChild(g);
  }

  // -------- 플레이어 마커 --------
  const playerLoc = locations[currentLocId] || locations.home;
  const playerMarker = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  playerMarker.setAttribute('class', 'player-marker');
  playerMarker.setAttribute('transform', `translate(${playerLoc.x}, ${playerLoc.y - 25})`);
  playerMarker.innerHTML = `
    <circle cx="0" cy="0" r="10" fill="#d4a04a" opacity="0.3"/>
    <circle cx="0" cy="0" r="6" fill="#d4a04a" stroke="#fdfaf2" stroke-width="2"/>
    <text x="0" y="-14" text-anchor="middle" fill="#2d2a24" font-size="11" font-weight="700">YOU</text>
  `;
  svg.appendChild(playerMarker);
  currentPlayerMarker = playerMarker;

  container.appendChild(svg);
}

function renderLocationMarker(loc) {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

  switch (loc.type) {
    case 'home': {
      // 집 모양
      const bg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      bg.setAttribute('class', 'map-location-bg');
      bg.setAttribute('cx', 0); bg.setAttribute('cy', 0);
      bg.setAttribute('r', 18);
      bg.setAttribute('fill', 'url(#grad-home)');
      bg.setAttribute('stroke', '#4a6b35');
      bg.setAttribute('stroke-width', '2');
      g.appendChild(bg);
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      icon.setAttribute('x', 0); icon.setAttribute('y', 5);
      icon.setAttribute('text-anchor', 'middle');
      icon.setAttribute('font-size', '18');
      icon.textContent = '🏡';
      g.appendChild(icon);
      break;
    }
    case 'water': {
      const bg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      bg.setAttribute('class', 'map-location-bg');
      bg.setAttribute('cx', 0); bg.setAttribute('cy', 0);
      bg.setAttribute('r', 14);
      bg.setAttribute('fill', '#fdfaf2');
      bg.setAttribute('stroke', '#7aa3c2');
      bg.setAttribute('stroke-width', '2');
      g.appendChild(bg);
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      icon.setAttribute('x', 0); icon.setAttribute('y', 5);
      icon.setAttribute('text-anchor', 'middle');
      icon.setAttribute('font-size', '16');
      icon.textContent = '🎣';
      g.appendChild(icon);
      break;
    }
    case 'ruins': {
      // 폐허 - 사각형 + 금 간 모양
      const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bg.setAttribute('class', 'map-location-bg');
      bg.setAttribute('x', -16); bg.setAttribute('y', -16);
      bg.setAttribute('width', 32); bg.setAttribute('height', 32);
      bg.setAttribute('fill', 'url(#grad-ruins)');
      bg.setAttribute('stroke', '#5f5440');
      bg.setAttribute('stroke-width', '2');
      bg.setAttribute('rx', 2);
      g.appendChild(bg);
      // 금 간 선
      const crack = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      crack.setAttribute('d', 'M -10 -16 L -5 -5 L -12 5 L 5 10');
      crack.setAttribute('stroke', '#2d2a24');
      crack.setAttribute('stroke-width', '1');
      crack.setAttribute('fill', 'none');
      crack.setAttribute('opacity', '0.4');
      g.appendChild(crack);
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      icon.setAttribute('x', 0); icon.setAttribute('y', 5);
      icon.setAttribute('text-anchor', 'middle');
      icon.setAttribute('font-size', '16');
      icon.textContent = '🏚️';
      g.appendChild(icon);
      break;
    }
    case 'village': {
      // 마을 - 세모 지붕
      const bg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      bg.setAttribute('class', 'map-location-bg');
      bg.setAttribute('cx', 0); bg.setAttribute('cy', 0);
      bg.setAttribute('r', 18);
      bg.setAttribute('fill', 'url(#grad-village)');
      bg.setAttribute('stroke', '#8f4820');
      bg.setAttribute('stroke-width', '2');
      g.appendChild(bg);
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      icon.setAttribute('x', 0); icon.setAttribute('y', 5);
      icon.setAttribute('text-anchor', 'middle');
      icon.setAttribute('font-size', '18');
      icon.textContent = '🏘️';
      g.appendChild(icon);
      break;
    }
    case 'lab': {
      // 연구소 - 다이아몬드
      const bg = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      bg.setAttribute('class', 'map-location-bg');
      bg.setAttribute('points', '0,-18 18,0 0,18 -18,0');
      bg.setAttribute('fill', 'url(#grad-lab)');
      bg.setAttribute('stroke', '#6b8e85');
      bg.setAttribute('stroke-width', '2');
      g.appendChild(bg);
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      icon.setAttribute('x', 0); icon.setAttribute('y', 5);
      icon.setAttribute('text-anchor', 'middle');
      icon.setAttribute('font-size', '16');
      icon.textContent = '🧪';
      g.appendChild(icon);
      break;
    }
    case 'wilderness': {
      const bg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      bg.setAttribute('class', 'map-location-bg');
      bg.setAttribute('cx', 0); bg.setAttribute('cy', 0);
      bg.setAttribute('r', 14);
      bg.setAttribute('fill', '#fdfaf2');
      bg.setAttribute('stroke', '#6b8e4e');
      bg.setAttribute('stroke-width', '2');
      g.appendChild(bg);
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      icon.setAttribute('x', 0); icon.setAttribute('y', 5);
      icon.setAttribute('text-anchor', 'middle');
      icon.setAttribute('font-size', '16');
      icon.textContent = '🌲';
      g.appendChild(icon);
      break;
    }
  }

  return g;
}

// 플레이어 마커 위치 업데이트
export function setPlayerMarkerTo(locId) {
  const loc = currentLocations[locId];
  if (!loc || !currentPlayerMarker) return;
  currentPlayerMarker.setAttribute('transform', `translate(${loc.x}, ${loc.y - 25})`);
  // active 클래스 업데이트
  document.querySelectorAll('.map-location').forEach(g => {
    g.classList.toggle('active', g.dataset.loc === locId);
  });
}
