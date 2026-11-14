/**
 * Procedural 3D body (capsules + spheres, no external model, nothing to license) with glowing region hotspots.
 * Render-on-demand: the GPU idles unless a region is at Act and motion is allowed (slow pulse).
 * Camera presets Front / Side / Back; drag to rotate, scroll to zoom within bounds; click a hotspot to select.
 */
import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { REGIONS, type RegionId } from "../../data";
import type { Status } from "../../engine/alerts";

const HEX: Record<Status, string> = { nominal: "#46c38b", watch: "#f2b13c", act: "#f0565c", stale: "#7a869a" };
const SKIN = new THREE.MeshStandardMaterial({ color: "#8fa8ff", transparent: true, opacity: 0.2, roughness: 0.6, metalness: 0.1, emissive: "#24315e", emissiveIntensity: 0.4, depthWrite: false });

interface Props {
  status: Record<RegionId, Status>;
  selected: RegionId;
  onSelect: (id: RegionId) => void;
  reduced: boolean;
}

function Part({ pos, rot = [0, 0, 0], r, len, scale = [1, 1, 1] }: { pos: [number, number, number]; rot?: [number, number, number]; r: number; len: number; scale?: [number, number, number] }) {
  return (
    <mesh position={pos} rotation={rot} scale={scale} material={SKIN}>
      {len > 0 ? <capsuleGeometry args={[r, len, 6, 16]} /> : <sphereGeometry args={[r, 24, 16]} />}
    </mesh>
  );
}

function Figure() {
  return (
    <group>
      <Part pos={[0, 1.62, 0]} r={0.12} len={0} scale={[0.95, 1.12, 1]} />
      <Part pos={[0, 1.46, 0]} r={0.05} len={0.06} />
      <Part pos={[0, 1.16, 0]} r={0.17} len={0.36} scale={[1.18, 1, 0.72]} />
      <Part pos={[0, 0.88, 0]} r={0.16} len={0} scale={[1.05, 0.62, 0.78]} />
      <Part pos={[-0.29, 1.12, 0]} rot={[0, 0, 0.12]} r={0.045} len={0.56} />
      <Part pos={[0.29, 1.12, 0]} rot={[0, 0, -0.12]} r={0.045} len={0.56} />
      <Part pos={[-0.1, 0.42, 0]} r={0.065} len={0.7} />
      <Part pos={[0.1, 0.42, 0]} r={0.065} len={0.7} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <ringGeometry args={[0.45, 0.47, 64]} />
        <meshBasicMaterial color="#2a3a5c" />
      </mesh>
    </group>
  );
}

function Hotspot({ id, s, selected, onSelect, reduced }: { id: RegionId; s: Status; selected: boolean; onSelect: (id: RegionId) => void; reduced: boolean }) {
  const r = REGIONS.find((x) => x.id === id)!;
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current || s !== "act" || reduced) return;
    const k = 1 + Math.sin(clock.elapsedTime * 2.6) * 0.12;
    ref.current.scale.setScalar(k);
  });
  const opacity = s === "act" ? 0.7 : s === "watch" ? 0.55 : s === "nominal" ? 0.22 : 0.1;
  return (
    <group position={r.pos3d}>
      <mesh
        ref={ref}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(id);
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "")}
      >
        <sphereGeometry args={[r.radius * 0.72, 24, 16]} />
        <meshBasicMaterial color={HEX[s]} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {selected && (
        <mesh>
          <torusGeometry args={[r.radius * 0.72 + 0.035, 0.007, 8, 48]} />
          <meshBasicMaterial color="#e8eef9" />
        </mesh>
      )}
    </group>
  );
}

function FocusTarget({ selected, controls }: { selected: RegionId; controls: React.RefObject<OrbitControlsImpl | null> }) {
  const { invalidate } = useThree();
  const goal = useRef(new THREE.Vector3(0, 0.95, 0));
  useEffect(() => {
    const p = REGIONS.find((r) => r.id === selected)!.pos3d;
    goal.current.set(0, 0.7 + p[1] * 0.25, 0);
    invalidate();
  }, [selected, invalidate]);
  useFrame(() => {
    const c = controls.current;
    if (!c) return;
    if (c.target.distanceTo(goal.current) > 0.002) {
      c.target.lerp(goal.current, 0.12);
      c.update();
      invalidate();
    }
  });
  return null;
}

export default function Body3D({ status, selected, onSelect, reduced }: Props) {
  const controls = useRef<OrbitControlsImpl | null>(null);
  const anyAct = Object.values(status).includes("act");
  const preset = (pos: [number, number, number]) => {
    const c = controls.current;
    if (!c) return;
    c.object.position.set(...pos);
    c.update();
  };
  return (
    <>
      <div style={{ position: "absolute", top: 12, right: 12, zIndex: 3 }} className="seg" role="group" aria-label="Camera">
        <button onClick={() => preset([0, 1.0, 3.9])}>Front</button>
        <button onClick={() => preset([3.9, 1.0, 0])}>Side</button>
        <button onClick={() => preset([0, 1.0, -3.9])}>Back</button>
      </div>
      <Canvas
        frameloop={anyAct && !reduced ? "always" : "demand"}
        dpr={[1, 1.75]}
        camera={{ position: [0, 1.0, 3.9], fov: 36 }}
        gl={{ antialias: true, powerPreference: "low-power" }}
        aria-label="3D body. Use the region list for keyboard access."
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 3, 2]} intensity={1.1} />
        <Figure />
        {REGIONS.map((r) => (
          <Hotspot key={r.id} id={r.id} s={status[r.id]} selected={selected === r.id} onSelect={onSelect} reduced={reduced} />
        ))}
        <OrbitControls ref={controls} enablePan={false} minDistance={1.4} maxDistance={5} minPolarAngle={Math.PI * 0.25} maxPolarAngle={Math.PI * 0.62} target={[0, 0.95, 0]} enableDamping />
        <FocusTarget selected={selected} controls={controls} />
      </Canvas>
    </>
  );
}
