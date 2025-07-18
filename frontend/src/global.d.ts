// Global type declarations for missing modules

// Vite module declarations
declare module 'vite' {
  const vite: any;
  export default vite;
  export * from 'vite';
}

declare module '@vitejs/plugin-react' {
  const pluginReact: any;
  export default pluginReact;
}

// React DOM client module declarations
declare module 'react-dom/client' {
  import * as ReactDOM from 'react-dom';
  
  export interface Root {
    render(children: React.ReactNode): void;
    unmount(): void;
  }
  
  export function createRoot(container: Element | DocumentFragment): Root;
  export function hydrateRoot(container: Element | DocumentFragment, initialChildren: React.ReactNode): Root;
  
  // Re-export everything from react-dom
  export * from 'react-dom';
}

// CSS import types
declare module '*.css' {
  const content: string;
  export default content;
}

// Image import types
declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.jpeg' {
  const value: string;
  export default value;
}

declare module '*.gif' {
  const value: string;
  export default value;
}

declare module '*.svg' {
  const value: string;
  export default value;
}