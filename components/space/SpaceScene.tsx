"use client";
/* eslint-disable react-hooks/immutability, react-hooks/purity, react-hooks/refs */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { HUD } from "./HUD";
import { ObjectInfoCard } from "./ObjectInfoCard";
import { IntroOverlay } from "./IntroOverlay";
import { AU_PER_LIGHT_YEAR, distantObjects, moons, planets, sun, WORLD_UNITS_PER_AU } from "./worldData";
import { SelectableObject, Vec2 } from "./types";

const WORLD_BOUNDS = 4200;
const SHIP_MAX_SPEED = 190;
const SHIP_ACCEL = 260;
const SHIP_DAMPING = 0.92;
const RETURN_DURATION = 1.4;
const MINIMAP_RANGE = 4200;

function formatDistance(worldDistance: number): string {
  const distanceAu = worldDistance / WORLD_UNITS_PER_AU;
  if (distanceAu < 700) {
    return `${distanceAu.toFixed(distanceAu < 10 ? 2 : 1)} AU`;
  }
  const lightYears = distanceAu / AU_PER_LIGHT_YEAR;
  return `${lightYears.toFixed(lightYears < 1 ? 3 : 2)} ly`;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function SpaceWorld({
  onDistanceChange,
  onShipPositionChange,
  selection,
  onSelectionChange,
  onSelectionScreenMove,
  returnTick,
}: {
  onDistanceChange: (distance: string) => void;
  onShipPositionChange: (position: Vec2) => void;
  selection: SelectableObject | null;
  onSelectionChange: (selection: SelectableObject | null, screenPos?: Vec2) => void;
  onSelectionScreenMove: (screenPos: Vec2 | null) => void;
  returnTick: number;
}) {
  const { camera, size } = useThree();
  const shipRef = useRef<THREE.Mesh>(null);
  const planetRefs = useRef<Record<string, THREE.Mesh | null>>({});
  const moonRefs = useRef<Record<string, THREE.Mesh | null>>({});
  const sunCoronaRef = useRef<THREE.Mesh>(null);
  const velocityRef = useRef(new THREE.Vector2(0, 20));
  const shipPositionRef = useRef(new THREE.Vector2(0, -22));
  const keysRef = useRef({ up: false, down: false, left: false, right: false });
  const lastReturnTickRef = useRef(0);
  const returnStateRef = useRef({ active: false, elapsed: 0 });
  const selectionUpdateClockRef = useRef(0);
  const worldPositionsRef = useRef<Record<string, THREE.Vector2>>({ sun: new THREE.Vector2(0, 0) });

  const trailPointsRef = useRef<THREE.Vector3[]>(Array.from({ length: 42 }, () => new THREE.Vector3(0, -22, 0)));
  const trailLineRef = useRef(
    new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({
        color: "#99deff",
        transparent: true,
        opacity: 0.38,
      })
    )
  );
  const trailParticleGeometryRef = useRef(new THREE.BufferGeometry());
  const trailParticleMaterialRef = useRef(
    new THREE.PointsMaterial({
      size: 1.35,
      color: "#bde9ff",
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  const trailParticlesRef = useRef<{ x: number; y: number; age: number; life: number }[]>([]);

  const starLayers = useMemo(() => {
    const build = (count: number, spread: number, zLow: number, zHigh: number, intensityRange: [number, number]) => {
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const twinkles = new Float32Array(count * 2);
      const palette = ["#ffffff", "#dff0ff", "#ffe8bd", "#f4f9ff"].map((hex) => new THREE.Color(hex));
      for (let i = 0; i < count; i += 1) {
        const idx = i * 3;
        positions[idx] = THREE.MathUtils.randFloatSpread(spread);
        positions[idx + 1] = THREE.MathUtils.randFloatSpread(spread);
        positions[idx + 2] = THREE.MathUtils.randFloat(zLow, zHigh);
        const base = palette[Math.floor(Math.random() * palette.length)].clone();
        base.multiplyScalar(THREE.MathUtils.randFloat(intensityRange[0], intensityRange[1]));
        colors[idx] = base.r;
        colors[idx + 1] = base.g;
        colors[idx + 2] = base.b;
        twinkles[i * 2] = Math.random() * Math.PI * 2;
        twinkles[i * 2 + 1] = THREE.MathUtils.randFloat(0.25, 0.95);
      }
      return { positions, colors, twinkles, count };
    };
    return {
      far: build(2200, WORLD_BOUNDS * 2.4, -160, -120, [0.22, 0.4]),
      mid: build(1400, WORLD_BOUNDS * 2.2, -95, -70, [0.35, 0.66]),
      near: build(650, WORLD_BOUNDS * 2, -52, -28, [0.5, 1]),
    };
  }, []);
  const starRefs = useRef<Record<string, THREE.Points<THREE.BufferGeometry, THREE.Material | THREE.Material[]> | null>>({});
  const setStarRef = (key: "far" | "mid" | "near") => (mesh: unknown) => {
    starRefs.current[key] = mesh as THREE.Points<THREE.BufferGeometry, THREE.Material | THREE.Material[]>;
  };

  const orbitalGuides = useMemo(
    () =>
      planets.map((planet) => {
        const points: THREE.Vector3[] = [];
        const segments = 100;
        for (let i = 0; i <= segments; i += 1) {
          const t = (i / segments) * Math.PI * 2;
          points.push(new THREE.Vector3(Math.cos(t) * planet.radius, Math.sin(t) * planet.radius * 0.93, -1));
        }
        return { id: planet.id, points };
      }),
    []
  );

  const handlePointerMissed = useCallback(() => onSelectionChange(null), [onSelectionChange]);

  const selectObject = useCallback(
    (objId: string, fallback: SelectableObject) => {
      const worldPosition = worldPositionsRef.current[objId] ?? new THREE.Vector2(fallback.worldPosition.x, fallback.worldPosition.y);
      const projected = new THREE.Vector3(worldPosition.x, worldPosition.y, 0).project(camera);
      onSelectionChange(
        { ...fallback, worldPosition: { x: worldPosition.x, y: worldPosition.y } },
        { x: ((projected.x + 1) / 2) * size.width, y: ((-projected.y + 1) / 2) * size.height }
      );
    },
    [camera, onSelectionChange, size.height, size.width]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowUp") keysRef.current.up = true;
      if (event.key === "ArrowDown") keysRef.current.down = true;
      if (event.key === "ArrowLeft") keysRef.current.left = true;
      if (event.key === "ArrowRight") keysRef.current.right = true;
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === "ArrowUp") keysRef.current.up = false;
      if (event.key === "ArrowDown") keysRef.current.down = false;
      if (event.key === "ArrowLeft") keysRef.current.left = false;
      if (event.key === "ArrowRight") keysRef.current.right = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useFrame((state, delta) => {
    const elapsed = state.clock.getElapsedTime();
    if (returnTick !== lastReturnTickRef.current) {
      lastReturnTickRef.current = returnTick;
      returnStateRef.current.active = true;
      returnStateRef.current.elapsed = 0;
    }

    const input = new THREE.Vector2(
      Number(keysRef.current.right) - Number(keysRef.current.left),
      Number(keysRef.current.up) - Number(keysRef.current.down)
    );
    if (returnStateRef.current.active) {
      returnStateRef.current.elapsed += delta;
      const t = Math.min(returnStateRef.current.elapsed / RETURN_DURATION, 1);
      shipPositionRef.current.lerp(new THREE.Vector2(0, 0), easeInOutCubic(t) * 0.18 + 0.02);
      velocityRef.current.multiplyScalar(0.8);
      if (t >= 1) returnStateRef.current.active = false;
    } else {
      if (input.lengthSq() > 0) {
        input.normalize().multiplyScalar(SHIP_ACCEL * delta);
        velocityRef.current.add(input);
      }
      velocityRef.current.multiplyScalar(SHIP_DAMPING);
      if (velocityRef.current.length() > SHIP_MAX_SPEED) velocityRef.current.setLength(SHIP_MAX_SPEED);
      shipPositionRef.current.addScaledVector(velocityRef.current, delta);
    }

    shipPositionRef.current.x = THREE.MathUtils.clamp(shipPositionRef.current.x, -WORLD_BOUNDS, WORLD_BOUNDS);
    shipPositionRef.current.y = THREE.MathUtils.clamp(shipPositionRef.current.y, -WORLD_BOUNDS, WORLD_BOUNDS);
    onDistanceChange(formatDistance(shipPositionRef.current.length()));
    onShipPositionChange({ x: shipPositionRef.current.x, y: shipPositionRef.current.y });

    if (shipRef.current) {
      shipRef.current.position.set(shipPositionRef.current.x, shipPositionRef.current.y, 2);
      if (velocityRef.current.lengthSq() > 0.1) {
        shipRef.current.rotation.z = Math.atan2(velocityRef.current.y, velocityRef.current.x) - Math.PI / 2;
      }
    }

    trailPointsRef.current.unshift(new THREE.Vector3(shipPositionRef.current.x, shipPositionRef.current.y, 1));
    if (trailPointsRef.current.length > 42) trailPointsRef.current.pop();
    trailLineRef.current.geometry.setFromPoints(trailPointsRef.current);
    trailLineRef.current.geometry.attributes.position.needsUpdate = true;

    trailParticlesRef.current.push({ x: shipPositionRef.current.x, y: shipPositionRef.current.y, age: 0, life: 0.75 });
    if (trailParticlesRef.current.length > 190) trailParticlesRef.current.shift();
    const live = trailParticlesRef.current.filter((p) => {
      p.age += delta;
      return p.age < p.life;
    });
    trailParticlesRef.current = live;
    const particlePositions = new Float32Array(live.length * 3);
    for (let i = 0; i < live.length; i += 1) {
      particlePositions[i * 3] = live[i].x - velocityRef.current.x * 0.004;
      particlePositions[i * 3 + 1] = live[i].y - velocityRef.current.y * 0.004;
      particlePositions[i * 3 + 2] = 1;
    }
    trailParticleGeometryRef.current.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    trailParticleGeometryRef.current.attributes.position.needsUpdate = true;

    planets.forEach((planet) => {
      const angle = elapsed * planet.orbitSpeed + (planet.phase ?? 0);
      const x = Math.cos(angle) * planet.radius;
      const y = Math.sin(angle) * planet.radius * 0.93;
      worldPositionsRef.current[planet.id] = new THREE.Vector2(x, y);
      const mesh = planetRefs.current[planet.id];
      if (mesh) mesh.position.set(x, y, 0);
    });
    moons.forEach((moon) => {
      const parentPosition = worldPositionsRef.current[moon.parentId];
      if (!parentPosition) return;
      const angle = elapsed * moon.orbitSpeed + (moon.phase ?? 0);
      const x = parentPosition.x + Math.cos(angle) * moon.radius;
      const y = parentPosition.y + Math.sin(angle) * moon.radius;
      worldPositionsRef.current[moon.id] = new THREE.Vector2(x, y);
      const mesh = moonRefs.current[moon.id];
      if (mesh) mesh.position.set(x, y, 0);
    });
    distantObjects.forEach((obj) => {
      worldPositionsRef.current[obj.id] = new THREE.Vector2(obj.position.x, obj.position.y);
    });

    const cameraTarget = new THREE.Vector3(shipPositionRef.current.x, shipPositionRef.current.y, 0);
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, cameraTarget.x, 0.08);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, cameraTarget.y, 0.08);
    const returnPulse = returnStateRef.current.active ? Math.sin((returnStateRef.current.elapsed / RETURN_DURATION) * Math.PI) : 0;
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, 110 - returnPulse * 24, 0.11);

    const twinkle = (layerKey: "far" | "mid" | "near", layer: (typeof starLayers)["far"]) => {
      const points = starRefs.current[layerKey];
      if (!points) return;
      const attr = points.geometry.getAttribute("color") as THREE.BufferAttribute;
      for (let i = 0; i < layer.count; i += 1) {
        const pulse = 0.78 + Math.sin(elapsed * layer.twinkles[i * 2 + 1] + layer.twinkles[i * 2]) * 0.22;
        attr.array[i * 3] = layer.colors[i * 3] * pulse;
        attr.array[i * 3 + 1] = layer.colors[i * 3 + 1] * pulse;
        attr.array[i * 3 + 2] = layer.colors[i * 3 + 2] * pulse;
      }
      attr.needsUpdate = true;
    };
    twinkle("far", starLayers.far);
    twinkle("mid", starLayers.mid);
    twinkle("near", starLayers.near);
    if (sunCoronaRef.current) {
      const pulse = 1 + Math.sin(elapsed * 0.65) * 0.06;
      sunCoronaRef.current.scale.setScalar(pulse);
    }

    if (selection) {
      selectionUpdateClockRef.current += delta;
      if (selectionUpdateClockRef.current > 0.03) {
        const pos = worldPositionsRef.current[selection.id];
        if (pos) {
          const projected = new THREE.Vector3(pos.x, pos.y, 0).project(camera);
          onSelectionScreenMove({ x: ((projected.x + 1) / 2) * size.width, y: ((-projected.y + 1) / 2) * size.height });
        }
        selectionUpdateClockRef.current = 0;
      }
    }
  });

  return (
    <group onPointerMissed={handlePointerMissed}>
      <mesh position={[-1700, 1200, -175]}>
        <circleGeometry args={[720, 64]} />
        <meshBasicMaterial color="#533582" transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh position={[1200, -900, -170]}>
        <circleGeometry args={[840, 64]} />
        <meshBasicMaterial color="#364a92" transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <points ref={setStarRef("far")}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starLayers.far.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[starLayers.far.colors.slice(), 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.75} vertexColors transparent opacity={0.5} sizeAttenuation depthWrite={false} />
      </points>
      <points ref={setStarRef("mid")}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starLayers.mid.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[starLayers.mid.colors.slice(), 3]} />
        </bufferGeometry>
        <pointsMaterial size={1.05} vertexColors transparent opacity={0.72} sizeAttenuation depthWrite={false} />
      </points>
      <points ref={setStarRef("near")}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starLayers.near.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[starLayers.near.colors.slice(), 3]} />
        </bufferGeometry>
        <pointsMaterial size={1.6} vertexColors transparent opacity={0.88} sizeAttenuation depthWrite={false} />
      </points>

      <mesh position={[0, 0, 0]} onClick={(event) => {
        event.stopPropagation();
        selectObject(sun.id, { id: sun.id, name: sun.name, worldPosition: { x: 0, y: 0 }, info: sun.info });
      }}>
        <sphereGeometry args={[sun.size, 44, 44]} />
        <meshStandardMaterial color="#ffe28f" emissive="#ff9d3c" emissiveIntensity={1.35} />
      </mesh>
      <mesh ref={sunCoronaRef} position={[0, 0, 0]}>
        <circleGeometry args={[sun.size * 2.6, 64]} />
        <meshBasicMaterial color="#ffb570" transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {orbitalGuides.map((orbit) => (
        <line key={`orbit-${orbit.id}`}>
          <bufferGeometry setFromPoints={orbit.points} />
          <lineBasicMaterial color="#a2b8db" transparent opacity={0.08} />
        </line>
      ))}

      {planets.map((planet) => (
        <mesh
          key={planet.id}
          ref={(mesh) => { planetRefs.current[planet.id] = mesh; }}
          position={[planet.radius, 0, 0]}
          onClick={(event) => {
            event.stopPropagation();
            selectObject(planet.id, { id: planet.id, name: planet.name, worldPosition: { x: planet.radius, y: 0 }, info: planet.info });
          }}
        >
          <sphereGeometry args={[planet.size, 32, 32]} />
          <meshStandardMaterial
            color={planet.color}
            roughness={planet.style === "banded" ? 0.82 : 0.58}
            metalness={0.08}
            emissive={planet.style === "ice" ? "#1a3156" : "#111111"}
            emissiveIntensity={planet.style === "ice" ? 0.24 : 0.1}
          />
        </mesh>
      ))}

      {moons.map((moon) => (
        <mesh
          key={moon.id}
          ref={(mesh) => { moonRefs.current[moon.id] = mesh; }}
          position={[0, 0, 0]}
          onClick={(event) => {
            event.stopPropagation();
            selectObject(moon.id, { id: moon.id, name: moon.name, worldPosition: { x: 0, y: 0 }, info: moon.info });
          }}
        >
          <sphereGeometry args={[moon.size, 20, 20]} />
          <meshStandardMaterial color={moon.color} roughness={0.84} metalness={0.04} />
        </mesh>
      ))}

      {distantObjects.map((obj) => (
        <group key={obj.id} position={[obj.position.x, obj.position.y, 0]}>
          {obj.style === "nebula" ? (
            <>
              <mesh onClick={(event) => {
                event.stopPropagation();
                selectObject(obj.id, { id: obj.id, name: obj.name, worldPosition: obj.position, info: obj.info });
              }}>
                <circleGeometry args={[obj.size * 1.1, 60]} />
                <meshBasicMaterial color={obj.color} transparent opacity={0.45} blending={THREE.AdditiveBlending} />
              </mesh>
              <mesh>
                <ringGeometry args={[obj.size * 0.62, obj.size * 1.5, 60]} />
                <meshBasicMaterial color={obj.id.includes("helix") ? "#ff9b66" : "#f2a1ff"} transparent opacity={0.32} blending={THREE.AdditiveBlending} />
              </mesh>
            </>
          ) : (
            <mesh onClick={(event) => {
              event.stopPropagation();
              selectObject(obj.id, { id: obj.id, name: obj.name, worldPosition: obj.position, info: obj.info });
            }}>
              <sphereGeometry args={[obj.size, 30, 30]} />
              <meshStandardMaterial color={obj.color} emissive={obj.color} emissiveIntensity={0.36} roughness={0.48} />
            </mesh>
          )}
        </group>
      ))}

      <primitive object={trailLineRef.current} />
      <points geometry={trailParticleGeometryRef.current} material={trailParticleMaterialRef.current} />

      <mesh ref={shipRef} position={[0, -22, 2]}>
        <coneGeometry args={[2, 7, 4]} />
        <meshStandardMaterial color="#d1dae8" emissive="#2f5f8f" emissiveIntensity={0.65} metalness={0.5} roughness={0.24} />
      </mesh>
      <mesh position={[0, -25.6, 2]}>
        <coneGeometry args={[1.1, 4.4, 3]} />
        <meshStandardMaterial color="#98a6bf" metalness={0.35} roughness={0.4} />
      </mesh>

      <ambientLight intensity={0.22} />
      <pointLight intensity={1.66} color="#ffd59a" position={[0, 0, 35]} />
      <directionalLight intensity={0.34} color="#b8d2ff" position={[40, 40, 45]} />
    </group>
  );
}

