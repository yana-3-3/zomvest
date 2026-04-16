// ============================================
// 요리 시스템 + 타이밍 미니게임
// ============================================

import { ITEMS, RECIPES, STATUS_EFFECTS } from './data.js';

// -------- 콜백 (game.js에서 주입) --------
let gameAPI = null;

export function initCooking(api) {
  // api: { getPlayer, addItem, removeItem, addSkillXp, addStatusEffect, log, toast, openModal, closeModal, queueSave, renderAll }
  gameAPI = api;
}

// -------- 요리 스킬 기반 파라미터 --------
// 레벨 1 → 클릭 횟수 그대로, 세이프존 좁음
// 레벨 15 → 클릭 횟수 -2 (최소 1회), 세이프존 +80%
function getCookingParams(skillLevel, recipe) {
  const reductionLevel = Math.floor((skillLevel - 1) / 4); // 1, 5, 9, 13레벨에서 1번씩 감소
  const clicks = Math.max(1, recipe.minigameClicks - reductionLevel);

  // 세이프존 크기 (전체 바의 %)
  const baseSafeZone = 0.16;  // 16%
  const bonusPerLevel = 0.012; // 레벨당 +1.2%
  const safeZoneSize = Math.min(0.45, baseSafeZone + (skillLevel - 1) * bonusPerLevel);

  // 퍼펙트존 크기 (세이프존 안에 있음)
  const perfectSize = safeZoneSize * 0.35;

  // 인디케이터 속도 (ms로 바를 한 번 왕복하는 시간)
  const baseSpeed = 1800;
  const speed = Math.max(900, baseSpeed - (skillLevel - 1) * 60);

  return { clicks, safeZoneSize, perfectSize, speed };
}

// -------- 재료 보유 체크 --------
function checkIngredients(recipe, inventory) {
  const missing = [];
  const has = [];
  for (const [itemId, need] of Object.entries(recipe.ingredients)) {
    const found = inventory.find(e => e.id === itemId);
    const got = found ? found.count : 0;
    (got >= need ? has : missing).push({ id: itemId, need, got });
  }
  return { canMake: missing.length === 0, has, missing };
}

// -------- 요리 모달 (레시피 목록) --------
export function openCookingMenu() {
  const player = gameAPI.getPlayer();
  const cookLevel = player.skills.cooking.level;

  // 레시피를 "가능 / 재료부족 / 레벨부족" 3그룹으로 분류
  const available = [];
  const missing = [];
  const locked = [];

  for (const recipe of RECIPES) {
    if (cookLevel < recipe.minSkill) {
      locked.push(recipe);
      continue;
    }
    const check = checkIngredients(recipe, player.inventory);
    if (check.canMake) available.push({ recipe, check });
    else missing.push({ recipe, check });
  }

  let html = `
    <p style="font-size:13px;color:var(--text-secondary);margin-bottom:14px;">
      요리 Lv. ${cookLevel} · 성공 시 버프 음식을 얻을 수 있다.
    </p>
    <div class="recipe-list">
  `;

  // 가능한 것
  for (const { recipe, check } of available) {
    html += renderRecipeCard(recipe, check, 'available', cookLevel);
  }
  // 재료 부족
  for (const { recipe, check } of missing) {
    html += renderRecipeCard(recipe, check, 'missing', cookLevel);
  }
  // 레벨 부족
  for (const recipe of locked) {
    html += renderRecipeCard(recipe, null, 'locked', cookLevel);
  }

  html += `</div>`;

  gameAPI.openModal('요리', html);

  // 클릭 이벤트
  document.querySelectorAll('.recipe-card.available').forEach(card => {
    card.addEventListener('click', () => {
      const rid = card.dataset.recipe;
      const recipe = RECIPES.find(r => r.id === rid);
      if (recipe) startCookingMinigame(recipe);
    });
  });
}

