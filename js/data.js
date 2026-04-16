// ============================================
// 정적 게임 데이터
// 아이템, 스킬, 장소, 레시피, 작물, 버프 등
// ============================================

// -------- 스킬 정의 --------
export const SKILLS = {
  fishing:   { name: '낚시', icon: '🎣' },
  cooking:   { name: '요리', icon: '🍳' },
  farming:   { name: '농사', icon: '🌾' },
  trading:   { name: '교류', icon: '💱' },
  combat:    { name: '전투', icon: '⚔️' },
  foraging:  { name: '탐색', icon: '🔍' }
};

export const MAX_SKILL_LEVEL = 15;

// 스킬 레벨업에 필요한 경험치 (레벨 n → n+1)
export function xpToNext(level) {
  return Math.floor(50 * Math.pow(1.35, level - 1));
}

// -------- 아이템 정의 --------
// rarity: common / uncommon / rare / epic
export const ITEMS = {
  // ===== 물고기 (낚시) =====
  fish_minnow:   { name: '피라미',     icon: '🐟', rarity: 'common',   stack: 99, category: 'fish',   value: 3 },
  fish_carp:     { name: '잉어',       icon: '🐠', rarity: 'common',   stack: 99, category: 'fish',   value: 8 },
  fish_bass:     { name: '농어',       icon: '🐡', rarity: 'uncommon', stack: 99, category: 'fish',   value: 20 },
  fish_trout:    { name: '송어',       icon: '🎣', rarity: 'uncommon', stack: 99, category: 'fish',   value: 25 },
  fish_salmon:   { name: '연어',       icon: '🍣', rarity: 'rare',     stack: 99, category: 'fish',   value: 60 },
  fish_mutant:   { name: '돌연변이 어',icon: '👾', rarity: 'epic',     stack: 99, category: 'fish',   value: 150 },

  // ===== 작물 (농사) =====
  crop_potato:   { name: '감자',       icon: '🥔', rarity: 'common',   stack: 99, category: 'crop',   value: 5 },
  crop_carrot:   { name: '당근',       icon: '🥕', rarity: 'common',   stack: 99, category: 'crop',   value: 6 },
  crop_tomato:   { name: '토마토',     icon: '🍅', rarity: 'common',   stack: 99, category: 'crop',   value: 10 },
  crop_corn:     { name: '옥수수',     icon: '🌽', rarity: 'uncommon', stack: 99, category: 'crop',   value: 15 },
  crop_wheat:    { name: '밀',         icon: '🌾', rarity: 'uncommon', stack: 99, category: 'crop',   value: 12 },
  crop_pepper:   { name: '고추',       icon: '🌶️', rarity: 'uncommon', stack: 99, category: 'crop',   value: 18 },
  crop_pumpkin:  { name: '호박',       icon: '🎃', rarity: 'rare',     stack: 99, category: 'crop',   value: 40 },
  crop_herb:     { name: '약초',       icon: '🌿', rarity: 'rare',     stack: 99, category: 'crop',   value: 35 },

  // ===== 요리 =====
  food_grilled_fish: { name: '구운 생선', icon: '🐟', rarity: 'common', stack: 20, category: 'food', value: 25,
    effect: { hp: 15, hunger: 30 } },
  food_stew:         { name: '스튜',      icon: '🍲', rarity: 'uncommon', stack: 20, category: 'food', value: 50,
    effect: { hp: 25, hunger: 50, buff: 'well_fed' } },
  food_bread:        { name: '빵',        icon: '🍞', rarity: 'common', stack: 20, category: 'food', value: 15,
    effect: { hunger: 40 } },
  food_soup:         { name: '수프',      icon: '🥣', rarity: 'common', stack: 20, category: 'food', value: 20,
    effect: { hunger: 25, thirst: 20 } },
  food_herbal_tea:   { name: '약초차',    icon: '🍵', rarity: 'uncommon', stack: 20, category: 'food', value: 45,
    effect: { thirst: 40, buff: 'immune_boost' } },
  food_feast:        { name: '성찬',      icon: '🍱', rarity: 'rare', stack: 10, category: 'food', value: 120,
    effect: { hp: 50, hunger: 80, buff: 'hearty_meal' } },

  // ===== 재료/자원 =====
  mat_wood:     { name: '목재',        icon: '🪵', rarity: 'common',   stack: 99, category: 'material', value: 2 },
  mat_stone:    { name: '돌',          icon: '🪨', rarity: 'common',   stack: 99, category: 'material', value: 2 },
  mat_cloth:    { name: '천 조각',     icon: '🧵', rarity: 'common',   stack: 99, category: 'material', value: 3 },
  mat_scrap:    { name: '고철',        icon: '⚙️', rarity: 'uncommon', stack: 99, category: 'material', value: 5 },
  mat_bandage:  { name: '붕대',        icon: '🩹', rarity: 'uncommon', stack: 10, category: 'consumable', value: 15,
    effect: { hp: 30 } },

  // ===== 씨앗 =====
  seed_potato:  { name: '감자 씨',     icon: '🌱', rarity: 'common',   stack: 99, category: 'seed', value: 2, growsInto: 'crop_potato', growTime: 120 },
  seed_carrot:  { name: '당근 씨',     icon: '🌱', rarity: 'common',   stack: 99, category: 'seed', value: 2, growsInto: 'crop_carrot', growTime: 180 },
  seed_tomato:  { name: '토마토 씨',   icon: '🌱', rarity: 'common',   stack: 99, category: 'seed', value: 3, growsInto: 'crop_tomato', growTime: 300 },
  seed_corn:    { name: '옥수수 씨',   icon: '🌱', rarity: 'uncommon', stack: 99, category: 'seed', value: 5, growsInto: 'crop_corn', growTime: 600 },
  seed_wheat:   { name: '밀 씨',       icon: '🌱', rarity: 'uncommon', stack: 99, category: 'seed', value: 4, growsInto: 'crop_wheat', growTime: 480 },
  seed_pepper:  { name: '고추 씨',     icon: '🌱', rarity: 'uncommon', stack: 99, category: 'seed', value: 6, growsInto: 'crop_pepper', growTime: 540 },
  seed_pumpkin: { name: '호박 씨',     icon: '🌱', rarity: 'rare',     stack: 99, category: 'seed', value: 12, growsInto: 'crop_pumpkin', growTime: 1200 },
  seed_herb:    { name: '약초 씨',     icon: '🌱', rarity: 'rare',     stack: 99, category: 'seed', value: 10, growsInto: 'crop_herb', growTime: 900 },

  // ===== 특수 =====
  item_vaccine: { name: '백신',        icon: '💉', rarity: 'epic',     stack: 5,  category: 'medicine', value: 500,
    effect: { curesInfection: true } },
  item_antiseptic: { name: '소독제',  icon: '🧴', rarity: 'uncommon', stack: 10, category: 'medicine', value: 30,
    effect: { infection: -10 } },
  item_water:   { name: '깨끗한 물',   icon: '💧', rarity: 'common',   stack: 20, category: 'consumable', value: 5,
    effect: { thirst: 35 } },
  item_coin:    { name: '고물 동전',   icon: '🪙', rarity: 'common',   stack: 9999, category: 'currency', value: 1 }
};

