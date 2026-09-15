import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../store';
import { Voxel } from './Voxel';

export const World = () => {
  const blocks = useStore((state) => state.blocks);
  const [renderedBlocks, setRenderedBlocks] = React.useState<[string, string][]>([]);
  const lastUpdatePos = useRef(new THREE.Vector3());

  useFrame((state) => {
    const dist = state.camera.position.distanceTo(lastUpdatePos.current);
    if (dist > 5) {
      lastUpdatePos.current.copy(state.camera.position);
      const newRendered = Object.entries(blocks).filter(([pos]) => {
        const [x, y, z] = pos.split(',').map(Number);
        const d = state.camera.position.distanceTo(new THREE.Vector3(x, y, z));
        return d < 50;
      });
      setRenderedBlocks(newRendered);
    }
  });

  // Also update when blocks change
  React.useEffect(() => {
    const newRendered = Object.entries(blocks).filter(([pos]) => {
      const [x, y, z] = pos.split(',').map(Number);
      const d = lastUpdatePos.current.distanceTo(new THREE.Vector3(x, y, z));
      return d < 50;
    });
    setRenderedBlocks(newRendered);
  }, [blocks]);

  return (
    <>
      {renderedBlocks.map(([pos, type]) => {
        const [x, y, z] = pos.split(',').map(Number);
        return <Voxel key={pos} position={[x, y, z]} texture={type} />;
      })}
    </>
  );
};
