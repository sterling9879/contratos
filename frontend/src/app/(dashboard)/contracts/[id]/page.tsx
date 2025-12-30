'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Play, Loader2, MessageSquare, X } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnalysisView } from '@/components/contracts/analysis-view';
import { ChatSidebar } from '@/components/contracts/chat-sidebar';
import { useContracts } from '@/hooks/useContracts';
import { contractService } from '@/services/contractService';
import { ChatMessage, ContractAnalysis } from '@/types';
import { formatFileSize, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contractId = params.id as string;

  const {
    currentContract,
    currentAnalysis,
    isLoading,
    isAnalyzing,
    fetchContract,
    analyzeContract,
    setCurrentAnalysis,
  } = useContracts();

  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    fetchContract(contractId);
  }, [contractId, fetchContract]);

  useEffect(() => {
    if (currentContract?.chatMessages) {
      setChatMessages(currentContract.chatMessages);
    }
  }, [currentContract]);

  const handleAnalyze = async () => {
    const analysis = await analyzeContract(contractId);
    if (analysis) {
      setCurrentAnalysis(analysis);
    }
  };

  const handleSendMessage = async (message: string) => {
    try {
      // Add user message immediately
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'USER',
        content: message,
        createdAt: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, userMessage]);

      // Send to API
      const response = await contractService.sendChatMessage(contractId, message);
      setChatMessages((prev) => [...prev, response]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentContract) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">Contrato nao encontrado</p>
        <Button variant="outline" onClick={() => router.push('/contracts')}>
          Voltar para contratos
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className={`flex-1 transition-all duration-300 ${showChat ? 'mr-96' : ''}`}>
        <Header title={currentContract.fileName} />

        <div className="p-6">
          {/* Back button and actions */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => router.push('/contracts')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>

            <div className="flex items-center gap-3">
              {!currentAnalysis && currentContract.status !== 'PROCESSING' && (
                <Button onClick={handleAnalyze} isLoading={isAnalyzing}>
                  <Play className="h-4 w-4 mr-2" />
                  Analisar Contrato
                </Button>
              )}

              {currentAnalysis && (
                <Button
                  variant="outline"
                  onClick={() => setShowChat(!showChat)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {showChat ? 'Fechar Chat' : 'Abrir Chat'}
                </Button>
              )}
            </div>
          </div>

          {/* Contract info */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold">{currentContract.fileName}</h2>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{formatFileSize(currentContract.fileSize)}</span>
                    <span>{currentContract.pageCount} paginas</span>
                    <span>Enviado em {formatDate(currentContract.createdAt)}</span>
                  </div>
                </div>
                <Badge variant={getStatusColor(currentContract.status)}>
                  {getStatusLabel(currentContract.status)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Analysis or Processing state */}
          {isAnalyzing && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <h3 className="text-lg font-medium mb-2">Analisando contrato...</h3>
                <p className="text-sm text-muted-foreground">
                  Isso pode levar alguns segundos
                </p>
              </CardContent>
            </Card>
          )}

          {currentAnalysis && !isAnalyzing && (
            <AnalysisView analysis={currentAnalysis} />
          )}

          {!currentAnalysis && !isAnalyzing && currentContract.status === 'PENDING' && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Play className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">Contrato pronto para analise</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Clique no botao acima para iniciar a analise com IA
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Chat Sidebar */}
      {showChat && (
        <div className="fixed right-0 top-0 h-full w-96 shadow-lg">
          <ChatSidebar
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            isLoading={isChatLoading}
          />
        </div>
      )}
    </div>
  );
}
