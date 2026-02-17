"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere } from "@react-three/drei";
import * as THREE from "three";

// Earth Globe with realistic colors
function Earth() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Create earth-like texture with continents
  const earthTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;
    
    // Ocean blue background - darker
    ctx.fillStyle = '#0c4a6e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add land masses (simplified continents) - darker green
    ctx.fillStyle = '#15803d';
    // North America
    ctx.beginPath();
    ctx.ellipse(300, 400, 200, 250, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    
    // South America
    ctx.beginPath();
    ctx.ellipse(450, 700, 120, 200, Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Europe/Africa
    ctx.beginPath();
    ctx.ellipse(1000, 400, 180, 220, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(1050, 650, 200, 250, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Asia
    ctx.beginPath();
    ctx.ellipse(1400, 350, 300, 200, Math.PI / 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Australia
    ctx.beginPath();
    ctx.ellipse(1600, 750, 120, 100, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Ice caps - darker white
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(0, 0, canvas.width, 80);
    ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
    
    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002;
      meshRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.05;
    }
  });

  return (
    <Sphere ref={meshRef} args={[2, 64, 64]}>
      <meshStandardMaterial
        map={earthTexture}
        roughness={0.7}
        metalness={0.2}
        side={THREE.FrontSide}
        transparent={false}
        opacity={1}
        depthWrite={true}
      />
    </Sphere>
  );
}

// Atmosphere glow
function Atmosphere() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
    }
  });

  return (
    <Sphere ref={meshRef} args={[2.1, 64, 64]}>
      <meshBasicMaterial
        color="#3b82f6"
        transparent
        opacity={0.12}
        side={THREE.BackSide}
      />
    </Sphere>
  );
}

// Protective Shield
function ProtectiveShield() {
  const shieldRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  // Create shield particles
  const particles = useMemo(() => {
    const count = 600;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      // Distribute particles on sphere surface
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const radius = 2.4 + Math.random() * 0.2;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      // Color gradient - darker blue tones
      colors[i * 3] = 0.1 + Math.random() * 0.2;
      colors[i * 3 + 1] = 0.4 + Math.random() * 0.3;
      colors[i * 3 + 2] = 0.8 + Math.random() * 0.2;
    }
    
    return { positions, colors };
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (shieldRef.current) {
      shieldRef.current.rotation.y = time * 0.1;
      shieldRef.current.rotation.x = Math.sin(time * 0.3) * 0.1;
      
      // Pulse effect
      const scale = 1 + Math.sin(time * 2) * 0.02;
      shieldRef.current.scale.set(scale, scale, scale);
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.y = time * 0.15;
      particlesRef.current.rotation.x = Math.sin(time * 0.2) * 0.1;
    }
  });

  return (
    <group>
      {/* Semi-transparent shield sphere */}
      <Sphere ref={shieldRef} args={[2.5, 32, 32]}>
        <meshPhongMaterial
          color="#2563eb"
          transparent
          opacity={0.12}
          shininess={100}
          specular="#3b82f6"
          side={THREE.DoubleSide}
        />
      </Sphere>

      {/* Shield particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particles.positions.length / 3}
            array={particles.positions}
            itemSize={3}
            args={[particles.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            count={particles.colors.length / 3}
            array={particles.colors}
            itemSize={3}
            args={[particles.colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.025}
          vertexColors
          transparent
          opacity={0.8}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Hexagonal shield pattern */}
      <Sphere args={[2.48, 16, 16]}>
        <meshBasicMaterial
          color="#2563eb"
          wireframe
          transparent
          opacity={0.15}
        />
      </Sphere>
    </group>
  );
}

// Protection pulses/rings
function ProtectionPulses() {
  const pulsesRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (pulsesRef.current) {
      pulsesRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
      
      pulsesRef.current.children.forEach((child, i) => {
        const pulse = (state.clock.getElapsedTime() * 2 + i * 0.5) % 2;
        child.scale.setScalar(1 + pulse * 0.3);
        const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        if (material) {
          material.opacity = Math.max(0, 0.3 - pulse * 0.15);
        }
      });
    }
  });

  return (
    <group ref={pulsesRef}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.6, 0.04, 16, 100]} />
          <meshBasicMaterial
            color="#2563eb"
            transparent
            opacity={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function AnimatedGlobe({ className = "" }: { className?: string }) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 3, 5]} intensity={1} color="#ffffff" />
        <pointLight position={[-5, -3, -5]} intensity={0.3} color="#3b82f6" />
        
        <Earth />
        <Atmosphere />
        <ProtectiveShield />
        <ProtectionPulses />
      </Canvas>
    </div>
  );
}
