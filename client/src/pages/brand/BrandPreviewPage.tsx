import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sun, Moon } from 'lucide-react';

export const BrandPreviewPage: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'v1' | 'v2' | 'v3'>('all');

  return (
    <div className={`min-h-screen transition-colors p-4 sm:p-10 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'}`}>
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Barra Superior de Controles */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className={`px-4 py-2.5 text-sm font-bold rounded-xl flex items-center gap-2 transition-all ${
              isDarkMode ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-white text-slate-700 shadow-sm hover:text-slate-900'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Sistema</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`px-4 py-2.5 text-sm font-bold rounded-xl flex items-center gap-2 transition-all ${
              isDarkMode ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-white text-slate-700 shadow-sm hover:text-slate-900'
            }`}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            <span>{isDarkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
          </button>
        </div>

        {/* Título & Diretrizes de Criação */}
        <div className="text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            Estudo da Identidade Visual • 100% Simbólico • Sem Nomes
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Emblema: Livro/Bíblia • Pulso de ECG • Estetoscópio
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Inspiração direta no formato e nos elementos da imagem de referência. 
            <strong> Totalmente desprovido de qualquer nome, letra ou frase inventada.</strong>
          </p>
        </div>

        {/* Filtro de Abas */}
        <div className="flex items-center justify-center gap-2 pb-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow'
                : 'bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            Ver Todas as 3 Variações
          </button>
          <button
            onClick={() => setActiveTab('v3')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'v3'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            Variação 3 (Perspectiva Isométrica — Fiel à Referência)
          </button>
          <button
            onClick={() => setActiveTab('v2')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'v2'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            Variação 2 (Com Fita Marcadora)
          </button>
          <button
            onClick={() => setActiveTab('v1')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'v1'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            Variação 1 (Monoline Frontal)
          </button>
        </div>

        {/* VARIAÇÃO 3: Perspectiva Isométrica 3D (Exatamente como a referência!) */}
        {(activeTab === 'all' || activeTab === 'v3') && (
          <div className={`p-6 sm:p-8 rounded-3xl border transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-xl' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200/50 dark:border-slate-800 mb-6 gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm">3</span>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">Variação 3 — Perspectiva Isométrica (Mais Fiel à Referência)</h2>
                  <p className="text-xs text-slate-500">Livro aberto em ângulo 3D com volume de páginas e lombada, pulso contínuo e estetoscópio</p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 w-fit">
                ★ Recomendada (Formato Original)
              </span>
            </div>

            <div className="w-full flex items-center justify-center p-8 bg-white rounded-2xl border border-slate-200 shadow-inner overflow-hidden">
              <img
                src="/logo-variation-3.jpg"
                alt="Logo Variação 3 - Livro Isométrico, ECG e Estetoscópio"
                className="max-h-72 object-contain w-auto hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        )}

        {/* VARIAÇÃO 2: Com Fita Marcadora */}
        {(activeTab === 'all' || activeTab === 'v2') && (
          <div className={`p-6 sm:p-8 rounded-3xl border transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-xl' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200/50 dark:border-slate-800 mb-6 gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center font-black text-sm">2</span>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">Variação 2 — Bíblia com Fita Marcadora e Curvatura Suave</h2>
                  <p className="text-xs text-slate-500">Páginas arqueadas com a fita clássica de leitura, pulso vital central e estetoscópio</p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 w-fit">
                Estilo Editorial
              </span>
            </div>

            <div className="w-full flex items-center justify-center p-8 bg-white rounded-2xl border border-slate-200 shadow-inner overflow-hidden">
              <img
                src="/logo-variation-2.jpg"
                alt="Logo Variação 2 - Bíblia com Fita, ECG e Estetoscópio"
                className="max-h-72 object-contain w-auto hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        )}

        {/* VARIAÇÃO 1: Monoline Frontal Minimalista */}
        {(activeTab === 'all' || activeTab === 'v1') && (
          <div className={`p-6 sm:p-8 rounded-3xl border transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-xl' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200/50 dark:border-slate-800 mb-6 gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center font-black text-sm">1</span>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">Variação 1 — Monoline Frontal Unificado</h2>
                  <p className="text-xs text-slate-500">Traço puramente horizontal e simétrico com espessura uniforme</p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 w-fit">
                Minimalista Simétrico
              </span>
            </div>

            <div className="w-full flex items-center justify-center p-8 bg-white rounded-2xl border border-slate-200 shadow-inner overflow-hidden">
              <img
                src="/logo-variation-1.jpg"
                alt="Logo Variação 1 - Monoline Frontal"
                className="max-h-72 object-contain w-auto hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        )}

        {/* SIMULAÇÃO DE CABEÇALHO */}
        <div className={`p-6 sm:p-8 rounded-3xl border transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-xl' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h2 className="text-base font-black text-slate-900 dark:text-white mb-2">Simulação de Uso no Cabeçalho do Sistema</h2>
          <p className="text-xs text-slate-500 mb-6">Exibição da Variação 3 (Perspectiva Isométrica) integrada ao topo sem texto</p>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="h-16 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  src="/logo-variation-3.jpg"
                  alt="Logo Header"
                  className="h-10 w-auto object-contain"
                />
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Painel de Controle
                </span>
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  G
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-950 space-y-3">
              <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="h-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3"></div>
                <div className="h-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3"></div>
                <div className="h-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3"></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
