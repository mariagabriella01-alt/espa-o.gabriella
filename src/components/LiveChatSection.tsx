import { useEffect, useState, type FormEvent } from 'react';
import { Send, PhoneCall, AlertCircle } from 'lucide-react';
import {
  TOPIC_OPTIONS,
  fetchPatientChat,
  sendPatientMessage,
  startPatientChat,
  type PatientRecord,
} from '../data/patientsStore';

interface LiveChatSectionProps {
  activeChat: { patient: PatientRecord; token: string } | null;
  onChatStarted: (session: { patient: PatientRecord; token: string }) => void;
  onChatUpdated: (patient: PatientRecord) => void;
  onClearChat: () => void;
  onOpenQueue: () => void;
}

export function LiveChatSection({
  activeChat,
  onChatStarted,
  onChatUpdated,
  onClearChat,
  onOpenQueue,
}: LiveChatSectionProps) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [topic, setTopic] = useState(TOPIC_OPTIONS[0]);
  const [firstMessage, setFirstMessage] = useState('');
  const [replyText, setReplyText] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!activeChat) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetchPatientChat(
          activeChat.patient.id,
          activeChat.token
        );
        if (!cancelled) {
          onChatUpdated(res.patient);
        }
      } catch {
        // silent poll retry
      }
    };

    const timer = window.setInterval(poll, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [activeChat?.patient.id, activeChat?.token, onChatUpdated]);

  const handleStart = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedMessage = firstMessage.trim();
    if (trimmedMessage.length < 3) {
      setError('Escreva uma breve mensagem para iniciar sua conversa de acolhimento.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const result = await startPatientChat({
        name: name.trim() || 'Visitante em acolhimento',
        contact: contact.trim() || 'Chat direto no site',
        topic,
        initialMessage: trimmedMessage,
      });
      onChatStarted({
        patient: result.patient,
        token: result.patientAccessToken,
      });
      setFirstMessage('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Não foi possível iniciar a conversa.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeChat) return;
    const trimmed = replyText.trim();
    if (!trimmed) return;

    setError('');
    setSubmitting(true);
    try {
      const result = await sendPatientMessage(
        activeChat.patient.id,
        activeChat.token,
        trimmed
      );
      onChatUpdated(result.patient);
      setReplyText('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Não foi possível enviar sua mensagem.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="conversar-agora"
      className="py-16 md:py-24 bg-[#EFEFEA] border-b border-stone-200/80"
    >
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          <div className="lg:col-span-5 space-y-5">
            <p className="text-xs font-medium text-[#525854]">
              Acolhimento imediato · Chat direto
            </p>
            <h2 className="font-display text-3xl md:text-[36px] font-normal text-[#1C1F1D] leading-[1.18] tracking-[-0.015em] [text-wrap:balance]">
              Converse agora sobre o que você está vivendo.
            </h2>
            <p className="text-[15px] text-[#525854] leading-[1.7]">
              Você não precisa esperar tudo piorar para pedir ajuda. Escreva aqui o que está pesando no coração — seja tristeza, exclusão, conflitos em amizades, pressão no trabalho ou dúvidas sobre a sua saúde mental. Sua mensagem vai direto para a fila de atendimento da Dra. Gabriella.
            </p>

            <div className="pt-4 border-t border-stone-300/70 space-y-3">
              <p className="text-xs text-[#525854] leading-[1.6]">
                Em caso de crise imediata ou risco à sua vida, ligue gratuitamente para o atendimento 24 horas do CVV.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="tel:188"
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-[#1C1F1D] bg-white border border-stone-200 hover:border-stone-300 rounded-lg transition-colors whitespace-nowrap shrink-0 tabular-nums"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-[#1F4E43]" aria-hidden="true" />
                  <span>CVV 188 (24 horas)</span>
                </a>

                <button
                  type="button"
                  onClick={onOpenQueue}
                  className="text-xs font-semibold text-[#1F4E43] hover:text-[#173B32] underline underline-offset-4 cursor-pointer whitespace-nowrap shrink-0"
                >
                  Acesso da Dra. Gabriella (Pacientes)
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              {activeChat ? (
                <div className="flex flex-col">
                  <div className="px-6 py-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-4 bg-[#F8F8F6]">
                    <div>
                      <p className="text-sm font-semibold text-[#1C1F1D]">
                        Conversa ativa · {activeChat.patient.name}
                      </p>
                      <p className="text-xs text-[#525854] mt-0.5">
                        <span>{activeChat.patient.topic}</span>
                        <span aria-hidden="true" className="mx-1.5">·</span>
                        <span>
                          {activeChat.patient.status === 'aguardando'
                            ? 'Aguardando resposta da Dra. Gabriella'
                            : activeChat.patient.status === 'em-atendimento'
                            ? 'Em atendimento pela Dra. Gabriella'
                            : 'Atendimento concluído'}
                        </span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={onClearChat}
                      className="px-3 py-1.5 text-xs font-medium text-[#525854] hover:text-[#1C1F1D] bg-white border border-stone-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Nova conversa
                    </button>
                  </div>

                  <div className="p-6 space-y-4 max-h-[340px] overflow-y-auto bg-white">
                    {activeChat.patient.messages.map((msg) => {
                      const isPatient = msg.sender === 'paciente';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${
                            isPatient ? 'items-end' : 'items-start'
                          }`}
                        >
                          <div
                            className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-[1.6] ${
                              isPatient
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

                  {error && (
                    <p className="px-6 py-2 flex items-center gap-1.5 text-xs text-red-700 bg-red-50 border-t border-red-200">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{error}</span>
                    </p>
                  )}

                  <form
                    onSubmit={handleContinue}
                    className="p-4 border-t border-stone-200 bg-[#F8F8F6] flex items-center gap-3"
                  >
                    <label htmlFor="live-chat-reply" className="sr-only">
                      Escreva sua mensagem
                    </label>
                    <input
                      id="live-chat-reply"
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Escreva mais sobre como você está se sentindo..."
                      className="flex-1 px-3.5 py-2.5 text-sm text-[#1C1F1D] bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E43]"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#1F4E43] hover:bg-[#173B32] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>{submitting ? 'Enviando...' : 'Enviar'}</span>
                      <Send className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </form>
                </div>
              ) : (
                <form onSubmit={handleStart} className="p-6 sm:p-8 space-y-5">
                  <div className="space-y-1">
                    <h3 className="font-display text-xl font-normal text-[#1C1F1D]">
                      Iniciar conversa agora
                    </h3>
                    <p className="text-xs text-[#525854]">
                      Escolha o assunto principal e conte em poucas palavras como podemos ajudar.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="block text-xs font-medium text-[#1C1F1D]">
                      Sobre o que você gostaria de falar?
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {TOPIC_OPTIONS.map((item) => {
                        const isSelected = topic === item;
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setTopic(item)}
                            aria-pressed={isSelected}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                              isSelected
                                ? 'bg-[#1F4E43] border-[#1F4E43] text-white'
                                : 'bg-[#F8F8F6] border-stone-200 text-[#525854] hover:text-[#1C1F1D]'
                            }`}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="chat-name" className="block text-xs font-medium text-[#1C1F1D]">
                        Seu nome <span className="font-normal text-[#525854]">(ou apelido)</span>
                      </label>
                      <input
                        id="chat-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Como prefere ser chamado"
                        className="w-full px-3.5 py-2.5 text-sm text-[#1C1F1D] bg-[#F8F8F6] border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1F4E43]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="chat-contact" className="block text-xs font-medium text-[#1C1F1D]">
                        WhatsApp ou E-mail <span className="font-normal text-[#525854]">(opcional)</span>
                      </label>
                      <input
                        id="chat-contact"
                        type="text"
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        placeholder="Para retorno se precisar sair"
                        className="w-full px-3.5 py-2.5 text-sm text-[#1C1F1D] bg-[#F8F8F6] border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1F4E43]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="chat-initial-message" className="block text-xs font-medium text-[#1C1F1D]">
                      Sua mensagem agora
                    </label>
                    <textarea
                      id="chat-initial-message"
                      rows={3}
                      value={firstMessage}
                      onChange={(e) => {
                        setFirstMessage(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="Escreva livremente o que está sentindo neste momento..."
                      aria-invalid={Boolean(error)}
                      className={`w-full px-3.5 py-2.5 text-sm text-[#1C1F1D] bg-[#F8F8F6] rounded-lg border focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1F4E43] resize-y ${
                        error ? 'border-red-700' : 'border-stone-200'
                      }`}
                    />
                    {error && (
                      <p className="flex items-center gap-1.5 text-xs text-red-700 pt-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>{error}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#1F4E43] hover:bg-[#173B32] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>{submitting ? 'Enviando...' : 'Iniciar conversa agora'}</span>
                      <Send className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <span className="text-xs text-[#525854]">
                      Conversa privada entre você e a clínica
                    </span>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
