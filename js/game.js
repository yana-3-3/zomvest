// ============================================
// 게임 메인 로직
// ============================================

import {
  auth, db,
  onAuthStateChanged, signOut,
  doc, getDoc, setDoc, updateDoc, serverTimestamp
} from './firebase.js';

import {
  SKILLS, MAX_SKILL_LEVEL, xpToNext,
  ITEMS, LOCATIONS, STATUS_EFFECTS, FORAGE_LOOT, FISHING_POOL, RECIPES
} from './data.js';

import { renderMap, setPlayerMarkerTo } from './map.js';

// -------- 전역 게임 상태 --------
const state = {
  uid: null,
  player: null,         // Firestore의 플레이어 데이터
  saveTimer: null,      // 디바운스 저장 타이머
  tickTimer: null       // 주기적 상태 갱신
};

// -------- DOM --------
const els = {
  playerName: document.getElementById('player-name'),
  currentLocation: document.getElementById('current-location'),
  logoutBtn: document.getElementById('btn-logout'),

  hpFill: document.getElementById('hp-fill'),
  hpText: document.getElementById('hp-text'),
  hungerFill: document.getElementById('hunger-fill'),
  hungerText: document.getElementById('hunger-text'),
  thirstFill: document.getElementById('thirst-fill'),
  thirstText: document.getElementById('thirst-text'),
  infectionFill: document.getElementById('infection-fill'),
  infectionText: document.getElementById('infection-text'),

  skillList: document.getElementById('skill-list'),
  buffList: document.getElementById('buff-list'),
  inventoryGrid: document.getElementById('inventory-grid'),
  invUsed: document.getElementById('inv-used'),
  invMax: document.getElementById('inv-max'),

  actionLog: document.getElementById('action-log'),
  mapWrapper: document.getElementById('map-wrapper'),

  modalBackdrop: document.getElementById('modal-backdrop'),
  modal: document.getElementById('modal'),
  modalTitle: document.getElementById('modal-title'),
  modalBody: document.getElementById('modal-body'),
  modalClose: document.getElementById('modal-close'),

  toastContainer: document.getElementById('toast-container')
};

// 액션 버튼들
const actionButtons = {
  fish:   document.getElementById('act-fish'),
  farm:   document.getElementById('act-farm'),
  cook:   document.getElementById('act-cook'),
  forage: document.getElementById('act-forage'),
  trade:  document.getElementById('act-trade'),
  rest:   document.getElementById('act-rest')
};

// ============================================
// 초기화
// ============================================

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = 'index.html';
    return;
  }
  state.uid = user.uid;
  await loadPlayer();
  initUI();
  startTick();
});

async function loadPlayer() {
  const ref = doc(db, 'players', state.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    log('플레이어 데이터를 찾을 수 없습니다. 다시 로그인해주세요.', 'bad');
    return;
  }
  state.player = snap.data();

  // 죽은 상태로 접속했을 때 처리: 일단 리스폰 모달
  if (state.player.alive === false) {
    showRespawnModal();
  }
}

function initUI() {
  renderMap(els.mapWrapper, LOCATIONS, state.player.location, (locId) => {
    travelTo(locId);
  });

  els.playerName.textContent = state.player.nickname || '생존자';
  renderAll();

  // 이벤트 바인딩
  els.logoutBtn.addEventListener('click', async () => {
    await saveImmediately();
    await signOut(auth);
    location.href = 'index.html';
  });

  els.modalClose.addEventListener('click', closeModal);
  els.modalBackdrop.addEventListener('click', (e) => {
    if (e.target === els.modalBackdrop) closeModal();
  });

  // 액션 버튼 연결 (일단 더미, 차차 각 모듈 연결)
  actionButtons.fish.addEventListener('click',   () => tryAction('fish'));
  actionButtons.farm.addEventListener('click',   () => tryAction('farm'));
  actionButtons.cook.addEventListener('click',   () => tryAction('cook'));
  actionButtons.forage.addEventListener('click', () => tryAction('forage'));
  actionButtons.trade.addEventListener('click',  () => tryAction('trade'));
  actionButtons.rest.addEventListener('click',   () => tryAction('rest'));

  updateActionAvailability();
}

