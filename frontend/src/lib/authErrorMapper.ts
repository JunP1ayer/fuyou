// 認証エラーをユーザー向けの日本語メッセージに変換

export function toFriendlyAuthMessage(error: unknown): string {
  const raw = normalizeErrorMessage(error);
  const msg = raw.toLowerCase();

  // 未確認メール
  if (msg.includes('email') && (msg.includes('not confirmed') || msg.includes('unconfirmed'))) {
    return 'メールアドレスが未確認です。受信ボックスの確認メールを開くか、確認メールを再送してください。';
  }

  // 期限切れ / 無効リンク
  if (msg.includes('otp') && (msg.includes('expired') || msg.includes('invalid'))) {
    return 'リンクの有効期限が切れているか無効です。もう一度お試しください。';
  }

  // 不正な資格情報
  if (msg.includes('invalid login') || msg.includes('invalid credentials') || msg.includes('invalid email or password')) {
    return 'メールアドレスまたはパスワードが正しくありません。';
  }

  // レート制限
  if (msg.includes('rate') && msg.includes('limit')) {
    return '短時間に多数のリクエストが行われました。しばらく待ってから再度お試しください。';
  }

  // ネットワーク
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'ネットワークエラーが発生しました。通信環境を確認して再度お試しください。';
  }

  return raw || '認証に失敗しました。時間をおいて再度お試しください。';
}

export function isEmailNotConfirmed(error: unknown): boolean {
  const msg = normalizeErrorMessage(error).toLowerCase();
  return msg.includes('email') && (msg.includes('not confirmed') || msg.includes('unconfirmed'));
}

function normalizeErrorMessage(error: unknown): string {
  if (!error) return '';
  if (error instanceof Error) return error.message || '';
  try {
    // Supabase エラーオブジェクトの message フィールドを優先
    const anyErr: any = error as any;
    return anyErr?.message || JSON.stringify(anyErr);
  } catch {
    return String(error);
  }
}


