import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { createBookingRequest } from '../data/patientsStore';

type Modality = 'presencial' | 'online';
type TimePeriod = 'manha' | 'tarde' | 'noite';

interface BookingSectionProps {
  selectedTopic: string;
  focusTrigger: number;
  onBookingCreated: () => void;
}

interface FormErrors {
  name?: string;
  contact?: string;
  submit?: string;
}

const MODALITY_OPTIONS: { id: Modality; label: 'Presencial' | 'Online'; detail: string }[] = [
  { id: 'presencial', label: 'Presencial', detail: 'Jardins, São Paulo' },
  { id: 'online', label: 'Online', detail: 'Videochamada criptografada' },
];

const PERIOD_OPTIONS: { id: TimePeriod; label: string }[] = [
  { id: 'manha', label: 'Manhã (08h–12h)' },
  { id: 'tarde', label: 'Tarde (13h–17h)' },
  { id: 'noite', label: 'Noite (18h–20h)' },
];

export function BookingSection({
  selectedTopic,
  focusTrigger,
  onBookingCreated,
}: BookingSectionProps) {
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [modality, setModality] = useState<Modality>('online');
  const [period, setPeriod] = useState<TimePeriod>('tarde');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (selectedTopic) {
      setMessage(`Gostaria de conversar sobre: ${selectedTopic}.`);
      setSubmitted(false);
    }
  }, [selectedTopic]);

  useEffect(() => {
    if (focusTrigger > 0) {
      nameInputRef.current?.focus();
    }
  }, [focusTrigger]);

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};
    const trimmedName = name.trim();
    const trimmedContact = contact.trim();

    if (trimmedName.length < 2) {
      nextErrors.name = 'Informe seu nome para que eu possa responder pelo seu contato.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const digitsOnly = trimmedContact.replace(/\D/g, '');
    const isPhone = digitsOnly.length >= 10 && digitsOnly.length <= 13;

    if (!trimmedContact) {
      nextErrors.contact = 'Informe um WhatsApp com DDD ou um endereço de e-mail válido.';
    } else if (!emailRegex.test(trimmedContact) && !isPhone) {
      nextErrors.contact = 'Formato inválido. Digite um e-mail (ex: nome@email.com) ou WhatsApp com DDD.';
    }

    return nextErrors;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const selectedModalityLabel =
      MODALITY_OPTIONS.find((m) => m.id === modality)?.label ?? 'Online';
    const selectedPeriodLabel =
      PERIOD_OPTIONS.find((p) => p.id === period)?.label ?? 'Tarde (13h–17h)';

    setSubmitting(true);
    try {
      await createBookingRequest({
        name: name.trim(),
        contact: contact.trim(),
        modality: selectedModalityLabel,
        period: selectedPeriodLabel,
        topic: selectedTopic || 'Agendamento de sessão',
        message: message.trim(),
      });
      onBookingCreated();
      setSubmitted(true);
    } catch (err) {
      setErrors({
        submit:
          err instanceof Error
            ? err.message
            : 'Não foi possível enviar sua solicitação.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const modalityLabel = MODALITY_OPTIONS.find((m) => m.id === modality)?.label ?? 'Online';
  const periodLabel = PERIOD_OPTIONS.find((p) => p.id === period)?.label ?? 'Tarde';

  return (
    <section id="agendamento" className="py-16 md:py-24">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          <div className="lg:col-span-5 space-y-5">
            <p className="text-xs font-medium text-[#525854]">
              Agendamento inicial
            </p>
            <h2 className="font-display text-3xl md:text-[36px] font-normal text-[#1C1F1D] leading-[1.18] tracking-[-0.015em] [text-wrap:balance]">
              Solicite uma conversa para alinhar disponibilidade.
            </h2>
            <p className="text-[15px] text-[#525854] leading-[1.7]">
              Envie sua preferência de modalidade e turno. Respondo pessoalmente em até 1 dia útil com as opções de horários abertos na semana e informações sobre valores.
            </p>

            <div className="pt-4 border-t border-stone-200/80 space-y-2 text-sm text-[#525854]">
              <p>
                <span className="font-medium text-[#1C1F1D]">E-mail direto:</span>{' '}
                contato@dragabriella.psc.br
              </p>
              <p className="tabular-nums">
                <span className="font-medium text-[#1C1F1D]">WhatsApp da clínica:</span>{' '}
                (11) 98412-3090
              </p>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-white border border-stone-200 rounded-xl p-6 sm:p-8 md:p-10">
              {submitted ? (
                <div className="space-y-6 py-4" role="status" aria-live="polite">
                  <div className="flex items-start gap-3">
                    <CheckCircle2
                      className="w-6 h-6 text-[#1F4E43] shrink-0 mt-0.5"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <div className="space-y-2">
                      <h3 className="font-display text-2xl font-normal text-[#1C1F1D]">
                        Solicitação registrada, {name.trim().split(' ')[0]}.
                      </h3>
                      <p className="text-[15px] text-[#525854] leading-[1.65]">
                        Recebi seu interesse para atendimento <strong className="font-medium text-[#1C1F1D]">{modalityLabel}</strong> no período da <strong className="font-medium text-[#1C1F1D]">{periodLabel}</strong>. Retornarei pelo contato <span className="font-medium text-[#1C1F1D]">{contact}</span> em até 1 dia útil com os horários disponíveis.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-stone-200/80 flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setSubmitted(false)}
                      className="px-4 py-2 text-sm font-medium text-[#1C1F1D] bg-[#EFEFEA] hover:bg-stone-200/80 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4E43]"
                    >
                      Editar informações
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setName('');
                        setContact('');
                        setMessage('');
                        setErrors({});
                        setSubmitted(false);
                      }}
                      className="text-sm font-medium text-[#525854] hover:text-[#1C1F1D] underline underline-offset-4 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Enviar nova solicitação
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-6">
                  <div className="space-y-2.5">
                    <span className="block text-sm font-medium text-[#1C1F1D]">
                      Modalidade de atendimento
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {MODALITY_OPTIONS.map((option) => {
                        const isSelected = modality === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setModality(option.id)}
                            aria-pressed={isSelected}
                            className={`text-left px-4 py-3 rounded-lg border transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4E43] ${
                              isSelected
                                ? 'border-[#1F4E43] bg-[#1F4E43]/[0.05]'
                                : 'border-stone-200 bg-white hover:border-stone-300'
                            }`}
                          >
                            <span className="block text-sm font-medium text-[#1C1F1D]">
                              {option.label}
                            </span>
                            <span className="block text-xs text-[#525854] mt-0.5">
                              {option.detail}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <span className="block text-sm font-medium text-[#1C1F1D]">
                      Preferência de turno
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {PERIOD_OPTIONS.map((option) => {
                        const isSelected = period === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setPeriod(option.id)}
                            aria-pressed={isSelected}
                            className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors duration-150 whitespace-nowrap shrink-0 tabular-nums cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4E43] ${
                              isSelected
                                ? 'border-[#1F4E43] bg-[#1F4E43] text-white'
                                : 'border-stone-200 bg-[#F8F8F6] text-[#525854] hover:text-[#1C1F1D] hover:border-stone-300'
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label htmlFor="booking-name" className="block text-sm font-medium text-[#1C1F1D]">
                        Nome completo
                      </label>
                      <input
                        ref={nameInputRef}
                        id="booking-name"
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                        }}
                        placeholder="Seu nome"
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby={errors.name ? 'booking-name-error' : undefined}
                        className={`w-full px-3.5 py-2.5 text-sm text-[#1C1F1D] bg-[#F8F8F6] rounded-lg border transition-colors focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1F4E43] ${
                          errors.name ? 'border-red-700' : 'border-stone-200'
                        }`}
                      />
                      {errors.name && (
                        <p id="booking-name-error" className="flex items-start gap-1.5 text-xs text-red-700 pt-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                          <span>{errors.name}</span>
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="booking-contact" className="block text-sm font-medium text-[#1C1F1D]">
                        WhatsApp ou E-mail
                      </label>
                      <input
                        id="booking-contact"
                        type="text"
                        value={contact}
                        onChange={(e) => {
                          setContact(e.target.value);
                          if (errors.contact) setErrors((prev) => ({ ...prev, contact: undefined }));
                        }}
                        placeholder="(11) 99999-9999 ou e-mail"
                        aria-invalid={Boolean(errors.contact)}
                        aria-describedby={errors.contact ? 'booking-contact-error' : undefined}
                        className={`w-full px-3.5 py-2.5 text-sm text-[#1C1F1D] bg-[#F8F8F6] rounded-lg border transition-colors focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1F4E43] ${
                          errors.contact ? 'border-red-700' : 'border-stone-200'
                        }`}
                      />
                      {errors.contact && (
                        <p id="booking-contact-error" className="flex items-start gap-1.5 text-xs text-red-700 pt-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                          <span>{errors.contact}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="booking-message" className="block text-sm font-medium text-[#1C1F1D]">
                      Breve contexto <span className="font-normal text-[#525854]">(opcional)</span>
                    </label>
                    <textarea
                      id="booking-message"
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Se desejar, conte brevemente o que motivou sua busca por atendimento neste momento."
                      className="w-full px-3.5 py-2.5 text-sm text-[#1C1F1D] bg-[#F8F8F6] rounded-lg border border-stone-200 transition-colors focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1F4E43] resize-y"
                    />
                  </div>

                  {errors.submit && (
                    <p className="flex items-start gap-1.5 text-xs text-red-700">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{errors.submit}</span>
                    </p>
                  )}

                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-3 text-sm font-medium text-white bg-[#1F4E43] hover:bg-[#173B32] disabled:opacity-60 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4E43] focus-visible:ring-offset-2"
                    >
                      {submitting ? 'Enviando solicitação...' : 'Solicitar horário'}
                    </button>
                    <p className="text-xs text-[#525854]">
                      Seus dados permanecem sob sigilo profissional.
                    </p>
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
