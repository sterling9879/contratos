'use client';

import { AlertTriangle, CheckCircle, Users, Calendar, DollarSign, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScoreRing } from '@/components/ui/score-ring';
import { ContractAnalysis, ClausulaRisco } from '@/types';
import { cn, getSeverityColor } from '@/lib/utils';

interface AnalysisViewProps {
  analysis: ContractAnalysis;
}

export function AnalysisView({ analysis }: AnalysisViewProps) {
  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Risk Score */}
        <Card className="col-span-1">
          <CardContent className="flex flex-col items-center justify-center py-6">
            <ScoreRing score={analysis.score_risco} size="lg" />
          </CardContent>
        </Card>

        {/* Contract Info */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informacoes do Contrato
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Tipo</p>
              <p className="font-medium">{analysis.tipo_contrato}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="font-medium">{analysis.valor_total || 'Nao especificado'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Prazo</p>
              <p className="font-medium">{analysis.prazo}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Inicio</p>
              <p className="font-medium">{analysis.data_inicio || 'Nao especificado'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Parties */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Partes do Contrato
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground mb-1">Contratante</p>
            <p className="font-medium">{analysis.partes.contratante}</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground mb-1">Contratado</p>
            <p className="font-medium">{analysis.partes.contratado}</p>
          </div>
        </CardContent>
      </Card>

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Executivo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">{analysis.resumo_executivo}</p>
        </CardContent>
      </Card>

      {/* Risk Clauses */}
      {analysis.clausulas_risco.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Clausulas de Risco ({analysis.clausulas_risco.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.clausulas_risco.map((clausula, index) => (
              <RiskClauseCard key={index} clausula={clausula} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Obligations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Obrigacoes do Contratante</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.obrigacoes_contratante.map((obrigacao, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>{obrigacao}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Obrigacoes do Contratado</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.obrigacoes_contratado.map((obrigacao, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>{obrigacao}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Penalties */}
      {analysis.penalidades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Penalidades e Multas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.penalidades.map((penalidade, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>{penalidade}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RiskClauseCard({ clausula }: { clausula: ClausulaRisco }) {
  return (
    <div className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Clausula {clausula.numero}</Badge>
          <span className={cn('text-sm font-medium', getSeverityColor(clausula.severidade))}>
            Severidade: {clausula.severidade}/5
          </span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{clausula.texto_resumido}</p>
      <div className="space-y-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Motivo do Risco:</p>
          <p className="text-sm">{clausula.motivo}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Recomendacao:</p>
          <p className="text-sm text-primary">{clausula.recomendacao}</p>
        </div>
      </div>
    </div>
  );
}
