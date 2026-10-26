import React from 'react';

interface LogoProps {
  variant?: 'circular' | 'horizontal';
  className?: string;
  size?: number;
}

export const AssistenteColihLogo: React.FC<LogoProps> = ({
  variant = 'circular',
  className = '',
  size = 40,
}) => {
  if (variant === 'circular') {
    return (
      <div
        className={`rounded-full bg-white flex items-center justify-center p-1.5 shadow-sm border border-white/20 flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
          {/* Livro Aberto à Esquerda */}
          <path
            d="M20 40 C30 35, 45 37, 50 44 C55 37, 70 35, 80 40 L80 62 C70 57, 55 59, 50 66 C45 59, 30 57, 20 62 Z"
            fill="#1F619E"
            opacity="0.95"
          />
          {/* Páginas do Livro */}
          <path
            d="M50 44 L50 66"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Linha de Batimento Cardíaco (ECG) */}
          <path
            d="M15 72 L32 72 L37 62 L43 82 L49 60 L54 75 L60 72 L72 72"
            stroke="#1F619E"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Estetoscópio à Direita */}
          <path
            d="M72 72 C78 72, 84 66, 84 58 L84 52"
            stroke="#1F619E"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="84" cy="50" r="4" fill="#1F619E" />
        </svg>
      </div>
    );
  }

  // Versão Horizontal (do Card de Informações da Tela Inicial)
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <svg viewBox="0 0 520 120" className="w-full max-w-[420px] h-auto" fill="none">
        {/* Livro Aberto com páginas */}
        <g stroke="#334155" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          {/* Livro inclinado à esquerda */}
          <path d="M40 50 C55 42, 85 46, 110 58 L110 92 C85 80, 55 76, 40 84 Z" fill="#F1F5F9" />
          <path d="M110 58 C135 46, 165 42, 180 50 L180 84 C165 76, 135 80, 110 92 Z" fill="#F1F5F9" />
          <path d="M110 58 L110 92" strokeWidth="3" />
          {/* Linhas de texto simuladas no livro */}
          <line x1="60" y1="58" x2="95" y2="67" stroke="#64748B" strokeWidth="2.5" />
          <line x1="60" y1="67" x2="95" y2="76" stroke="#64748B" strokeWidth="2.5" />
          <line x1="125" y1="67" x2="160" y2="58" stroke="#64748B" strokeWidth="2.5" />
          <line x1="125" y1="76" x2="160" y2="67" stroke="#64748B" strokeWidth="2.5" />

          {/* Batimento cardíaco saindo do livro */}
          <path
            d="M180 82 L205 82 L213 55 L222 105 L232 50 L242 90 L248 82 L260 82"
            stroke="#334155"
            strokeWidth="4"
          />

          {/* Batimento continuando após o texto */}
          <path
            d="M400 82 L412 82 L420 55 L429 105 L439 50 L448 90 L454 82 L470 82"
            stroke="#334155"
            strokeWidth="4"
          />

          {/* Tubo e oliva do estetoscópio */}
          <path
            d="M470 82 C485 82, 498 72, 498 55 L498 40"
            stroke="#334155"
            strokeWidth="4"
          />
          {/* Campânula / Diafragma do Estetoscópio */}
          <circle cx="498" cy="35" r="9" stroke="#334155" strokeWidth="4" fill="#E2E8F0" />
        </g>

        {/* Tipografia Central: Assistente COLIH */}
        <text
          x="330"
          y="62"
          textAnchor="middle"
          fill="#334155"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="24"
          fontWeight="600"
          letterSpacing="0.5"
        >
          Assistente
        </text>
        <text
          x="330"
          y="102"
          textAnchor="middle"
          fill="#334155"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="46"
          fontWeight="900"
          letterSpacing="2"
        >
          COLIH
        </text>
      </svg>
    </div>
  );
};
