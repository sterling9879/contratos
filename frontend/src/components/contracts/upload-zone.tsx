'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface UploadZoneProps {
  onUpload: (file: File) => Promise<{ success: boolean; error?: string }>;
  maxSize?: number;
  acceptedFormats?: string[];
}

export function UploadZone({
  onUpload,
  maxSize = 20 * 1024 * 1024, // 20MB
  acceptedFormats = ['.pdf', '.docx'],
}: UploadZoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setUploadStatus('idle');
      setErrorMessage('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize,
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('idle');

    try {
      const result = await onUpload(file);
      if (result.success) {
        setUploadStatus('success');
        setTimeout(() => {
          setFile(null);
          setUploadStatus('idle');
        }, 2000);
      } else {
        setUploadStatus('error');
        setErrorMessage(result.error || 'Erro ao fazer upload');
      }
    } catch (error) {
      setUploadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao fazer upload');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setUploadStatus('idle');
    setErrorMessage('');
  };

  return (
    <div className="w-full">
      {!file ? (
        <div
          {...getRootProps()}
          className={cn(
            'relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer',
            isDragActive && !isDragReject && 'border-primary bg-primary/5',
            isDragReject && 'border-destructive bg-destructive/5',
            !isDragActive && 'border-border hover:border-primary/50 hover:bg-accent/50'
          )}
        >
          <input {...getInputProps()} />
          <Upload
            className={cn(
              'h-12 w-12 mb-4 transition-colors',
              isDragActive && !isDragReject && 'text-primary',
              isDragReject && 'text-destructive',
              !isDragActive && 'text-muted-foreground'
            )}
          />
          <p className="text-lg font-medium mb-1">
            {isDragActive
              ? isDragReject
                ? 'Formato nao suportado'
                : 'Solte o arquivo aqui'
              : 'Arraste e solte seu contrato'}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            ou clique para selecionar
          </p>
          <p className="text-xs text-muted-foreground">
            Formatos aceitos: {acceptedFormats.join(', ')} | Tamanho maximo: {formatFileSize(maxSize)}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-xl border-border">
          <div className="flex items-center gap-4 w-full max-w-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{file.name}</p>
              <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
            </div>
            {uploadStatus === 'success' && (
              <CheckCircle className="h-6 w-6 text-green-500" />
            )}
            {uploadStatus === 'error' && (
              <AlertCircle className="h-6 w-6 text-destructive" />
            )}
            {uploadStatus === 'idle' && !isUploading && (
              <Button variant="ghost" size="icon" onClick={removeFile}>
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          {errorMessage && (
            <p className="mt-4 text-sm text-destructive">{errorMessage}</p>
          )}

          {uploadStatus !== 'success' && (
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={removeFile} disabled={isUploading}>
                Cancelar
              </Button>
              <Button onClick={handleUpload} isLoading={isUploading}>
                {isUploading ? 'Enviando...' : 'Fazer Upload'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
