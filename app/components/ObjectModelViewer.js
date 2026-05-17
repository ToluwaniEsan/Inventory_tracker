"use client";
import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function TexturedBox({ model }) {
  const w = model.width || 1;
  const h = model.height || 0.6;
  const d = model.depth || 0.4;

  const material = useMemo(() => {
    const url = model.textures?.front;
    if (!url) return new THREE.MeshStandardMaterial({ color: "#94a3b8" });
    const tex = new THREE.TextureLoader().load(url);
    return new THREE.MeshStandardMaterial({ map: tex });
  }, [model]);

  return (
    <mesh material={material}>
      <boxGeometry args={[w, h, d]} />
    </mesh>
  );
}

export default function ObjectModelViewer({ model, height = 280 }) {
  if (!model) return null;
  return (
    <Canvas camera={{ position: [1.5, 1, 2], fov: 45 }} style={{ height }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 2]} intensity={0.9} />
      <TexturedBox model={model} />
      <OrbitControls makeDefault />
    </Canvas>
  );
}
