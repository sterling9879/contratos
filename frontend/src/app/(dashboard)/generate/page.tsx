'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileText, ArrowRight, ArrowLeft, Download, Copy, Check } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { contractService } from '@/services/contractService';
import { ContractTemplate } from '@/types';
import { cn } from '@/lib/utils';

const generateSchema = z.object({
  tipo: z.string().min(1, 'Selecione um tipo de contrato'),
  contratante: z.object({
    nome: z.string().min(2, 'Nome obrigatorio'),
    documento: z.string().min(11, 'CPF/CNPJ obrigatorio'),
    endereco: z.string().min(10, 'Endereco obrigatorio'),
  }),
  contratado: z.object({
    nome: z.string().min(2, 'Nome obrigatorio'),
    documento: z.string().min(11, 'CPF/CNPJ obrigatorio'),
    endereco: z.string().min(10, 'Endereco obrigatorio'),
  }),
  objeto: z.string().min(10, 'Descricao do objeto obrigatoria'),
  valor: z.string().min(1, 'Valor obrigatorio'),
  formaPagamento: z.string().min(1, 'Forma de pagamento obrigatoria'),
  prazo: z.string().min(1, 'Prazo obrigatorio'),
});

type GenerateForm = z.infer<typeof generateSchema>;

type Step = 'template' | 'parties' | 'details' | 'result';

export default function GeneratePage() {
  const [step, setStep] = useState<Step>('template');
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [generatedContract, setGeneratedContract] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<GenerateForm>({
    resolver: zodResolver(generateSchema),
  });

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const data = await contractService.getTemplates();
        setTemplates(data);
      } catch (error) {
        console.error('Error loading templates:', error);
      }
    };
    loadTemplates();
  }, []);

  const selectTemplate = (template: ContractTemplate) => {
    setSelectedTemplate(template);
    setValue('tipo', template.name);
    setStep('parties');
  };

  const onSubmit = async (data: GenerateForm) => {
    setIsGenerating(true);
    setError('');
    try {
      const result = await contractService.generateContract(data);
      setGeneratedContract(result.content);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar contrato');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedContract);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadContract = () => {
    const blob = new Blob([generatedContract], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contrato-${selectedTemplate?.id || 'gerado'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen">
      <Header title="Gerar Contrato" description="Crie contratos com auxilio de IA" />

      <div className="p-6">
        {/* Progress Steps */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex items-center justify-center gap-4">
            {(['template', 'parties', 'details', 'result'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                    step === s
                      ? 'bg-primary text-primary-foreground'
                      : s === 'result' && generatedContract
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {i + 1}
                </div>
                {i < 3 && (
                  <div
                    className={cn(
                      'w-16 h-0.5 mx-2',
                      step === 'result' || (i === 0 && step !== 'template') || (i === 1 && (step === 'details' || step === 'result'))
                        ? 'bg-primary'
                        : 'bg-muted'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-12 mt-2 text-xs text-muted-foreground">
            <span>Tipo</span>
            <span>Partes</span>
            <span>Detalhes</span>
            <span>Resultado</span>
          </div>
        </div>

        {/* Step 1: Template Selection */}
        {step === 'template' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">Selecione o tipo de contrato</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
                  onClick={() => selectTemplate(template)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <h3 className="font-medium">{template.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Parties Information */}
        {step === 'parties' && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Informacoes das Partes</CardTitle>
              <CardDescription>Preencha os dados do contratante e contratado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-3">Contratante</h3>
                <div className="space-y-3">
                  <Input
                    {...register('contratante.nome')}
                    placeholder="Nome / Razao Social"
                    error={errors.contratante?.nome?.message}
                  />
                  <Input
                    {...register('contratante.documento')}
                    placeholder="CPF / CNPJ"
                    error={errors.contratante?.documento?.message}
                  />
                  <Input
                    {...register('contratante.endereco')}
                    placeholder="Endereco completo"
                    error={errors.contratante?.endereco?.message}
                  />
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Contratado</h3>
                <div className="space-y-3">
                  <Input
                    {...register('contratado.nome')}
                    placeholder="Nome / Razao Social"
                    error={errors.contratado?.nome?.message}
                  />
                  <Input
                    {...register('contratado.documento')}
                    placeholder="CPF / CNPJ"
                    error={errors.contratado?.documento?.message}
                  />
                  <Input
                    {...register('contratado.endereco')}
                    placeholder="Endereco completo"
                    error={errors.contratado?.endereco?.message}
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep('template')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <Button onClick={() => setStep('details')}>
                  Continuar
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Contract Details */}
        {step === 'details' && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Detalhes do Contrato</CardTitle>
              <CardDescription>Preencha as informacoes especificas</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    {error}
                  </div>
                )}

                <Textarea
                  {...register('objeto')}
                  placeholder="Descricao do objeto do contrato"
                  className="min-h-[100px]"
                  error={errors.objeto?.message}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    {...register('valor')}
                    placeholder="Valor (ex: R$ 5.000,00)"
                    error={errors.valor?.message}
                  />
                  <Input
                    {...register('prazo')}
                    placeholder="Prazo (ex: 12 meses)"
                    error={errors.prazo?.message}
                  />
                </div>

                <Input
                  {...register('formaPagamento')}
                  placeholder="Forma de pagamento (ex: Boleto mensal)"
                  error={errors.formaPagamento?.message}
                />

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={() => setStep('parties')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                  <Button type="submit" isLoading={isGenerating}>
                    Gerar Contrato
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Result */}
        {step === 'result' && (
          <Card className="max-w-4xl mx-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Contrato Gerado</CardTitle>
                <CardDescription>Revise e faca download do seu contrato</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={copyToClipboard}>
                  {copied ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  {copied ? 'Copiado!' : 'Copiar'}
                </Button>
                <Button onClick={downloadContract}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm bg-muted p-6 rounded-lg max-h-[600px] overflow-y-auto">
                {generatedContract}
              </pre>

              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('template');
                    setGeneratedContract('');
                    setSelectedTemplate(null);
                  }}
                >
                  Gerar Novo Contrato
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
