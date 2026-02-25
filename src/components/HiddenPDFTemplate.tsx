import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { replaceVariables } from '../utils/documentUtils';

interface HiddenPDFTemplateProps {
  template: string;
  values: Record<string, string>;
  id: string;
}

export const HiddenPDFTemplate: React.FC<HiddenPDFTemplateProps> = ({ template, values, id }) => {
  const processedContent = replaceVariables(template, values);
  const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/logo-sell.png` : '/logo-sell.png';

  return (
    <div
      id={id}
      style={{
        position: 'fixed',
        left: '-9999px',
        top: 0,
        width: '210mm',
        zIndex: -1,
        backgroundColor: '#ffffff',
        color: '#1a1a1a',
        padding: '20mm',
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '11pt',
        lineHeight: '1.6',
        boxSizing: 'border-box',
        display: 'block', // Changed from flex to block for better pagination slicing
      }}
    >
      {/* Cabeçalho Oficial - Repetível se fatiado manualmente, mas aqui fica no topo */}
      <div id={`${id}-header`} style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        marginBottom: '10mm',
        textAlign: 'center' 
      }}>
        <img 
          src={logoUrl} 
          alt="Sell Administradora" 
          crossOrigin="anonymous"
          style={{ height: '60px', objectFit: 'contain', marginBottom: '4mm' }} 
        />
        <h1 style={{ 
          margin: 0, 
          fontFamily: 'Georgia, serif', 
          fontSize: '20pt', 
          fontWeight: 'bold', 
          color: '#0F2940',
          letterSpacing: '0.15em',
          textTransform: 'uppercase'
        }}>
          SELL ADMINISTRADORA
        </h1>
        <div style={{ 
          width: '100%', 
          height: '1.5px', 
          backgroundColor: '#6BBF59', 
          marginTop: '6mm' 
        }}></div>
      </div>

      {/* Corpo do Documento */}
      <div id={`${id}-content`} className="pdf-markdown-content" style={{ textAlign: 'justify', minHeight: '200mm' }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
          {processedContent}
        </ReactMarkdown>
      </div>

      {/* Rodapé Oficial */}
      <div id={`${id}-footer`} style={{ 
        marginTop: '15mm', 
        paddingTop: '6mm', 
        borderTop: '1px solid #e5e7eb', 
        textAlign: 'center', 
        fontSize: '9pt', 
        color: '#6b7280',
        fontFamily: 'Arial, Helvetica, sans-serif'
      }}>
        <p style={{ margin: 0 }}>
          (11) 3796-0203 | atendimento@selladm.com.br | selladm.com.br
        </p>
      </div>
    </div>
  );
};