function renderRecipeCard(recipe, check, status, cookLevel) {
  const result = ITEMS[recipe.result];
  const params = getCookingParams(cookLevel, recipe);

  let ingredientsHtml = '';
  if (check) {
    ingredientsHtml = Object.entries(recipe.ingredients).map(([id, need]) => {
      const item = ITEMS[id];
      const found = check.has.find(h => h.id === id) || check.missing.find(m => m.id === id);
      const got = found ? found.got : 0;
      const cls = got >= need ? 'has' : 'lack';
      return `<span class="ingredient-chip ${cls}">${item.icon} ${item.name} ${got}/${need}</span>`;
    }).join(' ');
  } else {
    // 레벨 잠김
    ingredientsHtml = Object.entries(recipe.ingredients).map(([id, need]) => {
      const item = ITEMS[id];
      return `<span class="ingredient-chip">${item.icon} ${item.name} ×${need}</span>`;
    }).join(' ');
  }

  let actionLabel;
  if (status === 'available') actionLabel = '조리 시작';
  else if (status === 'missing') actionLabel = '재료 부족';
  else actionLabel = `Lv.${recipe.minSkill} 필요`;

  // 버프 표시
  let buffHtml = '';
  if (result.effect && result.effect.buff) {
    const buffDef = STATUS_EFFECTS[result.effect.buff];
    if (buffDef) buffHtml = ` · ${buffDef.icon} ${buffDef.name}`;
  }

  return `
    <div class="recipe-card ${status}" data-recipe="${recipe.id}">
      <div class="recipe-icon">${result.icon}</div>
      <div class="recipe-info">
        <h4>${recipe.name}</h4>
        <div class="recipe-meta">
          <span>⏱ ${Math.floor(recipe.time / 1000)}초</span>
          <span>🎯 ${params.clicks}회 타이밍</span>
          <span>❤️ +${result.effect?.hp || 0} 🍖 +${result.effect?.hunger || 0}${buffHtml}</span>
        </div>
        <div class="recipe-ingredients">${ingredientsHtml}</div>
      </div>
      <div class="recipe-action">${actionLabel}</div>
    </div>
  `;
}

// ============================================
// 타이밍 미니게임
// ============================================

function startCookingMinigame(recipe) {
  const player = gameAPI.getPlayer();
  const cookLevel = player.skills.cooking.level;
  const params = getCookingParams(cookLevel, recipe);
  const result = ITEMS[recipe.result];

  // 재료 미리 차감 (실패해도 재료는 소모됨 — 게임성을 위해)
  for (const [id, need] of Object.entries(recipe.ingredients)) {
    gameAPI.removeItem(id, need);
  }

  // 상태
  const state = {
    recipe,
    params,
    currentClick: 0,
    totalClicks: params.clicks,
    hits: [],           // 'perfect' | 'good' | 'miss'
    indicatorPos: 0,    // 0~1
    direction: 1,
    lastFrameTime: 0,
    safeZoneStart: 0,   // 0~1 (매 라운드 랜덤)
    rafId: null,
    finished: false
  };

  renderMinigameUI(state, result);
  newRound(state);
  animate(state);
}

function renderMinigameUI(state, result) {
  const html = `
    <div class="cook-game">
      <div class="cook-stage">
        <div class="cook-dish-icon">${result.icon}</div>
        <div class="cook-step-info">${state.recipe.name}을(를) 조리 중...</div>
        <div class="cook-step-count">
          <span id="cook-step-current">1</span> / ${state.totalClicks}
        </div>
        <div class="cook-progress"><div class="cook-progress-fill" id="cook-progress"></div></div>
      </div>

      <div class="timing-bar" id="timing-bar">
        <div class="timing-zone" id="timing-zone"></div>
        <div class="timing-zone perfect" id="timing-zone-perfect"></div>
        <div class="timing-indicator" id="timing-indicator"></div>
      </div>

      <button class="btn btn-primary cook-hit-btn" id="cook-hit">지금!</button>

      <div class="cook-result" id="cook-result">&nbsp;</div>
    </div>
  `;
  gameAPI.openModal('조리 중', html);

  // 버튼 & 스페이스바로 타격
  const hitBtn = document.getElementById('cook-hit');
  hitBtn.addEventListener('click', () => hit(state));
  state.keyHandler = (e) => {
    if (e.code === 'Space' && !state.finished) {
      e.preventDefault();
      hit(state);
    }
  };
  document.addEventListener('keydown', state.keyHandler);
}