// ============================================
// 렌더링
// ============================================

function renderAll() {
  renderStats();
  renderSkills();
  renderBuffs();
  renderInventory();
  els.currentLocation.textContent = '📍 ' + (LOCATIONS[state.player.location]?.name || '???');
  setPlayerMarkerTo(state.player.location);
  updateActionAvailability();
}

function renderStats() {
  const p = state.player;
  setBar(els.hpFill, els.hpText, p.hp, p.maxHp);
  setBar(els.hungerFill, els.hungerText, p.hunger, p.maxHunger);
  setBar(els.thirstFill, els.thirstText, p.thirst, p.maxThirst);
  // 감염은 역방향 (높을수록 나쁨)
  const infPct = (p.infection / p.maxInfection) * 100;
  els.infectionFill.style.width = infPct + '%';
  els.infectionText.textContent = `${Math.floor(p.infection)}/${p.maxInfection}`;
}

function setBar(fillEl, textEl, value, max) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  fillEl.style.width = pct + '%';
  textEl.textContent = `${Math.floor(value)}/${max}`;
}

function renderSkills() {
  els.skillList.innerHTML = '';
  for (const [key, meta] of Object.entries(SKILLS)) {
    const s = state.player.skills[key] || { level: 1, xp: 0 };
    const needed = xpToNext(s.level);
    const pct = s.level >= MAX_SKILL_LEVEL ? 100 : (s.xp / needed) * 100;
    const li = document.createElement('li');
    li.className = 'skill-item';
    li.innerHTML = `
      <span class="skill-icon">${meta.icon}</span>
      <span class="skill-name">${meta.name}</span>
      <span class="skill-level">Lv ${s.level}</span>
      <div class="skill-progress"><div class="skill-progress-fill" style="width:${pct}%"></div></div>
    `;
    li.title = s.level >= MAX_SKILL_LEVEL ? '최대 레벨' : `${s.xp} / ${needed} XP`;
    els.skillList.appendChild(li);
  }
}

function renderBuffs() {
  els.buffList.innerHTML = '';
  const effects = state.player.statusEffects || [];
  if (!effects.length) {
    els.buffList.innerHTML = '<li class="buff-empty">효과 없음</li>';
    return;
  }
  for (const eff of effects) {
    const def = STATUS_EFFECTS[eff.id];
    if (!def) continue;
    const li = document.createElement('li');
    li.className = 'buff-item ' + def.type;
    let timerText = '';
    if (def.duration > 0 && eff.startAt) {
      const remaining = Math.max(0, (eff.startAt + def.duration * 1000) - Date.now());
      timerText = Math.ceil(remaining / 1000) + 's';
    } else {
      timerText = '∞';
    }
    li.innerHTML = `
      <span>${def.icon}</span>
      <span>${def.name}</span>
      <span class="buff-timer">${timerText}</span>
    `;
    li.title = def.description;
    els.buffList.appendChild(li);
  }
}

function renderInventory() {
  els.inventoryGrid.innerHTML = '';
  const inv = state.player.inventory || [];
  const max = state.player.inventoryMax || 20;
  els.invUsed.textContent = inv.length;
  els.invMax.textContent = max;

  for (let i = 0; i < max; i++) {
    const slot = document.createElement('div');
    const entry = inv[i];
    if (entry) {
      const item = ITEMS[entry.id];
      if (!item) { slot.className = 'inv-slot empty'; els.inventoryGrid.appendChild(slot); continue; }
      slot.className = 'inv-slot';
      slot.innerHTML = `
        <span>${item.icon}</span>
        ${entry.count > 1 ? `<span class="inv-count-badge">${entry.count}</span>` : ''}
      `;
      slot.title = `${item.name}${entry.count > 1 ? ' ×' + entry.count : ''}`;
      slot.addEventListener('click', () => showItemModal(entry, i));
    } else {
      slot.className = 'inv-slot empty';
    }
    els.inventoryGrid.appendChild(slot);
  }
}

