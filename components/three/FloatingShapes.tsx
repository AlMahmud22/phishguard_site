"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Float } from "@react-three/drei";
import * as THREE from "three";

interface ShapeProps {
  position: [number, number, number];
  color: string;
  scale?: number;
}

function FloatingSphere({ position, color, scale = 1 }: ShapeProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      meshRef.current.rotation.x = time * 0.2;
      meshRef.current.rotation.y = time * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <sphereGeometry args={[1, 32, 32]} />
        <MeshDistortMaterial
          color={color}
          transparent
          opacity={0.6}
          distort={0.4}
          speed={2}
          roughness={0.2}
        />
      </mesh>
    </Float>
  );
}

function FloatingTorus({ position, color, scale = 1 }: ShapeProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      meshRef.current.rotation.x = time * 0.3;
      meshRef.current.rotation.z = time * 0.2;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1.5}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <torusGeometry args={[1, 0.4, 16, 100]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.5}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>
    </Float>
  );
}

function FloatingBox({ position, color, scale = 1 }: ShapeProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      meshRef.current.rotation.x = time * 0.25;
      meshRef.current.rotation.y = time * 0.25;
    }
  });

  return (
    <Float speed={1.8} rotationIntensity={1.2} floatIntensity={2}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.6}
          roughness={0.2}
          metalness={0.7}
        />
      </mesh>
    </Float>
  );
}

export default function FloatingShapes() {
  return (
    <div className="absolute inset-0 -z-10 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 75 }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#cddcf2" />
        
        <FloatingSphere position={[-4, 2, 0]} color="#2779a7" scale={0.8} />
        <FloatingTorus position={[4, -1, -2]} color="#cddcf2" scale={0.6} />
        <FloatingBox position={[2, 3, -3]} color="#2779a7" scale={0.5} />
        <FloatingSphere position={[-3, -2, -1]} color="#cddcf2" scale={0.6} />
        <FloatingTorus position={[0, 1, -4]} color="#2779a7" scale={0.7} />
      </Canvas>
    </div>
  );
}