// -------- 낚시 풀 (레벨별로 열리는 물고기) --------
export const FISHING_POOL = [
  { id: 'fish_minnow',  minLevel: 1,  weight: 50 },
  { id: 'fish_carp',    minLevel: 1,  weight: 30 },
  { id: 'fish_bass',    minLevel: 3,  weight: 20 },
  { id: 'fish_trout',   minLevel: 5,  weight: 15 },
  { id: 'fish_salmon',  minLevel: 8,  weight: 8 },
  { id: 'fish_mutant',  minLevel: 12, weight: 2 }
];

// -------- 레시피 (요리) --------
// minigameClicks: 요리 미니게임에서 타이밍 버튼을 눌러야 하는 횟수
// 레벨이 오르면 클릭 횟수 감소 가능
export const RECIPES = [
  {
    id: 'food_grilled_fish',
    name: '구운 생선',
    ingredients: { fish_minnow: 1 }, // 피라미나 잉어도 가능하도록 확장 가능
    result: 'food_grilled_fish',
    time: 20000,           // 20초
    minigameClicks: 2,
    minSkill: 1
  },
  {
    id: 'food_bread',
    name: '빵',
    ingredients: { crop_wheat: 2 },
    result: 'food_bread',
    time: 30000,
    minigameClicks: 2,
    minSkill: 2
  },
  {
    id: 'food_soup',
    name: '수프',
    ingredients: { crop_carrot: 1, crop_potato: 1, item_water: 1 },
    result: 'food_soup',
    time: 25000,
    minigameClicks: 3,
    minSkill: 2
  },
  {
    id: 'food_stew',
    name: '스튜',
    ingredients: { fish_bass: 1, crop_potato: 2, crop_carrot: 1 },
    result: 'food_stew',
    time: 40000,
    minigameClicks: 3,
    minSkill: 5
  },
  {
    id: 'food_herbal_tea',
    name: '약초차',
    ingredients: { crop_herb: 1, item_water: 1 },
    result: 'food_herbal_tea',
    time: 20000,
    minigameClicks: 2,
    minSkill: 7
  },
  {
    id: 'food_feast',
    name: '성찬',
    ingredients: { fish_salmon: 1, crop_pumpkin: 1, crop_corn: 1, crop_pepper: 1 },
    result: 'food_feast',
    time: 55000,
    minigameClicks: 5,
    minSkill: 10
  }
];

