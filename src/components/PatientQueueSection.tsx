import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Lock,
  LogOut,
  MessageSquare,
  Search,
  Send,
  Trash2,
} from 'lucide-react';
import {
  deleteClinicPatientRecord,
  fetchClinicAuthStatus,
  fetchClinicPatients,
  loginClinic,
  logoutClinic,
  sendClinicReply,
  setupClinicPassword,
  updateClinicStatus,
  type ClinicAuthStatus,
  type PatientRecord,
  type PatientStatus,
} from '../data/patientsStore';

type FilterStatus = 'todos' | PatientStatus;

interface PatientQueueSectionProps {
  refreshSignal: number;
}

const STATUS_META: Record<
  PatientStatus,
  { label: string; textClass: string; Icon: typeof Clock }
> = {
  aguardando: {
    label: 'Aguardando',
    textClass: 'text-amber-800',
    Icon: Clock,
  },
  'em-atendimento': {
    label: 'Em atendimento',
    textClass: 'text-[#1F4E43]',
    Icon: MessageSquare,
  },
  concluido: {
    label: 'Atendido',
    textClass: 'text-[#525854]',
    Icon: CheckCircle2,
  },
};

export function PatientQueueSection({ refreshSignal }: PatientQueueSectionProps) {
  const [clinicToken, setClinicToken] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<ClinicAuthStatus | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [queueError, setQueueError] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [clinicMessage, setClinicMessage] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  const loadAuthStatus = useCallback(async (token: string | null) => {
    try {
      const status = await fetchClinicAuthStatus(token);
      setAuthStatus(status);
      if (!status.authenticated && token) {
        setClinicToken(null);
      }
    } catch {
      setAuthStatus({ configured: true, envConfigured: false, authenticated: false });
    }
  }, []);

  useEffect(() => {
    loadAuthStatus(clinicToken);
  }, [clinicToken, loadAuthStatus]);

  const loadPatients = useCallback(async () => {
    if (!clinicToken) return;
    try {
      const res = await fetchClinicPatients(clinicToken);
      setPatients(res.patients);
      setQueueError('');
      setSelectedPatientId((prev) => {
        if (prev && res.patients.some((p) => p.id === prev)) return prev;
        return res.patients[0]?.id ?? '';
      });
    } catch (err) {
      setQueueError(
        err instanceof Error
          ? err.message
          : 'Não foi possível atualizar a fila de pacientes.'
      );
    } finally {
      setLoadingPatients(false);
    }
  }, [clinicToken]);

  useEffect(() => {
    if (!clinicToken) return;
    setLoadingPatients(true);
    loadPatients();
    const timer = window.setInterval(loadPatients, 4000);
    return () => window.clearInterval(timer);
  }, [clinicToken, refreshSignal, loadPatients]);

  const handleFirstRunSetup = async (e: FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim().length < 6) {
      setAuthError('Escolha uma senha com pelo menos 6 caracteres.');
      return;
    }
    if (passwordInput !== confirmPasswordInput) {
      setAuthError('As senhas digitadas não coincidem.');
      return;
    }
    setAuthError('');
    setAuthSubmitting(true);
    try {
      const res = await setupClinicPassword(passwordInput.trim());
      setClinicToken(res.token);
      setPasswordInput('');
      setConfirmPasswordInput('');
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Erro ao configurar acesso.'
      );
      loadAuthStatus(null);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setAuthError('Digite a senha da clínica para acessar os atendimentos.');
      return;
    }
    setAuthError('');
    setAuthSubmitting(true);
    try {
      const res = await loginClinic(passwordInput.trim());
      setClinicToken(res.token);
      setPasswordInput('');
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Senha incorreta.'
      );
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    if (clinicToken) {
      await logoutClinic(clinicToken);
    }
    setClinicToken(null);
    setPatients([]);
    setSelectedPatientId('');
  };

  const counts = useMemo(() => {
    return {
      aguardando: patients.filter((p) => p.status === 'aguardando').length,
      emAtendimento: patients.filter((p) => p.status === 'em-atendimento').length,
      concluido: patients.filter((p) => p.status === 'concluido').length,
    };
  }, [patients]);

  const filteredPatients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return patients.filter((patient) => {
      const matchesStatus =
        statusFilter === 'todos' || patient.status === statusFilter;
      const matchesSearch =
        !q ||
        patient.name.toLowerCase().includes(q) ||
        patient.topic.toLowerCase().includes(q) ||
        patient.priorityNote.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [patients, statusFilter, searchQuery]);

  const activePatient =
    filteredPatients.find((p) => p.id === selectedPatientId) ??
    patients.find((p) => p.id === selectedPatientId) ??
    filteredPatients[0] ??
    null;

  const handleReplySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!clinicToken || !activePatient) return;
    const trimmed = clinicMessage.trim();
    if (!trimmed) return;

    setReplySubmitting(true);
    try {
      const res = await sendClinicReply(clinicToken, activePatient.id, trimmed);
      setPatients((prev) =>
        prev.map((p) => (p.id === res.patient.id ? res.patient : p))
      );
      setClinicMessage('');
    } catch (err) {
      setQueueError(
        err instanceof Error ? err.message : 'Erro ao enviar resposta.'
      );
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, status: PatientStatus) => {
    if (!clinicToken) return;
    try {
      const res = await updateClinicStatus(clinicToken, id, status);
      setPatients((prev) =>
        prev.map((p) => (p.id === res.patient.id ? res.patient : p))
      );
    } catch (err) {
      setQueueError(
        err instanceof Error ? err.message : 'Erro ao atualizar situação.'
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!clinicToken) return;
    try {
      await deleteClinicPatientRecord(clinicToken, id);
      setPatients((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setQueueError(
        err instanceof Error ? err.message : 'Erro ao remover registro.'
      );
    }
  };

  return (
    <section
      id="pacientes"
      className="py-16 md:py-24 border-b border-stone-200/80"
    >
      <div className="max-w-[1200px] mx-auto px-6 space-y-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <p className="text-xs font-medium text-[#525854]">
              Painel clínico da Dra. Gabriella · Sigilo protegido
            </p>
            <h2 className="font-display text-3xl md:text-[36px] font-normal text-[#1C1F1D] leading-[1.18] tracking-[-0.015em] [text-wrap:balance]">
              Pacientes para atender.
            </h2>
            <p className="text-[15px] text-[#525854] leading-[1.65]">
              Para proteger o sigilo psicológico de quem busca ajuda no site, a lista completa de pacientes e mensagens é acessível somente mediante senha da clínica.
            </p>
          </div>

          {clinicToken && (
            <div className="flex flex-wrap items-center gap-6 sm:gap-8 pt-2 border-t lg:border-t-0 border-stone-200">
              <div>
                <p className="font-display text-2xl font-medium text-amber-800 tabular-nums">
                  {String(counts.aguardando).padStart(2, '0')}
                </p>
                <p className="text-xs text-[#525854]">Aguardando</p>
              </div>
              <div>
                <p className="font-display text-2xl font-medium text-[#1F4E43] tabular-nums">
                  {String(counts.emAtendimento).padStart(2, '0')}
                </p>
                <p className="text-xs text-[#525854]">Em atendimento</p>
              </div>
              <div>
                <p className="font-display text-2xl font-medium text-[#1C1F1D] tabular-nums">
                  {String(counts.concluido).padStart(2, '0')}
                </p>
                <p className="text-xs text-[#525854]">Atendidos</p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#525854] hover:text-[#1C1F1D] bg-white border border-stone-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Sair do painel</span>
              </button>
            </div>
          )}
        </div>

        {!clinicToken ? (
          <div className="max-w-lg bg-white border border-stone-200 rounded-xl p-6 sm:p-8 space-y-6">
            {authStatus && !authStatus.configured ? (
              <form onSubmit={handleFirstRunSetup} className="space-y-5">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-[#1F4E43] shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="space-y-1">
                    <h3 className="font-display text-xl font-normal text-[#1C1F1D]">
                      Configurar senha da Dra. Gabriella
                    </h3>
                    <p className="text-xs text-[#525854] leading-[1.6]">
                      Como é o primeiro acesso do site, defina uma senha para proteger a fila de pacientes e começar a responder às conversas.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label htmlFor="setup-pass" className="block text-xs font-medium text-[#1C1F1D]">
                      Criar senha do painel (mínimo 6 caracteres)
                    </label>
                    <input
                      id="setup-pass"
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Digite a nova senha"
                      className="w-full px-3.5 py-2.5 text-sm text-[#1C1F1D] bg-[#F8F8F6] border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1F4E43]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="setup-pass-confirm" className="block text-xs font-medium text-[#1C1F1D]">
                      Confirmar senha
                    </label>
                    <input
                      id="setup-pass-confirm"
                      type="password"
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      placeholder="Repita a senha"
                      className="w-full px-3.5 py-2.5 text-sm text-[#1C1F1D] bg-[#F8F8F6] border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1F4E43]"
                    />
                  </div>
                </div>

                {authError && (
                  <p className="flex items-center gap-1.5 text-xs text-red-700">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{authError}</span>
                  </p>
                )}

                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-[#1F4E43] hover:bg-[#173B32] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {authSubmitting ? 'Salvando...' : 'Salvar senha e abrir atendimentos'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-[#1F4E43] shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="space-y-1">
                    <h3 className="font-display text-xl font-normal text-[#1C1F1D]">
                      Entrar no painel de atendimento
                    </h3>
                    <p className="text-xs text-[#525854] leading-[1.6]">
                      Área exclusiva da Dra. Gabriella para visualizar pacientes aguardando e responder mensagens em tempo real.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="clinic-pass" className="block text-xs font-medium text-[#1C1F1D]">
                    Senha da clínica
                  </label>
                  <input
                    id="clinic-pass"
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Digite sua senha de acesso"
                    className="w-full px-3.5 py-2.5 text-sm text-[#1C1F1D] bg-[#F8F8F6] border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1F4E43]"
                  />
                </div>

                {authError && (
                  <p className="flex items-center gap-1.5 text-xs text-red-700">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{authError}</span>
                  </p>
                )}

                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-[#1F4E43] hover:bg-[#173B32] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {authSubmitting ? 'Verificando...' : 'Entrar e ver pacientes'}
                </button>
              </form>
            )}
          </div>
        ) : (
          <>
            {queueError && (
              <p className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{queueError}</span>
              </p>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div
                role="tablist"
                aria-label="Filtrar pacientes por situação"
                className="flex flex-wrap items-center gap-1.5 p-1 bg-[#EFEFEA] rounded-lg border border-stone-200/80"
              >
                {(
                  [
                    { id: 'todos', label: `Todos (${patients.length})` },
                    { id: 'aguardando', label: `Aguardando (${counts.aguardando})` },
                    {
                      id: 'em-atendimento',
                      label: `Em atendimento (${counts.emAtendimento})`,
                    },
                    { id: 'concluido', label: `Atendidos (${counts.concluido})` },
                  ] as { id: FilterStatus; label: string }[]
                ).map((tab) => {
                  const isActive = statusFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setStatusFilter(tab.id)}
                      className={`px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 tabular-nums cursor-pointer ${
                        isActive
                          ? 'bg-white text-[#1C1F1D] shadow-xs'
                          : 'text-[#525854] hover:text-[#1C1F1D]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="relative w-full md:w-72">
                <Search
                  className="w-4 h-4 text-[#525854] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar paciente ou tema..."
                  aria-label="Buscar paciente ou tema"
                  className="w-full pl-9 pr-3.5 py-2 text-sm text-[#1C1F1D] bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E43]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-5 bg-white border border-stone-200 rounded-xl overflow-hidden flex flex-col">
                <div className="px-5 py-3.5 border-b border-stone-200 bg-[#F8F8F6] flex items-center justify-between text-xs font-medium text-[#525854]">
                  <span>Fila de atendimento</span>
                  <span className="tabular-nums">
                    {filteredPatients.length}{' '}
                    {filteredPatients.length === 1 ? 'registro' : 'registros'}
                  </span>
                </div>

                {loadingPatients && patients.length === 0 ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3].map((row) => (
                      <div key={row} className="h-16 bg-[#EFEFEA] rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : filteredPatients.length === 0 ? (
                  <div className="p-8 text-center space-y-3 my-auto">
                    <p className="text-sm font-medium text-[#1C1F1D]">
                      Nenhum paciente encontrado neste filtro.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter('todos');
                        setSearchQuery('');
                      }}
                      className="px-4 py-2 text-xs font-medium text-white bg-[#1F4E43] hover:bg-[#173B32] rounded-lg transition-colors cursor-pointer"
                    >
                      Mostrar todos os pacientes
                    </button>
                  </div>
                ) : (
                  <ul className="divide-y divide-stone-200 max-h-[520px] overflow-y-auto">
                    {filteredPatients.map((patient) => {
                      const isSelected = activePatient?.id === patient.id;
                      const meta = STATUS_META[patient.status];
                      const StatusIcon = meta.Icon;
                      const lastMsg = patient.messages[patient.messages.length - 1];

                      return (
                        <li key={patient.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedPatientId(patient.id)}
                            className={`w-full text-left px-5 py-4 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1F4E43] ${
                              isSelected ? 'bg-[#1F4E43]/[0.06]' : 'hover:bg-[#F8F8F6]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <span className="text-sm font-semibold text-[#1C1F1D] truncate">
                                {patient.name}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 text-xs font-medium shrink-0 ${meta.textClass}`}
                              >
                                <StatusIcon className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>{meta.label}</span>
                              </span>
                            </div>

                            <p className="text-xs text-[#525854] mt-1 truncate">
                              <span>{patient.topic}</span>
                              <span aria-hidden="true" className="mx-1.5">·</span>
                              <span>{patient.channel}</span>
                              <span aria-hidden="true" className="mx-1.5">·</span>
                              <span className="tabular-nums">{patient.arrivedAt}</span>
                            </p>

                            {lastMsg && (
                              <p className="text-xs text-[#525854] mt-2 line-clamp-1">
                                “{lastMsg.text}”
                              </p>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="lg:col-span-7 bg-white border border-stone-200 rounded-xl overflow-hidden flex flex-col">
                {activePatient ? (
                  <>
                    <div className="px-6 py-5 border-b border-stone-200 bg-[#F8F8F6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-xl font-normal text-[#1C1F1D]">
                            {activePatient.name}
                          </h3>
                          <span className="text-xs text-[#525854]">
                            · {activePatient.contact}
                          </span>
                        </div>
                        <p className="text-xs text-[#525854]">
                          <span>{activePatient.topic}</span>
                          <span aria-hidden="true" className="mx-1.5">·</span>
                          <span>{activePatient.channel}</span>
                          <span aria-hidden="true" className="mx-1.5">·</span>
                          <span>Turno: {activePatient.preferredPeriod}</span>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {activePatient.status !== 'em-atendimento' && (
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(activePatient.id, 'em-atendimento')
                            }
                            className="px-3.5 py-2 text-xs font-medium text-white bg-[#1F4E43] hover:bg-[#173B32] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            Iniciar atendimento
                          </button>
                        )}

                        {activePatient.status !== 'concluido' ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(activePatient.id, 'concluido')
                            }
                            className="px-3.5 py-2 text-xs font-medium text-[#1C1F1D] bg-white border border-stone-200 hover:border-stone-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            Concluir
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(activePatient.id, 'aguardando')
                            }
                            className="px-3.5 py-2 text-xs font-medium text-[#1C1F1D] bg-white border border-stone-200 hover:border-stone-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            Reabrir fila
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(activePatient.id)}
                          aria-label={`Remover registro de ${activePatient.name}`}
                          title="Remover registro"
                          className="p-2 text-[#525854] hover:text-red-700 bg-white border border-stone-200 hover:border-red-300 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <div className="px-6 py-3.5 border-b border-stone-200/70 bg-white text-xs text-[#525854]">
                      <span className="font-semibold text-[#1C1F1D]">Resumo: </span>
                      {activePatient.priorityNote}
                    </div>

                    <div className="flex-1 p-6 space-y-4 min-h-[240px] max-h-[320px] overflow-y-auto">
                      {activePatient.messages.map((msg) => {
                        const isClinic = msg.sender === 'clinica';
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${
                              isClinic ? 'items-end' : 'items-start'
                            }`}
                          >
                            <div
                              className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-[1.6] ${
                                isClinic
                                  ? 'bg-[#1F4E43] text-white'
                                  : 'bg-[#EFEFEA] text-[#1C1F1D] border border-stone-200'
                              }`}
                            >
                              <p className="text-[11px] opacity-80 mb-1 font-medium">
                                {msg.authorName} ·{' '}
                                <span className="tabular-nums">{msg.timestamp}</span>
                              </p>
                              <p>{msg.text}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <form
                      onSubmit={handleReplySubmit}
                      className="p-4 border-t border-stone-200 bg-[#F8F8F6] flex items-center gap-3"
                    >
                      <label htmlFor="clinic-reply-input" className="sr-only">
                        Responder ao paciente
                      </label>
                      <input
                        id="clinic-reply-input"
                        type="text"
                        value={clinicMessage}
                        onChange={(e) => setClinicMessage(e.target.value)}
                        placeholder={`Responder para ${activePatient.name.split(' ')[0]} como Dra. Gabriella...`}
                        className="flex-1 px-3.5 py-2.5 text-sm text-[#1C1F1D] bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E43]"
                      />
                      <button
                        type="submit"
                        disabled={replySubmitting}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#1F4E43] hover:bg-[#173B32] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <span>{replySubmitting ? 'Enviando...' : 'Enviar resposta'}</span>
                        <Send className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="p-10 text-center text-sm text-[#525854] my-auto">
                    Selecione um paciente na fila ao lado para visualizar a conversa e responder.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
