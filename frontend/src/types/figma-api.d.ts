// Type definitions for figma-api
declare module 'figma-api' {
  export interface ApiOptions {
    personalAccessToken?: string;
    oAuthToken?: string;
  }

  export interface FileResponse {
    name: string;
    lastModified: string;
    thumbnailUrl: string;
    version: string;
    role: string;
    editorType: string;
    linkAccess: string;
    document: Node;
    components: Record<string, Component>;
    styles: Record<string, Style>;
    schemaVersion: number;
  }

  export interface Node {
    id: string;
    name: string;
    type: string;
    visible?: boolean;
    children?: Node[];
    fills?: Paint[];
    strokes?: Paint[];
    strokeWeight?: number;
    backgroundColor?: Color;
    reactions?: Reaction[];
    prototypeStartNodeID?: string;
    [key: string]: any;
  }

  export interface Component {
    key: string;
    name: string;
    description: string;
    componentSetId?: string;
    created_at: string;
    updated_at: string;
  }

  export interface Style {
    key: string;
    name: string;
    description: string;
    styleType: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID';
    created_at: string;
    updated_at: string;
  }

  export interface Paint {
    type: string;
    color?: Color;
    [key: string]: any;
  }

  export interface Color {
    r: number;
    g: number;
    b: number;
    a: number;
  }

  export interface Reaction {
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

  export interface ComponentsResponse {
    meta: {
      components: Component[];
    };
  }

  export interface ImagesResponse {
    err: any;
    images: Record<string, string>;
  }

  export interface VariablesResponse {
    meta: {
      variables: Variable[];
      variableCollections: VariableCollection[];
    };
  }

  export interface Variable {
    id: string;
    name: string;
    key: string;
    variableCollectionId: string;
    resolvedType: 'BOOLEAN' | 'COLOR' | 'FLOAT' | 'STRING';
    defaultValue: any;
    valuesByMode: Record<string, any>;
  }

  export interface VariableCollection {
    id: string;
    name: string;
    defaultModeId: string;
    modes: Array<{
      modeId: string;
      name: string;
    }>;
  }

  export interface GetFileParams {
    file_key: string;
    version?: string;
    ids?: string;
    depth?: number;
    geometry?: string;
    plugin_data?: string;
    branch_data?: boolean;
  }

  export interface GetFileComponentsParams {
    file_key: string;
  }

  export interface GetImageParams {
    file_key: string;
    ids: string;
    scale?: number;
    format?: 'jpg' | 'png' | 'svg' | 'pdf';
    svg_include_id?: boolean;
    svg_simplify_stroke?: boolean;
    use_absolute_bounds?: boolean;
    version?: string;
  }

  export interface GetLocalVariablesParams {
    file_key: string;
  }

  export class Api {
    constructor(options: ApiOptions);
    
    getFile(params: GetFileParams): Promise<FileResponse>;
    getFileComponents(params: GetFileComponentsParams): Promise<ComponentsResponse>;
    getImage(params: GetImageParams): Promise<ImagesResponse>;
    getLocalVariables(params: GetLocalVariablesParams): Promise<VariablesResponse>;
    getMe(): Promise<any>;
  }

  export default Api;
}