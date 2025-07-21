import * as Figma from 'figma-api';

export interface DesignTokens {
  colors: Record<string, string>;
  typography: Record<string, any>;
  spacing: Record<string, string>;
  lastUpdated: string;
}

export interface FigmaComponent {
  id: string;
  name: string;
  description: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface FigmaConfig {
  token: string;
  fileKey: string;
  teamId?: string;
  projectId?: string;
}

class FigmaService {
  private api: Figma.Api;
  private config: FigmaConfig;
  private cache = new Map<string, { data: any; expiry: number }>();

  constructor(config: FigmaConfig) {
    this.config = config;
    this.api = new Figma.Api({
      personalAccessToken: config.token,
    });
  }

  // キャッシュ付きデータ取得
  private async getCachedData<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl = 300000 // 5分
  ): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, { data, expiry: Date.now() + ttl });
    return data;
  }

  // エラーハンドリング付きAPI呼び出し
  private async withErrorHandling<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      console.error(`Figma API Error ${context ? `(${context})` : ''}:`, error);
      
      if (error.response?.status === 403) {
        throw new Error('Figma API access denied. Check token permissions.');
      }
      if (error.response?.status === 429) {
        throw new Error('Figma API rate limit exceeded. Please try again later.');
      }
      if (error.response?.status === 404) {
        throw new Error('Figma file not found. Check file key.');
      }
      
      throw new Error(error.message || 'Unknown Figma API error');
    }
  }

  // ファイル情報取得
  async getFile(options?: { ids?: string[] }): Promise<Figma.FileResponse> {
    const cacheKey = `file-${this.config.fileKey}-${options?.ids?.join(',') || 'all'}`;
    
    return this.getCachedData(cacheKey, () =>
      this.withErrorHandling(
        () => this.api.getFile({ 
          file_key: this.config.fileKey,
          ids: options?.ids?.join(',')
        }),
        'getFile'
      )
    );
  }

  // デザイントークン取得
  async getDesignTokens(): Promise<DesignTokens> {
    const cacheKey = `tokens-${this.config.fileKey}`;
    
    return this.getCachedData(cacheKey, async () => {
      const file = await this.getFile();
      
      // Variables API試行（Enterprise機能）
      let variables = null;
      try {
        variables = await this.api.getLocalVariables({ 
          file_key: this.config.fileKey 
        });
      } catch (error) {
        console.warn('Variables API not available, falling back to styles');
      }

      const tokens: DesignTokens = {
        colors: this.extractColors(variables, file),
        typography: this.extractTypography(file),
        spacing: this.extractSpacing(variables, file),
        lastUpdated: new Date().toISOString(),
      };

      return tokens;
    });
  }

  // カラートークン抽出
  private extractColors(variables: any, file: Figma.FileResponse): Record<string, string> {
    const colors: Record<string, string> = {};

    // Variables APIから抽出（優先）
    if (variables?.meta?.variables) {
      variables.meta.variables
        .filter((v: any) => v.resolvedType === 'COLOR')
        .forEach((variable: any) => {
          const colorValue = variable.valuesByMode[
            Object.keys(variable.valuesByMode)[0]
          ];
          colors[variable.name] = this.formatColor(colorValue);
        });
    }

    // Stylesから抽出（フォールバック）
    if (file.styles && Object.keys(colors).length === 0) {
      Object.values(file.styles)
        .filter((style: any) => style.styleType === 'FILL')
        .forEach((style: any) => {
          colors[style.name] = this.extractColorFromStyle(style);
        });
    }

    return colors;
  }

  // タイポグラフィ抽出
  private extractTypography(file: Figma.FileResponse): Record<string, any> {
    const typography: Record<string, any> = {};

    if (file.styles) {
      Object.values(file.styles)
        .filter((style: any) => style.styleType === 'TEXT')
        .forEach((style: any) => {
          typography[style.name] = {
            fontFamily: style.fontFamily || 'inherit',
            fontSize: style.fontSize ? `${style.fontSize}px` : '16px',
            fontWeight: style.fontWeight || 400,
            lineHeight: style.lineHeightPx ? `${style.lineHeightPx}px` : 'normal',
            letterSpacing: style.letterSpacing ? `${style.letterSpacing}px` : 'normal',
          };
        });
    }

    return typography;
  }

  // スペーシング抽出
  private extractSpacing(variables: any, file: Figma.FileResponse): Record<string, string> {
    const spacing: Record<string, string> = {};

    // Variables APIから抽出
    if (variables?.meta?.variables) {
      variables.meta.variables
        .filter((v: any) => v.resolvedType === 'FLOAT' && v.name.toLowerCase().includes('spacing'))
        .forEach((variable: any) => {
          const value = variable.valuesByMode[Object.keys(variable.valuesByMode)[0]];
          spacing[variable.name] = `${value}px`;
        });
    }

    // デフォルトスペーシング（フォールバック）
    if (Object.keys(spacing).length === 0) {
      spacing['xs'] = '4px';
      spacing['sm'] = '8px';
      spacing['md'] = '16px';
      spacing['lg'] = '24px';
      spacing['xl'] = '32px';
    }

    return spacing;
  }

  // コンポーネント一覧取得
  async getComponents(): Promise<FigmaComponent[]> {
    const cacheKey = `components-${this.config.fileKey}`;
    
    return this.getCachedData(cacheKey, async () => {
      const components = await this.withErrorHandling(
        () => this.api.getFileComponents({ file_key: this.config.fileKey }),
        'getComponents'
      );

      return components.meta.components.map((comp): FigmaComponent => ({
        id: comp.key,
        name: comp.name,
        description: comp.description || '',
        type: comp.component_set_id ? 'variant' : 'component',
        createdAt: comp.created_at,
        updatedAt: comp.updated_at,
      }));
    });
  }

  // コンポーネント画像取得
  async getComponentImage(componentId: string, scale = 2): Promise<string> {
    const cacheKey = `image-${componentId}-${scale}`;
    
    return this.getCachedData(cacheKey, async () => {
      const images = await this.withErrorHandling(
        () => this.api.getImage({
          file_key: this.config.fileKey,
          ids: componentId,
          scale,
          format: 'png'
        }),
        'getComponentImage'
      );

      return images.images[componentId] || '';
    });
  }

  // プロトタイプ情報取得
  async getPrototypeData(): Promise<any> {
    const cacheKey = `prototype-${this.config.fileKey}`;
    
    return this.getCachedData(cacheKey, async () => {
      const file = await this.getFile();
      
      // プロトタイプのフロー情報を抽出
      const flows: any[] = [];
      const interactions: any[] = [];

      this.traverseNodes(file.document, (node: any) => {
        if (node.prototypeStartNodeID) {
          flows.push({
            name: node.name || 'Unnamed Flow',
            startingPoint: {
              nodeId: node.prototypeStartNodeID,
              name: node.name,
            },
          });
        }

        if (node.reactions && node.reactions.length > 0) {
          node.reactions.forEach((reaction: any) => {
            interactions.push({
              trigger: reaction.trigger,
              actions: reaction.actions,
              sourceNodeId: node.id,
              destinationId: reaction.actions[0]?.destinationId,
            });
          });
        }
      });

      return { flows, interactions };
    });
  }

  // ノード走査ヘルパー
  private traverseNodes(node: any, callback: (node: any) => void): void {
    callback(node);
    if (node.children) {
      node.children.forEach((child: any) => {
        this.traverseNodes(child, callback);
      });
    }
  }

  // カラーフォーマット
  private formatColor(colorValue: any): string {
    if (typeof colorValue === 'string') return colorValue;
    
    const r = Math.round((colorValue.r || 0) * 255);
    const g = Math.round((colorValue.g || 0) * 255);
    const b = Math.round((colorValue.b || 0) * 255);
    const a = colorValue.a || 1;
    
    return a === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  // スタイルからカラー抽出
  private extractColorFromStyle(style: any): string {
    // Figma APIのスタイル構造から色を抽出
    // 実際の実装ではより詳細な解析が必要
    return '#000000'; // プレースホルダー
  }

  // キャッシュクリア
  clearCache(): void {
    this.cache.clear();
  }

  // トークンをCSS変数として出力
  tokensToCSS(tokens: DesignTokens): string {
    let css = ':root {\n';
    
    // Colors
    Object.entries(tokens.colors).forEach(([name, value]) => {
      css += `  --color-${name.toLowerCase().replace(/\s+/g, '-')}: ${value};\n`;
    });
    
    // Typography
    Object.entries(tokens.typography).forEach(([name, styles]) => {
      const prefix = `--font-${name.toLowerCase().replace(/\s+/g, '-')}`;
      css += `  ${prefix}-family: ${styles.fontFamily};\n`;
      css += `  ${prefix}-size: ${styles.fontSize};\n`;
      css += `  ${prefix}-weight: ${styles.fontWeight};\n`;
      css += `  ${prefix}-line-height: ${styles.lineHeight};\n`;
    });
    
    // Spacing
    Object.entries(tokens.spacing).forEach(([name, value]) => {
      css += `  --spacing-${name.toLowerCase().replace(/\s+/g, '-')}: ${value};\n`;
    });
    
    css += '}';
    return css;
  }

  // トークンをTypeScript定数として出力
  tokensToTypeScript(tokens: DesignTokens): string {
    return `export const designTokens = ${JSON.stringify(tokens, null, 2)} as const;

export type DesignTokens = typeof designTokens;`;
  }
}

export default FigmaService;