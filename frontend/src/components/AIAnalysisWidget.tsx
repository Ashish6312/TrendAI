"use client";

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  life: number;
}

const AIAnalysisWidget: React.FC<{ 
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
}> = ({ 
  className = "", 
  size = 'md',
  showStatus = true 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const { theme: currentTheme } = useTheme();
  const isDark = currentTheme === 'dark';
  const particlesRef = useRef<Particle[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Size configurations - responsive
  const [sizeConfig, setSizeConfig] = useState({
    sm: { width: 200, height: 150, particles: 20, coreRadius: 25 },
    md: { width: 300, height: 200, particles: 40, coreRadius: 35 },
    lg: { width: 400, height: 300, particles: 60, coreRadius: 45 }
  });
  const [isClient, setIsClient] = useState(false);

  // Ensure client-side rendering to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update size config on mount and resize
  useEffect(() => {
    if (!isClient) return;
    
    const updateSizeConfig = () => {
      const isMobile = window.innerWidth < 768;
      setSizeConfig({
        sm: { 
          width: Math.min(200, window.innerWidth * 0.8), 
          height: Math.min(150, window.innerHeight * 0.2), 
          particles: isMobile ? 15 : 20, 
          coreRadius: isMobile ? 20 : 25 
        },
        md: { 
          width: Math.min(300, window.innerWidth * 0.9), 
          height: Math.min(200, window.innerHeight * 0.3), 
          particles: isMobile ? 25 : 40, 
          coreRadius: isMobile ? 28 : 35 
        },
        lg: { 
          width: Math.min(400, window.innerWidth * 0.95), 
          height: Math.min(300, window.innerHeight * 0.4), 
          particles: isMobile ? 35 : 60, 
          coreRadius: isMobile ? 35 : 45 
        }
      });
    };

    updateSizeConfig();
    window.addEventListener('resize', updateSizeConfig);
    return () => window.removeEventListener('resize', updateSizeConfig);
  }, [isClient]);

  const config = sizeConfig[size];

  // Initialize particles
  useEffect(() => {
    if (!isClient) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      // Recalculate responsive sizes
      const isMobile = window.innerWidth < 768;
      const responsiveConfig = {
        ...config,
        width: Math.min(config.width, window.innerWidth * (size === 'sm' ? 0.8 : size === 'md' ? 0.9 : 0.95)),
        height: Math.min(config.height, window.innerHeight * (size === 'sm' ? 0.2 : size === 'md' ? 0.3 : 0.4)),
        particles: isMobile ? Math.floor(config.particles * 0.6) : config.particles,
        coreRadius: isMobile ? config.coreRadius * 0.8 : config.coreRadius
      };

      // Initialize particles with original bright colors
      particlesRef.current = Array.from({ length: responsiveConfig.particles }, (_, i) => ({
        x: Math.random() * responsiveConfig.width,
        y: Math.random() * responsiveConfig.height,
        vx: (Math.random() - 0.5) * (isMobile ? 0.2 : 0.3),
        vy: (Math.random() - 0.5) * (isMobile ? 0.2 : 0.3),
        size: Math.random() * (isMobile ? 1.2 : 1.5) + (isMobile ? 0.4 : 0.5),
        color: ['#00ffff', '#0080ff', '#8000ff'][Math.floor(Math.random() * 3)], // Original bright colors
        opacity: Math.random() * 0.4 + 0.2, // Original opacity
        life: Math.random() * 100
      }));
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    setIsVisible(true);

    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, [config, size, isClient]);

  // Animation loop
  useEffect(() => {
    if (!isVisible || !isClient) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const animate = () => {
      try {
        const isMobile = window.innerWidth < 768;
        const responsiveWidth = Math.min(config.width, window.innerWidth * (size === 'sm' ? 0.8 : size === 'md' ? 0.9 : 0.95));
        const responsiveHeight = Math.min(config.height, window.innerHeight * (size === 'sm' ? 0.2 : size === 'md' ? 0.3 : 0.4));
        const responsiveCoreRadius = isMobile ? config.coreRadius * 0.8 : config.coreRadius;

        // Safety check for valid dimensions
        if (responsiveWidth <= 0 || responsiveHeight <= 0) {
          animationRef.current = requestAnimationFrame(animate);
          return;
        }

        canvas.width = responsiveWidth;
        canvas.height = responsiveHeight;

        const centerX = responsiveWidth / 2;
        const centerY = responsiveHeight / 2;

      // Clear canvas with theme-aware background
      ctx.fillStyle = isDark ? 'rgba(2, 6, 23, 0.05)' : 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(0, 0, responsiveWidth, responsiveHeight);

      time += 0.016;

      // Draw neural network connections - original style
      if (!isMobile || time % 3 < 1) { // Reduce frequency on mobile
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.08)';
        ctx.lineWidth = isMobile ? 0.3 : 0.5;
        particlesRef.current.forEach((particle, i) => {
          if (i % (isMobile ? 4 : 3) === 0) { // Reduce connections for performance
            particlesRef.current.slice(i + 1, i + (isMobile ? 2 : 3)).forEach(otherParticle => {
              const dx = particle.x - otherParticle.x;
              const dy = particle.y - otherParticle.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < (isMobile ? 40 : 60)) {
                const opacity = (60 - distance) / 60 * (isMobile ? 0.1 : 0.15);
                ctx.strokeStyle = isDark ? `rgba(0, 255, 255, ${opacity})` : `rgba(0, 100, 255, ${opacity})`;
                ctx.beginPath();
                ctx.moveTo(particle.x, particle.y);
                ctx.lineTo(otherParticle.x, otherParticle.y);
                ctx.stroke();
              }
            });
          }
        });
      }

      // Update and draw particles
      particlesRef.current.forEach(particle => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life += 1;

        // Wrap around edges
        if (particle.x < 0) particle.x = responsiveWidth;
        if (particle.x > responsiveWidth) particle.x = 0;
        if (particle.y < 0) particle.y = responsiveHeight;
        if (particle.y > responsiveHeight) particle.y = 0;

        // Animate opacity - original
        particle.opacity = 0.2 + Math.sin(particle.life * 0.02) * 0.15;

        // Draw particle with original bright colors
        const colors = isDark ? {
          '#00ffff': `rgba(0, 255, 255, ${particle.opacity})`,
          '#0080ff': `rgba(0, 128, 255, ${particle.opacity})`,
          '#8000ff': `rgba(128, 0, 255, ${particle.opacity})`
        } : {
          '#00ffff': `rgba(0, 180, 255, ${particle.opacity})`,
          '#0080ff': `rgba(0, 100, 255, ${particle.opacity})`,
          '#8000ff': `rgba(100, 0, 255, ${particle.opacity})`
        };
        
        ctx.fillStyle = colors[particle.color as keyof typeof colors] || `rgba(0, 255, 255, ${particle.opacity})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw flowing energy wave - original style
      const waveRadius = responsiveCoreRadius + (isMobile ? 10 : 15);
      const waveAmplitude = isMobile ? 6 : 8;
      
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
      ctx.lineWidth = isMobile ? 1.5 : 2;
      ctx.beginPath();

      // Draw simplified wave
      const wavePoints = isMobile ? 16 : 32;
      for (let i = 0; i < wavePoints; i++) {
        const angle = (i / wavePoints) * Math.PI * 2;
        const wave1 = Math.sin(time * 2 + angle * 3) * waveAmplitude * 0.5;
        const wave2 = Math.sin(time * 1.5 + angle * 2) * waveAmplitude * 0.3;
        
        const currentRadius = waveRadius + wave1 + wave2;
        const x = centerX + Math.cos(angle) * currentRadius;
        const y = centerY + Math.sin(angle) * currentRadius;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.closePath();
      ctx.stroke();

      // Draw AI core - original style
      const coreRadius = Math.max(5, responsiveCoreRadius + Math.sin(time * 3) * (isMobile ? 3 : 4));
      
      // Outer glow - original
      const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(1, coreRadius * 1.2));
      coreGradient.addColorStop(0, 'rgba(0, 170, 255, 0.6)');
      coreGradient.addColorStop(0.7, 'rgba(0, 255, 255, 0.3)');
      coreGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
      
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius * 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Inner core - original bright colors
      const innerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(1, coreRadius * 0.8));
      innerGradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
      innerGradient.addColorStop(1, 'rgba(0, 128, 255, 0.4)');
      
      ctx.fillStyle = innerGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius * 0.8, 0, Math.PI * 2);
      ctx.fill();

      // AI text - professional styling
      ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.font = `bold ${Math.floor(responsiveCoreRadius * (isMobile ? 0.35 : 0.4))}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('AI', centerX, centerY);

      animationRef.current = requestAnimationFrame(animate);
    } catch (error) {
      console.warn('Canvas widget animation error:', error);
      // Continue animation even if there's an error
      animationRef.current = requestAnimationFrame(animate);
    }
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVisible, config, isClient, currentTheme]);

  // Don't render until client-side to prevent hydration mismatch
  if (!isClient) {
    return (
      <div className={`relative ${className}`} style={{ 
        width: 300, 
        height: 200,
        maxWidth: '100%'
      }}>
        <div className="w-full h-full bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse flex items-center justify-center">
          <div className="text-slate-400 text-xs">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ 
      width: Math.min(config.width, window.innerWidth * (size === 'sm' ? 0.8 : size === 'md' ? 0.9 : 0.95)), 
      height: Math.min(config.height, window.innerHeight * (size === 'sm' ? 0.2 : size === 'md' ? 0.3 : 0.4)),
      maxWidth: '100%'
    }}>
      {/* Status indicators - professional styling */}
      {showStatus && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute top-1 sm:top-2 left-1 sm:left-2 z-10 space-y-0.5 sm:space-y-1"
        >
          <div className={`flex items-center gap-1 text-[8px] sm:text-[10px] font-mono transition-colors ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
            <div className={`w-0.5 sm:w-1 h-0.5 sm:h-1 rounded-full animate-pulse transition-colors ${isDark ? 'bg-blue-500' : 'bg-blue-600'}`} />
            <span className="hidden sm:inline">Analyzing...</span>
            <span className="sm:hidden">AI</span>
          </div>
          <div className={`flex items-center gap-1 text-[8px] sm:text-[10px] font-mono transition-colors ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <div className={`w-0.5 sm:w-1 h-0.5 sm:h-1 rounded-full animate-pulse transition-colors ${isDark ? 'bg-slate-500' : 'bg-slate-500'}`} style={{ animationDelay: '0.5s' }} />
            <span className="hidden sm:inline">Processing...</span>
            <span className="sm:hidden">ON</span>
          </div>
        </motion.div>
      )}
      
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-lg"
        style={{ background: 'transparent' }}
      />
      
      {/* Background gradient overlay - professional */}
      <div className={`absolute inset-0 bg-gradient-radial from-transparent transition-colors duration-500 pointer-events-none rounded-lg ${
        isDark ? 'via-slate-50/2 to-slate-100/5' : 'via-blue-500/5 to-purple-500/5'
      }`} />
    </div>
  );
};

export default AIAnalysisWidget;