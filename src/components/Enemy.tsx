import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSphere } from '@react-three/cannon';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useStore } from '../store';
import { Loot, LootType } from './Loot';

const Projectile = ({ position, velocity }: { position: [number, number, number], velocity: [number, number, number] }) => {
  const [ref] = useSphere(() => ({
    mass: 0.1,
    position,
    velocity,
    args: [0.2],
    onCollide: (e) => {
      // Handle collision with player
    }
  }));

  return (
    <mesh ref={ref as any}>
      <sphereGeometry args={[0.2, 8, 8]} />
      <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={2} />
    </mesh>
  );
};

export const AlienScout = ({ id, position, onDie }: { id: number; position: [number, number, number]; onDie: (id: number) => void }) => {
  const [hp, setHp] = useState(2);
  const [isBlinking, setIsBlinking] = useState(false);
  const [projectiles, setProjectiles] = useState<{ id: number, pos: [number, number, number], vel: [number, number, number] }[]>([]);
  const takeDamage = useStore(state => state.takeDamage);
  const addScore = useStore(state => state.addScore);
  const updateEnemyPosition = useStore(state => state.updateEnemyPosition);
  const spawnParticles = useStore(state => state.spawnParticles);
  const isPaused = useStore(state => state.isPaused);
  const gameOver = useStore(state => state.gameOver);
  const isCrouching = useStore(state => state.isCrouching);
  
  const [ref, api] = useSphere(() => ({
    mass: 1,
    position,
    args: [0.8],
    type: 'Dynamic',
  }));

  const meshRef = useRef<THREE.Mesh>(null);
  const enemyPos = useRef([0, 0, 0]);
  const lastShot = useRef(0);

  useEffect(() => {
    const unsubscribe = api.position.subscribe((p) => {
      enemyPos.current = p;
      updateEnemyPosition(`scout-${id}`, p as [number, number, number]);
    });
    return () => {
      unsubscribe();
      setTimeout(() => {
        updateEnemyPosition(`scout-${id}`, null);
      }, 0);
    };
  }, [id, api.position, updateEnemyPosition]);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.userData.isEnemy = true;
      meshRef.current.userData.onHit = (dmg: number) => {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 100);
        spawnParticles(enemyPos.current as [number, number, number], '#4ade80', 5);
        setHp(prev => {
          const next = prev - dmg;
          if (next <= 0) {
            setTimeout(() => {
              addScore(300);
              onDie(id);
            }, 0);
          }
          return next;
        });
      };
    }
  }, [id, onDie, addScore, spawnParticles]);

  useFrame((state) => {
    if (isPaused || gameOver) return;
    
    const playerPos = state.camera.position;
    const dist = playerPos.distanceTo(new THREE.Vector3(...enemyPos.current));
    const aggroRange = isCrouching ? 8 : 20;
    
    // Move away if too close, stay at distance
    const direction = new THREE.Vector3(
      playerPos.x - enemyPos.current[0],
      0,
      playerPos.z - enemyPos.current[2]
    ).normalize();

    if (dist < aggroRange) {
      if (dist < 10) {
        api.velocity.set(-direction.x * 2, -1, -direction.z * 2);
      } else if (dist > 15) {
        api.velocity.set(direction.x * 2, -1, direction.z * 2);
      } else {
        api.velocity.set(0, -1, 0);
      }

      // Shoot
      if (dist < 20 && state.clock.elapsedTime - lastShot.current > 3) {
        lastShot.current = state.clock.elapsedTime;
        const vel: [number, number, number] = [direction.x * 10, 0, direction.z * 10];
        const pId = Date.now();
        setProjectiles(prev => [...prev, { id: pId, pos: [enemyPos.current[0], enemyPos.current[1] + 0.5, enemyPos.current[2]], vel }]);
        
        // Auto cleanup projectiles
        setTimeout(() => {
          setProjectiles(prev => prev.filter(p => p.id !== pId));
        }, 2000);
      }
    } else {
      api.velocity.set(0, -1, 0);
    }

    // Damage player if projectiles hit (simplified check)
    projectiles.forEach(p => {
      const pPos = new THREE.Vector3(...p.pos);
      if (pPos.distanceTo(playerPos) < 1.5) {
        takeDamage(15);
        spawnParticles([playerPos.x, playerPos.y, playerPos.z], '#ff00ff', 10);
        // Remove projectile on hit
        setProjectiles(prev => prev.filter(pr => pr.id !== p.id));
      }
    });
  });

  return (
    <group>
      <mesh ref={ref as any} castShadow userData={{ isEnemy: true }}>
        <mesh ref={meshRef}>
          <boxGeometry args={[0.8, 1.2, 0.8]} />
          <meshStandardMaterial color={isBlinking ? "#ffffff" : (hp < 2 ? "#854d0e" : "#4d7c0f")} />
        </mesh>
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          <meshStandardMaterial color="#000000" emissive="#fbbf24" />
        </mesh>
        <Html position={[0, 1.5, 0]} center>
          <div className="text-[8px] text-yellow-400 uppercase font-black tracking-widest bg-black/50 px-1 rounded">Spitter</div>
        </Html>
      </mesh>
      {projectiles.map(p => (
        <Projectile key={p.id} position={p.pos} velocity={p.vel} />
      ))}
    </group>
  );
};

