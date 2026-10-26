import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import { api, getErrorMessage } from '../../api/client.js';
import {
  AlertCircle,
  Lock,
  Mail,
  User,
  Phone,
  Loader2,
  Building2,
  HeartHandshake,
  ShieldCheck,
  MapPin,
  Check,
  Stethoscope
} from 'lucide-react';

interface PublicWorkspace {
  id: string;
  name: string;
  city: string;
  state: string;
  description?: string | null;
  memberCount: number;
}

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  // Tipo de Cadastro: Facilitador/Membro ou Coordenador (Criar Comissão)
  const [registerMode, setRegisterMode] = useState<'MEMBER' | 'COORDINATOR'>('MEMBER');

  // Comissões públicas carregadas
  const [publicWorkspaces, setPublicWorkspaces] = useState<PublicWorkspace[]>([]);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);

  // Campos Comuns de Usuário
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [congregation, setCongregation] = useState('');

  // Campos para Membro / Facilitador
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [roleInterest, setRoleInterest] = useState('Facilitador de Visitas Hospitalares');

  // Campos para Coordenador (Nova Comissão)
  const [wsName, setWsName] = useState('');
  const [wsCity, setWsCity] = useState('');
  const [wsState, setWsState] = useState('SP');
  const [wsDescription, setWsDescription] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const res = await api.get('/workspaces/public');
        const list: PublicWorkspace[] = res.data.data.workspaces || [];
        setPublicWorkspaces(list);
        if (list.length > 0) {
          setSelectedWorkspaceId(list[0].id);
        }
      } catch (err) {
        console.warn('Não foi possível carregar comissões públicas:', err);
      } finally {
        setIsLoadingWorkspaces(false);
      }
    };
    fetchWorkspaces();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('A confirmação de senha não confere com a senha informada.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve possuir pelo menos 6 caracteres.');
      return;
    }

    if (registerMode === 'COORDINATOR') {
      if (!wsName.trim() || !wsCity.trim() || !wsState.trim()) {
        setError('Por favor preencha o nome da comissão regional, cidade sede e estado.');
        return;
      }
    }

    setIsLoading(true);

    try {
      let assignedWsId: string | undefined;

      if (registerMode === 'COORDINATOR') {
        assignedWsId = await register({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim() || undefined,
          congregation: congregation.trim() || undefined,
          newWorkspace: {
            name: wsName.trim(),
            city: wsCity.trim(),
            state: wsState.trim().toUpperCase(),
            description: wsDescription.trim() || undefined,
          },
        });
      } else {
        assignedWsId = await register({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim() || undefined,
          congregation: congregation.trim() || undefined,
          roleInterest,
          workspaceId: selectedWorkspaceId || undefined,
        });
      }

      // Se for facilitador/membro comum, vai direto para o Kanban (/boards)
      // Se for coordenador, vai para o dashboard da nova comissão
      if (assignedWsId) {
        if (registerMode === 'COORDINATOR') {
          navigate(`/workspaces/${assignedWsId}/dashboard`);
        } else {
          navigate(`/workspaces/${assignedWsId}/boards`);
        }
      } else {
        navigate('/workspaces');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neu-bg flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 text-slate-800">
      {/* Topo com Emblema Institucional Oficial e Tipografia Legível */}
      <div className="max-w-6xl mx-auto w-full text-center mb-6">
        <div className="flex justify-center mx-auto mb-3">
          <div className="p-3 sm:p-4 bg-white rounded-3xl shadow-neu-sm border border-slate-200/80 inline-flex items-center justify-center">
            <img
              src="/brand-logo.png"
              alt="Emblema Institucional COLIH"
              className="h-14 sm:h-16 w-auto object-contain"
            />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Cadastro de Integrantes da COLIH
        </h1>
        <p className="mt-1 text-sm sm:text-base text-slate-600 font-medium max-w-xl mx-auto">
          Comissões de Ligação com Hospitais — Cadastre-se como Facilitador de Visitas ou registre uma nova comissão regional.
        </p>
      </div>

      {/* Canvas Horizontal Widescreen (Grid em 2 Colunas Lado a Lado) */}
      <div className="max-w-6xl mx-auto w-full">
        <div className="neu-panel p-6 sm:p-10 shadow-neu-lg">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-sm sm:text-base text-rose-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* COLUNA 1: PERFIL & ATUAÇÃO NA COLIH */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold uppercase text-slate-700 tracking-wider mb-2.5">
                    1. Escolha o seu Tipo de Cadastro *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => setRegisterMode('MEMBER')}
                      className={`p-4 rounded-2xl cursor-pointer border transition-all text-left flex items-start gap-3 ${
                        registerMode === 'MEMBER'
                          ? 'border-brand-500 bg-brand-50/50 shadow-neu-pressed-sm ring-2 ring-brand-500'
                          : 'neu-card hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`p-2.5 rounded-xl flex-shrink-0 ${
                          registerMode === 'MEMBER' ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        <HeartHandshake className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm sm:text-base text-slate-900">
                            Facilitador
                          </span>
                          {registerMode === 'MEMBER' && <Check className="w-4 h-4 text-brand-600" />}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-snug">
                          Visitas médicas a doutores e suporte de campo.
                        </p>
                      </div>
                    </div>

                    <div
                      onClick={() => setRegisterMode('COORDINATOR')}
                      className={`p-4 rounded-2xl cursor-pointer border transition-all text-left flex items-start gap-3 ${
                        registerMode === 'COORDINATOR'
                          ? 'border-purple-500 bg-purple-50/50 shadow-neu-pressed-sm ring-2 ring-purple-500'
                          : 'neu-card hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`p-2.5 rounded-xl flex-shrink-0 ${
                          registerMode === 'COORDINATOR' ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm sm:text-base text-slate-900">
                            Coordenador
                          </span>
                          {registerMode === 'COORDINATOR' && <Check className="w-4 h-4 text-purple-600" />}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-snug">
                          Criar e gerenciar nova comissão regional.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-bloco Dinâmico para Facilitador */}
                {registerMode === 'MEMBER' && (
                  <div className="p-5 rounded-2xl bg-white/70 border border-slate-200/90 space-y-4 shadow-neu-sm">
                    <div className="flex items-center gap-2 border-b border-slate-200/70 pb-2.5">
                      <Stethoscope className="w-5 h-5 text-brand-600" />
                      <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
                        Comissão Regional & Atribuição de Campo
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-bold uppercase text-slate-700 mb-1.5">
                        Comissão Regional COLIH *
                      </label>
                      {isLoadingWorkspaces ? (
                        <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
                          <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                          <span>Carregando comissões regionais...</span>
                        </div>
                      ) : publicWorkspaces.length > 0 ? (
                        <select
                          value={selectedWorkspaceId}
                          onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                          className="w-full px-4 py-3 neu-input text-sm sm:text-base font-bold text-slate-800"
                        >
                          {publicWorkspaces.map((ws) => (
                            <option key={ws.id} value={ws.id}>
                              {ws.name} ({ws.city} - {ws.state}) • {ws.memberCount} integrante(s)
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="p-3 rounded-xl bg-slate-100 text-xs sm:text-sm text-slate-600 font-medium">
                          Nenhuma comissão pública cadastrada ainda. Alterne para "Coordenador" para registrar a primeira!
                        </div>
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        Sua conta de facilitador receberá os cartões de visitas desta comissão.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-bold uppercase text-slate-700 mb-1.5">
                        Função na Comissão *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          'Facilitador de Visitas Hospitalares',
                          'Plantonista de Emergência 24h',
                          'Secretaria Executiva & Apoio',
                          'Liaison de Protocolos HLC-31',
                        ].map((titleOption) => {
                          const isSel = roleInterest === titleOption;
                          return (
                            <div
                              key={titleOption}
                              onClick={() => setRoleInterest(titleOption)}
                              className={`p-3 rounded-xl cursor-pointer border text-xs sm:text-sm font-bold transition-all flex items-center justify-between ${
                                isSel
                                  ? 'border-brand-600 bg-brand-50 text-brand-800 shadow-neu-pressed-sm ring-1 ring-brand-600'
                                  : 'neu-card text-slate-700 hover:border-slate-300'
                              }`}
                            >
                              <span className="truncate">{titleOption}</span>
                              {isSel && <Check className="w-4 h-4 text-brand-600 flex-shrink-0" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-bold uppercase text-slate-700 mb-1.5">
                        Congregação / Região de Atuação (Opcional)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={congregation}
                          onChange={(e) => setCongregation(e.target.value)}
                          placeholder="Ex: Congregação Central"
                          className="w-full pl-10 pr-4 py-3 neu-input text-sm sm:text-base font-medium"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-bloco Dinâmico para Coordenador */}
                {registerMode === 'COORDINATOR' && (
                  <div className="p-5 rounded-2xl bg-white/70 border border-purple-200/90 space-y-4 shadow-neu-sm">
                    <div className="flex items-center gap-2 border-b border-purple-200/70 pb-2.5">
                      <Building2 className="w-5 h-5 text-purple-600" />
                      <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-purple-900">
                        Dados da Nova Comissão Regional
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-bold uppercase text-slate-700 mb-1.5">
                        Nome da Comissão COLIH *
                      </label>
                      <input
                        type="text"
                        required
                        value={wsName}
                        onChange={(e) => setWsName(e.target.value)}
                        placeholder="Ex: COLIH Campinas e Região Metropolitana"
                        className="w-full px-4 py-3 neu-input text-sm sm:text-base font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs sm:text-sm font-bold uppercase text-slate-700 mb-1.5">
                          Cidade Sede *
                        </label>
                        <input
                          type="text"
                          required
                          value={wsCity}
                          onChange={(e) => setWsCity(e.target.value)}
                          placeholder="Ex: Campinas"
                          className="w-full px-4 py-3 neu-input text-sm sm:text-base font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-bold uppercase text-slate-700 mb-1.5">
                          Estado (UF) *
                        </label>
                        <select
                          value={wsState}
                          onChange={(e) => setWsState(e.target.value)}
                          className="w-full px-4 py-3 neu-input text-sm sm:text-base font-bold text-slate-800"
                        >
                          {BRAZILIAN_STATES.map((uf) => (
                            <option key={uf} value={uf}>
                              {uf}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-bold uppercase text-slate-700 mb-1.5">
                        Descrição ou Abrangência Regional (Opcional)
                      </label>
                      <input
                        type="text"
                        value={wsDescription}
                        onChange={(e) => setWsDescription(e.target.value)}
                        placeholder="Ex: Atendimento aos hospitais e clínicas da região"
                        className="w-full px-4 py-3 neu-input text-sm sm:text-base font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* COLUNA 2: IDENTIFICAÇÃO PESSOAL & ACESSO */}
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-white/70 border border-slate-200/90 space-y-4 shadow-neu-sm">
                  <div className="flex items-center gap-2 border-b border-slate-200/70 pb-2.5">
                    <User className="w-5 h-5 text-slate-600" />
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
                      2. Identificação Pessoal & Credenciais
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold uppercase text-slate-700 mb-1.5">
                      Nome Completo *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Seu Nome Completo"
                        className="w-full pl-10 pr-4 py-3 neu-input text-sm sm:text-base font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold uppercase text-slate-700 mb-1.5">
                      Endereço de E-mail de Acesso *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu.email@exemplo.com"
                        className="w-full pl-10 pr-4 py-3 neu-input text-sm sm:text-base font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold uppercase text-slate-700 mb-1.5">
                      Telefone / WhatsApp com DDD *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="w-full pl-10 pr-4 py-3 neu-input text-sm sm:text-base font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs sm:text-sm font-bold uppercase text-slate-700 mb-1.5">
                        Senha (mínimo 6 dígitos) *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-4 py-3 neu-input text-sm sm:text-base font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-bold uppercase text-slate-700 mb-1.5">
                        Confirmar Senha *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-4 py-3 neu-input text-sm sm:text-base font-medium"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botão de Envio de Alto Destaque */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 px-6 neu-btn-primary text-base font-extrabold flex justify-center items-center disabled:opacity-50 tracking-wide shadow-neu-sm hover:shadow-neu"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Cadastrando e Vinculando...
                    </>
                  ) : registerMode === 'COORDINATOR' ? (
                    'Criar Conta & Inicializar Comissão Regional'
                  ) : (
                    'Concluir Cadastro de Facilitador'
                  )}
                </button>

                <div className="pt-3 text-center">
                  <p className="text-sm text-slate-600 font-medium">
                    Já possui conta ativa no sistema?{' '}
                    <Link to="/login" className="font-bold text-brand-600 hover:text-brand-700 ml-1">
                      Fazer login
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
