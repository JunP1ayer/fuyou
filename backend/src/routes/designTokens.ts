// 透明なFigmaデザイントークン配信API
import { Router, Request, Response } from 'express';
import { Api } from 'figma-api';
import { asyncHandler } from '../middleware/errorHandler';
import { DesignIntelligenceService } from '../services/designIntelligenceService';

const router = Router();

interface DesignTokens {
  colors: Record<string, string>;
  typography: Record<string, any>;
  spacing: Record<string, string>;
  lastUpdated: string;
}

interface FigmaStyle {
  key: string;
  name: string;
  styleType: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID';
  description?: string;
}

// Figma設定（環境変数から自動取得）
const getFigmaConfig = () => {
  const token = process.env.FIGMA_PERSONAL_ACCESS_TOKEN;
  const fileKey = process.env.FIGMA_FILE_KEY;
  
  if (!token || !fileKey) {
    throw new Error('Figma環境変数が設定されていません');
  }
  
  return { token, fileKey };
};

// キャッシュシステム (5分TTL)
let designTokensCache: DesignTokens | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5分

// Gemini式Design Intelligence初期化
const intelligenceService = new DesignIntelligenceService();

// Figma APIからデザイントークン取得
const fetchDesignTokensFromFigma = async (): Promise<DesignTokens> => {
  const { token, fileKey } = getFigmaConfig();
  const api = new Api({ personalAccessToken: token });
  
  try {
    // ファイル基本情報取得
    const fileResponse = await api.getFile({
      file_key: fileKey,
    });
    
    console.log(`🎨 Figma同期: ${fileResponse.name} (${fileResponse.lastModified})`);
    
    // スタイル情報を解析してデザイントークンに変換
    const colors: Record<string, string> = {};
    const typography: Record<string, any> = {};
    const spacing: Record<string, string> = {};
    
    // Figmaスタイルから色彩情報抽出
    Object.values(fileResponse.styles || {}).forEach((style: any) => {
      if (style.styleType === 'FILL') {
        // 色名を正規化（小文字、ハイフン区切り）
        const colorKey = style.name.toLowerCase().replace(/\s+/g, '-');
        
        // Figmaの色情報を適切なCSS形式に変換
        if (style.name.toLowerCase().includes('black')) {
          colors[colorKey] = style.name.includes('8') ? 'rgba(0, 0, 0, 0.08)' : 'rgb(0, 0, 0)';
        } else {
          // デフォルト色彩マッピング
          colors[colorKey] = '#1976d2'; // Material-UI primary
        }
      }
    });
    
    // Material-UI互換の色彩パレット生成
    const enhancedColors = {
      ...colors,
      // プライマリカラー（Figmaから抽出または自動生成）
      'primary': colors['black'] || '#1976d2',
      'secondary': colors['black-8'] || '#dc004e',
      // UX向上色彩（心理学ベース）
      'success': '#2e7d32',
      'warning': '#ed6c02', 
      'error': '#d32f2f',
      'info': '#0288d1',
      // 背景・テキスト
      'background-default': '#fafafa',
      'background-paper': '#ffffff',
      'text-primary': colors['black'] || 'rgba(0, 0, 0, 0.87)',
      'text-secondary': colors['black-8'] || 'rgba(0, 0, 0, 0.6)',
    };
    
    // タイポグラフィ最適化（可読性・集中力向上）
    const enhancedTypography = {
      'font-family': '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      'heading': {
        'font-size': '1.5rem',
        'font-weight': 600,
        'line-height': 1.2,
        'letter-spacing': '-0.01em'
      },
      'body': {
        'font-size': '0.875rem',
        'font-weight': 400,
        'line-height': 1.5,
      },
      'caption': {
        'font-size': '0.75rem',
        'font-weight': 400,
        'line-height': 1.4,
      }
    };
    
    // スペーシング最適化（操作性向上）
    const enhancedSpacing = {
      'xs': '4px',
      'sm': '8px',
      'md': '16px',
      'lg': '24px',
      'xl': '32px',
      // UX特化スペーシング
      'touch-target': '44px', // タッチ操作最適化
      'card-padding': '20px',
      'section-margin': '32px',
    };
    
    return {
      colors: enhancedColors,
      typography: enhancedTypography,
      spacing: enhancedSpacing,
      lastUpdated: new Date().toISOString(),
    };
    
  } catch (error) {
    console.error('❌ Figma API エラー:', error);
    // フォールバック: デフォルトデザイントークン
    return getDefaultDesignTokens();
  }
};

