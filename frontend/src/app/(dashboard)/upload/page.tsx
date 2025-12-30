'use client';

import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UploadZone } from '@/components/contracts/upload-zone';
import { useContracts } from '@/hooks/useContracts';

export default function UploadPage() {
  const router = useRouter();
  const { uploadContract } = useContracts();

  const handleUpload = async (file: File) => {
    const result = await uploadContract(file);
    if (result.success && result.contract) {
      // Navigate to the contract detail page
      setTimeout(() => {
        router.push(`/contracts/${result.contract!.id}`);
      }, 1000);
    }
    return result;
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Upload de Contrato"
        description="Envie um contrato para analise com IA"
      />

      <div className="p-6">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Enviar Contrato</CardTitle>
            <CardDescription>
              Faca upload do seu contrato em PDF ou DOCX para analise automatica
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UploadZone onUpload={handleUpload} />
          </CardContent>
        </Card>

        {/* Features */}
        <div className="max-w-3xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <FeatureCard
            title="Analise Automatica"
            description="Nossa IA identifica riscos e clausulas problematicas"
          />
          <FeatureCard
            title="Chat Contextual"
            description="Tire duvidas sobre o contrato com nosso assistente"
          />
          <FeatureCard
            title="Score de Risco"
            description="Receba uma pontuacao de risco de 0 a 100"
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-4 rounded-lg bg-card border border-border">
      <h3 className="font-medium mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
