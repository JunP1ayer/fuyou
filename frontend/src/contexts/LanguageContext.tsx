// 🌍 言語管理コンテキスト

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  isLanguageSelected: boolean;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// 翻訳データ
const translations = {
  ja: {
    'app.name': '扶養管理カレンダー',
    'app.description': '学生向け扶養控除管理システム',
    'auth.login': 'ログイン',
    'auth.signup': '新規登録',
    'auth.email': 'メールアドレス',
    'auth.password': 'パスワード',
    'auth.confirmPassword': 'パスワード（確認）',
    'auth.name': 'お名前',
    'auth.forgotPassword': 'パスワードを忘れた方',
    'auth.createAccount': 'アカウント作成',
    'auth.loginButton': 'ログイン',
    'auth.passwordHelper': '8文字以上、大文字・数字を含む',
    'auth.agreement': 'ログインにより、利用規約とプライバシーポリシーに同意するものとします',
    'loading.starting': 'アプリを起動しています...',
    'loading.authenticating': '認証情報を確認しています...',
    'loading.processing': '処理中です...',
    'common.cancel': 'キャンセル',
    'common.save': '保存',
    'common.delete': '削除',
    'common.none': 'なし',
    'language.select': '言語を選択',
    'language.selectDescription': '使用する言語を選択してください',
    'language.changeAnytime': '設定からいつでも変更できます',
  },
  en: {
    'app.name': 'Dependent Management Calendar',
    'app.description': 'Tax dependent management system for students',
    'auth.login': 'Login',
    'auth.signup': 'Sign Up',
    'auth.email': 'Email Address',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.name': 'Full Name',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.createAccount': 'Create Account',
    'auth.loginButton': 'Sign In',
    'auth.passwordHelper': '8+ characters with uppercase and numbers',
    'auth.agreement': 'By signing in, you agree to our Terms and Privacy Policy',
    'loading.starting': 'Starting application...',
    'loading.authenticating': 'Checking authentication...',
    'loading.processing': 'Processing...',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.none': 'None',
    'language.select': 'Select Language',
    'language.selectDescription': 'Please select your preferred language',
    'language.changeAnytime': 'You can change this anytime in settings',
  },
  ko: {
    'app.name': '부양 관리 캘린더',
    'app.description': '학생을 위한 부양 공제 관리 시스템',
    'auth.login': '로그인',
    'auth.signup': '회원가입',
    'auth.email': '이메일 주소',
    'auth.password': '비밀번호',
    'auth.confirmPassword': '비밀번호 확인',
    'auth.name': '이름',
    'auth.forgotPassword': '비밀번호를 잊으셨나요?',
    'auth.createAccount': '계정 만들기',
    'auth.loginButton': '로그인',
    'auth.passwordHelper': '8자 이상, 대문자 및 숫자 포함',
    'auth.agreement': '로그인하면 이용약관 및 개인정보처리방침에 동의하는 것으로 간주됩니다',
    'loading.starting': '앱을 시작하는 중...',
    'loading.authenticating': '인증 정보를 확인하는 중...',
    'loading.processing': '처리 중...',
    'common.cancel': '취소',
    'common.save': '저장',
    'common.delete': '삭제',
    'common.none': '없음',
    'language.select': '언어 선택',
    'language.selectDescription': '사용할 언어를 선택해주세요',
    'language.changeAnytime': '설정에서 언제든지 변경할 수 있습니다',
  },
  zh: {
    'app.name': '抚养管理日历',
    'app.description': '面向学生的税务抚养管理系统',
    'auth.login': '登录',
    'auth.signup': '注册',
    'auth.email': '电子邮件地址',
    'auth.password': '密码',
    'auth.confirmPassword': '确认密码',
    'auth.name': '姓名',
    'auth.forgotPassword': '忘记密码？',
    'auth.createAccount': '创建账户',
    'auth.loginButton': '登录',
    'auth.passwordHelper': '8个字符以上，包含大写字母和数字',
    'auth.agreement': '登录即表示您同意我们的条款和隐私政策',
    'loading.starting': '正在启动应用程序...',
    'loading.authenticating': '正在检查身份验证...',
    'loading.processing': '处理中...',
    'common.cancel': '取消',
    'common.save': '保存',
    'common.delete': '删除',
    'common.none': '无',
    'language.select': '选择语言',
    'language.selectDescription': '请选择您的首选语言',
    'language.changeAnytime': '您可以随时在设置中更改',
  },
  'zh-TW': {
    'app.name': '扶養管理行事曆',
    'app.description': '學生稅務扶養管理系統',
    'auth.login': '登入',
    'auth.signup': '註冊',
    'auth.email': '電子郵件地址',
    'auth.password': '密碼',
    'auth.confirmPassword': '確認密碼',
    'auth.name': '姓名',
    'auth.forgotPassword': '忘記密碼？',
    'auth.createAccount': '建立帳戶',
    'auth.loginButton': '登入',
    'auth.passwordHelper': '8個字元以上，包含大寫字母和數字',
    'auth.agreement': '登入即表示您同意我們的條款和隱私政策',
    'loading.starting': '正在啟動應用程式...',
    'loading.authenticating': '正在檢查身份驗證...',
    'loading.processing': '處理中...',
    'common.cancel': '取消',
    'common.save': '儲存',
    'common.delete': '刪除',
    'common.none': '無',
    'language.select': '選擇語言',
    'language.selectDescription': '請選擇您的首選語言',
    'language.changeAnytime': '您可以隨時在設定中變更',
  },
  es: {
    'app.name': 'Calendario de Gestión de Dependientes',
    'app.description': 'Sistema de gestión de dependientes fiscales para estudiantes',
    'auth.login': 'Iniciar Sesión',
    'auth.signup': 'Registrarse',
    'auth.email': 'Correo Electrónico',
    'auth.password': 'Contraseña',
    'auth.confirmPassword': 'Confirmar Contraseña',
    'auth.name': 'Nombre Completo',
    'auth.forgotPassword': '¿Olvidaste tu contraseña?',
    'auth.createAccount': 'Crear Cuenta',
    'auth.loginButton': 'Entrar',
    'auth.passwordHelper': '8+ caracteres con mayúsculas y números',
    'auth.agreement': 'Al iniciar sesión, aceptas nuestros Términos y Política de Privacidad',
    'loading.starting': 'Iniciando aplicación...',
    'loading.authenticating': 'Verificando autenticación...',
    'loading.processing': 'Procesando...',
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',
    'common.delete': 'Eliminar',
    'common.none': 'Ninguno',
    'language.select': 'Seleccionar Idioma',
    'language.selectDescription': 'Por favor selecciona tu idioma preferido',
    'language.changeAnytime': 'Puedes cambiar esto en cualquier momento en la configuración',
  },
  pt: {
    'app.name': 'Calendário de Gestão de Dependentes',
    'app.description': 'Sistema de gestão de dependentes fiscais para estudantes',
    'auth.login': 'Entrar',
    'auth.signup': 'Cadastrar',
    'auth.email': 'Endereço de E-mail',
    'auth.password': 'Senha',
    'auth.confirmPassword': 'Confirmar Senha',
    'auth.name': 'Nome Completo',
    'auth.forgotPassword': 'Esqueceu a senha?',
    'auth.createAccount': 'Criar Conta',
    'auth.loginButton': 'Entrar',
    'auth.passwordHelper': '8+ caracteres com maiúsculas e números',
    'auth.agreement': 'Ao entrar, você concorda com nossos Termos e Política de Privacidade',
    'loading.starting': 'Iniciando aplicação...',
    'loading.authenticating': 'Verificando autenticação...',
    'loading.processing': 'Processando...',
    'common.cancel': 'Cancelar',
    'common.save': 'Salvar',
    'common.delete': 'Excluir',
    'common.none': 'Nenhum',
    'language.select': 'Selecionar Idioma',
    'language.selectDescription': 'Por favor selecione seu idioma preferido',
    'language.changeAnytime': 'Você pode alterar isso a qualquer momento nas configurações',
  },
  fr: {
    'app.name': 'Calendrier de Gestion des Personnes à Charge',
    'app.description': 'Système de gestion fiscale des personnes à charge pour étudiants',
    'auth.login': 'Connexion',
    'auth.signup': "S'inscrire",
    'auth.email': 'Adresse E-mail',
    'auth.password': 'Mot de passe',
    'auth.confirmPassword': 'Confirmer le mot de passe',
    'auth.name': 'Nom Complet',
    'auth.forgotPassword': 'Mot de passe oublié ?',
    'auth.createAccount': 'Créer un Compte',
    'auth.loginButton': 'Se Connecter',
    'auth.passwordHelper': '8+ caractères avec majuscules et chiffres',
    'auth.agreement': 'En vous connectant, vous acceptez nos Conditions et notre Politique de Confidentialité',
    'loading.starting': "Démarrage de l'application...",
    'loading.authenticating': "Vérification de l'authentification...",
    'loading.processing': 'Traitement en cours...',
    'common.cancel': 'Annuler',
    'common.save': 'Enregistrer',
    'common.delete': 'Supprimer',
    'common.none': 'Aucun',
    'language.select': 'Sélectionner la Langue',
    'language.selectDescription': 'Veuillez sélectionner votre langue préférée',
    'language.changeAnytime': 'Vous pouvez modifier cela à tout moment dans les paramètres',
  },
  de: {
    'app.name': 'Unterhaltsberechtigte-Verwaltungskalender',
    'app.description': 'Steuerliches Verwaltungssystem für Unterhaltsberechtigte für Studierende',
    'auth.login': 'Anmelden',
    'auth.signup': 'Registrieren',
    'auth.email': 'E-Mail-Adresse',
    'auth.password': 'Passwort',
    'auth.confirmPassword': 'Passwort bestätigen',
    'auth.name': 'Vollständiger Name',
    'auth.forgotPassword': 'Passwort vergessen?',
    'auth.createAccount': 'Konto erstellen',
    'auth.loginButton': 'Anmelden',
    'auth.passwordHelper': '8+ Zeichen mit Großbuchstaben und Zahlen',
    'auth.agreement': 'Mit der Anmeldung stimmen Sie unseren Bedingungen und Datenschutzrichtlinien zu',
    'loading.starting': 'Anwendung wird gestartet...',
    'loading.authenticating': 'Authentifizierung wird überprüft...',
    'loading.processing': 'Verarbeitung...',
    'common.cancel': 'Abbrechen',
    'common.save': 'Speichern',
    'common.delete': 'Löschen',
    'common.none': 'Keine',
    'language.select': 'Sprache auswählen',
    'language.selectDescription': 'Bitte wählen Sie Ihre bevorzugte Sprache',
    'language.changeAnytime': 'Sie können dies jederzeit in den Einstellungen ändern',
  },
  vi: {
    'app.name': 'Lịch Quản Lý Người Phụ Thuộc',
    'app.description': 'Hệ thống quản lý người phụ thuộc thuế cho sinh viên',
    'auth.login': 'Đăng Nhập',
    'auth.signup': 'Đăng Ký',
    'auth.email': 'Địa chỉ Email',
    'auth.password': 'Mật khẩu',
    'auth.confirmPassword': 'Xác nhận mật khẩu',
    'auth.name': 'Họ và Tên',
    'auth.forgotPassword': 'Quên mật khẩu?',
    'auth.createAccount': 'Tạo Tài Khoản',
    'auth.loginButton': 'Đăng Nhập',
    'auth.passwordHelper': '8+ ký tự với chữ hoa và số',
    'auth.agreement': 'Bằng cách đăng nhập, bạn đồng ý với Điều khoản và Chính sách Bảo mật của chúng tôi',
    'loading.starting': 'Đang khởi động ứng dụng...',
    'loading.authenticating': 'Đang kiểm tra xác thực...',
    'loading.processing': 'Đang xử lý...',
    'common.cancel': 'Hủy',
    'common.save': 'Lưu',
    'common.delete': 'Xóa',
    'common.none': 'Không có',
    'language.select': 'Chọn Ngôn Ngữ',
    'language.selectDescription': 'Vui lòng chọn ngôn ngữ ưa thích của bạn',
    'language.changeAnytime': 'Bạn có thể thay đổi bất cứ lúc nào trong cài đặt',
  },
  th: {
    'app.name': 'ปฏิทินการจัดการผู้อยู่ในอุปการะ',
    'app.description': 'ระบบการจัดการผู้อยู่ในอุปการะทางภาษีสำหรับนักศึกษา',
    'auth.login': 'เข้าสู่ระบบ',
    'auth.signup': 'สมัครสมาชิก',
    'auth.email': 'ที่อยู่อีเมล',
    'auth.password': 'รหัสผ่าน',
    'auth.confirmPassword': 'ยืนยันรหัสผ่าน',
    'auth.name': 'ชื่อเต็ม',
    'auth.forgotPassword': 'ลืมรหัสผ่าน?',
    'auth.createAccount': 'สร้างบัญชี',
    'auth.loginButton': 'เข้าสู่ระบบ',
    'auth.passwordHelper': '8+ ตัวอักษรพร้อมตัวพิมพ์ใหญ่และตัวเลข',
    'auth.agreement': 'การเข้าสู่ระบบหมายความว่าคุณยอมรับข้อกำหนดและนโยบายความเป็นส่วนตัวของเรา',
    'loading.starting': 'กำลังเริ่มแอปพลิเคชัน...',
    'loading.authenticating': 'กำลังตรวจสอบการยืนยันตัวตน...',
    'loading.processing': 'กำลังดำเนินการ...',
    'common.cancel': 'ยกเลิก',
    'common.save': 'บันทึก',
    'common.delete': 'ลบ',
    'common.none': 'ไม่มี',
    'language.select': 'เลือกภาษา',
    'language.selectDescription': 'กรุณาเลือกภาษาที่คุณต้องการ',
    'language.changeAnytime': 'คุณสามารถเปลี่ยนได้ตลอดเวลาในการตั้งค่า',
  },
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<string>('ja'); // デフォルトを日本語に
  const [isLanguageSelected, setIsLanguageSelected] = useState(false); // 初期値をfalseに変更

  useEffect(() => {
    // ローカルストレージから言語設定を復元
    const savedLanguage = localStorage.getItem('app_language');
    const hasSelectedLanguage = localStorage.getItem('app_language_selected');
    
    if (savedLanguage && translations[savedLanguage as keyof typeof translations]) {
      setLanguageState(savedLanguage);
      setIsLanguageSelected(hasSelectedLanguage === 'true');
    } else {
      // デフォルト言語を設定
      localStorage.setItem('app_language', 'ja');
      setIsLanguageSelected(false); // まだ選択されていない
    }
  }, []);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    setIsLanguageSelected(true);
    localStorage.setItem('app_language', lang);
    localStorage.setItem('app_language_selected', 'true');
  };

  const t = (key: string, fallback?: string): string => {
    if (!language || !translations[language as keyof typeof translations]) {
      return fallback || key;
    }
    
    const langTranslations = translations[language as keyof typeof translations];
    return langTranslations[key as keyof typeof langTranslations] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      isLanguageSelected,
      t,
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};