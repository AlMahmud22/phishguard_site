"use client";

import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function InteractiveMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      
      // Smooth follow mouse
      meshRef.current.rotation.x = THREE.MathUtils.lerp(
        meshRef.current.rotation.x,
        mousePosition.y * 0.5,
        0.05
      );
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        mousePosition.x * 0.5,
        0.05
      );
      
      // Subtle breathing animation
      const scale = 1 + Math.sin(time * 0.5) * 0.1;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  // Create complex geometry with displacement
  const geometry = new THREE.IcosahedronGeometry(2, 4);
  
  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        color="#2779a7"
        transparent
        opacity={0.15}
        wireframe={false}
        roughness={0.1}
        metalness={0.9}
        emissive="#cddcf2"
        emissiveIntensity={0.2}
      />
    </mesh>
  );
}

function ParticleField() {
  const points = useRef<THREE.Points>(null);
  const count = 1000;

  const particlesPosition = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    particlesPosition[i3] = (Math.random() - 0.5) * 20;
    particlesPosition[i3 + 1] = (Math.random() - 0.5) * 20;
    particlesPosition[i3 + 2] = (Math.random() - 0.5) * 20;
  }

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y = state.clock.getElapsedTime() * 0.02;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesPosition.length / 3}
          array={particlesPosition}
          itemSize={3}
          args={[particlesPosition, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#cddcf2"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

export default function InteractiveBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 75 }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#2779a7" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#cddcf2" />
        <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={0.5} color="#f0f0f0" />
        
        <InteractiveMesh />
        <ParticleField />
      </Canvas>
    </div>
  );
}
