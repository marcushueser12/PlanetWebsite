"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HUD } from "./HUD";
import { IntroOverlay } from "./IntroOverlay";
import { ObjectInfoCard } from "./ObjectInfoCard";
import {
  AU_PER_LIGHT_YEAR,
  distantObjects,
  moons,
  planets,
  sun,
  WORLD_UNITS_PER_AU,
} from "./worldData";
import { SelectableObject, SpaceInfo, Vec2 } from "./types";

const WORLD_BOUNDS = 18000;
const MINIMAP_RANGE = 15000;
const SHIP_MAX_SPEED = 1800;
const SHIP_ACCEL = 2400;
const SHIP_DAMPING = 0.92;
const RETURN_DURATION = 1.6;

type PlanetTexture = {
  map: HTMLCanvasElement;
  rotSpeed: number;
};

type ClickTarget = {
  id: string;
  name: string;
  position: Vec2;
  radius: number;
  info: SpaceInfo;
};

type PlanetRuntime = {
  id: string;
  name: string;
  radius: number;
  size: number;
  color: string;
  orbitSpeed: number;
  style: "rocky" | "cloudy" | "banded" | "ice";
  info: SpaceInfo;
  angle: number;
  orbitYScale: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function formatDistance(worldDistance: number): string {
  const distanceAu = worldDistance / WORLD_UNITS_PER_AU;
  if (distanceAu < 30) return `${distanceAu.toFixed(distanceAu < 10 ? 2 : 1)} AU`;
  const lightYears = distanceAu / AU_PER_LIGHT_YEAR;
  return `${lightYears.toFixed(lightYears < 1 ? 3 : 2)} ly`;
}

function angleLerp(from: number, to: number, t: number): number {
  let delta = ((to - from + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return from + delta * t;
}

function createOffscreen(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function createPlanetTexture(id: string): PlanetTexture {
  const map = createOffscreen(1024, 512);
  const ctx = map.getContext("2d");
  if (!ctx) return { map, rotSpeed: 0.00004 };

  ctx.fillStyle = "#141922";
  ctx.fillRect(0, 0, map.width, map.height);

  if (id === "earth") {
    const ocean = ctx.createLinearGradient(0, 0, map.width, map.height);
    ocean.addColorStop(0, "#1f4f9d");
    ocean.addColorStop(0.5, "#2b79c9");
    ocean.addColorStop(1, "#1b4a95");
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, map.width, map.height);
    ctx.fillStyle = "#2f7c4f";
    for (let i = 0; i < 26; i += 1) {
      ctx.beginPath();
      const x = Math.random() * map.width;
      const y = Math.random() * map.height;
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 30, y - 22, x + 94, y + 16, x + 128, y);
      ctx.bezierCurveTo(x + 98, y + 27, x + 45, y + 34, x, y);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(179,152,110,0.34)";
    for (let i = 0; i < 16; i += 1) {
      ctx.beginPath();
      ctx.ellipse(
        Math.random() * map.width,
        Math.random() * map.height,
        16 + Math.random() * 46,
        8 + Math.random() * 22,
        Math.random() * Math.PI,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(255,255,255,0.42)";
    ctx.lineWidth = 5;
    for (let i = 0; i < 18; i += 1) {
      ctx.beginPath();
      ctx.arc(Math.random() * map.width, Math.random() * map.height, 28 + Math.random() * 110, 0, Math.PI);
      ctx.stroke();
    }
    const polarGlow = ctx.createLinearGradient(0, 0, 0, map.height);
    polarGlow.addColorStop(0, "rgba(240,248,255,0.55)");
    polarGlow.addColorStop(0.2, "rgba(240,248,255,0)");
    polarGlow.addColorStop(0.8, "rgba(240,248,255,0)");
    polarGlow.addColorStop(1, "rgba(240,248,255,0.5)");
    ctx.fillStyle = polarGlow;
    ctx.fillRect(0, 0, map.width, map.height);
    return { map, rotSpeed: 0.0002 };
  }

  if (id === "jupiter") {
    const bands = ["#f0d7b0", "#d4a97b", "#b77f53", "#6c4b37", "#dfbf97", "#8b654a", "#d8b48d"];
    const bandHeight = map.height / bands.length;
    bands.forEach((color, index) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, bandHeight * index, map.width, bandHeight + 4);
    });
    ctx.fillStyle = "#9f4d3a";
    ctx.beginPath();
    ctx.ellipse(map.width * 0.65, map.height * 0.68, 72, 40, -0.2, 0, Math.PI * 2);
    ctx.fill();
    return { map, rotSpeed: 0.00032 };
  }

  if (id === "saturn") {
    const g = ctx.createLinearGradient(0, 0, 0, map.height);
    g.addColorStop(0, "#ead2a3");
    g.addColorStop(0.5, "#c59f69");
    g.addColorStop(1, "#e6c88e");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, map.width, map.height);
    ctx.strokeStyle = "rgba(170,132,91,0.45)";
    ctx.lineWidth = 8;
    for (let i = 0; i < 8; i += 1) {
      const y = (i + 1) * (map.height / 9);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(map.width, y);
      ctx.stroke();
    }
    return { map, rotSpeed: 0.00018 };
  }

  if (id === "mars") {
    ctx.fillStyle = "#b45135";
    ctx.fillRect(0, 0, map.width, map.height);
    ctx.fillStyle = "rgba(85,38,27,0.46)";
    for (let i = 0; i < 25; i += 1) {
      ctx.beginPath();
      ctx.arc(Math.random() * map.width, Math.random() * map.height, 22 + Math.random() * 58, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(245,205,188,0.55)";
    ctx.beginPath();
    ctx.ellipse(map.width * 0.7, map.height * 0.08, 80, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    return { map, rotSpeed: 0.00015 };
  }

  if (id === "venus") {
    ctx.fillStyle = "#efe0bd";
    ctx.fillRect(0, 0, map.width, map.height);
    ctx.strokeStyle = "rgba(198,170,118,0.35)";
    ctx.lineWidth = 10;
    for (let i = 0; i < 20; i += 1) {
      ctx.beginPath();
      ctx.arc(Math.random() * map.width, Math.random() * map.height, 80 + Math.random() * 160, 0, Math.PI * 1.2);
      ctx.stroke();
    }
    return { map, rotSpeed: 0.00005 };
  }

  if (id === "mercury") {
    ctx.fillStyle = "#8f9398";
    ctx.fillRect(0, 0, map.width, map.height);
    ctx.fillStyle = "rgba(50,56,63,0.45)";
    for (let i = 0; i < 120; i += 1) {
      ctx.beginPath();
      ctx.arc(Math.random() * map.width, Math.random() * map.height, 4 + Math.random() * 16, 0, Math.PI * 2);
      ctx.fill();
    }
    return { map, rotSpeed: 0.00012 };
  }

  if (id === "uranus") {
    ctx.fillStyle = "#72cad0";
    ctx.fillRect(0, 0, map.width, map.height);
    ctx.strokeStyle = "rgba(200,255,255,0.15)";
    ctx.lineWidth = 5;
    for (let i = 0; i < 8; i += 1) {
      const y = (i + 1) * (map.height / 9);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(map.width, y);
      ctx.stroke();
    }
    return { map, rotSpeed: 0.00008 };
  }

  if (id === "neptune") {
    ctx.fillStyle = "#255eb8";
    ctx.fillRect(0, 0, map.width, map.height);
    ctx.fillStyle = "rgba(122,173,255,0.4)";
    ctx.beginPath();
    ctx.ellipse(map.width * 0.5, map.height * 0.55, 90, 45, -0.3, 0, Math.PI * 2);
    ctx.fill();
    return { map, rotSpeed: 0.00016 };
  }

  if (id === "pluto") {
    ctx.fillStyle = "#8f8274";
    ctx.fillRect(0, 0, map.width, map.height);
    ctx.fillStyle = "rgba(214,198,176,0.7)";
    ctx.beginPath();
    ctx.moveTo(map.width * 0.47, map.height * 0.36);
    ctx.bezierCurveTo(map.width * 0.39, map.height * 0.26, map.width * 0.2, map.height * 0.42, map.width * 0.34, map.height * 0.56);
    ctx.bezierCurveTo(map.width * 0.42, map.height * 0.66, map.width * 0.56, map.height * 0.66, map.width * 0.64, map.height * 0.56);
    ctx.bezierCurveTo(map.width * 0.79, map.height * 0.42, map.width * 0.6, map.height * 0.26, map.width * 0.52, map.height * 0.36);
    ctx.fill();
    return { map, rotSpeed: 0.00006 };
  }

  if (id === "hat-p-11b") {
    const base = ctx.createLinearGradient(0, 0, map.width, map.height);
    base.addColorStop(0, "#1f5f7d");
    base.addColorStop(0.5, "#1f8d9e");
    base.addColorStop(1, "#143f5c");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, map.width, map.height);
    ctx.strokeStyle = "rgba(162,236,255,0.25)";
    ctx.lineWidth = 9;
    for (let i = 0; i < 14; i += 1) {
      const y = (i + 1) * (map.height / 16);
      ctx.beginPath();
      ctx.moveTo(0, y + Math.sin(i * 0.4) * 6);
      ctx.bezierCurveTo(map.width * 0.3, y - 10, map.width * 0.7, y + 10, map.width, y);
      ctx.stroke();
    }
    return { map, rotSpeed: 0.00022 };
  }

  if (id === "kepler-22b") {
    const base = ctx.createLinearGradient(0, 0, map.width, map.height);
    base.addColorStop(0, "#2e6ab5");
    base.addColorStop(0.55, "#2f8b63");
    base.addColorStop(1, "#2756a8");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, map.width, map.height);
    ctx.fillStyle = "rgba(60,130,76,0.62)";
    for (let i = 0; i < 12; i += 1) {
      ctx.beginPath();
      const x = Math.random() * map.width;
      const y = Math.random() * map.height;
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 35, y - 24, x + 90, y + 14, x + 120, y);
      ctx.bezierCurveTo(x + 90, y + 30, x + 40, y + 34, x, y);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 6;
    for (let i = 0; i < 12; i += 1) {
      ctx.beginPath();
      ctx.arc(Math.random() * map.width, Math.random() * map.height, 60 + Math.random() * 90, 0, Math.PI);
      ctx.stroke();
    }
    return { map, rotSpeed: 0.00012 };
  }

  if (id === "kepler-452b") {
    const base = ctx.createLinearGradient(0, 0, map.width, map.height);
    base.addColorStop(0, "#4f7fa8");
    base.addColorStop(0.45, "#5f8f73");
    base.addColorStop(1, "#5876a0");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, map.width, map.height);

    ctx.fillStyle = "rgba(116,158,115,0.45)";
    for (let i = 0; i < 10; i += 1) {
      ctx.beginPath();
      const x = Math.random() * map.width;
      const y = Math.random() * map.height;
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 28, y - 18, x + 72, y + 12, x + 100, y);
      ctx.bezierCurveTo(x + 74, y + 24, x + 34, y + 28, x, y);
      ctx.fill();
    }

    ctx.strokeStyle = "rgba(255,255,255,0.24)";
    ctx.lineWidth = 6;
    for (let i = 0; i < 10; i += 1) {
      ctx.beginPath();
      ctx.arc(Math.random() * map.width, Math.random() * map.height, 50 + Math.random() * 90, 0, Math.PI);
      ctx.stroke();
    }

    const sunTint = ctx.createLinearGradient(0, 0, map.width, 0);
    sunTint.addColorStop(0, "rgba(255,219,150,0.18)");
    sunTint.addColorStop(1, "rgba(255,219,150,0)");
    ctx.fillStyle = sunTint;
    ctx.fillRect(0, 0, map.width, map.height);

    return { map, rotSpeed: 0.00008 };
  }

  ctx.fillStyle = "#9aa5b6";
  ctx.fillRect(0, 0, map.width, map.height);
  return { map, rotSpeed: 0.0001 };
}

function drawSphere(
  ctx: CanvasRenderingContext2D,
  texture: PlanetTexture,
  x: number,
  y: number,
  radius: number,
  baseColor: string,
  rotation: number,
  haloColor?: string
): void {
  const baseGrad = ctx.createRadialGradient(x - radius * 0.36, y - radius * 0.34, radius * 0.2, x, y, radius);
  baseGrad.addColorStop(0, "#ffffff");
  baseGrad.addColorStop(0.2, baseColor);
  baseGrad.addColorStop(1, "rgba(0,0,0,0.7)");
  ctx.fillStyle = baseGrad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.clip();

  const offset = ((rotation * texture.map.width) % texture.map.width + texture.map.width) % texture.map.width;
  const texW = radius * 2;
  const left = x - radius;
  const top = y - radius;
  ctx.globalAlpha = 0.92;
  ctx.drawImage(texture.map, offset, 0, texture.map.width - offset, texture.map.height, left, top, texW * ((texture.map.width - offset) / texture.map.width), radius * 2);
  ctx.drawImage(texture.map, 0, 0, offset, texture.map.height, left + texW * ((texture.map.width - offset) / texture.map.width), top, texW * (offset / texture.map.width), radius * 2);

  const shadow = ctx.createRadialGradient(x + radius * 0.45, y + radius * 0.45, radius * 0.2, x + radius * 0.4, y + radius * 0.4, radius * 1.4);
  shadow.addColorStop(0, "rgba(0,0,0,0)");
  shadow.addColorStop(1, "rgba(0,0,0,0.62)");
  ctx.fillStyle = shadow;
  ctx.fillRect(left, top, radius * 2, radius * 2);
  ctx.restore();

  if (haloColor) {
    const glow = ctx.createRadialGradient(x, y, radius, x, y, radius + 6);
    glow.addColorStop(0, "rgba(0,0,0,0)");
    glow.addColorStop(1, haloColor);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, radius + 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSaturnRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  planetRadius: number,
  angle = -0.4,
  front: boolean
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const rxOuter = planetRadius * 1.9;
  const ryOuter = planetRadius * 0.66;
  const rxInner = planetRadius * 1.35;
  const ryInner = planetRadius * 0.45;

  ctx.beginPath();
  if (front) ctx.rect(-rxOuter - 6, 0, rxOuter * 2 + 12, ryOuter + 10);
  else ctx.rect(-rxOuter - 6, -ryOuter - 10, rxOuter * 2 + 12, ryOuter + 10);
  ctx.clip();

  ctx.beginPath();
  ctx.ellipse(0, 0, rxOuter, ryOuter, 0, 0, Math.PI * 2);
  ctx.ellipse(0, 0, rxInner, ryInner, 0, 0, Math.PI * 2, true);
  const ringGrad = ctx.createLinearGradient(-rxOuter, 0, rxOuter, 0);
  ringGrad.addColorStop(0, "rgba(237,216,174,0.26)");
  ringGrad.addColorStop(0.35, "rgba(182,154,110,0.46)");
  ringGrad.addColorStop(0.5, "rgba(90,72,49,0.35)");
  ringGrad.addColorStop(0.62, "rgba(189,158,111,0.42)");
  ringGrad.addColorStop(1, "rgba(237,216,174,0.26)");
  ctx.fillStyle = ringGrad;
  ctx.fill("evenodd");
  ctx.restore();
}

export function SpaceScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [started, setStarted] = useState(false);
  const [distanceLabel, setDistanceLabel] = useState("0.00 AU");
  const [shipPosition, setShipPosition] = useState<Vec2>({ x: 0, y: -800 });
  const [planetPositions, setPlanetPositions] = useState<Record<string, Vec2>>({});
  const [selection, setSelection] = useState<SelectableObject | null>(null);
  const [selectionScreenPos, setSelectionScreenPos] = useState<Vec2 | null>(null);
  const [returnTick, setReturnTick] = useState(0);
  const selectionRef = useRef<SelectableObject | null>(null);

  const planetRuntime = useMemo<PlanetRuntime[]>(
    () =>
      planets.map((planet, index) => ({
        ...planet,
        angle: (index / planets.length) * Math.PI * 2,
        orbitYScale: planet.id === "pluto" ? 0.78 : 0.92,
      })),
    []
  );

  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !started) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const planetTextures = Object.fromEntries(
      planets.map((planet) => [planet.id, createPlanetTexture(planet.id)])
    ) as Record<string, PlanetTexture>;
    const moonTextures = Object.fromEntries(
      moons.map((moon) => [moon.id, createPlanetTexture(moon.id)])
    ) as Record<string, PlanetTexture>;
    const exoTextures = {
      "hat-p-11b": createPlanetTexture("hat-p-11b"),
      "kepler-22b": createPlanetTexture("kepler-22b"),
      "kepler-452b": createPlanetTexture("kepler-452b"),
    } as const;

    const starLayerFar = createOffscreen(5000, 5000);
    const starLayerMid = createOffscreen(5000, 5000);
    const starLayerNear = createOffscreen(5000, 5000);
    const nebulaLayer = createOffscreen(8000, 8000);

    const farStars: { x: number; y: number; r: number; a: number }[] = [];
    const midStars: { x: number; y: number; r: number; a: number; phase: number; speed: number; color: string }[] = [];
    const nearStars: { x: number; y: number; r: number; a: number; phase: number; speed: number; color: string; spike: boolean }[] = [];

    for (let i = 0; i < 600; i += 1) {
      farStars.push({
        x: Math.random() * starLayerFar.width,
        y: Math.random() * starLayerFar.height,
        r: 0.4 + Math.random() * 0.4,
        a: 0.2 + Math.random() * 0.2,
      });
    }
    for (let i = 0; i < 200; i += 1) {
      midStars.push({
        x: Math.random() * starLayerMid.width,
        y: Math.random() * starLayerMid.height,
        r: 0.8 + Math.random() * 0.7,
        a: 0.4 + Math.random() * 0.3,
        phase: Math.random() * Math.PI * 2,
        speed: 0.15 + Math.random() * 0.3,
        color: Math.random() > 0.82 ? (Math.random() > 0.5 ? "#ffe8c0" : "#c0d8ff") : "#ffffff",
      });
    }
    for (let i = 0; i < 40; i += 1) {
      nearStars.push({
        x: Math.random() * starLayerNear.width,
        y: Math.random() * starLayerNear.height,
        r: 1.5 + Math.random() * 1.5,
        a: 0.7 + Math.random() * 0.3,
        phase: Math.random() * Math.PI * 2,
        speed: 0.28 + Math.random() * 0.5,
        color: Math.random() > 0.65 ? (Math.random() > 0.5 ? "#ffe8c0" : "#c0d8ff") : "#ffffff",
        spike: Math.random() > 0.75,
      });
    }

    const nebulaClusters: { x: number; y: number; colors: string[] }[] = [
      { x: 1200, y: 1800, colors: ["rgba(115,52,168,0.06)", "rgba(196,74,168,0.06)"] },
      { x: 5400, y: 900, colors: ["rgba(55,114,187,0.05)", "rgba(32,139,142,0.06)"] },
      { x: 2600, y: 4200, colors: ["rgba(148,68,37,0.05)", "rgba(118,40,40,0.06)"] },
      { x: 6800, y: 5100, colors: ["rgba(98,48,146,0.05)", "rgba(188,80,159,0.05)"] },
      { x: 4100, y: 3100, colors: ["rgba(36,104,149,0.04)", "rgba(43,159,181,0.05)"] },
    ];
    const nebulaCtx = nebulaLayer.getContext("2d");
    if (nebulaCtx) {
      nebulaClusters.forEach((cluster) => {
        for (let i = 0; i < 8; i += 1) {
          const x = cluster.x + (Math.random() - 0.5) * 900;
          const y = cluster.y + (Math.random() - 0.5) * 700;
          const radius = 220 + Math.random() * 380;
          const color = cluster.colors[i % cluster.colors.length];
          const grad = nebulaCtx.createRadialGradient(x, y, 0, x, y, radius);
          grad.addColorStop(0, color);
          grad.addColorStop(1, "rgba(0,0,0,0)");
          nebulaCtx.fillStyle = grad;
          nebulaCtx.beginPath();
          nebulaCtx.arc(x, y, radius, 0, Math.PI * 2);
          nebulaCtx.fill();
        }
      });
    }

    const camera = { x: 0, y: 0, zoom: 1, targetZoom: 1 };
    const ship = { x: 0, y: -800, vx: 0, vy: 120, angle: -Math.PI / 2 };
    const keys = { up: false, down: false, left: false, right: false, boost: false };
    const particles: { x: number; y: number; vx: number; vy: number; life: number; age: number }[] = [];
    const clickTargets: ClickTarget[] = [];
    const textureOffsets: Record<string, number> = {};
    const distantStars: Record<string, Vec2> = {
      "hat-p-11b": { x: 11800, y: -3300 },
      "kepler-22b": { x: -8300, y: -9300 },
      "kepler-452b": { x: 3300, y: -13300 },
    };
    const orionEmbeddedStars = Array.from({ length: 6 }, () => ({
      x: (Math.random() - 0.5) * 0.9,
      y: (Math.random() - 0.5) * 0.9,
    }));

    let raf = 0;
    let previous = performance.now();
    let returnAnimation = { active: false, elapsed: 0 };
    let mouseSelectionRef: { id: string; x: number; y: number } | null = null;
    let minimapSyncAccumulator = 0;
    const localReturnTick = { value: returnTick };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const worldToScreen = (wx: number, wy: number): Vec2 => ({
      x: (wx - camera.x) * camera.zoom + window.innerWidth / 2,
      y: (wy - camera.y) * camera.zoom + window.innerHeight / 2,
    });

    const drawStarLayer = (
      layerCanvas: HTMLCanvasElement,
      stars: typeof farStars | typeof midStars | typeof nearStars,
      speedFactor: number,
      t: number
    ) => {
      const layerCtx = layerCanvas.getContext("2d");
      if (!layerCtx) return;
      layerCtx.clearRect(0, 0, layerCanvas.width, layerCanvas.height);
      stars.forEach((star) => {
        const twinklingStar = star as
          | { x: number; y: number; r: number; a: number }
          | { x: number; y: number; r: number; a: number; phase: number; speed: number };
        const pulse =
          "phase" in twinklingStar && "speed" in twinklingStar
            ? Math.sin(t * twinklingStar.speed + twinklingStar.phase) * 0.15
            : 0;
        const alpha = clamp(star.a + pulse, 0.12, 1);
        layerCtx.fillStyle = "color" in star ? ((star as { color: string }).color) : "#ffffff";
        layerCtx.globalAlpha = alpha;
        layerCtx.beginPath();
        layerCtx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        layerCtx.fill();
        if ("spike" in star && star.spike) {
          layerCtx.strokeStyle = layerCtx.fillStyle;
          layerCtx.lineWidth = 0.8;
          layerCtx.beginPath();
          layerCtx.moveTo(star.x - star.r * 3, star.y);
          layerCtx.lineTo(star.x + star.r * 3, star.y);
          layerCtx.moveTo(star.x, star.y - star.r * 3);
          layerCtx.lineTo(star.x, star.y + star.r * 3);
          layerCtx.stroke();
        }
      });
      layerCtx.globalAlpha = 1;

      const ox = ((-camera.x * speedFactor) % layerCanvas.width + layerCanvas.width) % layerCanvas.width;
      const oy = ((-camera.y * speedFactor) % layerCanvas.height + layerCanvas.height) % layerCanvas.height;
      for (let dx = -1; dx <= 1; dx += 1) {
        for (let dy = -1; dy <= 1; dy += 1) {
          ctx.drawImage(layerCanvas, ox + dx * layerCanvas.width, oy + dy * layerCanvas.height);
        }
      }
    };

    const drawShip = () => {
      const s = worldToScreen(ship.x, ship.y);
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(ship.angle + Math.PI / 2);
      ctx.scale(camera.zoom, camera.zoom);

      const bodyGrad = ctx.createLinearGradient(-18, 0, 18, 0);
      bodyGrad.addColorStop(0, "#c8c8d0");
      bodyGrad.addColorStop(1, "#606068");
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.moveTo(0, -26);
      ctx.lineTo(10, -8);
      ctx.lineTo(10, 20);
      ctx.lineTo(-10, 20);
      ctx.lineTo(-10, -8);
      ctx.closePath();
      ctx.fill();

      const wingGrad = ctx.createLinearGradient(-24, 0, 24, 0);
      wingGrad.addColorStop(0, "#8a8c95");
      wingGrad.addColorStop(1, "#4f535d");
      ctx.fillStyle = wingGrad;
      ctx.beginPath();
      ctx.moveTo(-10, 4);
      ctx.lineTo(-33, 18);
      ctx.lineTo(-6, 16);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(10, 4);
      ctx.lineTo(33, 18);
      ctx.lineTo(6, 16);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "rgba(220,235,255,0.85)";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(-10, 5);
      ctx.lineTo(-31, 17);
      ctx.moveTo(10, 5);
      ctx.lineTo(31, 17);
      ctx.stroke();

      ctx.fillStyle = "#1a3a4a";
      ctx.beginPath();
      ctx.ellipse(0, -9, 5, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      const cockpitRef = ctx.createRadialGradient(-2, -13, 0, -2, -13, 5);
      cockpitRef.addColorStop(0, "rgba(255,255,255,0.75)");
      cockpitRef.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = cockpitRef;
      ctx.beginPath();
      ctx.arc(-2, -13, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#3d4046";
      ctx.beginPath();
      ctx.moveTo(-4, 23);
      ctx.lineTo(4, 23);
      ctx.lineTo(6, 30);
      ctx.lineTo(-6, 30);
      ctx.closePath();
      ctx.fill();

      const thrusterGlow = ctx.createRadialGradient(0, 34, 0, 0, 34, keys.boost ? 20 : 12);
      thrusterGlow.addColorStop(0, keys.boost ? "rgba(185,232,255,0.95)" : "rgba(170,221,255,0.72)");
      thrusterGlow.addColorStop(1, "rgba(170,221,255,0)");
      ctx.fillStyle = thrusterGlow;
      ctx.beginPath();
      ctx.arc(0, 34, keys.boost ? 20 : 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const drawThrusterParticles = (dt: number, accelerating: boolean) => {
      const isBoosting = keys.boost;
      const spawnRate = isBoosting ? 0.0015 : accelerating ? 0.0025 : 0.008;
      if (Math.random() < spawnRate * 60) {
        const speedBoost = isBoosting ? 2.1 : accelerating ? 1.3 : 0.6;
        particles.push({
          x: ship.x - Math.cos(ship.angle) * 24,
          y: ship.y - Math.sin(ship.angle) * 24,
          vx: -Math.cos(ship.angle) * (420 + Math.random() * 200) * speedBoost + (Math.random() - 0.5) * 100,
          vy: -Math.sin(ship.angle) * (420 + Math.random() * 200) * speedBoost + (Math.random() - 0.5) * 100,
          life: 0.66,
          age: 0,
        });
      }
      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.age += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.age >= p.life) {
          particles.splice(i, 1);
          continue;
        }
        const s = worldToScreen(p.x, p.y);
        const t = p.age / p.life;
        const radius = (5 - 4 * t) * camera.zoom;
        const alpha = 1 - t;
        ctx.fillStyle = isBoosting ? `rgba(190,236,255,${alpha})` : `rgba(170,221,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const render = (now: number) => {
      const dt = Math.min((now - previous) / 1000, 0.033);
      previous = now;
      const time = now * 0.001;

      if (localReturnTick.value !== returnTick) {
        localReturnTick.value = returnTick;
        returnAnimation = { active: true, elapsed: 0 };
      }

      const accelMultiplier = keys.boost ? 1.6 : 1;
      const ax = (Number(keys.right) - Number(keys.left)) * SHIP_ACCEL * accelMultiplier;
      const ay = (Number(keys.down) - Number(keys.up)) * SHIP_ACCEL * accelMultiplier;
      const accelerating = Math.abs(ax) + Math.abs(ay) > 0;

      if (returnAnimation.active) {
        returnAnimation.elapsed += dt;
        const t = clamp(returnAnimation.elapsed / RETURN_DURATION, 0, 1);
        const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        ship.x += (0 - ship.x) * (e * 0.08 + 0.02);
        ship.y += (0 - ship.y) * (e * 0.08 + 0.02);
        ship.vx *= 0.8;
        ship.vy *= 0.8;
        camera.targetZoom = 1 + Math.sin(t * Math.PI) * 0.16;
        if (t >= 1) returnAnimation.active = false;
      } else {
        ship.vx += ax * dt;
        ship.vy += ay * dt;
        ship.vx *= SHIP_DAMPING;
        ship.vy *= SHIP_DAMPING;
        const speed = Math.hypot(ship.vx, ship.vy);
        const speedLimit = keys.boost ? SHIP_MAX_SPEED * 2 : SHIP_MAX_SPEED;
        if (speed > speedLimit) {
          ship.vx = (ship.vx / speed) * speedLimit;
          ship.vy = (ship.vy / speed) * speedLimit;
        }
        ship.x += ship.vx * dt;
        ship.y += ship.vy * dt;
        ship.x = clamp(ship.x, -WORLD_BOUNDS, WORLD_BOUNDS);
        ship.y = clamp(ship.y, -WORLD_BOUNDS, WORLD_BOUNDS);
        camera.targetZoom = 1;
      }

      const targetAngle = Math.atan2(ship.vy, ship.vx);
      if (Math.hypot(ship.vx, ship.vy) > 12) {
        ship.angle = angleLerp(ship.angle, targetAngle, 0.12);
      }

      camera.x += (ship.x - camera.x) * 0.08;
      camera.y += (ship.y - camera.y) * 0.08;
      camera.zoom += (camera.targetZoom - camera.zoom) * 0.14;

      // Keep distance readout live while moving by updating every frame.
      setDistanceLabel(formatDistance(Math.hypot(ship.x, ship.y)));
      setShipPosition({ x: ship.x, y: ship.y });

      ctx.fillStyle = "#03050a";
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      drawStarLayer(starLayerFar, farStars, 0.2, time);
      drawStarLayer(starLayerMid, midStars, 0.5, time);
      drawStarLayer(starLayerNear, nearStars, 0.9, time);

      const nebulaX = ((-camera.x * 0.35) % nebulaLayer.width + nebulaLayer.width) % nebulaLayer.width;
      const nebulaY = ((-camera.y * 0.35) % nebulaLayer.height + nebulaLayer.height) % nebulaLayer.height;
      ctx.globalAlpha = 1;
      for (let dx = -1; dx <= 1; dx += 1) {
        for (let dy = -1; dy <= 1; dy += 1) {
          ctx.drawImage(nebulaLayer, nebulaX + dx * nebulaLayer.width, nebulaY + dy * nebulaLayer.height);
        }
      }

      clickTargets.length = 0;

      planetRuntime.forEach((planet) => {
        planet.angle += planet.orbitSpeed * dt;
      });

      const worldMap: Record<string, Vec2> = {
        sun: { x: 0, y: 0 },
      };
      planetRuntime.forEach((planet) => {
        worldMap[planet.id] = {
          x: Math.cos(planet.angle) * planet.radius,
          y: Math.sin(planet.angle) * planet.radius * planet.orbitYScale,
        };
      });
      moons.forEach((moon) => {
        const parent = worldMap[moon.parentId];
        if (!parent) return;
        worldMap[moon.id] = {
          x: parent.x + Math.cos(time * moon.orbitSpeed + (moon.phase ?? 0)) * moon.radius,
          y: parent.y + Math.sin(time * moon.orbitSpeed + (moon.phase ?? 0)) * moon.radius,
        };
      });
      distantObjects.forEach((obj) => {
        worldMap[obj.id] = obj.position;
      });
      minimapSyncAccumulator += dt;
      if (minimapSyncAccumulator >= 0.08) {
        setPlanetPositions(
          Object.fromEntries(
            planets.map((planet) => [planet.id, worldMap[planet.id] ?? { x: planet.radius, y: 0 }])
          ) as Record<string, Vec2>
        );
        minimapSyncAccumulator = 0;
      }

      planetRuntime.forEach((planet) => {
        const pos = worldMap[planet.id];
        const s = worldToScreen(pos.x, pos.y);
        const r = planet.size * camera.zoom;

        if (planet.id === "saturn") {
          drawSaturnRing(ctx, s.x, s.y, r, -0.35, false);
        }

        textureOffsets[planet.id] = (textureOffsets[planet.id] ?? 0) + planetTextures[planet.id].rotSpeed * dt * 60;
        drawSphere(
          ctx,
          planetTextures[planet.id],
          s.x,
          s.y,
          r,
          planet.color,
          textureOffsets[planet.id],
          planet.id === "earth"
            ? "rgba(102,181,255,0.24)"
            : planet.style === "banded" || planet.style === "ice"
              ? "rgba(180,210,255,0.1)"
              : undefined
        );

        if (planet.id === "saturn") {
          drawSaturnRing(ctx, s.x, s.y, r, -0.35, true);
        }

        clickTargets.push({ id: planet.id, name: planet.name, position: pos, radius: planet.size, info: planet.info });
      });

      moons.forEach((moon) => {
        const pos = worldMap[moon.id];
        if (!pos) return;
        const s = worldToScreen(pos.x, pos.y);
        const r = moon.size * camera.zoom;
        drawSphere(
          ctx,
          moonTextures[moon.id],
          s.x,
          s.y,
          r,
          moon.color,
          (textureOffsets[moon.id] ?? 0) + time * 0.0001
        );
        clickTargets.push({ id: moon.id, name: moon.name, position: pos, radius: moon.size, info: moon.info });
      });

      const sunScreen = worldToScreen(0, 0);
      const sunRadius = sun.size * 18 * camera.zoom;
      const sunGlow = ctx.createRadialGradient(sunScreen.x, sunScreen.y, sunRadius * 0.15, sunScreen.x, sunScreen.y, sunRadius * 2.6);
      sunGlow.addColorStop(0, "rgba(255,245,215,0.95)");
      sunGlow.addColorStop(0.22, "rgba(255,201,107,0.84)");
      sunGlow.addColorStop(0.6, "rgba(245,131,41,0.32)");
      sunGlow.addColorStop(1, "rgba(245,131,41,0)");
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunScreen.x, sunScreen.y, sunRadius * 2.6, 0, Math.PI * 2);
      ctx.fill();

      const sunCore = ctx.createRadialGradient(sunScreen.x - sunRadius * 0.32, sunScreen.y - sunRadius * 0.34, sunRadius * 0.1, sunScreen.x, sunScreen.y, sunRadius);
      sunCore.addColorStop(0, "#fffdf2");
      sunCore.addColorStop(0.3, "#ffd57e");
      sunCore.addColorStop(1, "#f39b35");
      ctx.fillStyle = sunCore;
      ctx.beginPath();
      ctx.arc(sunScreen.x, sunScreen.y, sunRadius, 0, Math.PI * 2);
      ctx.fill();
      clickTargets.push({ id: "sun", name: sun.name, position: { x: 0, y: 0 }, radius: sun.size * 18, info: sun.info });

      for (let i = 0; i < 3; i += 1) {
        const arcRadius = sunRadius * (1.2 + i * 0.17);
        ctx.strokeStyle = "rgba(255,205,130,0.34)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sunScreen.x, sunScreen.y, arcRadius, time * (0.1 + i * 0.04), time * (0.1 + i * 0.04) + Math.PI * 0.8);
        ctx.stroke();
      }

      distantObjects.forEach((obj) => {
        const pos = worldToScreen(obj.position.x, obj.position.y);
        if (obj.id === "helix-nebula") {
          const baseR = obj.size * camera.zoom;
          const organicPulse = 1 + Math.sin(time * 0.22) * 0.04;
          const distort = Math.sin(time * 0.13) * 0.12;
          const blurPx = `${Math.max(8, 18 * camera.zoom)}px`;

          ctx.save();
          ctx.filter = `blur(${blurPx})`;

          // Outer reddish cloud: layered, uneven gas lobes.
          ctx.globalAlpha = 0.26;
          ctx.fillStyle = "rgba(179,74,63,0.72)";
          for (let i = 0; i < 5; i += 1) {
            const ang = i * 1.23 + time * 0.04;
            ctx.beginPath();
            ctx.ellipse(
              pos.x + Math.cos(ang) * baseR * 0.16,
              pos.y + Math.sin(ang) * baseR * 0.12,
              baseR * (1.07 + Math.sin(ang + distort) * 0.08),
              baseR * (0.8 + Math.cos(ang - distort) * 0.1),
              -0.3 + Math.sin(ang) * 0.18,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }

          // Orange/yellow ring region: filled overlapping distorted ellipses.
          ctx.globalAlpha = 0.42;
          ctx.fillStyle = "rgba(247,176,88,0.78)";
          for (let i = 0; i < 4; i += 1) {
            const ang = i * 1.57 + time * 0.05;
            ctx.beginPath();
            ctx.ellipse(
              pos.x + Math.cos(ang) * baseR * 0.05,
              pos.y + Math.sin(ang) * baseR * 0.04,
              baseR * (0.78 + Math.sin(ang + distort) * 0.06),
              baseR * (0.5 + Math.cos(ang - distort) * 0.05),
              -0.28 + Math.sin(ang) * 0.08,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }

          // Bright soft blue core: more solid center with slight organic variance.
          ctx.globalAlpha = 0.65;
          ctx.fillStyle = "rgba(132,225,255,0.9)";
          ctx.beginPath();
          ctx.ellipse(
            pos.x + Math.sin(time * 0.17) * baseR * 0.02,
            pos.y + Math.cos(time * 0.19) * baseR * 0.015,
            baseR * 0.43 * organicPulse,
            baseR * 0.31 * (1 - distort * 0.18),
            -0.24,
            0,
            Math.PI * 2
          );
          ctx.fill();

          ctx.globalAlpha = 0.92;
          ctx.fillStyle = "rgba(198,244,255,0.9)";
          ctx.beginPath();
          ctx.ellipse(pos.x, pos.y, baseR * 0.16, baseR * 0.12, -0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (obj.id === "orion-nebula") {
          const g = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, obj.size * camera.zoom * 1.5);
          g.addColorStop(0, "rgba(255,154,220,0.5)");
          g.addColorStop(0.4, "rgba(173,124,247,0.3)");
          g.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, obj.size * camera.zoom * 1.5, 0, Math.PI * 2);
          ctx.fill();
          for (const starOffset of orionEmbeddedStars) {
            ctx.fillStyle = "rgba(255,255,255,0.85)";
            ctx.beginPath();
            ctx.arc(
              pos.x + starOffset.x * obj.size * 0.9 * camera.zoom,
              pos.y + starOffset.y * obj.size * 0.9 * camera.zoom,
              1.4 * camera.zoom,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
        } else {
          textureOffsets[obj.id] = (textureOffsets[obj.id] ?? 0) + 0.00014;
          drawSphere(
            ctx,
            exoTextures[obj.id as keyof typeof exoTextures],
            pos.x,
            pos.y,
            obj.size * camera.zoom,
            obj.color,
            textureOffsets[obj.id],
            "rgba(150,210,255,0.1)"
          );
          const host = distantStars[obj.id];
          if (host) {
            const starPoint = worldToScreen(host.x, host.y);
            const starGrad = ctx.createRadialGradient(starPoint.x, starPoint.y, 0, starPoint.x, starPoint.y, 28 * camera.zoom);
            starGrad.addColorStop(0, "rgba(255,250,220,1)");
            starGrad.addColorStop(1, "rgba(255,250,220,0)");
            ctx.fillStyle = starGrad;
            ctx.beginPath();
            ctx.arc(starPoint.x, starPoint.y, 28 * camera.zoom, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        clickTargets.push({ id: obj.id, name: obj.name, position: obj.position, radius: obj.size, info: obj.info });
      });

      drawThrusterParticles(dt, accelerating);
      drawShip();

      if (selectionRef.current) {
        const pos = worldMap[selectionRef.current.id];
        if (pos) {
          const screen = worldToScreen(pos.x, pos.y);
          setSelectionScreenPos(screen);
        }
      }

      raf = requestAnimationFrame(render);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowUp") keys.up = true;
      if (event.key === "ArrowDown") keys.down = true;
      if (event.key === "ArrowLeft") keys.left = true;
      if (event.key === "ArrowRight") keys.right = true;
      if (event.code === "Space") {
        keys.boost = true;
        event.preventDefault();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === "ArrowUp") keys.up = false;
      if (event.key === "ArrowDown") keys.down = false;
      if (event.key === "ArrowLeft") keys.left = false;
      if (event.key === "ArrowRight") keys.right = false;
      if (event.code === "Space") {
        keys.boost = false;
        event.preventDefault();
      }
    };
    const onResize = () => resize();
    const onClick = (event: MouseEvent) => {
      const x = event.clientX;
      const y = event.clientY;
      const sorted = [...clickTargets].sort((a, b) => b.radius - a.radius);
      let hit: ClickTarget | null = null;
      for (const target of sorted) {
        const screen = worldToScreen(target.position.x, target.position.y);
        const r = target.radius * camera.zoom;
        if (Math.hypot(x - screen.x, y - screen.y) <= r) {
          hit = target;
          mouseSelectionRef = { id: target.id, x: screen.x, y: screen.y };
          break;
        }
      }
      if (hit) {
        const selected: SelectableObject = {
          id: hit.id,
          name: hit.name,
          worldPosition: hit.position,
          info: hit.info,
        };
        setSelection(selected);
        setSelectionScreenPos({ x: mouseSelectionRef!.x, y: mouseSelectionRef!.y });
      } else {
        setSelection(null);
        setSelectionScreenPos(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("resize", onResize);
    canvas.addEventListener("click", onClick);
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("click", onClick);
    };
  }, [planetRuntime, returnTick, started]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white">
      {!started && <IntroOverlay onBegin={() => setStarted(true)} />}
      {started && (
        <>
          <HUD
            distanceLabel={distanceLabel}
            shipPosition={shipPosition}
            minimapRange={MINIMAP_RANGE}
            solarMarkers={planets.map((planet) => ({
              id: planet.id,
              label: planet.name,
              position: planetPositions[planet.id] ?? { x: planet.radius, y: 0 },
            }))}
            distantMarkers={distantObjects.map((obj) => ({ id: obj.id, label: obj.name, position: obj.position }))}
            onReturnToSolarSystem={() => setReturnTick((prev) => prev + 1)}
          />
          {selection && selectionScreenPos && (
            <ObjectInfoCard name={selection.name} info={selection.info} screenPosition={selectionScreenPos} />
          )}
        </>
      )}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
