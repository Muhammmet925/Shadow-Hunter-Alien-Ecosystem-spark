import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { SafePointerLockControls } from './SafePointerLockControls';
import { useSphere } from '@react-three/cannon';
import * as THREE from 'three';
import { useStore, WeaponType } from '../store';
import { World } from './World';
import { audioManager } from '../utils/audioManager';

const JUMP_FORCE = 4;
const SPEED = 5;

export const Player = () => {
  const { camera, scene } = useThree();
  const skills = useStore(state => state.skills);
  const gameStarted = useStore(state => state.gameStarted);
  const isPaused = useStore(state => state.isPaused);
  const gameOver = useStore(state => state.gameOver);
  const currentWeapon = useStore(state => state.currentWeapon);
  const setWeapon = useStore(state => state.setWeapon);
  const ammo = useStore(state => state.ammo);
  const consumeAmmo = useStore(state => state.consumeAmmo);
  const addBlock = useStore(state => state.addBlock);
  const removeBlock = useStore(state => state.removeBlock);
  const addInventoryItem = useStore(state => state.addInventoryItem);
  const selectedBlock = useStore(state => state.selectedBlock);
  const stamina = useStore(state => state.stamina);
  const isDashing = useStore(state => state.isDashing);
  const setDashing = useStore(state => state.setDashing);
  const isCrouching = useStore(state => state.isCrouching);
  const setCrouching = useStore(state => state.setCrouching);
  const flashlightOn = useStore(state => state.flashlightOn);
  const toggleFlashlight = useStore(state => state.toggleFlashlight);
  const spawnParticles = useStore(state => state.spawnParticles);
  const addDamageIndicator = useStore(state => state.addDamageIndicator);
  const setHoveringEnemy = useStore(state => state.setHoveringEnemy);
  const triggerFireRecoil = useStore(state => state.triggerFireRecoil);
  const setPlayerTransform = useStore(state => state.setPlayerTransform);
  const activeMenu = useStore(state => state.activeMenu);
  const setActiveMenu = useStore(state => state.setActiveMenu);
  
  // Suppress PointerLock API iframe / cooldown errors
  useEffect(() => {
    const handlePointerLockError = (e: Event) => {
      // Benign browser cooldown or iframe restrictions
    };
    document.addEventListener('pointerlockerror', handlePointerLockError);
    return () => {
      document.removeEventListener('pointerlockerror', handlePointerLockError);
    };
  }, []);

  const handlePointerUnlock = useCallback(() => {
    if (gameStarted && !gameOver && activeMenu === 'none') {
      setActiveMenu('pause');
    }
  }, [gameStarted, gameOver, activeMenu, setActiveMenu]);

  const [ref, api] = useSphere(() => ({
    mass: 1,
    type: 'Dynamic',
    position: [0, 5, 0],
    args: [1],
    fixedRotation: true,
  }));

  const velocity = useRef([0, 0, 0]);
  useEffect(() => api.velocity.subscribe((v) => (velocity.current = v)), [api.velocity]);

  const pos = useRef([0, 0, 0]);
  useEffect(() => api.position.subscribe((p) => (pos.current = p)), [api.position]);

  const [highlightPos, setHighlightPos] = useState<[number, number, number] | null>(null);

  const keys = useRef<Record<string, boolean>>({});
  const raycaster = useRef(new THREE.Raycaster());
  const lastTransformUpdate = useRef(0);

  const attack = useCallback(() => {
    if (!gameStarted || isPaused || gameOver) return;

    // Check ammo for firearms
    if (currentWeapon === 'pistol' && ammo.pistol <= 0) return;
    if (currentWeapon === 'shotgun' && ammo.shotgun <= 0) return;
    if (currentWeapon === 'chaingun' && ammo.chaingun <= 0) return;
    if (currentWeapon === 'plasma' && ammo.plasma <= 0) return;
    if (currentWeapon === 'rocket' && ammo.rocket <= 0) return;
    if (currentWeapon === 'bfg' && ammo.bfg < 40) return;
    if (currentWeapon === 'laser' && ammo.laser <= 0) return;

    // Trigger crosshair recoil kick & procedural weapon sound
    triggerFireRecoil();
    audioManager.playFire(currentWeapon);

    if (currentWeapon !== 'melee' && currentWeapon !== 'builder') {
      consumeAmmo(currentWeapon);
    }

    // Raycasting for interaction
    raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.current.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
      const intersect = intersects[0];
      const object = intersect.object;
      const hitPoint = intersect.point;
      
      // Calculate Doom weapon base damage
      let baseDamage = 0;
      switch (currentWeapon) {
        case 'melee': baseDamage = 8; break;
        case 'pistol': baseDamage = 14; break;
        case 'shotgun': baseDamage = 45; break; // Heavy double-barrel punch
        case 'chainsaw': baseDamage = 35; break; // Close-range rip & tear
        case 'chaingun': baseDamage = 10; break; // High rate of fire
        case 'plasma': baseDamage = 22; break; // Plasma thermal burn
        case 'rocket': baseDamage = 95; break; // High direct rocket hit
        case 'bfg': baseDamage = 380; break; // Cataclysmic devastation
        case 'laser': baseDamage = 25; break;
        default: baseDamage = 0;
      }

      // Handle Explosive weapons (Rocket & BFG splash damage)
      if (currentWeapon === 'rocket' || currentWeapon === 'bfg') {
        const isBfg = currentWeapon === 'bfg';
        const splashRadius = isBfg ? 25 : 10;
        const particleColor = isBfg ? '#22c55e' : '#f97316';
        
        audioManager.playExplosion(isBfg);
        spawnParticles([hitPoint.x, hitPoint.y + 0.5, hitPoint.z], particleColor, isBfg ? 40 : 20);

        // Scan scene for any enemy entities within blast radius
        scene.traverse((child) => {
          if (child.userData && child.userData.onHit && child !== object) {
            const worldPos = new THREE.Vector3();
            child.getWorldPosition(worldPos);
            const dist = worldPos.distanceTo(hitPoint);
            if (dist < splashRadius) {
              const falloff = 1 - (dist / splashRadius);
              const splashDmg = Math.round(baseDamage * falloff * 0.75);
              if (splashDmg > 0) {
                child.userData.onHit(splashDmg);
                addDamageIndicator([worldPos.x, worldPos.y + 1, worldPos.z], splashDmg);
                spawnParticles([worldPos.x, worldPos.y + 0.5, worldPos.z], particleColor, 8);
              }
            }
          }
        });
      }

      // Direct hit Combat against enemy or wildlife
      if (object.userData && object.userData.onHit) {
        if (baseDamage > 0) {
          const totalDamage = baseDamage + skills.damage;
          object.userData.onHit(totalDamage);
          audioManager.playHitImpact(true);
          const pColor = currentWeapon === 'plasma' ? '#38bdf8' : currentWeapon === 'bfg' ? '#22c55e' : '#ef4444';
          spawnParticles([hitPoint.x, hitPoint.y, hitPoint.z], pColor, currentWeapon === 'shotgun' ? 14 : 6);
          addDamageIndicator([hitPoint.x, hitPoint.y + 0.5, hitPoint.z], totalDamage);
        }
        return;
      }

      // Building / Resource Gathering
      if (currentWeapon === 'builder') {
        const p = intersect.point.clone().add(intersect.face!.normal.clone().multiplyScalar(0.5));
        const x = Math.round(p.x);
        const y = Math.round(p.y);
        const z = Math.round(p.z);
        addBlock(`${x},${y},${z}`, selectedBlock);
        spawnParticles([x, y, z], '#4ade80', 8);
      } else if (object.userData && object.userData.isResource) {
        // Resource gathering
        object.userData.onHarvest();
        audioManager.playHitImpact(false);
      }
    }
  }, [camera, scene, gameStarted, isPaused, gameOver, skills.damage, currentWeapon, ammo, consumeAmmo, addBlock, triggerFireRecoil, selectedBlock, spawnParticles, addDamageIndicator]);

  const remove = useCallback(() => {
    if (!gameStarted || isPaused || gameOver || currentWeapon !== 'builder') return;

    raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.current.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
      const intersect = intersects[0];
      const p = intersect.object.position;
      removeBlock(`${p.x},${p.y},${p.z}`);
      audioManager.playFire('melee');
      spawnParticles([p.x, p.y, p.z], '#ffffff', 8);
    }
  }, [camera, scene, gameStarted, isPaused, gameOver, currentWeapon, removeBlock, spawnParticles]);

  const ALL_WEAPONS: WeaponType[] = ['melee', 'pistol', 'shotgun', 'chainsaw', 'chaingun', 'plasma', 'rocket', 'bfg', 'laser', 'builder'];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      if (e.code === 'Digit1') setWeapon('melee');
      if (e.code === 'Digit2') setWeapon('pistol');
      if (e.code === 'Digit3') setWeapon('shotgun');
      if (e.code === 'Digit4') setWeapon('chainsaw');
      if (e.code === 'Digit5') setWeapon('chaingun');
      if (e.code === 'Digit6') setWeapon('plasma');
      if (e.code === 'Digit7') setWeapon('rocket');
      if (e.code === 'Digit8') setWeapon('bfg');
      if (e.code === 'Digit9') setWeapon('laser');
      if (e.code === 'Digit0') setWeapon('builder');
      
      if (e.code === 'ShiftLeft' && stamina > 30 && !isDashing && !isCrouching) {
        setDashing(true);
      }
      if (e.code === 'ControlLeft') {
        setCrouching(true);
      }
      if (e.code === 'KeyF') {
        toggleFlashlight();
        audioManager.playFlashlightClick();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
      if (e.code === 'ShiftLeft') {
        setDashing(false);
      }
      if (e.code === 'ControlLeft') {
        setCrouching(false);
      }
    };
    const handleClick = (e: MouseEvent) => {
      if (e.button === 0) attack();
      if (e.button === 2) remove();
    };
    const handleWheel = (e: WheelEvent) => {
      if (!gameStarted || isPaused || gameOver) return;
      const idx = ALL_WEAPONS.indexOf(currentWeapon);
      if (idx !== -1) {
        const nextIdx = e.deltaY > 0 
          ? (idx + 1) % ALL_WEAPONS.length 
          : (idx - 1 + ALL_WEAPONS.length) % ALL_WEAPONS.length;
        setWeapon(ALL_WEAPONS[nextIdx]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('wheel', handleWheel);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [attack, remove, setWeapon, currentWeapon, gameStarted, isPaused, gameOver, stamina, isDashing, isCrouching, toggleFlashlight]);

  useFrame(() => {
    if (!gameStarted || isPaused || gameOver) return;

    // Update highlight and hover
    raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.current.intersectObjects(scene.children, true);
    
    let foundEnemy = false;
    if (intersects.length > 0) {
      const intersect = intersects[0];
      if (intersect.object.userData.onHit) {
        foundEnemy = true;
      }

      if (currentWeapon === 'builder' && intersect.distance < 10) {
        const p = intersect.point.clone().add(intersect.face!.normal.clone().multiplyScalar(0.5));
        setHighlightPos([Math.round(p.x), Math.round(p.y), Math.round(p.z)]);
      } else {
        setHighlightPos(null);
      }
    } else {
      setHighlightPos(null);
    }
    setHoveringEnemy(foundEnemy);

    // Movement detection & Footstep audio
    const isMovingNow = Boolean(
      keys.current['KeyW'] || keys.current['KeyS'] || keys.current['KeyA'] || keys.current['KeyD']
    );

    if (isMovingNow && Math.abs(velocity.current[1]) < 0.2) {
      audioManager.playFootstep(isDashing, isCrouching);
    }

    // Update player transform for radar & crosshair (throttled to 45ms)
    const now = performance.now();
    if (now - lastTransformUpdate.current > 45) {
      lastTransformUpdate.current = now;
      setPlayerTransform(
        [pos.current[0], pos.current[1], pos.current[2]],
        camera.rotation.y,
        isMovingNow
      );
    }

    const targetHeight = isCrouching ? 0.2 : 0.75;
    camera.position.copy(new THREE.Vector3(pos.current[0], pos.current[1] + targetHeight, pos.current[2]));

    const direction = new THREE.Vector3();
    const frontVector = new THREE.Vector3(
      0,
      0,
      Number(keys.current['KeyS'] || false) - Number(keys.current['KeyW'] || false)
    );
    const sideVector = new THREE.Vector3(
      Number(keys.current['KeyA'] || false) - Number(keys.current['KeyD'] || false),
      0,
      0
    );

    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar((SPEED + skills.speed) * (isCrouching ? 0.4 : (isDashing ? 3 : 1)))
      .applyEuler(camera.rotation);

    api.velocity.set(direction.x, velocity.current[1], direction.z);

    if (keys.current['Space'] && Math.abs(velocity.current[1]) < 0.05) {
      api.velocity.set(velocity.current[0], JUMP_FORCE, velocity.current[2]);
    }
  });

  return (
    <>
      <SafePointerLockControls 
        pointerSpeed={0.5} 
        enabled={!isPaused && !gameOver && gameStarted && activeMenu === 'none'} 
        onUnlock={handlePointerUnlock}
      />
      <mesh ref={ref as any} />
      
      {/* Weapon Model */}
      <group position={camera.position}>
        <WeaponModel type={currentWeapon} />
        {flashlightOn && (
          <spotLight
            position={[0, 0, 0]}
            angle={0.6}
            penumbra={0.5}
            intensity={2}
            distance={30}
            castShadow
          />
        )}
      </group>

      {/* World Blocks */}
      <World />

      {/* Block Highlight */}
      {highlightPos && currentWeapon === 'builder' && (
        <mesh position={highlightPos}>
          <boxGeometry args={[1.01, 1.01, 1.01]} />
          <meshStandardMaterial color="#22d3ee" wireframe transparent opacity={0.3} />
        </mesh>
      )}
    </>
  );
};

const WeaponModel = ({ type }: { type: string }) => {
  const meshRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const isMoving = useStore((state) => state.isMoving);

  useFrame((state) => {
    if (meshRef.current) {
      // Doom style weapon bobbing
      const time = state.clock.elapsedTime * 9;
      const bobX = isMoving ? Math.cos(time * 0.5) * 0.025 : 0;
      const bobY = isMoving ? Math.abs(Math.sin(time)) * 0.025 : Math.sin(state.clock.elapsedTime * 2) * 0.005;

      // Position weapon relative to camera (centered or lower right)
      const isCenteredDoom = type === 'shotgun' || type === 'bfg' || type === 'rocket';
      const baseOffset = isCenteredDoom 
        ? new THREE.Vector3(bobX, -0.28 + bobY, -0.55) 
        : new THREE.Vector3(0.35 + bobX, -0.28 + bobY, -0.55);

      baseOffset.applyQuaternion(camera.quaternion);
      meshRef.current.position.copy(camera.position).add(baseOffset);
      meshRef.current.quaternion.copy(camera.quaternion);
    }
  });

  return (
    <group ref={meshRef}>
      {/* 1. Melee Combat Knife / Blade */}
      {type === 'melee' && (
        <group rotation={[Math.PI / 3, -0.2, 0]}>
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[0.04, 0.6, 0.02]} />
            <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.8} />
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[0.08, 0.15, 0.05]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </group>
      )}

      {/* 2. UAC Handgun */}
      {type === 'pistol' && (
        <group rotation={[0, 0, 0]}>
          <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[0.08, 0.12, 0.35]} />
            <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.1, 0.1]}>
            <boxGeometry args={[0.07, 0.22, 0.1]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
        </group>
      )}

      {/* 3. Super Shotgun (Double-Barrel Break-Action) */}
      {type === 'shotgun' && (
        <group rotation={[0.05, 0, 0]}>
          {/* Twin Left Barrel */}
          <mesh position={[-0.045, 0.02, -0.25]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.038, 0.038, 0.7, 12]} />
            <meshStandardMaterial color="#1e293b" metalness={0.95} roughness={0.2} />
          </mesh>
          {/* Twin Right Barrel */}
          <mesh position={[0.045, 0.02, -0.25]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.038, 0.038, 0.7, 12]} />
            <meshStandardMaterial color="#1e293b" metalness={0.95} roughness={0.2} />
          </mesh>
          {/* Walnut Wooden Grip & Stock */}
          <mesh position={[0, -0.06, 0.15]} rotation={[-0.2, 0, 0]}>
            <boxGeometry args={[0.11, 0.18, 0.35]} />
            <meshStandardMaterial color="#78350f" roughness={0.7} />
          </mesh>
          {/* Brass Break Receiver */}
          <mesh position={[0, 0.01, 0.08]}>
            <boxGeometry args={[0.13, 0.12, 0.15]} />
            <meshStandardMaterial color="#d97706" metalness={0.8} roughness={0.4} />
          </mesh>
        </group>
      )}

      {/* 4. Chainsaw */}
      {type === 'chainsaw' && (
        <group rotation={[0.1, -0.15, 0]}>
          {/* Yellow Motor Body */}
          <mesh position={[0, 0, 0.1]}>
            <boxGeometry args={[0.22, 0.22, 0.3]} />
            <meshStandardMaterial color="#eab308" metalness={0.4} roughness={0.4} />
          </mesh>
          {/* Steel Guide Bar */}
          <mesh position={[0, 0, -0.25]}>
            <boxGeometry args={[0.03, 0.14, 0.55]} />
            <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Cutting Chain / Teeth */}
          <mesh position={[0, 0.08, -0.25]}>
            <boxGeometry args={[0.05, 0.03, 0.53]} />
            <meshStandardMaterial color="#0f172a" metalness={0.95} />
          </mesh>
          <mesh position={[0, -0.08, -0.25]}>
            <boxGeometry args={[0.05, 0.03, 0.53]} />
            <meshStandardMaterial color="#0f172a" metalness={0.95} />
          </mesh>
          {/* Handle Grip */}
          <mesh position={[0, 0.14, 0.08]}>
            <boxGeometry args={[0.24, 0.04, 0.04]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </group>
      )}

      {/* 5. Chaingun (Minigun) */}
      {type === 'chaingun' && (
        <group rotation={[0, 0, 0]}>
          {/* Rotating Barrel Assembly */}
          <mesh position={[0, 0, -0.3]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.09, 0.09, 0.65, 8]} />
            <meshStandardMaterial color="#334155" metalness={0.95} roughness={0.25} />
          </mesh>
          {/* Gun Body Housing */}
          <mesh position={[0, 0, 0.1]}>
            <boxGeometry args={[0.2, 0.2, 0.35]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Ammo Drum */}
          <mesh position={[0, -0.16, 0.08]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.13, 0.13, 0.18, 16]} />
            <meshStandardMaterial color="#475569" metalness={0.7} />
          </mesh>
        </group>
      )}

      {/* 6. Plasma Rifle */}
      {type === 'plasma' && (
        <group rotation={[0, 0, 0]}>
          {/* Futuristic Chassis */}
          <mesh position={[0, 0, -0.1]}>
            <boxGeometry args={[0.14, 0.18, 0.65]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Glowing Plasma Energy Coil */}
          <mesh position={[0, 0.06, -0.1]}>
            <boxGeometry args={[0.12, 0.06, 0.35]} />
            <meshStandardMaterial color="#0284c7" emissive="#38bdf8" emissiveIntensity={1.8} />
          </mesh>
          {/* Muzzle Nozzle */}
          <mesh position={[0, 0, -0.45]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.06, 0.12, 12]} />
            <meshStandardMaterial color="#0369a1" emissive="#0ea5e9" emissiveIntensity={0.6} />
          </mesh>
        </group>
      )}

      {/* 7. Rocket Launcher */}
      {type === 'rocket' && (
        <group rotation={[0, 0, 0]}>
          {/* Heavy Square Launch Tube */}
          <mesh position={[0, 0, -0.2]}>
            <boxGeometry args={[0.22, 0.22, 0.8]} />
            <meshStandardMaterial color="#14532d" metalness={0.6} roughness={0.5} />
          </mesh>
          {/* Warhead Tip Ready to Fire */}
          <mesh position={[0, 0, -0.65]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.09, 0.2, 16]} />
            <meshStandardMaterial color="#dc2626" />
          </mesh>
          {/* Targeting HUD Optic */}
          <mesh position={[0.12, 0.14, -0.05]}>
            <boxGeometry args={[0.05, 0.08, 0.18]} />
            <meshStandardMaterial color="#eab308" emissive="#ca8a04" emissiveIntensity={0.5} />
          </mesh>
        </group>
      )}

      {/* 8. BFG 9000 */}
      {type === 'bfg' && (
        <group rotation={[0, 0, 0]}>
          {/* Massive Heavy Titanium Frame */}
          <mesh position={[0, 0, -0.15]}>
            <boxGeometry args={[0.34, 0.32, 0.85]} />
            <meshStandardMaterial color="#052e16" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Hyper-Plasma Core Chamber */}
          <mesh position={[0, 0.08, -0.1]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="#22c55e" emissive="#16a34a" emissiveIntensity={2.5} />
          </mesh>
          {/* Triple High-Voltage Emitter Prongs */}
          <mesh position={[-0.12, 0, -0.62]}>
            <boxGeometry args={[0.04, 0.12, 0.2]} />
            <meshStandardMaterial color="#15803d" emissive="#4ade80" emissiveIntensity={1} />
          </mesh>
          <mesh position={[0.12, 0, -0.62]}>
            <boxGeometry args={[0.04, 0.12, 0.2]} />
            <meshStandardMaterial color="#15803d" emissive="#4ade80" emissiveIntensity={1} />
          </mesh>
          <mesh position={[0, 0.14, -0.62]}>
            <boxGeometry args={[0.12, 0.04, 0.2]} />
            <meshStandardMaterial color="#15803d" emissive="#4ade80" emissiveIntensity={1} />
          </mesh>
        </group>
      )}

      {/* 9. Phased Laser */}
      {type === 'laser' && (
        <mesh position={[0, 0, -0.2]}>
          <boxGeometry args={[0.12, 0.12, 0.7]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.7} />
        </mesh>
      )}

      {/* 10. Builder Tool */}
      {type === 'builder' && (
        <mesh position={[0, 0, -0.2]}>
          <boxGeometry args={[0.18, 0.18, 0.18]} />
          <meshStandardMaterial color="#38bdf8" wireframe />
        </mesh>
      )}
    </group>
  );
};
