"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function WaveParticles() {
  const points = useRef<THREE.Points>(null);
  const count = 5000;

  // Generate particle positions in a grid
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const radius = 15;
      
      positions[i3] = (Math.random() - 0.5) * radius;
      positions[i3 + 1] = (Math.random() - 0.5) * radius;
      positions[i3 + 2] = (Math.random() - 0.5) * radius;
    }
    
    return positions;
  }, [count]);

  // Animate particles in a wave pattern
  useFrame((state) => {
    if (points.current) {
      const time = state.clock.getElapsedTime();
      const positions = points.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const x = positions[i3];
        const z = positions[i3 + 2];
        
        // Wave effect
        positions[i3 + 1] = Math.sin(x * 0.5 + time) * Math.cos(z * 0.5 + time * 0.5) * 2;
      }
      
      points.current.geometry.attributes.position.needsUpdate = true;
      points.current.rotation.y = time * 0.05;
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
        size={0.05}
        color="#2779a7"
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function ParticleWave() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 75 }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <WaveParticles />
      </Canvas>
    </div>
  );
}
