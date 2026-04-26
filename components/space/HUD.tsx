"use client";

import { Vec2 } from "./types";

type HUDProps = {
  distanceLabel: string;
  shipPosition: Vec2;
  minimapRange: number;
  distantMarkers: { id: string; label: string; position: Vec2 }[];
  onReturnToSolarSystem: () => void;
};

export function HUD({
  distanceLabel,
  shipPosition,
  minimapRange,
  distantMarkers,
  onReturnToSolarSystem,
}: HUDProps) {
  const mapSize = 146;
  const toMap = (point: Vec2) => ({
    x: ((point.x + minimapRange) / (minimapRange * 2)) * mapSize,
    y: ((point.y + minimapRange) / (minimapRange * 2)) * mapSize,
  });
  const shipMap = toMap(shipPosition);

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="pointer-events-auto absolute left-4 top-4 rounded-xl border border-cyan-300/35 bg-black/50 px-4 py-2 text-sm font-mono text-cyan-100 shadow-[0_0_32px_rgba(69,173,216,0.22)] backdrop-blur-md">
        Distance from Sun: <span className="font-semibold text-cyan-200">{distanceLabel}</span>
      </div>
      <div className="pointer-events-auto absolute left-4 bottom-4 rounded-xl border border-cyan-300/25 bg-black/45 p-3 shadow-[0_0_26px_rgba(69,173,216,0.16)] backdrop-blur-md">
        <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-cyan-200/90">Mini-map</p>
        <div className="relative h-[146px] w-[146px] rounded-md border border-cyan-300/20 bg-slate-950/90">
          <div className="absolute h-2 w-2 rounded-full bg-yellow-300 shadow-[0_0_8px_rgba(255,214,102,0.9)]" style={{ left: mapSize / 2 - 4, top: mapSize / 2 - 4 }} />
          {distantMarkers.map((marker) => {
            const markerMap = toMap(marker.position);
            return (
              <div
                key={marker.id}
                title={marker.label}
                className="absolute h-1.5 w-1.5 rounded-full bg-fuchsia-300/90"
                style={{ left: markerMap.x - 3, top: markerMap.y - 3 }}
              />
            );
          })}
          <div className="absolute h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(128,238,255,1)]" style={{ left: shipMap.x - 4, top: shipMap.y - 4 }} />
        </div>
      </div>
      <button
        type="button"
        onClick={onReturnToSolarSystem}
        className="pointer-events-auto absolute bottom-5 right-5 rounded-full border border-cyan-200/55 bg-slate-900/70 px-4 py-2 text-sm font-mono font-medium text-cyan-100 shadow-[0_0_24px_rgba(94,191,255,0.35)] transition hover:border-cyan-100 hover:bg-slate-800/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
      >
        Return to Solar System
      </button>
    </div>
  );
}
