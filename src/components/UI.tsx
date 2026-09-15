import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore, MapType } from '../store';
import { Heart, Zap, Target, Package, Settings, Play, LogOut, RefreshCcw, ShoppingCart, Hammer, Info, Volume2, VolumeX } from 'lucide-react';
import { InventoryMenu, SkillTreeMenu, CraftingMenu, QuestsMenu, TradeMenu } from './Menus';
import { RadarOverlay } from './RadarOverlay';
import { CrosshairOverlay } from './CrosshairOverlay';
import { audioManager } from '../utils/audioManager';

const SaveNotification = () => {
  const [visible, setVisible] = React.useState(false);

  useEffect(() => {
    const handleSave = () => {
      setVisible(true);
      setTimeout(() => setVisible(false), 2000);
    };
    window.addEventListener('game-saved', handleSave);
    return () => window.removeEventListener('game-saved', handleSave);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          className="fixed top-6 right-52 bg-emerald-500/90 backdrop-blur-md text-black px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 z-[60]"
        >
          <RefreshCcw size={14} className="animate-spin" />
          System State Synchronized
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const HUD = () => {
  const { 
    health, maxHealth, armor, maxArmor, score, level, stamina, hunger, thirst, jetpackFuel, 
    currentWeapon, setWeapon, activeMenu, setActiveMenu, gameStarted, gameOver, 
    ammo, maxAmmo, selectedBlock, setSelectedBlock, currentMap, setMap 
  } = useStore();
  const [prevLevel, setPrevLevel] = React.useState(level);
  const [showLevelUp, setShowLevelUp] = React.useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (level > prevLevel) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
      setPrevLevel(level);
    }
  }, [level, prevLevel]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted || gameOver) return;
      if (e.code === 'Escape') {
        if (activeMenu === 'none') setActiveMenu('pause');
        else setActiveMenu('none');
      }
      if (e.code === 'KeyI') {
        if (activeMenu === 'none') setActiveMenu('inventory');
        else if (activeMenu === 'inventory') setActiveMenu('none');
      }
      if (e.code === 'KeyK') {
        if (activeMenu === 'none') setActiveMenu('skills');
        else if (activeMenu === 'skills') setActiveMenu('none');
      }
      if (e.code === 'KeyC') {
        if (activeMenu === 'none') setActiveMenu('crafting');
        else if (activeMenu === 'crafting') setActiveMenu('none');
      }
      if (e.code === 'KeyQ') {
        if (activeMenu === 'none') setActiveMenu('quests');
        else if (activeMenu === 'quests') setActiveMenu('none');
      }
      if (e.code === 'KeyT') {
        if (activeMenu === 'none') setActiveMenu('trade');
        else if (activeMenu === 'trade') setActiveMenu('none');
      }

      // Block selection
      if (currentWeapon === 'builder') {
        if (e.code === 'Digit1') setSelectedBlock('grass');
        if (e.code === 'Digit2') setSelectedBlock('dirt');
        if (e.code === 'Digit3') setSelectedBlock('stone');
        if (e.code === 'Digit4') setSelectedBlock('wood');
        if (e.code === 'Digit5') setSelectedBlock('brick');
        if (e.code === 'Digit6') setSelectedBlock('glass');
        if (e.code === 'Digit7') setSelectedBlock('neon');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gameOver, activeMenu, setActiveMenu, currentWeapon, setSelectedBlock]);

  // Weapon display name lookup
  const weaponDisplayName: Record<string, string> = {
    melee: 'FISTS / COMBAT BLADE',
    pistol: 'UAC SIDEARM',
    shotgun: 'SUPER SHOTGUN',
    chainsaw: 'CHAINSAW',
    chaingun: 'VULCAN CHAINGUN',
    plasma: 'PLASMA RIFLE',
    rocket: 'ROCKET LAUNCHER',
    bfg: 'BFG 9000',
    laser: 'PULSE LASER',
    builder: 'MATTER BUILDER',
  };

  return (
    <>
      <SaveNotification />
      <div className="fixed inset-0 pointer-events-none p-6 flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div className="space-y-4">
          <div className="bg-black/75 backdrop-blur-md p-4 rounded-2xl border border-white/10 w-72 shadow-2xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-emerald-400 font-mono text-xs tracking-widest uppercase">
                {currentMap.toUpperCase()} // S-{Math.floor(score / 100)}
              </span>
              <span className="text-amber-400 font-mono text-xs tracking-widest font-bold">LVL {level}</span>
            </div>
            
            <div className="space-y-2.5">
              {/* Health Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-white/70 uppercase tracking-wider font-mono">
                  <span className="text-red-400 font-bold">HEALTH</span>
                  <span className="text-white font-bold">{Math.ceil(health)}/{maxHealth}</span>
                </div>
                <div className="h-2 bg-black/60 rounded-full overflow-hidden border border-red-900/40">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-red-600 to-rose-400"
                    initial={{ width: '100%' }}
                    animate={{ width: `${Math.max(0, (health / maxHealth) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Armor Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-white/70 uppercase tracking-wider font-mono">
                  <span className="text-cyan-400 font-bold">ARMOR (65% ABSORB)</span>
                  <span className="text-white font-bold">{Math.ceil(armor)}/{maxArmor}</span>
                </div>
                <div className="h-1.5 bg-black/60 rounded-full overflow-hidden border border-cyan-900/40">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-cyan-600 to-sky-400"
                    initial={{ width: '100%' }}
                    animate={{ width: `${Math.max(0, (armor / maxArmor) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Stamina Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-white/50 uppercase tracking-tighter font-mono">
                  <span>STAMINA</span>
                  <span>{Math.ceil(stamina)}%</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-amber-400"
                    initial={{ width: '100%' }}
                    animate={{ width: `${stamina}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Doom Weapon HUD Card */}
        <div className="bg-black/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-right min-w-[200px] mr-48 shadow-2xl">
          <div className="flex items-center justify-between gap-3 mb-1">
            <span className="text-white/50 text-[9px] font-mono uppercase tracking-widest">Arsenal</span>
            <button
              onClick={() => {
                const muted = audioManager.toggleMute();
                setIsMuted(muted);
              }}
              className="pointer-events-auto p-1 rounded-md hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              title="Toggle Audio"
            >
              {isMuted ? <VolumeX size={14} className="text-red-400" /> : <Volume2 size={14} className="text-emerald-400" />}
            </button>
          </div>
          
          <div className="text-amber-400 font-black uppercase tracking-tight text-base mb-1 font-mono">
            {weaponDisplayName[currentWeapon] || currentWeapon}
          </div>

          {currentWeapon !== 'melee' && currentWeapon !== 'builder' && (
            <div className="space-y-0.5">
              <div className="text-[8px] text-white/50 uppercase font-bold tracking-widest font-mono">AMMO RESERVE</div>
              <div className="text-lg font-mono font-black text-cyan-400">
                {ammo[currentWeapon as keyof typeof ammo] ?? 0}
                <span className="text-white/40 text-xs font-normal"> / {maxAmmo[currentWeapon as keyof typeof maxAmmo] ?? 0}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Doom Quick Arsenal Bar */}
      <div className="flex flex-col items-center gap-2 pointer-events-auto">
        <div className="bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 flex gap-1.5 shadow-xl">
          {[
            { id: 'melee', label: '1:FIST' },
            { id: 'pistol', label: '2:PISTOL' },
            { id: 'shotgun', label: '3:SHOTGUN' },
            { id: 'chainsaw', label: '4:SAW' },
            { id: 'chaingun', label: '5:CHAIN' },
            { id: 'plasma', label: '6:PLASMA' },
            { id: 'rocket', label: '7:ROCKET' },
            { id: 'bfg', label: '8:BFG' },
          ].map((w) => (
            <button
              key={w.id}
              onClick={() => setWeapon(w.id as any)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold tracking-tighter transition-all ${
                currentWeapon === w.id 
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 scale-105' 
                  : 'bg-white/5 text-white/60 hover:bg-white/15 hover:text-white'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>

        <div className="bg-black/40 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/5 flex gap-6">
          <StatIcon icon={<Heart size={14} />} value={Math.ceil(hunger)} color="text-orange-400" />
          <StatIcon icon={<Zap size={14} />} value={Math.ceil(thirst)} color="text-cyan-400" />
          <StatIcon icon={<Target size={14} />} value={Math.ceil(jetpackFuel)} color="text-indigo-400" />
        </div>
      </div>

      {/* Block Selector (Only when builder is active) */}
      {currentWeapon === 'builder' && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-auto">
          {['grass', 'dirt', 'stone', 'wood', 'brick', 'glass', 'neon', 'metal', 'glowstone'].map((b, i) => (
            <div 
              key={b}
              className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all ${
                selectedBlock === b ? 'border-emerald-400 bg-emerald-400/20 scale-110' : 'border-white/10 bg-black/40'
              }`}
            >
              <div className="text-[10px] text-white/40 absolute -top-6 uppercase font-bold tracking-widest">{i + 1}</div>
              <div className={`w-8 h-8 rounded-md ${
                b === 'grass' ? 'bg-green-800' : 
                b === 'dirt' ? 'bg-amber-900' : 
                b === 'stone' ? 'bg-stone-600' : 
                b === 'wood' ? 'bg-amber-800' : 
                b === 'brick' ? 'bg-red-900' : 
                b === 'glass' ? 'bg-blue-300 opacity-50' : 
                b === 'metal' ? 'bg-zinc-600' : 
                b === 'glowstone' ? 'bg-yellow-600 shadow-[0_0_10px_#ca8a04]' : 
                'bg-emerald-400 shadow-[0_0_10px_#34d399]'
              }`} />
            </div>
          ))}
        </div>
      )}

      {/* Circular Radar Minimap Overlay */}
      <RadarOverlay />

      {/* Reactive Dynamic Crosshair */}
      <CrosshairOverlay />
    </div>

      <div className="fixed bottom-6 left-6 pointer-events-none">
        <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/5 space-y-1">
          <div className="text-[8px] text-white/40 uppercase font-bold tracking-widest font-mono">DOOM CONTROLS</div>
          <div className="flex gap-3 text-[10px] font-mono text-white/60 flex-wrap max-w-lg">
            <span>[WASD] Move</span>
            <span>[SPACE] Jump</span>
            <span>[1-8 / SCROLL] Doom Weapons</span>
            <span>[L-CLICK] Fire</span>
            <span>[SHIFT] Dash</span>
            <span>[CTRL] Crouch</span>
            <span>[I] Inventory</span>
            <span>[K] Skills</span>
            <span>[ESC] Menu</span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showLevelUp && (
          <motion.div 
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.5, opacity: 0, y: -50 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="text-center">
              <div className="text-emerald-400 text-6xl font-black italic tracking-tighter uppercase mb-2">Level Up!</div>
              <div className="text-white text-xl font-mono tracking-[1em] uppercase">Survival Instincts Enhanced</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeMenu === 'inventory' && <InventoryMenu />}
        {activeMenu === 'skills' && <SkillTreeMenu />}
        {activeMenu === 'crafting' && <CraftingMenu />}
        {activeMenu === 'quests' && <QuestsMenu />}
        {activeMenu === 'trade' && <TradeMenu />}
      </AnimatePresence>
    </>
  );
};

const StatIcon = ({ icon, value, color }: { icon: React.ReactNode, value: number, color: string }) => (
  <div className="flex items-center gap-2">
    <span className={color}>{icon}</span>
    <span className="text-white font-mono text-sm">{value}%</span>
  </div>
);

export const StartMenu = () => {
  const { startGame, setMap, currentMap, resetGame } = useStore();

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#7f1d1d,transparent_70%)]" />
      </div>
      
      <div className="relative text-center space-y-10 max-w-2xl px-6">
        <div className="space-y-2">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-7xl font-black tracking-tighter text-white uppercase italic font-mono drop-shadow-[0_0_35px_rgba(239,68,68,0.4)]"
          >
            DOOM // VOXEL
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-red-500 tracking-[0.4em] uppercase text-sm font-black"
          >
            Rip & Tear Through The Cosmos
          </motion.p>
        </div>

        <div className="space-y-4">
          <h3 className="text-white/50 uppercase text-[11px] font-bold tracking-widest font-mono">Select Dimension / World</h3>
          <div className="grid grid-cols-4 gap-2.5 max-w-xl mx-auto">
            <MapButton active={currentMap === 'earth'} onClick={() => setMap('earth')} label="Earth" subtitle="Wasteland" />
            <MapButton active={currentMap === 'space'} onClick={() => setMap('space')} label="Space" subtitle="Orbital Sta." />
            <MapButton active={currentMap === 'mars'} onClick={() => setMap('mars')} label="Mars" subtitle="Phobos Base" />
            <MapButton active={currentMap === 'moon'} onClick={() => setMap('moon')} label="Moon" subtitle="Lunar Outpost" />
          </div>
        </div>
        
        <div className="flex flex-col gap-3 justify-center max-w-sm mx-auto">
          <button 
            onClick={() => {
              audioManager.ensureInitialized();
              audioManager.startAmbience(currentMap);
              startGame();
            }}
            className="bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2 uppercase tracking-tighter shadow-xl shadow-red-600/30"
          >
            <Play size={20} fill="currentColor" />
            Enter Combat Zone
          </button>
        </div>
      </div>
    </div>
  );
};

const MapButton = ({ active, onClick, label, subtitle }: { active: boolean, onClick: () => void, label: string, subtitle?: string }) => (
  <button 
    onClick={onClick}
    className={`p-3 rounded-xl font-bold uppercase tracking-tight transition-all text-center flex flex-col items-center justify-center ${
      active 
        ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 scale-105 border border-red-400' 
        : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/5'
    }`}
  >
    <span className="text-sm font-black">{label}</span>
    {subtitle && <span className="text-[9px] opacity-70 tracking-widest font-mono normal-case">{subtitle}</span>}
  </button>
);

export const PauseMenu = () => {
  const { resumeGame, resetGame, saveGame, loadGame, currentMap, setMap } = useStore();

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-xl flex items-center justify-center z-40">
      <div className="bg-zinc-900 border border-white/10 p-7 rounded-3xl w-96 space-y-5 shadow-2xl">
        <h2 className="text-white text-xl font-black tracking-tighter uppercase italic text-center font-mono">Operations Paused</h2>
        
        {/* Map Warper */}
        <div className="space-y-2">
          <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest font-mono text-center">Warp Deployment Zone</div>
          <div className="grid grid-cols-4 gap-1.5">
            {(['earth', 'space', 'mars', 'moon'] as MapType[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMap(m);
                  audioManager.startAmbience(m);
                }}
                className={`py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-tight transition-all ${
                  currentMap === m 
                    ? 'bg-red-600 text-white shadow-md' 
                    : 'bg-white/5 text-white/50 hover:bg-white/15'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <MenuButton onClick={() => {
            audioManager.ensureInitialized();
            audioManager.startAmbience(currentMap);
            resumeGame();
          }} icon={<Play size={18} />} label="Resume Combat" primary />
          <div className="grid grid-cols-2 gap-2">
            <MenuButton onClick={saveGame} label="Save" />
            <MenuButton onClick={loadGame} label="Load" />
          </div>
          <MenuButton onClick={resetGame} icon={<RefreshCcw size={18} />} label="Restart Level" />
          <MenuButton onClick={() => window.location.reload()} icon={<LogOut size={18} />} label="Quit" danger />
        </div>
      </div>
    </div>
  );
};

const MenuButton = ({ onClick, icon, label, primary, danger }: any) => (
  <button 
    onClick={onClick}
    className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold uppercase tracking-tighter transition-all ${
      primary ? 'bg-cyan-500 text-black hover:bg-cyan-400' : 
      danger ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' :
      'bg-white/5 text-white hover:bg-white/10'
    }`}
  >
    {icon}
    {label}
  </button>
);

export const GameOver = () => {
  const { score, resetGame } = useStore();

  return (
    <div className="fixed inset-0 bg-red-950/90 backdrop-blur-2xl flex items-center justify-center z-50">
      <div className="text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-8xl font-black text-white uppercase italic tracking-tighter">You Are Dead</h1>
          <p className="text-red-400 font-mono tracking-widest uppercase">The infected claimed another</p>
        </div>
        <div className="bg-black/40 p-6 rounded-3xl border border-white/10">
          <div className="text-white/40 uppercase text-[10px] font-bold tracking-widest mb-1">Days Survived</div>
          <div className="text-4xl font-black text-emerald-400 font-mono">{Math.floor(score / 100)}</div>
        </div>
        <button 
          onClick={resetGame}
          className="bg-white text-black font-black px-12 py-4 rounded-2xl hover:scale-105 transition-all uppercase tracking-tighter"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};
