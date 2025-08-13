// 🤖 GPT-5 AI アシスタント - 扶養管理の相談機能

import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  IconButton,
  Paper,
  Divider,
  Avatar,
  CircularProgress,
  Fade,
  Alert,
} from '@mui/material';
import {
  Send,
  AttachFile,
  SmartToy,
  Person,
  PhotoCamera,
  Clear,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  imageUrl?: string;
}

interface GPT5AssistantProps {
  onShiftData?: (shifts: any[]) => void;
}

export const GPT5Assistant: React.FC<GPT5AssistantProps> = ({ onShiftData }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '👋 こんにちは！扶養管理のAIアシスタントです。\n\n以下のことをお手伝いできます：\n• 扶養控除の計算や相談\n• シフト表の画像解析\n• 年収予測とアドバイス\n• 税制改正の最新情報\n\nお気軽にご相談ください！',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() && !selectedImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText || '画像を送信しました',
      isUser: true,
      timestamp: new Date(),
      imageUrl: imagePreview || undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

      // 利用可能プロバイダを取得（障害時のフェイルオーバー用）
      const resolveProviders = async (): Promise<string[]> => {
        try {
          const token = (() => { try { return JSON.parse(localStorage.getItem('auth')||'{}')?.token || ''; } catch { return ''; } })();
          const res = await fetch(`${API}/intelligent-ocr/status`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
          const st = await res.json();
          const order: string[] = st?.data?.recommendedOrder || ['gemini','openai','vision'];
          const providers: string[] = order.filter((p: string) => st?.data?.providers?.[p]?.available);
          return providers.length > 0 ? providers : ['gemini','openai'];
        } catch {
          return ['gemini','openai'];
        }
      };

      let data: any;
      if (selectedImage) {
        const token = (() => { try { return JSON.parse(localStorage.getItem('auth')||'{}')?.token || ''; } catch { return ''; } })();
        const providers = await resolveProviders();

        const doRequest = async (aiProviders: string[]) => {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 20000);
          try {
            const response = await fetch(`${API}/intelligent-ocr/process`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
              body: JSON.stringify({
                image: imagePreview,
                userName: undefined,
                processingOptions: { aiProviders, enableComparison: aiProviders.length > 1 },
              }),
              signal: controller.signal,
            });
            clearTimeout(timeout);
            return await response.json();
          } catch (e) {
            clearTimeout(timeout);
            throw e;
          }
        };

        // 1回目（利用可能な順の複合）
        data = await doRequest(providers);
        // 失敗ならGemini単独→OpenAI単独の順で再試行
        if (!data?.success) {
          if (providers.includes('gemini')) {
            try { data = await doRequest(['gemini']); } catch {}
          }
          if (!data?.success && providers.includes('openai')) {
            try { data = await doRequest(['openai']); } catch {}
          }
        }
      } else {
        // テキスト問い合わせは簡易応答（将来拡張）
        data = { response: 'ご質問ありがとうございます。画像を送付いただければシフト解析を実施します。' };
      }

      let assistantText = '';
      
      if (data?.success && selectedImage) {
        // シフト表解析の場合
        const rec = data.data?.consolidatedResult?.recommendedShifts || [];
        if (rec.length > 0) {
          assistantText = `✅ シフト表を解析しました！\n\n📅 **検出されたシフト情報:**\n`;
          rec.forEach((shift: any, index: number) => {
            assistantText += `${index + 1}. ${shift.date} ${shift.startTime}-${shift.endTime}\n`;
          });
          assistantText += `\n💡 このデータをシフトカレンダーに追加しますか？`;
          
          // 親コンポーネントにシフトデータを渡す
          onShiftData?.(rec);
        } else {
          assistantText = '申し訳ありません。シフト情報を検出できませんでした。より鮮明な画像をお試しください。';
        }
      } else if (data.response) {
        // GPTチャットの場合
        assistantText = data.response;
      } else {
        assistantText = 'エラーが発生しました。もう一度お試しください。';
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: assistantText,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: '申し訳ありません。接続エラーが発生しました。しばらく待ってから再度お試しください。',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
    clearImage();
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const quickPrompts = [
    '扶養控除の限度額を教えて',
    '来年の年収予測をお願いします',
    '学生特例について詳しく',
    'おすすめの働き方は？',
  ];

  return (
    <Card sx={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <SmartToy sx={{ color: 'primary.main', fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            GPT-5 扶養アシスタント
          </Typography>
          <Box
            sx={{
              ml: 'auto',
              px: 1,
              py: 0.5,
              bgcolor: 'success.light',
              borderRadius: 1,
            }}
          >
            <Typography variant="caption" sx={{ color: 'success.dark', fontWeight: 600 }}>
              AI POWERED
            </Typography>
          </Box>
        </Box>
      </CardContent>

      {/* メッセージ表示エリア */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          px: 2,
          py: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                  mb: 1,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1,
                    maxWidth: '80%',
                    flexDirection: message.isUser ? 'row-reverse' : 'row',
                  }}
                >
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: message.isUser ? 'primary.main' : 'secondary.main',
                    }}
                  >
                    {message.isUser ? <Person /> : <SmartToy />}
                  </Avatar>
                  
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      bgcolor: message.isUser ? 'primary.light' : 'grey.100',
                      color: message.isUser ? 'primary.contrastText' : 'text.primary',
                      borderRadius: 2,
                    }}
                  >
                    {message.imageUrl && (
                      <Box sx={{ mb: 1 }}>
                        <img
                          src={message.imageUrl}
                          alt="送信された画像"
                          style={{
                            maxWidth: '200px',
                            maxHeight: '200px',
                            borderRadius: '8px',
                          }}
                        />
                      </Box>
                    )}
                    <Typography
                      variant="body2"
                      sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                    >
                      {message.text}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 0.5,
                        opacity: 0.7,
                      }}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <Fade in={isLoading}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                  <SmartToy />
                </Avatar>
                <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2">考え中...</Typography>
                  </Box>
                </Paper>
              </Box>
            </Box>
          </Fade>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* クイックプロンプト */}
      {messages.length <= 1 && (
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'text.secondary' }}>
            よくある質問:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {quickPrompts.map((prompt, index) => (
              <Button
                key={index}
                variant="outlined"
                size="small"
                onClick={() => setInputText(prompt)}
                sx={{ borderRadius: 2, fontSize: '0.75rem' }}
              >
                {prompt}
              </Button>
            ))}
          </Box>
        </Box>
      )}

      <Divider />

      {/* 入力エリア */}
      <Box sx={{ p: 2 }}>
        {/* 画像プレビュー */}
        {imagePreview && (
          <Box sx={{ mb: 2, position: 'relative', display: 'inline-block' }}>
            <img
              src={imagePreview}
              alt="プレビュー"
              style={{
                maxWidth: '100px',
                maxHeight: '100px',
                borderRadius: '8px',
                border: '2px solid #ddd',
              }}
            />
            <IconButton
              size="small"
              onClick={clearImage}
              sx={{
                position: 'absolute',
                top: -8,
                right: -8,
                bgcolor: 'error.main',
                color: 'white',
                width: 20,
                height: 20,
                '&:hover': { bgcolor: 'error.dark' },
              }}
            >
              <Clear sx={{ fontSize: 12 }} />
            </IconButton>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            multiline
            maxRows={3}
            fullWidth
            placeholder="扶養について何でもご相談ください..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />

          <input
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: 'none' }}
            ref={fileInputRef}
          />

          <IconButton
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            sx={{
              bgcolor: 'grey.100',
              '&:hover': { bgcolor: 'grey.200' },
            }}
          >
            <PhotoCamera />
          </IconButton>

          <Button
            variant="contained"
            onClick={sendMessage}
            disabled={isLoading || (!inputText.trim() && !selectedImage)}
            sx={{
              minWidth: 44,
              height: 44,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
              },
            }}
          >
            <Send />
          </Button>
        </Box>
      </Box>
    </Card>
  );
};