function updateActionAvailability() {
  const loc = LOCATIONS[state.player.location];
  if (!loc) return;
  const available = loc.actions || [];

  actionButtons.fish.disabled   = !available.includes('fish');
  actionButtons.farm.disabled   = !available.includes('farm');
  actionButtons.cook.disabled   = !available.includes('cook');
  actionButtons.forage.disabled = !available.includes('forage');
  actionButtons.trade.disabled  = !available.includes('trade');
  actionButtons.rest.disabled   = !available.includes('rest');
}

// ============================================
// 액션 (MVP 플레이스홀더 구현)
// ============================================

function tryAction(action) {
  if (!state.player.alive) {
    toast('당신은 죽었다. 부활해야 한다.', 'bad');
    return;
  }
  switch (action) {
    case 'fish':   doFish(); break;
    case 'farm':   doFarm(); break;
    case 'cook':   doCook(); break;
    case 'forage': doForage(); break;
    case 'trade':  doTrade(); break;
    case 'rest':   doRest(); break;
  }
}

// ===== 낚시 (간이 버전 - 차후 미니게임 교체) =====
function doFish() {
  const level = state.player.skills.fishing.level;
  // 자동 낚시는 실패 확률 있음 (레벨 높을수록 낮음)
  const failChance = Math.max(0.05, 0.5 - level * 0.03);
  if (Math.random() < failChance) {
    log('물고기가 도망갔다...', 'system');
    addSkillXp('fishing', 2);
    return;
  }
  // 풀에서 랜덤 선택 (레벨 제한)
  const pool = FISHING_POOL.filter(p => p.minLevel <= level);
  const total = pool.reduce((a, b) => a + b.weight, 0);
  let r = Math.random() * total;
  let picked = pool[0];
  for (const p of pool) {
    r -= p.weight;
    if (r <= 0) { picked = p; break; }
  }
  addItem(picked.id, 1);
  const item = ITEMS[picked.id];
  log(`${item.icon} ${item.name}을(를) 낚았다!`, 'good');
  addSkillXp('fishing', 8 + item.value);
  bumpStat('fishCaught');
  queueSave();
}

// ===== 탐색(포라징) =====
function doForage() {
  const locId = state.player.location;
  const table = FORAGE_LOOT[locId];
  if (!table) { log('여기는 탐색할 수 없다.', 'system'); return; }

  const level = state.player.skills.foraging.level;
  const gained = [];
  for (const row of table) {
    if (row.minSkill && row.minSkill > level) continue;
    // 탐색 레벨이 높을수록 확률 증가 (10% 스케일)
    const bonus = 1 + (level - 1) * 0.05;
    if (Math.random() < Math.min(0.9, row.chance * bonus)) {
      const [lo, hi] = row.amount || [1, 1];
      const amt = Math.floor(lo + Math.random() * (hi - lo + 1));
      addItem(row.item, amt);
      gained.push({ id: row.item, count: amt });
    }
  }

  // 파밍 중 적 조우 확률 (폐허/연구소에서만)
  const loc = LOCATIONS[locId];
  if (loc.type === 'ruins' || loc.type === 'lab') {
    if (Math.random() < 0.3) {
      log('⚠ 근처에서 무언가 움직였다... (전투 시스템은 추후 구현)', 'event');
      // TODO: 전투 트리거
      state.player.hp = Math.max(0, state.player.hp - 5);
    }
  }

  if (gained.length === 0) {
    log('아무것도 찾지 못했다.', 'system');
  } else {
    const summary = gained.map(g => `${ITEMS[g.id].icon} ${ITEMS[g.id].name} ×${g.count}`).join(', ');
    log(`탐색 결과: ${summary}`, 'good');
  }

  addSkillXp('foraging', 10);
  // 탐색은 체력/포만감 소모
  state.player.hunger = Math.max(0, state.player.hunger - 3);
  state.player.thirst = Math.max(0, state.player.thirst - 4);

  queueSave();
  renderAll();
}

