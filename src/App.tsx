import React, { Suspense, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sky, Stars, Environment as DreiEnvironment, Html } from '@react-three/drei';
import { Physics } from '@react-three/cannon';
import { useStore } from './store';
import { Player } from './components/Player';
import { Ground } from './components/Ground';
import { Environment } from './components/Environment';
import { EnemySpawner } from './components/Enemy';
import { WildlifeSpawner } from './components/Wildlife';
import { HUD, StartMenu, PauseMenu, GameOver } from './components/UI';
import { audioManager } from './utils/audioManager';

const Rain = () => {
  const points = React.useMemo(() => {
    const p = new Float32Array(1000 * 3);
    for (let i = 0; i < 1000; i++) {
      p[i * 3] = (Math.random() - 0.5) * 50;
      p[i * 3 + 1] = Math.random() * 20;
      p[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    return p;
  }, []);

  const ref = React.useRef<THREE.Points>(null);
  const { camera } = useThree();

  useFrame((state, delta) => {
    if (ref.current) {
      const positions = ref.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < 1000; i++) {
        positions[i * 3 + 1] -= 20 * delta;
        if (positions[i * 3 + 1] < 0) {
          positions[i * 3 + 1] = 20;
        }
      }
      ref.current.geometry.attributes.position.needsUpdate = true;
      ref.current.position.set(camera.position.x, 0, camera.position.z);
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length / 3}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.1} color="#93c5fd" transparent opacity={0.6} />
    </points>
  );
};

const ParticleSystem = () => {
  const particles = useStore(state => state.particles);
  return (
    <>
      {particles.map(p => (
        <mesh key={p.id} position={p.pos}>
          <sphereGeometry args={[0.1 * p.life, 4, 4]} />
          <meshBasicMaterial color={p.color} transparent opacity={p.life} />
        </mesh>
      ))}
    </>
  );
};

const DamageIndicators = () => {
  const indicators = useStore(state => state.damageIndicators);
  return (
    <>
      {indicators.map(i => (
        <Html key={i.id} position={i.pos} center>
          <div 
            className="text-red-500 font-black text-lg pointer-events-none select-none"
            style={{ 
              opacity: i.life,
              transform: `translateY(${(1 - i.life) * -50}px) scale(${0.5 + i.life * 0.5})`
            }}
          >
            {i.amount}
          </div>
        </Html>
      ))}
    </>
  );
};

const Lighting = () => {
  const [dayTime, setDayTime] = React.useState(0);
  const currentMap = useStore(state => state.currentMap);
  const weather = useStore(state => state.weather);

  useFrame((state, delta) => {
    setDayTime(prev => (prev + delta * 0.05) % (Math.PI * 2));
  });

  const sunPos = [
    Math.cos(dayTime) * 100,
    Math.sin(dayTime) * 100,
    50
  ] as [number, number, number];

  const isNight = sunPos[1] < 0;

  return (
    <>
      {currentMap === 'earth' && (
        <>
          <Sky sunPosition={sunPos} />
          {isNight && <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />}
          <ambientLight intensity={isNight ? 0.1 : 0.5} />
          <directionalLight
            position={sunPos}
            intensity={isNight ? 0 : 1}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          {weather === 'fog' && <fog attach="fog" args={['#0f172a', 0, 30]} />}
          {weather === 'rain' && <Rain />}
        </>
      )}

      {currentMap === 'space' && (
        <>
          <Stars radius={120} depth={60} count={7000} factor={6} saturation={1} fade speed={1.5} />
          <ambientLight intensity={0.25} color="#38bdf8" />
          <pointLight position={[20, 30, 20]} intensity={2.5} color="#0284c7" />
          <pointLight position={[-20, 10, -20]} intensity={1.5} color="#a855f7" />
          <fog attach="fog" args={['#020617', 10, 90]} />
        </>
      )}

      {currentMap === 'mars' && (
        <>
          {/* Blood Red Hellish Martian Atmosphere */}
          <Stars radius={100} depth={40} count={3000} factor={4} saturation={1} fade speed={0.5} />
          <ambientLight intensity={0.35} color="#ef4444" />
          <directionalLight
            position={[40, 60, 30]}
            intensity={1.2}
            color="#f97316"
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <fog attach="fog" args={['#450a0a', 5, 70]} />
          {/* Phobos Demon Moon in sky */}
          <mesh position={[70, 50, -80]}>
            <sphereGeometry args={[14, 16, 16]} />
            <meshStandardMaterial color="#991b1b" emissive="#7f1d1d" emissiveIntensity={0.5} roughness={0.9} />
          </mesh>
        </>
      )}

      {currentMap === 'moon' && (
        <>
          {/* Stark Vacuum & Earth in Lunar Sky */}
          <Stars radius={140} depth={60} count={8000} factor={5} saturation={0} fade speed={0.2} />
          <ambientLight intensity={0.15} color="#cbd5e1" />
          <directionalLight
            position={[80, 70, 50]}
            intensity={1.8}
            color="#ffffff"
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <fog attach="fog" args={['#020617', 20, 110]} />
          {/* Majestic Earth visible from the Moon */}
          <group position={[-50, 45, -90]}>
            <mesh>
              <sphereGeometry args={[16, 32, 32]} />
              <meshStandardMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={0.3} roughness={0.4} />
            </mesh>
            {/* Earth Atmosphere Halo */}
            <mesh>
              <sphereGeometry args={[16.6, 32, 32]} />
              <meshBasicMaterial color="#38bdf8" transparent opacity={0.15} />
            </mesh>
          </group>
        </>
      )}

      {/* Combat VFX always active on all maps */}
      <ParticleSystem />
      <DamageIndicators />
    </>
  );
};

export default function App() {
  const gameStarted = useStore(state => state.gameStarted);
  const activeMenu = useStore(state => state.activeMenu);
  const gameOver = useStore(state => state.gameOver);
  const currentMap = useStore(state => state.currentMap);
  const tick = useStore(state => state.tick);

  const gravity = React.useMemo(() => {
    switch (currentMap) {
      case 'moon': return -2.2;
      case 'space': return -3.5;
      case 'mars': return -5.2;
      case 'earth':
      default: return -9.81;
    }
  }, [currentMap]);

  useEffect(() => {
    let lastTime = performance.now();
    const frame = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;
      tick(delta);
      requestAnimationFrame(frame);
    };
    const id = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(id);
  }, [tick]);

  // Ambient audio management
  useEffect(() => {
    if (gameStarted && !gameOver && activeMenu === 'none') {
      audioManager.startAmbience(currentMap);
    } else {
      audioManager.stopAmbience();
    }
  }, [gameStarted, gameOver, activeMenu, currentMap]);

  return (
    <div className="w-full h-screen bg-black overflow-hidden font-sans">
      <Canvas shadows camera={{ fov: 90 }}>
        <Suspense fallback={null}>
          <Lighting />

          <Physics key={currentMap} gravity={[0, gravity, 0]}>
            <Player />
            <Ground />
            <Environment />
            <EnemySpawner />
            <WildlifeSpawner />
          </Physics>
        </Suspense>
      </Canvas>

      <HUD />
      
      {!gameStarted && <StartMenu />}
      {activeMenu === 'pause' && <PauseMenu />}
      {gameOver && <GameOver />}

      <div className="fixed bottom-6 right-6 text-[10px] text-white/20 font-mono uppercase tracking-widest">
        v1.0.0-enhanced // shadow_hunter_os
      </div>
    </div>
  );
}
