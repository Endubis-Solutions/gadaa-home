"use client";
import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useGadaa } from "@/lib/store";

function Tree({ health }: { health: number }) {
  const group = useRef<THREE.Group>(null);
  const t = useRef(0);
  const normalized = health / 100;

  // geometry params tied to health
  useFrame((_, delta) => {
    t.current += delta;
    if (!group.current) return;
    const breathe = 1 + Math.sin(t.current * 0.8) * 0.015 * normalized;
    group.current.scale.set(breathe, breathe, breathe);
    group.current.rotation.y += delta * 0.04 * (0.5 + normalized);
    // fracture jitter when unhealthy
    if (health < 40) {
      group.current.position.x = (Math.random() - 0.5) * 0.04;
      group.current.position.z = (Math.random() - 0.5) * 0.04;
    } else {
      group.current.position.x *= 0.9;
      group.current.position.z *= 0.9;
    }
  });

  const leafColor = useMemo(() => {
    if (health > 75) return "#3FAE5A";
    if (health > 50) return "#8EA23B";
    if (health > 30) return "#9E6B2E";
    return "#5A2A2A";
  }, [health]);

  const canopyCount = Math.round(90 * (0.3 + normalized * 0.7));

  return (
    <group ref={group}>
      {/* trunk */}
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.18, 0.32, 1.8, 12]} />
        <meshStandardMaterial color={health < 30 ? "#3A2015" : "#4A2C17"} roughness={0.9} />
      </mesh>
      {/* rings */}
      {[0.6, 0.95, 1.3].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.22 + i * 0.02, 0.012, 8, 24]} />
          <meshStandardMaterial color="#D98E32" emissive="#D98E32" emissiveIntensity={0.6 * normalized} />
        </mesh>
      ))}
      {/* branches */}
      {[
        { pos: [0.5, 1.6, 0] as const, rot: [0, 0, -0.6] as const },
        { pos: [-0.5, 1.55, 0.15] as const, rot: [0, 0, 0.65] as const },
        { pos: [0, 1.75, -0.45] as const, rot: [0.6, 0, 0] as const },
      ].map((b, i) => (
        <mesh key={i} position={[b.pos[0], b.pos[1], b.pos[2]]} rotation={[b.rot[0], b.rot[1], b.rot[2]]}>
          <cylinderGeometry args={[0.06, 0.12, 0.9, 8]} />
          <meshStandardMaterial color="#5C3A1E" />
        </mesh>
      ))}
      {/* canopy orbs */}
      {Array.from({ length: canopyCount }).map((_, i) => {
        const angle = (i / canopyCount) * Math.PI * 2 + i * 0.7;
        const r = 0.75 + Math.random() * 0.55;
        const y = 1.9 + Math.sin(i * 1.3) * 0.4 + Math.random() * 0.3;
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r * 0.7;
        const s = 0.08 + Math.random() * 0.14;
        return (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[s, 8, 8]} />
            <meshStandardMaterial color={leafColor} roughness={0.6} emissive={leafColor} emissiveIntensity={health > 70 ? 0.15 : 0} />
          </mesh>
        );
      })}
      {/* central glow */}
      <mesh position={[0, 1.7, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color={leafColor} emissive={leafColor} emissiveIntensity={0.9} transparent opacity={0.85} />
      </mesh>
      {/* ground Caffee circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <ringGeometry args={[1.25, 1.32, 48]} />
        <meshStandardMaterial color="#D98E32" emissive="#D98E32" emissiveIntensity={0.5 + normalized * 0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
        <circleGeometry args={[1.25, 48]} />
        <meshStandardMaterial color="#0F2318" roughness={1} />
      </mesh>
      {/* small stones for assembly */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <mesh key={"s" + i} position={[Math.cos(a) * 1.05, 0.04, Math.sin(a) * 1.05]}>
            <sphereGeometry args={[0.05, 6, 6]} />
            <meshStandardMaterial color={health > 60 ? "#E8DCC6" : "#6E5A4A"} />
          </mesh>
        );
      })}
    </group>
  );
}

export default function Odaa() {
  const health = useGadaa((s) => s.trustHealth);
  const ethicalAct = useGadaa((s) => s.ethicalAction);
  const selfishAct = useGadaa((s) => s.selfishAction);
  return (
    <div className="w-full h-[520px] md:h-[600px] rounded-[24px] overflow-hidden border border-white/10 bg-gradient-to-b from-[#0E1E14] via-[#0B0B0B] to-[#1A1208] relative">
      <Canvas camera={{ position: [2.6, 2.0, 3.4], fov: 48 }} dpr={[1, 1.8]}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[4, 6, 3]} intensity={1.0} />
        <pointLight position={[0, 2.5, 0]} intensity={health / 40} color="#D98E32" />
        <Tree health={health} />
        <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 2.1} />
        <fog attach="fog" args={["#0B0B0B", 4, 9]} />
      </Canvas>

      <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2 pointer-events-none">
        <div className="flex justify-between items-end">
          <div className="px-3 py-2 rounded-xl bg-black/70 border border-white/10 backdrop-blur">
            <div className="text-[10px] tracking-[0.2em] text-white/60">CANOPY DENSITY</div>
            <div className="text-xs font-mono">{health < 45 ? "FRACTURED" : health < 75 ? "STRESSED" : "FLOURISHING"}</div>
          </div>
          <div className="px-3 py-2 rounded-xl bg-black/70 border border-white/10 backdrop-blur text-right">
            <div className="text-[10px] tracking-[0.2em] text-white/60">LIVE LIGHT • MOVE TO ORBIT</div>
            <div className="text-[10px] font-mono text-white/50">Every vote reshapes the tree</div>
          </div>
        </div>
        <div className="flex justify-center gap-3 pointer-events-auto">
          <button onClick={()=>ethicalAct(2)} className="px-6 py-2.5 rounded-full bg-white text-black font-bold text-sm shadow-lg hover:bg-white/90 transition">Do Ethical Act (+health)</button>
          <button onClick={()=>selfishAct()} className="px-5 py-2.5 rounded-full bg-black/70 border border-white/20 text-white text-sm backdrop-blur hover:bg-black/80 transition">Do Selfish Act</button>
        </div>
      </div>

      {health < 30 && <div className="absolute inset-0 pointer-events-none opacity-[0.07]" style={{ backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, #ff0000 2px, #ff0000 3px)` }} />}
    </div>
  );
}
