/**
 * 3D body: "Rigged Figure" by Cesium (CC-BY 4.0, Khronos glTF sample assets), bundled locally in public/models,
 * scaled to 1.75 m, rendered as a translucent sage figure with glowing region hotspots.
 * Render-on-demand: the GPU idles unless a region is at Act and motion is allowed (slow pulse).
 * Camera presets Front / Side / Back; drag to rotate, scroll to zoom within bounds; click a hotspot to select.
 */
import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { REGIONS, type RegionId } from "../../data";
import type { Status } from "../../engine/alerts";

export const MODEL_URL = "./models/rigged-figure.glb";
const HEX: Record<Status, string> = { nominal: "#2e6b3f", watch: "#d9952b", act: "#b3261e", stale: "#9aa094" };
const SKIN = new THREE.MeshStandardMaterial({ color: "#a3b18a", transparent: true, opacity: 0.55, roughness: 0.85, metalness: 0, depthWrite: false });

interface Props {
  status: Record<RegionId, Status>;
  selected: RegionId;
  onSelect: (id: RegionId) => void;
  reduced: boolean;
}

/** Loads the figure, recolours it, and fits it to 1.75 m with the feet on the floor. */
function Figure() {
  const gltf = useGLTF(MODEL_URL, false, false); // no Draco / Meshopt: the model is uncompressed, and decoders would need WASM or a CDN
  const object = useMemo(() => {
    const root = gltf.scene.clone(true);
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.material = SKIN;
        m.frustumCulled = false;
      }
    });
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    if (size.z > size.y) root.rotation.x = -Math.PI / 2; // stand a Z-up export upright
    const box2 = new THREE.Box3().setFromObject(root);
    root.scale.multiplyScalar(1.75 / box2.getSize(new THREE.Vector3()).y);
    const box3 = new THREE.Box3().setFromObject(root);
    const c = box3.getCenter(new THREE.Vector3());
    root.position.set(-c.x, -box3.min.y, -c.z);
    return root;
  }, [gltf]);
  return (
    <group>
      <primitive object={object} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.45, 0.465, 64]} />
        <meshBasicMaterial color="#588157" />
      </mesh>
    </group>
  );
}
useGLTF.preload(MODEL_URL, false, false);

function Hotspot({ id, s, selected, onSelect, reduced }: { id: RegionId; s: Status; selected: boolean; onSelect: (id: RegionId) => void; reduced: boolean }) {
  const r = REGIONS.find((x) => x.id === id)!;
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current || s !== "act" || reduced) return;
    ref.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2.6) * 0.12);
  });
  const opacity = s === "act" ? 0.85 : s === "watch" ? 0.8 : s === "nominal" ? 0.4 : 0.2;
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
        <sphereGeometry args={[r.radius * 0.7, 24, 16]} />
        <meshBasicMaterial color={HEX[s]} transparent opacity={opacity} depthWrite={false} />
      </mesh>
      {selected && (
        <mesh>
          <torusGeometry args={[r.radius * 0.7 + 0.035, 0.008, 8, 48]} />
          <meshBasicMaterial color="#344e41" />
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
        <ambientLight intensity={0.9} />
        <directionalLight position={[2, 3, 2]} intensity={1.2} />
        <Suspense fallback={null}>
          <Figure />
        </Suspense>
        {REGIONS.map((r) => (
          <Hotspot key={r.id} id={r.id} s={status[r.id]} selected={selected === r.id} onSelect={onSelect} reduced={reduced} />
        ))}
        <OrbitControls ref={controls} enablePan={false} minDistance={1.4} maxDistance={5} minPolarAngle={Math.PI * 0.25} maxPolarAngle={Math.PI * 0.62} target={[0, 0.95, 0]} enableDamping />
        <FocusTarget selected={selected} controls={controls} />
      </Canvas>
    </>
  );
}
