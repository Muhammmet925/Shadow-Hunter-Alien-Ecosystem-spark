import React, { useRef, useEffect, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface SafePointerLockControlsProps {
  enabled: boolean;
  pointerSpeed?: number;
  onUnlock?: () => void;
}

export const SafePointerLockControls: React.FC<SafePointerLockControlsProps> = ({
  enabled,
  pointerSpeed = 0.5,
  onUnlock,
}) => {
  const { camera, gl, setEvents, get } = useThree();
  const lastUnlockTime = useRef<number>(0);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Center raycasting compute while controls are enabled
  useEffect(() => {
    if (!enabled) return;
    const oldComputeOffsets = get().events.compute;
    setEvents({
      compute(event, state) {
        const offsetX = state.size.width / 2;
        const offsetY = state.size.height / 2;
        state.pointer.set((offsetX / state.size.width) * 2 - 1, -(offsetY / state.size.height) * 2 + 1);
        state.raycaster.setFromCamera(state.pointer, state.camera);
      },
    });
    return () => {
      setEvents({ compute: oldComputeOffsets });
    };
  }, [enabled, get, setEvents]);

  // Handle camera rotation on mousemove while pointer is locked
  useEffect(() => {
    const domElement = gl.domElement;
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    const PI_2 = Math.PI / 2;

    const onMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement !== domElement) return;
      euler.setFromQuaternion(camera.quaternion);
      euler.y -= event.movementX * 0.002 * pointerSpeed;
      euler.x -= event.movementY * 0.002 * pointerSpeed;
      euler.x = Math.max(-PI_2 + 0.01, Math.min(PI_2 - 0.01, euler.x));
      camera.quaternion.setFromEuler(euler);
    };

    document.addEventListener('mousemove', onMouseMove);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
    };
  }, [camera, gl.domElement, pointerSpeed]);

  // Safe requestPointerLock with browser cooldown defense
  const safeRequestLock = useCallback(() => {
    const domElement = gl.domElement;
    if (!domElement) return;
    if (document.pointerLockElement === domElement) return;

    const elapsed = Date.now() - lastUnlockTime.current;
    // Chromium enforces ~1.25s cooldown after pointer lock exit
    if (elapsed < 1250) {
      if (lockTimer.current) clearTimeout(lockTimer.current);
      lockTimer.current = setTimeout(() => {
        if (enabled && document.pointerLockElement !== domElement) {
          try {
            const p = domElement.requestPointerLock();
            if (p && typeof (p as any).catch === 'function') {
              (p as any).catch(() => {});
            }
          } catch {
            // Ignore cooldown or user cancellation error
          }
        }
      }, 1250 - elapsed + 50);
      return;
    }

    try {
      const p = domElement.requestPointerLock();
      if (p && typeof (p as any).catch === 'function') {
        (p as any).catch(() => {});
      }
    } catch {
      // Ignore sync exception in older browsers
    }
  }, [enabled, gl.domElement]);

  // Listen for clicks ONLY on the canvas element (not document / UI menus)
  useEffect(() => {
    const domElement = gl.domElement;
    if (!domElement) return;

    const handleClick = () => {
      if (enabled) {
        safeRequestLock();
      }
    };

    domElement.addEventListener('click', handleClick);
    return () => {
      domElement.removeEventListener('click', handleClick);
      if (lockTimer.current) clearTimeout(lockTimer.current);
    };
  }, [enabled, gl.domElement, safeRequestLock]);

  // Track lock / unlock transitions
  useEffect(() => {
    const domElement = gl.domElement;
    let wasLocked = document.pointerLockElement === domElement;

    const onPointerLockChange = () => {
      const isLocked = document.pointerLockElement === domElement;
      if (wasLocked && !isLocked) {
        lastUnlockTime.current = Date.now();
        onUnlock?.();
      }
      wasLocked = isLocked;
    };

    const onPointerLockError = (e: Event) => {
      e.stopPropagation?.();
    };

    document.addEventListener('pointerlockchange', onPointerLockChange);
    document.addEventListener('pointerlockerror', onPointerLockError);
    return () => {
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      document.removeEventListener('pointerlockerror', onPointerLockError);
    };
  }, [gl.domElement, onUnlock]);

  // When disabled (menu open), safely exit pointer lock if currently locked
  useEffect(() => {
    if (!enabled && document.pointerLockElement === gl.domElement) {
      try {
        document.exitPointerLock();
      } catch {
        // Ignore
      }
    }
  }, [enabled, gl.domElement]);

  return null;
};