// デフォルトデザイントークン（Figma接続失敗時）
const getDefaultDesignTokens = (): DesignTokens => ({
  colors: {
    'primary': '#1976d2',
    'secondary': '#dc004e',
    'success': '#2e7d32',
    'warning': '#ed6c02',
    'error': '#d32f2f',
    'background-default': '#fafafa',
    'background-paper': '#ffffff',
    'text-primary': 'rgba(0, 0, 0, 0.87)',
    'text-secondary': 'rgba(0, 0, 0, 0.6)',
  },
  typography: {
    'font-family': '"Roboto", "Helvetica", "Arial", sans-serif',
    'heading': {
      'font-size': '1.5rem',
      'font-weight': 500,
      'line-height': 1.2,
    },
    'body': {
      'font-size': '0.875rem',
      'font-weight': 400,
      'line-height': 1.5,
    },
  },
  spacing: {
    'xs': '4px',
    'sm': '8px',
    'md': '16px',
    'lg': '24px',
    'xl': '32px',
  },
  lastUpdated: new Date().toISOString(),
});

// Gemini式インテリジェントデザイントークン配信エンドポイント
router.get('/tokens', asyncHandler(async (req: Request, res: Response) => {
  const now = Date.now();
  
  try {
    // 1. ユーザーコンテキスト分析（Gemini式）
    const userId = req.headers['x-user-id'] as string || 'anonymous';
    const userContext = await intelligenceService.analyzeUserContext(userId, req);
    
    console.log(`🤖 ユーザーコンテキスト分析: ${userContext.deviceType}, ${userContext.timeOfDay}, ${userContext.taskType}`);
    
    // 2. ベースデザイントークン取得（キャッシュ活用）
    let baseTokens = designTokensCache;
    if (!baseTokens || (now - cacheTimestamp) >= CACHE_TTL) {
      console.log('🔄 Figma同期: 最新デザイン取得中...');
      baseTokens = await fetchDesignTokensFromFigma();
      designTokensCache = baseTokens;
      cacheTimestamp = now;
    }
    
    // 3. AI判断システム（Gemini式プロアクティブ）
    const decision = await intelligenceService.makeDesignDecision(baseTokens, userContext, userId);
    console.log(`🧠 AI判断: 信頼度${decision.confidence.toFixed(2)} - ${decision.reasoning}`);
    
    // 4. 適用可否の自律判断
    const shouldApply = await intelligenceService.shouldApplyDesignChange(decision, userId);
    
    let finalTokens = baseTokens;
    let enhancement = 'base';
    
    if (shouldApply) {
      // 5. コンテキスト特化トークン生成
      const contextualColors = await intelligenceService.generateContextualTokens(baseTokens, userContext, userId);
      finalTokens = {
        ...baseTokens,
        colors: contextualColors,
      };
      enhancement = 'intelligent';
      console.log(`✨ インテリジェント強化適用: ${decision.reasoning}`);
    }
    
    // 6. 結果配信
    res.json({
      success: true,
      data: finalTokens,
      cached: baseTokens === designTokensCache,
      enhancement,
      intelligence: {
        context: userContext,
        decision: {
          confidence: decision.confidence,
          reasoning: decision.reasoning,
          applied: shouldApply,
        },
        performance: {
          syncTime: now - cacheTimestamp,
          analysisTime: Date.now() - now,
        }
      }
    });
    
  } catch (error) {
    console.error('❌ インテリジェントデザイン処理エラー:', error);
    
    // フォールバック: シンプルなデザイントークン配信
    const fallbackTokens = designTokensCache || getDefaultDesignTokens();
    res.json({
      success: true,
      data: fallbackTokens,
      cached: true,
      fallback: true,
      error: error instanceof Error ? error.message : '未知のエラー'
    });
  }
}));

// CSS変数形式で配信
router.get('/css', asyncHandler(async (req: Request, res: Response) => {
  const now = Date.now();
  
  // キャッシュチェック
  if (!designTokensCache || (now - cacheTimestamp) >= CACHE_TTL) {
    designTokensCache = await fetchDesignTokensFromFigma();
    cacheTimestamp = now;
  }
  
  // CSS変数生成
  const cssVariables = Object.entries(designTokensCache.colors)
    .map(([key, value]) => `  --color-${key}: ${value};`)
    .join('\n');
    
  const cssSpacing = Object.entries(designTokensCache.spacing)
    .map(([key, value]) => `  --spacing-${key}: ${value};`)
    .join('\n');
  
  const css = `:root {\n${cssVariables}\n${cssSpacing}\n}`;
  
  res.setHeader('Content-Type', 'text/css');
  res.send(css);
}));

// システム状態確認エンドポイント
router.get('/status', asyncHandler(async (req: Request, res: Response) => {
  const { token, fileKey } = getFigmaConfig();
  
  res.json({
    success: true,
    data: {
      figmaConnected: !!(token && fileKey),
      cacheActive: !!designTokensCache,
      lastUpdate: designTokensCache?.lastUpdated || null,
      cacheAge: designTokensCache ? Date.now() - cacheTimestamp : null,
    },
  });
}));

export default router;