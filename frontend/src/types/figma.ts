// Figma API types and interfaces

export interface FigmaConfig {
  token: string;
  fileKey: string;
  teamId?: string;
  projectId?: string;
}

export interface DesignTokens {
  colors: Record<string, string>;
  typography: Record<string, TypographyStyle>;
  spacing: Record<string, string>;
  shadows?: Record<string, string>;
  borderRadius?: Record<string, string>;
  lastUpdated: string;
}

export interface TypographyStyle {
  fontFamily: string;
  fontSize: string;
  fontWeight: number | string;
  lineHeight: string;
  letterSpacing?: string;
}

export interface FigmaComponent {
  id: string;
  name: string;
  description: string;
  type: 'component' | 'variant' | 'instance';
  createdAt: string;
  updatedAt: string;
  componentSetId?: string;
  thumbnail?: string;
}

export interface FigmaVariable {
  id: string;
  name: string;
  key: string;
  variableCollectionId: string;
  resolvedType: 'BOOLEAN' | 'COLOR' | 'FLOAT' | 'STRING';
  defaultValue: any;
  valuesByMode: Record<string, any>;
}

export interface FigmaFile {
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
  role: string;
  editorType: string;
  linkAccess: string;
}

export interface FigmaTeam {
  id: string;
  name: string;
}

export interface FigmaProject {
  id: string;
  name: string;
}

export interface PrototypeFlow {
  id: string;
  name: string;
  startingPoint: {
    nodeId: string;
    name: string;
  };
}

export interface PrototypeInteraction {
  trigger: {
    type: string;
    delay?: number;
  };
  actions: Array<{
    type: string;
    destinationId?: string;
    navigation?: string;
    transition?: {
      type: string;
      duration: number;
      easing: string;
    };
  }>;
}

export interface FigmaError {
  message: string;
  statusCode?: number;
  endpoint?: string;
}

// Design token export formats
export type ExportFormat = 'css' | 'scss' | 'javascript' | 'typescript' | 'json';

export interface ExportOptions {
  format: ExportFormat;
  includeComments?: boolean;
  cssVariablePrefix?: string;
  jsExportType?: 'const' | 'export';
}

// Sync settings
export interface SyncSettings {
  autoRefresh: boolean;
  refreshInterval: number; // minutes
  syncOnStartup: boolean;
  includeTokens: boolean;
  includeComponents: boolean;
  includePrototypes: boolean;
}

// Cache settings
export interface CacheSettings {
  enabled: boolean;
  ttl: number; // milliseconds
  maxEntries: number;
}

// Figma integration status
export interface IntegrationStatus {
  connected: boolean;
  lastSync?: string;
  syncInProgress: boolean;
  errors: string[];
  warnings: string[];
}

// Component metadata
export interface ComponentMetadata {
  variants?: Array<{
    id: string;
    name: string;
    properties: Record<string, string>;
  }>;
  properties?: Record<string, any>;
  documentation?: string;
  tags?: string[];
}

// Design system structure
export interface DesignSystem {
  tokens: DesignTokens;
  components: FigmaComponent[];
  metadata: {
    name: string;
    version: string;
    description: string;
    lastUpdated: string;
    source: {
      fileKey: string;
      fileName: string;
      fileUrl: string;
    };
  };
}

export default {
  FigmaConfig,
  DesignTokens,
  FigmaComponent,
  FigmaVariable,
  FigmaFile,
  PrototypeFlow,
  PrototypeInteraction,
  ExportFormat,
  ExportOptions,
  SyncSettings,
  IntegrationStatus,
  DesignSystem,
};