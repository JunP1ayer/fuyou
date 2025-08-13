// シフトテンプレート管理ストア
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ShiftTemplate {
  id: string;
  name: string;
  category?: 'shift' | 'personal';
  workplaceName: string;
  startTime: string;
  endTime: string;
  hourlyRate: number;
  description?: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
}

interface ShiftTemplateState {
  // データ
  templates: ShiftTemplate[];
  
  // テンプレート管理
  addTemplate: (template: Omit<ShiftTemplate, 'id' | 'createdAt'>) => void;
  updateTemplate: (id: string, updates: Partial<ShiftTemplate>) => void;
  deleteTemplate: (id: string) => void;
  setDefaultTemplate: (id: string) => void;
  
  // ユーティリティ
  getDefaultTemplate: () => ShiftTemplate | undefined;
  getTemplatesByWorkplace: (workplaceName: string) => ShiftTemplate[];
}

// デフォルトテンプレートは表示不要のため空配列のまま
const DEFAULT_TEMPLATES: Omit<ShiftTemplate, 'id' | 'createdAt'>[] = [];

export const useShiftTemplateStore = create<ShiftTemplateState>()(
  persist(
    (set, get) => ({
      // 初期状態
      templates: [],
      
      // テンプレート追加
      addTemplate: (templateData) => {
        const newTemplate: ShiftTemplate = {
          ...templateData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        
        set(state => ({
          templates: [...state.templates, newTemplate]
        }));
      },
      
      // テンプレート更新
      updateTemplate: (id, updates) => {
        set(state => ({
          templates: state.templates.map(template => 
            template.id === id ? { ...template, ...updates } : template
          )
        }));
      },
      
      // テンプレート削除
      deleteTemplate: (id) => {
        set(state => ({
          templates: state.templates.filter(template => template.id !== id)
        }));
      },
      
      // デフォルトテンプレート設定
      setDefaultTemplate: (id) => {
        set(state => ({
          templates: state.templates.map(template => ({
            ...template,
            isDefault: template.id === id
          }))
        }));
      },
      
      // デフォルトテンプレート取得
      getDefaultTemplate: () => {
        return get().templates.find(template => template.isDefault);
      },
      
      // 職場別テンプレート取得
      getTemplatesByWorkplace: (workplaceName) => {
        return get().templates.filter(template => 
          template.workplaceName === workplaceName || template.workplaceName === ''
        );
      },
    }),
    {
      name: 'shift-template-storage',
      onRehydrateStorage: () => (state) => {
        // 初期化時にデフォルトテンプレートがない場合は追加
        if (state && state.templates.length === 0) {
          DEFAULT_TEMPLATES.forEach(template => {
            state.addTemplate(template);
          });
        }
      },
    }
  )
);