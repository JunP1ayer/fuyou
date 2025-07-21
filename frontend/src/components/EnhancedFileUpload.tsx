import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material';
import {
  CloudUpload,
  Description,
  Image,
  PictureAsPdf,
  TableChart,
  Delete,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';

interface FileInfo {
  file: File;
  id: string;
  type: 'image' | 'excel' | 'csv' | 'pdf' | 'unknown';
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  result?: unknown;
}

interface EnhancedFileUploadProps {
  onFilesProcessed: (results: unknown[]) => void;
  onError: (error: string) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  disabled?: boolean;
}

const SUPPORTED_TYPES = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'excel',
  'application/vnd.ms-excel': 'excel',
  'text/csv': 'csv',
  'application/pdf': 'pdf',
} as const;

const DEFAULT_ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  '.xlsx',
  '.xls',
  '.csv',
  '.pdf',
];

export const EnhancedFileUpload: React.FC<EnhancedFileUploadProps> = ({
  onFilesProcessed,
  onError,
  maxFiles = 5,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  disabled = false,
}) => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ファイルタイプを判定
  const getFileType = (file: File): FileInfo['type'] => {
    if (SUPPORTED_TYPES[file.type as keyof typeof SUPPORTED_TYPES]) {
      return SUPPORTED_TYPES[file.type as keyof typeof SUPPORTED_TYPES];
    }

    // 拡張子で判定
    const extension = file.name.toLowerCase().split('.').pop();
    switch (extension) {
      case 'xlsx':
      case 'xls':
        return 'excel';
      case 'csv':
        return 'csv';
      case 'pdf':
        return 'pdf';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'webp':
        return 'image';
      default:
        return 'unknown';
    }
  };

  // ファイル追加
  const addFiles = (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);

    // ファイル数制限チェック
    if (files.length + fileArray.length > maxFiles) {
      onError(`最大${maxFiles}個までのファイルをアップロードできます`);
      return;
    }

    const fileInfos: FileInfo[] = fileArray.map(file => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      type: getFileType(file),
      status: 'pending',
      progress: 0,
    }));

    // サポートされていないファイルをチェック
    const unsupportedFiles = fileInfos.filter(f => f.type === 'unknown');
    if (unsupportedFiles.length > 0) {
      onError(
        `サポートされていないファイル形式: ${unsupportedFiles.map(f => f.file.name).join(', ')}`
      );
      return;
    }

    setFiles(prev => [...prev, ...fileInfos]);
  };

  // ファイル削除
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  // ファイル処理
  const processFiles = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    const results: unknown[] = [];

    for (const fileInfo of pendingFiles) {
      try {
        // ステータス更新
        setFiles(prev =>
          prev.map(f =>
            f.id === fileInfo.id
              ? { ...f, status: 'uploading', progress: 0 }
              : f
          )
        );

        // FormData作成
        const formData = new FormData();
        formData.append('file', fileInfo.file);
        formData.append('type', fileInfo.type);

        // アップロード進捗シミュレーション
        const progressInterval = setInterval(() => {
          setFiles(prev =>
            prev.map(f =>
              f.id === fileInfo.id && f.progress < 90
                ? { ...f, progress: f.progress + 10 }
                : f
            )
          );
        }, 200);

        // API呼び出し（ファイルタイプに応じて）
        const endpoint = getEndpointForFileType(fileInfo.type);

        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('demo_token')}`,
          },
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          throw new Error(`アップロードに失敗しました: ${response.statusText}`);
        }

        const result = await response.json();

        // 成功
        setFiles(prev =>
          prev.map(f =>
            f.id === fileInfo.id
              ? { ...f, status: 'completed', progress: 100, result }
              : f
          )
        );

        results.push(result);
      } catch (error) {
        setFiles(prev =>
          prev.map(f =>
            f.id === fileInfo.id
              ? {
                  ...f,
                  status: 'error',
                  progress: 0,
                  error:
                    error instanceof Error
                      ? error.message
                      : 'アップロードエラー',
                }
              : f
          )
        );
      }
    }

    if (results.length > 0) {
      onFilesProcessed(results);
    }
  };

  // ファイルタイプに応じたエンドポイント
  const getEndpointForFileType = (type: FileInfo['type']): string => {
    switch (type) {
      case 'image':
        return '/api/file-ocr/image';
      case 'excel':
        return '/api/file-ocr/excel';
      case 'csv':
        return '/api/file-ocr/csv';
      case 'pdf':
        return '/api/file-ocr/pdf';
      default:
        throw new Error('Unsupported file type');
    }
  };

  // ファイルアイコン
  const getFileIcon = (type: FileInfo['type']) => {
    switch (type) {
      case 'image':
        return <Image color="primary" />;
      case 'excel':
        return <TableChart color="success" />;
      case 'csv':
        return <Description color="info" />;
      case 'pdf':
        return <PictureAsPdf color="error" />;
      default:
        return <Description />;
    }
  };

  // ドラッグ&ドロップハンドラー
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    }
  };

  // ファイル選択
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      addFiles(selectedFiles);
    }
    // input値をリセット（同じファイルを再選択可能にする）
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const completedCount = files.filter(f => f.status === 'completed').length;
  const errorCount = files.filter(f => f.status === 'error').length;

  return (
    <Box>
      {/* ドラッグ&ドロップエリア */}
      <Card
        sx={{
          border: '2px dashed',
          borderColor: isDragOver ? 'primary.main' : 'grey.300',
          backgroundColor: isDragOver ? 'primary.50' : 'grey.50',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          mb: 2,
          opacity: disabled ? 0.6 : 1,
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            ファイルをドラッグ&ドロップ
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            または クリックしてファイルを選択
          </Typography>

          <Box
            display="flex"
            flexWrap="wrap"
            justifyContent="center"
            gap={1}
            mb={2}
          >
            <Chip label="画像 (JPG, PNG)" size="small" />
            <Chip label="Excel (.xlsx, .xls)" size="small" />
            <Chip label="CSV (.csv)" size="small" />
            <Chip label="PDF (.pdf)" size="small" />
          </Box>

          <Typography variant="caption" color="text.secondary">
            最大{maxFiles}個まで • 各ファイル10MB以下
          </Typography>
        </CardContent>
      </Card>

      {/* 隠しファイル入力 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {/* ファイルリスト */}
      {files.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6">
                アップロードファイル ({files.length})
              </Typography>
              <Box display="flex" gap={1}>
                {completedCount > 0 && (
                  <Chip
                    label={`完了: ${completedCount}`}
                    color="success"
                    size="small"
                  />
                )}
                {errorCount > 0 && (
                  <Chip
                    label={`エラー: ${errorCount}`}
                    color="error"
                    size="small"
                  />
                )}
              </Box>
            </Box>

            <List dense>
              {files.map((fileInfo, index) => (
                <React.Fragment key={fileInfo.id}>
                  <ListItem>
                    <Box display="flex" alignItems="center" mr={2}>
                      {getFileIcon(fileInfo.type)}
                    </Box>

                    <ListItemText
                      primary={fileInfo.file.name}
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {(fileInfo.file.size / 1024 / 1024).toFixed(2)} MB •{' '}
                            {fileInfo.type}
                          </Typography>
                          {fileInfo.status === 'uploading' && (
                            <LinearProgress
                              variant="determinate"
                              value={fileInfo.progress}
                              sx={{ mt: 1 }}
                            />
                          )}
                          {fileInfo.error && (
                            <Alert severity="error" sx={{ mt: 1 }}>
                              {fileInfo.error}
                            </Alert>
                          )}
                        </Box>
                      }
                    />

                    <ListItemSecondaryAction>
                      <Box display="flex" alignItems="center" gap={1}>
                        {fileInfo.status === 'completed' && (
                          <CheckCircle color="success" />
                        )}
                        {fileInfo.status === 'error' && (
                          <ErrorIcon color="error" />
                        )}
                        <IconButton
                          edge="end"
                          onClick={() => removeFile(fileInfo.id)}
                          disabled={fileInfo.status === 'uploading'}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < files.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>

            {pendingCount > 0 && (
              <Box mt={2} textAlign="center">
                <Button
                  variant="contained"
                  onClick={processFiles}
                  disabled={disabled}
                  startIcon={<CloudUpload />}
                >
                  {pendingCount}個のファイルを処理開始
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