// ===== 농사 (플레이스홀더) =====
function doFarm() {
  openModal('농장', `<p>농장 시스템은 다음 단계에서 구현됩니다. 현재 ${state.player.farmPlots?.length || 0}/${state.player.farmPlotsMax} 칸 사용 중.</p>
  <p style="margin-top:10px;color:var(--text-secondary);font-size:13px;">여기에 씨앗 심기/수확하기 UI가 들어갈 예정입니다.</p>`);
}

// ===== 요리 (플레이스홀더) =====
function doCook() {
  openModal('요리', `<p>요리 시스템은 다음 단계에서 미니게임과 함께 구현됩니다.</p>
  <p style="margin-top:10px;color:var(--text-secondary);font-size:13px;">현재 가능한 레시피: ${RECIPES.filter(r => r.minSkill <= state.player.skills.cooking.level).length}개</p>`);
}

// ===== 거래 (플레이스홀더) =====
function doTrade() {
  const loc = LOCATIONS[state.player.location];
  openModal(`거래 - ${loc.name}`, `<p>거래 시스템은 다음 단계에서 구현됩니다.</p>
  <p style="margin-top:10px;color:var(--text-secondary);font-size:13px;">상인: ${loc.trader || '없음'}</p>`);
}

// ===== 휴식 =====
function doRest() {
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + 25);
  state.player.hunger = Math.max(0, state.player.hunger - 5);
  state.player.thirst = Math.max(0, state.player.thirst - 8);
  addStatusEffect('well_rested');
  log('충분한 휴식을 취했다. 기력이 회복되었다.', 'good');
  queueSave();
  renderAll();
}

// ============================================
// 아이템 / 인벤토리
// ============================================

function addItem(id, count = 1) {
  if (!ITEMS[id]) return false;
  const inv = state.player.inventory;
  // 기존 슬롯에 스택 시도
  const existing = inv.find(e => e.id === id);
  if (existing) {
    existing.count += count;
    return true;
  }
  // 새 슬롯
  if (inv.length >= state.player.inventoryMax) {
    toast('인벤토리가 가득 찼다!', 'warn');
    return false;
  }
  inv.push({ id, count });
  return true;
}

function removeItem(id, count = 1) {
  const inv = state.player.inventory;
  const idx = inv.findIndex(e => e.id === id);
  if (idx < 0) return false;
  if (inv[idx].count < count) return false;
  inv[idx].count -= count;
  if (inv[idx].count <= 0) inv.splice(idx, 1);
  return true;
}

function showItemModal(entry, slotIdx) {
  const item = ITEMS[entry.id];
  if (!item) return;
  let html = `
    <div style="display:flex;gap:16px;align-items:center;">
      <div style="font-size:48px;">${item.icon}</div>
      <div>
        <h4 style="margin-bottom:4px;">${item.name} <span style="color:var(--text-muted);font-size:13px;font-weight:400;">×${entry.count}</span></h4>
        <div style="font-size:12px;color:var(--text-secondary);">${categoryLabel(item.category)} · ${rarityLabel(item.rarity)}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">가치: 🪙 ${item.value}</div>
      </div>
    </div>
  `;
  if (item.effect) {
    html += `<div style="margin-top:14px;padding:10px;background:var(--bg-secondary);border-radius:var(--radius-sm);font-size:13px;">효과: ${effectLabel(item.effect)}</div>`;
  }
  // 사용 가능 아이템
  const canUse = item.category === 'food' || item.category === 'consumable' || item.category === 'medicine';
  if (canUse) {
    html += `<div style="margin-top:14px;display:flex;gap:8px;">
      <button class="btn btn-primary" id="btn-use-item">사용하기</button>
      <button class="btn btn-ghost" id="btn-drop-item">버리기</button>
    </div>`;
  } else {
    html += `<div style="margin-top:14px;"><button class="btn btn-ghost" id="btn-drop-item">버리기</button></div>`;
  }

  openModal(item.name, html);

  const useBtn = document.getElementById('btn-use-item');
  if (useBtn) useBtn.addEventListener('click', () => useItem(entry.id));
  const dropBtn = document.getElementById('btn-drop-item');
  if (dropBtn) dropBtn.addEventListener('click', () => { dropItem(entry.id); });
}

