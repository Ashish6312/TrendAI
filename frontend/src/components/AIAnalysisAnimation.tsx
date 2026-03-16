"use client";

import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sphere, Text } from '@react-three/drei';
import { motion } from 'framer-motion';

// Vertex shader for the flowing energy wave
const vertexShader = `
  uniform float uTime;
  uniform float uIntensity;
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  
  void main() {
    vUv = uv;
    vNormal = normal;
    
    vec3 pos = position;
    
    // Create flowing wave effect
    float wave1 = sin(pos.x * 2.0 + uTime * 0.8) * 0.1;
    float wave2 = sin(pos.y * 3.0 + uTime * 1.2) * 0.08;
    float wave3 = sin(pos.z * 1.5 + uTime * 0.6) * 0.12;
    
    // Combine waves for organic movement
    pos += normal * (wave1 + wave2 + wave3) * uIntensity;
    
    vPosition = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// Fragment shader for the glowing energy effect
const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  
  void main() {
    // Create flowing color gradients
    float colorMix1 = sin(vPosition.x * 2.0 + uTime * 0.5) * 0.5 + 0.5;
    float colorMix2 = sin(vPosition.y * 1.5 + uTime * 0.8) * 0.5 + 0.5;
    float colorMix3 = sin(vPosition.z * 3.0 + uTime * 1.2) * 0.5 + 0.5;
    
    // Mix colors based on position and time
    vec3 color = mix(uColor1, uColor2, colorMix1);
    color = mix(color, uColor3, colorMix2 * colorMix3);
    
    // Add fresnel effect for glow
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    float fresnel = 1.0 - dot(vNormal, viewDirection);
    fresnel = pow(fresnel, 2.0);
    
    // Enhance glow at edges
    float alpha = fresnel * uOpacity;
    alpha += (1.0 - fresnel) * 0.3 * uOpacity;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

// Particle system for background neural network effect
const ParticleField: React.FC = () => {
  const meshRef = useRef<THREE.Points>(null);
  const particleCount = 200;
  
  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      // Random positions in a sphere
      const radius = Math.random() * 8 + 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      // Random colors (blue, cyan, purple spectrum)
      const colorChoice = Math.random();
      if (colorChoice < 0.33) {
        colors[i * 3] = 0.2; // R
        colors[i * 3 + 1] = 0.6; // G
        colors[i * 3 + 2] = 1.0; // B (blue)
      } else if (colorChoice < 0.66) {
        colors[i * 3] = 0.0; // R
        colors[i * 3 + 1] = 0.8; // G
        colors[i * 3 + 2] = 1.0; // B (cyan)
      } else {
        colors[i * 3] = 0.6; // R
        colors[i * 3 + 1] = 0.2; // G
        colors[i * 3 + 2] = 1.0; // B (purple)
      }
      
      sizes[i] = Math.random() * 2 + 1;
    }
    
    return { positions, colors, sizes };
  }, []);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001;
      meshRef.current.rotation.x += 0.0005;
      
      // Animate particle opacity
      const material = meshRef.current.material as THREE.PointsMaterial;
      material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });
  
  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particles.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[particles.colors, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[particles.sizes, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
};

// Flowing energy wave around AI core
const EnergyWave: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uIntensity: { value: 0.3 },
    uColor1: { value: new THREE.Color(0x00ffff) }, // Cyan
    uColor2: { value: new THREE.Color(0x0080ff) }, // Blue
    uColor3: { value: new THREE.Color(0x8000ff) }, // Purple
    uOpacity: { value: 0.6 }
  }), []);
  
  useFrame((state) => {
    if (meshRef.current) {
      uniforms.uTime.value = state.clock.elapsedTime;
      meshRef.current.rotation.y += 0.002;
      meshRef.current.rotation.z += 0.001;
      
      // Pulse intensity
      uniforms.uIntensity.value = 0.3 + Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
    }
  });
  
  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[2.5, 4]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};

// AI Core with pulsing glow
const AICore: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current && glowRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      meshRef.current.scale.setScalar(pulse);
      glowRef.current.scale.setScalar(pulse * 1.2);
      
      // Rotate slowly
      meshRef.current.rotation.y += 0.01;
      glowRef.current.rotation.y -= 0.005;
    }
  });
  
  return (
    <group>
      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshBasicMaterial
          color={0x00ffff}
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Core sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial
          color={0x00aaff}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* AI Text */}
      <Text
        position={[0, 0, 0.6]}
        fontSize={0.3}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-bold.woff"
      >
        AI
      </Text>
    </group>
  );
};

// Neural network connecting lines
const NeuralConnections: React.FC = () => {
  const linesRef = useRef<THREE.Group>(null);
  
  const connections = useMemo(() => {
    const lines = [];
    const connectionCount = 50;
    
    for (let i = 0; i < connectionCount; i++) {
      const start = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );
      const end = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );
      
      lines.push({ start, end });
    }
    
    return lines;
  }, []);
  
  useFrame((state) => {
    if (linesRef.current) {
      linesRef.current.rotation.y += 0.0005;
      
      // Animate line opacity
      linesRef.current.children.forEach((line, index) => {
        const material = (line as THREE.Line).material as THREE.LineBasicMaterial;
        material.opacity = 0.1 + Math.sin(state.clock.elapsedTime * 0.5 + index * 0.1) * 0.05;
      });
    }
  });
  
  return (
    <group ref={linesRef}>
      {connections.map((connection, index) => (
        <line key={index}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[
                new Float32Array([
                  connection.start.x,
                  connection.start.y,
                  connection.start.z,
                  connection.end.x,
                  connection.end.y,
                  connection.end.z,
                ]),
                3,
              ]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={0x00ffff}
            transparent
            opacity={0.1}
            blending={THREE.AdditiveBlending}
          />
        </line>
      ))}
    </group>
  );
};

// Main scene component
const AIScene: React.FC = () => {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.position.set(0, 0, 8);
  }, [camera]);
  
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color={0x00ffff} />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color={0x8000ff} />
      
      <AICore />
      <EnergyWave />
      <ParticleField />
      <NeuralConnections />
    </>
  );
};

// Main component
const AIAnalysisAnimation: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Status indicators */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute top-4 left-4 z-10 space-y-2"
      >
        <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
          Analyzing Market Data...
        </div>
        <div className="flex items-center gap-2 text-xs text-blue-400 font-mono">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
          Processing Business Ideas...
        </div>
        <div className="flex items-center gap-2 text-xs text-purple-400 font-mono">
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          Generating Recommendations...
        </div>
      </motion.div>
      
      {/* Performance metrics */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="absolute top-4 right-4 z-10 text-right space-y-1"
      >
        <div className="text-xs text-cyan-300 font-mono">Neural Efficiency: 98.7%</div>
        <div className="text-xs text-blue-300 font-mono">Data Points: 2.4M</div>
        <div className="text-xs text-purple-300 font-mono">Confidence: 94.2%</div>
      </motion.div>
      
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        style={{ background: 'transparent' }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance"
        }}
      >
        <AIScene />
      </Canvas>
      
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-blue-900/5 to-purple-900/10 pointer-events-none" />
    </div>
  );
};

export default AIAnalysisAnimation;