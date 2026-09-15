import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { useStore } from '../store';
import { ShoppingCart, Hammer, X, Package, Coins } from 'lucide-react';

export const InventoryMenu = () => {
  const { inventory, useItem, resumeGame } = useStore();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-40">
      <div className="bg-zinc-900 border border-white/10 p-8 rounded-3xl w-[500px] space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-white text-2xl font-black tracking-tighter uppercase italic">Inventory</h2>
          <button onClick={resumeGame} className="text-white/40 hover:text-white"><X size={24} /></button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <InventoryItem 
            label="Health Pack" 
            count={inventory.health_pack} 
            color="bg-emerald-500" 
            onClick={() => useItem('health_pack')}
          />
          <InventoryItem 
            label="Ammo Pack" 
            count={inventory.ammo_pack} 
            color="bg-amber-500" 
            onClick={() => useItem('ammo_pack')}
          />
          <InventoryItem 
            label="Food" 
            count={inventory.food} 
            color="bg-orange-500" 
            onClick={() => useItem('food')}
          />
          <InventoryItem 
            label="Water" 
            count={inventory.water} 
            color="bg-cyan-500" 
            onClick={() => useItem('water')}
          />
        </div>
      </div>
    </div>
  );
};

const InventoryItem = ({ label, count, color, onClick }: any) => (
  <button 
    onClick={onClick}
    className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-white/10 transition-all group"
  >
    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-black group-hover:scale-110 transition-transform`}>
      <Package size={24} />
    </div>
    <div className="text-white font-bold uppercase tracking-tighter text-sm">{label}</div>
    <div className="text-white/40 font-mono text-xs">Quantity: {count}</div>
  </button>
);

export const TradeMenu = () => {
  const { score, buyItem, resumeGame } = useStore();

  const shopItems = [
    { id: 'health_pack', label: 'Health Pack', cost: 200, color: 'bg-emerald-500' },
    { id: 'ammo_pack', label: 'Ammo Pack', cost: 150, color: 'bg-amber-500' },
    { id: 'food', label: 'Food Ration', cost: 100, color: 'bg-orange-500' },
    { id: 'water', label: 'Purified Water', cost: 80, color: 'bg-cyan-500' },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-40">
      <div className="bg-zinc-900 border border-white/10 p-8 rounded-3xl w-[500px] space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-xl text-cyan-400">
              <ShoppingCart size={24} />
            </div>
            <h2 className="text-white text-2xl font-black tracking-tighter uppercase italic">Trading Post</h2>
          </div>
          <button onClick={resumeGame} className="text-white/40 hover:text-white"><X size={24} /></button>
        </div>

        <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
          <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Available Credits</div>
          <div className="flex items-center gap-2">
            <Coins size={16} className="text-amber-400" />
            <span className="text-2xl font-black text-amber-400 font-mono">{Math.floor(score)}</span>
          </div>
        </div>
        
        <div className="space-y-3">
          {shopItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => buyItem(item.id as any, item.cost)}
              disabled={score < item.cost}
              className={`w-full p-4 rounded-2xl flex justify-between items-center transition-all ${
                score >= item.cost ? 'bg-white/5 border border-white/5 hover:bg-white/10' : 'opacity-30 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center text-black`}>
                  <Package size={20} />
                </div>
                <div className="text-left">
                  <div className="text-white font-bold uppercase tracking-tighter">{item.label}</div>
                  <div className="text-white/40 text-[10px] uppercase tracking-widest">In Stock</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded-xl">
                <span className="text-amber-400 font-mono font-bold">{item.cost}</span>
                <div className="bg-amber-400/20 p-1 rounded-md">
                  <Coins size={12} className="text-amber-400" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export const SkillTreeMenu = () => {
  const { skills, score, upgradeSkill, resumeGame } = useStore();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-40">
      <div className="bg-zinc-900 border border-white/10 p-8 rounded-3xl w-[500px] space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-white text-2xl font-black tracking-tighter uppercase italic">Skill Tree</h2>
          <button onClick={resumeGame} className="text-white/40 hover:text-white"><X size={24} /></button>
        </div>

        <div className="bg-black/40 p-4 rounded-2xl border border-white/5 mb-4">
          <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">Available Data</div>
          <div className="text-2xl font-black text-cyan-400 font-mono">{Math.floor(score)}</div>
        </div>
        
        <div className="space-y-3">
          <SkillItem 
            label="Enhanced Speed" 
            level={skills.speed} 
            cost={1000 * (skills.speed + 1)} 
            onClick={() => upgradeSkill('speed')}
          />
          <SkillItem 
            label="Biological Fortitude" 
            level={skills.health} 
            cost={1000 * (skills.health + 1)} 
            onClick={() => upgradeSkill('health')}
          />
          <SkillItem 
            label="Weapon Calibration" 
            level={skills.damage} 
            cost={1500 * (skills.damage + 1)} 
            onClick={() => upgradeSkill('damage')}
          />
        </div>
      </div>
    </div>
  );
};

export const CraftingMenu = () => {
  const { inventory, addInventoryItem, resumeGame } = useStore();

  const craft = (item: string, wood: number, metal: number) => {
    if (inventory.wood >= wood && inventory.metal >= metal) {
      // Subtract resources
      addInventoryItem('wood', -wood);
      addInventoryItem('metal', -metal);
      // Add item
      addInventoryItem(item as any, 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-40">
      <div className="bg-zinc-900 border border-white/10 p-8 rounded-3xl w-[500px] space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-white text-2xl font-black tracking-tighter uppercase italic">Crafting</h2>
          <button onClick={resumeGame} className="text-white/40 hover:text-white"><X size={24} /></button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs font-mono text-white/40 mb-4">
          <div className="bg-black/20 p-2 rounded-xl border border-white/5 flex justify-between">
            <span>Wood</span>
            <span className="text-white">{inventory.wood}</span>
          </div>
          <div className="bg-black/20 p-2 rounded-xl border border-white/5 flex justify-between">
            <span>Metal</span>
            <span className="text-white">{inventory.metal}</span>
          </div>
        </div>
        
        <div className="space-y-3">
          <CraftItem 
            label="Health Pack" 
            req="2 Wood" 
            canCraft={inventory.wood >= 2}
            onClick={() => craft('health_pack', 2, 0)}
          />
          <CraftItem 
            label="Ammo Pack" 
            req="1 Metal" 
            canCraft={inventory.metal >= 1}
            onClick={() => craft('ammo_pack', 0, 1)}
          />
          <CraftItem 
            label="Food" 
            req="1 Wood" 
            canCraft={inventory.wood >= 1}
            onClick={() => craft('food', 1, 0)}
          />
        </div>
      </div>
    </div>
  );
};

const CraftItem = ({ label, req, canCraft, onClick }: any) => (
  <button 
    onClick={onClick}
    disabled={!canCraft}
    className={`w-full p-4 rounded-2xl flex justify-between items-center transition-all ${
      canCraft ? 'bg-white/5 border border-white/5 hover:bg-white/10' : 'opacity-30 cursor-not-allowed'
    }`}
  >
    <div className="text-left">
      <div className="text-white font-bold uppercase tracking-tighter">{label}</div>
      <div className="text-white/40 text-[10px] uppercase tracking-widest">Requires {req}</div>
    </div>
    {canCraft && (
      <div className="bg-cyan-500 text-black px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter">
        Craft
      </div>
    )}
  </button>
);

export const QuestsMenu = () => {
  const { quests, resumeGame } = useStore();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-40">
      <div className="bg-zinc-900 border border-white/10 p-8 rounded-3xl w-[500px] space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-white text-2xl font-black tracking-tighter uppercase italic">Quests</h2>
          <button onClick={resumeGame} className="text-white/40 hover:text-white"><X size={24} /></button>
        </div>
        
        <div className="space-y-3">
          {quests.map((quest) => (
            <div 
              key={quest.id}
              className={`p-4 rounded-2xl border ${
                quest.completed ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/5'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className={`font-bold uppercase tracking-tighter ${quest.completed ? 'text-emerald-400' : 'text-white'}`}>
                    {quest.title} {quest.completed && '✓'}
                  </div>
                  <div className="text-white/40 text-[10px] uppercase tracking-widest">{quest.description}</div>
                </div>
                <div className="text-right">
                  <div className="text-cyan-400 font-mono text-xs">+{quest.reward} DATA</div>
                </div>
              </div>
              
              <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${quest.completed ? 'bg-emerald-500' : 'bg-cyan-500'}`}
                  style={{ width: `${(quest.current / quest.target) * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-[8px] font-mono text-white/20 uppercase">
                <span>Progress</span>
                <span>{quest.current} / {quest.target}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SkillItem = ({ label, level, cost, onClick }: any) => (
  <button 
    onClick={onClick}
    className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl flex justify-between items-center hover:bg-white/10 transition-all"
  >
    <div className="text-left">
      <div className="text-white font-bold uppercase tracking-tighter">{label}</div>
      <div className="text-white/40 text-[10px] uppercase tracking-widest">Level {level}</div>
    </div>
    <div className="text-right">
      <div className="text-cyan-400 font-mono font-bold">{cost}</div>
      <div className="text-[8px] text-white/20 uppercase tracking-widest">Upgrade Cost</div>
    </div>
  </button>
);