function useItem(id) {
  const item = ITEMS[id];
  if (!item || !item.effect) { closeModal(); return; }

  const eff = item.effect;
  const p = state.player;
  if (eff.hp) p.hp = Math.min(p.maxHp, p.hp + eff.hp);
  if (eff.hunger) p.hunger = Math.min(p.maxHunger, p.hunger + eff.hunger);
  if (eff.thirst) p.thirst = Math.min(p.maxThirst, p.thirst + eff.thirst);
  if (eff.infection) p.infection = Math.max(0, p.infection + eff.infection);
  if (eff.curesInfection) { p.infection = 0; removeStatusEffect('infected'); }
  if (eff.buff) addStatusEffect(eff.buff);

  removeItem(id, 1);
  log(`${item.icon} ${item.name}을(를) 사용했다.`, 'good');
  closeModal();
  queueSave();
  renderAll();
}

function dropItem(id) {
  const item = ITEMS[id];
  if (!item) return;
  removeItem(id, 1);
  log(`${item.icon} ${item.name}을(를) 버렸다.`, 'system');
  closeModal();
  queueSave();
  renderAll();
}

// ============================================
// 스킬 / 경험치
// ============================================

function addSkillXp(skillId, amount) {
  const s = state.player.skills[skillId];
  if (!s || s.level >= MAX_SKILL_LEVEL) return;

  // 성찬의 축복 버프로 +20%
  if (hasEffect('hearty_meal')) amount = Math.floor(amount * 1.2);

  s.xp += amount;
  while (s.level < MAX_SKILL_LEVEL && s.xp >= xpToNext(s.level)) {
    s.xp -= xpToNext(s.level);
    s.level += 1;
    log(`🎉 ${SKILLS[skillId].name} 레벨이 ${s.level}이 되었다!`, 'event');
    toast(`${SKILLS[skillId].icon} ${SKILLS[skillId].name} Lv.${s.level}!`, 'info');
  }
  if (s.level >= MAX_SKILL_LEVEL) s.xp = 0;
}

// ============================================
// 상태이상 (버프/디버프)
// ============================================

function addStatusEffect(id) {
  const def = STATUS_EFFECTS[id];
  if (!def) return;
  const effects = state.player.statusEffects || [];
  // 이미 있으면 갱신
  const existing = effects.find(e => e.id === id);
  if (existing) {
    existing.startAt = Date.now();
  } else {
    effects.push({ id, startAt: Date.now() });
  }
  state.player.statusEffects = effects;
}

function removeStatusEffect(id) {
  if (!state.player.statusEffects) return;
  state.player.statusEffects = state.player.statusEffects.filter(e => e.id !== id);
}

function hasEffect(id) {
  return (state.player.statusEffects || []).some(e => e.id === id);
}

function cleanupExpiredEffects() {
  const now = Date.now();
  const effects = state.player.statusEffects || [];
  const kept = effects.filter(e => {
    const def = STATUS_EFFECTS[e.id];
    if (!def) return false;
    if (def.duration < 0) return true; // 무기한
    return (e.startAt + def.duration * 1000) > now;
  });
  if (kept.length !== effects.length) {
    state.player.statusEffects = kept;
  }
}

// ============================================
// 위치 이동
// ============================================

function travelTo(locId) {
  if (!LOCATIONS[locId]) return;
  if (state.player.location === locId) return;
  if (!state.player.alive) return;

  const loc = LOCATIONS[locId];
  state.player.location = locId;
  log(`📍 ${loc.name}(으)로 이동했다.`, 'system');
  // 이동 시 체력/수분 소모
  state.player.hunger = Math.max(0, state.player.hunger - 2);
  state.player.thirst = Math.max(0, state.player.thirst - 3);

  // 이동 중 감염 확률 (폐허/연구소)
  if ((loc.type === 'ruins' || loc.type === 'lab') && !hasEffect('immune_boost')) {
    if (Math.random() < 0.05) {
      state.player.infection = Math.min(state.player.maxInfection, state.player.infection + 10);
      addStatusEffect('infected');
      log('⚠ 감염에 노출되었다!', 'bad');
      toast('감염 위험!', 'bad');
    }
  }

  queueSave();
  renderAll();
}

