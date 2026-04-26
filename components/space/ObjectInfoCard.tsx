"use client";

import { SpaceInfo } from "./types";

type ObjectInfoCardProps = {
  name: string;
  info: SpaceInfo;
  screenPosition: { x: number; y: number };
};

export function ObjectInfoCard({ name, info, screenPosition }: ObjectInfoCardProps) {
  return (
    <div
      className="pointer-events-none absolute z-20 w-80 rounded-xl border p-4 text-slate-100 shadow-2xl backdrop-blur-xl animate-[card-in_320ms_ease-out]"
      style={{
        left: screenPosition.x,
        top: screenPosition.y,
        transform: "translate(14px, -50%)",
        borderColor: `${info.accentColor ?? "#8ce2ff"}66`,
        background: "rgba(10, 16, 28, 0.62)",
        boxShadow: `0 0 24px ${(info.accentColor ?? "#8ce2ff")}33`,
      }}
    >
      <h3 className="mb-2 text-lg font-semibold tracking-wide">{name}</h3>
      <p className="text-sm text-slate-200">{info.explanation}</p>
      <p className="mt-3 text-xs uppercase tracking-[0.16em]" style={{ color: info.accentColor ?? "#8ce2ff" }}>
        Why it matters for life
      </p>
      <p className="mt-1 text-sm text-slate-200">{info.lifeSignificance}</p>
    </div>
  );
}
