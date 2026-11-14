/**
 * 3D body: a translucent sage body with real organ models inside, each coloured by its region's status.
 * Models are free Sketchfab downloads (CC-BY 4.0, authors in public/models/CREDITS.txt), shrunk for offline use
 * (a few thousand triangles each, no textures, no Draco/Meshopt, so no WASM and no CDN under the CSP).
 * Regions without an organ model (eyes, skin, whole body) keep a glowing hotspot.
 * Render-on-demand: the GPU idles unless a region is at Act and motion is allowed (slow pulse).
 * Camera presets Front / Side / Back; drag to rotate, scroll to zoom within bounds; click an organ or hotspot to select.
 */
import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { REGIONS, type RegionId } from "../../data";
import type { Status } from "../../engine/alerts";

const BODY_URL = "./models/organs/body.glb";
const HEX: Record<Status, string> = { nominal: "#2e6b3f", watch: "#d9952b", act: "#b3261e", stale: "#9aa094" };
const SKIN = new THREE.MeshStandardMaterial({ color: "#a3b18a", transparent: true, opacity: 0.32, roughness: 0.85, metalness: 0, depthWrite: false, side: THREE.DoubleSide });

/** Each organ model, fitted so its largest side is `size` metres, centred at `at`, after rotating by `rot` (radians). */
interface Organ {
  region: RegionId;
  url: string;
  at: [number, number, number];
  size: number;
  rot?: [number, number, number];
}
export const ORGANS: Organ[] = [
  { region: "brain", url: "./models/organs/skull.glb", at: [0, 1.63, 0.01], size: 0.22, rot: [0, Math.PI, 0] },
  { region: "lungs", url: "./models/organs/lungs.glb", at: [0, 1.33, 0.0], size: 0.32 },
  { region: "heart", url: "./models/organs/heart.glb", at: [0.03, 1.28, 0.08], size: 0.16 },
  { region: "gut", url: "./models/organs/stomach.glb", at: [0.07, 1.15, 0.09], size: 0.13 },
  { region: "gut", url: "./models/organs/intestines.glb", at: [0, 0.96, 0.05], size: 0.28 },
  { region: "musculoskeletal", url: "./models/organs/spine.glb", at: [0, 1.13, -0.045], size: 0.5 },
];
const WITH_ORGAN = new Set(ORGANS.map((o) => o.region));

interface Props {
  status: Record<RegionId, Status>;
  selected: RegionId;
  onSelect: (id: RegionId) => void;
  reduced: boolean;
}

/** Loads a GLB without decoders (the files are uncompressed) and returns a fitted clone. */
function useFitted(url: string, fit: (box: THREE.Box3, root: THREE.Object3D) => void, material?: THREE.Material) {
  const gltf = useGLTF(url, false, false);
  return useMemo(() => {
    const root = gltf.scene.clone(true);
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.geometry = m.geometry.clone();
        if (!m.geometry.getAttribute("normal")) m.geometry.computeVertexNormals();
        if (material) m.material = material;
        m.frustumCulled = false;
      }
    });
    fit(new THREE.Box3().setFromObject(root), root);
    return root;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gltf, url]);
}

/** The body shell: 1.75 m tall, feet on the floor, centred. */
function Body() {
  const object = useFitted(
    BODY_URL,
    (box, root) => {
      const size = box.getSize(new THREE.Vector3());
      if (size.z > size.y) root.rotation.x = -Math.PI / 2;
      const b2 = new THREE.Box3().setFromObject(root);
      root.scale.multiplyScalar(1.75 / b2.getSize(new THREE.Vector3()).y);
      const b3 = new THREE.Box3().setFromObject(root);
      const c = b3.getCenter(new THREE.Vector3());
      root.position.set(-c.x, -b3.min.y, -c.z);
    },
    SKIN,
  );
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

function OrganModel({ organ, s, selected, onSelect, reduced }: { organ: Organ; s: Status; selected: boolean; onSelect: (id: RegionId) => void; reduced: boolean }) {
  const material = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0, side: THREE.DoubleSide }), []);
  const object = useFitted(
    organ.url,
    (_box, root) => {
      if (organ.rot) root.rotation.set(...organ.rot);
      const b = new THREE.Box3().setFromObject(root);
      const size = b.getSize(new THREE.Vector3());
      root.scale.multiplyScalar(organ.size / Math.max(size.x, size.y, size.z));
      const b2 = new THREE.Box3().setFromObject(root);
      const c = b2.getCenter(new THREE.Vector3());
      root.position.set(organ.at[0] - c.x, organ.at[1] - c.y, organ.at[2] - c.z);
    },
    material,
  );
  useEffect(() => {
    material.color.set(HEX[s]);
    material.emissive.set(HEX[s]);
    material.emissiveIntensity = selected ? 0.55 : s === "nominal" ? 0.08 : 0.3;
    material.opacity = s === "stale" ? 0.5 : 1;
    material.transparent = s === "stale";
    material.needsUpdate = true;
  }, [material, s, selected]);
  useFrame(({ clock }) => {
    if (s !== "act" || reduced) return;
    material.emissiveIntensity = (selected ? 0.55 : 0.3) + Math.sin(clock.elapsedTime * 2.6) * 0.2;
  });
  return (
    <primitive
      object={object}
      onClick={(e: { stopPropagation: () => void }) => {
        e.stopPropagation();
        onSelect(organ.region);
      }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "")}
    />
  );
}

ORGANS.forEach((o) => useGLTF.preload(o.url, false, false));
useGLTF.preload(BODY_URL, false, false);

/** Glowing sphere for regions without an organ model. */
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
        <sphereGeometry args={[r.radius * 0.6, 24, 16]} />
        <meshBasicMaterial color={HEX[s]} transparent opacity={opacity} depthWrite={false} />
      </mesh>
      {selected && (
        <mesh>
          <torusGeometry args={[r.radius * 0.6 + 0.03, 0.008, 8, 48]} />
          <meshBasicMaterial color="#344e41" />
        </mesh>
      )}
    </group>
  );
}

function focusPoint(id: RegionId): [number, number, number] {
  return ORGANS.find((o) => o.region === id)?.at ?? REGIONS.find((r) => r.id === id)!.pos3d;
}

function FocusTarget({ selected, controls }: { selected: RegionId; controls: React.RefObject<OrbitControlsImpl | null> }) {
  const { invalidate } = useThree();
  const goal = useRef(new THREE.Vector3(0, 0.95, 0));
  useEffect(() => {
    const p = focusPoint(selected);
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
        <directionalLight position={[-2, 1, -2]} intensity={0.4} />
        <Suspense fallback={null}>
          {ORGANS.map((o) => (
            <OrganModel key={o.url} organ={o} s={status[o.region]} selected={selected === o.region} onSelect={onSelect} reduced={reduced} />
          ))}
          <Body />
        </Suspense>
        {REGIONS.filter((r) => !WITH_ORGAN.has(r.id)).map((r) => (
          <Hotspot key={r.id} id={r.id} s={status[r.id]} selected={selected === r.id} onSelect={onSelect} reduced={reduced} />
        ))}
        <OrbitControls ref={controls} enablePan={false} minDistance={1.2} maxDistance={5} minPolarAngle={Math.PI * 0.25} maxPolarAngle={Math.PI * 0.62} target={[0, 0.95, 0]} enableDamping />
        <FocusTarget selected={selected} controls={controls} />
      </Canvas>
    </>
  );
}