export const Enemy = ({ id, position, onDie }: { id: number; position: [number, number, number]; onDie: (id: number) => void }) => {
  const [hp, setHp] = useState(3);
  const [isBlinking, setIsBlinking] = useState(false);
  const takeDamage = useStore(state => state.takeDamage);
  const addScore = useStore(state => state.addScore);
  const updateEnemyPosition = useStore(state => state.updateEnemyPosition);
  const spawnParticles = useStore(state => state.spawnParticles);
  const isPaused = useStore(state => state.isPaused);
  const gameOver = useStore(state => state.gameOver);
  const isCrouching = useStore(state => state.isCrouching);
  
  const [ref, api] = useSphere(() => ({
    mass: 1,
    position,
    args: [1],
    type: 'Dynamic',
  }));

  const meshRef = useRef<THREE.Mesh>(null);
  const enemyPos = useRef([0, 0, 0]);

  useEffect(() => {
    const unsubscribe = api.position.subscribe((p) => {
      enemyPos.current = p;
      updateEnemyPosition(`enemy-${id}`, p as [number, number, number]);
    });
    return () => {
      unsubscribe();
      setTimeout(() => {
        updateEnemyPosition(`enemy-${id}`, null);
      }, 0);
    };
  }, [id, api.position, updateEnemyPosition]);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.userData.isEnemy = true;
      meshRef.current.userData.onHit = (dmg: number) => {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 100);
        spawnParticles(enemyPos.current as [number, number, number], '#ef4444', 5);
        setHp(prev => {
          const next = prev - dmg;
          if (next <= 0) {
            setTimeout(() => {
              addScore(500);
              onDie(id);
            }, 0);
          }
          return next;
        });
      };
    }
  }, [id, onDie, addScore, spawnParticles]);

  const lastAttack = useRef(0);

  useFrame((state) => {
    if (isPaused || gameOver) return;
    
    // Simple AI: Move towards player
    const playerPos = state.camera.position;
    const direction = new THREE.Vector3(
      playerPos.x - enemyPos.current[0],
      0,
      playerPos.z - enemyPos.current[2]
    ).normalize();
    
    const dist = playerPos.distanceTo(new THREE.Vector3(...enemyPos.current));
    const aggroRange = isCrouching ? 5 : 15;
    
    // Charge logic
    if (dist < aggroRange) {
      const isCharging = dist < 8 && dist > 2;
      const speed = isCharging ? 4 : 2;
      api.velocity.set(direction.x * speed, -1, direction.z * speed);
    } else {
      api.velocity.set(0, -1, 0);
    }

    // Damage player if close with cooldown
    if (dist < 2 && state.clock.elapsedTime - lastAttack.current > 1.5) {
      lastAttack.current = state.clock.elapsedTime;
      takeDamage(10);
      spawnParticles(enemyPos.current as [number, number, number], '#ffffff', 10);
    }
  });

  return (
    <group ref={ref as any}>
      <mesh castShadow userData={{ isEnemy: true }}>
        <mesh ref={meshRef}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color={isBlinking ? "#ffffff" : (hp < 2 ? "#65a30d" : "#4d7c0f")} />
        </mesh>
      </mesh>
      <Html position={[0, 1.5, 0]} center>
        <div className="text-[8px] text-lime-400 uppercase font-black tracking-widest bg-black/50 px-1 rounded">Runner</div>
      </Html>
    </group>
  );
};

