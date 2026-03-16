"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  glow: number;
  pulse: number;
  connections: number[];
}

interface DataPulse {
  fromNode: number;
  toNode: number;
  progress: number;
  speed: number;
  intensity: number;
}

interface ThemeColors {
  background: string;
  nodeCore: string;
  nodeGlow: string;
  connectionStart: string;
  connectionMid: string;
  connectionEnd: string;
  pulseCore: string;
  pulseGlow: string;
  wireframe: string;
  particles: string;
  overlay: string;
}

const AINetworkBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const nodesRef = useRef<Node[]>([]);
  const pulsesRef = useRef<DataPulse[]>([]);
  const timeRef = useRef(0);

  // Theme detection
  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? (theme === 'system' ? systemTheme : theme) : 'light';
  const isDark = currentTheme === 'dark';

  // Theme-aware colors
  const getThemeColors = (): ThemeColors => {
    if (isDark) {
      return {
        background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e1b4b 100%)',
        nodeCore: '34, 211, 238', // cyan-400
        nodeGlow: '59, 130, 246', // blue-500
        connectionStart: '59, 130, 246', // blue-500
        connectionMid: '147, 51, 234', // purple-600
        connectionEnd: '59, 130, 246', // blue-500
        pulseCore: '255, 255, 255', // white
        pulseGlow: '34, 211, 238', // cyan-400
        wireframe: '59, 130, 246', // blue-500
        particles: '34, 211, 238', // cyan-400
        overlay: 'rgba(2, 6, 23, 0.05)' // Reduced opacity for better content readability
      };
    } else {
      return {
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
        nodeCore: '16, 185, 129', // emerald-500
        nodeGlow: '59, 130, 246', // blue-500
        connectionStart: '16, 185, 129', // emerald-500
        connectionMid: '59, 130, 246', // blue-500
        connectionEnd: '139, 92, 246', // purple-500
        pulseCore: '255, 255, 255', // white
        pulseGlow: '16, 185, 129', // emerald-500
        wireframe: '16, 185, 129', // emerald-500
        particles: '59, 130, 246', // blue-500
        overlay: 'rgba(248, 250, 252, 0.03)' // Reduced opacity for better content readability
      };
    }
  };

  // Initialize nodes
  const initializeNodes = (width: number, height: number) => {
    // Adjust node count based on screen size and device capabilities
    const isMobile = width < 768;
    const baseNodeCount = isMobile ? 30 : 50;
    const nodeCount = Math.min(baseNodeCount, Math.floor((width * height) / (isMobile ? 20000 : 15000)));
    const nodes: Node[] = [];
    
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * (isMobile ? 0.3 : 0.5),
        vy: (Math.random() - 0.5) * (isMobile ? 0.3 : 0.5),
        size: Math.random() * (isMobile ? 2 : 3) + 1,
        glow: Math.random() * 0.5 + 0.5,
        pulse: Math.random() * Math.PI * 2,
        connections: []
      });
    }
    
    // Create connections between nearby nodes
    nodes.forEach((node, i) => {
      const maxConnections = isMobile ? 3 : 4;
      let connectionCount = 0;
      
      nodes.forEach((otherNode, j) => {
        if (i !== j && connectionCount < maxConnections) {
          const distance = Math.sqrt(
            Math.pow(node.x - otherNode.x, 2) + Math.pow(node.y - otherNode.y, 2)
          );
          
          const maxDistance = isMobile ? 120 : 150;
          if (distance < maxDistance && Math.random() > 0.7) {
            node.connections.push(j);
            connectionCount++;
          }
        }
      });
    });
    
    nodesRef.current = nodes;
  };

  // Create data pulses
  const createPulse = () => {
    const nodes = nodesRef.current;
    if (nodes.length === 0) return;
    
    const fromNodeIndex = Math.floor(Math.random() * nodes.length);
    const fromNode = nodes[fromNodeIndex];
    
    if (fromNode.connections.length > 0) {
      const toNodeIndex = fromNode.connections[Math.floor(Math.random() * fromNode.connections.length)];
      
      pulsesRef.current.push({
        fromNode: fromNodeIndex,
        toNode: toNodeIndex,
        progress: 0,
        speed: 0.01 + Math.random() * 0.02,
        intensity: 0.8 + Math.random() * 0.4
      });
    }
  };

  // Animation loop
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas || !mounted) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = dimensions;
    const colors = getThemeColors();
    timeRef.current += 0.016;
    
    // Clear canvas with theme-aware background with smooth transition
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    if (isDark) {
      gradient.addColorStop(0, '#020617');
      gradient.addColorStop(0.5, '#0f172a');
      gradient.addColorStop(1, '#1e1b4b');
    } else {
      gradient.addColorStop(0, '#f8fafc');
      gradient.addColorStop(0.5, '#e2e8f0');
      gradient.addColorStop(1, '#cbd5e1');
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add subtle overlay for better content readability
    ctx.fillStyle = colors.overlay;
    ctx.fillRect(0, 0, width, height);
    
    const nodes = nodesRef.current;
    const pulses = pulsesRef.current;
    
    // Update and draw nodes
    nodes.forEach((node, i) => {
      // Update position
      node.x += node.vx;
      node.y += node.vy;
      
      // Bounce off edges
      if (node.x < 0 || node.x > width) node.vx *= -1;
      if (node.y < 0 || node.y > height) node.vy *= -1;
      
      // Keep nodes in bounds
      node.x = Math.max(0, Math.min(width, node.x));
      node.y = Math.max(0, Math.min(height, node.y));
      
      // Update pulse
      node.pulse += 0.02;
      const pulseIntensity = Math.sin(node.pulse) * 0.3 + 0.7;
      
      // Draw node glow with theme colors (reduced intensity)
      const glowOpacity = isDark ? 0.4 : 0.25; // Reduced from 0.6/0.4
      const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.size * 6); // Reduced from size * 8
      gradient.addColorStop(0, `rgba(${colors.nodeGlow}, ${glowOpacity * pulseIntensity})`);
      gradient.addColorStop(0.5, `rgba(${colors.connectionMid}, ${glowOpacity * 0.3 * pulseIntensity})`); // Reduced from 0.5
      gradient.addColorStop(1, `rgba(${colors.nodeGlow}, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size * 6, 0, Math.PI * 2); // Reduced from size * 8
      ctx.fill();
      
      // Draw node core (reduced opacity)
      const coreOpacity = isDark ? 0.7 : 0.6; // Reduced from 0.9/0.8
      ctx.fillStyle = `rgba(${colors.nodeCore}, ${coreOpacity * pulseIntensity})`;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Draw connections
    nodes.forEach((node, i) => {
      node.connections.forEach(connectionIndex => {
        const connectedNode = nodes[connectionIndex];
        if (!connectedNode) return;
        
        const distance = Math.sqrt(
          Math.pow(node.x - connectedNode.x, 2) + Math.pow(node.y - connectedNode.y, 2)
        );
        
        const baseOpacity = isDark ? 0.2 : 0.15; // Reduced from 0.3/0.2
        const opacity = Math.max(0, 1 - distance / 150) * baseOpacity;
        
        // Create gradient line with theme colors
        const gradient = ctx.createLinearGradient(node.x, node.y, connectedNode.x, connectedNode.y);
        gradient.addColorStop(0, `rgba(${colors.connectionStart}, ${opacity})`);
        gradient.addColorStop(0.5, `rgba(${colors.connectionMid}, ${opacity * 0.8})`);
        gradient.addColorStop(1, `rgba(${colors.connectionEnd}, ${opacity})`);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(connectedNode.x, connectedNode.y);
        ctx.stroke();
      });
    });
    
    // Update and draw data pulses
    pulses.forEach((pulse, index) => {
      const fromNode = nodes[pulse.fromNode];
      const toNode = nodes[pulse.toNode];
      
      if (!fromNode || !toNode) {
        pulses.splice(index, 1);
        return;
      }
      
      pulse.progress += pulse.speed;
      
      if (pulse.progress >= 1) {
        pulses.splice(index, 1);
        return;
      }
      
      // Calculate pulse position
      const x = fromNode.x + (toNode.x - fromNode.x) * pulse.progress;
      const y = fromNode.y + (toNode.y - fromNode.y) * pulse.progress;
      
      // Draw pulse with theme colors (reduced intensity)
      const pulseOpacity = isDark ? pulse.intensity * 0.6 : pulse.intensity * 0.4; // Reduced intensity
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 6); // Smaller radius
      gradient.addColorStop(0, `rgba(${colors.pulseGlow}, ${pulseOpacity})`);
      gradient.addColorStop(0.5, `rgba(${colors.nodeGlow}, ${pulseOpacity * 0.4})`); // Reduced from 0.6
      gradient.addColorStop(1, `rgba(${colors.pulseGlow}, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2); // Smaller size
      ctx.fill();
      
      // Draw pulse core (smaller)
      ctx.fillStyle = `rgba(${colors.pulseCore}, ${pulseOpacity * 0.8})`; // Reduced opacity
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2); // Smaller core
      ctx.fill();
    });
    
    // Draw central neural network sphere
    const centerX = width / 2;
    const centerY = height / 2;
    const sphereRadius = Math.min(width, height) * 0.15;
    
    // Rotating wireframe sphere with theme colors (reduced opacity)
    const rotation = timeRef.current * 0.3; // Slower rotation
    const segments = 12; // Reduced from 16 for less visual noise
    
    const wireframeOpacity = isDark ? 0.1 : 0.08; // Reduced from 0.2/0.15
    ctx.strokeStyle = `rgba(${colors.wireframe}, ${wireframeOpacity})`;
    ctx.lineWidth = 0.5; // Thinner lines
    
    // Draw latitude lines
    for (let i = 1; i < segments; i++) {
      const angle = (i / segments) * Math.PI;
      const radius = Math.sin(angle) * sphereRadius;
      const y = centerY + Math.cos(angle) * sphereRadius;
      
      ctx.beginPath();
      for (let j = 0; j <= segments * 2; j++) {
        const theta = (j / (segments * 2)) * Math.PI * 2 + rotation;
        const x = centerX + Math.cos(theta) * radius;
        
        if (j === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
    
    // Draw longitude lines
    for (let i = 0; i < segments; i++) {
      const theta = (i / segments) * Math.PI * 2 + rotation;
      
      ctx.beginPath();
      for (let j = 0; j <= segments; j++) {
        const angle = (j / segments) * Math.PI;
        const radius = Math.sin(angle) * sphereRadius;
        const x = centerX + Math.cos(theta) * radius;
        const y = centerY + Math.cos(angle) * sphereRadius;
        
        if (j === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
    
    // Add floating particles with theme colors (reduced count and opacity)
    const particleCount = 15; // Reduced from 20
    for (let p = 0; p < particleCount; p++) {
      const particleTime = timeRef.current + p * 0.5;
      const x = (Math.sin(particleTime * 0.2) * width * 0.3) + width / 2; // Slower and smaller movement
      const y = (Math.cos(particleTime * 0.15) * height * 0.25) + height / 2;
      const baseOpacity = isDark ? 0.2 : 0.15; // Reduced from 0.3/0.2
      const opacity = (Math.sin(particleTime * 1.5) + 1) * baseOpacity * 0.5; // Slower pulse, lower opacity
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 3); // Smaller particles
      gradient.addColorStop(0, `rgba(${colors.particles}, ${opacity})`);
      gradient.addColorStop(1, `rgba(${colors.particles}, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2); // Smaller size
      ctx.fill();
    }
    
    // Randomly create new pulses (reduced frequency)
    if (Math.random() < 0.008) { // Reduced from 0.02 for less visual noise
      createPulse();
    }
    
    animationRef.current = requestAnimationFrame(animate);
  };

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
      
      setDimensions({ width, height });
      initializeNodes(width, height);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Start animation with reduced motion support
  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0 && mounted) {
      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      if (!prefersReducedMotion) {
        animate();
      } else {
        // Static version for reduced motion
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const colors = getThemeColors();
            ctx.fillStyle = colors.overlay;
            ctx.fillRect(0, 0, dimensions.width, dimensions.height);
            
            // Draw static nodes only
            nodesRef.current.forEach((node) => {
              const coreOpacity = isDark ? 0.4 : 0.3;
              ctx.fillStyle = `rgba(${colors.nodeCore}, ${coreOpacity})`;
              ctx.beginPath();
              ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
              ctx.fill();
            });
          }
        }
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions, mounted, currentTheme]);

  const colors = getThemeColors();

  return (
    <canvas
      ref={canvasRef}
      className="ai-network-canvas"
    />
  );
};

export default AINetworkBackground;