// -------- 버프/디버프 정의 --------
export const STATUS_EFFECTS = {
  // 버프
  well_fed:      { name: '든든함',      icon: '😊', type: 'buff',   duration: 600, description: '포만감 감소 속도 -30%' },
  immune_boost:  { name: '면역 강화',   icon: '🛡️', type: 'buff',   duration: 900, description: '감염 저항 +50%' },
  hearty_meal:   { name: '성찬의 축복', icon: '✨', type: 'buff',   duration: 1200, description: '모든 스킬 경험치 +20%' },
  well_rested:   { name: '충분한 휴식', icon: '💤', type: 'buff',   duration: 600, description: '체력 회복 속도 +50%' },

  // 디버프
  starving:      { name: '굶주림',      icon: '🥵', type: 'debuff', duration: -1,  description: '체력 서서히 감소' },
  dehydrated:    { name: '탈수',        icon: '🥴', type: 'debuff', duration: -1,  description: '체력 서서히 감소' },
  infected:      { name: '감염',        icon: '🦠', type: 'debuff', duration: -1,  description: '감염도 증가 중. 백신 필요' },
  wounded:       { name: '부상',        icon: '🩸', type: 'debuff', duration: 300, description: '체력 회복 불가' }
};

// -------- 맵 설정 (절차적 생성) --------
// 시드가 고정되어 있어서 모든 유저가 같은 세계를 공유
export const WORLD = {
  seed: 20260417,          // 이 시드로 지형/장소 배치가 결정됨
  width: 2400,
  height: 1800,
  // 생성할 장소 수
  villages: 5,             // 마을 (거래 가능)
  ruinsMalls: 4,           // 폐허 쇼핑몰류
  ruinsCity: 3,            // 폐도시 구역
  labs: 2,                 // 연구소 (백신 파밍)
  lakes: 3,                // 호수
  riverBends: 6,           // 강이 지나가는 주요 지점
  mountainRanges: 3,       // 산맥
  forests: 8,              // 숲 지대
  farmsteads: 4            // 버려진 농가 (씨앗/물 파밍)
};

