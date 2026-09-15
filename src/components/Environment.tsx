import React, { useMemo, useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore, MapType } from '../store';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// Universal Resource Chest / Cache
const CacheNode = ({ position, label, color, emissive }: { 
  position: [number, number, number]; 
  label: string; 
  color: string; 
  emissive: string;
}) => {
  const addInventoryItem = useStore((state) => state.addInventoryItem);
  const addScore = useStore((state) => state.addScore);
  const [isOpened, setIsOpened] = useState(false);

  if (isOpened) return null;

  return (
    <group 
      position={position}
      userData={{
        isResource: true,
        onHarvest: () => {
          const items: any[] = ['health_pack', 'armor_pack', 'ammo_pack', 'food', 'water', 'metal'];
          const randomItem = items[Math.floor(Math.random() * items.length)];
          addInventoryItem(randomItem, 2);
          addScore(800);
          setIsOpened(true);
        }
      }}
    >
      <mesh castShadow>
        <boxGeometry args={[1.4, 0.9, 0.9]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} emissive={emissive} emissiveIntensity={0.6} />
      </mesh>
      <Html position={[0, 1.4, 0]} center>
        <div className="bg-black/70 backdrop-blur-md px-2 py-0.5 rounded border border-white/20 text-[9px] text-cyan-300 font-mono tracking-widest whitespace-nowrap">
          {label} [E / CLICK]
        </div>
      </Html>
    </group>
  );
};

// --- EARTH PROPS ---
const EarthTree = ({ position }: { position: [number, number, number] }) => {
  const addInventoryItem = useStore((state) => state.addInventoryItem);
  const [isHarvested, setIsHarvested] = useState(false);
  const scale = useMemo(() => 0.8 + Math.random() * 0.5, []);

  if (isHarvested) return null;

  return (
    <group 
      position={position} 
      scale={scale} 
      userData={{ 
        isResource: true, 
        onHarvest: () => {
          addInventoryItem('wood', 5);
          setIsHarvested(true);
        } 
      }}
    >
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[0.6, 3, 0.6]} />
        <meshStandardMaterial color="#451a03" />
      </mesh>
      <mesh position={[0, 3.8, 0]} castShadow>
        <boxGeometry args={[2.5, 2.5, 2.5]} />
        <meshStandardMaterial color="#15803d" />
      </mesh>
    </group>
  );
};

// --- SPACE ORBITAL STATION PROPS ---
const SpaceRelayPylon = ({ position }: { position: [number, number, number] }) => {
  const beaconRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (beaconRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.3;
      beaconRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group position={position}>
      {/* Heavy base */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[2, 2.4, 1, 8]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Lattice Mast */}
      <mesh position={[0, 5, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.8, 9, 6]} />
        <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.3} />
      </mesh>
      {/* Rotating Comm Array */}
      <mesh position={[0, 9.5, 0]}>
        <ringGeometry args={[0.5, 2.2, 16]} />
        <meshStandardMaterial color="#0284c7" emissive="#06b6d4" emissiveIntensity={0.8} side={THREE.DoubleSide} />
      </mesh>
      {/* Blinking cyan beacon light */}
      <mesh ref={beaconRef} position={[0, 10, 0]}>
        <sphereGeometry args={[0.3, 12, 12]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
    </group>
  );
};

const FloatingAsteroid = ({ position }: { position: [number, number, number] }) => {
  const ref = useRef<THREE.Mesh>(null);
  const rotSpeed = useMemo(() => (Math.random() - 0.5) * 0.01, []);
  const scale = useMemo(() => 1.5 + Math.random() * 2.5, []);

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.x += rotSpeed;
      ref.current.rotation.y += rotSpeed * 1.5;
    }
  });

  return (
    <mesh ref={ref} position={position} scale={scale} castShadow>
      <dodecahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color="#475569" roughness={0.9} metalness={0.1} />
    </mesh>
  );
};

