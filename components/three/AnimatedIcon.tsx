"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface AnimatedIconProps {
  type: "target" | "bolt" | "search" | "shield" | "robot" | "clock" | "globe" | "block" | "sparkle" | "download" | "fire";
  size?: number;
}

// Target: Pulsing concentric rings expanding/contracting
function TargetIcon() {
  const ringsRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (!ringsRef.current) return;
    const time = state.clock.getElapsedTime();
    
    ringsRef.current.children.forEach((ring, i) => {
      const offset = i * 0.5;
      const pulse = Math.sin(time * 2 + offset) * 0.5 + 0.5;
      ring.scale.setScalar(0.6 + pulse * 0.4);
      (ring as THREE.Mesh).material = new THREE.MeshStandardMaterial({
        color: "#1e40af",
        emissive: "#1e40af",
        emissiveIntensity: pulse * 0.8,
        transparent: true,
        opacity: 0.7 - pulse * 0.3,
        metalness: 0.8,
        roughness: 0.2,
      });
    });
  });

  return (
    <group ref={ringsRef}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.5 + i * 0.3, 0.05, 16, 32]} />
          <meshStandardMaterial color="#1e40af" />
        </mesh>
      ))}
    </group>
  );
}

// Bolt: Rapid zigzag electric movement
function BoltIcon() {
  const boltRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (!boltRef.current) return;
    const time = state.clock.getElapsedTime();
    
    // Zigzag movement
    boltRef.current.position.x = Math.sin(time * 10) * 0.15;
    boltRef.current.position.y = Math.cos(time * 8) * 0.15;
    
    // Flicker effect
    const flicker = Math.random() * 0.3 + 0.7;
    boltRef.current.children.forEach((segment) => {
      (segment as THREE.Mesh).material = new THREE.MeshStandardMaterial({
        color: "#f97316",
        emissive: "#f97316",
        emissiveIntensity: flicker * 1.2,
        metalness: 0.9,
        roughness: 0.1,
      });
    });
  });

  return (
    <group ref={boltRef}>
      {/* Lightning bolt shape */}
      <mesh position={[0, 0.3, 0]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[0.15, 0.6, 0.15]} />
        <meshStandardMaterial color="#f97316" />
      </mesh>
      <mesh position={[0.15, 0, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <boxGeometry args={[0.15, 0.6, 0.15]} />
        <meshStandardMaterial color="#f97316" />
      </mesh>
      <mesh position={[0, -0.3, 0]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[0.15, 0.6, 0.15]} />
        <meshStandardMaterial color="#f97316" />
      </mesh>
    </group>
  );
}

// Search: Rotating scan pattern like radar
function SearchIcon() {
  const scanRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!scanRef.current || !beamRef.current) return;
    const time = state.clock.getElapsedTime();
    
    // Rotate the entire scanner
    scanRef.current.rotation.z = time * 2;
    
    // Pulse the beam
    const pulse = Math.sin(time * 3) * 0.5 + 0.5;
    beamRef.current.material = new THREE.MeshStandardMaterial({
      color: "#1e40af",
      emissive: "#1e40af",
      emissiveIntensity: pulse * 1.0,
      transparent: true,
      opacity: 0.6,
      metalness: 0.8,
      roughness: 0.2,
    });
  });

  return (
    <group ref={scanRef}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.7, 0.05, 16, 32]} />
        <meshStandardMaterial color="#1e40af" emissive="#1e40af" emissiveIntensity={0.5} />
      </mesh>
      <mesh ref={beamRef} position={[0.35, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.05, 0.7, 0.05]} />
        <meshStandardMaterial color="#1e40af" />
      </mesh>
    </group>
  );
}

