"use client";

import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

interface DataPoint {
  value: number;
  label: string;
  color: string;
}

interface BarChartProps {
  data: DataPoint[];
}

function Bar3D({ position, height, color, label }: { position: [number, number, number]; height: number; color: string; label: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = React.useState(false);

  useFrame(() => {
    if (meshRef.current) {
      const targetScale = isHovered ? 1.1 : 1;
      meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, 0.1);
      meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, targetScale, 0.1);
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        position={[0, height / 2, 0]}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
      >
        <boxGeometry args={[0.8, height, 0.8]} />
        <meshStandardMaterial
          color={color}
          roughness={0.3}
          metalness={0.7}
          emissive={color}
          emissiveIntensity={isHovered ? 0.3 : 0.1}
        />
      </mesh>
      
      <Text
        position={[0, -0.5, 0]}
        fontSize={0.2}
        color="#f0f0f0"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
      
      {isHovered && (
        <Text
          position={[0, height + 0.5, 0]}
          fontSize={0.3}
          color="#cddcf2"
          anchorX="center"
          anchorY="middle"
        >
          {Math.round(height * 10)}
        </Text>
      )}
    </group>
  );
}

function BarChart3D({ data }: BarChartProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.2) * 0.3;
    }
  });

  const maxValue = Math.max(...data.map(d => d.value));
  const spacing = 1.2;

  return (
    <group ref={groupRef}>
      {data.map((item, index) => {
        const x = (index - (data.length - 1) / 2) * spacing;
        const height = (item.value / maxValue) * 3;
        
        return (
          <Bar3D
            key={index}
            position={[x, 0, 0]}
            height={height}
            color={item.color}
            label={item.label}
          />
        );
      })}
      
      {/* Ground plane */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[data.length * spacing + 1, 3]} />
        <meshStandardMaterial
          color="#020d45"
          transparent
          opacity={0.3}
          roughness={0.8}
        />
      </mesh>
    </group>
  );
}

interface DataVisualization3DProps {
  data: DataPoint[];
  className?: string;
}

export default function DataVisualization3D({ data, className = "" }: DataVisualization3DProps) {
  return (
    <div className={`w-full h-64 ${className}`}>
      <Canvas
        camera={{ position: [0, 2, 5], fov: 60 }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, 5, -10]} intensity={0.5} color="#cddcf2" />
        <spotLight position={[0, 10, 0]} angle={0.5} penumbra={1} intensity={0.8} />
        
        <BarChart3D data={data} />
      </Canvas>
    </div>
  );
}
