// 📢 スクリーンリーダー対応アナウンスコンポーネント

import React, { useEffect, useRef, useCallback } from 'react';
import { Box } from '@mui/material';
import { useAccessibility } from './AccessibilityProvider';

interface AnnouncementOptions {
  priority: 'polite' | 'assertive';
  interrupt?: boolean;
  delay?: number;
}

interface ScreenReaderAnnouncementsProps {
  children: React.ReactNode;
}

export const ScreenReaderAnnouncements: React.FC<ScreenReaderAnnouncementsProps> = ({ children }) => {
  const { settings, speak } = useAccessibility();
  const politeRegionRef = useRef<HTMLDivElement>(null);
  const assertiveRegionRef = useRef<HTMLDivElement>(null);
  const announcementQueueRef = useRef<Array<{
    message: string;
    options: AnnouncementOptions;
    timestamp: number;
  }>>([]);

  // グローバルアナウンス関数を作成
  const announceGlobally = useCallback((message: string, options: AnnouncementOptions = { priority: 'polite' }) => {
    const timestamp = Date.now();
    announcementQueueRef.current.push({ message, options, timestamp });
    processAnnouncementQueue();
  }, []);

  // アナウンスキューの処理
  const processAnnouncementQueue = useCallback(() => {
    const queue = announcementQueueRef.current;
    if (queue.length === 0) return;

    const announcement = queue.shift();
    if (!announcement) return;

    const { message, options } = announcement;
    const targetRegion = options.priority === 'assertive' 
      ? assertiveRegionRef.current 
      : politeRegionRef.current;

    if (targetRegion) {
      // 既存のメッセージをクリア
      if (options.interrupt) {
        targetRegion.textContent = '';
      }

      // 新しいメッセージを設定
      const delay = options.delay || 100;
      setTimeout(() => {
        if (targetRegion) {
          targetRegion.textContent = message;
          
          // 音声読み上げも実行
          speak(message, options.interrupt);
          
          // 短時間後にクリア
          setTimeout(() => {
            if (targetRegion && targetRegion.textContent === message) {
              targetRegion.textContent = '';
            }
          }, 2000);
        }
        
        // 次のアナウンスを処理
        if (queue.length > 0) {
          setTimeout(processAnnouncementQueue, 500);
        }
      }, delay);
    }
  }, [speak]);

  // ページ読み込み完了のアナウンス
  useEffect(() => {
    const announcePageLoad = () => {
      const title = document.title;
      const mainHeading = document.querySelector('h1')?.textContent;
      const message = mainHeading 
        ? `${title}ページが読み込まれました. メイン見出し: ${mainHeading}`
        : `${title}ページが読み込まれました`;
      
      announceGlobally(message, { priority: 'polite', delay: 1000 });
    };

    if (document.readyState === 'complete') {
      announcePageLoad();
      return undefined;
    } else {
      window.addEventListener('load', announcePageLoad);
      return () => window.removeEventListener('load', announcePageLoad);
    }
  }, [announceGlobally]);

  // フォーカス変更のアナウンス
  useEffect(() => {
    const announceFocusChange = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (!target || !settings.screenReaderEnabled) return;

      const role = target.getAttribute('role');
      const ariaLabel = target.getAttribute('aria-label');
      const ariaLabelledBy = target.getAttribute('aria-labelledby');
      const title = target.getAttribute('title');
      const placeholder = target.getAttribute('placeholder');
      
      let label = '';
      
      // ラベルを取得
      if (ariaLabel) {
        label = ariaLabel;
      } else if (ariaLabelledBy) {
        const labelElement = document.getElementById(ariaLabelledBy);
        label = labelElement?.textContent || '';
      } else if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        const associatedLabel = document.querySelector(`label[for="${target.id}"]`);
        label = associatedLabel?.textContent || placeholder || '';
      } else {
        label = target.textContent?.trim() || title || '';
      }

      // 要素タイプを判定
      let elementType = '';
      if (role) {
        elementType = role;
      } else {
        switch (target.tagName.toLowerCase()) {
          case 'button':
            elementType = 'ボタン';
            break;
          case 'a':
            elementType = 'リンク';
            break;
          case 'input':
            const inputType = target.getAttribute('type') || 'text';
            elementType = `${inputType}入力欄`;
            break;
          case 'select':
            elementType = '選択ボックス';
            break;
          case 'textarea':
            elementType = 'テキストエリア';
            break;
          case 'h1':
          case 'h2':
          case 'h3':
          case 'h4':
          case 'h5':
          case 'h6':
            elementType = `レベル${target.tagName.charAt(1)}見出し`;
            break;
          default:
            elementType = target.tagName.toLowerCase();
        }
      }

      // 状態情報を追加
      const states: string[] = [];
      if (target.hasAttribute('disabled')) states.push('無効');
      if (target.hasAttribute('required')) states.push('必須');
      if (target.getAttribute('aria-expanded') === 'true') states.push('展開済み');
      if (target.getAttribute('aria-expanded') === 'false') states.push('折りたたみ済み');
      if (target.getAttribute('aria-checked') === 'true') states.push('チェック済み');
      if (target.getAttribute('aria-selected') === 'true') states.push('選択済み');

      const message = [elementType, label, ...states].filter(Boolean).join(' ');
      if (message) {
        announceGlobally(message, { priority: 'polite', delay: 200 });
      }
    };

    document.addEventListener('focusin', announceFocusChange);
    return () => document.removeEventListener('focusin', announceFocusChange);
  }, [settings.screenReaderEnabled, announceGlobally]);

  // エラーのアナウンス
  useEffect(() => {
    const announceError = (event: ErrorEvent) => {
      announceGlobally(
        `エラーが発生しました: ${event.message}`, 
        { priority: 'assertive', interrupt: true }
      );
    };

    window.addEventListener('error', announceError);
    return () => window.removeEventListener('error', announceError);
  }, [announceGlobally]);

  // フォーム検証エラーのアナウンス
  useEffect(() => {
    const announceValidationError = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target && !target.validity.valid) {
        const fieldName = target.getAttribute('aria-label') || 
                         target.getAttribute('placeholder') || 
                         target.name || 
                         '入力欄';
        
        let message = `${fieldName}に入力エラーがあります。`;
        
        if (target.validity.valueMissing) {
          message += 'この項目は必須です。';
        } else if (target.validity.typeMismatch) {
          message += '正しい形式で入力してください。';
        } else if (target.validity.patternMismatch) {
          message += '指定された形式と一致しません。';
        } else if (target.validity.tooShort || target.validity.tooLong) {
          message += '文字数を確認してください。';
        }

        announceGlobally(message, { priority: 'assertive', interrupt: true });
      }
    };

    document.addEventListener('invalid', announceValidationError, true);
    return () => document.removeEventListener('invalid', announceValidationError, true);
  }, [announceGlobally]);

  // グローバルに利用可能にする
  useEffect(() => {
    (window as any).announceForScreenReader = announceGlobally;
    return () => {
      delete (window as any).announceForScreenReader;
    };
  }, [announceGlobally]);

  return (
    <>
      {children}
      
      {/* ARIA Live Regions */}
      <div
        ref={politeRegionRef}
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
      />
      
      <div
        ref={assertiveRegionRef}
        aria-live="assertive"
        aria-atomic="true"
        style={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
      />

      {/* 緊急アナウンス用の追加リージョン */}
      <div
        role="alert"
        aria-atomic="true"
        style={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
      />
    </>
  );
};

// ヘルパー関数
export const announceToScreenReader = (
  message: string, 
  options: AnnouncementOptions = { priority: 'polite' }
) => {
  const announcer = (window as any).announceForScreenReader;
  if (announcer) {
    announcer(message, options);
  } else {
    console.log('Screen reader announcement:', message);
  }
};

// よく使用されるアナウンス用のヘルパー
export const announceSuccess = (message: string) => {
  announceToScreenReader(`成功: ${message}`, { priority: 'polite' });
};

export const announceError = (message: string) => {
  announceToScreenReader(`エラー: ${message}`, { priority: 'assertive', interrupt: true });
};

export const announceWarning = (message: string) => {
  announceToScreenReader(`警告: ${message}`, { priority: 'assertive' });
};

export const announceInfo = (message: string) => {
  announceToScreenReader(`情報: ${message}`, { priority: 'polite' });
};

export const announceProgress = (current: number, total: number, description?: string) => {
  const percentage = Math.round((current / total) * 100);
  const message = description 
    ? `${description}: ${percentage}パーセント完了`
    : `進捗: ${percentage}パーセント完了`;
  announceToScreenReader(message, { priority: 'polite' });
};