// Shield: Protective barrier with wave effect
function ShieldIcon() {
  const shieldRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!shieldRef.current) return;
    const time = state.clock.getElapsedTime();
    
    // Wave ripple effect
    const wave = Math.sin(time * 3) * 0.5 + 0.5;
    shieldRef.current.material = new THREE.MeshStandardMaterial({
      color: "#1e40af",
      emissive: "#1e40af",
      emissiveIntensity: wave * 0.8,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.85,
    });
    
    // Subtle scale pulse
    const scale = 1 + Math.sin(time * 2) * 0.05;
    shieldRef.current.scale.set(scale, scale, 1);
  });

  return (
    <mesh ref={shieldRef}>
      <boxGeometry args={[1.0, 1.3, 0.2]} />
      <meshStandardMaterial color="#1e40af" />
    </mesh>
  );
}

// Robot: Neural network with pulsing nodes
function RobotIcon() {
  const nodesRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  
  const particleCount = 30;
  const particleGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame((state) => {
    if (!nodesRef.current || !particlesRef.current) return;
    const time = state.clock.getElapsedTime();
    
    // Pulse nodes
    nodesRef.current.children.forEach((node, i) => {
      const offset = i * 0.7;
      const pulse = Math.sin(time * 2 + offset) * 0.5 + 0.5;
      node.scale.setScalar(0.8 + pulse * 0.4);
      (node as THREE.Mesh).material = new THREE.MeshStandardMaterial({
        color: "#1e40af",
        emissive: "#1e40af",
        emissiveIntensity: pulse * 1.0,
        metalness: 0.9,
        roughness: 0.1,
      });
    });
    
    // Animate particles
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] += Math.sin(time + i) * 0.002;
      positions[i * 3 + 1] += Math.cos(time + i) * 0.002;
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  const nodePositions = [
    [-0.4, 0.4, 0], [0.4, 0.4, 0],
    [-0.4, -0.4, 0], [0.4, -0.4, 0],
    [0, 0, 0]
  ];

  return (
    <>
      <group ref={nodesRef}>
        {nodePositions.map((pos, i) => (
          <mesh key={i} position={pos as [number, number, number]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="#1e40af" />
          </mesh>
        ))}
      </group>
      <points ref={particlesRef} geometry={particleGeo}>
        <pointsMaterial size={0.03} color="#1e40af" transparent opacity={0.6} />
      </points>
    </>
  );
}

// Clock: Spinning hands motion
function ClockIcon() {
  const hourHandRef = useRef<THREE.Mesh>(null);
  const minuteHandRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!hourHandRef.current || !minuteHandRef.current) return;
    const time = state.clock.getElapsedTime();
    
    // Hour hand (slow)
    hourHandRef.current.rotation.z = -time * 0.5;
    
    // Minute hand (fast)
    minuteHandRef.current.rotation.z = -time * 2;
  });

  return (
    <group>
      {/* Clock face */}
      <mesh rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 0.1, 32]} />
        <meshStandardMaterial color="#1e40af" emissive="#1e40af" emissiveIntensity={0.3} />
      </mesh>
      
      {/* Hour hand */}
      <mesh ref={hourHandRef} position={[0, 0, 0.06]}>
        <boxGeometry args={[0.08, 0.35, 0.05]} />
        <meshStandardMaterial color="#ffffff" emissive="#1e40af" emissiveIntensity={0.5} />
      </mesh>
      
      {/* Minute hand */}
      <mesh ref={minuteHandRef} position={[0, 0, 0.08]}>
        <boxGeometry args={[0.06, 0.5, 0.05]} />
        <meshStandardMaterial color="#ffffff" emissive="#1e40af" emissiveIntensity={0.7} />
      </mesh>
    </group>
  );
}

