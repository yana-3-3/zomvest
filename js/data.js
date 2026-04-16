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

// -------- 맵 장소 정의 --------
// type: wilderness(야생), ruins(폐허), village(마을), lab(연구소), home(플레이어 거점), water(물가)
export const LOCATIONS = {
  home: {
    id: 'home', name: '내 거점', type: 'home',
    x: 400, y: 300,
    description: '안전한 당신의 거점. 농장을 일구고 요리를 만들 수 있다.',
    actions: ['farm', 'cook', 'rest', 'inventory']
  },
  river: {
    id: 'river', name: '맑은 강가', type: 'water',
    x: 180, y: 220,
    description: '깨끗한 물이 흐르는 강가. 낚시가 가능하다.',
    actions: ['fish', 'drink']
  },
  lake: {
    id: 'lake', name: '호수', type: 'water',
    x: 620, y: 450,
    description: '깊고 조용한 호수. 큰 물고기가 살고 있을 것이다.',
    actions: ['fish', 'drink']
  },
  ruins_mall: {
    id: 'ruins_mall', name: '폐허가 된 쇼핑몰', type: 'ruins',
    x: 280, y: 420,
    description: '무너진 쇼핑몰. 생필품이 남아있을지도 모른다. 위험함.',
    actions: ['forage', 'fight']
  },
  ruins_city: {
    id: 'ruins_city', name: '폐도시 외곽', type: 'ruins',
    x: 520, y: 180,
    description: '무너진 도시의 잔해. 고철과 재료가 많지만 좀비가 많다.',
    actions: ['forage', 'fight']
  },
  lab: {
    id: 'lab', name: '버려진 연구소', type: 'lab',
    x: 680, y: 280,
    description: '방역복이 찢어진 채 남아있다. 백신이 남아있을지도.',
    actions: ['forage', 'fight']
  },
  village_oak: {
    id: 'village_oak', name: '참나무 마을', type: 'village',
    x: 120, y: 450,
    description: '농부들이 모여 사는 작은 마을. 씨앗과 식량을 거래한다.',
    actions: ['trade', 'rest'],
    trader: 'oak_villagers'
  },
  village_iron: {
    id: 'village_iron', name: '철기 거래소', type: 'village',
    x: 460, y: 540,
    description: '고철과 무기를 거래하는 거친 사람들의 모임.',
    actions: ['trade'],
    trader: 'iron_traders'
  },
  mountain: {
    id: 'mountain', name: '산등성이', type: 'wilderness',
    x: 360, y: 100,
    description: '험준한 산길. 약초가 자란다.',
    actions: ['forage']
  }
};

// -------- 상인 인벤토리 --------
export const TRADERS = {
  oak_villagers: {
    name: '참나무 마을 사람들',
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
  iron_traders: {
    name: '철기 거래소',
    sells: [
      { item: 'mat_scrap', price: 8, stock: 15 },
      { item: 'mat_bandage', price: 25, stock: 5 },
      { item: 'item_antiseptic', price: 60, stock: 3 },
      { item: 'seed_pepper', price: 12, stock: 5 }
    ],
    buys: ['mat_scrap', 'mat_wood', 'mat_stone', 'fish_mutant']
  }
};

// -------- 탐색(포라징) 루트 테이블 --------
// 각 장소별로 얻을 수 있는 아이템과 확률
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
    // 위치
    location: 'home',
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
