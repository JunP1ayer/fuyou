// ♿ アクセシビリティフック - WCAG 2.1準拠の支援機能

import { useEffect, useState, useRef, useCallback } from 'react';
import { useUnifiedStore } from '../store/unifiedStore';
import { logger, LogCategory } from '../utils/logger';

// アクセシビリティ設定
interface A11yPreferences {
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusVisible: boolean;
}

// キーボードナビゲーション
interface KeyboardNavigation {
  currentFocusIndex: number;
  focusableElements: HTMLElement[];
  trapFocus: boolean;
}

export function useAccessibility() {
  const { ui } = useUnifiedStore();
  const [a11yPrefs, setA11yPrefs] = useState<A11yPreferences>({
    reducedMotion: false,
    highContrast: false,
    largeText: false,
    screenReader: false,
    keyboardNavigation: false,
    focusVisible: true,
  });

  const [keyboardNav, setKeyboardNav] = useState<KeyboardNavigation>({
    currentFocusIndex: -1,
    focusableElements: [],
    trapFocus: false,
  });

  const announcementRef = useRef<HTMLDivElement>(null);

  // システム設定の検出
  useEffect(() => {
    const detectSystemPreferences = () => {
      // Reduced Motion検出
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      // High Contrast検出
      const highContrast = window.matchMedia('(prefers-contrast: high)').matches;
      
      // Large Text検出  
      const largeText = window.matchMedia('(min-resolution: 120dpi)').matches;
      
      // Screen Reader検出（基本的な判定）
      const screenReader = window.navigator.userAgent.includes('NVDA') || 
                          window.navigator.userAgent.includes('JAWS') ||
                          window.speechSynthesis?.getVoices().length > 0;

      setA11yPrefs(prev => ({
        ...prev,
        reducedMotion,
        highContrast,
        largeText,
        screenReader,
      }));

      logger.info(LogCategory.UI, 'Accessibility preferences detected', {
        reducedMotion,
        highContrast,
        largeText,
        screenReader,
      });
    };

    detectSystemPreferences();

    // メディアクエリの変更監視
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    
    motionQuery.addEventListener('change', detectSystemPreferences);
    contrastQuery.addEventListener('change', detectSystemPreferences);

    return () => {
      motionQuery.removeEventListener('change', detectSystemPreferences);
      contrastQuery.removeEventListener('change', detectSystemPreferences);
    };
  }, []);

  // キーボードナビゲーション設定
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Tab キーでキーボードナビゲーションを有効化
      if (event.key === 'Tab') {
        setA11yPrefs(prev => ({ ...prev, keyboardNavigation: true }));
      }

      // Escape キーでフォーカストラップ解除
      if (event.key === 'Escape' && keyboardNav.trapFocus) {
        setKeyboardNav(prev => ({ ...prev, trapFocus: false }));
        document.body.focus();
      }

      // Arrow キーでのナビゲーション
      if (keyboardNav.focusableElements.length > 0 && ['ArrowUp', 'ArrowDown'].includes(event.key)) {
        event.preventDefault();
        
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        const newIndex = Math.max(0, Math.min(
          keyboardNav.focusableElements.length - 1,
          keyboardNav.currentFocusIndex + direction
        ));

        keyboardNav.focusableElements[newIndex]?.focus();
        setKeyboardNav(prev => ({ ...prev, currentFocusIndex: newIndex }));
      }
    };

    // マウス使用でキーボードナビゲーションを無効化
    const handleMouseDown = () => {
      setA11yPrefs(prev => ({ ...prev, keyboardNavigation: false }));
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [keyboardNav]);

  // フォーカス可能要素の更新
  const updateFocusableElements = useCallback((container?: HTMLElement) => {
    const focusableSelector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="checkbox"]:not([disabled])',
      '[role="menuitem"]:not([disabled])',
    ].join(', ');

    const elements = Array.from(
      (container || document).querySelectorAll<HTMLElement>(focusableSelector)
    ).filter(el => {
      // 可視要素のみ
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });

    setKeyboardNav(prev => ({
      ...prev,
      focusableElements: elements,
      currentFocusIndex: elements.indexOf(document.activeElement as HTMLElement),
    }));
  }, []);

  // スクリーンリーダー向けアナウンス
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announcementRef.current) return;

    announcementRef.current.setAttribute('aria-live', priority);
    announcementRef.current.textContent = message;

    // 一定時間後にクリア
    setTimeout(() => {
      if (announcementRef.current) {
        announcementRef.current.textContent = '';
      }
    }, 1000);

    logger.debug(LogCategory.UI, 'Screen reader announcement', { message, priority });
  }, []);

  // フォーカストラップ（モーダルダイアログ用）
  const trapFocus = useCallback((container: HTMLElement) => {
    updateFocusableElements(container);
    setKeyboardNav(prev => ({ ...prev, trapFocus: true }));
    
    // 最初のフォーカス可能要素にフォーカス
    const firstElement = container.querySelector<HTMLElement>(
      'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
    );
    firstElement?.focus();
  }, [updateFocusableElements]);

  // Skip Link機能
  const addSkipLink = useCallback((targetId: string, linkText: string) => {
    const skipLink = document.createElement('a');
    skipLink.href = `#${targetId}`;
    skipLink.textContent = linkText;
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      border-radius: 4px;
      z-index: 10000;
      transition: top 0.3s;
    `;

    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });

    document.body.insertAdjacentElement('afterbegin', skipLink);
  }, []);

  // ARIA属性の自動付与
  const enhanceWithARIA = useCallback((element: HTMLElement, options: {
    role?: string;
    label?: string;
    labelledBy?: string;
    describedBy?: string;
    expanded?: boolean;
    pressed?: boolean;
    selected?: boolean;
    disabled?: boolean;
  }) => {
    if (options.role) element.setAttribute('role', options.role);
    if (options.label) element.setAttribute('aria-label', options.label);
    if (options.labelledBy) element.setAttribute('aria-labelledby', options.labelledBy);
    if (options.describedBy) element.setAttribute('aria-describedby', options.describedBy);
    if (options.expanded !== undefined) element.setAttribute('aria-expanded', String(options.expanded));
    if (options.pressed !== undefined) element.setAttribute('aria-pressed', String(options.pressed));
    if (options.selected !== undefined) element.setAttribute('aria-selected', String(options.selected));
    if (options.disabled !== undefined) element.setAttribute('aria-disabled', String(options.disabled));
  }, []);

  // 色コントラスト検証
  const validateColorContrast = useCallback((foreground: string, background: string): {
    ratio: number;
    wcagAA: boolean;
    wcagAAA: boolean;
  } => {
    // 簡単な色コントラスト計算（実際の実装では専用ライブラリを使用）
    const getLuminance = (color: string) => {
      // RGB値の取得と正規化（簡略版）
      const rgb = color.match(/\d+/g)?.map(n => parseInt(n) / 255) || [0, 0, 0];
      const [r, g, b] = rgb.map(c => 
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      );
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    return {
      ratio,
      wcagAA: ratio >= 4.5,
      wcagAAA: ratio >= 7,
    };
  }, []);

  // CSS変数でアクセシビリティ設定を反映
  useEffect(() => {
    const root = document.documentElement;
    
    if (a11yPrefs.reducedMotion) {
      root.style.setProperty('--animation-duration', '0.01ms');
      root.style.setProperty('--transition-duration', '0.01ms');
    } else {
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--transition-duration');
    }

    if (a11yPrefs.highContrast) {
      root.style.setProperty('--contrast-multiplier', '1.5');
    } else {
      root.style.removeProperty('--contrast-multiplier');
    }

    if (a11yPrefs.largeText) {
      root.style.setProperty('--font-size-multiplier', '1.25');
    } else {
      root.style.removeProperty('--font-size-multiplier');
    }

    if (a11yPrefs.keyboardNavigation) {
      root.classList.add('keyboard-navigation');
    } else {
      root.classList.remove('keyboard-navigation');
    }
  }, [a11yPrefs]);

  return {
    // 状態
    a11yPrefs,
    keyboardNav,
    
    // 設定関数
    setA11yPrefs,
    
    // ユーティリティ関数
    announce,
    trapFocus,
    updateFocusableElements,
    addSkipLink,
    enhanceWithARIA,
    validateColorContrast,
    
    // スクリーンリーダー用の非表示要素
    announcementRef,
  };
}

// アクセシビリティ用のCSS-in-JSスタイル
export const a11yStyles = {
  // スクリーンリーダー専用テキスト
  srOnly: {
    position: 'absolute' as const,
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap' as const,
    border: 0,
  },
  
  // フォーカス表示の強化
  focusVisible: {
    '&:focus-visible': {
      outline: '3px solid #005fcc',
      outlineOffset: '2px',
      borderRadius: '4px',
    },
  },
  
  // 高コントラストモード
  highContrast: {
    '@media (prefers-contrast: high)': {
      border: '1px solid',
      filter: 'contrast(1.5)',
    },
  },
  
  // 大きなタッチターゲット（最小44x44px）
  touchTarget: {
    minHeight: '44px',
    minWidth: '44px',
  },
};