// Globe: Rotating earth with orbit particles
function GlobeIcon() {
  const globeRef = useRef<THREE.Mesh>(null);
  const orbitRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (!globeRef.current || !orbitRef.current) return;
    const time = state.clock.getElapsedTime();
    
    // Rotate globe
    globeRef.current.rotation.y = time * 0.5;
    
    // Rotate orbit particles
    orbitRef.current.rotation.y = time * 1.5;
    orbitRef.current.rotation.x = Math.PI / 3;
  });

  return (
    <>
      <mesh ref={globeRef}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial 
          color="#1e40af" 
          emissive="#1e40af" 
          emissiveIntensity={0.5}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>
      
      <group ref={orbitRef}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const angle = (i / 6) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(angle) * 0.8, 0, Math.sin(angle) * 0.8]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial 
                color="#1e40af" 
                emissive="#1e40af" 
                emissiveIntensity={1.0}
              />
            </mesh>
          );
        })}
      </group>
    </>
  );
}

// Block: Barrier shake/block motion
function BlockIcon() {
  const blockRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!blockRef.current) return;
    const time = state.clock.getElapsedTime();
    
    // Shake motion (like blocking impact)
    const shake = Math.sin(time * 15) * 0.02;
    blockRef.current.position.x = shake;
    blockRef.current.position.y = Math.abs(Math.cos(time * 15)) * 0.03;
    
    // Flash on "impact"
    const impact = Math.abs(Math.sin(time * 3)) > 0.95 ? 1.5 : 0.4;
    blockRef.current.material = new THREE.MeshStandardMaterial({
      color: "#1e40af",
      emissive: "#1e40af",
      emissiveIntensity: impact,
      metalness: 0.9,
      roughness: 0.1,
    });
  });

  return (
    <mesh ref={blockRef}>
      <boxGeometry args={[1.2, 1.2, 0.3]} />
      <meshStandardMaterial color="#1e40af" />
    </mesh>
  );
}

// Sparkle: Energy burst with expanding particles
function SparkleIcon() {
  const particlesRef = useRef<THREE.Points>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  
  const particleCount = 50;
  const { particleGeo, velocities } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      velocities.push({
        x: Math.sin(phi) * Math.cos(theta),
        y: Math.sin(phi) * Math.sin(theta),
        z: Math.cos(phi),
        life: Math.random()
      });
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return { particleGeo: geo, velocities };
  }, []);

  useFrame((state) => {
    if (!particlesRef.current || !coreRef.current) return;
    const time = state.clock.getElapsedTime();
    
    // Pulsing core
    const pulse = Math.sin(time * 4) * 0.5 + 0.5;
    coreRef.current.scale.setScalar(0.5 + pulse * 0.3);
    coreRef.current.material = new THREE.MeshStandardMaterial({
      color: "#1e40af",
      emissive: "#1e40af",
      emissiveIntensity: pulse * 1.5,
      metalness: 1.0,
      roughness: 0.0,
    });
    
    // Burst particles
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < particleCount; i++) {
      velocities[i].life += 0.02;
      if (velocities[i].life > 1) {
        velocities[i].life = 0;
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;
      } else {
        positions[i * 3] += velocities[i].x * 0.02;
        positions[i * 3 + 1] += velocities[i].y * 0.02;
        positions[i * 3 + 2] += velocities[i].z * 0.02;
      }
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <>
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#1e40af" />
      </mesh>
      <points ref={particlesRef} geometry={particleGeo}>
        <pointsMaterial size={0.05} color="#1e40af" transparent opacity={0.8} />
      </points>
    </>
  );
}

// Download: Downward bouncing motion with trailing particles
function DownloadIcon() {
  const arrowRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  
  const particleCount = 20;
  const particleGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame((state) => {
    if (!arrowRef.current || !particlesRef.current) return;
    const time = state.clock.getElapsedTime();
    
    // Bouncing motion
    const bounce = Math.abs(Math.sin(time * 3)) * 0.5;
    arrowRef.current.position.y = -bounce;
    
    // Glow effect
    const glow = Math.sin(time * 4) * 0.5 + 0.5;
    arrowRef.current.children.forEach((child) => {
      (child as THREE.Mesh).material = new THREE.MeshStandardMaterial({
        color: "#1e40af",
        emissive: "#1e40af",
        emissiveIntensity: glow * 0.8,
        metalness: 0.8,
        roughness: 0.2,
      });
    });
    
    // Trail particles
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.3;
      positions[i * 3 + 1] = bounce + (i / particleCount) * 1.0;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <>
      <group ref={arrowRef}>
        {/* Arrow shaft */}
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[0.15, 0.8, 0.15]} />
          <meshStandardMaterial color="#1e40af" />
        </mesh>
        {/* Arrow head */}
        <mesh position={[0, -0.2, 0]}>
          <coneGeometry args={[0.3, 0.4, 4]} />
          <meshStandardMaterial color="#1e40af" />
        </mesh>
      </group>
      <points ref={particlesRef} geometry={particleGeo}>
        <pointsMaterial size={0.05} color="#1e40af" transparent opacity={0.6} />
      </points>
    </>
  );
}

