import React from 'react';
import { useBox } from '@react-three/cannon';

export const Voxel = ({ position, texture, onPointerDown }: { position: [number, number, number], texture: string, onPointerDown?: (e: any) => void }) => {
  const [ref] = useBox(() => ({
    type: 'Static',
    position,
    args: [1, 1, 1],
  }));

  const colors: Record<string, string> = {
    grass: '#166534', // Darker, overgrown grass
    dirt: '#451a03', // Dark mud
    stone: '#44403c', // Dark ruined stone
    wood: '#78350f', // Rotting wood
    leaf: '#064e3b', // Dark leaves
    brick: '#7f1d1d', // Mossy brick
    glass: '#93c5fd',
    neon: '#10b981', // Emerald neon
    metal: '#52525b', // Rusted metal
    glowstone: '#ca8a04', // Dimmer glowstone
  };

  const isTransparent = texture === 'glass';
  const isEmissive = texture === 'neon' || texture === 'glowstone';
  const isMetal = texture === 'metal';

  return (
    <mesh 
      ref={ref as any} 
      castShadow={!isTransparent}
      receiveShadow 
      onPointerDown={onPointerDown}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
        color={colors[texture] || '#ffffff'} 
        transparent={isTransparent}
        opacity={isTransparent ? 0.4 : 1}
        emissive={isEmissive ? colors[texture] : '#000000'}
        emissiveIntensity={isEmissive ? 2 : 0}
        metalness={isMetal ? 0.8 : 0}
        roughness={isMetal ? 0.2 : 0.7}
      />
    </mesh>
  );
};
