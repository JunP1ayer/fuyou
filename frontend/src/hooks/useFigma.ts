import { useState, useEffect, useCallback, useMemo } from 'react';
import FigmaService, { DesignTokens, FigmaComponent, FigmaConfig } from '../services/figmaService';

// Figmaファイル情報のフック
export const useFigmaFile = (config: FigmaConfig) => {
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const figmaService = useMemo(() => new FigmaService(config), [config]);

  const fetchFile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fileData = await figmaService.getFile();
      setFile(fileData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [figmaService]);

  useEffect(() => {
    if (config.token && config.fileKey) {
      fetchFile();
    }
  }, [fetchFile, config.token, config.fileKey]);

  return { file, loading, error, refetch: fetchFile };
};

// デザイントークンのフック
export const useFigmaDesignTokens = (config: FigmaConfig, autoRefresh = false) => {
  const [tokens, setTokens] = useState<DesignTokens | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const figmaService = useMemo(() => new FigmaService(config), [config]);

  const fetchTokens = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const designTokens = await figmaService.getDesignTokens();
      setTokens(designTokens);
      setLastSynced(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch design tokens');
    } finally {
      setLoading(false);
    }
  }, [figmaService]);

  // 自動リフレッシュ
  useEffect(() => {
    if (config.token && config.fileKey) {
      fetchTokens();
    }
  }, [fetchTokens, config.token, config.fileKey]);

  useEffect(() => {
    if (autoRefresh && config.token && config.fileKey) {
      const interval = setInterval(fetchTokens, 5 * 60 * 1000); // 5分ごと
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchTokens, config.token, config.fileKey]);

  // CSS変数生成
  const cssVariables = useMemo(() => {
    return tokens ? figmaService.tokensToCSS(tokens) : '';
  }, [tokens, figmaService]);

  // TypeScript定数生成
  const typeScriptTokens = useMemo(() => {
    return tokens ? figmaService.tokensToTypeScript(tokens) : '';
  }, [tokens, figmaService]);

  return {
    tokens,
    loading,
    error,
    lastSynced,
    cssVariables,
    typeScriptTokens,
    refetch: fetchTokens,
    clearCache: () => figmaService.clearCache(),
  };
};

// コンポーネント一覧のフック
export const useFigmaComponents = (config: FigmaConfig) => {
  const [components, setComponents] = useState<FigmaComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const figmaService = useMemo(() => new FigmaService(config), [config]);

  const fetchComponents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const componentList = await figmaService.getComponents();
      setComponents(componentList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch components');
    } finally {
      setLoading(false);
    }
  }, [figmaService]);

  useEffect(() => {
    if (config.token && config.fileKey) {
      fetchComponents();
    }
  }, [fetchComponents, config.token, config.fileKey]);

  return { components, loading, error, refetch: fetchComponents };
};

// コンポーネント画像のフック
export const useFigmaComponentImage = (config: FigmaConfig, componentId: string | null, scale = 2) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const figmaService = useMemo(() => new FigmaService(config), [config]);

  const fetchImage = useCallback(async () => {
    if (!componentId) return;

    try {
      setLoading(true);
      setError(null);
      const url = await figmaService.getComponentImage(componentId, scale);
      setImageUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch component image');
    } finally {
      setLoading(false);
    }
  }, [figmaService, componentId, scale]);

  useEffect(() => {
    if (config.token && config.fileKey && componentId) {
      fetchImage();
    }
  }, [fetchImage, config.token, config.fileKey, componentId]);

  return { imageUrl, loading, error, refetch: fetchImage };
};

// プロトタイプ情報のフック
export const useFigmaPrototype = (config: FigmaConfig) => {
  const [prototypeData, setPrototypeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const figmaService = useMemo(() => new FigmaService(config), [config]);

  const fetchPrototype = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await figmaService.getPrototypeData();
      setPrototypeData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prototype data');
    } finally {
      setLoading(false);
    }
  }, [figmaService]);

  useEffect(() => {
    if (config.token && config.fileKey) {
      fetchPrototype();
    }
  }, [fetchPrototype, config.token, config.fileKey]);

  return { prototypeData, loading, error, refetch: fetchPrototype };
};

// 統合フック - すべてのFigmaデータを取得
export const useFigmaIntegration = (
  config: FigmaConfig, 
  options: {
    enableTokens?: boolean;
    enableComponents?: boolean;
    enablePrototype?: boolean;
    autoRefreshTokens?: boolean;
  } = {}
) => {
  const {
    enableTokens = true,
    enableComponents = true,
    enablePrototype = false,
    autoRefreshTokens = false,
  } = options;

  // 個別フックの呼び出し
  const file = useFigmaFile(config);
  
  const tokens = useFigmaDesignTokens(
    enableTokens ? config : { ...config, token: '', fileKey: '' }, 
    autoRefreshTokens
  );
  
  const components = useFigmaComponents(
    enableComponents ? config : { ...config, token: '', fileKey: '' }
  );
  
  const prototype = useFigmaPrototype(
    enablePrototype ? config : { ...config, token: '', fileKey: '' }
  );

  // 全体の読み込み状態
  const loading = file.loading || 
    (enableTokens && tokens.loading) || 
    (enableComponents && components.loading) || 
    (enablePrototype && prototype.loading);

  // エラーの統合
  const error = file.error || 
    (enableTokens ? tokens.error : null) || 
    (enableComponents ? components.error : null) || 
    (enablePrototype ? prototype.error : null);

  // 全データの再取得
  const refetchAll = useCallback(() => {
    file.refetch();
    if (enableTokens) tokens.refetch();
    if (enableComponents) components.refetch();
    if (enablePrototype) prototype.refetch();
  }, [file, tokens, components, prototype, enableTokens, enableComponents, enablePrototype]);

  return {
    file: file.file,
    tokens: enableTokens ? tokens.tokens : null,
    components: enableComponents ? components.components : [],
    prototype: enablePrototype ? prototypeData : null,
    loading,
    error,
    refetchAll,
    // 個別データも公開
    fileData: file,
    tokensData: tokens,
    componentsData: components,
    prototypeData: prototype,
  };
};

// Figma設定管理のフック
export const useFigmaConfig = (initialConfig?: Partial<FigmaConfig>) => {
  const [config, setConfig] = useState<FigmaConfig>({
    token: initialConfig?.token || '',
    fileKey: initialConfig?.fileKey || '',
    teamId: initialConfig?.teamId,
    projectId: initialConfig?.projectId,
  });

  const updateConfig = useCallback((updates: Partial<FigmaConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const isConfigValid = useMemo(() => {
    return config.token.length > 0 && config.fileKey.length > 0;
  }, [config]);

  // ローカルストレージからの復元
  useEffect(() => {
    const savedConfig = localStorage.getItem('figmaConfig');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.warn('Failed to parse saved Figma config');
      }
    }
  }, []);

  // ローカルストレージへの保存
  useEffect(() => {
    if (isConfigValid) {
      localStorage.setItem('figmaConfig', JSON.stringify(config));
    }
  }, [config, isConfigValid]);

  return {
    config,
    updateConfig,
    isConfigValid,
    setToken: (token: string) => updateConfig({ token }),
    setFileKey: (fileKey: string) => updateConfig({ fileKey }),
    setTeamId: (teamId: string) => updateConfig({ teamId }),
    setProjectId: (projectId: string) => updateConfig({ projectId }),
  };
};

export default {
  useFigmaFile,
  useFigmaDesignTokens,
  useFigmaComponents,
  useFigmaComponentImage,
  useFigmaPrototype,
  useFigmaIntegration,
  useFigmaConfig,
};