import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSphere } from '@react-three/cannon';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useStore } from '../store';
import { Loot, LootType } from './Loot';
import { audioManager } from '../utils/audioManager';

export type WildlifeSpecies = 'glowstrider' | 'sporehopper';

interface WildlifeProps {
  id: number;
  species: WildlifeSpecies;
  initialPosition: [number, number, number];
  onDie: (id: number, pos: [number, number, number]) => void;
}

export const Wildlife = ({ id, species, initialPosition, onDie }: WildlifeProps) => {
  const [hp, setHp] = useState(species === 'glowstrider' ? 4 : 2);
  const [isAlert, setIsAlert] = useState(false);
  const isPaused = useStore((state) => state.isPaused);
  const gameOver = useStore((state) => state.gameOver);
  const spawnParticles = useStore((state) => state.spawnParticles);
  const addDamageIndicator = useStore((state) => state.addDamageIndicator);
  const updateWildlifePosition = useStore((state) => state.updateWildlifePosition);

  const [ref, api] = useSphere(() => ({
    mass: 1.2,
    position: initialPosition,
    args: [0.8],
    type: 'Dynamic',
    linearDamping: 0.8,
  }));

  const currentPos = useRef<[number, number, number]>(initialPosition);
  const targetPos = useRef<THREE.Vector3>(new THREE.Vector3(initialPosition[0], initialPosition[1], initialPosition[2]));
  const stateTimer = useRef(Math.random() * 5);
  const creatureState = useRef<'grazing' | 'wandering' | 'fleeing'>('grazing');
  const fleeTimer = useRef(0);
  const lastChirpTime = useRef(performance.now() + Math.random() * 10000);

  // Procedural body part refs for gentle animations
  const headRef = useRef<THREE.Group>(null);
  const legFLRef = useRef<THREE.Mesh>(null);
  const legFRRef = useRef<THREE.Mesh>(null);
  const legBLRef = useRef<THREE.Mesh>(null);
  const legBRRef = useRef<THREE.Mesh>(null);
  const spineGlowRef = useRef<THREE.Mesh>(null);

  // Track position for radar and update store
  useEffect(() => {
    const unsub = api.position.subscribe((p) => {
      currentPos.current = p as [number, number, number];
      updateWildlifePosition(`wildlife-${id}`, currentPos.current);
    });
    return () => {
      unsub();
      setTimeout(() => {
        updateWildlifePosition(`wildlife-${id}`, null);
      }, 0);
    };
  }, [id, api.position, updateWildlifePosition]);

  // Handle hit from player
  const meshGroupRef = useRef<THREE.Group>(null);
  useEffect(() => {
    if (meshGroupRef.current) {
      meshGroupRef.current.traverse((child) => {
        child.userData.isWildlife = true;
        child.userData.onHit = (dmg: number) => {
          setHp((prev) => {
            const next = prev - dmg;
            if (next <= 0) {
              setTimeout(() => {
                spawnParticles(currentPos.current, '#38bdf8', 12);
                onDie(id, currentPos.current);
              }, 0);
            }
            return next;
          });
          creatureState.current = 'fleeing';
          fleeTimer.current = 5;
          setIsAlert(true);
          audioManager.playWildlifeChirp();
          spawnParticles(currentPos.current, '#38bdf8', 6);
          addDamageIndicator([currentPos.current[0], currentPos.current[1] + 0.8, currentPos.current[2]], dmg);
        };
      });
    }
  }, [id, onDie, spawnParticles, addDamageIndicator]);

  useFrame((state, delta) => {
    if (isPaused || gameOver) return;

    const playerPos = state.camera.position;
    const myPosVec = new THREE.Vector3(...currentPos.current);
    const distToPlayer = playerPos.distanceTo(myPosVec);

    // Random pleasant alien chirp when in vicinity
    if (distToPlayer < 25 && performance.now() - lastChirpTime.current > 12000) {
      lastChirpTime.current = performance.now();
      audioManager.playWildlifeChirp();
    }

    // React to close player sprinting or approaching
    if (distToPlayer < 7 && creatureState.current !== 'fleeing') {
      creatureState.current = 'fleeing';
      fleeTimer.current = 4;
      setIsAlert(true);
      audioManager.playWildlifeChirp();
    }

    // State machine update
    stateTimer.current -= delta;
    if (creatureState.current === 'fleeing') {
      fleeTimer.current -= delta;
      if (fleeTimer.current <= 0) {
        creatureState.current = 'grazing';
        stateTimer.current = 3 + Math.random() * 4;
        setIsAlert(false);
      }
    } else if (stateTimer.current <= 0) {
      if (creatureState.current === 'grazing') {
        creatureState.current = 'wandering';
        stateTimer.current = 4 + Math.random() * 6;
        // Pick new random peaceful waypoint
        targetPos.current.set(
          myPosVec.x + (Math.random() - 0.5) * 20,
          myPosVec.y,
          myPosVec.z + (Math.random() - 0.5) * 20
        );
      } else {
        creatureState.current = 'grazing';
        stateTimer.current = 3 + Math.random() * 5;
      }
    }

    // Movement physics
    let moveDir = new THREE.Vector3();
    let moveSpeed = 0;

    if (creatureState.current === 'fleeing') {
      // Flee directly away from player
      moveDir.subVectors(myPosVec, playerPos).setY(0).normalize();
      moveSpeed = species === 'glowstrider' ? 4.5 : 5.5;
    } else if (creatureState.current === 'wandering') {
      moveDir.subVectors(targetPos.current, myPosVec).setY(0);
      if (moveDir.length() > 0.5) {
        moveDir.normalize();
        moveSpeed = species === 'glowstrider' ? 1.6 : 1.2;
      }
    }

    if (moveSpeed > 0) {
      api.velocity.set(moveDir.x * moveSpeed, -1.5, moveDir.z * moveSpeed);
      // Face movement direction
      const angle = Math.atan2(moveDir.x, moveDir.z);
      if (meshGroupRef.current) {
        meshGroupRef.current.rotation.y = THREE.MathUtils.lerp(meshGroupRef.current.rotation.y, angle, 0.1);
      }
    } else {
      api.velocity.set(0, -1.5, 0);
    }

    // Procedural Animation
    const t = state.clock.elapsedTime * (creatureState.current === 'fleeing' ? 10 : 3);
    const isMoving = moveSpeed > 0;

    // Head bob / Grazing dip
    if (headRef.current) {
      if (creatureState.current === 'grazing') {
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0.5, 0.05);
      } else {
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, Math.sin(t) * 0.1, 0.1);
      }
    }

    // Leg swinging
    if (isMoving) {
      const legSwing = Math.sin(t) * 0.4;
      if (legFLRef.current) legFLRef.current.rotation.x = legSwing;
      if (legFRRef.current) legFRRef.current.rotation.x = -legSwing;
      if (legBLRef.current) legBLRef.current.rotation.x = -legSwing;
      if (legBRRef.current) legBRRef.current.rotation.x = legSwing;
    } else {
      if (legFLRef.current) legFLRef.current.rotation.x = 0;
      if (legFRRef.current) legFRRef.current.rotation.x = 0;
      if (legBLRef.current) legBLRef.current.rotation.x = 0;
      if (legBRRef.current) legBRRef.current.rotation.x = 0;
    }

    // Gentle bioluminescent spine pulsation
    if (spineGlowRef.current) {
      const pulse = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.4;
      (spineGlowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
    }
  });

  return (
    <group ref={ref as any}>
      <group ref={meshGroupRef}>
        {species === 'glowstrider' ? (
          /* Quadruped Glowstrider Model */
          <group position={[0, -0.4, 0]}>
            {/* Body */}
            <mesh position={[0, 0.5, 0]} castShadow>
              <boxGeometry args={[0.7, 0.6, 1.2]} />
              <meshStandardMaterial color="#0f766e" roughness={0.6} />
            </mesh>

            {/* Glowing Bioluminescent Spine */}
            <mesh ref={spineGlowRef} position={[0, 0.9, 0]}>
              <boxGeometry args={[0.2, 0.35, 0.9]} />
              <meshStandardMaterial color="#38bdf8" emissive="#06b6d4" emissiveIntensity={0.8} />
            </mesh>

            {/* Neck & Head */}
            <group ref={headRef} position={[0, 0.8, 0.6]}>
              <mesh position={[0, 0.3, 0.2]}>
                <boxGeometry args={[0.35, 0.4, 0.6]} />
                <meshStandardMaterial color="#115e59" />
              </mesh>
              {/* Gentle Bioluminescent Eyes */}
              <mesh position={[0.2, 0.35, 0.4]}>
                <boxGeometry args={[0.08, 0.08, 0.08]} />
                <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2} />
              </mesh>
              <mesh position={[-0.2, 0.35, 0.4]}>
                <boxGeometry args={[0.08, 0.08, 0.08]} />
                <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2} />
              </mesh>
              {/* Antennae / Feeler */}
              <mesh position={[0.1, 0.6, 0.2]} rotation={[0.2, 0, 0.1]}>
                <cylinderGeometry args={[0.02, 0.02, 0.4]} />
                <meshStandardMaterial color="#34d399" emissive="#34d399" emissiveIntensity={1} />
              </mesh>
              <mesh position={[-0.1, 0.6, 0.2]} rotation={[0.2, 0, -0.1]}>
                <cylinderGeometry args={[0.02, 0.02, 0.4]} />
                <meshStandardMaterial color="#34d399" emissive="#34d399" emissiveIntensity={1} />
              </mesh>
            </group>

            {/* Legs */}
            <mesh ref={legFLRef} position={[0.3, 0.1, 0.4]}>
              <boxGeometry args={[0.16, 0.6, 0.16]} />
              <meshStandardMaterial color="#134e4a" />
            </mesh>
            <mesh ref={legFRRef} position={[-0.3, 0.1, 0.4]}>
              <boxGeometry args={[0.16, 0.6, 0.16]} />
              <meshStandardMaterial color="#134e4a" />
            </mesh>
            <mesh ref={legBLRef} position={[0.3, 0.1, -0.4]}>
              <boxGeometry args={[0.16, 0.6, 0.16]} />
              <meshStandardMaterial color="#134e4a" />
            </mesh>
            <mesh ref={legBRRef} position={[-0.3, 0.1, -0.4]}>
              <boxGeometry args={[0.16, 0.6, 0.16]} />
              <meshStandardMaterial color="#134e4a" />
            </mesh>
          </group>
        ) : (
          /* Bipedal Sporehopper Model */
          <group position={[0, -0.3, 0]}>
            {/* Cute Bulbous Body */}
            <mesh position={[0, 0.5, 0]} castShadow>
              <sphereGeometry args={[0.45, 12, 12]} />
              <meshStandardMaterial color="#7e22ce" roughness={0.5} />
            </mesh>

            {/* Glowing Spore Bulb on Back */}
            <mesh ref={spineGlowRef} position={[0, 0.8, -0.1]}>
              <sphereGeometry args={[0.28, 10, 10]} />
              <meshStandardMaterial color="#e879f9" emissive="#c026d3" emissiveIntensity={0.9} />
            </mesh>

            {/* Head */}
            <group ref={headRef} position={[0, 0.6, 0.3]}>
              <mesh position={[0.15, 0.1, 0.1]}>
                <sphereGeometry args={[0.07, 8, 8]} />
                <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={1.5} />
              </mesh>
              <mesh position={[-0.15, 0.1, 0.1]}>
                <sphereGeometry args={[0.07, 8, 8]} />
                <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={1.5} />
              </mesh>
            </group>

            {/* Bipedal hopping legs */}
            <mesh ref={legFLRef} position={[0.22, 0.1, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.45]} />
              <meshStandardMaterial color="#581c87" />
            </mesh>
            <mesh ref={legFRRef} position={[-0.22, 0.1, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.45]} />
              <meshStandardMaterial color="#581c87" />
            </mesh>
          </group>
        )}
      </group>

      {/* Floating Status / Label */}
      <Html position={[0, 1.4, 0]} center>
        <div className="flex items-center gap-1 bg-emerald-950/70 border border-emerald-500/30 px-1.5 py-0.5 rounded-full backdrop-blur-sm pointer-events-none">
          <div className={`w-1.5 h-1.5 rounded-full ${isAlert ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
          <span className="text-[9px] font-mono font-bold text-emerald-300 uppercase tracking-wider whitespace-nowrap">
            {species === 'glowstrider' ? 'Glowstrider' : 'Sporehopper'}
          </span>
        </div>
      </Html>
    </group>
  );
};

export const WildlifeSpawner = () => {
  const gameStarted = useStore((state) => state.gameStarted);
  const gameOver = useStore((state) => state.gameOver);
  const isPaused = useStore((state) => state.isPaused);

  const [wildlifeList, setWildlifeList] = useState<{
    id: number;
    species: WildlifeSpecies;
    position: [number, number, number];
  }[]>([]);

  const [droppedLoots, setDroppedLoots] = useState<{
    id: number;
    position: [number, number, number];
    type: LootType;
  }[]>([]);

  // Initial population of peaceful alien wildlife
  useEffect(() => {
    if (!gameStarted) return;

    const initialFauna: {
      id: number;
      species: WildlifeSpecies;
      position: [number, number, number];
    }[] = [];

    // Spawn initial peaceful herds around the map
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      const dist = 20 + Math.random() * 45;
      initialFauna.push({
        id: Date.now() + i * 100,
        species: i % 2 === 0 ? 'glowstrider' : 'sporehopper',
        position: [Math.cos(angle) * dist, 4, Math.sin(angle) * dist],
      });
    }

    setWildlifeList(initialFauna);
  }, [gameStarted]);

  // Handle gentle respawn over time
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return;

    const interval = setInterval(() => {
      setWildlifeList((prev) => {
        if (prev.length < 8) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 30 + Math.random() * 50;
          return [
            ...prev,
            {
              id: Date.now() + Math.random() * 1000,
              species: Math.random() > 0.5 ? 'glowstrider' : 'sporehopper',
              position: [Math.cos(angle) * dist, 4, Math.sin(angle) * dist],
            },
          ];
        }
        return prev;
      });
    }, 8000);

    return () => clearInterval(interval);
  }, [gameStarted, gameOver, isPaused]);

  const handleDie = (id: number, pos: [number, number, number]) => {
    setWildlifeList((prev) => prev.filter((w) => w.id !== id));

    // Drop peaceful herbivore sustenance (food / water)
    const lootType: LootType = Math.random() > 0.5 ? 'food' : 'water';
    setDroppedLoots((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        position: [pos[0], pos[1] + 0.5, pos[2]],
        type: lootType,
      },
    ]);
  };

  return (
    <>
      {wildlifeList.map((creature) => (
        <Wildlife
          key={creature.id}
          id={creature.id}
          species={creature.species}
          initialPosition={creature.position}
          onDie={handleDie}
        />
      ))}

      {droppedLoots.map((loot) => (
        <Loot
          key={loot.id}
          position={loot.position}
          type={loot.type}
          onPickUp={() => setDroppedLoots((prev) => prev.filter((l) => l.id !== loot.id))}
        />
      ))}
    </>
  );
};
