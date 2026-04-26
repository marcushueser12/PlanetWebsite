export type Vec2 = {
  x: number;
  y: number;
};

export type SpaceInfo = {
  title: string;
  explanation: string;
  lifeSignificance: string;
  accentColor?: string;
};

export type OrbitalBody = {
  id: string;
  name: string;
  radius: number;
  size: number;
  color: string;
  orbitSpeed: number;
  phase?: number;
  style: "rocky" | "cloudy" | "banded" | "ice";
  info: SpaceInfo;
};

export type MoonConfig = OrbitalBody & {
  parentId: string;
};

export type DistantObject = {
  id: string;
  name: string;
  position: Vec2;
  size: number;
  color: string;
  style: "nebula" | "exoplanet";
  info: SpaceInfo;
};

export type SelectableObject = {
  id: string;
  name: string;
  worldPosition: Vec2;
  info: SpaceInfo;
};
