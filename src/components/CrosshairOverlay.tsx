import React from 'react';
import { useStore } from '../store';

export const CrosshairOverlay = () => {
  const isMoving = useStore((state) => state.isMoving);
  const isDashing = useStore((state) => state.isDashing);
  const isCrouching = useStore((state) => state.isCrouching);
  const fireRecoil = useStore((state) => state.fireRecoil);
  const isHoveringEnemy = useStore((state) => state.isHoveringEnemy);
  const currentWeapon = useStore((state) => state.currentWeapon);

  // Compute dynamic reticle expansion
  // Base spread (px)
  let moveSpread = 0;
  if (isDashing) {
    moveSpread = 16;
  } else if (isMoving) {
    moveSpread = 8;
  } else if (isCrouching) {
    moveSpread = -3;
  }

  // Recoil expansion kicks out immediately and snaps back smoothly
  const recoilSpread = fireRecoil * 18;
  const totalSpread = Math.max(5, 8 + moveSpread + recoilSpread);

  // Weapon color accents
  const isTargeting = isHoveringEnemy;
  const reticleColor = isTargeting
    ? 'bg-red-500 shadow-[0_0_8px_#ef4444]'
    : currentWeapon === 'laser'
    ? 'bg-cyan-400 shadow-[0_0_5px_#22d3ee]'
    : 'bg-white/90 shadow-[0_0_2px_rgba(0,0,0,0.8)]';

  const borderColor = isTargeting ? 'border-red-500' : 'border-white/50';

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-40 select-none">
      <div className="relative w-16 h-16 flex items-center justify-center">
        {/* Central Targeting Pip / Dot */}
        <div
          className={`w-1.5 h-1.5 rounded-full transition-all duration-100 ${
            isTargeting
              ? 'bg-red-500 scale-150 shadow-[0_0_12px_#ef4444] animate-ping'
              : 'bg-white/80 scale-100'
          }`}
        />
        <div
          className={`absolute w-1.5 h-1.5 rounded-full ${
            isTargeting
              ? 'bg-red-500 shadow-[0_0_8px_#ef4444]'
              : 'bg-white/90 shadow-[0_0_2px_rgba(0,0,0,0.8)]'
          }`}
        />

        {/* Central Targeting Line / Pulse Effect when enemy is in crosshair */}
        {isTargeting && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Pulsing red reticle ring */}
            <div className="w-10 h-10 rounded-full border border-red-500/80 animate-ping opacity-75" />
            <div className="w-8 h-8 rounded-full border-2 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.7)] animate-pulse" />
            {/* Precision cross target markers */}
            <div className="absolute w-5 h-[1.5px] bg-red-500 animate-pulse" />
            <div className="absolute h-5 w-[1.5px] bg-red-500 animate-pulse" />
          </div>
        )}

        {/* Top Tick */}
        <div
          className={`absolute w-[2px] h-3.5 rounded-full transition-all duration-75 ${reticleColor}`}
          style={{
            transform: `translateY(-${totalSpread}px)`,
          }}
        />

        {/* Bottom Tick */}
        <div
          className={`absolute w-[2px] h-3.5 rounded-full transition-all duration-75 ${reticleColor}`}
          style={{
            transform: `translateY(${totalSpread}px)`,
          }}
        />

        {/* Left Tick */}
        <div
          className={`absolute h-[2px] w-3.5 rounded-full transition-all duration-75 ${reticleColor}`}
          style={{
            transform: `translateX(-${totalSpread}px)`,
          }}
        />

        {/* Right Tick */}
        <div
          className={`absolute h-[2px] w-3.5 rounded-full transition-all duration-75 ${reticleColor}`}
          style={{
            transform: `translateX(${totalSpread}px)`,
          }}
        />

        {/* Corner Brackets for Combat Weapons (Pistol/Laser) */}
        {(currentWeapon === 'pistol' || currentWeapon === 'laser') && (
          <div
            className={`absolute transition-all duration-100 ${
              isTargeting ? 'opacity-100 scale-105' : 'opacity-40 scale-95'
            }`}
            style={{
              width: `${(totalSpread + 6) * 2}px`,
              height: `${(totalSpread + 6) * 2}px`,
            }}
          >
            <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 ${borderColor}`} />
            <div className={`absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 ${borderColor}`} />
            <div className={`absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 ${borderColor}`} />
            <div className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 ${borderColor}`} />
          </div>
        )}
      </div>
    </div>
  );
};