// --- MARS HELLISH OUTPOST PROPS ---
const DemonicObelisk = ({ position }: { position: [number, number, number] }) => {
  const addScore = useStore((state) => state.addScore);
  const addInventoryItem = useStore((state) => state.addInventoryItem);
  const [cleansed, setCleansed] = useState(false);

  return (
    <group 
      position={position}
      userData={{
        isResource: true,
        onHarvest: () => {
          if (!cleansed) {
            setCleansed(true);
            addScore(1500);
            addInventoryItem('ammo_pack', 2);
          }
        }
      }}
    >
      {/* Basalt Obelisk Pillar */}
      <mesh position={[0, 4, 0]} castShadow>
        <boxGeometry args={[1.5, 8, 1.5]} />
        <meshStandardMaterial 
          color="#0f172a" 
          metalness={0.3} 
          roughness={0.7} 
          emissive={cleansed ? "#10b981" : "#dc2626"} 
          emissiveIntensity={cleansed ? 0.3 : 1.2}
        />
      </mesh>
      {/* Fiery Rune Cap */}
      <mesh position={[0, 8.5, 0]}>
        <octahedronGeometry args={[1.2]} />
        <meshStandardMaterial 
          color={cleansed ? "#34d399" : "#f97316"} 
          emissive={cleansed ? "#10b981" : "#ef4444"} 
          emissiveIntensity={2} 
        />
      </mesh>
      <Html position={[0, 10, 0]} center>
        <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
          cleansed ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-600/50' : 'bg-red-950/80 text-red-400 border border-red-600/50'
        }`}>
          {cleansed ? 'ALTAR PURIFIED' : 'HELL RUNIC OBELISK'}
        </div>
      </Html>
    </group>
  );
};

const LavaVent = ({ position }: { position: [number, number, number] }) => {
  return (
    <group position={position}>
      {/* Crust cone */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[1.8, 3, 0.8, 12]} />
        <meshStandardMaterial color="#450a0a" roughness={0.9} />
      </mesh>
      {/* Molten Magma Core */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 0.1, 16]} />
        <meshBasicMaterial color="#f97316" />
      </mesh>
      <pointLight position={[0, 1.2, 0]} color="#ef4444" intensity={2} distance={15} />
    </group>
  );
};

// --- MOON LUNAR OUTPOST PROPS ---
const LunarDome = ({ position }: { position: [number, number, number] }) => {
  return (
    <group position={position}>
      {/* Main pressurized dome */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <sphereGeometry args={[5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Airlock Tunnel */}
      <mesh position={[0, 1, 5]} castShadow>
        <boxGeometry args={[2, 2, 3]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Circular Foundation Rim */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[5.3, 5.5, 0.4, 24]} />
        <meshStandardMaterial color="#334155" metalness={0.9} />
      </mesh>
      <Html position={[0, 6, 0]} center>
        <div className="bg-slate-900/80 border border-slate-600 px-2 py-0.5 rounded text-[8px] text-cyan-300 font-mono tracking-widest uppercase">
          LUNAR BASE SECTOR 4
        </div>
      </Html>
    </group>
  );
};

const LunarRadarDish = ({ position }: { position: [number, number, number] }) => {
  return (
    <group position={position}>
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.5, 3, 8]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} />
      </mesh>
      <mesh position={[0, 3.2, 0]} rotation={[0.4, 0.2, 0]} castShadow>
        <sphereGeometry args={[2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 3]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.2} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

// Main Environment Container
export const Environment = () => {
  const currentMap = useStore((state) => state.currentMap);

  // Earth items
  const earthTrees = useMemo(() => Array.from({ length: 35 }).map((_, i) => ({
    id: i,
    position: [(Math.random() - 0.5) * 160, 0, (Math.random() - 0.5) * 160] as [number, number, number],
  })), [currentMap]);

  // Space items
  const spaceRelays = useMemo(() => Array.from({ length: 6 }).map((_, i) => ({
    id: i,
    position: [(Math.random() - 0.5) * 180, 0, (Math.random() - 0.5) * 180] as [number, number, number],
  })), [currentMap]);

  const spaceAsteroids = useMemo(() => Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    position: [
      (Math.random() - 0.5) * 220,
      12 + Math.random() * 25,
      (Math.random() - 0.5) * 220,
    ] as [number, number, number],
  })), [currentMap]);

  // Mars items
  const marsObelisks = useMemo(() => Array.from({ length: 8 }).map((_, i) => ({
    id: i,
    position: [(Math.random() - 0.5) * 160, 0, (Math.random() - 0.5) * 160] as [number, number, number],
  })), [currentMap]);

  const marsVents = useMemo(() => Array.from({ length: 10 }).map((_, i) => ({
    id: i,
    position: [(Math.random() - 0.5) * 140, 0, (Math.random() - 0.5) * 140] as [number, number, number],
  })), [currentMap]);

  // Moon items
  const moonDomes = useMemo(() => [
    { id: 1, position: [-30, 0, -20] as [number, number, number] },
    { id: 2, position: [40, 0, 35] as [number, number, number] },
  ], [currentMap]);

  const moonDishes = useMemo(() => Array.from({ length: 6 }).map((_, i) => ({
    id: i,
    position: [(Math.random() - 0.5) * 150, 0, (Math.random() - 0.5) * 150] as [number, number, number],
  })), [currentMap]);

  // Universal caches per map
  const caches = useMemo(() => Array.from({ length: 6 }).map((_, i) => ({
    id: i,
    position: [(Math.random() - 0.5) * 130, 0.45, (Math.random() - 0.5) * 130] as [number, number, number],
  })), [currentMap]);

  return (
    <group>
      {/* Universal Caches */}
      {caches.map((c) => (
        <CacheNode 
          key={c.id} 
          position={c.position}
          label={
            currentMap === 'mars' ? 'UAC Munitions Crate' :
            currentMap === 'space' ? 'Cryo Supply Pod' :
            currentMap === 'moon' ? 'Apollo Cargo Stash' : 'Survival Cache'
          }
          color={
            currentMap === 'mars' ? '#b91c1c' :
            currentMap === 'space' ? '#0369a1' :
            currentMap === 'moon' ? '#475569' : '#d97706'
          }
          emissive={
            currentMap === 'mars' ? '#ef4444' :
            currentMap === 'space' ? '#38bdf8' :
            currentMap === 'moon' ? '#94a3b8' : '#fbbf24'
          }
        />
      ))}

      {/* Earth Biome */}
      {currentMap === 'earth' && (
        <group>
          {earthTrees.map((t) => (
            <EarthTree key={t.id} position={t.position} />
          ))}
        </group>
      )}

      {/* Deep Space Biome */}
      {currentMap === 'space' && (
        <group>
          {spaceRelays.map((r) => (
            <SpaceRelayPylon key={r.id} position={r.position} />
          ))}
          {spaceAsteroids.map((a) => (
            <FloatingAsteroid key={a.id} position={a.position} />
          ))}
        </group>
      )}

      {/* Mars Hell Biome */}
      {currentMap === 'mars' && (
        <group>
          {marsObelisks.map((o) => (
            <DemonicObelisk key={o.id} position={o.position} />
          ))}
          {marsVents.map((v) => (
            <LavaVent key={v.id} position={v.position} />
          ))}
        </group>
      )}

      {/* Moon Biome */}
      {currentMap === 'moon' && (
        <group>
          {moonDomes.map((d) => (
            <LunarDome key={d.id} position={d.position} />
          ))}
          {moonDishes.map((d) => (
            <LunarRadarDish key={d.id} position={d.position} />
          ))}
        </group>
      )}
    </group>
  );
};
