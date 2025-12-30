export const buildAnalysisPrompt = (contractText: string): string => `
Você é um advogado especialista em contratos brasileiros com 20 anos de experiência.

Analise o contrato abaixo de forma minuciosa e retorne APENAS um JSON válido (sem markdown, sem backticks) com a seguinte estrutura:

{
  "partes": {
    "contratante": "Nome completo ou razão social",
    "contratado": "Nome completo ou razão social"
  },
  "tipo_contrato": "Tipo identificado (ex: Prestação de Serviços, Locação, NDA, etc)",
  "valor_total": "Valor em formato brasileiro ou null se não especificado",
  "prazo": "Prazo de vigência em texto",
  "data_inicio": "Data de início se mencionada ou null",
  "clausulas_risco": [
    {
      "numero": "Número da cláusula",
      "texto_resumido": "Resumo do texto problemático (max 100 chars)",
      "motivo": "Explicação clara do risco",
      "severidade": 1-5,
      "recomendacao": "Sugestão de alteração"
    }
  ],
  "obrigacoes_contratante": ["Lista de obrigações principais"],
  "obrigacoes_contratado": ["Lista de obrigações principais"],
  "penalidades": ["Lista de multas e penalidades"],
  "score_risco": 0-100,
  "resumo_executivo": "Resumo em até 200 palavras destacando pontos principais e alertas"
}

CRITÉRIOS DE ANÁLISE DE RISCO:
- Multas acima de 2% são abusivas pelo CDC
- Renovação automática sem aviso prévio de 30 dias é problemática
- Foro diferente do domicílio do contratante pessoa física é abusivo
- Cláusulas de exclusividade excessiva (acima de 2 anos)
- Responsabilização ilimitada
- Rescisão unilateral sem justa causa favorecendo apenas uma parte
- Prazos de pagamento inferiores a 7 dias
- Juros acima de 1% ao mês
- Multa moratória acima de 2%

SCORE DE RISCO:
- 80-100: Contrato seguro, poucos ou nenhum risco
- 60-79: Atenção necessária, riscos moderados
- 40-59: Contrato problemático, negociação recomendada
- 0-39: Alto risco, não recomendado assinar sem alterações

CONTRATO PARA ANÁLISE:
${contractText}
`;

export const buildQuickAnalysisPrompt = (contractText: string): string => `
Você é um advogado especialista em contratos brasileiros.

Faça uma análise rápida do contrato abaixo e retorne APENAS um JSON válido com:

{
  "tipo_contrato": "Tipo identificado",
  "partes": {
    "contratante": "Nome",
    "contratado": "Nome"
  },
  "valor_total": "Valor ou null",
  "prazo": "Prazo",
  "score_risco": 0-100,
  "alertas_principais": ["Lista de até 3 alertas mais importantes"]
}

CONTRATO:
${contractText.substring(0, 5000)}
`;
