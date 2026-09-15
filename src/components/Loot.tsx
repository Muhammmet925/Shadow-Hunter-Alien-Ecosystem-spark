import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useBox } from '@react-three/cannon';
import { useStore } from '../store';
import * as THREE from 'three';

export type LootType = 'health_pack' | 'ammo_pack' | 'food' | 'water';

export const Loot = ({ position, type, onPickUp }: { position: [number, number, number], type: LootType, onPickUp: () => void }) => {
  const addInventoryItem = useStore((state) => state.addInventoryItem);
  const [isPickedUp, setIsPickedUp] = useState(false);
  const [ref] = useBox(() => ({
    mass: 0.5,
    position,
    args: [0.5, 0.5, 0.5],
    type: 'Dynamic',
  }));

  const meshRef = useRef<THREE.Mesh>(null);
  const colors: Record<LootType, string> = {
    health_pack: '#10b981',
    ammo_pack: '#f59e0b',
    food: '#f97316',
    water: '#06b6d4',
  };

  useFrame((state) => {
    if (meshRef.current && !isPickedUp) {
      meshRef.current.rotation.y += 0.02;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
      
      const dist = state.camera.position.distanceTo(meshRef.current.getWorldPosition(new THREE.Vector3()));
      if (dist < 2) {
        setIsPickedUp(true);
        addInventoryItem(type, 1);
        onPickUp();
      }
    }
  });

  return (
    <mesh ref={ref as any}>
      <mesh ref={meshRef}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color={colors[type]} emissive={colors[type]} emissiveIntensity={0.5} />
      </mesh>
    </mesh>
  );
};
