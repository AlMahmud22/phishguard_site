"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

interface ThreeJSIconProps {
  type: "shield" | "cube" | "chart";
}

function AnimatedShape({ type }: ThreeJSIconProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Create different geometries based on type
  const geometry = useMemo(() => {
    switch (type) {
      case "shield":
        // Shield shape using a custom geometry
        const shieldShape = new THREE.Shape();
        shieldShape.moveTo(0, 1);
        shieldShape.lineTo(0.6, 0.8);
        shieldShape.lineTo(0.8, 0.2);
        shieldShape.lineTo(0.6, -0.6);
        shieldShape.lineTo(0, -1);
        shieldShape.lineTo(-0.6, -0.6);
        shieldShape.lineTo(-0.8, 0.2);
        shieldShape.lineTo(-0.6, 0.8);
        shieldShape.lineTo(0, 1);
        
        return new THREE.ExtrudeGeometry(shieldShape, {
          depth: 0.3,
          bevelEnabled: true,
          bevelThickness: 0.05,
          bevelSize: 0.05,
          bevelSegments: 3,
        });
      
      case "cube":
        // Rounded cube for AI/processing
        return new THREE.BoxGeometry(1.5, 1.5, 1.5, 4, 4, 4);
      
      case "chart":
        // Create bar chart shape
        const chartGroup = new THREE.BufferGeometry();
        const positions: number[] = [];
        const normals: number[] = [];
        const indices: number[] = [];
        
        // Create 3 bars of different heights
        const bars = [
          { x: -0.6, height: 0.5 },
          { x: 0, height: 1.0 },
          { x: 0.6, height: 0.7 },
        ];
        
        bars.forEach((bar, i) => {
          const w = 0.3;
          const h = bar.height;
          const d = 0.3;
          const x = bar.x;
          const y = h / 2 - 0.5;
          
          // Front face
          const baseIndex = positions.length / 3;
          positions.push(
            x - w / 2, y - h / 2, d / 2,
            x + w / 2, y - h / 2, d / 2,
            x + w / 2, y + h / 2, d / 2,
            x - w / 2, y + h / 2, d / 2,
          );
          
          indices.push(
            baseIndex, baseIndex + 1, baseIndex + 2,
            baseIndex, baseIndex + 2, baseIndex + 3
          );
        });
        
        chartGroup.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        chartGroup.setIndex(indices);
        chartGroup.computeVertexNormals();
        
        return chartGroup;
      
      default:
        return new THREE.SphereGeometry(1, 32, 32);
    }
  }, [type]);

  // Continuous rotation and floating animation
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      
      // Smooth rotation
      meshRef.current.rotation.y = time * 0.5;
      meshRef.current.rotation.x = Math.sin(time * 0.3) * 0.2;
      
      // Floating effect
      meshRef.current.position.y = Math.sin(time * 0.8) * 0.15;
      
      // Subtle scale pulsing
      const scale = 1 + Math.sin(time * 1.5) * 0.05;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      {type === "shield" && (
        <meshStandardMaterial
          color="#0ea5e9"
          metalness={0.8}
          roughness={0.2}
          emissive="#06b6d4"
          emissiveIntensity={0.5}
        />
      )}
      {type === "cube" && (
        <MeshDistortMaterial
          color="#a855f7"
          speed={2}
          distort={0.3}
          radius={1}
          metalness={0.7}
          roughness={0.3}
        />
      )}
      {type === "chart" && (
        <meshStandardMaterial
          color="#0ea5e9"
          metalness={0.6}
          roughness={0.4}
          emissive="#06b6d4"
          emissiveIntensity={0.4}
        />
      )}
    </mesh>
  );
}

export default function ThreeJSIcon({ type }: ThreeJSIconProps) {
  return (
    <div className="w-16 h-16 mx-auto">
      <Canvas
        camera={{ position: [0, 0, 4], fov: 35 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <pointLight position={[-5, -5, -5]} intensity={0.8} color="#a855f7" />
        <AnimatedShape type={type} />
      </Canvas>
    </div>
  );
}
