// 🖼️ 最適化画像コンポーネント

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, CircularProgress, alpha, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  placeholder?: string;
  blurhash?: string;
  webpSrc?: string;
  avifSrc?: string;
  quality?: number;
  loading?: 'lazy' | 'eager';
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down';
  borderRadius?: number;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width = '100%',
  height = 'auto',
  placeholder,
  blurhash,
  webpSrc,
  avifSrc,
  quality = 75,
  loading = 'lazy',
  objectFit = 'cover',
  borderRadius = 0,
  onLoad,
  onError,
  className,
}) => {
  const theme = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(loading === 'eager');
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver>();

  // Intersection Observer セットアップ
  useEffect(() => {
    if (loading === 'lazy') {
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.unobserve(entry.target);
          }
        },
        {
          rootMargin: '50px',
          threshold: 0.1,
        }
      );

      const currentImg = imgRef.current;
      if (currentImg) {
        observerRef.current.observe(currentImg);
      }

      return () => {
        if (currentImg && observerRef.current) {
          observerRef.current.unobserve(currentImg);
        }
      };
    }
    return undefined;
  }, [loading]);

  // 画像読み込み完了ハンドラー
  const handleImageLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  // 画像読み込みエラーハンドラー
  const handleImageError = useCallback(() => {
    setIsError(true);
    onError?.(new Error('Failed to load image'));
  }, [onError]);

  // WebP/AVIF対応の最適な画像URLを生成
  const getOptimizedSrc = useCallback(() => {
    if (!isInView) return '';

    // AVIF対応チェック（最新の圧縮形式）
    if (avifSrc && 'avif' in new Image()) {
      return avifSrc;
    }

    // WebP対応チェック
    if (webpSrc && 'webp' in new Image()) {
      return webpSrc;
    }

    // クエリパラメータで品質を調整
    const url = new URL(src, window.location.origin);
    url.searchParams.set('q', quality.toString());
    
    return url.toString();
  }, [src, webpSrc, avifSrc, quality, isInView]);

  // プレースホルダー生成
  const generatePlaceholder = useCallback(() => {
    if (placeholder) {
      return placeholder;
    }

    // 低品質版プレースホルダーを生成
    const url = new URL(src, window.location.origin);
    url.searchParams.set('q', '10');
    url.searchParams.set('blur', '10');
    url.searchParams.set('w', '50');
    return url.toString();
  }, [src, placeholder]);

  return (
    <Box
      className={className}
      sx={{
        position: 'relative',
        width,
        height,
        borderRadius: `${borderRadius}px`,
        overflow: 'hidden',
        backgroundColor: alpha(theme.palette.grey[300], 0.1),
      }}
    >
      {/* プレースホルダー画像 */}
      <AnimatePresence>
        {!isLoaded && !isError && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1,
            }}
          >
            {blurhash ? (
              // BlurHashプレースホルダー（カスタム実装が必要）
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CircularProgress size={24} />
              </Box>
            ) : (
              // 低品質プレースホルダー
              <img
                src={generatePlaceholder()}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit,
                  filter: 'blur(5px)',
                  transform: 'scale(1.1)',
                }}
              />
            )}

            {/* ローディングインジケーター */}
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 2,
              }}
            >
              <CircularProgress size={32} />
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* メイン画像 */}
      <AnimatePresence>
        {isInView && (
          <motion.img
            ref={imgRef}
            src={getOptimizedSrc()}
            alt={alt}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ 
              opacity: isLoaded ? 1 : 0,
              scale: isLoaded ? 1 : 1.05,
            }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit,
              zIndex: isLoaded ? 2 : 0,
            }}
          />
        )}
      </AnimatePresence>

      {/* エラー表示 */}
      <AnimatePresence>
        {isError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: alpha(theme.palette.grey[300], 0.2),
              zIndex: 3,
            }}
          >
            <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
              📷
              <Box component="div" sx={{ fontSize: '0.8rem', mt: 1 }}>
                画像を読み込めませんでした
              </Box>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

// プリセット画像コンポーネント
export const AvatarImage: React.FC<Omit<OptimizedImageProps, 'objectFit' | 'borderRadius'> & { size?: number }> = ({
  size = 40,
  ...props
}) => (
  <OptimizedImage
    {...props}
    width={size}
    height={size}
    objectFit="cover"
    borderRadius={size / 2}
  />
);

export const ThumbnailImage: React.FC<Omit<OptimizedImageProps, 'objectFit' | 'borderRadius'>> = (props) => (
  <OptimizedImage
    {...props}
    objectFit="cover"
    borderRadius={8}
    quality={60}
  />
);

export const HeroImage: React.FC<Omit<OptimizedImageProps, 'loading' | 'quality'>> = (props) => (
  <OptimizedImage
    {...props}
    loading="eager"
    quality={85}
  />
);