// Fire: Flickering flame with upward particles
function FireIcon() {
  const flameRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  
  const particleCount = 40;
  const { particleGeo, velocities } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.3;
      positions[i * 3 + 1] = -0.5 + Math.random() * 0.2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
      velocities.push(Math.random() * 0.02 + 0.01);
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return { particleGeo: geo, velocities };
  }, []);

  useFrame((state) => {
    if (!flameRef.current || !particlesRef.current) return;
    const time = state.clock.getElapsedTime();
    
    // Flicker flame
    flameRef.current.children.forEach((flame, i) => {
      const flicker = Math.sin(time * 10 + i) * 0.2 + 0.8;
      flame.scale.set(flicker, flicker * 1.2, flicker);
      
      const intensity = Math.random() * 0.3 + 0.7;
      (flame as THREE.Mesh).material = new THREE.MeshStandardMaterial({
        color: i === 0 ? "#f97316" : "#fbbf24",
        emissive: i === 0 ? "#f97316" : "#fbbf24",
        emissiveIntensity: intensity * 1.5,
        metalness: 0.5,
        roughness: 0.3,
        transparent: true,
        opacity: 0.8,
      });
    });
    
    // Rising particles (embers)
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3 + 1] += velocities[i];
      
      // Reset particle when it reaches top
      if (positions[i * 3 + 1] > 1.0) {
        positions[i * 3] = (Math.random() - 0.5) * 0.3;
        positions[i * 3 + 1] = -0.5;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
      }
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <>
      <group ref={flameRef}>
        {/* Outer flame (orange) */}
        <mesh position={[0, 0, 0]}>
          <coneGeometry args={[0.4, 1.0, 8]} />
          <meshStandardMaterial color="#f97316" />
        </mesh>
        {/* Inner flame (yellow) */}
        <mesh position={[0, 0.1, 0]}>
          <coneGeometry args={[0.25, 0.7, 8]} />
          <meshStandardMaterial color="#fbbf24" />
        </mesh>
      </group>
      <points ref={particlesRef} geometry={particleGeo}>
        <pointsMaterial size={0.04} color="#f97316" transparent opacity={0.7} />
      </points>
    </>
  );
}

function IconMesh({ type }: { type: AnimatedIconProps["type"] }) {
  switch (type) {
    case "target":
      return <TargetIcon />;
    case "bolt":
      return <BoltIcon />;
    case "search":
      return <SearchIcon />;
    case "shield":
      return <ShieldIcon />;
    case "robot":
      return <RobotIcon />;
    case "clock":
      return <ClockIcon />;
    case "globe":
      return <GlobeIcon />;
    case "block":
      return <BlockIcon />;
    case "sparkle":
      return <SparkleIcon />;
    case "download":
      return <DownloadIcon />;
    case "fire":
      return <FireIcon />;
    default:
      return <TargetIcon />;
  }
}

export default function AnimatedIcon({ type, size = 80 }: AnimatedIconProps) {
  return (
    <div style={{ width: size, height: size }} className="mx-auto">
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <pointLight position={[-3, -3, 3]} intensity={0.6} color="#1e40af" />
        <IconMesh type={type} />
      </Canvas>
    </div>
  );
}
