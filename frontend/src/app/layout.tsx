import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Contrato.AI - Analise de Contratos com IA',
  description: 'Analise seus contratos com inteligencia artificial. Identifique riscos, clausulas problematicas e receba recomendacoes.',
  keywords: ['contratos', 'analise', 'inteligencia artificial', 'juridico', 'riscos'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
