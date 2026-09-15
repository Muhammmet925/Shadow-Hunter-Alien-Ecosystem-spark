import { create } from 'zustand';

export type MapType = 'earth' | 'space' | 'mars' | 'moon';
export type WeaponType = 
  | 'shotgun'
  | 'chainsaw'
  | 'chaingun'
  | 'plasma'
  | 'rocket'
  | 'bfg'
  | 'pistol'
  | 'laser'
  | 'melee'
  | 'builder';

interface GameState {
  score: number;
  level: number;
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  stamina: number;
  hunger: number;
  thirst: number;
  jetpackFuel: number;
  currentMap: MapType;
  currentWeapon: WeaponType;
  inventory: {
    health_pack: number;
    armor_pack: number;
    ammo_pack: number;
    food: number;
    water: number;
    wood: number;
    metal: number;
  };
  ammo: {
    pistol: number;
    shotgun: number;
    chaingun: number;
    plasma: number;
    rocket: number;
    bfg: number;
    laser: number;
  };
  maxAmmo: {
    pistol: number;
    shotgun: number;
    chaingun: number;
    plasma: number;
    rocket: number;
    bfg: number;
    laser: number;
  };
  skills: {
    speed: number;
    health: number;
    damage: number;
  };
  gameStarted: boolean;
  gameOver: boolean;
  isPaused: boolean;
  activeMenu: 'none' | 'pause' | 'inventory' | 'skills' | 'trade' | 'crafting' | 'quests';
  blocks: Record<string, string>; // "x,y,z" -> texture
  selectedBlock: string;
  isDashing: boolean;
  isCrouching: boolean;
  flashlightOn: boolean;
  weather: 'clear' | 'rain' | 'fog';
  isHoveringEnemy: boolean;
  enemyPositions: Record<string, [number, number, number]>;
  wildlifePositions: Record<string, [number, number, number]>;
  playerPosition: [number, number, number];
  playerRotationY: number;
  isMoving: boolean;
  fireRecoil: number;
  particles: { id: number, pos: [number, number, number], color: string, life: number }[];
  damageIndicators: { id: number, pos: [number, number, number], amount: number, life: number }[];
  quests: {
    id: string;
    title: string;
    description: string;
    target: number;
    current: number;
    completed: boolean;
    reward: number;
  }[];
  
  // Actions
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  setActiveMenu: (menu: GameState['activeMenu']) => void;
  setMap: (map: MapType) => void;
  addScore: (amount: number) => void;
  takeDamage: (amount: number) => void;
  useItem: (item: keyof GameState['inventory']) => void;
  addInventoryItem: (item: keyof GameState['inventory'], amount: number) => void;
  consumeAmmo: (weapon: WeaponType, amount?: number) => void;
  upgradeSkill: (skill: keyof GameState['skills']) => void;
  setWeapon: (weapon: WeaponType) => void;
  setSelectedBlock: (block: string) => void;
  setDashing: (isDashing: boolean) => void;
  setCrouching: (isCrouching: boolean) => void;
  toggleFlashlight: () => void;
  setWeather: (weather: GameState['weather']) => void;
  setHoveringEnemy: (isHovering: boolean) => void;
  updateEnemyPosition: (id: string, pos: [number, number, number] | null) => void;
  updateWildlifePosition: (id: string, pos: [number, number, number] | null) => void;
  setPlayerTransform: (pos: [number, number, number], rotY: number, moving: boolean) => void;
  triggerFireRecoil: () => void;
  spawnParticles: (pos: [number, number, number], color: string, count?: number) => void;
  addDamageIndicator: (pos: [number, number, number], amount: number) => void;
  addBlock: (pos: string, type: string) => void;
  removeBlock: (pos: string) => void;
  buyItem: (item: keyof GameState['inventory'], cost: number) => void;
  saveGame: () => void;
  loadGame: () => void;
  resetGame: () => void;
  tick: (delta: number) => void;
}

