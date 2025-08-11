// ✨ マイクロインタラクション & アニメーションコンポーネント

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Box, useTheme } from '@mui/material';
import { motion, useAnimation, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { triggerHapticFeedback } from '../common/HapticFeedback';

// サウンドエフェクト管理
class SoundEffectManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  async generateTone(frequency: number, duration: number, type: OscillatorType = 'sine'): Promise<void> {
    if (!this.enabled || !this.audioContext) return;

    try {
      // AudioContextを確実に起動
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = type;
      
      // エンベロープ設定
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.05, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Sound generation failed:', error);
    }
  }

  playClick() {
    this.generateTone(800, 0.1, 'square');
  }

  playSuccess() {
    this.generateTone(523.25, 0.2, 'sine'); // C note
    setTimeout(() => this.generateTone(659.25, 0.2, 'sine'), 100); // E note
    setTimeout(() => this.generateTone(783.99, 0.3, 'sine'), 200); // G note
  }

  playError() {
    this.generateTone(220, 0.15, 'square'); // A note
    setTimeout(() => this.generateTone(196, 0.25, 'square'), 150); // G note
  }

  playHover() {
    this.generateTone(1000, 0.05, 'sine');
  }

  playSwipe() {
    const startFreq = 400;
    const endFreq = 800;
    const duration = 0.3;
    
    if (!this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(startFreq, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(endFreq, this.audioContext.currentTime + duration);
    
    gainNode.gain.setValueAtTime(0.02, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }
}

const soundManager = new SoundEffectManager();

// マイクロインタラクション用コンポーネント
interface MicroInteractionProps {
  children: React.ReactNode;
  type?: 'button' | 'card' | 'list-item' | 'icon' | 'custom';
  soundEffect?: boolean;
  hapticFeedback?: boolean;
  glowEffect?: boolean;
  particleEffect?: boolean;
  morphEffect?: boolean;
  onClick?: () => void;
  onHover?: () => void;
  disabled?: boolean;
  className?: string;
}

export const MicroInteraction: React.FC<MicroInteractionProps> = ({
  children,
  type = 'button',
  soundEffect = true,
  hapticFeedback = true,
  glowEffect = true,
  particleEffect = false,
  morphEffect = false,
  onClick,
  onHover,
  disabled = false,
  className,
}) => {
  const theme = useTheme();
  const [isHovering, setIsHovering] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);

  // アニメーション設定
  const getAnimationConfig = () => {
    switch (type) {
      case 'button':
        return {
          hover: { scale: 1.05, y: -2 },
          tap: { scale: 0.95 },
          initial: { scale: 1, y: 0 },
        };
      case 'card':
        return {
          hover: { scale: 1.02, y: -5 },
          tap: { scale: 0.98 },
          initial: { scale: 1, y: 0 },
        };
      case 'list-item':
        return {
          hover: { x: 5 },
          tap: { x: 0 },
          initial: { x: 0 },
        };
      case 'icon':
        return {
          hover: { scale: 1.2, rotate: 5 },
          tap: { scale: 0.8, rotate: -5 },
          initial: { scale: 1, rotate: 0 },
        };
      default:
        return {
          hover: { scale: 1.05 },
          tap: { scale: 0.95 },
          initial: { scale: 1 },
        };
    }
  };

  const animConfig = getAnimationConfig();

  // イベントハンドラー
  const handleMouseEnter = useCallback(() => {
    if (disabled) return;
    
    setIsHovering(true);
    onHover?.();
    
    if (soundEffect) {
      soundManager.playHover();
    }
    
    if (hapticFeedback) {
      triggerHapticFeedback('light');
    }
  }, [disabled, onHover, soundEffect, hapticFeedback]);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  const handleMouseDown = useCallback(() => {
    if (disabled) return;
    
    setIsPressed(true);
    
    if (hapticFeedback) {
      triggerHapticFeedback('medium');
    }
  }, [disabled, hapticFeedback]);

  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handleClick = useCallback(() => {
    if (disabled) return;
    
    onClick?.();
    
    if (soundEffect) {
      soundManager.playClick();
    }
    
    if (particleEffect) {
      setShowParticles(true);
      setTimeout(() => setShowParticles(false), 1000);
    }
    
    if (morphEffect) {
      controls.start({
        scale: [1, 1.1, 1],
        rotate: [0, 10, 0],
        transition: { duration: 0.3 },
      });
    }
  }, [disabled, onClick, soundEffect, particleEffect, morphEffect, controls]);

  // グロー効果
  const glowVariants = {
    hover: {
      boxShadow: `0 0 20px ${theme.palette.primary.main}40`,
      transition: { duration: 0.3 },
    },
    initial: {
      boxShadow: 'none',
    },
  };

  return (
    <Box
      ref={containerRef}
      className={className}
      sx={{
        position: 'relative',
        display: 'inline-block',
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
      }}
    >
      <motion.div
        animate={controls}
        variants={glowEffect ? glowVariants : undefined}
        whileHover={disabled ? {} : animConfig.hover}
        whileTap={disabled ? {} : animConfig.tap}
        initial={animConfig.initial}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        style={{
          opacity: disabled ? 0.6 : 1,
          transition: 'opacity 0.2s ease',
        }}
      >
        {children}
      </motion.div>

      {/* パーティクル効果 */}
      {particleEffect && showParticles && (
        <ParticleEffect containerRef={containerRef} />
      )}

      {/* リップル効果 */}
      {isPressed && (
        <RippleEffect 
          containerRef={containerRef}
          color={theme.palette.primary.main}
        />
      )}
    </Box>
  );
};

// パーティクル効果コンポーネント
const ParticleEffect: React.FC<{ containerRef: React.RefObject<HTMLDivElement> }> = ({ 
  containerRef 
}) => {
  const particles = Array.from({ length: 8 }, (_, i) => i);

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {particles.map((particle) => (
        <motion.div
          key={particle}
          initial={{
            x: '50%',
            y: '50%',
            scale: 0,
            opacity: 1,
          }}
          animate={{
            x: `${50 + (Math.random() - 0.5) * 200}%`,
            y: `${50 + (Math.random() - 0.5) * 200}%`,
            scale: [0, 1, 0],
            opacity: [1, 0.8, 0],
          }}
          transition={{
            duration: 0.8,
            delay: particle * 0.05,
            ease: 'easeOut',
          }}
          style={{
            position: 'absolute',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: `hsl(${Math.random() * 360}, 70%, 60%)`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </Box>
  );
};

// リップル効果コンポーネント
const RippleEffect: React.FC<{ 
  containerRef: React.RefObject<HTMLDivElement>;
  color: string;
}> = ({ containerRef, color }) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0.5 }}
      animate={{ scale: 2, opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }}
    />
  );
};

// フローティングアニメーション
export const FloatingAnimation: React.FC<{
  children: React.ReactNode;
  duration?: number;
  distance?: number;
}> = ({ children, duration = 3, distance = 10 }) => {
  return (
    <motion.div
      animate={{
        y: [-distance, distance, -distance],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
};

// パルス効果
export const PulseEffect: React.FC<{
  children: React.ReactNode;
  scale?: number[];
  duration?: number;
}> = ({ children, scale = [1, 1.05, 1], duration = 2 }) => {
  return (
    <motion.div
      animate={{ scale }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
};

// 磁気効果（マウスに追従）
export const MagneticEffect: React.FC<{
  children: React.ReactNode;
  strength?: number;
}> = ({ children, strength = 0.3 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distanceX = (event.clientX - centerX) * strength;
    const distanceY = (event.clientY - centerY) * strength;

    x.set(distanceX);
    y.set(distanceY);
  }, [x, y, strength]);

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {children}
    </motion.div>
  );
};

// 視差効果
export const ParallaxEffect: React.FC<{
  children: React.ReactNode;
  speed?: number;
}> = ({ children, speed = 0.5 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const scrolled = window.scrollY;
      const rate = scrolled * -speed;

      y.set(rate);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [y, speed]);

  return (
    <motion.div ref={ref} style={{ y }}>
      {children}
    </motion.div>
  );
};

// サウンドエフェクト制御フック
export const useSoundEffects = () => {
  const playClick = useCallback(() => soundManager.playClick(), []);
  const playSuccess = useCallback(() => soundManager.playSuccess(), []);
  const playError = useCallback(() => soundManager.playError(), []);
  const playHover = useCallback(() => soundManager.playHover(), []);
  const playSwipe = useCallback(() => soundManager.playSwipe(), []);
  const setEnabled = useCallback((enabled: boolean) => soundManager.setEnabled(enabled), []);

  return {
    playClick,
    playSuccess,
    playError,
    playHover,
    playSwipe,
    setEnabled,
  };
};