// ============================================
// 틱 (주기적 상태 감소)
// ============================================

function startTick() {
  if (state.tickTimer) clearInterval(state.tickTimer);
  state.tickTimer = setInterval(tick, 10000); // 10초마다
}

function tick() {
  if (!state.player || !state.player.alive) return;

  const p = state.player;

  // 포만감/수분 감소
  const hungerDrop = hasEffect('well_fed') ? 0.7 : 1;
  p.hunger = Math.max(0, p.hunger - hungerDrop);
  p.thirst = Math.max(0, p.thirst - 1.3);

  // 굶주림/탈수 디버프 체크
  if (p.hunger <= 0) addStatusEffect('starving'); else removeStatusEffect('starving');
  if (p.thirst <= 0) addStatusEffect('dehydrated'); else removeStatusEffect('dehydrated');

  // 디버프에 의한 체력 감소
  if (hasEffect('starving')) p.hp = Math.max(0, p.hp - 1);
  if (hasEffect('dehydrated')) p.hp = Math.max(0, p.hp - 1);

  // 감염 진행
  if (hasEffect('infected')) {
    const rate = hasEffect('immune_boost') ? 0.3 : 0.8;
    p.infection = Math.min(p.maxInfection, p.infection + rate);
    if (p.infection >= p.maxInfection) {
      // 완전 감염 → 사망
      die('감염이 온몸에 퍼져 의식을 잃었다...');
      return;
    }
  }

  // 체력 자연 회복 (조건: 충분한 포만감+수분, 디버프 없음, 안전한 곳)
  if (p.hunger > 30 && p.thirst > 30 && !hasEffect('wounded') && !hasEffect('infected')) {
    const healRate = hasEffect('well_rested') ? 1.5 : 1;
    if (p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + healRate);
  }

  // 사망 체크
  if (p.hp <= 0) {
    die('당신은 죽었다...');
    return;
  }

  cleanupExpiredEffects();
  renderAll();
  queueSave();
}

// ============================================
// 사망 & 좀비화
// ============================================

async function die(reason) {
  if (!state.player.alive) return;
  state.player.alive = false;
  state.player.deathTimestamp = Date.now();
  state.player.stats.deathCount = (state.player.stats.deathCount || 0) + 1;

  // 좀비 NPC로 등록 (인벤토리 + 위치 기록)
  try {
    await setDoc(doc(db, 'zombies', state.uid + '_' + Date.now()), {
      ownerUid: state.uid,
      ownerNickname: state.player.nickname,
      location: state.player.location,
      inventory: state.player.inventory,
      createdAt: serverTimestamp(),
      killed: false
    });
  } catch (e) { console.warn('좀비 등록 실패:', e); }

  // 인벤토리 잃음
  state.player.inventory = [];
  state.player.statusEffects = [];
  state.player.infection = 0;
  state.player.hp = 0;

  log('☠ ' + reason, 'bad');
  log('당신의 몸이 좀비가 되어 일어섰다. 누군가 찾아와 쓰러뜨리기 전까지...', 'event');

  await saveImmediately();
  showRespawnModal();
  renderAll();
}

function showRespawnModal() {
  openModal('사망', `
    <div style="text-align:center;">
      <div style="font-size:48px;margin-bottom:12px;">☠</div>
      <p style="margin-bottom:12px;">당신은 죽었다. 인벤토리를 모두 잃었다.</p>
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:20px;">
        당신의 시체는 좀비가 되어 <strong>${LOCATIONS[state.player.location]?.name || '그곳'}</strong>에 남았다.<br>
        다른 생존자가 찾아낸다면 남은 물건은 그들의 것이 될 것이다.
      </p>
      <button class="btn btn-primary" id="btn-respawn">거점에서 부활하기</button>
    </div>
  `);
  document.getElementById('btn-respawn').addEventListener('click', respawn);
}