export const useStore = create<GameState>((set) => ({
  score: 0,
  level: 1,
  health: 100,
  maxHealth: 100,
  armor: 50,
  maxArmor: 100,
  stamina: 100,
  hunger: 100,
  thirst: 100,
  jetpackFuel: 100,
  currentMap: 'earth',
  currentWeapon: 'shotgun',
  inventory: {
    health_pack: 2,
    armor_pack: 2,
    ammo_pack: 3,
    food: 2,
    water: 2,
    wood: 0,
    metal: 0,
  },
  ammo: {
    pistol: 45,
    shotgun: 24,
    chaingun: 150,
    plasma: 80,
    rocket: 15,
    bfg: 3,
    laser: 25,
  },
  maxAmmo: {
    pistol: 90,
    shotgun: 48,
    chaingun: 300,
    plasma: 160,
    rocket: 30,
    bfg: 5,
    laser: 50,
  },
  skills: {
    speed: 0,
    health: 0,
    damage: 0,
  },
  gameStarted: false,
  gameOver: false,
  isPaused: false,
  activeMenu: 'none',
  blocks: {},
  selectedBlock: 'grass',
  isDashing: false,
  isCrouching: false,
  flashlightOn: false,
  weather: 'fog',
  isHoveringEnemy: false,
  enemyPositions: {},
  wildlifePositions: {},
  playerPosition: [0, 5, 0],
  playerRotationY: 0,
  isMoving: false,
  fireRecoil: 0,
  particles: [],
  damageIndicators: [],
  quests: [
    { id: 'wood', title: 'Scavenger', description: 'Gather 20 wood from ruins', target: 20, current: 0, completed: false, reward: 500 },
    { id: 'metal', title: 'Scrap Metal', description: 'Gather 10 metal for crafting', target: 10, current: 0, completed: false, reward: 800 },
    { id: 'kill', title: 'Survivor', description: 'Defeat 5 infected', target: 5, current: 0, completed: false, reward: 1000 },
  ],

  startGame: () => set({ gameStarted: true, gameOver: false, isPaused: false, activeMenu: 'none' }),
  pauseGame: () => set({ isPaused: true, activeMenu: 'pause' }),
  resumeGame: () => set({ isPaused: false, activeMenu: 'none' }),
  setActiveMenu: (activeMenu) => set({ activeMenu, isPaused: activeMenu !== 'none' }),
  setMap: (currentMap) => set({ currentMap }),
  addScore: (amount) => set((state) => {
    const newScore = state.score + amount;
    const newLevel = Math.floor(newScore / 2000) + 1;
    
    // Update kill quest
    const newQuests = state.quests.map(q => {
      if (q.id === 'kill' && !q.completed && amount > 0) {
        const newCurrent = Math.min(q.target, q.current + 1);
        const completed = newCurrent >= q.target;
        if (completed && !q.completed) {
          setTimeout(() => state.addScore(q.reward), 0);
        }
        return { ...q, current: newCurrent, completed };
      }
      return q;
    });

    return { score: newScore, level: newLevel, quests: newQuests };
  }),
  takeDamage: (amount) => set((state) => {
    let { health, armor } = state;
    if (armor > 0) {
      const absorbed = Math.min(armor, amount * 0.65);
      armor = Math.max(0, Math.round(armor - absorbed));
      const remaining = amount - absorbed;
      health = Math.max(0, Math.round(health - remaining));
    } else {
      health = Math.max(0, health - amount);
    }
    return { health, armor, gameOver: health <= 0 };
  }),
  useItem: (item) => set((state) => {
    if (state.inventory[item] <= 0) return state;
    
    const newInventory = { ...state.inventory, [item]: state.inventory[item] - 1 };
    let { health, armor, hunger, thirst, ammo } = state;

    if (item === 'health_pack') health = Math.min(state.maxHealth, health + 50);
    if (item === 'armor_pack') armor = Math.min(state.maxArmor, armor + 50);
    if (item === 'food') hunger = Math.min(100, hunger + 30);
    if (item === 'water') thirst = Math.min(100, thirst + 40);
    if (item === 'ammo_pack') {
      ammo = {
        pistol: state.maxAmmo.pistol,
        shotgun: state.maxAmmo.shotgun,
        chaingun: state.maxAmmo.chaingun,
        plasma: state.maxAmmo.plasma,
        rocket: state.maxAmmo.rocket,
        bfg: state.maxAmmo.bfg,
        laser: state.maxAmmo.laser,
      };
    }

    return { inventory: newInventory, health, armor, hunger, thirst, ammo };
  }),
  addInventoryItem: (item: keyof GameState['inventory'], amount: number) => set((state) => {
    const newInventory = { ...state.inventory, [item]: state.inventory[item] + amount };
    
    // Update quests
    const newQuests = state.quests.map(q => {
      if (q.id === item && !q.completed) {
        const newCurrent = Math.min(q.target, q.current + amount);
        const completed = newCurrent >= q.target;
        if (completed && !q.completed) {
          // Reward score
          setTimeout(() => state.addScore(q.reward), 0);
        }
        return { ...q, current: newCurrent, completed };
      }
      return q;
    });

    return { inventory: newInventory, quests: newQuests };
  }),
  consumeAmmo: (weapon: WeaponType, amount = 1) => set((state) => {
    if (weapon === 'melee' || weapon === 'chainsaw' || weapon === 'builder') return state;
    const current = state.ammo[weapon as keyof typeof state.ammo] ?? 0;
    return {
      ammo: {
        ...state.ammo,
        [weapon]: Math.max(0, current - amount),
      },
    };
  }),
  upgradeSkill: (skill) => set((state) => {
    const cost = skill === 'damage' ? 1500 * (state.skills[skill] + 1) : 1000 * (state.skills[skill] + 1);
    if (state.score < cost) return state;

    const newSkills = { ...state.skills, [skill]: state.skills[skill] + 1 };
    const updates: Partial<GameState> = { score: state.score - cost, skills: newSkills };

    if (skill === 'health') {
      updates.maxHealth = state.maxHealth + 20;
      updates.health = state.health + 20;
    }

    return updates;
  }),
  setWeapon: (currentWeapon) => set({ currentWeapon }),
  setSelectedBlock: (selectedBlock) => set({ selectedBlock }),
  setDashing: (isDashing) => set({ isDashing }),
  setCrouching: (isCrouching) => set({ isCrouching }),
  toggleFlashlight: () => set((state) => ({ flashlightOn: !state.flashlightOn })),
  setWeather: (weather) => set({ weather }),
  setHoveringEnemy: (isHoveringEnemy) => set({ isHoveringEnemy }),
  updateEnemyPosition: (id, pos) => set((state) => {
    const newPositions = { ...state.enemyPositions };
    if (pos === null) delete newPositions[id];
    else newPositions[id] = pos;
    return { enemyPositions: newPositions };
  }),
  updateWildlifePosition: (id, pos) => set((state) => {
    const newPositions = { ...state.wildlifePositions };
    if (pos === null) delete newPositions[id];
    else newPositions[id] = pos;
    return { wildlifePositions: newPositions };
  }),
  setPlayerTransform: (playerPosition, playerRotationY, isMoving) => set({
    playerPosition,
    playerRotationY,
    isMoving,
  }),
  triggerFireRecoil: () => set({ fireRecoil: 1.0 }),
  spawnParticles: (pos, color, count = 5) => set((state) => {
    const newParticles = [...state.particles];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: Math.random(),
        pos: [
          pos[0] + (Math.random() - 0.5),
          pos[1] + (Math.random() - 0.5),
          pos[2] + (Math.random() - 0.5)
        ],
        color,
        life: 1.0
      });
    }
    return { particles: newParticles };
  }),
  addDamageIndicator: (pos, amount) => set((state) => ({
    damageIndicators: [...state.damageIndicators, { id: Math.random(), pos, amount, life: 1.0 }]
  })),
  addBlock: (pos, type) => set((state) => ({
    blocks: { ...state.blocks, [pos]: type }
  })),
  removeBlock: (pos) => set((state) => {
    const newBlocks = { ...state.blocks };
    delete newBlocks[pos];
    return { blocks: newBlocks };
  }),
  buyItem: (item, cost) => set((state) => {
    if (state.score < cost) return state;
    return {
      score: state.score - cost,
      inventory: { ...state.inventory, [item]: state.inventory[item] + 1 }
    };
  }),
  saveGame: () => {
    const state = useStore.getState();
    const saveData = {
      score: state.score,
      level: state.level,
      health: state.health,
      inventory: state.inventory,
      ammo: state.ammo,
      skills: state.skills,
      blocks: state.blocks,
      quests: state.quests,
    };
    localStorage.setItem('shadow_hunter_save', JSON.stringify(saveData));
    window.dispatchEvent(new Event('game-saved'));
  },
  loadGame: () => {
    const saved = localStorage.getItem('shadow_hunter_save');
    if (saved) {
      const data = JSON.parse(saved);
      set((state) => ({ ...state, ...data, gameStarted: true, isPaused: false, activeMenu: 'none' }));
    }
  },
  resetGame: () => set({
    score: 0,
    level: 1,
    health: 100,
    maxHealth: 100,
    armor: 100,
    maxArmor: 100,
    stamina: 100,
    hunger: 100,
    thirst: 100,
    jetpackFuel: 100,
    inventory: { health_pack: 2, armor_pack: 1, ammo_pack: 2, food: 2, water: 2, wood: 0, metal: 0 },
    skills: { speed: 0, health: 0, damage: 0 },
    gameOver: false,
    gameStarted: false,
  }),
  tick: (delta) => set((state) => {
    if (!state.gameStarted || state.isPaused || state.gameOver) return state;
    
    const hungerDecay = 0.5 * delta;
    const thirstDecay = 0.8 * delta;
    
    const newHunger = Math.max(0, state.hunger - hungerDecay);
    const newThirst = Math.max(0, state.thirst - thirstDecay);
    
    let healthDamage = 0;
    if (newHunger <= 0 || newThirst <= 0) {
      healthDamage = 5 * delta;
    }

    // Stamina logic
    let newStamina = state.stamina;
    let newIsDashing = state.isDashing;
    
    if (state.isDashing) {
      newStamina = Math.max(0, state.stamina - 150 * delta);
      if (newStamina <= 0) {
        newIsDashing = false;
      }
    } else {
      newStamina = Math.min(100, state.stamina + 20 * delta);
    }

    // Weather cycling
    let newWeather = state.weather;
    if (Math.random() > 0.9995) {
      const weathers: GameState['weather'][] = ['clear', 'rain', 'fog'];
      newWeather = weathers[Math.floor(Math.random() * weathers.length)];
    }

    // Particle decay
    const newParticles = state.particles
      .map(p => ({ ...p, life: p.life - delta * 2 }))
      .filter(p => p.life > 0);

    // Damage indicator decay
    const newIndicators = state.damageIndicators
      .map(i => ({ ...i, life: i.life - delta * 1.5 }))
      .filter(i => i.life > 0);

    return {
      hunger: newHunger,
      thirst: newThirst,
      stamina: newStamina,
      isDashing: newIsDashing,
      weather: newWeather,
      particles: newParticles,
      damageIndicators: newIndicators,
      fireRecoil: Math.max(0, state.fireRecoil - delta * 5),
      health: Math.max(0, state.health - healthDamage),
      gameOver: state.health - healthDamage <= 0
    };
  })
}));
