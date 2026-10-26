import React from 'react';
import { AssistenteColihLogo } from '../brand/AssistenteColihLogo.js';
import { FolderKanban, Calendar } from 'lucide-react';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#FAF9FD] flex flex-col font-sans">
      {/* Barra Superior Oficial Assistente COLIH (#1F619E) */}
      <header className="bg-[#1F619E] text-white shadow-md sticky top-0 z-50">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Lado Esquerdo: Logo Circular e Título Oficial */}
          <div className="flex items-center gap-3.5 flex-shrink-0">
            <AssistenteColihLogo variant="circular" size={42} />
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight">
                Assistente COLIH
              </span>
              <span className="text-[11px] text-sky-100 font-medium tracking-normal leading-tight">
                Quadro de Ações &amp; Demandas Operacionais
              </span>
            </div>
          </div>

          {/* Lado Direito: Badges de Integração e Status */}
          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-sky-100 text-xs font-semibold">
              <FolderKanban className="w-3.5 h-3.5 text-white" />
              <span>Quadro Oficial</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-100 text-xs font-semibold border border-emerald-400/30">
              <Calendar className="w-3.5 h-3.5 text-emerald-300" />
              <span>Google Agenda Conectado</span>
            </span>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal do Kanban */}
      <main className="flex-1 w-full max-w-[1700px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        {children}
      </main>
    </div>
  );
};
