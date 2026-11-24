import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'frequencia',
    question: 'Qual é a frequência das sessões e quanto tempo dura cada encontro?',
    answer:
      'As sessões têm duração de 50 minutos e acontecem, na maioria dos casos, uma vez por semana, no mesmo dia e horário combinados. Essa regularidade favorece a continuidade do trabalho clínico. Conforme os objetivos avançam, avaliamos juntos o espaçamento para quinzenal.',
  },
  {
    id: 'online',
    question: 'O atendimento online tem a mesma eficácia que o presencial?',
    answer:
      'Sim. A psicoterapia online é regulamentada pelo Conselho Federal de Psicologia (CFP) e apresenta resultados equivalentes ao atendimento presencial na Terapia Cognitivo-Comportamental. Realizamos as sessões por plataforma segura com vídeo e áudio criptografados, bastando um local reservado e conexão estável.',
  },
  {
    id: 'reembolso',
    question: 'Atende por convênio médico ou emite recibo para reembolso?',
    answer:
      'Os atendimentos são realizados na modalidade particular. Emito nota fiscal e recibo com CRP para que você solicite reembolso junto ao seu plano de saúde, caso sua apólice conte com essa cobertura.',
  },
  {
    id: 'fe',
    question: 'A fé e a espiritualidade podem fazer parte do acompanhamento psicológico?',
    answer:
      'Sim, sempre que você desejar. A psicoterapia segue rigorosamente a ética profissional e métodos baseados em evidências, acolhendo a sua fé como uma dimensão importante da sua história, fonte de esperança, consolo e sentido de vida — sem imposições e com total respeito ao seu momento.',
  },
  {
    id: 'sigilo',
    question: 'Como funciona o sigilo profissional durante a terapia?',
    answer:
      'Todo conteúdo compartilhado antes, durante e após as sessões é estritamente protegido pelo Código de Ética Profissional do Psicólogo. Nenhuma informação pessoal ou registro clínico é compartilhado com terceiros sem sua autorização expressa.',
  },
];

export function FaqSection() {
  const [openId, setOpenId] = useState<string | null>('frequencia');

  const toggleItem = (id: string) => {
    setOpenId((current) => (current === id ? null : id));
  };

  return (
    <section id="duvidas" className="py-16 md:py-24 border-b border-stone-200/80">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          <div className="lg:col-span-4 space-y-3">
            <p className="text-xs font-medium text-[#525854]">
              Orientações práticas
            </p>
            <h2 className="font-display text-3xl md:text-[34px] font-normal text-[#1C1F1D] leading-[1.2] tracking-[-0.015em] [text-wrap:balance]">
              Dúvidas frequentes antes de começar.
            </h2>
            <p className="text-sm text-[#525854] leading-[1.65]">
              Informações objetivas sobre formato, duração, reembolso e ética no acompanhamento.
            </p>
          </div>

          <div className="lg:col-span-8 divide-y divide-stone-200 border-t border-b border-stone-200">
            {FAQ_ITEMS.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div key={item.id}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => toggleItem(item.id)}
                    className="w-full py-5 flex items-center justify-between gap-6 text-left cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4E43] rounded-sm"
                  >
                    <span className="text-base md:text-[17px] font-medium text-[#1C1F1D] group-hover:text-[#1F4E43] transition-colors">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#525854] shrink-0 transition-transform duration-150 ${
                        isOpen ? 'rotate-180 text-[#1F4E43]' : ''
                      }`}
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  </button>

                  {isOpen && (
                    <div className="pb-6 pr-8 text-[15px] text-[#525854] leading-[1.7]">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
