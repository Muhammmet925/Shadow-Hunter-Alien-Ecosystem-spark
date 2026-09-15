import React, { useMemo } from 'react';
import { useStore } from '../store';
import { ShieldAlert, Compass } from 'lucide-react';

const RADAR_RADIUS = 78; // px radius on screen (160x160 circular container)
const MAX_RADAR_DIST = 65; // meters in 3D world space

export const RadarOverlay = () => {
  const playerPosition = useStore((state) => state.playerPosition);
  const playerRotationY = useStore((state) => state.playerRotationY);
  const enemyPositions = useStore((state) => state.enemyPositions);
  const wildlifePositions = useStore((state) => state.wildlifePositions);

  // Compute blips relative to player position and camera orientation
  const { enemyBlips, wildlifeBlips, enemyCount, wildlifeCount } = useMemo(() => {
    const pX = playerPosition[0];
    const pZ = playerPosition[2];
    const yaw = playerRotationY;

    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);

    const calcRelativeCoord = (x: number, z: number) => {
      const dx = x - pX;
      const dz = z - pZ;

      // Rotate so up on radar is where camera is pointing
      // In Three.js: forward vector is (sin(yaw), 0, cos(yaw)) or (-sin(yaw), 0, -cos(yaw))
      // dx is East/West, dz is North/South
      const relX = dx * cosY - dz * sinY;
      const relZ = dx * sinY + dz * cosY;

      const dist = Math.sqrt(dx * dx + dz * dz);
      // Screen coordinates: relX is horizontal, relZ (forward/back) is vertical (-relZ is forward)
      const scale = RADAR_RADIUS / MAX_RADAR_DIST;
      const screenX = relX * scale;
      const screenY = relZ * scale; // Inverted so negative Z (forward) points UP
      const clampedDist = Math.min(dist * scale, RADAR_RADIUS - 6);

      const angle = Math.atan2(screenY, screenX);
      const isOutOfBounds = dist > MAX_RADAR_DIST;

      return {
        x: isOutOfBounds ? Math.cos(angle) * (RADAR_RADIUS - 6) : screenX,
        y: isOutOfBounds ? Math.sin(angle) * (RADAR_RADIUS - 6) : screenY,
        dist: Math.round(dist),
        isOutOfBounds,
      };
    };

    const eBlips = Object.entries(enemyPositions).map(([id, pos]) => ({
      id,
      ...calcRelativeCoord(pos[0], pos[2]),
    }));

    const wBlips = Object.entries(wildlifePositions).map(([id, pos]) => ({
      id,
      ...calcRelativeCoord(pos[0], pos[2]),
    }));

    return {
      enemyBlips: eBlips,
      wildlifeBlips: wBlips,
      enemyCount: eBlips.filter((b) => !b.isOutOfBounds).length,
      wildlifeCount: wBlips.filter((b) => !b.isOutOfBounds).length,
    };
  }, [playerPosition, playerRotationY, enemyPositions, wildlifePositions]);

  // Cardinal direction angles
  const northAngle = (playerRotationY * 180) / Math.PI;

  return (
    <div className="fixed top-6 right-6 pointer-events-none z-30 select-none">
      {/* Radar Housing */}
      <div className="relative w-44 h-44 rounded-full bg-black/75 backdrop-blur-md border-2 border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.15)] overflow-hidden flex items-center justify-center">
        {/* Scanning Sweep Line */}
        <div
          className="absolute inset-0 rounded-full animate-spin pointer-events-none"
          style={{
            animationDuration: '3.5s',
            animationTimingFunction: 'linear',
            background:
              'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(16, 185, 129, 0.05) 320deg, rgba(16, 185, 129, 0.35) 360deg)',
          }}
        />

        {/* Concentric Range Rings (20m, 40m, 60m) */}
        <div className="absolute w-36 h-36 rounded-full border border-emerald-500/20" />
        <div className="absolute w-24 h-24 rounded-full border border-emerald-500/25" />
        <div className="absolute w-12 h-12 rounded-full border border-emerald-500/30" />

        {/* Crosshair Axes */}
        <div className="absolute w-full h-[1px] bg-emerald-500/20" />
        <div className="absolute h-full w-[1px] bg-emerald-500/20" />

        {/* Compass Cardinal Indicators */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-transform duration-100"
          style={{ transform: `rotate(${northAngle}deg)` }}
        >
          <span className="absolute top-1 text-[8px] font-black tracking-widest text-emerald-400">N</span>
          <span className="absolute bottom-1 text-[8px] font-mono text-emerald-400/40">S</span>
          <span className="absolute right-1 text-[8px] font-mono text-emerald-400/40">E</span>
          <span className="absolute left-1 text-[8px] font-mono text-emerald-400/40">W</span>
        </div>

        {/* Player Center Marker (Forward Chevron) */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-emerald-400 filter drop-shadow-[0_0_4px_#34d399]" />
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 -mt-0.5" />
        </div>

        {/* Enemy Blips (Hostile - Red) */}
        {enemyBlips.map((blip) => (
          <div
            key={blip.id}
            className="absolute transition-all duration-150 z-20 flex items-center justify-center"
            style={{
              transform: `translate(${blip.x}px, ${blip.y}px)`,
            }}
          >
            <div
              className={`rounded-full ${
                blip.isOutOfBounds
                  ? 'w-1.5 h-1.5 bg-red-600/60'
                  : 'w-2.5 h-2.5 bg-red-500 animate-ping absolute opacity-75'
              }`}
            />
            <div
              className={`rounded-full ${
                blip.isOutOfBounds
                  ? 'w-1.5 h-1.5 bg-red-500 border border-red-300'
                  : 'w-2 h-2 bg-red-500 shadow-[0_0_8px_#ef4444]'
              }`}
            />
          </div>
        ))}

        {/* Wildlife Blips (Non-hostile - Cyan / Emerald) */}
        {wildlifeBlips.map((blip) => (
          <div
            key={blip.id}
            className="absolute transition-all duration-150 z-15 flex items-center justify-center"
            style={{
              transform: `translate(${blip.x}px, ${blip.y}px)`,
            }}
          >
            <div
              className={`rotate-45 ${
                blip.isOutOfBounds
                  ? 'w-1 h-1 bg-cyan-500/50'
                  : 'w-2 h-2 bg-cyan-400 shadow-[0_0_6px_#38bdf8]'
              }`}
            />
          </div>
        ))}
      </div>

      {/* Radar Telemetry Header & Stats */}
      <div className="flex items-center justify-between px-2 pt-1.5 text-[9px] font-mono tracking-wider">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <Compass size={11} className="animate-spin-slow" />
          <span>RADAR {MAX_RADAR_DIST}m</span>
        </div>
        <div className="flex items-center gap-3">
          {enemyCount > 0 ? (
            <span className="flex items-center gap-1 text-red-400 font-bold animate-pulse">
              <ShieldAlert size={10} />
              {enemyCount} HOSTILE
            </span>
          ) : (
            <span className="text-emerald-500/70">CLEAR</span>
          )}
          {wildlifeCount > 0 && (
            <span className="text-cyan-400 font-semibold">
              {wildlifeCount} FAUNA
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
