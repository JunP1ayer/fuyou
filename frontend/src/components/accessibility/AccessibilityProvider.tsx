// ♿ アクセシビリティプロバイダー

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useTheme } from '@mui/material';

interface AccessibilitySettings {
  // 視覚的設定
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  
  // 音声設定
  screenReaderEnabled: boolean;
  soundEffects: boolean;
  voiceRate: number; // 0.5 - 2.0
  voicePitch: number; // 0.5 - 2.0
  
  // キーボード設定
  keyboardNavigation: boolean;
  focusVisible: boolean;
  skipLinks: boolean;
  
  // その他
  autoplay: boolean;
  animations: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => void;
  speak: (text: string, interrupt?: boolean) => void;
  announce: (message: string) => void;
  playSound: (soundType: 'success' | 'error' | 'warning' | 'info' | 'click') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  colorBlindMode: 'none',
  screenReaderEnabled: false,
  soundEffects: true,
  voiceRate: 1.0,
  voicePitch: 1.0,
  keyboardNavigation: true,
  focusVisible: true,
  skipLinks: true,
  autoplay: false,
  animations: true,
};

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const theme = useTheme();
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem('accessibility-settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  // 設定更新
  const updateSetting = useCallback(<K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      localStorage.setItem('accessibility-settings', JSON.stringify(newSettings));
      return newSettings;
    });
  }, []);

  // 音声読み上げ
  const speak = useCallback((text: string, interrupt = false) => {
    if (!settings.screenReaderEnabled) return;

    if (interrupt) {
      speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = settings.voiceRate;
    utterance.pitch = settings.voicePitch;
    utterance.lang = 'ja-JP';

    speechSynthesis.speak(utterance);
  }, [settings.screenReaderEnabled, settings.voiceRate, settings.voicePitch]);

  // ライブリージョンでのアナウンス
  const announce = useCallback((message: string) => {
    const liveRegion = document.getElementById('live-region');
    if (liveRegion) {
      liveRegion.textContent = message;
      
      // スクリーンリーダー用に短時間後にクリア
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
    
    // 音声でも読み上げ
    speak(message, true);
  }, [speak]);

  // サウンドエフェクト再生
  const playSound = useCallback((soundType: 'success' | 'error' | 'warning' | 'info' | 'click') => {
    if (!settings.soundEffects) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const frequencies = {
      success: [523.25, 659.25, 783.99], // C-E-G major chord
      error: [146.83, 174.61], // D-F
      warning: [440, 554.37], // A-C#
      info: [523.25], // C
      click: [800], // High click
    };

    const freqs = frequencies[soundType];
    const duration = soundType === 'click' ? 0.1 : 0.3;

    freqs.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime + index * 0.1);
      oscillator.stop(audioContext.currentTime + duration + index * 0.1);
    });
  }, [settings.soundEffects]);

  // CSS変数でアクセシビリティ設定を適用
  useEffect(() => {
    const root = document.documentElement;
    
    // ハイコントラスト
    if (settings.highContrast) {
      root.style.setProperty('--contrast-ratio', '21:1');
      root.style.setProperty('--background-color', '#000000');
      root.style.setProperty('--text-color', '#ffffff');
    } else {
      root.style.removeProperty('--contrast-ratio');
      root.style.removeProperty('--background-color');
      root.style.removeProperty('--text-color');
    }

    // 大きいテキスト
    if (settings.largeText) {
      root.style.setProperty('--font-scale', '1.25');
    } else {
      root.style.removeProperty('--font-scale');
    }

    // アニメーション削減
    if (settings.reducedMotion) {
      root.style.setProperty('--animation-duration', '0.01s');
      root.style.setProperty('--transition-duration', '0.01s');
    } else {
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--transition-duration');
    }

    // 色盲対応フィルター
    const colorBlindFilters = {
      protanopia: 'url(#protanopia)',
      deuteranopia: 'url(#deuteranopia)',
      tritanopia: 'url(#tritanopia)',
      none: 'none',
    };
    
    root.style.setProperty('--color-blind-filter', colorBlindFilters[settings.colorBlindMode]);

    // フォーカス表示
    if (settings.focusVisible) {
      root.style.setProperty('--focus-outline', '3px solid #005fcc');
      root.style.setProperty('--focus-outline-offset', '2px');
    } else {
      root.style.removeProperty('--focus-outline');
      root.style.removeProperty('--focus-outline-offset');
    }
  }, [settings]);

  // ライブリージョン作成
  useEffect(() => {
    const liveRegion = document.createElement('div');
    liveRegion.id = 'live-region';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';
    
    document.body.appendChild(liveRegion);

    return () => {
      document.body.removeChild(liveRegion);
    };
  }, []);

  // メディアクエリ対応
  useEffect(() => {
    const mediaQueries = [
      {
        query: '(prefers-reduced-motion: reduce)',
        setting: 'reducedMotion',
        value: true,
      },
      {
        query: '(prefers-contrast: high)',
        setting: 'highContrast',
        value: true,
      },
    ] as const;

    const listeners: (() => void)[] = [];

    mediaQueries.forEach(({ query, setting, value }) => {
      const mediaQuery = window.matchMedia(query);
      const listener = (e: MediaQueryListEvent) => {
        if (e.matches) {
          updateSetting(setting, value);
        }
      };
      
      mediaQuery.addListener(listener);
      listeners.push(() => mediaQuery.removeListener(listener));
      
      // 初期チェック
      if (mediaQuery.matches) {
        updateSetting(setting, value);
      }
    });

    return () => {
      listeners.forEach(cleanup => cleanup());
    };
  }, [updateSetting]);

  const contextValue: AccessibilityContextType = {
    settings,
    updateSetting,
    speak,
    announce,
    playSound,
  };

  return (
    <>
      <AccessibilityContext.Provider value={contextValue}>
        {children}
      </AccessibilityContext.Provider>
      
      {/* 色盲対応SVGフィルター */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="protanopia">
            <feColorMatrix values="0.567, 0.433, 0, 0, 0 0.558, 0.442, 0, 0, 0 0, 0.242, 0.758, 0, 0 0, 0, 0, 1, 0" />
          </filter>
          <filter id="deuteranopia">
            <feColorMatrix values="0.625, 0.375, 0, 0, 0 0.7, 0.3, 0, 0, 0 0, 0.3, 0.7, 0, 0 0, 0, 0, 1, 0" />
          </filter>
          <filter id="tritanopia">
            <feColorMatrix values="0.95, 0.05, 0, 0, 0 0, 0.433, 0.567, 0, 0 0, 0.475, 0.525, 0, 0 0, 0, 0, 1, 0" />
          </filter>
        </defs>
      </svg>
    </>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};