export const Boss = ({ id, position, onDie }: { id: number; position: [number, number, number]; onDie: (id: number) => void }) => {
  const level = useStore(state => state.level);
  const [hp, setHp] = useState(50 + level * 20);
  const [isBlinking, setIsBlinking] = useState(false);
  const takeDamage = useStore(state => state.takeDamage);
  const addScore = useStore(state => state.addScore);
  const updateEnemyPosition = useStore(state => state.updateEnemyPosition);
  const spawnParticles = useStore(state => state.spawnParticles);
  const isPaused = useStore(state => state.isPaused);
  const gameOver = useStore(state => state.gameOver);
  const isCrouching = useStore(state => state.isCrouching);
  
  const isRage = hp < (50 + level * 20) / 2;
  
  const [ref, api] = useSphere(() => ({
    mass: 10,
    position,
    args: [3],
    type: 'Dynamic',
  }));

  const meshRef = useRef<THREE.Group>(null);
  const enemyPos = useRef([0, 0, 0]);

  useEffect(() => {
    const unsubscribe = api.position.subscribe((p) => {
      enemyPos.current = p;
      updateEnemyPosition(`boss-${id}`, p as [number, number, number]);
    });
    return () => {
      unsubscribe();
      setTimeout(() => {
        updateEnemyPosition(`boss-${id}`, null);
      }, 0);
    };
  }, [id, api.position, updateEnemyPosition]);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.userData.isEnemy = true;
      meshRef.current.userData.onHit = (dmg: number) => {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 100);
        setHp(prev => {
          const next = prev - dmg;
          if (next <= 0) {
            setTimeout(() => {
              addScore(5000);
              onDie(id);
            }, 0);
          }
          return next;
        });
      };
    }
  }, [id, onDie, addScore]);

  const lastAttack = useRef(0);

  useFrame((state) => {
    if (isPaused || gameOver) return;
    
    const playerPos = state.camera.position;
    const dist = playerPos.distanceTo(new THREE.Vector3(...enemyPos.current));
    const aggroRange = isCrouching ? 10 : 30;
    
    if (dist < aggroRange) {
      const direction = new THREE.Vector3(
        playerPos.x - enemyPos.current[0],
        0,
        playerPos.z - enemyPos.current[2]
      ).normalize();
      
      const speed = isRage ? 3 : 1.5;
      api.velocity.set(direction.x * speed, -1, direction.z * speed);
    } else {
      api.velocity.set(0, -1, 0);
    }
    
    // Boss Stomp Attack
    const attackCooldown = isRage ? 2 : 4;
    if (dist < 6 && state.clock.elapsedTime - lastAttack.current > attackCooldown) {
      lastAttack.current = state.clock.elapsedTime;
      takeDamage(isRage ? 40 : 25);
      spawnParticles(enemyPos.current as [number, number, number], isRage ? '#ff0000' : '#ef4444', 50);
      // Visual feedback for stomp
      if (meshRef.current) {
        meshRef.current.position.y += 1.5;
        setTimeout(() => { if (meshRef.current) meshRef.current.position.y -= 1.5; }, 200);
      }
    } else if (dist < 5) {
      takeDamage(isRage ? 1 : 0.5);
    }
  });

  return (
    <group ref={ref as any}>
      <group ref={meshRef as any}>
        <mesh castShadow>
          <boxGeometry args={[4, 4, 4]} />
          <meshStandardMaterial 
            color={isBlinking ? "#ffffff" : (isRage ? "#451a03" : "#3f6212")} 
            emissive={isRage ? "#78350f" : "#000000"}
            emissiveIntensity={isRage ? 0.5 : 0}
          />
        </mesh>
        <mesh position={[0, 3, 0]}>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshStandardMaterial color={isRage ? "#b45309" : "#65a30d"} emissive={isRage ? "#b45309" : "#000000"} emissiveIntensity={isRage ? 1 : 0} />
        </mesh>
      </group>
      <Html position={[0, 5, 0]} center>
        <div className="w-48 h-3 bg-black/60 rounded-full border border-white/10 overflow-hidden p-0.5">
          <div 
            className={`h-full transition-all duration-300 ${isRage ? 'bg-orange-600 animate-pulse' : 'bg-orange-500'}`} 
            style={{ width: `${(hp / (50 + level * 20)) * 100}%` }} 
          />
        </div>
        <div className={`text-[10px] font-black tracking-widest text-center mt-1 uppercase ${isRage ? 'text-orange-500 scale-110' : 'text-orange-400'}`}>
          {isRage ? '!!! BLOATER (ENRAGED) !!!' : 'BLOATER'}
        </div>
      </Html>
    </group>
  );
};

