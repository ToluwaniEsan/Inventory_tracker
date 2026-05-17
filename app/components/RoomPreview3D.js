"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { DoubleSide } from "three";

function RoomBox({ zones }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[4, 4]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      <mesh position={[0, 1, -2]}>
        <planeGeometry args={[4, 2]} />
        <meshStandardMaterial color="#cbd5e1" side={DoubleSide} />
      </mesh>
      <mesh position={[-2, 1, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[4, 2]} />
        <meshStandardMaterial color="#94a3b8" side={DoubleSide} />
      </mesh>
      <mesh position={[2, 1, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[4, 2]} />
        <meshStandardMaterial color="#94a3b8" side={DoubleSide} />
      </mesh>
      {zones.map((z) => (
        <group
          key={z.id}
          position={[(z.x - 0.5) * 3.5, 0.05, (z.y - 0.5) * 3.5]}
        >
          <mesh>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="#2563eb" />
          </mesh>
          <Text
            position={[0, 0.2, 0]}
            fontSize={0.12}
            color="#1e293b"
            anchorX="center"
            maxWidth={1.2}
          >
            {z.label}
          </Text>
        </group>
      ))}
    </group>
  );
}

export default function RoomPreview3D({ zones = [] }) {
  return (
    <Canvas camera={{ position: [3, 3, 3], fov: 50 }} style={{ height: 360 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} />
      <RoomBox zones={zones} />
      <OrbitControls makeDefault />
    </Canvas>
  );
}