function newRound(state) {
  // 새 라운드 → 세이프존 위치 랜덤
  const zoneSize = state.params.safeZoneSize;
  state.safeZoneStart = Math.random() * (1 - zoneSize);
  state.indicatorPos = 0;
  state.direction = 1;

  const zone = document.getElementById('timing-zone');
  const perfectZone = document.getElementById('timing-zone-perfect');
  if (zone && perfectZone) {
    zone.style.left = (state.safeZoneStart * 100) + '%';
    zone.style.width = (zoneSize * 100) + '%';
    // 퍼펙트존은 세이프존 중앙
    const perfectStart = state.safeZoneStart + (zoneSize - state.params.perfectSize) / 2;
    perfectZone.style.left = (perfectStart * 100) + '%';
    perfectZone.style.width = (state.params.perfectSize * 100) + '%';
  }
}

function animate(state) {
  state.lastFrameTime = performance.now();

  function frame(now) {
    if (state.finished) return;
    const dt = now - state.lastFrameTime;
    state.lastFrameTime = now;

    // 속도 = 전체 바(1)를 params.speed ms에 이동
    const delta = (dt / state.params.speed) * state.direction;
    state.indicatorPos += delta;
    if (state.indicatorPos >= 1) { state.indicatorPos = 1; state.direction = -1; }
    if (state.indicatorPos <= 0) { state.indicatorPos = 0; state.direction = 1; }

    const indicator = document.getElementById('timing-indicator');
    if (indicator) indicator.style.left = `calc(${state.indicatorPos * 100}% - 2px)`;

    state.rafId = requestAnimationFrame(frame);
  }
  state.rafId = requestAnimationFrame(frame);
}

function hit(state) {
  if (state.finished) return;
  const pos = state.indicatorPos;
  const zoneStart = state.safeZoneStart;
  const zoneEnd = zoneStart + state.params.safeZoneSize;
  const perfectStart = zoneStart + (state.params.safeZoneSize - state.params.perfectSize) / 2;
  const perfectEnd = perfectStart + state.params.perfectSize;

  let result;
  if (pos >= perfectStart && pos <= perfectEnd) result = 'perfect';
  else if (pos >= zoneStart && pos <= zoneEnd) result = 'good';
  else result = 'miss';

  state.hits.push(result);

  // 결과 표시
  const resEl = document.getElementById('cook-result');
  resEl.className = 'cook-result ' + result;
  resEl.textContent = { perfect: '✨ PERFECT!', good: '👍 GOOD!', miss: '✗ MISS...' }[result];

  // 진행도 업데이트
  state.currentClick++;
  const progressEl = document.getElementById('cook-progress');
  if (progressEl) progressEl.style.width = (state.currentClick / state.totalClicks * 100) + '%';
  const stepEl = document.getElementById('cook-step-current');
  if (stepEl) stepEl.textContent = Math.min(state.currentClick + 1, state.totalClicks);

  // 잠깐 정지 후 다음 라운드 또는 완료
  cancelAnimationFrame(state.rafId);
  setTimeout(() => {
    if (state.currentClick >= state.totalClicks) {
      finishCooking(state);
    } else {
      resEl.textContent = '\u00a0';
      resEl.className = 'cook-result';
      newRound(state);
      animate(state);
    }
  }, 600);
}