// 장소 타입별 정의 (이름 후보, 가능 액션, 상인 등)
export const LOCATION_TYPES = {
  wilderness: {
    label: '황야',
    names: ['이름 없는 들판', '바람의 평원', '고요한 들녘', '붉은 흙의 땅', '마른 초원', '잊힌 교차로'],
    actions: []
  },
  forest: {
    label: '숲',
    names: ['오래된 숲', '이끼 덮인 숲', '달빛 숲', '까마귀 숲', '소나무 골짜기', '안개 낀 수풀'],
    actions: ['forage']
  },
  river: {
    label: '강',
    names: ['맑은 강줄기', '북쪽 지류', '푸른 여울', '갈대 강변', '흐르는 개천'],
    actions: ['fish', 'drink']
  },
  lake: {
    label: '호수',
    names: ['고요한 호수', '푸른 물웅덩이', '별빛 호수', '잊힌 호수', '거울 호수'],
    actions: ['fish', 'drink']
  },
  mountain: {
    label: '산',
    names: ['이름 없는 봉우리', '까마귀 절벽', '회색 산등성이', '바람 산', '늑대의 등성이'],
    actions: ['forage']
  },
  ruins_mall: {
    label: '폐허가 된 쇼핑몰',
    names: ['무너진 쇼핑몰', '폐 상가', '조용한 마켓', '버려진 백화점', '부서진 슈퍼'],
    actions: ['forage', 'fight'],
    danger: 0.25
  },
  ruins_city: {
    label: '폐도시 구역',
    names: ['무너진 구획', '유령 도시 블록', '잿빛 거리', '붕괴된 아파트', '뒤틀린 철골'],
    actions: ['forage', 'fight'],
    danger: 0.35
  },
  ruins_farm: {
    label: '버려진 농가',
    names: ['낡은 농장', '버려진 헛간', '조용한 과수원', '무너진 외양간', '잊힌 텃밭'],
    actions: ['forage'],
    danger: 0.15
  },
  lab: {
    label: '버려진 연구소',
    names: ['폐 연구소', '방역 시설', '격리 구역', '검역 센터', '바이오 랩'],
    actions: ['forage', 'fight'],
    danger: 0.45
  },
  village: {
    label: '마을',
    names: ['참나무 마을', '물레방아 마을', '등불 마을', '양철 지붕 마을', '첫 수확의 땅', '돌담 마을', '까치골', '세 언덕 마을'],
    actions: ['trade', 'rest']
  },
  home: {
    label: '내 거점',
    names: ['내 거점'],
    actions: ['farm', 'cook', 'rest']
  }
};