export function SpaceScene() {
  const [started, setStarted] = useState(false);
  const [distanceLabel, setDistanceLabel] = useState("0.00 AU");
  const [displayDistanceLabel, setDisplayDistanceLabel] = useState("0.00 AU");
  const [shipPosition, setShipPosition] = useState<Vec2>({ x: 0, y: -22 });
  const [selection, setSelection] = useState<SelectableObject | null>(null);
  const [selectionScreenPos, setSelectionScreenPos] = useState<Vec2 | null>(null);
  const [returnTick, setReturnTick] = useState(0);

  const handleSelectionChange = useCallback((item: SelectableObject | null, screenPos?: Vec2) => {
    setSelection(item);
    setSelectionScreenPos(screenPos ?? null);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setDisplayDistanceLabel(distanceLabel);
    }, 55);
    return () => window.clearInterval(timer);
  }, [distanceLabel]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white">
      {!started && <IntroOverlay onBegin={() => setStarted(true)} />}
      {started && (
        <>
          <HUD
            distanceLabel={displayDistanceLabel}
            shipPosition={shipPosition}
            minimapRange={MINIMAP_RANGE}
            distantMarkers={distantObjects.map((obj) => ({ id: obj.id, label: obj.name, position: obj.position }))}
            onReturnToSolarSystem={() => setReturnTick((prev) => prev + 1)}
          />
          {selection && selectionScreenPos && (
            <ObjectInfoCard name={selection.name} info={selection.info} screenPosition={selectionScreenPos} />
          )}
        </>
      )}
      <Canvas camera={{ position: [0, -24, 110], fov: 50 }} className="bg-black" dpr={[1, 1.75]} style={{ pointerEvents: started ? "auto" : "none" }}>
        <SpaceWorld
          onDistanceChange={setDistanceLabel}
          onShipPositionChange={setShipPosition}
          selection={selection}
          onSelectionChange={handleSelectionChange}
          onSelectionScreenMove={setSelectionScreenPos}
          returnTick={returnTick}
        />
      </Canvas>
    </div>
  );
}
