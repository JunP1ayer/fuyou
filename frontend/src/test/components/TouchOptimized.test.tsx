/**
 * タッチ最適化コンポーネントのテスト
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  TouchButton,
  TouchIconButton,
  TouchChip,
  TouchCard,
  SwipeableContainer,
  PullToRefresh,
} from '../../components/common/TouchOptimized';
import { Add } from '@mui/icons-material';

// テスト用のテーマ
const theme = createTheme();
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

// モバイル画面サイズをモック
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

describe('TouchButton', () => {
  beforeEach(() => {
    mockMatchMedia(true); // モバイル環境をシミュレート
  });

  it('モバイルで適切なタッチサイズを持つ', () => {
    render(
      <TestWrapper>
        <TouchButton data-testid="touch-button">テストボタン</TouchButton>
      </TestWrapper>
    );

    const button = screen.getByTestId('touch-button');
    const styles = getComputedStyle(button);
    
    // 最小高さが48px以上であることを確認
    expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(48);
  });

  it('大きいサイズのボタンが適切に表示される', () => {
    render(
      <TestWrapper>
        <TouchButton touchSize="large" data-testid="large-button">
          大きいボタン
        </TouchButton>
      </TestWrapper>
    );

    const button = screen.getByTestId('large-button');
    const styles = getComputedStyle(button);
    
    expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(56);
  });

  it('クリックイベントが正しく動作する', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <TouchButton onClick={handleClick} data-testid="clickable-button">
          クリック
        </TouchButton>
      </TestWrapper>
    );

    const button = screen.getByTestId('clickable-button');
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

describe('TouchIconButton', () => {
  it('アイコンボタンが適切なサイズで表示される', () => {
    render(
      <TestWrapper>
        <TouchIconButton data-testid="icon-button">
          <Add />
        </TouchIconButton>
      </TestWrapper>
    );

    const button = screen.getByTestId('icon-button');
    const styles = getComputedStyle(button);
    
    expect(parseInt(styles.width)).toBeGreaterThanOrEqual(48);
    expect(parseInt(styles.height)).toBeGreaterThanOrEqual(48);
  });
});

describe('TouchChip', () => {
  it('チップが適切な高さで表示される', () => {
    render(
      <TestWrapper>
        <TouchChip label="テストチップ" data-testid="touch-chip" />
      </TestWrapper>
    );

    const chip = screen.getByTestId('touch-chip');
    const styles = getComputedStyle(chip);
    
    expect(parseInt(styles.height)).toBeGreaterThanOrEqual(40);
  });

  it('削除可能なチップが動作する', async () => {
    const handleDelete = vi.fn();
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <TouchChip label="削除可能" onDelete={handleDelete} data-testid="deletable-chip" />
      </TestWrapper>
    );

    const deleteIcon = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteIcon);

    expect(handleDelete).toHaveBeenCalledTimes(1);
  });
});

describe('TouchCard', () => {
  it('インタラクティブカードがホバー効果を持つ', () => {
    render(
      <TestWrapper>
        <TouchCard interactive data-testid="interactive-card">
          <div>カードコンテンツ</div>
        </TouchCard>
      </TestWrapper>
    );

    const card = screen.getByTestId('interactive-card');
    expect(card).toHaveStyle('cursor: pointer');
  });

  it('カードクリックが動作する', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <TouchCard interactive onClick={handleClick} data-testid="clickable-card">
          <div>クリック可能カード</div>
        </TouchCard>
      </TestWrapper>
    );

    const card = screen.getByTestId('clickable-card');
    await user.click(card);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

describe('SwipeableContainer', () => {
  let touchStartEvent: TouchEvent;
  let touchMoveEvent: TouchEvent;
  let touchEndEvent: TouchEvent;

  beforeEach(() => {
    // Touch events をモック
    touchStartEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 } as Touch],
    } as TouchEventInit);

    touchMoveEvent = new TouchEvent('touchmove', {
      touches: [{ clientX: 50, clientY: 100 } as Touch],
    } as TouchEventInit);

    touchEndEvent = new TouchEvent('touchend', {
      changedTouches: [{ clientX: 50, clientY: 100 } as Touch],
    } as TouchEventInit);
  });

  it('左スワイプが検出される', async () => {
    const onSwipeLeft = vi.fn();

    render(
      <SwipeableContainer onSwipeLeft={onSwipeLeft}>
        <div data-testid="swipe-content">スワイプコンテンツ</div>
      </SwipeableContainer>
    );

    const container = screen.getByTestId('swipe-content').parentElement!;

    fireEvent(container, touchStartEvent);
    fireEvent(container, touchMoveEvent);
    fireEvent.touchEnd(container);

    await waitFor(() => {
      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    });
  });

  it('右スワイプが検出される', async () => {
    const onSwipeRight = vi.fn();

    const rightSwipeMoveEvent = new TouchEvent('touchmove', {
      touches: [{ clientX: 150, clientY: 100 } as Touch],
    } as TouchEventInit);

    render(
      <SwipeableContainer onSwipeRight={onSwipeRight}>
        <div data-testid="swipe-content">スワイプコンテンツ</div>
      </SwipeableContainer>
    );

    const container = screen.getByTestId('swipe-content').parentElement!;

    fireEvent(container, touchStartEvent);
    fireEvent(container, rightSwipeMoveEvent);
    fireEvent.touchEnd(container);

    await waitFor(() => {
      expect(onSwipeRight).toHaveBeenCalledTimes(1);
    });
  });
});

describe('PullToRefresh', () => {
  it('プルトゥリフレッシュが動作する', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    
    // スクロール位置をモック
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      value: 0,
    });

    render(
      <PullToRefresh onRefresh={onRefresh}>
        <div data-testid="refresh-content">リフレッシュ可能コンテンツ</div>
      </PullToRefresh>
    );

    const container = screen.getByTestId('refresh-content').parentElement!;

    // プルダウンジェスチャーをシミュレート
    const pullStartEvent = new TouchEvent('touchstart', {
      touches: [{ clientY: 50 } as Touch],
    } as TouchEventInit);

    const pullMoveEvent = new TouchEvent('touchmove', {
      touches: [{ clientY: 150 } as Touch], // 100px下に移動
    } as TouchEventInit);

    fireEvent(container, pullStartEvent);
    fireEvent(container, pullMoveEvent);
    fireEvent.touchEnd(container);

    await waitFor(() => {
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });
  });

  it('リフレッシュ中の表示が正しく動作する', () => {
    render(
      <PullToRefresh onRefresh={vi.fn()} refreshing={true}>
        <div data-testid="refresh-content">コンテンツ</div>
      </PullToRefresh>
    );

    expect(screen.getByTestId('refresh-content')).toBeInTheDocument();
  });
});

// アクセシビリティテスト
describe('アクセシビリティ', () => {
  it('ボタンが適切なARIA属性を持つ', () => {
    render(
      <TestWrapper>
        <TouchButton aria-label="アクセシブルボタン">ボタン</TouchButton>
      </TestWrapper>
    );

    const button = screen.getByRole('button', { name: 'アクセシブルボタン' });
    expect(button).toBeInTheDocument();
  });

  it('キーボードナビゲーションが動作する', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <TouchButton onClick={handleClick}>キーボードテスト</TouchButton>
      </TestWrapper>
    );

    const button = screen.getByRole('button');
    await user.tab(); // フォーカス
    await user.keyboard('{Enter}'); // Enterキー

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

// パフォーマンステスト
describe('パフォーマンス', () => {
  it('大量のタッチボタンが効率的にレンダリングされる', () => {
    const startTime = performance.now();

    render(
      <TestWrapper>
        <div>
          {Array.from({ length: 100 }, (_, i) => (
            <TouchButton key={i}>ボタン {i}</TouchButton>
          ))}
        </div>
      </TestWrapper>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // レンダリング時間が適切な範囲内であることを確認
    expect(renderTime).toBeLessThan(1000); // 1秒未満
  });
});

// Edge cases
describe('エッジケース', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('matchMediaが存在しない環境で動作する', () => {
    // matchMediaを削除
    const originalMatchMedia = window.matchMedia;
    delete (window as any).matchMedia;

    expect(() => {
      render(
        <TestWrapper>
          <TouchButton>エッジケーステスト</TouchButton>
        </TestWrapper>
      );
    }).not.toThrow();

    // 復元
    window.matchMedia = originalMatchMedia;
  });

  it('タッチイベントがサポートされていない環境で動作する', () => {
    // TouchEventを削除
    const originalTouchEvent = window.TouchEvent;
    delete (window as any).TouchEvent;

    expect(() => {
      render(
        <SwipeableContainer onSwipeLeft={vi.fn()}>
          <div>非タッチ環境テスト</div>
        </SwipeableContainer>
      );
    }).not.toThrow();

    // 復元
    (window as any).TouchEvent = originalTouchEvent;
  });
});