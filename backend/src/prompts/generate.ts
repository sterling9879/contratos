import { ContractGenerationData } from '../types';

export const buildGenerationPrompt = (data: ContractGenerationData): string => `
Você é um advogado especialista em contratos brasileiros.

Gere um contrato completo e profissional do tipo "${data.tipo}" com os seguintes dados:

CONTRATANTE:
- Nome/Razão Social: ${data.contratante.nome}
- CPF/CNPJ: ${data.contratante.documento}
- Endereço: ${data.contratante.endereco}

CONTRATADO:
- Nome/Razão Social: ${data.contratado.nome}
- CPF/CNPJ: ${data.contratado.documento}
- Endereço: ${data.contratado.endereco}

DETALHES:
- Objeto: ${data.objeto}
- Valor: ${data.valor}
- Forma de Pagamento: ${data.formaPagamento}
- Prazo: ${data.prazo}
${data.clausulasAdicionais?.length ? `- Cláusulas Adicionais: ${data.clausulasAdicionais.join(', ')}` : ''}

INSTRUÇÕES:
1. Use linguagem jurídica formal mas compreensível
2. Inclua todas as cláusulas padrão: objeto, preço, prazo, obrigações, rescisão, multas, foro, disposições gerais
3. Siga a legislação brasileira (Código Civil, CDC quando aplicável)
4. Use multas e juros dentro dos limites legais (multa max 2%, juros max 1% a.m.)
5. Inclua cláusula de foro do domicílio do contratante
6. Formate com numeração clara de cláusulas e parágrafos
7. Inclua espaço para assinaturas e testemunhas ao final
8. Use a data atual: ${new Date().toLocaleDateString('pt-BR')}

Gere o contrato completo em texto formatado:
`;

export const CONTRACT_TEMPLATES = [
  {
    id: 'prestacao-servicos',
    name: 'Prestação de Serviços',
    description: 'Contrato para prestação de serviços profissionais',
    category: 'Serviços',
    fields: [
      { name: 'objeto', label: 'Descrição dos Serviços', type: 'textarea' as const, required: true },
      { name: 'valor', label: 'Valor Total', type: 'text' as const, required: true },
      { name: 'formaPagamento', label: 'Forma de Pagamento', type: 'text' as const, required: true },
      { name: 'prazo', label: 'Prazo de Execução', type: 'text' as const, required: true },
    ],
  },
  {
    id: 'locacao-imovel',
    name: 'Locação de Imóvel',
    description: 'Contrato de locação residencial ou comercial',
    category: 'Imóveis',
    fields: [
      { name: 'objeto', label: 'Descrição do Imóvel', type: 'textarea' as const, required: true },
      { name: 'valor', label: 'Valor do Aluguel Mensal', type: 'text' as const, required: true },
      { name: 'formaPagamento', label: 'Dia do Vencimento', type: 'text' as const, required: true },
      { name: 'prazo', label: 'Prazo de Locação', type: 'text' as const, required: true },
    ],
  },
  {
    id: 'nda',
    name: 'Acordo de Confidencialidade (NDA)',
    description: 'Acordo de não divulgação de informações confidenciais',
    category: 'Corporativo',
    fields: [
      { name: 'objeto', label: 'Objeto da Confidencialidade', type: 'textarea' as const, required: true },
      { name: 'prazo', label: 'Prazo de Vigência', type: 'text' as const, required: true },
    ],
  },
  {
    id: 'compra-venda',
    name: 'Compra e Venda',
    description: 'Contrato de compra e venda de bens móveis',
    category: 'Comercial',
    fields: [
      { name: 'objeto', label: 'Descrição do Bem', type: 'textarea' as const, required: true },
      { name: 'valor', label: 'Valor Total', type: 'text' as const, required: true },
      { name: 'formaPagamento', label: 'Forma de Pagamento', type: 'text' as const, required: true },
    ],
  },
  {
    id: 'parceria',
    name: 'Parceria Comercial',
    description: 'Contrato de parceria entre empresas',
    category: 'Corporativo',
    fields: [
      { name: 'objeto', label: 'Objeto da Parceria', type: 'textarea' as const, required: true },
      { name: 'prazo', label: 'Prazo de Vigência', type: 'text' as const, required: true },
    ],
  },
  {
    id: 'trabalho-freelancer',
    name: 'Trabalho Freelancer',
    description: 'Contrato para trabalho autônomo/freelancer',
    category: 'Serviços',
    fields: [
      { name: 'objeto', label: 'Descrição do Trabalho', type: 'textarea' as const, required: true },
      { name: 'valor', label: 'Valor do Serviço', type: 'text' as const, required: true },
      { name: 'formaPagamento', label: 'Forma de Pagamento', type: 'text' as const, required: true },
      { name: 'prazo', label: 'Prazo de Entrega', type: 'text' as const, required: true },
    ],
  },
];