// -------- 상인 인벤토리 풀 --------
// 마을마다 이 풀에서 해싱으로 하나가 고정 할당됨
export const TRADER_POOL = {
  farmers: {
    name: '농부들',
    sells: [
      { item: 'seed_potato', price: 5, stock: 10 },
      { item: 'seed_carrot', price: 5, stock: 10 },
      { item: 'seed_tomato', price: 8, stock: 8 },
      { item: 'seed_wheat', price: 10, stock: 6 },
      { item: 'crop_potato', price: 8, stock: 20 },
      { item: 'item_water', price: 6, stock: 30 }
    ],
    buys: ['fish_minnow', 'fish_carp', 'fish_bass', 'crop_potato', 'crop_carrot', 'crop_tomato']
  },
  scavengers: {
    name: '약탈자 무리',
    sells: [
      { item: 'mat_scrap', price: 8, stock: 15 },
      { item: 'mat_bandage', price: 25, stock: 5 },
      { item: 'item_antiseptic', price: 60, stock: 3 },
      { item: 'seed_pepper', price: 12, stock: 5 }
    ],
    buys: ['mat_scrap', 'mat_wood', 'mat_stone', 'fish_mutant']
  },
  fishermen: {
    name: '어부들',
    sells: [
      { item: 'fish_carp', price: 10, stock: 8 },
      { item: 'item_water', price: 4, stock: 40 },
      { item: 'mat_cloth', price: 5, stock: 20 },
      { item: 'food_grilled_fish', price: 35, stock: 3 }
    ],
    buys: ['fish_minnow', 'fish_carp', 'fish_bass', 'fish_trout', 'fish_salmon']
  },
  herbalists: {
    name: '약초꾼들',
    sells: [
      { item: 'crop_herb', price: 45, stock: 4 },
      { item: 'seed_herb', price: 12, stock: 6 },
      { item: 'item_antiseptic', price: 50, stock: 4 },
      { item: 'mat_bandage', price: 20, stock: 8 },
      { item: 'food_herbal_tea', price: 70, stock: 2 }
    ],
    buys: ['crop_herb', 'seed_herb', 'crop_pepper']
  },
  merchants: {
    name: '떠돌이 상인단',
    sells: [
      { item: 'seed_corn', price: 8, stock: 8 },
      { item: 'seed_pumpkin', price: 15, stock: 4 },
      { item: 'item_water', price: 5, stock: 25 },
      { item: 'mat_bandage', price: 22, stock: 6 },
      { item: 'mat_scrap', price: 7, stock: 12 }
    ],
    buys: ['mat_scrap', 'item_coin', 'crop_corn', 'crop_pumpkin', 'fish_salmon']
  }
};

// -------- 탐색(포라징) 루트 테이블 --------
// 장소 타입별로 얻을 수 있는 아이템과 확률
export const FORAGE_LOOT = {
  ruins_mall: [
    { item: 'mat_cloth',   chance: 0.5, amount: [1, 3], minSkill: 1 },
    { item: 'mat_wood',    chance: 0.4, amount: [1, 2], minSkill: 1 },
    { item: 'mat_bandage', chance: 0.15, amount: [1, 1], minSkill: 3 },
    { item: 'item_water',  chance: 0.3, amount: [1, 2], minSkill: 1 },
    { item: 'food_bread',  chance: 0.08, amount: [1, 1], minSkill: 5 }
  ],
  ruins_city: [
    { item: 'mat_scrap',   chance: 0.45, amount: [1, 3], minSkill: 1 },
    { item: 'mat_stone',   chance: 0.4, amount: [1, 2], minSkill: 1 },
    { item: 'mat_wood',    chance: 0.35, amount: [1, 2], minSkill: 1 },
    { item: 'item_coin',   chance: 0.25, amount: [1, 5], minSkill: 2 },
    { item: 'item_antiseptic', chance: 0.08, amount: [1, 1], minSkill: 6 }
  ],
  ruins_farm: [
    { item: 'seed_potato', chance: 0.3, amount: [1, 2], minSkill: 1 },
    { item: 'seed_carrot', chance: 0.25, amount: [1, 2], minSkill: 1 },
    { item: 'seed_wheat',  chance: 0.2, amount: [1, 2], minSkill: 3 },
    { item: 'mat_wood',    chance: 0.35, amount: [1, 2], minSkill: 1 },
    { item: 'item_water',  chance: 0.3, amount: [1, 2], minSkill: 1 },
    { item: 'crop_potato', chance: 0.12, amount: [1, 2], minSkill: 4 }
  ],
  lab: [
    { item: 'mat_scrap',       chance: 0.3, amount: [1, 2], minSkill: 1 },
    { item: 'item_antiseptic', chance: 0.2, amount: [1, 1], minSkill: 4 },
    { item: 'mat_bandage',     chance: 0.25, amount: [1, 2], minSkill: 3 },
    { item: 'item_vaccine',    chance: 0.04, amount: [1, 1], minSkill: 8 }
  ],
  mountain: [
    { item: 'mat_wood',  chance: 0.5, amount: [1, 3], minSkill: 1 },
    { item: 'mat_stone', chance: 0.3, amount: [1, 2], minSkill: 1 },
    { item: 'seed_herb', chance: 0.15, amount: [1, 1], minSkill: 6 },
    { item: 'crop_herb', chance: 0.1, amount: [1, 1], minSkill: 8 }
  ],
  forest: [
    { item: 'mat_wood',  chance: 0.6, amount: [1, 3], minSkill: 1 },
    { item: 'seed_herb', chance: 0.08, amount: [1, 1], minSkill: 4 },
    { item: 'crop_herb', chance: 0.05, amount: [1, 1], minSkill: 7 }
  ]
};