export const EnemySpawner = () => {
  const gameStarted = useStore((state) => state.gameStarted);
  const gameOver = useStore((state) => state.gameOver);
  const isPaused = useStore((state) => state.isPaused);
  const [enemies, setEnemies] = useState<{ id: number; position: [number, number, number] }[]>([]);
  const [scouts, setScouts] = useState<{ id: number; position: [number, number, number] }[]>([]);
  const [bosses, setBosses] = useState<{ id: number; position: [number, number, number] }[]>([]);
  const [loots, setLoots] = useState<{ id: number; position: [number, number, number]; type: LootType }[]>([]);

  const handleDie = useCallback((id: number, position: [number, number, number], type: 'enemy' | 'scout' | 'boss' = 'enemy') => {
    if (type === 'boss') {
      setBosses(prev => prev.filter(e => e.id !== id));
    } else if (type === 'scout') {
      setScouts(prev => prev.filter(e => e.id !== id));
    } else {
      setEnemies(prev => prev.filter(e => e.id !== id));
    }
    
    // Drop loot
    const isBoss = type === 'boss';
    const dropCount = isBoss ? 5 : 1;
    for (let i = 0; i < dropCount; i++) {
      if (Math.random() > 0.5 || isBoss) {
        const types: LootType[] = ['health_pack', 'ammo_pack', 'food', 'water'];
        const type = types[Math.floor(Math.random() * types.length)];
        const lootPos: [number, number, number] = [
          position[0] + (Math.random() - 0.5) * 2,
          position[1] + 1,
          position[2] + (Math.random() - 0.5) * 2
        ];
        setLoots(prev => [...prev, { id: Date.now() + Math.random(), position: lootPos, type }]);
      }
    }
  }, []);

  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return;

    const interval = setInterval(() => {
      setEnemies((prev) => {
        if (prev.length < 8) {
          return [
            ...prev,
            {
              id: Date.now() + Math.random(),
              position: [
                (Math.random() - 0.5) * 100,
                5,
                (Math.random() - 0.5) * 100,
              ],
            },
          ];
        }
        return prev;
      });

      // Spawn scouts
      setScouts(prev => {
        if (prev.length < 4 && Math.random() > 0.7) {
          return [...prev, {
            id: Date.now() + Math.random(),
            position: [(Math.random() - 0.5) * 120, 5, (Math.random() - 0.5) * 120]
          }];
        }
        return prev;
      });

      // Spawn boss occasionally
      if (Math.random() > 0.95) {
        setBosses(prev => {
          if (prev.length < 1) {
            return [{
              id: Date.now() + Math.random(),
              position: [(Math.random() - 0.5) * 150, 10, (Math.random() - 0.5) * 150]
            }];
          }
          return prev;
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [gameStarted, gameOver, isPaused]);

  return (
    <>
      {enemies.map((enemy) => (
        <Enemy key={enemy.id} id={enemy.id} position={enemy.position} onDie={(id) => handleDie(id, enemy.position)} />
      ))}
      {scouts.map((scout) => (
        <AlienScout key={scout.id} id={scout.id} position={scout.position} onDie={(id) => handleDie(id, scout.position, 'scout')} />
      ))}
      {bosses.map((boss) => (
        <Boss key={boss.id} id={boss.id} position={boss.position} onDie={(id) => handleDie(id, boss.position, 'boss')} />
      ))}
      {loots.map((loot) => (
        <Loot 
          key={loot.id} 
          position={loot.position} 
          type={loot.type} 
          onPickUp={() => setLoots(prev => prev.filter(l => l.id !== loot.id))}
        />
      ))}
    </>
  );
};
