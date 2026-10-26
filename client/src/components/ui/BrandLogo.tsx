import React from 'react';

export interface BrandLogoProps {
  className?: string;
  height?: number | string;
  width?: number | string;
  alt?: string;
}

/**
 * Emblema gráfico institucional selecionado pelo usuário.
 * Elementos:
 * 1. Bíblia / Livro Aberto com fita de leitura à esquerda (ética, consciência médica, diretrizes).
 * 2. Linha contínua de pulso vital (ECG / Eletrocardiograma).
 * 3. Estetoscópio integrado à direita (ambiente clínico, diagnóstico e hospitalar).
 * Totalmente sem nomes ou textos inventados.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  height = 40,
  width = 'auto',
  alt = 'Emblema Institucional',
}) => {
  return (
    <img
      src="/brand-logo.png"
      alt={alt}
      style={{ height, width }}
      className={`object-contain select-none transition-transform ${className}`}
    />
  );
};
