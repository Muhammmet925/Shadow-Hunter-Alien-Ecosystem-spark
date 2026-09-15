import React, { useMemo } from 'react';
import { usePlane } from '@react-three/cannon';
import { useStore } from '../store';

export const Ground = () => {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
  }));

  const currentMap = useStore((state) => state.currentMap);

  // Ground appearance per map
  const groundConfig = useMemo(() => {
    switch (currentMap) {
      case 'space':
        return {
          color: '#0f172a',
          roughness: 0.3,
          metalness: 0.8,
          wireframe: false,
          emissive: '#0284c7',
          emissiveIntensity: 0.05,
        };
      case 'mars':
        return {
          color: '#7f1d1d',
          roughness: 0.9,
          metalness: 0.1,
          wireframe: false,
          emissive: '#991b1b',
          emissiveIntensity: 0.08,
        };
      case 'moon':
        return {
          color: '#64748b',
          roughness: 0.95,
          metalness: 0.05,
          wireframe: false,
          emissive: '#334155',
          emissiveIntensity: 0.02,
        };
      case 'earth':
      default:
        return {
          color: '#1e3a1e',
          roughness: 0.85,
          metalness: 0.1,
          wireframe: false,
          emissive: '#000000',
          emissiveIntensity: 0,
        };
    }
  }, [currentMap]);

  return (
    <group>
      <mesh ref={ref as any} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial {...groundConfig} />
      </mesh>

      {/* Map-specific ground overlays */}
      {currentMap === 'space' && (
        <group position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          {/* Cyber platform grid lines */}
          <gridHelper args={[200, 40, '#06b6d4', '#0369a1']} rotation={[Math.PI / 2, 0, 0]} />
          {/* Central docking ring */}
          <mesh position={[0, 0, 0.01]}>
            <ringGeometry args={[12, 12.5, 32]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
          <mesh position={[0, 0, 0.01]}>
            <ringGeometry args={[25, 25.8, 48]} />
            <meshBasicMaterial color="#0284c7" />
          </mesh>
        </group>
      )}

      {currentMap === 'mars' && (
        <group position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          {/* Lava fissure veins */}
          <mesh position={[0, 0, 0.01]}>
            <ringGeometry args={[30, 32, 6]} />
            <meshStandardMaterial color="#f97316" emissive="#ef4444" emissiveIntensity={1.5} />
          </mesh>
          <mesh position={[40, 20, 0.01]}>
            <ringGeometry args={[18, 19.5, 5]} />
            <meshStandardMaterial color="#ea580c" emissive="#dc2626" emissiveIntensity={1.8} />
          </mesh>
        </group>
      )}

      {currentMap === 'moon' && (
        <group position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          {/* Lunar crater rings */}
          <mesh position={[15, -25, 0.01]}>
            <ringGeometry args={[8, 9.5, 24]} />
            <meshStandardMaterial color="#94a3b8" roughness={1} />
          </mesh>
          <mesh position={[-35, 30, 0.01]}>
            <ringGeometry args={[14, 16, 28]} />
            <meshStandardMaterial color="#475569" roughness={1} />
          </mesh>
          <mesh position={[50, -40, 0.01]}>
            <ringGeometry args={[22, 24.5, 32]} />
            <meshStandardMaterial color="#334155" roughness={1} />
          </mesh>
        </group>
      )}
    </group>
  );
};
