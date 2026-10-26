import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import { api, getErrorMessage } from '../../api/client.js';
import {
  User,
  Lock,
  Calendar,
  Check,
  AlertCircle,
  Smartphone,
  Bell,
  RefreshCw,
  Unlink,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Alteração de Senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Google Calendar Integration
  const [searchParams, setSearchParams] = useSearchParams();
  const [calendarStatus, setCalendarStatus] = useState<{
    connected: boolean;
    email: string | null;
    isConfigured: boolean;
  } | null>(null);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(true);
  const [isConnectingCalendar, setIsConnectingCalendar] = useState(false);
  const [isDisconnectingCalendar, setIsDisconnectingCalendar] = useState(false);
  const [calendarMessage, setCalendarMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const fetchCalendarStatus = async () => {
    try {
      setIsLoadingCalendar(true);
      const res = await api.get('/calendar/status');
      setCalendarStatus(res.data.data);
    } catch (err) {
      console.error('Erro ao verificar status do Google Calendar:', err);
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  useEffect(() => {
    fetchCalendarStatus();

    const calParam = searchParams.get('calendar');
    if (calParam === 'connected') {
      setCalendarMessage({
        type: 'success',
        text: 'Google Agenda conectado com sucesso! Suas visitas médicas atribuídas com prazo serão sincronizadas automaticamente no seu celular.',
      });
      setSearchParams({});
    } else if (calParam === 'error') {
      const msg = searchParams.get('message') || 'Falha ao autenticar com a conta Google.';
      setCalendarMessage({
        type: 'error',
        text: `Erro ao conectar Google Agenda: ${msg}`,
      });
      setSearchParams({});
    }
  }, []);

  const handleConnectCalendar = async () => {
    setIsConnectingCalendar(true);
    setCalendarMessage(null);
    try {
      const res = await api.get('/calendar/connect');
      const authUrl = res.data?.data?.url;
      if (authUrl) {
        window.location.href = authUrl;
      }
    } catch (err) {
      setCalendarMessage({
        type: 'error',
        text: getErrorMessage(err),
      });
      setIsConnectingCalendar(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    if (!window.confirm('Deseja realmente desconectar sua conta do Google Agenda?')) return;
    setIsDisconnectingCalendar(true);
    setCalendarMessage(null);
    try {
      await api.post('/calendar/disconnect');
      setCalendarStatus((prev) => (prev ? { ...prev, connected: false, email: null } : null));
      setCalendarMessage({
        type: 'info',
        text: 'Conta do Google Agenda desconectada com sucesso.',
      });
    } catch (err) {
      setCalendarMessage({
        type: 'error',
        text: getErrorMessage(err),
      });
    } finally {
      setIsDisconnectingCalendar(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      await updateProfile({ name, phone: phone || undefined });
      setProfileSuccess('Dados cadastrais atualizados com sucesso.');
    } catch (err) {
      setProfileError(getErrorMessage(err));
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setPasswordError('A confirmação da nova senha não confere.');
      return;
    }

    setIsChangingPassword(true);
    setPasswordSuccess(null);
    setPasswordError(null);

    try {
      const res = await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setPasswordSuccess(res.data.message || 'Senha alterada com sucesso.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setPasswordError(getErrorMessage(err));
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-slate-800">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Meu Perfil de Usuário</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">
          Gerenciamento de dados cadastrais e credenciais de segurança
        </p>
      </div>

      {/* Cartão de Informações Pessoais */}
      <div className="neu-panel p-6 space-y-5">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-300/40 pb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-brand-600" /> Dados Pessoais
        </h2>

        {profileSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-100/70 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" /> {profileSuccess}
          </div>
        )}

        {profileError && (
          <div className="p-3.5 rounded-xl bg-red-100/70 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {profileError}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 neu-input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                Telefone de Contato
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full px-3.5 py-2.5 neu-input text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Endereço de E-mail
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-3.5 py-2.5 neu-input text-sm opacity-60 cursor-not-allowed"
            />
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              O e-mail é utilizado para identificação única no sistema e convites de comissões.
            </p>
          </div>

          <div className="pt-2 text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Conta criada em {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : ''}</span>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-300/40">
            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="px-5 py-2.5 text-sm font-bold text-white neu-btn-primary disabled:opacity-50"
            >
              {isUpdatingProfile ? 'Salvando...' : 'Salvar Dados Pessoais'}
            </button>
          </div>
        </form>
      </div>

      {/* Cartão de Alteração de Senha */}
      <div className="neu-panel p-6 space-y-5">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-300/40 pb-3 flex items-center gap-2">
          <Lock className="w-4 h-4 text-brand-600" /> Segurança e Senha
        </h2>

        {passwordSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-100/70 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" /> {passwordSuccess}
          </div>
        )}

        {passwordError && (
          <div className="p-3.5 rounded-xl bg-red-100/70 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {passwordError}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Senha Atual *
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 neu-input text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                Nova Senha (mínimo 6 caracteres) *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 neu-input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                Confirmar Nova Senha *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 neu-input text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-300/40">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-5 py-2.5 text-sm font-bold text-white neu-btn-primary disabled:opacity-50"
            >
              {isChangingPassword ? 'Alterando...' : 'Alterar Senha'}
            </button>
          </div>
        </form>
      </div>

      {/* Cartão de Integração com Google Agenda (Calendar) */}
      <div className="neu-panel p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-300/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Google Agenda (Mobile & Alertas)
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Sincronize visitas médicas com o calendário no celular de cada facilitador
              </p>
            </div>
          </div>

          {calendarStatus?.connected ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Conectado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
              Desconectado
            </span>
          )}
        </div>

        {calendarMessage && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              calendarMessage.type === 'success'
                ? 'bg-emerald-100/70 border-emerald-200 text-emerald-800'
                : calendarMessage.type === 'error'
                ? 'bg-red-100/70 border-red-200 text-red-700'
                : 'bg-blue-100/70 border-blue-200 text-blue-800'
            }`}
          >
            {calendarMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : calendarMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <RefreshCw className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{calendarMessage.text}</span>
          </div>
        )}

        {/* Vantagens e Recursos do Google Calendar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-100/70 border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Smartphone className="w-4 h-4 text-brand-600" />
              Direto no Celular
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Visitas criadas ou atribuídas a você no Quadro aparecem no app Google Agenda (Android/iOS).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100/70 border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Bell className="w-4 h-4 text-amber-600" />
              Lembretes Automáticos
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Alertas sonoros e pop-up disparados 24h e 2h antes de cada compromisso médico.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100/70 border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              Protocolo COLIH
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Inclui dados do médico, hospital, endereço e checklist com as 4 etapas protocolares.
            </p>
          </div>
        </div>

        {/* Estado: Não Configurado no Backend */}
        {calendarStatus && !calendarStatus.isConfigured && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
            <div className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              Configuração Pendente de Credenciais OAuth
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              O administrador do sistema precisa adicionar as variáveis <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">GOOGLE_CLIENT_ID</code> e <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">GOOGLE_CLIENT_SECRET</code> no arquivo <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">.env</code> do servidor para habilitar a conexão OAuth 2.0.
            </p>
          </div>
        )}

        {/* Estado: Conectado */}
        {calendarStatus?.connected ? (
          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-emerald-900">
                  Conta Google Vinculada:
                </p>
                <p className="text-sm font-semibold text-emerald-800">
                  {calendarStatus.email || user?.email || 'Conta Google'}
                </p>
                <p className="text-[11px] text-emerald-600 mt-0.5">
                  ✓ Sincronização bidirecional ativa para cartões de visita designados.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchCalendarStatus}
                  disabled={isLoadingCalendar}
                  className="px-3 py-2 rounded-xl text-xs font-bold neu-btn text-slate-700 flex items-center gap-1.5"
                  title="Atualizar status"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCalendar ? 'animate-spin' : ''}`} />
                  Atualizar
                </button>

                <button
                  type="button"
                  onClick={handleDisconnectCalendar}
                  disabled={isDisconnectingCalendar}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-white text-rose-700 border border-rose-200 hover:bg-rose-50 transition-colors flex items-center gap-1.5"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  {isDisconnectingCalendar ? 'Desconectando...' : 'Desconectar'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Estado: Desconectado */
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs text-slate-500 font-medium">
              Conecte sua conta Google uma única vez para receber suas visitas diretamente no seu smartphone.
            </p>

            <button
              type="button"
              onClick={handleConnectCalendar}
              disabled={isConnectingCalendar || (calendarStatus !== null && !calendarStatus.isConfigured)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-md transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isConnectingCalendar ? 'Iniciando Conexão...' : 'Conectar com Google Agenda'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