// -------- 적 정의 --------
export const ENEMIES = {
  zombie_walker: { name: '부패한 걷는자', icon: '🧟', hp: 30, atk: 8, xp: 15,
    loot: [{ item: 'mat_cloth', chance: 0.6 }, { item: 'item_coin', chance: 0.3 }] },
  zombie_runner: { name: '달리는 놈',     icon: '🧟‍♂️', hp: 45, atk: 14, xp: 30,
    loot: [{ item: 'mat_cloth', chance: 0.5 }, { item: 'mat_scrap', chance: 0.3 }] },
  bandit:        { name: '무뢰배',         icon: '🤺', hp: 60, atk: 18, xp: 45,
    loot: [{ item: 'item_coin', chance: 0.8, amount: [3, 12] }, { item: 'mat_scrap', chance: 0.4 }] },
  raider:        { name: '약탈자 두목',    icon: '🥷', hp: 100, atk: 25, xp: 90,
    loot: [{ item: 'item_coin', chance: 1.0, amount: [10, 30] }, { item: 'mat_bandage', chance: 0.5 }] }
};

// -------- 초기 플레이어 데이터 --------
// 플레이어는 월드 좌표(x, y)로 위치가 기록되고, 장소 안에 있을 때만 locationId가 세팅됨.
// home 좌표는 플레이어가 직접 정착할 때 결정됨.
export function createNewPlayerData(nickname) {
  return {
    nickname: nickname,
    // 상태
    hp: 100, maxHp: 100,
    hunger: 100, maxHunger: 100,
    thirst: 100, maxThirst: 100,
    infection: 0, maxInfection: 100,
    // 생사
    alive: true,
    deathTimestamp: null,
    // 월드 위치 (절차적 맵 좌표) — 스폰 지점은 대략 월드 중앙
    worldX: 1200,
    worldY: 900,
    // 현재 위치한 장소 ID (null이면 빈 황야에 있는 것)
    locationId: null,
    // 거점 좌표 (null이면 아직 정착 안 함)
    homeX: null,
    homeY: null,
    // 스킬 (각 스킬 level, xp)
    skills: {
      fishing:  { level: 1, xp: 0 },
      cooking:  { level: 1, xp: 0 },
      farming:  { level: 1, xp: 0 },
      trading:  { level: 1, xp: 0 },
      combat:   { level: 1, xp: 0 },
      foraging: { level: 1, xp: 0 }
    },
    // 인벤토리: [{ id: 'fish_minnow', count: 3 }, ...]
    inventory: [
      { id: 'item_water', count: 3 },
      { id: 'food_bread', count: 2 },
      { id: 'seed_potato', count: 5 },
      { id: 'item_coin', count: 20 }
    ],
    inventoryMax: 20,
    // 농사 (플레이어 거점에서 키우는 작물들)
    farmPlots: [
      // { seedId, plantedAt (ms), plotIndex }
    ],
    farmPlotsMax: 6,
    // 버프/디버프: [{ id, startAt, duration }]
    statusEffects: [],
    // 통계
    stats: {
      fishCaught: 0,
      itemsCrafted: 0,
      enemiesDefeated: 0,
      deathCount: 0
    }
  };
}