function respawn() {
  state.player.alive = true;
  state.player.hp = state.player.maxHp;
  state.player.hunger = 60;
  state.player.thirst = 60;
  state.player.infection = 0;
  state.player.location = 'home';
  state.player.statusEffects = [];
  state.player.inventory = [
    { id: 'item_water', count: 2 },
    { id: 'food_bread', count: 1 }
  ];
  log('거점에서 부활했다. 새로운 날이 시작된다.', 'event');
  closeModal();
  queueSave();
  renderAll();
}

// ============================================
// 저장 (디바운스)
// ============================================

function queueSave() {
  if (state.saveTimer) clearTimeout(state.saveTimer);
  state.saveTimer = setTimeout(saveImmediately, 1500);
}

async function saveImmediately() {
  if (!state.uid || !state.player) return;
  try {
    await updateDoc(doc(db, 'players', state.uid), {
      hp: state.player.hp,
      maxHp: state.player.maxHp,
      hunger: state.player.hunger,
      thirst: state.player.thirst,
      infection: state.player.infection,
      alive: state.player.alive,
      deathTimestamp: state.player.deathTimestamp,
      location: state.player.location,
      skills: state.player.skills,
      inventory: state.player.inventory,
      inventoryMax: state.player.inventoryMax,
      farmPlots: state.player.farmPlots,
      statusEffects: state.player.statusEffects,
      stats: state.player.stats
    });
  } catch (e) {
    console.warn('저장 실패:', e);
  }
}

// 창 닫기 전 저장
window.addEventListener('beforeunload', () => {
  if (state.player) saveImmediately();
});

// ============================================
// UI 헬퍼
// ============================================

function log(text, type = '') {
  const entry = document.createElement('div');
  entry.className = 'log-entry log-' + (type || 'system');
  entry.textContent = text;
  els.actionLog.appendChild(entry);
  els.actionLog.scrollTop = els.actionLog.scrollHeight;
  // 로그 항목 수 제한
  while (els.actionLog.children.length > 30) {
    els.actionLog.removeChild(els.actionLog.firstChild);
  }
}

function toast(text, type = '') {
  const t = document.createElement('div');
  t.className = 'toast toast-' + type;
  t.textContent = text;
  els.toastContainer.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(20px)';
    t.style.transition = 'all 0.3s';
    setTimeout(() => t.remove(), 300);
  }, 2500);
}

function openModal(title, bodyHtml) {
  els.modalTitle.textContent = title;
  els.modalBody.innerHTML = bodyHtml;
  els.modalBackdrop.classList.remove('hidden');
}

function closeModal() {
  els.modalBackdrop.classList.add('hidden');
}

function bumpStat(key) {
  if (!state.player.stats) state.player.stats = {};
  state.player.stats[key] = (state.player.stats[key] || 0) + 1;
}

function categoryLabel(cat) {
  return {
    fish: '물고기', crop: '작물', food: '요리', material: '재료',
    consumable: '소모품', seed: '씨앗', medicine: '의약품', currency: '통화'
  }[cat] || cat;
}

function rarityLabel(r) {
  return { common: '일반', uncommon: '고급', rare: '희귀', epic: '영웅' }[r] || r;
}

function effectLabel(eff) {
  const parts = [];
  if (eff.hp) parts.push(`체력 +${eff.hp}`);
  if (eff.hunger) parts.push(`포만감 +${eff.hunger}`);
  if (eff.thirst) parts.push(`수분 +${eff.thirst}`);
  if (eff.infection) parts.push(`감염도 ${eff.infection > 0 ? '+' : ''}${eff.infection}`);
  if (eff.curesInfection) parts.push('감염 완치');
  if (eff.buff) parts.push(`버프: ${STATUS_EFFECTS[eff.buff]?.name || eff.buff}`);
  return parts.join(', ');
}

// 디버깅용 전역 노출
window.__gameState = state;