function finishCooking(state) {
  state.finished = true;
  cancelAnimationFrame(state.rafId);
  document.removeEventListener('keydown', state.keyHandler);

  // 히트 결과 집계
  const perfect = state.hits.filter(h => h === 'perfect').length;
  const good = state.hits.filter(h => h === 'good').length;
  const miss = state.hits.filter(h => h === 'miss').length;
  const total = state.hits.length;
  const successRatio = (perfect + good) / total;

  // 품질 등급
  let quality;
  if (miss === 0 && perfect === total) quality = 'perfect';
  else if (miss === 0) quality = 'good';
  else if (successRatio >= 0.5) quality = 'normal';
  else quality = 'burnt';

  const recipe = state.recipe;
  const result = ITEMS[recipe.result];

  // 품질에 따라 결과
  let producedItem = null;
  let xpGain = 0;
  let qualityLabel, qualityDesc, qualityIcon;

  if (quality === 'perfect') {
    producedItem = recipe.result;
    xpGain = 30;
    qualityLabel = '완벽한 ' + result.name;
    qualityIcon = '✨';
    qualityDesc = `최상급! ${result.effect?.hp ? `체력 +${Math.floor(result.effect.hp * 1.5)}` : ''} 효과 강화.`;
    // 완벽 품질은 버프가 있으면 1.5배 hp/hunger
  } else if (quality === 'good') {
    producedItem = recipe.result;
    xpGain = 20;
    qualityLabel = '잘 된 ' + result.name;
    qualityIcon = '👍';
    qualityDesc = '훌륭한 음식이 완성되었다.';
  } else if (quality === 'normal') {
    producedItem = recipe.result;
    xpGain = 10;
    qualityLabel = '그럭저럭한 ' + result.name;
    qualityIcon = result.icon;
    qualityDesc = '먹을 만은 하다.';
  } else {
    producedItem = null;
    xpGain = 3;
    qualityLabel = '탄 ' + result.name;
    qualityIcon = '🔥';
    qualityDesc = '먹을 수 없게 되어 버렸다...';
  }

  // 인벤토리에 추가
  if (producedItem) {
    const added = gameAPI.addItem(producedItem, 1);
    if (!added) {
      gameAPI.toast('인벤토리가 가득 차서 요리를 챙기지 못했다!', 'warn');
    }
  }

  // 완벽 등급에 임시 플래그로 저장 (추후 사용 시 효과 강화 가능 — 현재는 단순 버프)
  // 여기서는 단순화를 위해 퍼펙트 시 well_fed 버프 즉시 부여
  if (quality === 'perfect') {
    gameAPI.addStatusEffect('hearty_meal');
  }

  gameAPI.addSkillXp('cooking', xpGain);
  if (producedItem) {
    gameAPI.log(`${qualityIcon} ${qualityLabel}을(를) 완성했다! (XP +${xpGain})`, 'good');
  } else {
    gameAPI.log(`${qualityIcon} ${qualityLabel}... 요리를 망쳤다. (XP +${xpGain})`, 'bad');
  }

  // 결과 화면
  const html = `
    <div class="cook-complete">
      <div class="cook-complete-icon">${qualityIcon}</div>
      <div class="cook-complete-quality ${quality}">${qualityLabel}</div>
      <div class="cook-complete-desc">${qualityDesc}</div>
      <div style="display:flex;justify-content:center;gap:12px;font-size:12px;color:var(--text-secondary);margin-bottom:18px;">
        <span>✨ ${perfect}</span>
        <span>👍 ${good}</span>
        <span>✗ ${miss}</span>
        <span>· XP +${xpGain}</span>
      </div>
      <div style="display:flex;gap:8px;justify-content:center;">
        <button class="btn btn-primary" id="cook-again">다시 요리하기</button>
        <button class="btn btn-ghost" id="cook-done">완료</button>
      </div>
    </div>
  `;
  gameAPI.openModal('완성!', html);
  document.getElementById('cook-again').addEventListener('click', () => openCookingMenu());
  document.getElementById('cook-done').addEventListener('click', () => gameAPI.closeModal());

  gameAPI.queueSave();
  gameAPI.renderAll();
}
