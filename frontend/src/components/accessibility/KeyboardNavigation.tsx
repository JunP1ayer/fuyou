// ⌨️ キーボードナビゲーションコンポーネント

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Box, Portal } from '@mui/material';
import { useAccessibility } from './AccessibilityProvider';

interface KeyboardNavigationProps {
  children: React.ReactNode;
}

interface FocusableElement {
  element: HTMLElement;
  tabIndex: number;
  rect: DOMRect;
}

export const KeyboardNavigation: React.FC<KeyboardNavigationProps> = ({ children }) => {
  const { settings, announce, playSound } = useAccessibility();
  const containerRef = useRef<HTMLDivElement>(null);
  const [skipLinksVisible, setSkipLinksVisible] = useState(false);
  const [focusableElements, setFocusableElements] = useState<FocusableElement[]>([]);
  const currentFocusIndex = useRef<number>(-1);

  // フォーカス可能な要素を取得
  const getFocusableElements = useCallback((): FocusableElement[] => {
    if (!containerRef.current) return [];

    const selectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="link"]:not([disabled])',
      '[contenteditable="true"]',
    ].join(', ');

    const elements = Array.from(containerRef.current.querySelectorAll(selectors)) as HTMLElement[];
    
    return elements
      .filter(element => {
        const style = window.getComputedStyle(element);
        return (
          style.visibility !== 'hidden' &&
          style.display !== 'none' &&
          element.offsetWidth > 0 &&
          element.offsetHeight > 0
        );
      })
      .map(element => ({
        element,
        tabIndex: parseInt(element.getAttribute('tabindex') || '0'),
        rect: element.getBoundingClientRect(),
      }))
      .sort((a, b) => {
        // tabindex順でソート
        if (a.tabIndex !== b.tabIndex) {
          return a.tabIndex - b.tabIndex;
        }
        // 位置順でソート（上から下、左から右）
        if (Math.abs(a.rect.top - b.rect.top) > 5) {
          return a.rect.top - b.rect.top;
        }
        return a.rect.left - b.rect.left;
      });
  }, []);

  // フォーカス可能要素リストの更新
  const updateFocusableElements = useCallback(() => {
    const elements = getFocusableElements();
    setFocusableElements(elements);
    
    // 現在のフォーカス位置を更新
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement) {
      const index = elements.findIndex(({ element }) => element === activeElement);
      currentFocusIndex.current = index;
    }
  }, [getFocusableElements]);

  // キーボードイベントハンドラー
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!settings.keyboardNavigation) return;

    const { key, ctrlKey, altKey, shiftKey } = event;

    // スキップリンク表示
    if (key === 'Tab' && !shiftKey && !ctrlKey && !altKey) {
      if (currentFocusIndex.current === -1) {
        setSkipLinksVisible(true);
      }
    }

    // カスタムナビゲーション
    if (ctrlKey && altKey) {
      event.preventDefault();
      
      switch (key) {
        case 'ArrowUp':
          // 前の要素にフォーカス
          navigateToElement('prev');
          break;
        case 'ArrowDown':
          // 次の要素にフォーカス
          navigateToElement('next');
          break;
        case 'Home':
          // 最初の要素にフォーカス
          navigateToElement('first');
          break;
        case 'End':
          // 最後の要素にフォーカス
          navigateToElement('last');
          break;
        case 'h':
          // 見出しに移動
          navigateToHeading();
          break;
        case 'l':
          // リンクに移動
          navigateToLink();
          break;
        case 'b':
          // ボタンに移動
          navigateToButton();
          break;
        case 'i':
          // 入力フィールドに移動
          navigateToInput();
          break;
      }
    }

    // Escapeキーでスキップリンクを非表示
    if (key === 'Escape') {
      setSkipLinksVisible(false);
    }
  }, [settings.keyboardNavigation]);

  // 要素間のナビゲーション
  const navigateToElement = useCallback((direction: 'prev' | 'next' | 'first' | 'last') => {
    updateFocusableElements();
    
    if (focusableElements.length === 0) return;

    let newIndex: number;
    
    switch (direction) {
      case 'first':
        newIndex = 0;
        break;
      case 'last':
        newIndex = focusableElements.length - 1;
        break;
      case 'prev':
        newIndex = currentFocusIndex.current > 0 
          ? currentFocusIndex.current - 1 
          : focusableElements.length - 1;
        break;
      case 'next':
        newIndex = currentFocusIndex.current < focusableElements.length - 1 
          ? currentFocusIndex.current + 1 
          : 0;
        break;
    }

    const targetElement = focusableElements[newIndex];
    if (targetElement) {
      targetElement.element.focus();
      currentFocusIndex.current = newIndex;
      
      // フォーカス移動をアナウンス
      const elementInfo = getElementInfo(targetElement.element);
      announce(`${elementInfo}にフォーカスしました`);
      playSound('click');
    }
  }, [focusableElements, announce, playSound, updateFocusableElements]);

  // 特定タイプの要素にナビゲーション
  const navigateToHeading = useCallback(() => {
    const headings = Array.from(containerRef.current?.querySelectorAll('h1, h2, h3, h4, h5, h6') || []) as HTMLElement[];
    if (headings.length > 0) {
      headings[0].focus();
      announce(`見出し: ${headings[0].textContent}にフォーカスしました`);
    }
  }, [announce]);

  const navigateToLink = useCallback(() => {
    const links = Array.from(containerRef.current?.querySelectorAll('a[href]') || []) as HTMLElement[];
    if (links.length > 0) {
      links[0].focus();
      announce(`リンク: ${links[0].textContent}にフォーカスしました`);
    }
  }, [announce]);

  const navigateToButton = useCallback(() => {
    const buttons = Array.from(containerRef.current?.querySelectorAll('button:not([disabled])') || []) as HTMLElement[];
    if (buttons.length > 0) {
      buttons[0].focus();
      announce(`ボタン: ${buttons[0].textContent}にフォーカスしました`);
    }
  }, [announce]);

  const navigateToInput = useCallback(() => {
    const inputs = Array.from(containerRef.current?.querySelectorAll('input:not([disabled]), textarea:not([disabled])') || []) as HTMLElement[];
    if (inputs.length > 0) {
      inputs[0].focus();
      const label = inputs[0].getAttribute('aria-label') || inputs[0].getAttribute('placeholder') || '入力フィールド';
      announce(`${label}にフォーカスしました`);
    }
  }, [announce]);

  // 要素の説明テキストを取得
  const getElementInfo = useCallback((element: HTMLElement): string => {
    const tagName = element.tagName.toLowerCase();
    const role = element.getAttribute('role');
    const label = element.getAttribute('aria-label') || 
                 element.getAttribute('title') ||
                 element.textContent?.trim() || 
                 element.getAttribute('alt') ||
                 element.getAttribute('placeholder');

    if (role) {
      return `${role} ${label || ''}`.trim();
    }

    switch (tagName) {
      case 'button':
        return `ボタン ${label || ''}`.trim();
      case 'a':
        return `リンク ${label || ''}`.trim();
      case 'input':
        const type = element.getAttribute('type') || 'text';
        return `${type}入力 ${label || ''}`.trim();
      case 'select':
        return `選択ボックス ${label || ''}`.trim();
      case 'textarea':
        return `テキストエリア ${label || ''}`.trim();
      default:
        return label || tagName;
    }
  }, []);

  // イベントリスナー設定
  useEffect(() => {
    updateFocusableElements();
    
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', updateFocusableElements);
    
    // MutationObserver でDOM変更を監視
    const observer = new MutationObserver(updateFocusableElements);
    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['disabled', 'tabindex', 'hidden'],
      });
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updateFocusableElements);
      observer.disconnect();
    };
  }, [handleKeyDown, updateFocusableElements]);

  // スキップリンク
  const skipLinks = [
    { href: '#main-content', label: 'メインコンテンツへスキップ' },
    { href: '#navigation', label: 'ナビゲーションへスキップ' },
    { href: '#sidebar', label: 'サイドバーへスキップ' },
    { href: '#footer', label: 'フッターへスキップ' },
  ];

  return (
    <>
      <div ref={containerRef} style={{ height: '100%', width: '100%' }}>
        {children}
      </div>

      {/* スキップリンク */}
      {settings.skipLinks && (
        <Portal>
          <Box
            sx={{
              position: 'fixed',
              top: -100,
              left: 0,
              zIndex: 9999,
              background: 'background.paper',
              border: '2px solid',
              borderColor: 'primary.main',
              borderRadius: 1,
              p: 1,
              transform: skipLinksVisible ? 'translateY(120px)' : 'translateY(0)',
              transition: 'transform 0.3s ease',
              '&:focus-within': {
                transform: 'translateY(120px)',
              },
            }}
          >
            {skipLinks.map((link) => (
              <Box
                key={link.href}
                component="a"
                href={link.href}
                sx={{
                  display: 'block',
                  p: 1,
                  textDecoration: 'none',
                  color: 'primary.main',
                  '&:focus': {
                    outline: '2px solid',
                    outlineColor: 'primary.main',
                    backgroundColor: 'primary.light',
                  },
                }}
                onClick={() => {
                  setSkipLinksVisible(false);
                  playSound('click');
                }}
              >
                {link.label}
              </Box>
            ))}
          </Box>
        </Portal>
      )}

      {/* キーボードショートカットヘルプ */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 10,
          right: 10,
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          p: 1,
          borderRadius: 1,
          fontSize: '0.75rem',
          opacity: 0,
          pointerEvents: 'none',
          transition: 'opacity 0.3s ease',
          '&[data-visible="true"]': {
            opacity: 1,
          },
        }}
        data-visible={settings.keyboardNavigation}
      >
        Ctrl+Alt+↑/↓: 要素移動 | Ctrl+Alt+H: 見出し | Ctrl+Alt+L: リンク
      </Box>
    </>
  );
};