// 🤏 高度なジェスチャーコンポーネント

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Box, useTheme } from '@mui/material';
import { motion, PanInfo, useAnimation } from 'framer-motion';
import { triggerHapticFeedback } from '../common/HapticFeedback';

interface GestureState {
  isMultiTouch: boolean;
  isPinching: boolean;
  isRotating: boolean;
  is3DTouch: boolean;
  scale: number;
  rotation: number;
  pressure: number;
  touchCount: number;
}

interface AdvancedGesturesProps {
  children: React.ReactNode;
  onPinch?: (scale: number, center: { x: number; y: number }) => void;
  onRotate?: (rotation: number, center: { x: number; y: number }) => void;
  on3DTouch?: (pressure: number, position: { x: number; y: number }) => void;
  onMultiTouchStart?: (touches: React.Touch[]) => void;
  onMultiTouchEnd?: () => void;
  enablePinchZoom?: boolean;
  enableRotation?: boolean;
  enable3DTouch?: boolean;
  enableHaptics?: boolean;
  minScale?: number;
  maxScale?: number;
  className?: string;
}

export const AdvancedGestures: React.FC<AdvancedGesturesProps> = ({
  children,
  onPinch,
  onRotate,
  on3DTouch,
  onMultiTouchStart,
  onMultiTouchEnd,
  enablePinchZoom = true,
  enableRotation = true,
  enable3DTouch = true,
  enableHaptics = true,
  minScale = 0.5,
  maxScale = 3,
  className,
}) => {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  
  const [gestureState, setGestureState] = useState<GestureState>({
    isMultiTouch: false,
    isPinching: false,
    isRotating: false,
    is3DTouch: false,
    scale: 1,
    rotation: 0,
    pressure: 0,
    touchCount: 0,
  });

  const touchesRef = useRef<React.Touch[]>([]);
  const initialDistanceRef = useRef<number>(0);
  const initialAngleRef = useRef<number>(0);
  const initialScaleRef = useRef<number>(1);
  const initialRotationRef = useRef<number>(0);

  // タッチイベントハンドラー
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    const touches = Array.from(event.touches) as React.Touch[];
    touchesRef.current = touches;
    
    setGestureState(prev => ({
      ...prev,
      touchCount: touches.length,
      isMultiTouch: touches.length > 1,
    }));

    if (touches.length === 2 && (enablePinchZoom || enableRotation)) {
      const touch1 = touches[0];
      const touch2 = touches[1];
      
      // ピンチ初期距離
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      initialDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
      initialScaleRef.current = gestureState.scale;
      
      // 回転初期角度
      initialAngleRef.current = Math.atan2(dy, dx) * (180 / Math.PI);
      initialRotationRef.current = gestureState.rotation;

      if (enableHaptics) {
        triggerHapticFeedback('light');
      }
      
      onMultiTouchStart?.(touches);
    }

    // 3D Touch / Force Touch 検出
    if (enable3DTouch && touches.length === 1) {
      const touch = touches[0];
      const pressure = (touch as any).force || (touch as any).webkitForce || 0;
      
      if (pressure > 0) {
        setGestureState(prev => ({
          ...prev,
          is3DTouch: true,
          pressure,
        }));
        
        on3DTouch?.(pressure, { x: touch.clientX, y: touch.clientY });
        
        if (enableHaptics && pressure > 0.5) {
          triggerHapticFeedback('medium');
        }
      }
    }
  }, [enablePinchZoom, enableRotation, enable3DTouch, enableHaptics, gestureState.scale, gestureState.rotation, onMultiTouchStart, on3DTouch]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    const touches = Array.from(event.touches) as React.Touch[];
    touchesRef.current = touches;

    if (touches.length === 2 && gestureState.isMultiTouch) {
      const touch1 = touches[0];
      const touch2 = touches[1];
      
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;

      // ピンチズーム処理
      if (enablePinchZoom && initialDistanceRef.current > 0) {
        const scaleChange = distance / initialDistanceRef.current;
        const newScale = Math.max(minScale, Math.min(maxScale, initialScaleRef.current * scaleChange));
        
        setGestureState(prev => ({
          ...prev,
          scale: newScale,
          isPinching: true,
        }));

        onPinch?.(newScale, { x: centerX, y: centerY });
      }

      // 回転処理
      if (enableRotation) {
        const rotationChange = angle - initialAngleRef.current;
        const newRotation = initialRotationRef.current + rotationChange;
        
        setGestureState(prev => ({
          ...prev,
          rotation: newRotation,
          isRotating: true,
        }));

        onRotate?.(newRotation, { x: centerX, y: centerY });
      }
    }

    // 3D Touch 圧力変化
    if (enable3DTouch && touches.length === 1) {
      const touch = touches[0];
      const pressure = (touch as any).force || (touch as any).webkitForce || 0;
      
      if (pressure !== gestureState.pressure) {
        setGestureState(prev => ({
          ...prev,
          pressure,
        }));
        
        on3DTouch?.(pressure, { x: touch.clientX, y: touch.clientY });
      }
    }
  }, [gestureState.isMultiTouch, gestureState.pressure, enablePinchZoom, enableRotation, enable3DTouch, minScale, maxScale, onPinch, onRotate, on3DTouch]);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    const touches = Array.from(event.touches) as React.Touch[];
    touchesRef.current = touches;

    if (touches.length < 2) {
      setGestureState(prev => ({
        ...prev,
        isMultiTouch: false,
        isPinching: false,
        isRotating: false,
        touchCount: touches.length,
      }));

      if (gestureState.isMultiTouch) {
        onMultiTouchEnd?.();
        
        if (enableHaptics) {
          triggerHapticFeedback('light');
        }
      }
    }

    if (touches.length === 0) {
      setGestureState(prev => ({
        ...prev,
        is3DTouch: false,
        pressure: 0,
      }));
    }
  }, [gestureState.isMultiTouch, enableHaptics, onMultiTouchEnd]);

  // マウスホイールでのズーム（PC用）
  const handleWheel = useCallback((event: React.WheelEvent) => {
    if (enablePinchZoom && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      
      const delta = -event.deltaY / 1000;
      const newScale = Math.max(minScale, Math.min(maxScale, gestureState.scale + delta));
      
      setGestureState(prev => ({ ...prev, scale: newScale }));
      
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        onPinch?.(newScale, {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
      }
    }
  }, [enablePinchZoom, gestureState.scale, minScale, maxScale, onPinch]);

  return (
    <Box
      ref={containerRef}
      className={className}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      sx={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        touchAction: gestureState.isMultiTouch ? 'none' : 'auto',
        userSelect: gestureState.isMultiTouch ? 'none' : 'auto',
        position: 'relative',
      }}
    >
      <motion.div
        animate={controls}
        style={{
          width: '100%',
          height: '100%',
          scale: gestureState.scale,
          rotate: gestureState.rotation,
          transformOrigin: 'center center',
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
      >
        {children}
      </motion.div>

      {/* ジェスチャー状態表示 */}
      {(gestureState.isPinching || gestureState.isRotating || gestureState.is3DTouch) && (
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            borderRadius: 2,
            p: 1,
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        >
          {gestureState.isPinching && (
            <div>Scale: {gestureState.scale.toFixed(2)}x</div>
          )}
          {gestureState.isRotating && (
            <div>Rotation: {gestureState.rotation.toFixed(1)}°</div>
          )}
          {gestureState.is3DTouch && (
            <div>Pressure: {gestureState.pressure.toFixed(2)}</div>
          )}
          <div>Touches: {gestureState.touchCount}</div>
        </Box>
      )}

      {/* 視覚的フィードバック */}
      {gestureState.isMultiTouch && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle at center, 
              ${theme.palette.primary.main}10 0%,
              transparent 50%
            )`,
            pointerEvents: 'none',
            zIndex: 999,
          }}
        />
      )}
    </Box>
  );
};

// プリセットジェスチャーコンポーネント
export const PinchZoomContainer: React.FC<{
  children: React.ReactNode;
  onScaleChange?: (scale: number) => void;
}> = ({ children, onScaleChange }) => (
  <AdvancedGestures
    enablePinchZoom
    enableRotation={false}
    enable3DTouch={false}
    onPinch={(scale) => onScaleChange?.(scale)}
  >
    {children}
  </AdvancedGestures>
);

export const RotationContainer: React.FC<{
  children: React.ReactNode;
  onRotationChange?: (rotation: number) => void;
}> = ({ children, onRotationChange }) => (
  <AdvancedGestures
    enablePinchZoom={false}
    enableRotation
    enable3DTouch={false}
    onRotate={(rotation) => onRotationChange?.(rotation)}
  >
    {children}
  </AdvancedGestures>
);

export const ForceTouchContainer: React.FC<{
  children: React.ReactNode;
  onPressureChange?: (pressure: number) => void;
}> = ({ children, onPressureChange }) => (
  <AdvancedGestures
    enablePinchZoom={false}
    enableRotation={false}
    enable3DTouch
    on3DTouch={(pressure) => onPressureChange?.(pressure)}
  >
    {children}
  </AdvancedGestures>
);